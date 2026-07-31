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

  try {
    // Check if email already exists in any table
    const adminCheck = await get('SELECT id FROM admins WHERE email = ?', [email]);
    const facultyCheck = await get('SELECT id FROM faculty WHERE email = ?', [email]);
    const studentCheck = await get('SELECT id FROM students WHERE email = ?', [email]);
    const requestCheck = await get('SELECT id FROM registration_requests WHERE email = ?', [email]);

    if (adminCheck || facultyCheck || studentCheck || requestCheck) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Check unique employee_id/enrollment_number
    if (role === 'student') {
      if (!semester || !enrollmentNumber) {
        return res.status(400).json({ message: 'Semester and Enrollment Number are required for students.' });
      }
      const enrollCheck = await get('SELECT id FROM students WHERE enrollment_number = ?', [enrollmentNumber]);
      const enrollReqCheck = await get('SELECT id FROM registration_requests WHERE enrollment_number = ?', [enrollmentNumber]);
      if (enrollCheck || enrollReqCheck) {
        return res.status(400).json({ message: 'Enrollment Number already exists.' });
      }
    } else if (role === 'faculty') {
      if (!employeeId) {
        return res.status(400).json({ message: 'Employee ID is required for faculty.' });
      }
      const empCheck = await get('SELECT id FROM faculty WHERE employee_id = ?', [employeeId]);
      const empReqCheck = await get('SELECT id FROM registration_requests WHERE employee_id = ?', [employeeId]);
      if (empCheck || empReqCheck) {
        return res.status(400).json({ message: 'Employee ID already exists.' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid role selection.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Insert into registration_requests
    await run(
      `INSERT INTO registration_requests (
        role, full_name, email, mobile_number, department, semester, enrollment_number, employee_id, password_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        role,
        fullName,
        email,
        mobileNumber,
        department,
        role === 'student' ? semester : null,
        role === 'student' ? enrollmentNumber : null,
        role === 'faculty' ? employeeId : null,
        passwordHash
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 1. Check Admin
    const admin = await get('SELECT * FROM admins WHERE email = ?', [email]);
    if (admin) {
      const match = await bcrypt.compare(password, admin.password_hash);
      if (match) {
        const token = jwt.sign(
          { id: admin.id, email: admin.email, role: 'admin', fullName: admin.full_name },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
        return res.json({
          token,
          user: { id: admin.id, email: admin.email, role: 'admin', fullName: admin.full_name }
        });
      }
    }

    // 2. Check Faculty
    const faculty = await get('SELECT * FROM faculty WHERE email = ?', [email]);
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

    // 3. Check Student
    const student = await get('SELECT * FROM students WHERE email = ?', [email]);
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
            enrollmentNumber: student.enrollment_number
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
            enrollmentNumber: student.enrollment_number
          }
        });
      }
    }

    // 4. Check Registration Requests Table for Pending Status message specificity
    const request = await get('SELECT * FROM registration_requests WHERE email = ?', [email]);
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
    await run(`UPDATE ${tableName} SET password_hash = ? WHERE id = ?`, [newHash, id]);

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

