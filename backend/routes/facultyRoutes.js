const express = require('express');
const router = express.Router();
const { query, run, get, insertBatchNotifications } = require('../db');
const { authenticateToken, requireFaculty } = require('../middleware/auth');
const upload = require('../utils/uploader');

router.use(authenticateToken, requireFaculty);

// GET /api/faculty/notes (Fetch notes uploaded by logged-in faculty only)
router.get('/notes', async (req, res) => {
  const facultyId = req.user.id;
  try {
    const list = await query(
      `SELECT n.*, (SELECT COUNT(*) FROM downloads d WHERE d.note_id = n.id) as download_count 
       FROM notes n WHERE n.faculty_id = ? ORDER BY n.upload_date DESC`,
      [facultyId]
    );
    res.json(list);
  } catch (error) {
    console.error('Faculty fetch notes error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/faculty/notes (Upload multiple notes with attachments)
router.post('/notes', upload.array('files'), async (req, res) => {
  const facultyId = req.user.id;
  const facultyName = req.user.fullName;
  const { subjectName, department: bodyDept, semester, unitNumber, description } = req.body;
  const department = bodyDept || req.user.department;

  const unit = unitNumber || '1';

  if (!subjectName || !department || !semester || !description) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Please upload at least one note file.' });
  }

  try {
    // Loop through each uploaded file and insert into database
    for (const file of req.files) {
      const filePath = `/uploads/${file.filename}`;
      const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const fileType = fileName.split('.').pop().toLowerCase();

      await run(
        `INSERT INTO notes (faculty_id, faculty_name, subject_name, department, semester, unit_number, description, file_path, file_name, file_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [facultyId, facultyName, subjectName, department, semester, unit, description, filePath, fileName, fileType]
      );
    }

    // Send personalized notification to students of this department AND semester + department sub-admin & main admin
    const notifyMsg = `New note files uploaded: ${subjectName} by Prof. ${facultyName}`;
    const [targetStudents, targetAdmins] = await Promise.all([
      query(
        "SELECT id FROM students WHERE department = ? AND semester = ? AND status = 'Approved'",
        [department, semester]
      ),
      query(
        "SELECT id FROM admins WHERE role = 'main_admin' OR (role = 'sub_admin' AND department = ?)",
        [department]
      )
    ]);
    
    const notifs = [
      ...targetStudents.map(student => ({
        user_role: 'Student',
        user_id: student.id,
        department: department,
        message: notifyMsg
      })),
      ...targetAdmins.map(admin => ({
        user_role: 'Admin',
        user_id: admin.id,
        department: department,
        message: notifyMsg
      }))
    ];
    await insertBatchNotifications(notifs);

    res.status(201).json({ message: 'Notes uploaded successfully.' });
  } catch (error) {
    console.error('Upload notes error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT /api/faculty/notes/:id (Update note)
router.put('/notes/:id', upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const facultyId = req.user.id;
  const { subjectName, department: bodyDept, semester, unitNumber, description } = req.body;
  const department = bodyDept || req.user.department;

  const unit = unitNumber || '1';

  if (!subjectName || !department || !semester || !description) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    const existing = await get("SELECT * FROM notes WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    if (existing.faculty_id !== facultyId) {
      return res.status(403).json({ message: 'Unauthorized. You can only modify your own notes.' });
    }

    let filePath = existing.file_path;
    let fileName = existing.file_name;
    let fileType = existing.file_type;

    if (req.file) {
      filePath = `/uploads/${req.file.filename}`;
      fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      fileType = fileName.split('.').pop().toLowerCase();
    }

    await run(
      `UPDATE notes SET subject_name = ?, department = ?, semester = ?, unit_number = ?, description = ?, file_path = ?, file_name = ?, file_type = ?
       WHERE id = ?`,
      [subjectName, department, semester, unit, description, filePath, fileName, fileType, id]
    );

    res.json({ message: 'Note updated successfully.' });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/faculty/notes/:id (Delete note)
router.delete('/notes/:id', async (req, res) => {
  const { id } = req.params;
  const facultyId = req.user.id;

  try {
    const existing = await get("SELECT * FROM notes WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    if (existing.faculty_id !== facultyId) {
      return res.status(403).json({ message: 'Unauthorized. You can only delete your own notes.' });
    }

    await run("DELETE FROM notes WHERE id = ?", [id]);
    res.json({ message: 'Note deleted successfully.' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/faculty/announcements (Announcements for faculty)
router.get('/announcements', async (req, res) => {
  const dept = req.user.department;
  try {
    // Show announcements for their department or 'All'
    const list = await query(
      `SELECT * FROM announcements 
       WHERE (department = ? OR department = 'All') AND CAST(expiry_date AS DATE) >= CURRENT_DATE 
       ORDER BY created_at DESC`,
      [dept]
    );
    res.json(list);
  } catch (error) {
    console.error('Faculty load announcements error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/faculty/announcements
router.post('/announcements', upload.single('attachment'), async (req, res) => {
  const { title, description, publishDate, expiryDate, priority } = req.body;
  const department = req.user.department; // Force their own department
  const facultyName = req.user.fullName;
  const facultyId = req.user.id;

  if (!title || !description || !publishDate || !expiryDate) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  let attachmentPath = null;
  let attachmentName = null;
  if (req.file) {
    attachmentPath = `/uploads/${req.file.filename}`;
    attachmentName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  }

  try {
    await run(
      `INSERT INTO announcements (title, description, department, attachment_path, attachment_name, publish_date, expiry_date, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, department, attachmentPath, attachmentName, publishDate, expiryDate, priority || 'Medium']
    );

    // Send department-isolated notifications to students, faculty, and admins
    const notifyMsg = `New Announcement from Prof. ${facultyName}: ${title}`;
    
    const [targetStudents, targetFaculty, targetAdmins] = await Promise.all([
      query("SELECT id FROM students WHERE department = ? AND status = 'Approved'", [department]),
      query("SELECT id FROM faculty WHERE department = ? AND id != ? AND status = 'Approved'", [department, facultyId]),
      query("SELECT id FROM admins WHERE role = 'main_admin' OR (role = 'sub_admin' AND department = ?)", [department])
    ]);
    
    const notifs = [
      ...targetStudents.map(s => ({ user_role: 'Student', user_id: s.id, department, message: notifyMsg })),
      ...targetFaculty.map(f => ({ user_role: 'Faculty', user_id: f.id, department, message: notifyMsg })),
      ...targetAdmins.map(a => ({ user_role: 'Admin', user_id: a.id, department, message: notifyMsg }))
    ];
    await insertBatchNotifications(notifs);

    res.status(201).json({ message: 'Announcement created successfully.' });
  } catch (error) {
    console.error('Faculty add announcement error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/faculty/announcements/:id
router.delete('/announcements/:id', async (req, res) => {
  const { id } = req.params;
  const facultyDept = req.user.department;
  try {
    const existing = await get("SELECT * FROM announcements WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }
    // Faculty can only delete announcements from their own department
    if (existing.department !== facultyDept) {
      return res.status(403).json({ message: 'Forbidden. You can only delete your own department announcements.' });
    }
    await run("DELETE FROM announcements WHERE id = ?", [id]);
    res.json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    console.error('Faculty delete announcement error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
