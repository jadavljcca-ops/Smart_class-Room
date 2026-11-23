const webpush = require('web-push');
const { query, run } = require('../db');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BDFti27FNvR6NkRp9DRjbloMuKSkryxvbydxyM1e54HB_IVWp8AiuXOKF3LWy4rpfyWZxqUP1Dam4ytm3jiBWRc';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'axc5D7UwCYo91ap5uE2q_aFT3w0I98WNDw-jvVuZjaU';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@edumark.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.error('Error configuring webpush VAPID details:', err);
}

/**
 * Send push notification to a single subscription
 */
async function sendToSubscription(sub, payload) {
  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth
    }
  };

  const payloadString = JSON.stringify(payload);

  try {
    await webpush.sendNotification(pushSubscription, payloadString, {
      TTL: 60 * 60 * 24 // 24 hours
    });
    return { success: true };
  } catch (error) {
    // 404 or 410 means subscription has expired or user revoked permission
    if (error.statusCode === 404 || error.statusCode === 410) {
      try {
        await run('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
      } catch (e) {}
    }
    return { success: false, error: error.message };
  }
}

/**
 * Broadcast web push notification based on targeting criteria
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} [options.icon] - Icon URL
 * @param {string} [options.url] - Deep link URL on click
 * @param {string[]} [options.roles] - ['student', 'faculty', 'admin']
 * @param {string} [options.department] - Target department or 'All'
 * @param {number[]} [options.userIds] - Target specific user IDs
 */
async function sendPushNotification({ title, body, icon = '/favicon.svg', url = '/', roles = [], department = null, userIds = [] }) {
  try {
    let sql = 'SELECT * FROM push_subscriptions WHERE 1=1';
    const params = [];

    // Filter by specific user IDs if provided
    if (userIds && userIds.length > 0) {
      sql += ` AND user_id IN (${userIds.map(() => '?').join(',')})`;
      params.push(...userIds);
    } else {
      // Filter by role
      if (roles && roles.length > 0) {
        const lowerRoles = roles.map(r => (r || '').toLowerCase());
        sql += ` AND LOWER(user_role) IN (${lowerRoles.map(() => '?').join(',')})`;
        params.push(...lowerRoles);
      }

      // Filter by department (All sees across departments)
      if (department && department !== 'All') {
        sql += ` AND (department = ? OR department = 'All' OR department IS NULL)`;
        params.push(department);
      }
    }

    const subscriptions = await query(sql, params);
    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0 };
    }

    const payload = {
      title,
      body,
      icon,
      badge: '/favicon.svg',
      url,
      timestamp: Date.now(),
      tag: `edumark-${Date.now()}`
    };

    const results = await Promise.allSettled(
      subscriptions.map(sub => sendToSubscription(sub, payload))
    );

    const sentCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    return { sent: sentCount, total: subscriptions.length };
  } catch (error) {
    console.error('sendPushNotification error:', error);
    return { sent: 0, error: error.message };
  }
}

module.exports = {
  VAPID_PUBLIC_KEY,
  sendPushNotification,
  sendToSubscription
};
