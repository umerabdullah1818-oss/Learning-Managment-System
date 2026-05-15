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

/**
 * Async thunk for fetching the next auto-generated Employee ID
 * Called when opening the Add Professor form to get the next sequential ID
 * Returns an object with the next employeeId (format: EMP00001)
 */
export const fetchNextEmployeeId = createAsyncThunk(
  'professor/fetchNextEmployeeId',
  async (_, { rejectWithValue }) => {
    try {
      const result = await apiCall('/api/professors/generate/next-id');
      return result.employeeId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for adding a professor
export const addProfessor = createAsyncThunk(
  'professor/addProfessor',
  async (professorData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_BASE_URL}/api/professors`, {
        method: 'POST',
        body: professorData,
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add professor' }));
        throw new Error(errorData.message || 'Failed to add professor');
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching all professors
export const fetchProfessors = createAsyncThunk(
  'professor/fetchProfessors',
  async ({ limit = 10, offset = 0 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
      const result = await apiCall(`/api/professors?${params}`);

      // Normalize response shapes to { professors: [], total }
      if (Array.isArray(result)) {
        return { professors: result, total: result.length };
      }
      if (result && Array.isArray(result.professors)) {
        return { professors: result.professors, total: result.total ?? result.count ?? result.professors.length };
      }
      if (result && Array.isArray(result.rows)) {
        return { professors: result.rows, total: result.total ?? result.count ?? result.rows.length };
      }
      if (result && Array.isArray(result.data)) {
        return { professors: result.data, total: result.total ?? result.count ?? result.data.length };
      }
      // If API returned a single professor object, wrap it into an array
      if (result && typeof result === 'object') {
        return { professors: [result], total: 1 };
      }
      return { professors: [], total: 0 };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching a single professor
export const fetchProfessorById = createAsyncThunk(
  'professor/fetchProfessorById',
  async (id, { rejectWithValue }) => {
    try {
      return await apiCall(`/api/professors/${id}`);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating a professor
export const updateProfessor = createAsyncThunk(
  'professor/updateProfessor',
  async ({ id, professorData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_BASE_URL}/api/professors/${id}`, {
        method: 'PUT',
        body: professorData,
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update professor' }));
        throw new Error(errorData.message || 'Failed to update professor');
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting a professor
export const deleteProfessor = createAsyncThunk(
  'professor/deleteProfessor',
  async (id, { rejectWithValue }) => {
    try {
      await apiCall(`/api/professors/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const professorSlice = createSlice({
  name: 'professor',
  initialState: {
    professors: [],
    currentProfessor: null,
    nextEmployeeId: null,
    loading: false,
    error: null,
    success: false,
    total: 0,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    resetCurrentProfessor: (state) => {
      state.currentProfessor = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchNextEmployeeId
      .addCase(fetchNextEmployeeId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNextEmployeeId.fulfilled, (state, action) => {
        state.loading = false;
        state.nextEmployeeId = action.payload;
        state.error = null;
      })
      .addCase(fetchNextEmployeeId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to fetch next employee ID: ${action.payload}`);
      })
      .addCase(addProfessor.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addProfessor.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.professors.push(action.payload.professor);
      })
      .addCase(addProfessor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to add professor: ${action.payload}`);
      })
      // Fetch Professors
      .addCase(fetchProfessors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfessors.fulfilled, (state, action) => {
        state.loading = false;
        // action.payload should be normalized to { professors: [], total }
        if (action.payload && Array.isArray(action.payload.professors)) {
          state.professors = action.payload.professors;
          state.total = action.payload.total ?? action.payload.professors.length;
        } else if (Array.isArray(action.payload)) {
          state.professors = action.payload;
          state.total = action.payload.length;
        } else {
          state.professors = [];
          state.total = 0;
        }
      })
      .addCase(fetchProfessors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to fetch professors: ${action.payload}`);
      })
      // Fetch Professor by ID
      .addCase(fetchProfessorById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfessorById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProfessor = action.payload;
      })
      .addCase(fetchProfessorById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to fetch professor: ${action.payload}`);
      })
      // Update Professor
      .addCase(updateProfessor.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProfessor.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Normalize payload: API may return { professor: {...} } or the professor object directly
        const updatedProfessor = (action.payload && action.payload.professor) ? action.payload.professor : action.payload;
        if (updatedProfessor) {
          const index = state.professors.findIndex(p => p.id === updatedProfessor.id);
          if (index !== -1) {
            state.professors[index] = updatedProfessor;
          }
          if (state.currentProfessor?.id === updatedProfessor.id) {
            state.currentProfessor = updatedProfessor;
          }
        }
      })
      .addCase(updateProfessor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to update professor: ${action.payload}`);
      })
      // Delete Professor
      .addCase(deleteProfessor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProfessor.fulfilled, (state, action) => {
        state.loading = false;
        state.professors = state.professors.filter(p => p.id !== action.payload);
        if (state.currentProfessor?.id === action.payload) {
          state.currentProfessor = null;
        }
        toast.success('Professor deleted successfully!');
      })
      .addCase(deleteProfessor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to delete professor: ${action.payload}`);
      });
  },
});

export const { clearError, clearSuccess, resetCurrentProfessor } = professorSlice.actions;
export default professorSlice.reducer;
