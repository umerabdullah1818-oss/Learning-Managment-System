import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from '../layouts/Layout';
import StudentAttendance from '../../components/students/Attendance/StudentAttendance';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config/api';

const StudentAttendancePage = () => {
  const { courseId: routeParamCourseId } = useParams();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(routeParamCourseId || null);
  const [loading, setLoading] = useState(true);
  const tokenFromState = useSelector((state) => state.auth.token);
  const token = tokenFromState || localStorage.getItem('accessToken');

  // Fetch student's enrolled courses on mount
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        setLoading(true);

        if (!token) {
          toast.error('You must be logged in to view your courses');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/enrollments/student-courses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        setCourses(data);

        // Auto-select first course if no course ID is provided
        if (!selectedCourseId && data.length > 0) {
          // backend returns enrollments with `course_id` and courseCode/courseName
          setSelectedCourseId(data[0].course_id || data[0].courseId || data[0].id);
        }
      } catch (error) {
        toast.error('Failed to load enrolled courses');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [token]);

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
  };

  // if (loading) {
  //   return (
  //     <Layout>
  //       <div className="card">
  //         <div className="card-body text-center">
  //           <div className="spinner-border text-primary" role="status">
  //             <span className="sr-only">Loading...</span>
  //           </div>
  //           <p className="mt-3">Loading your courses...</p>
  //         </div>
  //       </div>
  //     </Layout>
  //   );
  // }

  return (
    <Layout>
      <div className="container-fluid">
        {/* Course Selection */}
        {courses.length > 0 && (
          <div className="card mb-3">
            <div className="card-body">
              <label htmlFor="courseSelect" className="form-label fs-4">
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
                  const id = course.course_id || course.courseId || course.id;
                  const code = course.courseCode || course.code || course.course_code || course.courseCode;
                  const name = course.courseName || course.name || course.course_name || course.courseName;
                  return (
                    <option key={id} value={id}>
                      {code ? `${code} - ${name || ''}` : name || `Course ${id}`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        {/* Attendance Component */}
        {selectedCourseId ? (
          <StudentAttendance 
            courseId={selectedCourseId} 
            courseInfo={courses.find(c => (c.course_id || c.courseId || c.id) == selectedCourseId)}
          />
        ) : (
          <div className="card">
            <div className="card-body text-center">
              <p className="text-muted">
                {courses.length === 0
                  ? 'You are not enrolled in any courses yet.'
                  : 'Please select a course to view attendance.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentAttendancePage;
