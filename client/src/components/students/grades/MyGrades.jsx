import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentGradesForCourse } from '../../../redux/slices/gradesSlice';
import { fetchStudentCourseGrade } from '../../../redux/slices/studentCourseGradesSlice';
import StudentGradesDashboard from './StudentGradesDashboard';

const MyGrades = ({ courseId }) => {
  const dispatch = useDispatch();
  const auth = useSelector(s => s.auth);
  const userUuid = auth?.user?.uuid || null;
  const { current, loading } = useSelector(s => s.studentCourseGrades || {});
  const gradesState = useSelector(s => s.grades || {});

  useEffect(() => {
    if (userUuid && courseId) {
      dispatch(fetchStudentGradesForCourse({ studentUuid: userUuid, courseId }));
      dispatch(fetchStudentCourseGrade({ studentUuid: userUuid, courseId }));
    }
  }, [userUuid, courseId, dispatch]);

  if (!courseId) return <StudentGradesDashboard />;

  return (
    <div>
      <div className="card p-3 mb-3">
        <h5>Course Grade Summary</h5>
        {loading && <div>Loading...</div>}
        {current ? (
          <div>
            <div>Assignment Avg: {current.assignment_avg ?? '—'}</div>
            <div>Quiz Avg: {current.quiz_avg ?? '—'}</div>
            <div>Midterm: {current.midterm_score ?? '—'}</div>
            <div>Final: {current.final_score ?? '—'}</div>
            <div><strong>Total: {current.weighted_total ?? '—'}</strong></div>
            <div>Grade: {current.letter_grade ?? '—'}</div>
          </div>
        ) : (
          <div>No summary yet. Ask professor to calculate or click refresh.</div>
        )}
      </div>

      <div className="card p-3">
        <h5>All Assessment Grades</h5>
        {gradesState.loading && <div>Loading...</div>}
        {gradesState.current && gradesState.current.length ? (
          <table className="table table-sm">
            <thead><tr><th>Type</th><th>Score</th><th>Max</th><th>Date</th></tr></thead>
            <tbody>
              {gradesState.current.map(g => (
                <tr key={g.id}><td>{g.assessment_type}</td><td>{g.score}</td><td>{g.max_score}</td><td>{new Date(g.graded_at).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No grades recorded.</div>
        )}
      </div>
    </div>
  );
};

export default MyGrades;
