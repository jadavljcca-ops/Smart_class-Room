const express = require('express');
const router = express.Router();
const { query, run, get } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { VAPID_PUBLIC_KEY, sendPushNotification, sendToSubscription } = require('../utils/webPush');

// GET /api/notifications/vapid-public-key (Public or authenticated)
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

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

// POST /api/notifications/subscribe (Register browser PushSubscription)
router.post('/subscribe', async (req, res) => {
  const { subscription } = req.body;
  const user = req.user;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ message: 'Valid push subscription object required.' });
  }

  const { endpoint, keys } = subscription;
  const { p256dh, auth } = keys;

  if (!p256dh || !auth) {
    return res.status(400).json({ message: 'p256dh and auth keys are required.' });
  }

  try {
    await run(
      `INSERT INTO push_subscriptions (user_id, user_role, department, endpoint, p256dh, auth, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         user_role = EXCLUDED.user_role,
         department = EXCLUDED.department,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         updated_at = CURRENT_TIMESTAMP`,
      [user.id, user.role, user.department || null, endpoint, p256dh, auth]
    );

    res.status(201).json({ message: 'Push subscription registered successfully.' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/notifications/unsubscribe (Remove browser PushSubscription)
router.post('/unsubscribe', async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ message: 'Endpoint is required.' });
  }

  try {
    await run('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    res.json({ message: 'Push subscription removed successfully.' });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/notifications/test-push (Send instant test push to verify mobile notification bar)
router.post('/test-push', async (req, res) => {
  const user = req.user;
  if (user.role === 'student') {
    return res.status(403).json({ message: 'Test push is only available for Admin and Faculty.' });
  }

  try {
    const result = await sendPushNotification({
      title: 'EduMark Classroom 🔔',
      body: `Hello ${user.fullName || 'User'}, your mobile notifications are active!`,
      icon: '/pwa-192.png',
      url: user.role === 'admin' ? '/admin' : user.role === 'faculty' ? '/faculty' : '/student',
      userIds: [user.id]
    });

    res.json({ message: 'Test push notification triggered.', details: result });
  } catch (error) {
    console.error('Test push error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
