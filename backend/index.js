const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const { db } = require('./db');
const { getCache, setCache, invalidateCache } = require('./utils/cache');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const studentRoutes = require('./routes/studentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite development server (usually port 5173)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Automatic cache invalidation on any database mutation (POST, PUT, DELETE, PATCH)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    invalidateCache();
  }
  next();
});

// High-speed In-Memory Response Caching for GET queries
app.use((req, res, next) => {
  if (
    req.method === 'GET' && 
    req.originalUrl.startsWith('/api/') && 
    !req.originalUrl.includes('/notifications') && 
    !req.originalUrl.includes('/download')
  ) {
    const authHeader = req.headers.authorization || 'anon';
    const cacheKey = `${authHeader}:${req.originalUrl}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(cacheKey, body, 20000); // 20s fast cache
      }
      return originalJson(body);
    };
  }
  next();
});

// Serve uploads folder (Note: files are also downloadable securely via stream routes)
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public', publicRoutes);

// Base route for connectivity test
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ljcca Class Room System server is running.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  Server is running on http://localhost:${PORT}`);
  console.log(`  Database: Neon PostgreSQL`);
  console.log(`===================================================`);
});
