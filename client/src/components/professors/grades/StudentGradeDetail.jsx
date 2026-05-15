import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/api';

const StudentGradeDetail = ({ studentUuid, courseId }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!studentUuid || !courseId) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE_URL}/grades/student/${studentUuid}/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch student grades');
        setGrades(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentUuid, courseId]);

  if (!studentUuid || !courseId) return <div className="alert alert-info">Provide course and student to view details.</div>;
  if (loading) return <div>Loading student grades...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const grouped = grades.reduce((acc, g) => {
    acc[g.assessment_type] = acc[g.assessment_type] || [];
    acc[g.assessment_type].push(g);
    return acc;
  }, {});

  return (
    <div>
      <h5>Grades for {studentUuid} — Course {courseId}</h5>
      {Object.keys(grouped).length === 0 && <div>No grades found.</div>}
      {Object.entries(grouped).map(([type, items]) => (
        <div className="card mb-2" key={type}>
          <div className="card-header"><strong>{type.toUpperCase()}</strong></div>
          <div className="card-body">
            <table className="table table-sm">
              <thead><tr><th>ID</th><th>Score</th><th>Max</th><th>Date</th></tr></thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id}>
                    <td>{it.assignment_id || it.quiz_id || it.midterm_id || it.final_id || '-'}</td>
                    <td>{it.score}</td>
                    <td>{it.max_score}</td>
                    <td>{it.graded_at ? new Date(it.graded_at).toLocaleString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudentGradeDetail;
