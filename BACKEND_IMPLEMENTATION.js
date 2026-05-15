/**
 * BACKEND IMPLEMENTATION - Copy & Paste Ready
 * 
 * This file contains all the code you need to add to your backend
 * to support the grades visibility toggle feature.
 */

// ============================================
// 1. DATABASE MIGRATION SCRIPT
// ============================================
// Run this in your database management tool (MySQL Workbench, phpMyAdmin, etc.)

/*
-- Add grades_visible column to courses table
ALTER TABLE courses ADD COLUMN grades_visible BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
ALTER TABLE courses ADD INDEX idx_grades_visible (grades_visible);
*/

// ============================================
// 2. BACKEND ROUTES
// ============================================
// File: Backend/routes/gradesRoutes.js

const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyAdmin = require('../middleware/verifyAdmin'); // or verifyRole with 'professor' role
const connection = require('../config/dbConnection');

/**
 * PUT /api/courses/:courseId/grades-visibility
 * Update whether grades are visible to students for a specific course
 * 
 * @param {number} courseId - The course ID
 * @param {boolean} gradesVisible - Whether grades should be visible
 * @returns {object} Success response with updated status
 */
router.put('/courses/:courseId/grades-visibility', verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { gradesVisible } = req.body;

    // Validation
    if (!courseId || isNaN(parseInt(courseId))) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    if (typeof gradesVisible !== 'boolean') {
      return res.status(400).json({ error: 'gradesVisible must be a boolean' });
    }

    // Update the course
    const query = `
      UPDATE courses 
      SET grades_visible = ?, 
          updated_at = NOW()
      WHERE id = ?
    `;
    
    connection.query(query, [gradesVisible, parseInt(courseId)], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'Failed to update grades visibility',
          details: err.message 
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Log the action for audit trail (optional)
      const userId = req.user?.id || req.user?.userId;
      const logQuery = `
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      connection.query(
        logQuery,
        [userId, 'TOGGLE_GRADES_VISIBILITY', 'course', courseId, JSON.stringify({ gradesVisible })],
        (logErr) => {
          if (logErr) console.error('Error logging activity:', logErr);
        }
      );

      res.json({ 
        success: true, 
        message: `Grades are now ${gradesVisible ? 'visible' : 'hidden'} to students`,
        courseId: parseInt(courseId),
        gradesVisible
      });
    });
  } catch (error) {
    console.error('Error updating grades visibility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/courses/:courseId/grades-visibility
 * Get the current visibility status of grades for a course
 * 
 * @param {number} courseId - The course ID
 * @returns {object} Current visibility status
 */
router.get('/courses/:courseId/grades-visibility', verifyJWT, (req, res) => {
  try {
    const { courseId } = req.params;

    // Validation
    if (!courseId || isNaN(parseInt(courseId))) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const query = `
      SELECT id, grades_visible 
      FROM courses 
      WHERE id = ?
    `;
    
    connection.query(query, [parseInt(courseId)], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'Failed to fetch grades visibility',
          details: err.message 
        });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }

      res.json({ 
        success: true, 
        courseId: parseInt(courseId),
        gradesVisible: results[0].grades_visible || false
      });
    });
  } catch (error) {
    console.error('Error fetching grades visibility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/courses/visibility-status
 * Get visibility status for multiple courses (batch request)
 * 
 * @param {array} courseIds - Array of course IDs
 * @returns {object} Visibility status for each course
 */
router.post('/courses/visibility-status-batch', verifyJWT, (req, res) => {
  try {
    const { courseIds } = req.body;

    // Validation
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ error: 'courseIds must be a non-empty array' });
    }

    const placeholders = courseIds.map(() => '?').join(',');
    const query = `
      SELECT id, grades_visible 
      FROM courses 
      WHERE id IN (${placeholders})
    `;
    
    connection.query(query, courseIds.map(id => parseInt(id)), (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'Failed to fetch visibility statuses',
          details: err.message 
        });
      }

      const statusMap = {};
      results.forEach(row => {
        statusMap[row.id] = row.grades_visible || false;
      });

      res.json({ 
        success: true, 
        statuses: statusMap
      });
    });
  } catch (error) {
    console.error('Error fetching visibility statuses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


// ============================================
// 3. REGISTER ROUTE IN SERVER
// ============================================
// File: Backend/server.js
// Add this to your main server file:

/*
const express = require('express');
const app = express();

// ... other imports and middleware ...

// Routes
const gradesRoutes = require('./routes/gradesRoutes');
app.use('/api', gradesRoutes);

// ... rest of your server code ...
*/


// ============================================
// 4. STUDENT DASHBOARD - CHECK VISIBILITY
// ============================================
// Example: client/src/components/students/StudentGradeView.jsx

/*
import React, { useState, useEffect } from 'react';

const StudentGradeView = ({ courseId, courseGrades }) => {
  const [gradesVisible, setGradesVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGradesVisibility();
  }, [courseId]);

  const fetchGradesVisibility = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/grades-visibility`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGradesVisible(data.gradesVisible);
      }
    } catch (error) {
      console.error('Error fetching visibility:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner-border"></div>;
  }

  if (!gradesVisible) {
    return (
      <div className="alert alert-info">
        <h5>📌 Grades Coming Soon</h5>
        <p>Your professor hasn't made grades visible yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Display grades only if visible */}
      <h5>Your Grades</h5>
      {/* Grade display component here */}
    </div>
  );
};

export default StudentGradeView;
*/


// ============================================
// 5. OPTIONAL: ACTIVITY LOG TABLE
// ============================================
// If you want to track when visibility is toggled, use this schema:

/*
CREATE TABLE activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id INT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_action (user_id, action),
  INDEX idx_created_at (created_at)
);
*/


// ============================================
// 6. OPTIONAL: BULK UPDATE ENDPOINT
// ============================================
// For updating multiple courses at once

/*
router.put('/courses/visibility-bulk', verifyJWT, verifyAdmin, (req, res) => {
  try {
    const { courseIds, gradesVisible } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ error: 'courseIds must be a non-empty array' });
    }

    if (typeof gradesVisible !== 'boolean') {
      return res.status(400).json({ error: 'gradesVisible must be a boolean' });
    }

    const placeholders = courseIds.map(() => '?').join(',');
    const query = `
      UPDATE courses 
      SET grades_visible = ?, updated_at = NOW()
      WHERE id IN (${placeholders})
    `;

    const params = [gradesVisible, ...courseIds.map(id => parseInt(id))];
    
    connection.query(query, params, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update visibility' });
      }

      res.json({
        success: true,
        message: \`Updated \${result.affectedRows} course(s)\`,
        updatedCount: result.affectedRows
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
*/


// ============================================
// NOTES
// ============================================
/*
1. Make sure verifyJWT and verifyAdmin middleware are properly set up
2. Update database connection path if different in your setup
3. Use verifyRole('professor') if you have role-based verification
4. The activity_logs table is optional for audit purposes
5. Batch endpoints are optional but useful for performance
6. Students should only be able to GET visibility status
7. Only professors/admins should be able to PUT/UPDATE visibility

Environment variables you might need:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
*/
