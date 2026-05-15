/**
 * Grade Service - Handles all grade-related API calls
 */

import { API_BASE_URL } from '../config/api';

/**
 * Update grade visibility for a course
 * @param {string} professorId - The ID of the professor
 * @param {number} courseId - The ID of the course
 * @param {boolean} gradesVisible - Whether grades should be visible to students
 * @returns {Promise<Object>} API response
 */
export const updateGradeVisibility = async (professorId, courseId, gradesVisible) => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/grades/updateGradeVisibility`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      professorId,
      courseId: parseInt(courseId),
      gradesVisible
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update grade visibility');
  }

  return await response.json();
};

/**
 * Get grade visibility status for a course
 * @param {number} courseId - The ID of the course
 * @returns {Promise<Object>} API response with visibility status
 */
export const getGradeVisibility = async (courseId) => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/grades/getGradeVisibility/${courseId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to get grade visibility');
  }

  return await response.json();
};
