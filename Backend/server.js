require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./config/dbConnection');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://10.5.10.215:5173'], // Vite frontend (local + network)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', JSON.stringify(req.body));
  }
  next();
});

// Serve static files from public directory
app.use('/images', express.static(path.join(__dirname, '../public/images')));
// Serve uploaded assignment files
app.use('/assignments', express.static(path.join(__dirname, '../public/assignments')));
// Serve uploaded submission files
app.use('/submissions', express.static(path.join(__dirname, '../public/submissions')));

// Test DB connection
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully at', res.rows[0].now);
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
})();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/professors', require('./routes/professorRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/assets', require('./routes/assetsRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/admin/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/student/dashboard', require('./routes/studentDashboardRoutes'));

app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/grades', require('./routes/gradesRoutes'));
app.use('/api/grading-weights', require('./routes/gradingWeightRoutes'));
app.use('/api/assessment-weights', require('./routes/assessmentWeightRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/final-grades', require('./routes/finalGradesRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
// Chatbot routes (student assistant)
app.use('/api/chatbot', require('./routes/chatbotRoutes'));

// Global error handling middleware - must be last middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack || err.message || err);
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// Start server (only if not running in Vercel serverless environment)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Access from mobile: http://10.5.10.215:5173`);
  });
}

// Export the app for Vercel serverless functions
module.exports = app;
