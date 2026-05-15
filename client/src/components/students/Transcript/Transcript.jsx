import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

// Lightweight in-file toast notifier (no external deps)
const Toast = ({ toast }) => {
  if (!toast) return null;
  const { type = 'info', message = '' } = toast;
  const cls = `alert alert-${type} d-inline-block shadow`; 
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1060 }} aria-live="polite" aria-atomic="true">
      <div className={cls} role="status">
        {message}
      </div>
    </div>
  );
};

// Helper: Get badge color based on letter grade
const getGradeColor = (letter) => {
  if (!letter || letter === '—') return 'secondary';
  const l = String(letter).trim().toUpperCase();
  if (l.startsWith('A')) return 'success';
  if (l.startsWith('B')) return 'info';
  if (l.startsWith('C')) return 'warning';
  if (l.startsWith('D')) return 'danger';
  if (l.startsWith('F')) return 'danger';
  return 'secondary';
};

// Helper: Get letter color class for count badges
const getCountBadgeColor = (letter) => {
  if (letter === 'A') return 'bg-success';
  if (letter === 'B') return 'bg-info';
  if (letter === 'C') return 'bg-warning text-dark';
  if (letter === 'D') return 'bg-danger';
  if (letter === 'F') return 'bg-danger';
  return 'bg-secondary';
};

// Component: Letter Grades Summary (internal)
const TranscriptSummary = ({ transcript = [] }) => {
  const toLetter = (row) => {
    if (!row) return 'N/A';
    const g = row.grade;
    if (typeof g === 'string' && g.trim() !== '') {
      const letter = g.trim().toUpperCase();
      if (/^[A-F][+-]?$/.test(letter)) return letter;
    }
    const gp = row.gradePoints ?? row.grade_point ?? null;
    if (typeof gp === 'number') {
      if (gp >= 4.0) return 'A';
      if (gp >= 3.7) return 'A−';
      if (gp >= 3.3) return 'B+';
      if (gp >= 3.0) return 'B';
      if (gp >= 2.7) return 'B−';
      if (gp >= 2.3) return 'C+';
      if (gp >= 2.0) return 'C';
      if (gp >= 1.7) return 'C−';
      if (gp >= 1.3) return 'D+';
      if (gp >= 1.0) return 'D';
      return 'F';
    }
    const pct = row.percentage ?? row.score ?? null;
    if (typeof pct === 'number') {
      if (pct >= 85) return 'A';
      if (pct >= 80) return 'A−';
      if (pct >= 75) return 'B+';
      if (pct >= 71) return 'B';
      if (pct >= 68) return 'B−';
      if (pct >= 64) return 'C+';
      if (pct >= 61) return 'C';
      if (pct >= 58) return 'C−';
      if (pct >= 54) return 'D+';
      if (pct >= 50) return 'D';
      return 'F';
    }
    return 'N/A';
  };

  const summary = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0, F: 0, NA: 0 };
    transcript.forEach(r => {
      const L = toLetter(r);
      if (L === 'N/A') counts.NA += 1;
      else if (counts[L] !== undefined) counts[L] += 1;
      else {
        // For modified grades (A−, B+, etc.), extract base letter
        const base = L.charAt(0);
        if (counts[base] !== undefined) counts[base] += 1;
        else counts.NA += 1;
      }
    });
    const total = transcript.length || 0;
    const pct = (n) => (total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`);
    return { counts, total, pct };
  }, [transcript]);

  return (
    <div className="card mb-4 shadow-sm">
      <div className="card-body">
        <h5 className="card-title text-center"><i className="bi bi-bar-chart-fill"></i> Grading Scale</h5>
        <div className="row">
          <div className="col-lg-12">
            <div className="text-center">
              {/* <div className="fs-6 mb-2"><strong><i className="bi bi-table"></i> Grading Scale</strong></div> */}
              <div className="table-responsive">
                <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.85rem' }}>
                <tbody>
                  <tr><td>85–100</td><td><span className="badge bg-success">A</span></td><td><span className="fw-semibold">4.00</span></td></tr>
                  <tr><td>80–84</td><td><span className="badge bg-success">A−</span></td><td><span className="fw-semibold">3.70</span></td></tr>
                  <tr><td>75–79</td><td><span className="badge bg-info">B+</span></td><td><span className="fw-semibold">3.30</span></td></tr>
                  <tr><td>71–74</td><td><span className="badge bg-info">B</span></td><td><span className="fw-semibold">3.00</span></td></tr>
                  <tr><td>68–70</td><td><span className="badge bg-info">B−</span></td><td><span className="fw-semibold">2.70</span></td></tr>
                  <tr><td>64–67</td><td><span className="badge bg-warning text-dark">C+</span></td><td><span className="fw-semibold">2.30</span></td></tr>
                  <tr><td>61–63</td><td><span className="badge bg-warning text-dark">C</span></td><td><span className="fw-semibold">2.00</span></td></tr>
                  <tr><td>58–60</td><td><span className="badge bg-warning text-dark">C−</span></td><td><span className="fw-semibold">1.70</span></td></tr>
                  <tr><td>54–57</td><td><span className="badge bg-danger">D+</span></td><td><span className="fw-semibold">1.30</span></td></tr>
                  <tr><td>50–53</td><td><span className="badge bg-danger">D</span></td><td><span className="fw-semibold">1.00</span></td></tr>
                  <tr><td>&lt; 50</td><td><span className="badge bg-danger">F</span></td><td><span className="fw-semibold">0.00</span></td></tr>
                </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Transcript component: fetches transcript and renders summary + table
const Transcript = () => {
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [finalGradesMap, setFinalGradesMap] = useState({});
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message, duration = 4000) => {
    setToast({ type, message });
    if (duration > 0) setTimeout(() => setToast(null), duration);
  };

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user || !user.uuid) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Not authenticated. Please log in.');
          setLoading(false);
          return;
        }
        // Fetch enrollments + final grades in parallel
        const [enRes, fgRes] = await Promise.all([
          axios.get(`/api/enrollments/student-courses`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`/api/final-grades/student/${user.uuid}/summary`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        // Handle both array and wrapped response formats
        const enrollments = Array.isArray(enRes.data) ? enRes.data : (enRes.data?.data || []);
        const finalGrades = Array.isArray(fgRes.data) ? fgRes.data : (fgRes.data?.data || []);

        // build a map course_id -> final grade row for quick lookup
        const fgMap = {};
        finalGrades.forEach(f => {
          const cid = f.course_id ?? f.courseId ?? f.courseId;
          if (cid !== undefined && cid !== null) fgMap[cid] = f;
        });

        setTranscript(enrollments);
        setFinalGradesMap(fgMap);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to load enrollments';
        setError(msg);
        showToast('danger', msg);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [user]);

  // compute active enrollments once
  const activeEnrollments = useMemo(() => {
    return transcript.filter(r => (r.status || '').toLowerCase() === 'active');
  }, [transcript]);

  // helper: map letter to grade point using new grading scale
  const letterToPoint = (letter) => {
    if (!letter) return null;
    const l = String(letter).trim().toUpperCase();
    const map = {
      'A': 4.0,
      'A−': 3.7,
      'A-': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'B−': 2.7,
      'B-': 2.7,
      'C+': 2.3,
      'C': 2.0,
      'C−': 1.7,
      'C-': 1.7,
      'D+': 1.3,
      'D': 1.0,
      'F': 0.0
    };
    return map[l] ?? null;
  };

  // helper: convert percentage to grade point using new grading scale
  const percentageToPoint = (pct) => {
    if (pct == null) return null;
    const p = Number(pct);
    if (isNaN(p)) return null;
    if (p >= 85) return 4.0;      // A: 85-100
    if (p >= 80) return 3.7;      // A−: 80-84
    if (p >= 75) return 3.3;      // B+: 75-79
    if (p >= 71) return 3.0;      // B: 71-74
    if (p >= 68) return 2.7;      // B−: 68-70
    if (p >= 64) return 2.3;      // C+: 64-67
    if (p >= 61) return 2.0;      // C: 61-63
    if (p >= 58) return 1.7;      // C−: 58-60
    if (p >= 54) return 1.3;      // D+: 54-57
    if (p >= 50) return 1.0;      // D: 50-53
    return 0.0;                    // F: Below 50
  };

  // compute semester GPAs and CGPA
  const { semesterGpas, cgpa, semesterGpaMap } = useMemo(() => {
    const semesters = {}; // semester -> { totalPoints, totalCredits }
    let cg_totalPoints = 0;
    let cg_totalCredits = 0;

    activeEnrollments.forEach(r => {
      const courseId = r.course_id ?? r.courseId ?? r.course_id;
      const fg = courseId ? finalGradesMap[courseId] : null;
      // determine grade point
      let gp = null;
      if (fg) {
        gp = letterToPoint(fg.letter_grade ?? fg.letterGrade ?? fg.letter);
        if (gp == null) {
          const pct = fg.final_percentage ?? fg.finalPercentage ?? fg.finalPercentage;
          gp = percentageToPoint(pct);
        }
      }
      // skip if no grade point available
      if (gp == null) return;

      const credits = Number(r.credits) || 0;
      if (credits <= 0) return;

      const sem = r.semester ?? 'Unknown';
      if (!semesters[sem]) semesters[sem] = { totalPoints: 0, totalCredits: 0 };
      semesters[sem].totalPoints += gp * credits;
      semesters[sem].totalCredits += credits;

      cg_totalPoints += gp * credits;
      cg_totalCredits += credits;
    });

    const semesterGpas = Object.keys(semesters).map(sem => {
      const s = semesters[sem];
      return { semester: sem, gpa: s.totalCredits ? +(s.totalPoints / s.totalCredits).toFixed(2) : null, credits: s.totalCredits };
    }).sort((a,b) => a.semester.localeCompare(b.semester));

    const semesterGpaMap = {};
    semesterGpas.forEach(s => { semesterGpaMap[s.semester] = s.gpa; });

    const cgpa = cg_totalCredits ? +(cg_totalPoints / cg_totalCredits).toFixed(2) : null;
    return { semesterGpas, cgpa, semesterGpaMap };
  }, [activeEnrollments, finalGradesMap]);

  return (
    <div className="container-fluid py-4">
      <Toast toast={toast} />
      <h3 className="mb-4"><i className="bi bi-file-earmark-text"></i> Transcript</h3>
      {loading && <div className="alert alert-info"><i className="bi bi-hourglass-split"></i> Loading transcript...</div>}
      {error && <div className="alert alert-danger"><i className="bi bi-exclamation-circle"></i> {error}</div>}

      {!loading && !error && (
        <div>
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-book"></i> Enrolled Courses</h5>
              <div className="d-flex flex-wrap gap-3 align-items-start">
                <div className="p-3 bg-light rounded text-center" style={{ flex: '1 1 auto', minWidth: '150px' }}>
                  <div className="fs-6 text-muted"><i className="bi bi-people-fill"></i> Total Enrolled</div>
                  <div className="fs-4 fw-bold text-primary">{activeEnrollments.length}</div>
                </div>
                <div className="p-3 bg-light rounded text-center" style={{ flex: '1 1 auto', minWidth: '150px' }}>
                  <div className="fs-6 text-muted"><i className="bi bi-calculator"></i> CGPA</div>
                  <div className="fs-4 fw-bold text-success">{cgpa != null ? cgpa : '—'}</div>
                </div>
                {semesterGpas && semesterGpas.length > 0 && (
                  <div className="p-3 bg-light rounded" style={{ flex: '1 1 auto', minWidth: '200px' }}>
                    <div className="fs-6 text-muted mb-2"><i className="bi bi-calendar-check"></i> Semester GPAs</div>
                    <ul className="mb-0" style={{ listStyle: 'none', paddingLeft: 0 }}>
                      {semesterGpas.map(s => (
                        <li key={s.semester} className="small mb-1">
                          <span className="fw-semibold">{s.semester}:</span> <span className="badge bg-primary">{s.gpa != null ? s.gpa : '—'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {transcript.length === 0 ? (
            <div className="alert alert-info text-center"><i className="bi bi-info-circle"></i> You are not enrolled in any courses.</div>
          ) : (
            <div className="card shadow-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-sm table-bordered mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th><i className="bi bi-code-square"></i> Code</th>
                        <th><i className="bi bi-book-fill"></i> Course</th>
                        <th><i className="bi bi-credit-card"></i> Credits</th>
                        <th><i className="bi bi-calendar"></i> Semester</th>
                        <th><i className="bi bi-person-badge"></i> Professor</th>
                        <th><i className="bi bi-star-fill"></i> Grade</th>
                        <th><i className="bi bi-percent"></i></th>
                        <th><i className="bi bi-clock-history"></i> Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeEnrollments.map((r) => {
                          const courseId = r.course_id ?? r.courseId ?? r.course_id;
                          const fg = courseId ? finalGradesMap[courseId] : null;
                          const letter = fg?.letter_grade ?? fg?.letterGrade ?? fg?.letterGrade ?? '—';
                          const percent = fg?.final_percentage ?? fg?.finalPercentage ?? (fg && fg.final_percentage != null ? `${fg.final_percentage}%` : '—');
                          
                          // Check if grades are visible - if fg is null and no final grade exists, grades might be hidden
                          const hasGrades = fg !== null;
                          
                          return (
                            <tr key={r.id || `${r.course_id}-${r.user_uuid}`}>
                              <td className="fw-semibold">{r.courseCode ?? r.course_id ?? '—'}</td>
                              <td>{r.courseName ?? '—'}</td>
                              <td><span className="badge bg-secondary">{r.credits ?? '—'}</span></td>
                              <td>{r.semester ?? '—'}</td>
                              <td>{r.professorName ?? '—'}</td>
                              <td>
                                {hasGrades ? (
                                  <span className={`badge bg-${getGradeColor(letter)}`}>
                                    {letter}
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary text-muted" title="Grades not yet available">—</span>
                                )}
                              </td>
                              <td>
                                {hasGrades ? (
                                  typeof percent === 'string' && percent !== '—' ? (
                                    <span className="fw-semibold">{percent}</span>
                                  ) : typeof percent === 'number' ? (
                                    <span className="fw-semibold">{percent}%</span>
                                  ) : (
                                    percent
                                  )
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td className="text-muted small">{r.enrollment_date ? new Date(r.enrollment_date).toLocaleDateString() : '—'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <TranscriptSummary transcript={activeEnrollments} />
    </div>
  );
};

export default Transcript;
