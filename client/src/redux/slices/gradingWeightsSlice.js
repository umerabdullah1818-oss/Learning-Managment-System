import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/api';

export const fetchWeights = createAsyncThunk('gradingWeights/fetchWeights', async (courseId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/grading-weights/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // If the server returns 404 (no weights for this course), return null so UI can use defaults
    if (res.status === 404) {
      // attempt to parse message for logging, but resolve with null
      try { await res.json(); } catch (e) { /* ignore */ }
      return null;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch weights');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const upsertWeights = createAsyncThunk('gradingWeights/upsertWeights', async ({ courseId, weights }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/grading-weights/${courseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(weights)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save weights');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const gradingWeightsSlice = createSlice({
  name: 'gradingWeights',
  initialState: { current: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeights.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWeights.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchWeights.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(upsertWeights.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(upsertWeights.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(upsertWeights.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export default gradingWeightsSlice.reducer;
