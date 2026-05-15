import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../config/api';
import { updateGradeVisibility } from '../../../services/gradeService';

const FinalGradesSection = ({ students, courseId, courseGrades }) => {
  const { current: weights } = useSelector(state => state.gradingWeights || {});
  const { user } = useSelector(state => state.auth || {});
  const [finalGrades, setFinalGrades] = useState([]);
  const [savingFinals, setSavingFinals] = React.useState(false);
  const [gradesVisible, setGradesVisible] = useState(() => {
    const saved = localStorage.getItem(`gradesVisible_${courseId}`);
    return saved ? JSON.parse(saved) : false;
  });
  const [savingVisibility, setSavingVisibility] = useState(false);
  
  const expandedStateKey = `expanded_final_grades_${courseId}`;
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(expandedStateKey);
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem(expandedStateKey, JSON.stringify(isExpanded));
  }, [isExpanded, expandedStateKey]);

  useEffect(() => {
    localStorage.setItem(`gradesVisible_${courseId}`, JSON.stringify(gradesVisible));
  }, [gradesVisible, courseId]);

  useEffect(() => {
    calculateFinalGrades();
  }, [courseGrades, weights, students]);

  // helper to resolve student id and display name consistently (matches GradeEntry usage)
  const resolveStudentId = (student) => {
    return student?.userUuid || student?.user_uuid || student?.student_uuid || student?.uuid || '';
  };

  const resolveStudentName = (student) => {
    if (!student) return 'N/A';
    return (
      student.studentName ||
      student.name ||
      `${student.studentFirstName || student.firstName || student.first_name || ''} ${student.studentLastName || student.lastName || student.last_name || ''}`
    ).trim() || 'N/A';
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A−';
    if (percentage >= 75) return 'B+';
    if (percentage >= 71) return 'B';
    if (percentage >= 68) return 'B−';
    if (percentage >= 64) return 'C+';
    if (percentage >= 61) return 'C';
    if (percentage >= 58) return 'C−';
    if (percentage >= 54) return 'D+';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const calculateFinalGrades = () => {
    const defaultWeights = {
      assignment_weight: 20,
      quiz_weight: 20,
      midterm_weight: 25,
      final_weight: 35
    };

    const weightConfig = weights || defaultWeights;

    const calculated = students?.map(student => {
      const studentUuid = resolveStudentId(student);
      const studentGrades = courseGrades[studentUuid] || {};

      // helper to read per-section localStorage grades and weights
      const loadSectionData = (section) => {
        const weightsKey = `weights_${courseId}_${section}`;
        const gradesKey = `grades_${courseId}_${section}`;
        let wObj = {};
        let gObj = {};
        try { wObj = JSON.parse(localStorage.getItem(weightsKey) || '{}'); } catch (e) { wObj = {}; }
        try { gObj = JSON.parse(localStorage.getItem(gradesKey) || '{}'); } catch (e) { gObj = {}; }
        return { wObj, gObj };
      };

      const sections = ['quiz','assignment','midterm','final'];

      // compute per-section percentages (fallback to aggregated courseGrades if no detailed data)
      let totalObtained = 0;
      let totalMarks = 0;
      let weightedSumAll = 0;
      let weightSumAll = 0;

      sections.forEach(section => {
        const { wObj, gObj } = loadSectionData(section);
        const sectionWeightSum = Object.values(wObj).reduce((a,b) => a + (parseFloat(b)||0), 0);
        weightSumAll += sectionWeightSum;

        // if detailed per-column grades exist for this student
        const studentSectionGrades = gObj[studentUuid] || null;
        if (studentSectionGrades && sectionWeightSum > 0) {
          Object.keys(wObj).forEach(colId => {
            const w = parseFloat(wObj[colId]) || 0;
            const g = studentSectionGrades[colId];
            if (g) {
              const obt = parseFloat(g.obtainedMarks) || 0;
              const tot = parseFloat(g.totalMarks) || 0;
              totalObtained += obt;
              totalMarks += tot;
              if (tot > 0) {
                const frac = obt / tot;
                weightedSumAll += frac * w;
              }
            }
          });
        } else {
          // fallback to single aggregated grade from backend
          const agg = studentGrades[section];
          if (agg) {
            const obt = parseFloat(agg.score) || 0;
            const tot = parseFloat(agg.max_score || agg.maxScore || agg.maxScore) || parseFloat(agg.max_score) || 0;
            totalObtained += obt;
            totalMarks += tot;
            if (sectionWeightSum > 0 && tot > 0) {
              const frac = obt / tot;
              weightedSumAll += frac * sectionWeightSum;
            }
          }
        }
      });

      // compute overall percentage based on weightedSumAll vs weightSumAll
      let overallPct = 0;
      if (weightSumAll > 0) {
        overallPct = (weightedSumAll / weightSumAll) * 100;
      } else {
        // fallback: use simple totalObtained/totalMarks
        overallPct = totalMarks > 0 ? (totalObtained / totalMarks) * 100 : 0;
      }

      // keep decimal precision for display and use decimal to compute letter grade
      const finalPercentage = parseFloat(overallPct.toFixed(2));
      const letterGrade = getLetterGrade(finalPercentage);

      // build per-section weighted displays (use raw weighted marks: (obt/tot) * weight)
      const sectionDisplays = {};
      // recompute per-section weighted values to ensure we have per-section info
      sections.forEach(section => {}); // noop placeholder - sectionDisplays were populated earlier if needed

      // Note: weightedSumAll and weightSumAll were accumulated above
      sectionDisplays['quiz'] = { weightedObtained: 0, weightSum: 0 };
      sectionDisplays['assignment'] = { weightedObtained: 0, weightSum: 0 };
      sectionDisplays['midterm'] = { weightedObtained: 0, weightSum: 0 };
      sectionDisplays['final'] = { weightedObtained: 0, weightSum: 0 };

      // Recompute per-section breakdown for display (separate loop to avoid changing previous accumulation logic)
      sections.forEach(section => {
        const { wObj, gObj } = loadSectionData(section);
        const sectionWeightSum = Object.values(wObj).reduce((a,b) => a + (parseFloat(b)||0), 0);
        let sectionWeightedObtained = 0;
        const studentSectionGrades = gObj[studentUuid] || null;
        if (studentSectionGrades && sectionWeightSum > 0) {
          Object.keys(wObj).forEach(colId => {
            const w = parseFloat(wObj[colId]) || 0;
            const g = studentSectionGrades[colId];
            if (g && (parseFloat(g.totalMarks) || 0) > 0) {
              const obt = parseFloat(g.obtainedMarks) || 0;
              const tot = parseFloat(g.totalMarks) || 0;
              sectionWeightedObtained += (obt / tot) * w;
            }
          });
        } else {
          const agg = studentGrades[section];
          if (agg && sectionWeightSum > 0) {
            const obt = parseFloat(agg.score) || 0;
            const tot = parseFloat(agg.max_score || agg.maxScore || 0) || 0;
            if (tot > 0) sectionWeightedObtained += (obt / tot) * sectionWeightSum;
          }
        }
        sectionDisplays[section] = {
          weightedObtained: parseFloat(sectionWeightedObtained).toFixed(2),
          weightSum: parseFloat(sectionWeightSum).toFixed(2)
        };
      });

      const resolvedName = resolveStudentName(student);

      return {
        studentUuid: studentUuid,
        studentName: resolvedName,
        studentEmail: student.studentEmail || student.email || student.email_address || 'N/A',
        quizWeighted: `${sectionDisplays['quiz'].weightedObtained} / ${sectionDisplays['quiz'].weightSum}`,
        assignmentWeighted: `${sectionDisplays['assignment'].weightedObtained} / ${sectionDisplays['assignment'].weightSum}`,
        midtermWeighted: `${sectionDisplays['midterm'].weightedObtained} / ${sectionDisplays['midterm'].weightSum}`,
        finalWeighted: `${sectionDisplays['final'].weightedObtained} / ${sectionDisplays['final'].weightSum}`,
        totalWeightedObtained: parseFloat(weightedSumAll).toFixed(2),
        totalWeightSum: parseFloat(weightSumAll).toFixed(2),
        finalPercentage,
        letterGrade
      };
    }) || [];

    setFinalGrades(calculated);
  };

  const getGradeColor = (letterGrade) => {
    const colors = {
      'A': 'success',
      'A−': 'success',
      'B+': 'info',
      'B': 'info',
      'B−': 'info',
      'C+': 'warning',
      'C': 'warning',
      'C−': 'warning',
      'D+': 'danger',
      'D': 'danger',
      'F': 'danger'
    };
    return colors[letterGrade] || 'secondary';
  };

  const handleGradesVisibilityToggle = async () => {
    try {
      setSavingVisibility(true);
      const professorId = user?.professorId || user?.uuid;
      const newVisibilityState = !gradesVisible;

      if (!professorId) {
        throw new Error('Professor ID not found');
      }

      // Call updateGradeVisibility service with professorId and toggle value
      await updateGradeVisibility(professorId, courseId, newVisibilityState);

      setGradesVisible(newVisibilityState);
      toast.success(
        newVisibilityState 
          ? '✓ Grades are now ON - Students can view grades' 
          : '✓ Grades are now OFF - Grades are hidden from students',
        {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
    } catch (err) {
      toast.error(`Error updating grades visibility: ${err.message || err}`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setSavingVisibility(false);
    }
  };

  return (
    <div className="card final-grades-card">
      <div className="card-header bg-primary text-white final-grades-header">
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <button
            className="btn btn-sm btn-outline-light collapse-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? '▼ Collapse' : '▶ Expand'}
          </button>
          <h5 className="mb-0 final-grades-title">Final Grades Summary</h5>
        </div>
        
        {/* Grades Visibility Toggle */}
        <div className="d-flex align-items-center gap-3 visibility-toggle-wrapper">
          <span className={`badge ${gradesVisible ? 'bg-success' : 'bg-danger'}`} title="Toggle grades visibility for students">
            {gradesVisible ? '✓ Grades are ON' : '✗ Grades are OFF'}
          </span>
          <div className="form-check form-switch m-0" style={{ cursor: 'pointer' }}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`gradesVisibilitySwitch_${courseId}`}
              checked={gradesVisible}
              onChange={handleGradesVisibilityToggle}
              disabled={savingVisibility}
              style={{ cursor: savingVisibility ? 'not-allowed' : 'pointer', width: '3rem', height: '1.5rem' }}
              title={gradesVisible ? 'Click to turn grades OFF' : 'Click to turn grades ON'}
            />
            <label 
              className="form-check-label ms-2 fw-semibold toggle-label"
              htmlFor={`gradesVisibilitySwitch_${courseId}`}
              style={{ cursor: savingVisibility ? 'not-allowed' : 'pointer', userSelect: 'none' }}
            >
              {savingVisibility ? 'Updating...' : 'Toggle Grades'}
            </label>
          </div>
        </div>
      </div>
      {isExpanded && (
      <div className="card-body">
        {finalGrades.length > 0 ? (
          <>
          <div
            className="final-grades-table-wrapper table-responsive"
            style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
          >
            <table
              className="table table-hover table-bordered table-sm"
              style={{ minWidth: '900px' }}
            >
              <thead className="table-light">
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Quiz</th>
                  <th>Assignment</th>
                  <th>Midterm </th>
                  <th>Final </th>
                  <th>Total Marks</th>
                  <th>Overall </th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {finalGrades.map(grade => (
                  <tr key={grade.studentUuid}>
                    <td>
                      <strong>{grade.studentName}</strong>
                    </td>
                    <td>
                      <small className="text-muted">{grade.studentEmail}</small>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">{grade.quizWeighted}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">{grade.assignmentWeighted}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">{grade.midtermWeighted}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">{grade.finalWeighted}</span>
                    </td>
                    <td>
                      <span className="badge bg-info text-white"><strong>{grade.totalWeightedObtained} / {grade.totalWeightSum}</strong></span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{grade.finalPercentage}%</span>
                    </td>
                    <td>
                      <span className={`badge bg-${getGradeColor(grade.letterGrade)}`} style={{ fontSize: '1rem', padding: '0.5rem 0.75rem' }}>
                        {grade.letterGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <button
              className="btn btn-primary btn-sm me-2"
              onClick={async () => {
                // construct payload from finalGrades state
                try {
                  setSavingFinals(true);
                  const token = localStorage.getItem('accessToken');
                  const payload = {
                    grades: finalGrades.map(g => ({
                      studentUuid: g.studentUuid,
                      courseId: parseInt(courseId),
                      finalWeightedScore: parseFloat(g.totalWeightedObtained) || 0,
                      weightSum: parseFloat(g.totalWeightSum) || 0,
                      finalPercentage: parseFloat(g.finalPercentage) || 0,
                      letterGrade: null  // Let backend calculate letter grade from percentage
                    }))
                  };
                  const res = await fetch(`${API_BASE_URL}/api/final-grades`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                  });
                  if (!res.ok) throw new Error('Failed to save final grades');
                  const data = await res.json();
                  toast.success(`Final grades for ${finalGrades.length} student(s) saved successfully!`, {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                  });
                } catch (err) {
                  toast.error(`Error saving final grades: ${err.message || err}`, {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                  });
                } finally {
                  setSavingFinals(false);
                }
              }}
              disabled={savingFinals || finalGrades.length === 0}
            >
              {savingFinals ? 'Saving...' : 'Save Final Grades'}
            </button>
          </div>
          </>
        ) : (
          <p className="text-muted">No grade data available. Enter grades in the assessment sections above.</p>
        )}
      </div>
      )}
    </div>
  );
};

export default FinalGradesSection;
