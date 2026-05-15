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

// Async thunk for creating an assignment
export const createAssignment = createAsyncThunk(
  'assignment/createAssignment',
  async (assignmentData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_BASE_URL}/api/assignments`, {
        method: 'POST',
        body: assignmentData, // FormData object
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create assignment' }));
        throw new Error(errorData.message || 'Failed to create assignment');
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching assignments by professor
export const fetchAssignmentsByProfessor = createAsyncThunk(
  'assignment/fetchAssignmentsByProfessor',
  async (professorUuid, { rejectWithValue }) => {
    try {
      return await apiCall(`/api/assignments/professor/${professorUuid}`);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching assignments by course
export const fetchAssignmentsByCourse = createAsyncThunk(
  'assignment/fetchAssignmentsByCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      return await apiCall(`/api/assignments/course/${courseId}`);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching a single assignment
export const fetchAssignmentById = createAsyncThunk(
  'assignment/fetchAssignmentById',
  async (id, { rejectWithValue }) => {
    try {
      return await apiCall(`/api/assignments/${id}`);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating assignment status
export const updateAssignmentStatus = createAsyncThunk(
  'assignment/updateAssignmentStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await apiCall(`/api/assignments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating assignment
export const updateAssignment = createAsyncThunk(
  'assignment/updateAssignment',
  async ({ id, assignmentData }, { rejectWithValue }) => {
    try {
      // If assignmentData is a FormData (contains file), use fetch directly and avoid setting Content-Type
      if (assignmentData instanceof FormData) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/api/assignments/${id}`, {
          method: 'PUT',
          body: assignmentData,
          credentials: 'include',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to update assignment' }));
          throw new Error(errorData.message || 'Failed to update assignment');
        }

        return response.json();
      }

      return await apiCall(`/api/assignments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(assignmentData),
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting an assignment
export const deleteAssignment = createAsyncThunk(
  'assignment/deleteAssignment',
  async (id, { rejectWithValue }) => {
    try {
      return await apiCall(`/api/assignments/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const assignmentSlice = createSlice({
  name: 'assignment',
  initialState: {
    assignments: [],
    assignmentsByProfessor: [],
    assignmentsByCourse: [],
    currentAssignment: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    clearCurrentAssignment: (state) => {
      state.currentAssignment = null;
    },
  },
  extraReducers: (builder) => {
    // Create assignment
    builder
      .addCase(createAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.assignments.push(action.payload.data);
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch assignments by professor
    builder
      .addCase(fetchAssignmentsByProfessor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentsByProfessor.fulfilled, (state, action) => {
        state.loading = false;
        state.assignmentsByProfessor = action.payload.data || [];
      })
      .addCase(fetchAssignmentsByProfessor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch assignments by course
    builder
      .addCase(fetchAssignmentsByCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentsByCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.assignmentsByCourse = action.payload.data || [];
      })
      .addCase(fetchAssignmentsByCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch single assignment
    builder
      .addCase(fetchAssignmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAssignment = action.payload.data;
      })
      .addCase(fetchAssignmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update assignment status
    builder
      .addCase(updateAssignmentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAssignmentStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedAssignment = action.payload.data;
        const index = state.assignments.findIndex(a => a.id === updatedAssignment.id);
        if (index !== -1) {
          state.assignments[index] = updatedAssignment;
        }
        if (state.currentAssignment?.id === updatedAssignment.id) {
          state.currentAssignment = updatedAssignment;
        }
      })
      .addCase(updateAssignmentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update assignment
    builder
      .addCase(updateAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedAssignment = action.payload.data;
        const index = state.assignments.findIndex(a => a.id === updatedAssignment.id);
        if (index !== -1) {
          state.assignments[index] = updatedAssignment;
        }
        if (state.currentAssignment?.id === updatedAssignment.id) {
          state.currentAssignment = updatedAssignment;
        }
        // Update assignmentsByProfessor and assignmentsByCourse lists if present
        state.assignmentsByProfessor = state.assignmentsByProfessor.map(a => (a.id === updatedAssignment.id ? updatedAssignment : a));
        state.assignmentsByCourse = state.assignmentsByCourse.map(a => (a.id === updatedAssignment.id ? updatedAssignment : a));
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete assignment
    builder
      .addCase(deleteAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.assignments = state.assignments.filter(a => a.id !== action.meta.arg);
        state.assignmentsByProfessor = state.assignmentsByProfessor.filter(a => a.id !== action.meta.arg);
        state.assignmentsByCourse = state.assignmentsByCourse.filter(a => a.id !== action.meta.arg);
      })
      .addCase(deleteAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, clearCurrentAssignment } = assignmentSlice.actions;
export default assignmentSlice.reducer;
