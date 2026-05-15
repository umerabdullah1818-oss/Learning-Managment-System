import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllCoursesGrades, fetchStudentFinalGradesSummary } from '../../../redux/slices/allCoursesGradesSlice';
import { FaTasks, FaQuestionCircle, FaFileAlt, FaGraduationCap } from 'react-icons/fa';

// (Grade badge removed) UI simplified to hide grade and percentage
const StudentGradesDashboard = () => {
  const dispatch = useDispatch();
  const auth = useSelector(s => s.auth);
  const userUuid = auth?.user?.uuid || null;
  const { data, finalSummary, loading, error } = useSelector(s => s.allCoursesGrades || {});

  useEffect(() => {
    if (userUuid) {
      dispatch(fetchAllCoursesGrades(userUuid));
      dispatch(fetchStudentFinalGradesSummary(userUuid));
    }
  }, [userUuid, dispatch]);

  if (!userUuid) return <div>Please login to see your grades.</div>;

  return (
    <div className="container-fluid py-3">
      <h4 className="mb-3"><i className="bi bi-journal-text me-2"></i>Marks Details</h4>

      {data && data.length ? (
        <div className="row g-3">
          {data.map(row => {
            const weighted = row.assessments && row.assessments.length
              ? row.assessments.reduce((sum, item) => sum + ((item.score || 0) / (item.max_score || 1) * (item.weight || 0)), 0).toFixed(2)
              : '0.00';
            const letter = row.courseGrades?.letter_grade ?? (row.finalGrade?.letter_grade ?? null);
            const percent = row.courseGrades?.final_percentage ?? row.finalGrade?.final_percentage ?? null;
            return (
              <div key={row.course.id} className="col-12">
                <div className="card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="card-title mb-1"><i className="bi bi-book-fill me-2"></i>{row.course.courseName || row.course.courseCode || `Course ${row.course.id}`}</h5>
                        {row.course.courseCode && <small className="text-muted">{row.course.courseCode}</small>}
                      </div>
                      <div className="text-end">
                        <div className="small text-muted"><i className="bi bi-calculator me-1"></i>Weighted</div>
                        <div className="h5 mb-0">{weighted}</div>
                      </div>
                    </div>

                    {/* Grade and percentage intentionally hidden per request */}

                    <div className="mt-auto">
                      <small className="text-muted text-center d-block fw-bold"><i className="bi bi-table"></i> All Assessments by Type</small>
                      {row.assessments && row.assessments.length ? (
                        <div className="table-responsive mt-2">
                          <table className="table table-sm table-bordered mb-0">
                            <thead>
                              <tr>
                                <th><FaTasks className="me-1"/>{`Assignments${row.weights && row.weights.assignment_weight ? ` (${row.weights.assignment_weight}%)` : ''}`}</th>
                                <th><FaQuestionCircle className="me-1"/>{`Quizzes${row.weights && row.weights.quiz_weight ? ` (${row.weights.quiz_weight}%)` : ''}`}</th>
                                <th><FaFileAlt className="me-1"/>{`Midterms${row.weights && row.weights.midterm_weight ? ` (${row.weights.midterm_weight}%)` : ''}`}</th>
                                <th><FaGraduationCap className="me-1"/>{`Finals${row.weights && row.weights.final_weight ? ` (${row.weights.final_weight}%)` : ''}`}</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {['assignment', 'quiz', 'midterm', 'final'].map(type => {
                                  const itemsByType = row.assessments.filter(a => a.assessment_type === type);
                                  return (
                                    <td key={type} style={{ verticalAlign: 'top' }}>
                                      {itemsByType.length > 0 ? (
                                        <div>
                                          {itemsByType.map((item, idx) => (
                                            <div key={item.id} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: idx < itemsByType.length - 1 ? '1px solid #ddd' : 'none' }}>
                                              <div>
                                                <strong>{item.score}/{item.max_score}</strong>
                                                {item.weight != null && (
                                                  <small style={{ marginLeft: 6, color: '#333' }}> ({item.weight}%)</small>
                                                )}
                                              </div>
                                              <div style={{ fontSize: '12px', color: '#666' }}>
                                                {item.graded_at ? new Date(item.graded_at).toLocaleDateString() : '—'}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div style={{ color: '#999' }}>—</div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-muted mt-2 text-center">No assessments recorded.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="alert alert-info">No enrolled courses or grades found.</div>
      )}
    </div>
  );
};

export default StudentGradesDashboard;
