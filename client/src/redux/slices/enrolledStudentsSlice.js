import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/api';

export const fetchEnrolledStudents = createAsyncThunk('students/fetchEnrolledStudents', async (courseId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/api/grades/enrolled/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch enrolled students');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const enrolledStudentsSlice = createSlice({
  name: 'enrolledStudents',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnrolledStudents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEnrolledStudents.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchEnrolledStudents.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export default enrolledStudentsSlice.reducer;
