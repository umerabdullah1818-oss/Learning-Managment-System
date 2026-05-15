import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../layouts/Layout';
import ProfessorAttendance from '../../components/professors/Attendance/ProfessorAttendance';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config/api';

const ProfessorAttendancePage = () => {
  const { courseId: routeParamCourseId } = useParams();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(routeParamCourseId || null);
  const [loading, setLoading] = useState(true);

  // Fetch professor's assigned courses on mount
  useEffect(() => {
    const fetchAssignedCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/courses/assigned`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch assigned courses');
        const data = await response.json();
        setCourses(data);

        // Auto-select first course if no course ID is provided
        if (!selectedCourseId && data.length > 0) {
          setSelectedCourseId(data[0].id);
        }
      } catch (error) {
        toast.error('Failed to load assigned courses');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedCourses();
  }, []);

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
  };

  // Find the currently selected course object for passing to child component
  const selectedCourse = courses.find((c) => String(c.id) === String(selectedCourseId));

  // if (loading) {
  //   return (
  //     <Layout>
  //       <div className="card">
  //         <div className="card-body text-center">
  //           <div className="spinner-border text-primary" role="status">
  //             <span className="sr-only">Loading...</span>
  //           </div>
  //           <p className="mt-3">Loading your assigned courses...</p>
  //         </div>
  //       </div>
  //     </Layout>
  //   );
  // }

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Attendance Management</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Course Selection */}
        {courses.length > 0 && (
          <div className="card mb-3">
            <div className="card-body">
              <label htmlFor="courseSelect" className="form-label  fs-4">
                Select Course
              </label>
              <select
                id="courseSelect"
                className="form-select"
                value={selectedCourseId || ''}
                onChange={(e) => handleCourseChange(e.target.value)}
              >
                <option value="">-- Choose a course --</option>
                {courses.map((course) => {
                  const code = course.code || course.courseCode || course.course_code || '';
                  const name = course.name || course.courseName || course.course_name || '';
                  const id = course.id || course.course_id || course.courseId;
                  const label = code || name ? `${code}${code && name ? ' - ' : ''}${name}` : `Course ${id}`;
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        {/* Attendance Component */}
        {selectedCourseId ? (
          <ProfessorAttendance courseId={selectedCourseId} course={selectedCourse} />
        ) : (
          <div className="card">
            <div className="card-body text-center">
              <p className="text-muted">
                {courses.length === 0
                  ? 'You have no assigned courses yet.'
                  : 'Please select a course to manage attendance.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfessorAttendancePage;
