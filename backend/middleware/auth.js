const jwt = require('jsonwebtoken');
const { get } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'lj_cca_classroom_jwt_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required.' });
  }
  next();
}

function requireFaculty(req, res, next) {
  if (!req.user || req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Forbidden. Faculty access required.' });
  }
  next();
}

async function requireStudent(req, res, next) {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Forbidden. Student access required.' });
  }

  try {
    const student = await get('SELECT token_version FROM students WHERE id = ?', [req.user.id]);
    if (!student || (student.token_version !== null && student.token_version !== undefined && student.token_version !== req.user.tokenVersion)) {
      return res.status(401).json({ message: 'Session expired or forced logout. Please log in again.' });
    }
  } catch (err) {
    console.error('Middleware token version check error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }

  next();
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireAdmin,
  requireFaculty,
  requireStudent
};
