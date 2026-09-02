const express = require('express');
const router = express.Router();
const { query, run } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/notifications
router.get('/', async (req, res) => {
  const { id, role, adminRole, department } = req.user;

  try {
    let list = [];

    if (role === 'admin') {
      if (adminRole === 'main_admin') {
        // Main Admin sees ALL notifications for Admin role across ALL departments,
        // as well as any notification targeted directly to their user_id
        list = await query(
          `SELECT * FROM notifications 
           WHERE user_role = 'Admin' OR user_id = ?
           ORDER BY created_at DESC LIMIT 60`,
          [id]
        );
      } else {
        // Sub-Admin ONLY sees notifications for their own department (or 'All' or direct user_id)
        // Sub-Admin of BCA will NEVER see B.Com notifications
        list = await query(
          `SELECT * FROM notifications 
           WHERE user_role = 'Admin' 
             AND (
               user_id = ? 
               OR (
                 (department = ? OR department = 'All' OR department IS NULL) 
                 AND (user_id IS NULL OR user_id = ?)
               )
             )
           ORDER BY created_at DESC LIMIT 60`,
          [id, department, id]
        );
      }
    } else if (role === 'faculty') {
      // Faculty ONLY sees notifications for their own department (or 'All' or direct user_id)
      list = await query(
        `SELECT * FROM notifications 
         WHERE user_role = 'Faculty' 
           AND (
             user_id = ? 
             OR (
               (department = ? OR department = 'All' OR department IS NULL) 
               AND (user_id IS NULL OR user_id = ?)
             )
           )
         ORDER BY created_at DESC LIMIT 60`,
        [id, department, id]
      );
    } else if (role === 'student') {
      // Student ONLY sees notifications for their own department (or 'All' or direct user_id)
      list = await query(
        `SELECT * FROM notifications 
         WHERE user_role = 'Student' 
           AND (
             user_id = ? 
             OR (
               (department = ? OR department = 'All' OR department IS NULL) 
               AND (user_id IS NULL OR user_id = ?)
             )
           )
         ORDER BY created_at DESC LIMIT 60`,
        [id, department, id]
      );
    }

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
    const numericId = parseInt(id, 10) || id;
    await run("DELETE FROM notifications WHERE id = ?", [numericId]);
    res.json({ message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/notifications (Clear all notifications for the current user)
router.delete('/', async (req, res) => {
  const { id, role, adminRole, department } = req.user;
  try {
    if (role === 'admin') {
      if (adminRole === 'main_admin') {
        await run("DELETE FROM notifications WHERE user_role = 'Admin' OR user_id = ?", [id]);
      } else {
        await run(
          "DELETE FROM notifications WHERE user_role = 'Admin' AND (user_id = ? OR ((department = ? OR department = 'All' OR department IS NULL) AND (user_id IS NULL OR user_id = ?)))",
          [id, department, id]
        );
      }
    } else if (role === 'faculty') {
      await run(
        "DELETE FROM notifications WHERE user_role = 'Faculty' AND (user_id = ? OR ((department = ? OR department = 'All' OR department IS NULL) AND (user_id IS NULL OR user_id = ?)))",
        [id, department, id]
      );
    } else if (role === 'student') {
      await run(
        "DELETE FROM notifications WHERE user_role = 'Student' AND (user_id = ? OR ((department = ? OR department = 'All' OR department IS NULL) AND (user_id IS NULL OR user_id = ?)))",
        [id, department, id]
      );
    }
    res.json({ message: 'All notifications cleared successfully.' });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
