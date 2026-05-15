import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config/api';

// Helper function to make API calls with fetch
const apiCall = async (url, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const token = localStorage.getItem('accessToken');
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const response = await fetch(fullUrl, defaultOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Async thunk for adding a course
export const addCourse = createAsyncThunk(
  'course/addCourse',
  async (courseData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        body: courseData, // FormData object
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add course' }));
        throw new Error(errorData.message || 'Failed to add course');
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching all courses
export const fetchCourses = createAsyncThunk(
  'course/fetchCourses',
  async ({ limit = 10, offset = 0, ...filters } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params.append(key, filters[key]);
        }
      });
      return await apiCall(`/api/courses?${params}`);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching a single course
export const fetchCourseById = createAsyncThunk(
  'course/fetchCourseById',
  async (id, { rejectWithValue }) => {
    try {
      return await apiCall(`/api/courses/${id}`);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating a course
export const updateCourse = createAsyncThunk(
  'course/updateCourse',
  async ({ id, courseData }, { rejectWithValue }) => {
    try {
      // If courseData is a FormData (contains a file), use fetch directly
      if (courseData instanceof FormData) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
          method: 'PUT',
          body: courseData,
          credentials: 'include',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            // Let browser set Content-Type with boundary
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to update course' }));
          throw new Error(errorData.message || 'Failed to update course');
        }

        return response.json();
      }

      return await apiCall(`/api/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(courseData),
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting a course
export const deleteCourse = createAsyncThunk(
  'course/deleteCourse',
  async (id, { rejectWithValue }) => {
    try {
      await apiCall(`/api/courses/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching courses by professor
export const fetchCoursesByProfessor = createAsyncThunk(
  'course/fetchCoursesByProfessor',
  async (professorId, { rejectWithValue }) => {
    try {
      return await apiCall(`/api/courses/professor/${professorId}`);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching courses by department
export const fetchCoursesByDepartment = createAsyncThunk(
  'course/fetchCoursesByDepartment',
  async (department, { rejectWithValue }) => {
    try {
      return await apiCall(`/api/courses/department/${department}`);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const courseSlice = createSlice({
  name: 'course',
  initialState: {
    courses: [],
    currentCourse: null,
    loading: false,
    error: null,
    success: false,
    pagination: { page: 1, limit: 10, total: 0 },
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    resetCurrentCourse: (state) => {
      state.currentCourse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Add Course
      .addCase(addCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // backend may return { success: true, data: course } or { course: ... }
        const newCourse = action.payload?.data ?? action.payload?.course ?? action.payload;
        if (newCourse) state.courses.push(newCourse);
      })
      .addCase(addCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to add course: ${action.payload}`);
      })
      // Fetch Courses
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        // backend returns { success: true, data: [...], pagination: {...} }
        const data = action.payload?.data ?? action.payload ?? [];
        state.courses = data;
        state.pagination = action.payload?.pagination ?? state.pagination;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Course by ID
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Course
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updated = action.payload?.data ?? action.payload?.course ?? action.payload;
        if (updated) {
          const id = updated.id ?? updated._id ?? null;
          const index = state.courses.findIndex(c => c.id === id);
          if (index !== -1) {
            state.courses[index] = updated;
          }
          if (state.currentCourse?.id === id) {
            state.currentCourse = updated;
          }
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Course
      .addCase(deleteCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.courses = state.courses.filter(c => c.id !== action.payload);
        if (state.currentCourse?.id === action.payload) {
          state.currentCourse = null;
        }
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to delete course: ${action.payload}`);
      })
      // Fetch Courses by Professor
      .addCase(fetchCoursesByProfessor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoursesByProfessor.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload?.data ?? action.payload ?? [];
        state.courses = data;
      })
      .addCase(fetchCoursesByProfessor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Courses by Department
      .addCase(fetchCoursesByDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoursesByDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCoursesByDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, resetCurrentCourse } = courseSlice.actions;
export default courseSlice.reducer;
