import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { API_BASE_URL } from '../../../config/api';
import { createGrade, updateGrade } from '../../../redux/slices/gradesSlice';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaChevronDown, FaChevronRight, FaSave } from 'react-icons/fa';

const MultiAssessmentSection = ({ assessmentType, students, courseId, initialGrades }) => {
  const dispatch = useDispatch();
  const storageKey = `grades_${courseId}_${assessmentType}`;
  const columnsStorageKey = `columns_${courseId}_${assessmentType}`;
  const counterStorageKey = `counter_${courseId}_${assessmentType}`;
  const expandedStateKey = `expanded_${courseId}_${assessmentType}`;

  // Load expanded state from localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(expandedStateKey);
    return saved ? JSON.parse(saved) : false; // default to Collapse
  });

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem(expandedStateKey, JSON.stringify(isExpanded));
  }, [isExpanded, expandedStateKey]);

  // Load columns from localStorage or create default
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem(columnsStorageKey);
    if (saved) {
      try {
        let cols = JSON.parse(saved);
        // Migrate old timestamp IDs to sequential IDs
        cols = cols.map((col, idx) => ({
          ...col,
          id: idx + 1
        }));
        return cols;
      } catch (e) {
        return [{ id: 1, name: `${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} 1` }];
      }
    }
    return [{ id: 1, name: `${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} 1` }];
  });

  // Get next available ID
  const getNextId = () => {
    const saved = localStorage.getItem(counterStorageKey);
    const currentCounter = saved ? parseInt(saved) : 1;
    const nextId = currentCounter + 1;
    localStorage.setItem(counterStorageKey, nextId.toString());
    return nextId;
  };

  const [grades, setGrades] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const oldGrades = JSON.parse(saved);
        const oldSavedCols = JSON.parse(localStorage.getItem(columnsStorageKey) || '[]');

        // Create mapping from old IDs to new sequential IDs
        const idMapping = {};
        oldSavedCols.forEach((col, idx) => {
          idMapping[col.id] = idx + 1;
        });

        // Migrate grades with new IDs
        const migratedGrades = {};
        Object.keys(oldGrades).forEach(studentUuid => {
          migratedGrades[studentUuid] = {};
          Object.keys(oldGrades[studentUuid]).forEach(oldColId => {
            const newColId = idMapping[oldColId] || oldColId;
            migratedGrades[studentUuid][newColId] = oldGrades[studentUuid][oldColId];
          });
        });

        return migratedGrades;
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const [saving, setSaving] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [columnToRemove, setColumnToRemove] = useState(null);

  // Inject small responsive styles once
  useEffect(() => {
    const id = 'multi-assessment-responsive-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = `
      /* Base styles for desktop/large screens (d-none d-md-block) */
      .multi-assessment .table thead th, .multi-assessment .table tbody td { white-space: nowrap; }
      
      /* Sticky columns for desktop/large tablet (>= 992px) */
      @media (min-width: 992px) {
        .multi-assessment .sticky-name { position: sticky; left: 0; z-index: 10; min-width: 160px; }
        .multi-assessment .sticky-email { position: sticky; left: 160px; z-index: 9; min-width: 180px; }
        .multi-assessment .table thead th, .multi-assessment .table tbody td { min-width: 180px; }
      }

      /* Tablet styles (768px < width < 992px) */
      @media (max-width: 991px) and (min-width: 768px) {
        .multi-assessment .sticky-name { position: sticky; left: 0; z-index: 10; min-width: 140px; }
        .multi-assessment .sticky-email { position: sticky; left: 140px; z-index: 9; min-width: 160px; }
        .multi-assessment .table thead th, .multi-assessment .table tbody td { min-width: 180px; }
        .multi-assessment .btn-label { display: inline; } /* Ensure labels show on tablets */
      }

      /* Mobile styles (max-width: 767px) - **KEY CHANGES START HERE** */
      @media (max-width: 767px) {
        /* Override sticky behavior to enable standard scrolling */
        .multi-assessment .sticky-name, .multi-assessment .sticky-email { 
          position: static !important; /* Forces normal flow, no sticking */
          left: auto !important; 
          z-index: auto !important;
          min-width: 120px; /* Reduced min-width for mobile */
          background: #f8f9fa; /* Ensure header background consistency, if applicable */
        }
        .multi-assessment .table tbody .sticky-name, .multi-assessment .table tbody .sticky-email {
          background: #fff; /* Ensure body background consistency */
        }

        /* Ensure all grade cells have a decent mobile width and nowrap */
        .multi-assessment .table thead th, .multi-assessment .table tbody td { 
          min-width: 140px; 
          max-width: 140px;
          white-space: nowrap; 
        }

        /* Hide button labels for space saving */
        .multi-assessment .btn-label { display: none; }

        /* Full width and touch-friendly height for numeric inputs in table cells */
        .multi-assessment .form-control-sm { 
          height: calc(1.5em + .5rem + 2px); /* Standardize height for better tapping */
          padding: .25rem .5rem; 
        }
        .multi-assessment .table input[type="number"] {
          width: 100% !important; 
          box-sizing: border-box;
        }

        /* For the Total (Obt/Out) and Weighted Marks column */
        .multi-assessment .table th:last-child, .multi-assessment .table td:last-child {
          min-width: 120px !important;
        }

        /* Make sure the table wrapper has horizontal scrolling on mobile */
        .multi-assessment .card-body > div {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch; /* For smooth iOS scrolling */
        }

        /* Apply position: sticky for the two header rows to stick to the top when scrolling down */
        .multi-assessment .table thead tr th {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #f8f9fa; /* Ensure visibility over content */
        }
        .multi-assessment .table thead tr:nth-child(2) th {
          top: 40px; /* Adjust based on the height of the first header row, roughly */
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Load weights from localStorage
  const weightsStorageKey = `weights_${courseId}_${assessmentType}`;
  const [weights, setWeights] = useState(() => {
    const saved = localStorage.getItem(weightsStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Initialize counter based on existing columns
  useEffect(() => {
    const maxId = Math.max(...columns.map(col => col.id), 0);
    if (maxId > 0) {
      localStorage.setItem(counterStorageKey, maxId.toString());
    }
  }, []);

  // Fetch course-level grading weights to use as defaults when a column weight is missing
  const [courseTypeWeight, setCourseTypeWeight] = useState(null);
  useEffect(() => {
    let mounted = true;
    async function loadCourseWeights() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE_URL}/api/grading-weights/${courseId}`, { headers: { Authorization: `Bearer ${token}` } });
        // If no course-level grading weights exist the API returns 404 — treat as no weights configured
        if (res.status === 404) {
          if (!mounted) return;
          setCourseTypeWeight(null);
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
          setCourseTypeWeight(mapping[assessmentType] || null);
        }
      } catch (err) {
        // ignore
      }
    }
    loadCourseWeights();
    return () => { mounted = false; };
  }, [courseId, assessmentType]);

  // Save columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(columnsStorageKey, JSON.stringify(columns));
  }, [columns, columnsStorageKey]);

  // Save grades to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(grades));
  }, [grades, storageKey]);

  // Save weights to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(weightsStorageKey, JSON.stringify(weights));
  }, [weights, weightsStorageKey]);

  // Total weight for this assessment section
  const weightTotal = columns.reduce((acc, c) => acc + (parseFloat(weights[c.id]) || 0), 0);

  const handleGradeChange = (studentUuid, colId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [studentUuid]: {
        ...prev[studentUuid],
        [colId]: {
          ...prev[studentUuid]?.[colId],
          [field]: value
        }
      }
    }));
  };

  const handleWeightChange = (colId, value) => {
    setWeights(prev => ({
      ...prev,
      [colId]: parseFloat(value) || 0
    }));
  };

  // Calculate totals for each assessment column (sum of obtained and total marks)
  const calculateTotals = () => {
    const totals = {};
    columns.forEach(col => {
      let totalObtained = 0;
      let totalMarks = 0;
      (students || []).forEach(student => {
        const gradeData = grades[student.userUuid]?.[col.id];
        if (gradeData) {
          totalObtained += parseFloat(gradeData.obtainedMarks) || 0;
          totalMarks += parseFloat(gradeData.totalMarks) || 0;
        }
      });
      totals[col.id] = { totalObtained, totalMarks };
    });
    return totals;
  };

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      const newId = getNextId();
      setColumns([...columns, { id: newId, name: newColumnName }]);
      setNewColumnName('');
    }
  };

  const handleRemoveColumn = (colId) => {
    setColumnToRemove(colId);
    setShowConfirmModal(true);
  };

  const handleRemoveColumnConfirm = async (colId) => {
    const colName = columns.find(c => c.id === colId)?.name || `Column ${colId}`;
    try {
      const token = localStorage.getItem('accessToken');
      // Call backend to delete grades for this assessment column
      const res = await fetch(`${API_BASE_URL}/api/grades/assessment/${courseId}/${assessmentType}/${colId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Server failed to delete grades');
      }
      const data = await res.json();
      // On success, remove locally
      setColumns(prevCols => prevCols.filter(col => col.id !== colId));
      setGrades(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(studentUuid => {
          if (updated[studentUuid]) {
            delete updated[studentUuid][colId];
          }
        });
        return updated;
      });
      setShowConfirmModal(false);
      setColumnToRemove(null);
      toast.success(`Column "${colName}" removed and ${data.deletedCount || (data.deletedCount === 0 ? 0 : data.data?.length)} grade(s) deleted from server.`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (error) {
      toast.error(`Error removing column: ${error.message}`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      // keep modal open for retry or cancel
    }
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      let savedCount = 0;
      for (const [studentUuid, studentGrades] of Object.entries(grades)) {
        for (const col of columns) {
          const gradeData = studentGrades[col.id];
          if (gradeData && (gradeData.totalMarks > 0 || gradeData.obtainedMarks > 0)) {
            const payload = {
              studentUuid,
              courseId: parseInt(courseId),
              assessmentType,
              assessmentId: col.id, // Use column id as assessmentId
              score: parseFloat(gradeData.obtainedMarks) || 0,
              maxScore: parseFloat(gradeData.totalMarks) || 0
            };
            // Determine weight to send: prefer column-level input, otherwise distribute course-type weight equally
            let w = null;
            if (weights && weights[col.id] !== undefined && weights[col.id] !== null && weights[col.id] !== '') {
              w = Number(weights[col.id]);
            } else if (courseTypeWeight !== null && columns.length > 0) {
              w = Number(courseTypeWeight) / columns.length;
            }
            if (w !== null && !isNaN(w)) payload.weight = w;
            // Always create new for demo; you can add logic to update if grade exists
            const res = await fetch(`${API_BASE_URL}/api/grades`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to save grade');
            savedCount++;
          }
        }
      }
      toast.success(`${savedCount} grade(s) saved successfully!`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (err) {
      toast.error(`Error saving grades: ${err.message}`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card mb-4 multi-assessment">
      <div className="card-header bg-light">

        {/* ================= DESKTOP (UNCHANGED) ================= */}
        <div className="d-none d-md-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            {(() => {
              switch (assessmentType) {
                case 'assignment': return 'Assignment';
                case 'quiz': return 'Quiz';
                case 'midterm': return 'Midterm';
                case 'final': return 'Final';
                default: return assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1);
              }
            })()}
          </h5>

          <div className="d-flex gap-2 align-items-center">
            <button
              className="btn btn-sm btn-outline-primary d-flex align-items-center"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
              <span className="ms-2">{isExpanded ? 'Collapse' : 'Expand'}</span>
            </button>

            <div className="input-group input-group-sm me-2" style={{ minWidth: 220 }}>
              <span className="input-group-text"><FaPlus /></span>
              <input
                type="text"
                className="form-control"
                placeholder={`Add ${assessmentType} name`}
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              />
            </div>

            <button
              className="btn btn-primary btn-sm d-flex align-items-center"
              onClick={handleAddColumn}
            >
              <FaPlus />
              <span className="ms-2">Add</span>
            </button>
          </div>
        </div>

        {/* ================= MOBILE ONLY ================= */}
        <div className="d-flex d-md-none flex-column gap-2">

          {/* Title */}
          <h6 className="mb-1 text-center">
            {assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)}
          </h6>

          {/* Expand Button */}
          <button
            className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            <span className="ms-2">{isExpanded ? 'Collapse' : 'Expand'}</span>
          </button>

          {/* Input */}
          <div className="input-group input-group-sm">
            <span className="input-group-text"><FaPlus /></span>
            <input
              type="text"
              className="form-control"
              placeholder={`Add ${assessmentType}`}
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
            />
          </div>

          {/* Add Button */}
          <button
            className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center"
            onClick={handleAddColumn}
          >
            <FaPlus />
            <span className="ms-2">Add</span>
          </button>

        </div>
      </div>

      {isExpanded && (
        <div className="card-body">
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-bordered table-sm">
              <thead className="table-light">
                <tr>
                  <th className="sticky-name" style={{ position: 'sticky', background: '#f8f9fa', zIndex: 10 }}>Student Name</th>
                  <th className="sticky-email" style={{ position: 'sticky', background: '#f8f9fa', zIndex: 10 }}>Email</th>
                  {columns.map(col => (
                    <th key={col.id} style={{ minWidth: '180px' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-truncate" style={{ maxWidth: 140 }}>{col.name}</span>
                        <button className="btn btn-sm btn-danger ms-2 d-flex align-items-center" onClick={() => handleRemoveColumn(col.id)} title="Remove column">
                          <FaTrash /> <span className="btn-label ms-1">Remove</span>
                        </button>
                      </div>
                    </th>
                  ))}
                  <th style={{ minWidth: '220px', textAlign: 'center' }}>Total (Obt/Out)</th>
                  <th style={{ minWidth: '160px', textAlign: 'center' }}>Weighted Marks</th>
                </tr>
                <tr>
                  <th className="sticky-name" style={{ position: 'sticky', background: '#f8f9fa', zIndex: 10 }}></th>
                  <th className="sticky-email" style={{ position: 'sticky', background: '#f8f9fa', zIndex: 10 }}></th>
                  {columns.map(col => (
                    <th key={`sub-${col.id}`} style={{ minWidth: '220px' }}>
                      <div className="d-flex justify-content-between">
                        <span>Total</span>
                        <span>Obtained</span>
                      </div>
                    </th>
                  ))}
                  <th style={{ minWidth: '220px', textAlign: 'center' }}>Total</th>
                  <th style={{ minWidth: '160px', textAlign: 'center' }}>Weighted</th>
                </tr>
              </thead>
              <tbody>
                {/* Weight Row */}
                <tr style={{ backgroundColor: '#e7f3ff' }}>
                  <td className="sticky-name" style={{ position: 'sticky', background: '#e7f3ff', zIndex: 9 }}>
                    <strong>Weight</strong>
                  </td>
                  <td className="sticky-email" style={{ position: 'sticky', background: '#e7f3ff', zIndex: 9 }}>
                    <small>(0-100)</small>
                  </td>
                  {columns.map(col => (
                    <td key={`weight-${col.id}`} style={{ minWidth: '220px' }}>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Weight"
                        value={weights[col.id] || ''}
                        onChange={e => handleWeightChange(col.id, e.target.value)}
                        min="0"
                        max="100"
                      />
                    </td>
                  ))}
                  <td style={{ minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className={`badge ${weightTotal === 100 ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {weightTotal}
                    </span>
                  </td>
                </tr>
                {/* Student Rows */}
                {students && students.length > 0 ? students.map(student => (
                  <tr key={student.userUuid}>
                    <td className="sticky-name" style={{ position: 'sticky', background: '#fff', zIndex: 9 }}>
                      <strong>{student.studentFirstName || student.studentName || 'Unknown'}</strong>
                    </td>
                    <td className="sticky-email" style={{ position: 'sticky', background: '#fff', zIndex: 9 }}>
                      <small>{student.studentEmail || 'N/A'}</small>
                    </td>
                    {columns.map(col => (
                      <td key={col.id} style={{ minWidth: '220px' }}>
                        <div className="d-flex gap-2">
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Total"
                            value={grades[student.userUuid]?.[col.id]?.totalMarks || ''}
                            onChange={e => handleGradeChange(student.userUuid, col.id, 'totalMarks', e.target.value)}
                            min="0"
                          />
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Obtained"
                            value={grades[student.userUuid]?.[col.id]?.obtainedMarks || ''}
                            onChange={e => handleGradeChange(student.userUuid, col.id, 'obtainedMarks', e.target.value)}
                            min="0"
                          />
                        </div>
                      </td>
                    ))}
                    {/* Per-student total column */}
                    <td style={{ minWidth: '220px', verticalAlign: 'middle', textAlign: 'center' }}>
                      {(() => {
                        let sObt = 0;
                        let sTot = 0;
                        columns.forEach(c => {
                          const g = grades[student.userUuid]?.[c.id];
                          if (g) {
                            sObt += parseFloat(g.obtainedMarks) || 0;
                            sTot += parseFloat(g.totalMarks) || 0;
                          }
                        });
                        return `${sObt.toFixed(2)} / ${sTot.toFixed(2)}`;
                      })()}
                    </td>
                    <td style={{ minWidth: '160px', verticalAlign: 'middle', textAlign: 'center' }}>
                      {(() => {
                        let weightSum = 0;
                        let weightedSum = 0;
                        columns.forEach(c => {
                          const w = parseFloat(weights[c.id]) || 0;
                          const g = grades[student.userUuid]?.[c.id];
                          if (g && (parseFloat(g.totalMarks) || 0) > 0) {
                            const frac = (parseFloat(g.obtainedMarks) || 0) / (parseFloat(g.totalMarks) || 1);
                            weightedSum += frac * w;
                          }
                          weightSum += w;
                        });
                        if (weightSum <= 0) return '-';
                        return `${weightedSum.toFixed(2)} / ${weightSum.toFixed(2)}`;
                      })()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={columns.length + 2} className="text-center text-muted">
                      No students enrolled in this course
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
          <button className="btn btn-success btn-sm w-100 d-flex justify-content-center align-items-center" onClick={handleSaveGrades} disabled={saving}>
            <FaSave />
            <span className="btn-label ms-2">{saving ? 'Saving...' : `Save ${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} Grades`}</span>
          </button>
        </div>
      )}
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog">
          <div className="modal-dialog modal-sm" role="document">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark d-flex align-items-center">
                <h5 className="modal-title mb-0">Confirm Column Removal</h5>
                <button type="button" className="btn-close ms-auto" onClick={() => setShowConfirmModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p className="mb-2">Are you sure you want to remove the column <strong>"{columns.find(c => c.id === columnToRemove)?.name}"</strong>?</p>
                <p className="text-danger mb-0"><small>This action will also delete all grades associated with this column and cannot be undone.</small></p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger d-flex align-items-center" onClick={() => handleRemoveColumnConfirm(columnToRemove)}>
                  <FaTrash /> <span className="btn-label ms-2">Delete Column</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiAssessmentSection;
