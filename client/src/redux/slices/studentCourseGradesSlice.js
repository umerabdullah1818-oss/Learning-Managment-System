import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/api';

export const calculateStudentCourseGrade = createAsyncThunk('studentCourseGrades/calculate', async ({ studentUuid, courseId }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/reports/student/${studentUuid}/course/${courseId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to calculate');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchStudentCourseGrade = createAsyncThunk('studentCourseGrades/fetch', async ({ studentUuid, courseId }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/reports/student/${studentUuid}/course/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const studentCourseGradesSlice = createSlice({
  name: 'studentCourseGrades',
  initialState: { current: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(calculateStudentCourseGrade.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(calculateStudentCourseGrade.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(calculateStudentCourseGrade.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchStudentCourseGrade.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(fetchStudentCourseGrade.rejected, (state, action) => { state.error = action.payload; });
  }
});

export default studentCourseGradesSlice.reducer;
