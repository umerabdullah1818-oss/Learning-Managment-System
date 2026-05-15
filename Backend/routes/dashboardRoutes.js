const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyAdmin = require('../middleware/verifyAdmin');
const {
  getDashboardStats,
  getDashboardCharts,
  getRecentActivities
} = require('../controller/dashboardController');

// All dashboard routes require authentication and admin role
router.use(verifyJWT);
router.use(verifyAdmin);

// @route GET /api/admin/dashboard/stats
router.get('/stats', getDashboardStats);

// @route GET /api/admin/dashboard/charts
router.get('/charts', getDashboardCharts);

// @route GET /api/admin/dashboard/activities
router.get('/activities', getRecentActivities);

module.exports = router;
