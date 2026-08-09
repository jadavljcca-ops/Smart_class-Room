const express = require('express');
const router = express.Router();
const { query, get } = require('../db');

// GET /api/public/stats
router.get('/stats', async (req, res) => {
  try {
    const studentCountResult = await get("SELECT COUNT(*) as count FROM students");
    const facultyCountResult = await get("SELECT COUNT(*) as count FROM faculty");
    const materialsCountResult = await get("SELECT COUNT(*) as count FROM notes");

    res.json({
      students: parseInt(studentCountResult.count, 10),
      faculty: parseInt(facultyCountResult.count, 10),
      materials: parseInt(materialsCountResult.count, 10),
      uptime: 99.9 // This can remain static or configurable later
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
