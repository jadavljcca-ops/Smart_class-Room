const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run, query } = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const {
    role,
    fullName,
    email,
    mobileNumber,
    department,
    semester,
    enrollmentNumber,
    employeeId,
    password
  } = req.body;

  if (!role || !fullName || !email || !mobileNumber || !department || !password) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  if (!/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
  }

  try {
    // Check if email already exists in any table
    const adminCheck = await get('SELECT id FROM admins WHERE email = ?', [email]);
    const facultyCheck = await get('SELECT id FROM faculty WHERE email = ?', [email]);
    const studentCheck = await get('SELECT id FROM students WHERE email = ?', [email]);
    const requestCheck = await get('SELECT id, status FROM registration_requests WHERE email = ?', [email]);

    if (adminCheck || facultyCheck || studentCheck) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    
    if (requestCheck) {
      if (requestCheck.status === 'Pending') {
        return res.status(400).json({ message: 'Your registration request is already pending approval.' });
      } else if (requestCheck.status === 'Rejected') {
        await run('DELETE FROM registration_requests WHERE email = ?', [email]);
      }
    }

    // Check unique employee_id/enrollment_number
    if (role === 'student') {
      if (!semester || !enrollmentNumber) {
        return res.status(400).json({ message: 'Semester and Enrollment Number are required for students.' });
      }
      if (!/^\d{10}$/.test(enrollmentNumber)) {
        return res.status(400).json({ message: 'Enrollment Number must be exactly 10 digits.' });
      }
      const enrollCheck = await get('SELECT id FROM students WHERE enrollment_number = ?', [enrollmentNumber]);
      const enrollReqCheck = await get('SELECT id, status FROM registration_requests WHERE enrollment_number = ?', [enrollmentNumber]);
      if (enrollCheck) {
        return res.status(400).json({ message: 'Enrollment Number already exists.' });
      }
      if (enrollReqCheck) {
        if (enrollReqCheck.status === 'Pending') {
          return res.status(400).json({ message: 'Enrollment Number is already pending approval.' });
        } else if (enrollReqCheck.status === 'Rejected') {
          await run('DELETE FROM registration_requests WHERE enrollment_number = ?', [enrollmentNumber]);
        }
      }
    } else if (role === 'faculty') {
      if (!employeeId) {
        return res.status(400).json({ message: 'Employee ID is required for faculty.' });
      }
      const empCheck = await get('SELECT id FROM faculty WHERE employee_id = ?', [employeeId]);
      const empReqCheck = await get('SELECT id, status FROM registration_requests WHERE employee_id = ?', [employeeId]);
      if (empCheck) {
        return res.status(400).json({ message: 'Employee ID already exists.' });
      }
      if (empReqCheck) {
        if (empReqCheck.status === 'Pending') {
          return res.status(400).json({ message: 'Employee ID is already pending approval.' });
        } else if (empReqCheck.status === 'Rejected') {
          await run('DELETE FROM registration_requests WHERE employee_id = ?', [employeeId]);
        }
      }
    } else {
      return res.status(400).json({ message: 'Invalid role selection.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Insert into registration_requests
    await run(
      `INSERT INTO registration_requests (
        role, full_name, email, mobile_number, department, semester, enrollment_number, employee_id, password_hash, raw_password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        role,
        fullName,
        email,
        mobileNumber,
        department,
        role === 'student' ? semester : null,
        role === 'student' ? enrollmentNumber : null,
        role === 'faculty' ? employeeId : null,
        passwordHash,
        password
      ]
    );

    // Notify admin
    await run(
      `INSERT INTO notifications (user_role, message) VALUES (?, ?)`,
      ['Admin', `New pending ${role} request from ${fullName} (${department})`]
    );

    return res.status(201).json({
      message: 'Your registration request has been sent to the Main Admin. You can log in only after approval.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'ID/Email and password are required.' });
  }

  try {
    // 1. Check Admin (usually login by email)
    const admin = await get('SELECT * FROM admins WHERE email = ?', [identifier]);
    if (admin) {
      const match = await bcrypt.compare(password, admin.password_hash);
      if (match) {
        const token = jwt.sign(
          { 
            id: admin.id, 
            email: admin.email, 
            role: 'admin', 
            adminRole: admin.role || 'sub_admin', 
            department: admin.department || null, 
            fullName: admin.full_name 
          },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
        return res.json({
          token,
          user: { 
            id: admin.id, 
            email: admin.email, 
            role: 'admin', 
            adminRole: admin.role || 'sub_admin', 
            department: admin.department || null, 
            fullName: admin.full_name 
          }
        });
      }
    }

    // 2. Check Faculty (login by employee_id or email)
    const faculty = await get('SELECT * FROM faculty WHERE employee_id = ? OR email = ?', [identifier, identifier]);
    if (faculty) {
      const match = await bcrypt.compare(password, faculty.password_hash);
      if (match) {
        if (faculty.status !== 'Approved') {
          return res.status(401).json({
            message: 'Your registration request has been sent to the Main Admin. You can log in only after approval.'
          });
        }
        const token = jwt.sign(
          {
            id: faculty.id,
            email: faculty.email,
            role: 'faculty',
            fullName: faculty.full_name,
            department: faculty.department,
            employeeId: faculty.employee_id
          },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
        return res.json({
          token,
          user: {
            id: faculty.id,
            email: faculty.email,
            role: 'faculty',
            fullName: faculty.full_name,
            department: faculty.department,
            employeeId: faculty.employee_id
          }
        });
      }
    }

    // 3. Check Student (login by enrollment_number or email)
    const student = await get('SELECT * FROM students WHERE enrollment_number = ? OR email = ?', [identifier, identifier]);
    if (student) {
      const match = await bcrypt.compare(password, student.password_hash);
      if (match) {
        if (student.status !== 'Approved') {
          return res.status(401).json({
            message: 'Your registration request has been sent to the Main Admin. You can log in only after approval.'
          });
        }
        const token = jwt.sign(
          {
            id: student.id,
            email: student.email,
            role: 'student',
            fullName: student.full_name,
            department: student.department,
            semester: student.semester,
            enrollmentNumber: student.enrollment_number,
            tokenVersion: student.token_version || 1
          },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
        return res.json({
          token,
          user: {
            id: student.id,
            email: student.email,
            role: 'student',
            fullName: student.full_name,
            department: student.department,
            semester: student.semester,
            enrollmentNumber: student.enrollment_number,
            tokenVersion: student.token_version || 1
          }
        });
      }
    }

    // 4. Check Registration Requests Table for Pending Status message specificity
    const request = await get('SELECT * FROM registration_requests WHERE email = ? OR enrollment_number = ? OR employee_id = ?', [identifier, identifier, identifier]);
    if (request) {
      const match = await bcrypt.compare(password, request.password_hash);
      if (match) {
        if (request.status === 'Pending') {
          return res.status(401).json({
            message: 'Your registration request has been sent to the Main Admin. You can log in only after approval.'
          });
        } else if (request.status === 'Rejected') {
          return res.status(401).json({
            message: 'Your registration request was rejected by the Main Admin.'
          });
        }
      }
    }

    return res.status(401).json({ message: 'Invalid email or password.' });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { id, role } = req.user;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old and new passwords are required.' });
  }

  try {
    let tableName = '';
    if (role === 'admin') tableName = 'admins';
    else if (role === 'faculty') tableName = 'faculty';
    else if (role === 'student') tableName = 'students';
    else return res.status(400).json({ message: 'Invalid token role.' });

    const user = await get(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const match = await bcrypt.compare(oldPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await run(`UPDATE ${tableName} SET password_hash = ?, raw_password = ? WHERE id = ?`, [newHash, newPassword, id]);

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/auth/departments
router.get('/departments', async (req, res) => {
  try {
    const list = await query("SELECT name FROM departments ORDER BY name ASC");
    const depts = list.map(item => item.name);
    res.json(depts);
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;

