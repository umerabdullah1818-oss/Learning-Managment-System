import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWeights, upsertWeights } from '../../../redux/slices/gradingWeightsSlice';

const SetGradingWeights = ({ courseId }) => {
  const dispatch = useDispatch();
  const { current, loading, error } = useSelector(state => state.gradingWeights || {});
  const [weights, setWeights] = useState({ assignmentWeight: 20, quizWeight: 20, midtermWeight: 25, finalWeight: 35 });

  useEffect(() => {
    if (courseId && courseId.trim()) dispatch(fetchWeights(courseId));
  }, [courseId, dispatch]);

  useEffect(() => {
    if (current) {
      setWeights({
        assignmentWeight: current.assignment_weight ?? 20,
        quizWeight: current.quiz_weight ?? 20,
        midtermWeight: current.midterm_weight ?? 25,
        finalWeight: current.final_weight ?? 35
      });
    }
  }, [current]);

  const handleChange = (e) => {
    setWeights({ ...weights, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(upsertWeights({ courseId, weights }));
    // optionally show toast
  };

  return (
    <div className="card p-3">
      <h5>Set Grading Weights</h5>
      {error && <div className="text-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label>Assignments (%)</label>
          <input type="number" name="assignmentWeight" value={weights.assignmentWeight} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-2">
          <label>Quizzes (%)</label>
          <input type="number" name="quizWeight" value={weights.quizWeight} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-2">
          <label>Midterm (%)</label>
          <input type="number" name="midtermWeight" value={weights.midtermWeight} onChange={handleChange} className="form-control" />
        </div>
        <div className="mb-2">
          <label>Final (%)</label>
          <input type="number" name="finalWeight" value={weights.finalWeight} onChange={handleChange} className="form-control" />
        </div>
        <div className="mt-2">
          <button className="btn btn-primary" disabled={loading}>Save Weights</button>
        </div>
      </form>
    </div>
  );
};

export default SetGradingWeights;
