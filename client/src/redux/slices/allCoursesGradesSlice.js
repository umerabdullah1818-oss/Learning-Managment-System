import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/api';

export const fetchAllCoursesGrades = createAsyncThunk('allCoursesGrades/fetchAll', async (studentUuid, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/grades/student/${studentUuid}/all-courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch grades');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchStudentFinalGradesSummary = createAsyncThunk('allCoursesGrades/fetchFinalSummary', async (studentUuid, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/final-grades/student/${studentUuid}/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch final grades');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const slice = createSlice({
  name: 'allCoursesGrades',
  initialState: { data: [], finalSummary: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCoursesGrades.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllCoursesGrades.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchAllCoursesGrades.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchStudentFinalGradesSummary.fulfilled, (state, action) => { state.finalSummary = action.payload; })
      .addCase(fetchStudentFinalGradesSummary.rejected, (state, action) => { state.error = action.payload; });
  }
});

export default slice.reducer;
