import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { API_BASE_URL } from '../../../config/api';
import { fetchGradesByCourse } from '../../../redux/slices/gradesSlice';

const ClassGradeReport = ({ courseId }) => {
  const dispatch = useDispatch();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE_URL}/grades/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch grades');
        setGrades(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, dispatch]);

  if (!courseId) return <div className="alert alert-info">Enter a course ID to view the class report.</div>;
  if (loading) return <div>Loading class report...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const grouped = {};
  grades.forEach(g => {
    const student = g.student_uuid || g.studentUuid || 'unknown';
    grouped[student] = grouped[student] || [];
    grouped[student].push(g);
  });

  const calculateStudentTotal = (items) => {
    if (!items || items.length === 0) return null;
    // simple average of percentages
    const sumPerc = items.reduce((acc, it) => acc + (Number(it.score) / Number(it.max_score || 100)) * 100, 0);
    return (sumPerc / items.length).toFixed(2);
  };

  return (
    <div>
      <h5>Class Grade Report (Course {courseId})</h5>
      <div className="table-responsive">
        <table className="table table-sm table-striped">
          <thead>
            <tr>
              <th>Student UUID</th>
              <th># Assessments</th>
              <th>Average %</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(grouped).map(s => (
              <tr key={s}>
                <td>{s}</td>
                <td>{grouped[s].length}</td>
                <td>{calculateStudentTotal(grouped[s]) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassGradeReport;
