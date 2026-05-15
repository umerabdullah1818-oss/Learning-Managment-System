import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/api';

export const fetchProfessorCourses = createAsyncThunk('courses/fetchProfessorCourses', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/professors/courses/assigned`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch courses');
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const coursesSlice = createSlice({
  name: 'courses',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfessorCourses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProfessorCourses.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchProfessorCourses.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export default coursesSlice.reducer;
