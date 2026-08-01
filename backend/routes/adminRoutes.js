const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query, run, get } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../utils/uploader');

// All routes here require Admin authentication
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const queryDept = req.query.department;
    const isMainAdmin = req.user.adminRole === 'main_admin' && !queryDept;
    const dept = queryDept || req.user.department;

    let studentsCount, facultyCount, pendingCount, announcementsCount, notesCount;
    let notesPerDept, studentsPerDept, requestStats;

    if (isMainAdmin) {
      studentsCount = await get("SELECT COUNT(*) as count FROM students WHERE status='Approved'");
      facultyCount = await get("SELECT COUNT(*) as count FROM faculty WHERE status='Approved'");
      pendingCount = await get("SELECT COUNT(*) as count FROM registration_requests WHERE status='Pending'");
      announcementsCount = await get("SELECT COUNT(*) as count FROM announcements");
      notesCount = await get("SELECT COUNT(*) as count FROM notes");

      notesPerDept = await query("SELECT department, COUNT(*) as count FROM notes GROUP BY department");
      studentsPerDept = await query("SELECT department, COUNT(*) as count FROM students GROUP BY department");
      requestStats = await query("SELECT status, COUNT(*) as count FROM registration_requests GROUP BY status");
    } else {
      studentsCount = await get("SELECT COUNT(*) as count FROM students WHERE status='Approved' AND department = ?", [dept]);
      facultyCount = await get("SELECT COUNT(*) as count FROM faculty WHERE status='Approved' AND department = ?", [dept]);
      pendingCount = await get("SELECT COUNT(*) as count FROM registration_requests WHERE status='Pending' AND department = ?", [dept]);
      announcementsCount = await get("SELECT COUNT(*) as count FROM announcements WHERE department = ? OR department = 'All'", [dept]);
      notesCount = await get("SELECT COUNT(*) as count FROM notes WHERE department = ?", [dept]);

      notesPerDept = await query("SELECT department, COUNT(*) as count FROM notes WHERE department = ? GROUP BY department", [dept]);
      studentsPerDept = await query("SELECT department, COUNT(*) as count FROM students WHERE department = ? GROUP BY department", [dept]);
      requestStats = await query("SELECT status, COUNT(*) as count FROM registration_requests WHERE department = ? GROUP BY status", [dept]);
    }

    res.json({
      totalStudents: studentsCount.count,
      totalFaculty: facultyCount.count,
      totalPendingRequests: pendingCount.count,
      totalAnnouncements: announcementsCount.count,
      totalNotes: notesCount.count,
      chartData: {
        notesPerDept,
        studentsPerDept,
        requestStats
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/admin/requests
router.get('/requests', async (req, res) => {
  try {
    let requests;
    const queryDept = req.query.department;
    if (req.user.adminRole === 'main_admin' && !queryDept) {
      requests = await query("SELECT id, role, full_name, email, mobile_number, department, semester, enrollment_number, employee_id, status, raw_password, created_at FROM registration_requests WHERE status='Pending' ORDER BY created_at DESC");
    } else {
      const dept = queryDept || req.user.department;
      requests = await query("SELECT id, role, full_name, email, mobile_number, department, semester, enrollment_number, employee_id, status, raw_password, created_at FROM registration_requests WHERE status='Pending' AND department = ? ORDER BY created_at DESC", [dept]);
    }
    res.json(requests);
  } catch (error) {
    console.error('Requests fetch error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/admin/requests/:id/action
router.post('/requests/:id/action', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'Accept', 'Reject', 'Delete'

  if (!['Accept', 'Reject', 'Delete'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action.' });
  }

  try {
    const request = await get("SELECT * FROM registration_requests WHERE id = ?", [id]);
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found.' });
    }

    if (req.user.adminRole !== 'main_admin' && request.department !== req.user.department) {
      return res.status(403).json({ message: 'Forbidden. You can only manage requests in your own department.' });
    }

    if (action === 'Accept') {
      const { role, full_name, email, mobile_number, department, semester, enrollment_number, employee_id, password_hash, raw_password } = request;

      if (role === 'student') {
        const result = await run(
          `INSERT INTO students (full_name, email, mobile_number, department, semester, enrollment_number, password_hash, raw_password, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Approved')`,
          [full_name, email, mobile_number, department, semester, enrollment_number, password_hash, raw_password]
        );
        // Create user-specific notification
        await run(
          `INSERT INTO notifications (user_role, user_id, message) VALUES (?, ?, ?)`,
          ['Student', result.id, 'Your registration request has been approved. You can now login.']
        );
      } else if (role === 'faculty') {
        const result = await run(
          `INSERT INTO faculty (full_name, email, mobile_number, department, employee_id, password_hash, raw_password, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved')`,
          [full_name, email, mobile_number, department, employee_id, password_hash, raw_password]
        );
        // Create user-specific notification
        await run(
          `INSERT INTO notifications (user_role, user_id, message) VALUES (?, ?, ?)`,
          ['Faculty', result.id, 'Your registration request has been approved. You can now login and upload notes.']
        );
      }

      // Update request status to Accepted
      await run("UPDATE registration_requests SET status = 'Accepted' WHERE id = ?", [id]);
      res.json({ message: 'Registration request accepted successfully.' });

    } else if (action === 'Reject') {
      await run("UPDATE registration_requests SET status = 'Rejected' WHERE id = ?", [id]);
      res.json({ message: 'Registration request rejected successfully.' });

    } else if (action === 'Delete') {
      await run("DELETE FROM registration_requests WHERE id = ?", [id]);
      res.json({ message: 'Registration request deleted successfully.' });
    }

  } catch (error) {
    console.error('Request action error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/admin/faculty
router.get('/faculty', async (req, res) => {
  try {
    let faculty;
    const queryDept = req.query.department;
    if (req.user.adminRole === 'main_admin' && !queryDept) {
      faculty = await query("SELECT id, full_name, email, mobile_number, department, employee_id, status, raw_password, created_at FROM faculty ORDER BY full_name ASC");
    } else {
      const dept = queryDept || req.user.department;
      faculty = await query("SELECT id, full_name, email, mobile_number, department, employee_id, status, raw_password, created_at FROM faculty WHERE department = ? ORDER BY full_name ASC", [dept]);
    }
    res.json(faculty);
  } catch (error) {
    console.error('Faculty fetch error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/admin/faculty (Add Faculty directly)
router.post('/faculty', async (req, res) => {
  let { fullName, email, mobileNumber, department, employeeId, password } = req.body;

  if (req.user.adminRole !== 'main_admin') {
    department = req.user.department; // Force their own department
  }

  if (!fullName || !email || !mobileNumber || !department || !employeeId || !password) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    const adminCheck = await get('SELECT id FROM admins WHERE email = ?', [email]);
    const facultyCheck = await get('SELECT id FROM faculty WHERE email = ?', [email]);
    const studentCheck = await get('SELECT id FROM students WHERE email = ?', [email]);
    const requestCheck = await get('SELECT id FROM registration_requests WHERE email = ?', [email]);

    if (adminCheck || facultyCheck || studentCheck || requestCheck) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const empCheck = await get('SELECT id FROM faculty WHERE employee_id = ?', [employeeId]);
    if (empCheck) {
      return res.status(400).json({ message: 'Employee ID already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    await run(
      `INSERT INTO faculty (full_name, email, mobile_number, department, employee_id, password_hash, raw_password, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved')`,
      [fullName, email, mobileNumber, department, employeeId, hash, password]
    );

    res.status(201).json({ message: 'Faculty added successfully.' });
  } catch (error) {
    console.error('Add faculty error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT /api/admin/faculty/:id
router.put('/faculty/:id', async (req, res) => {
  const { id } = req.params;
  let { fullName, email, mobileNumber, department, employeeId } = req.body;

  if (req.user.adminRole !== 'main_admin') {
    const existingFaculty = await get('SELECT id, department FROM faculty WHERE id = ?', [id]);
    if (!existingFaculty || existingFaculty.department !== req.user.department) {
      return res.status(403).json({ message: 'Forbidden. You can only manage faculty in your own department.' });
    }
    department = req.user.department; // Force their own department
  }

  if (!fullName || !email || !mobileNumber || !department || !employeeId) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    const emailCheck = await get('SELECT id FROM faculty WHERE email = ? AND id != ?', [email, id]);
    if (emailCheck) {
      return res.status(400).json({ message: 'Email is already taken by another user.' });
    }

    const empCheck = await get('SELECT id FROM faculty WHERE employee_id = ? AND id != ?', [employeeId, id]);
    if (empCheck) {
      return res.status(400).json({ message: 'Employee ID is already taken.' });
    }

    await run(
      `UPDATE faculty SET full_name = ?, email = ?, mobile_number = ?, department = ?, employee_id = ? WHERE id = ?`,
      [fullName, email, mobileNumber, department, employeeId, id]
    );

    res.json({ message: 'Faculty updated successfully.' });
  } catch (error) {
    console.error('Update faculty error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/admin/faculty/:id
router.delete('/faculty/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.adminRole !== 'main_admin') {
      const existingFaculty = await get('SELECT id, department FROM faculty WHERE id = ?', [id]);
      if (!existingFaculty || existingFaculty.department !== req.user.department) {
        return res.status(403).json({ message: 'Forbidden. You can only manage faculty in your own department.' });
      }
    }

    await run("DELETE FROM faculty WHERE id = ?", [id]);
    res.json({ message: 'Faculty account deleted successfully.' });
  } catch (error) {
    console.error('Delete faculty error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/admin/announcements
router.get('/announcements', async (req, res) => {
  try {
    let list;
    const queryDept = req.query.department;
    if (req.user.adminRole === 'main_admin' && !queryDept) {
      list = await query("SELECT * FROM announcements ORDER BY created_at DESC");
    } else {
      const dept = queryDept || req.user.department;
      list = await query("SELECT * FROM announcements WHERE department = ? OR department = 'All' ORDER BY created_at DESC", [dept]);
    }
    res.json(list);
  } catch (error) {
    console.error('Announcements fetch error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/admin/announcements
router.post('/announcements', upload.single('attachment'), async (req, res) => {
  let { title, description, department, publishDate, expiryDate, priority } = req.body;

  if (req.user.adminRole !== 'main_admin') {
    department = req.user.department; // Force their own department
  }

  if (!title || !description || !publishDate || !expiryDate) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  const attachmentPath = req.file ? `/uploads/${req.file.filename}` : null;
  const attachmentName = req.file ? Buffer.from(req.file.originalname, 'latin1').toString('utf8') : null;

  try {
    await run(
      `INSERT INTO announcements (title, description, department, attachment_path, attachment_name, publish_date, expiry_date, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, department || 'All', attachmentPath, attachmentName, publishDate, expiryDate, priority || 'Medium']
    );

    // Send notification to students and faculty
    const notifyMsg = `New Announcement: ${title}`;
    await run(`INSERT INTO notifications (user_role, message) VALUES (?, ?)`, ['Student', notifyMsg]);
    await run(`INSERT INTO notifications (user_role, message) VALUES (?, ?)`, ['Faculty', notifyMsg]);

    res.status(201).json({ message: 'Announcement created successfully.' });
  } catch (error) {
    console.error('Add announcement error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT /api/admin/announcements/:id
router.put('/announcements/:id', upload.single('attachment'), async (req, res) => {
  const { id } = req.params;
  let { title, description, department, publishDate, expiryDate, priority } = req.body;

  if (req.user.adminRole !== 'main_admin') {
    const existing = await get("SELECT * FROM announcements WHERE id = ?", [id]);
    if (!existing || (existing.department !== req.user.department && existing.department !== 'All')) {
      return res.status(403).json({ message: 'Forbidden. You can only modify your own department announcements.' });
    }
    department = req.user.department; // Force their own department
  }

  if (!title || !description || !publishDate || !expiryDate) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  try {
    const existing = await get("SELECT * FROM announcements WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    let attachmentPath = existing.attachment_path;
    let attachmentName = existing.attachment_name;

    if (req.file) {
      attachmentPath = `/uploads/${req.file.filename}`;
      attachmentName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    }

    await run(
      `UPDATE announcements SET title = ?, description = ?, department = ?, attachment_path = ?, attachment_name = ?, publish_date = ?, expiry_date = ?, priority = ?
       WHERE id = ?`,
      [title, description, department || 'All', attachmentPath, attachmentName, publishDate, expiryDate, priority || 'Medium', id]
    );

    res.json({ message: 'Announcement updated successfully.' });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/admin/announcements/:id
router.delete('/announcements/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.adminRole !== 'main_admin') {
      const existing = await get("SELECT * FROM announcements WHERE id = ?", [id]);
      if (!existing || (existing.department !== req.user.department && existing.department !== 'All')) {
        return res.status(403).json({ message: 'Forbidden. You can only delete your own department announcements.' });
      }
    }

    await run("DELETE FROM announcements WHERE id = ?", [id]);
    res.json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/admin/departments
router.get('/departments', async (req, res) => {
  try {
    const list = await query(`
      SELECT 
        d.id, 
        d.name,
        (SELECT COUNT(*) FROM students s WHERE s.department = d.name) as student_count,
        (SELECT COUNT(*) FROM faculty f WHERE f.department = d.name) as faculty_count
      FROM departments d 
      ORDER BY d.name ASC
    `);
    res.json(list);
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/admin/departments
router.post('/departments', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Department name is required.' });
  }

  const normalizedName = name.trim();

  try {
    const existing = await get("SELECT id FROM departments WHERE name = ?", [normalizedName]);
    if (existing) {
      return res.status(400).json({ message: 'Department already exists.' });
    }

    await run("INSERT INTO departments (name) VALUES (?)", [normalizedName]);
    res.status(201).json({ message: 'Department added successfully.' });
  } catch (error) {
    console.error('Add department error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/admin/departments/:id
router.delete('/departments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const dept = await get("SELECT name FROM departments WHERE id = ?", [id]);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    const deptName = dept.name;

    // Check if department is in use
    const studentCheck = await get("SELECT COUNT(*) as count FROM students WHERE department = ?", [deptName]);
    const facultyCheck = await get("SELECT COUNT(*) as count FROM faculty WHERE department = ?", [deptName]);
    const notesCheck = await get("SELECT COUNT(*) as count FROM notes WHERE department = ?", [deptName]);
    const announcementsCheck = await get("SELECT COUNT(*) as count FROM announcements WHERE department = ?", [deptName]);
    const requestsCheck = await get("SELECT COUNT(*) as count FROM registration_requests WHERE department = ?", [deptName]);

    const totalUsage = studentCheck.count + facultyCheck.count + notesCheck.count + announcementsCheck.count + requestsCheck.count;

    if (totalUsage > 0) {
      return res.status(400).json({ 
        message: `Cannot delete department. It is currently in use by ${studentCheck.count} students, ${facultyCheck.count} faculty, ${notesCheck.count} notes, ${announcementsCheck.count} announcements, and ${requestsCheck.count} pending requests.`
      });
    }

    await run("DELETE FROM departments WHERE id = ?", [id]);
    res.json({ message: 'Department deleted successfully.' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/admin/students
router.get('/students', async (req, res) => {
  try {
    let list;
    const queryDept = req.query.department;
    if (req.user.adminRole === 'main_admin' && !queryDept) {
      list = await query(
        `SELECT id, full_name, email, mobile_number, department, semester, enrollment_number, raw_password, created_at 
         FROM students WHERE status='Approved' ORDER BY created_at DESC`
      );
    } else {
      const dept = queryDept || req.user.department;
      list = await query(
        `SELECT id, full_name, email, mobile_number, department, semester, enrollment_number, raw_password, created_at 
         FROM students WHERE status='Approved' AND department = ? ORDER BY created_at DESC`,
        [dept]
      );
    }
    res.json(list);
  } catch (error) {
    console.error('Fetch admin students error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/admin/notes
router.get('/notes', async (req, res) => {
  try {
    let list;
    const queryDept = req.query.department;
    if (req.user.adminRole === 'main_admin' && !queryDept) {
      list = await query(
        `SELECT id, faculty_id, faculty_name, subject_name, department, semester, unit_number, description, file_name, file_type, upload_date 
         FROM notes ORDER BY upload_date DESC`
      );
    } else {
      // Sub-admins must only access notes in their own department
      const dept = req.user.department;
      list = await query(
        `SELECT id, faculty_id, faculty_name, subject_name, department, semester, unit_number, description, file_name, file_type, upload_date 
         FROM notes WHERE department = ? ORDER BY upload_date DESC`,
        [dept]
      );
    }
    res.json(list);
  } catch (error) {
    console.error('Fetch admin notes error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/admin/sub-admins
router.get('/sub-admins', async (req, res) => {
  if (req.user.adminRole !== 'main_admin') {
    return res.status(403).json({ message: 'Forbidden. Main Admin access required.' });
  }
  try {
    const list = await query(
      "SELECT id, full_name, email, department, raw_password, created_at FROM admins WHERE role = 'sub_admin' ORDER BY created_at DESC"
    );
    res.json(list);
  } catch (error) {
    console.error('Fetch sub-admins error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/admin/sub-admins
router.post('/sub-admins', async (req, res) => {
  if (req.user.adminRole !== 'main_admin') {
    return res.status(403).json({ message: 'Forbidden. Main Admin access required.' });
  }

  const { fullName, email, password, department } = req.body;
  if (!fullName || !email || !password || !department) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    // Check if email already exists
    const adminCheck = await get('SELECT id FROM admins WHERE email = ?', [email]);
    const facultyCheck = await get('SELECT id FROM faculty WHERE email = ?', [email]);
    const studentCheck = await get('SELECT id FROM students WHERE email = ?', [email]);
    const requestCheck = await get('SELECT id FROM registration_requests WHERE email = ?', [email]);

    if (adminCheck || facultyCheck || studentCheck || requestCheck) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    await run(
      `INSERT INTO admins (full_name, email, password_hash, role, department, raw_password) VALUES (?, ?, ?, 'sub_admin', ?, ?)`,
      [fullName, email, hash, department, password]
    );

    res.status(201).json({ message: 'Sub Admin created successfully.' });
  } catch (error) {
    console.error('Create sub-admin error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/admin/sub-admins/:id
router.delete('/sub-admins/:id', async (req, res) => {
  if (req.user.adminRole !== 'main_admin') {
    return res.status(403).json({ message: 'Forbidden. Main Admin access required.' });
  }

  const { id } = req.params;
  try {
    const existing = await get("SELECT * FROM admins WHERE id = ? AND role = 'sub_admin'", [id]);
    if (!existing) {
      return res.status(404).json({ message: 'Sub Admin not found.' });
    }

    await run("DELETE FROM admins WHERE id = ?", [id]);
    res.json({ message: 'Sub Admin deleted successfully.' });
  } catch (error) {
    console.error('Delete sub-admin error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/admin/students
router.post('/students', async (req, res) => {
  const { fullName, email, mobileNumber, department, semester, enrollmentNumber, password } = req.body;
  let targetDept = department;

  if (req.user.adminRole !== 'main_admin') {
    targetDept = req.user.department;
  }

  if (!fullName || !email || !mobileNumber || !targetDept || !semester || !enrollmentNumber || !password) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    const adminCheck = await get('SELECT id FROM admins WHERE email = ?', [email]);
    const facultyCheck = await get('SELECT id FROM faculty WHERE email = ?', [email]);
    const studentCheck = await get('SELECT id FROM students WHERE email = ?', [email]);
    const requestCheck = await get('SELECT id FROM registration_requests WHERE email = ?', [email]);

    if (adminCheck || facultyCheck || studentCheck || requestCheck) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const enrollCheck = await get('SELECT id FROM students WHERE enrollment_number = ?', [enrollmentNumber]);
    if (enrollCheck) {
      return res.status(400).json({ message: 'Enrollment Number already registered.' });
    }

    const hash = await bcrypt.hash(password, 10);
    await run(
      `INSERT INTO students (full_name, email, mobile_number, department, semester, enrollment_number, password_hash, raw_password, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Approved')`,
      [fullName, email, mobileNumber, targetDept, semester, enrollmentNumber, hash, password]
    );

    res.status(201).json({ message: 'Student added successfully.' });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/admin/students/bulk
router.post('/students/bulk', async (req, res) => {
  const { students } = req.body;

  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ message: 'Invalid students list.' });
  }

  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  const duplicatesList = [];

  try {
    for (const student of students) {
      const { fullName, email, mobileNumber, department, semester, enrollmentNumber, password } = student;
      let targetDept = department;

      if (req.user.adminRole !== 'main_admin') {
        targetDept = req.user.department;
      }

      if (!fullName || !email || !mobileNumber || !targetDept || !semester || !enrollmentNumber || !password) {
        errorCount++;
        continue;
      }

      // Check duplicate email
      const adminCheck = await get('SELECT id FROM admins WHERE email = ?', [email]);
      const facultyCheck = await get('SELECT id FROM faculty WHERE email = ?', [email]);
      const studentCheck = await get('SELECT id FROM students WHERE email = ?', [email]);
      const requestCheck = await get('SELECT id FROM registration_requests WHERE email = ?', [email]);

      if (adminCheck || facultyCheck || studentCheck || requestCheck) {
        duplicateCount++;
        duplicatesList.push(`${email} (Email)`);
        continue;
      }

      // Check duplicate enrollment
      const enrollCheck = await get('SELECT id FROM students WHERE enrollment_number = ?', [enrollmentNumber]);
      if (enrollCheck) {
        duplicateCount++;
        duplicatesList.push(`${enrollmentNumber} (Enrollment)`);
        continue;
      }

      try {
        const hash = await bcrypt.hash(password.toString(), 10);
        await run(
          `INSERT INTO students (full_name, email, mobile_number, department, semester, enrollment_number, password_hash, raw_password, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Approved')`,
          [fullName, email, mobileNumber, targetDept, semester, enrollmentNumber, hash, password.toString()]
        );
        successCount++;
      } catch (err) {
        console.error('Bulk insert row error:', err);
        errorCount++;
      }
    }

    res.json({
      message: `Import complete. Success: ${successCount}, Duplicates: ${duplicateCount}, Errors/Skipped: ${errorCount}`,
      successCount,
      duplicateCount,
      errorCount,
      duplicatesList
    });
  } catch (error) {
    console.error('Bulk students import error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/admin/students/:id
router.delete('/students/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const student = await get('SELECT id, department FROM students WHERE id = ?', [id]);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (req.user.adminRole !== 'main_admin' && student.department !== req.user.department) {
      return res.status(403).json({ message: 'Forbidden. You can only delete students in your own department.' });
    }

    await run('DELETE FROM students WHERE id = ?', [id]);
    res.json({ message: 'Student deleted successfully.' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/admin/notes/:id (Delete note)
router.delete('/notes/:id', async (req, res) => {
  const { id } = req.params;
  const isMainAdmin = req.user.adminRole === 'main_admin';
  const dept = req.user.department;

  try {
    const existing = await get("SELECT * FROM notes WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    if (!isMainAdmin && existing.department !== dept) {
      return res.status(403).json({ message: 'Forbidden. You can only delete notes in your own department.' });
    }

    await run("DELETE FROM notes WHERE id = ?", [id]);
    res.json({ message: 'Note deleted successfully.' });
  } catch (error) {
    console.error('Admin delete note error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/admin/students/logout-all
router.post('/students/logout-all', async (req, res) => {
  const { department } = req.body;
  let targetDept = department;

  if (req.user.adminRole !== 'main_admin') {
    targetDept = req.user.department;
  }

  try {
    if (targetDept && targetDept !== 'All') {
      await run('UPDATE students SET token_version = COALESCE(token_version, 1) + 1 WHERE department = ?', [targetDept]);
      res.json({ message: `Successfully logged out all students in department: ${targetDept}` });
    } else {
      if (req.user.adminRole === 'main_admin') {
        await run('UPDATE students SET token_version = COALESCE(token_version, 1) + 1');
        res.json({ message: 'Successfully logged out all students across all departments.' });
      } else {
        res.status(403).json({ message: 'Forbidden. You can only logout students in your own department.' });
      }
    }
  } catch (error) {
    console.error('Logout all students error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;

