const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { query, run, get } = require('../db');
const { authenticateToken, requireStudent } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/student/announcements
router.get('/announcements', requireStudent, async (req, res) => {
  const dept = req.user.department;
  try {
    // Return non-expired announcements for the student's department or 'All'
    const list = await query(
      `SELECT * FROM announcements 
       WHERE (department = ? OR department = 'All') AND expiry_date >= date('now') 
       ORDER BY created_at DESC`,
      [dept]
    );
    res.json(list);
  } catch (error) {
    console.error('Student fetch announcements error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/student/notes (List notes with search filters)
router.get('/notes', requireStudent, async (req, res) => {
  const dept = req.user.department;
  
  try {
    const list = await query(
      `SELECT id, faculty_id, faculty_name, subject_name, department, semester, unit_number, description, file_name, file_type, upload_date 
       FROM notes 
       WHERE department = ? 
       ORDER BY upload_date DESC`,
      [dept]
    );
    res.json(list);
  } catch (error) {
    console.error('Student fetch notes error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/student/notes/download/:id (Secure Authenticated Download)
router.get('/notes/download/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Let student and faculty and admin download files, but only log downloads for students!
  try {
    const note = await get("SELECT * FROM notes WHERE id = ?", [id]);
    if (!note) {
      return res.status(404).json({ message: 'Note file not found.' });
    }

    // Secure check: verify that the user's department matches the document's department
    // (Except for main admin, who can download any department's documents)
    const isMainAdmin = userRole === 'admin' && req.user.adminRole === 'main_admin';
    if (!isMainAdmin && note.department !== req.user.department) {
      return res.status(403).json({ message: 'Forbidden. You do not have access to documents from other departments.' });
    }

    const absolutePath = path.join(__dirname, '..', note.file_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Physical file not found on server.' });
    }

    // Log download if the user is a student
    if (userRole === 'student') {
      await run("INSERT INTO downloads (note_id, student_id) VALUES (?, ?)", [id, userId]);
    }

    // Stream download safely
    res.download(absolutePath, note.file_name);

  } catch (error) {
    console.error('Download note error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/student/announcements/download/:id (Secure Announcement attachment download)
router.get('/announcements/download/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const ann = await get("SELECT * FROM announcements WHERE id = ?", [id]);
    if (!ann || !ann.attachment_path) {
      return res.status(404).json({ message: 'Attachment not found.' });
    }

    const absolutePath = path.join(__dirname, '..', ann.attachment_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Physical attachment file not found.' });
    }

    res.download(absolutePath, ann.attachment_name);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
