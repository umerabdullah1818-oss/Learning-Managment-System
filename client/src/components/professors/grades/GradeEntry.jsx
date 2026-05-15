import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGradesByCourse, createGrade } from '../../../redux/slices/gradesSlice';
import { fetchEnrolledStudents } from '../../../redux/slices/enrolledStudentsSlice';

const GradeEntry = ({ courseId }) => {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector(state => state.grades || {});
  const { list: students, loading: studentsLoading } = useSelector(state => state.enrolledStudents || {});
  const [form, setForm] = useState({ studentUuid: '', assessmentType: 'assignment', assessmentId: '', score: '', maxScore: 100 });

  useEffect(() => {
    if (courseId && courseId.trim()) {
      dispatch(fetchGradesByCourse(courseId));
      dispatch(fetchEnrolledStudents(courseId));
    }
  }, [courseId, dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, courseId };
    await dispatch(createGrade(payload));
    setForm({ studentUuid: '', assessmentType: 'assignment', assessmentId: '', score: '', maxScore: 100 });
    dispatch(fetchGradesByCourse(courseId));
  };

  return (
    <div>
      <div className="card p-3 mb-3">
        <h5>Enter Grade</h5>
        {error && <div className="text-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label>Student</label>
            <select 
              name="studentUuid" 
              value={form.studentUuid} 
              onChange={handleChange} 
              className="form-control"
              disabled={studentsLoading}
            >
              <option value="">-- Select a Student --</option>
              {students && students.map(student => (
                <option key={student.userUuid} value={student.userUuid}>
                  {student.studentName} ({student.studentId || 'N/A'})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label>Assessment Type</label>
            <select name="assessmentType" value={form.assessmentType} onChange={handleChange} className="form-control">
              <option value="assignment">Assignment</option>
              <option value="quiz">Quiz</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
            </select>
          </div>
          <div className="mb-2">
            <label>Assessment ID (optional)</label>
            <input name="assessmentId" value={form.assessmentId} onChange={handleChange} className="form-control" />
          </div>
          <div className="mb-2">
            <label>Score</label>
            <input name="score" value={form.score} onChange={handleChange} className="form-control" type="number" />
          </div>
          <div className="mb-2">
            <label>Max Score</label>
            <input name="maxScore" value={form.maxScore} onChange={handleChange} className="form-control" type="number" />
          </div>
          <button className="btn btn-success" disabled={loading || !form.studentUuid}>Save Grade</button>
        </form>
      </div>

      <div className="card p-3">
        <h5>Recent Grades</h5>
        {list && list.length ? (
          <table className="table table-sm">
            <thead>
              <tr><th>Student</th><th>Type</th><th>Score</th><th>Max</th><th>When</th></tr>
            </thead>
            <tbody>
              {list.map(g => (
                <tr key={g.id}>
                  <td>{g.student_uuid}</td>
                  <td>{g.assessment_type}</td>
                  <td>{g.score}</td>
                  <td>{g.max_score}</td>
                  <td>{g.graded_at ? new Date(g.graded_at).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No grades yet for this course.</div>
        )}
      </div>
    </div>
  );
};

export default GradeEntry;
