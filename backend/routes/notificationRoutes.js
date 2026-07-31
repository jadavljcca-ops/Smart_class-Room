const express = require('express');
const router = express.Router();
const { query, run } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/notifications
router.get('/', async (req, res) => {
  const { id, role } = req.user;
  let userRoleMapped = '';

  if (role === 'admin') userRoleMapped = 'Admin';
  else if (role === 'faculty') userRoleMapped = 'Faculty';
  else if (role === 'student') userRoleMapped = 'Student';

  try {
    const list = await query(
      `SELECT * FROM notifications 
       WHERE user_role = ? AND (user_id IS NULL OR user_id = ?) 
       ORDER BY created_at DESC LIMIT 50`,
      [userRoleMapped, id]
    );
    res.json(list);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await run("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await run("DELETE FROM notifications WHERE id = ?", [id]);
    res.json({ message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
