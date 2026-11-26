// Real-Time Notification Stream & Broadcast Manager (Server-Sent Events)
const sseClients = new Map(); // clientId -> { res, user }

function handleSseConnection(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = `${req.user ? req.user.id : 'anon'}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  sseClients.set(clientId, { res, user: req.user });

  // Initial handshake event
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId, timestamp: Date.now() })}\n\n`);

  // Heartbeat every 15s to keep mobile TCP connections alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (e) {
      clearInterval(heartbeat);
      sseClients.delete(clientId);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
}

function broadcastNotification(notification) {
  if (!notification) return;

  for (const [clientId, client] of sseClients.entries()) {
    const { res, user } = client;
    try {
      let isTarget = false;

      // 1. Specific user targeting
      if (notification.user_id && user && Number(notification.user_id) === Number(user.id)) {
        isTarget = true;
      } else if (!notification.user_id && user) {
        // 2. Role & Department targeting
        const userRole = (user.role || '').toLowerCase();
        const notifRole = (notification.user_role || '').toLowerCase();
        const roleMatches = !notification.user_role || notifRole === userRole || (userRole === 'admin' && notifRole === 'admin');

        const deptMatches = !notification.department || 
          notification.department === 'All' || 
          notification.department === user.department || 
          (userRole === 'admin' && user.adminRole === 'main_admin');

        if (roleMatches && deptMatches) {
          isTarget = true;
        }
      }

      if (isTarget) {
        res.write(`data: ${JSON.stringify({ type: 'notification', notification })}\n\n`);
      }
    } catch (err) {
      console.error('Error broadcasting SSE notification to client:', err);
      sseClients.delete(clientId);
    }
  }
}

module.exports = {
  handleSseConnection,
  broadcastNotification
};
