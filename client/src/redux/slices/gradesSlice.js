import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/api';

export const createGrade = createAsyncThunk('grades/createGrade', async (payload, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/grades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create grade');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateGrade = createAsyncThunk('grades/updateGrade', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/grades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update grade');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchGradesByCourse = createAsyncThunk('grades/fetchGradesByCourse', async (courseId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/grades/course/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch grades');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchStudentGradesForCourse = createAsyncThunk('grades/fetchStudentGradesForCourse', async ({ studentUuid, courseId }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/grades/student/${studentUuid}/course/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch student grades');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const gradesSlice = createSlice({
  name: 'grades',
  initialState: { list: [], current: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createGrade.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(createGrade.rejected, (state, action) => { state.error = action.payload; })
      .addCase(updateGrade.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(fetchGradesByCourse.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGradesByCourse.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchGradesByCourse.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchStudentGradesForCourse.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(fetchStudentGradesForCourse.rejected, (state, action) => { state.error = action.payload; });
  }
});

export default gradesSlice.reducer;
