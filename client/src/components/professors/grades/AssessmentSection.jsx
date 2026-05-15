import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { API_BASE_URL } from '../../../config/api';
import { createGrade, updateGrade } from '../../../redux/slices/gradesSlice';
import { FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AssessmentSection = ({ assessmentType, students, courseId, initialGrades }) => {
  const dispatch = useDispatch();
  const [grades, setGrades] = useState({});
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState('');

  // Fetch course-level grading weights to use as default
  useEffect(() => {
    let mounted = true;
    async function loadWeights() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE_URL}/api/grading-weights/${courseId}`, { headers: { Authorization: `Bearer ${token}` } });
        // If no course-level grading weights exist the API may return 404 — treat as no weights configured
        if (res.status === 404) {
          if (!mounted) return;
          setWeight(null);
          return;
        }
        if (!res.ok) return; // other errors — silently ignore here
        const data = await res.json();
        if (!mounted) return;
        if (data && data.data) {
          const mapping = {
            assignment: data.data.assignment_weight,
            quiz: data.data.quiz_weight,
            midterm: data.data.midterm_weight,
            final: data.data.final_weight
          };
          if (mapping[assessmentType] !== undefined) setWeight(mapping[assessmentType]);
        }
      } catch (err) {
        // ignore
      }
    }
    loadWeights();
    return () => { mounted = false; };
  }, [courseId, assessmentType]);

  useEffect(() => {
    const initialData = {};
    if (initialGrades) {
      students?.forEach(student => {
        const studentGrades = initialGrades[student.userUuid];
        if (studentGrades && studentGrades[assessmentType]) {
          const grade = studentGrades[assessmentType];
          initialData[student.userUuid] = {
            id: grade.id,
            totalMarks: grade.max_score,
            obtainedMarks: grade.score
          };
        }
      });
    }
    setGrades(initialData);
  }, [students, initialGrades, assessmentType]);

  const handleGradeChange = (studentUuid, field, value) => {
    setGrades(prev => ({
      ...prev,
      [studentUuid]: {
        ...prev[studentUuid],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      for (const [studentUuid, gradeData] of Object.entries(grades)) {
        if (gradeData.totalMarks > 0 || gradeData.obtainedMarks > 0) {
          const payload = {
            studentUuid,
            courseId: parseInt(courseId),
            assessmentType,
            score: gradeData.obtainedMarks,
            maxScore: gradeData.totalMarks
          };

          // include weight automatically (use component weight as default)
          if (weight !== undefined && weight !== null && weight !== '') {
            payload.weight = Number(weight);
          }

          if (gradeData.id) {
            // Update existing
            const res = await fetch(`${API_BASE_URL}/grades/${gradeData.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ score: payload.score, max_score: payload.maxScore, weight: payload.weight })
            });
            if (!res.ok) throw new Error('Failed to update grade');
          } else {
            // Create new
            const res = await fetch(`${API_BASE_URL}/grades`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to save grade');
          }
        }
      }
      toast.success(`${assessmentType.toUpperCase()} grades saved successfully!`);
    } catch (err) {
      toast.error(`Error saving grades: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    const titles = {
      quiz: 'Quiz',
      assignment: 'Assignment',
      midterm: 'Midterm Exam',
      final: 'Final Exam'
    };
    return titles[assessmentType] || assessmentType;
  };

  return (
    <div className="card">
      <div className="card-header bg-light">
        <h5 className="mb-0">{getTitle()}</h5>
      </div>
      <div className="card-body">
        {students && students.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Student</th>
                    <th>Total Marks</th>
                    <th>Obtained Marks</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const studentGrades = grades[student.userUuid] || {};
                    const percentage = studentGrades.totalMarks > 0
                      ? ((studentGrades.obtainedMarks / studentGrades.totalMarks) * 100).toFixed(2)
                      : 0;

                    return (
                      <tr key={student.userUuid}>
                        <td>
                          <small>
                            <strong>{student.studentName}</strong>
                            <br />
                            <span className="text-muted">{student.studentEmail}</span>
                          </small>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={studentGrades.totalMarks || ''}
                            onChange={(e) => handleGradeChange(student.userUuid, 'totalMarks', e.target.value)}
                            placeholder="0"
                            min="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={studentGrades.obtainedMarks || ''}
                            onChange={(e) => handleGradeChange(student.userUuid, 'obtainedMarks', e.target.value)}
                            placeholder="0"
                            min="0"
                          />
                        </td>
                        <td className="text-center">
                          <span className="badge bg-info">{percentage}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              className="btn btn-success btn-sm w-100"
              onClick={handleSaveGrades}
              disabled={saving}
            >
              {saving ? 'Saving...' : `Save ${getTitle()} Grades`}
            </button>
          </>
        ) : (
          <p className="text-muted">No students enrolled in this course yet.</p>
        )}
      </div>
    </div>
  );
};

export default AssessmentSection;
