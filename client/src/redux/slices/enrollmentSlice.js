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

// Async thunk for enrolling in a course
export const enrollInCourse = createAsyncThunk(
  'enrollment/enrollInCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      return await apiCall('/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for unenrolling from a course
export const unenrollFromCourse = createAsyncThunk(
  'enrollment/unenrollFromCourse',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      await apiCall(`/api/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });
      return enrollmentId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching student's enrollments
export const fetchStudentEnrollments = createAsyncThunk(
  'enrollment/fetchStudentEnrollments',
  async (_, { rejectWithValue }) => {
    try {
      return await apiCall('/api/enrollments/student');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for checking enrollment status
export const checkEnrollmentStatus = createAsyncThunk(
  'enrollment/checkEnrollmentStatus',
  async (courseId, { rejectWithValue }) => {
    try {
      return await apiCall(`/api/enrollments/check/${courseId}`);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState: {
    enrollments: [],
    enrollmentStatus: {}, // courseId -> { enrolled: boolean, status: string }
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
    clearEnrollmentStatus: (state, action) => {
      delete state.enrollmentStatus[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      // Enroll in Course
      .addCase(enrollInCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const enrollment = action.payload?.data ?? action.payload;
        if (enrollment) {
          state.enrollments.push(enrollment);
          state.enrollmentStatus[enrollment.course_id] = { enrolled: true, status: 'active' };
        }
        toast.success('Enrolled in course successfully!');
      })
      .addCase(enrollInCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to enroll in course: ${action.payload}`);
      })
      // Unenroll from Course
      .addCase(unenrollFromCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(unenrollFromCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const enrollmentId = action.payload;
        // Find the enrollment to get the course_id
        const enrollment = state.enrollments.find(e => e.id === enrollmentId);
        if (enrollment) {
          const courseId = enrollment.course_id;
          state.enrollments = state.enrollments.filter(e => e.id !== enrollmentId);
          state.enrollmentStatus[courseId] = { enrolled: false, status: null };
        }
        toast.success('Unenrolled from course successfully!');
      })
      .addCase(unenrollFromCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to unenroll from course: ${action.payload}`);
      })
      // Fetch Student Enrollments
      .addCase(fetchStudentEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        const enrollments = action.payload?.data ?? action.payload ?? [];
        state.enrollments = enrollments;
        // Update enrollment status for each course
        enrollments.forEach(enrollment => {
          state.enrollmentStatus[enrollment.course_id] = {
            enrolled: enrollment.status === 'active',
            status: enrollment.status
          };
        });
      })
      .addCase(fetchStudentEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Check Enrollment Status
      .addCase(checkEnrollmentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkEnrollmentStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { courseId, enrolled, status } = action.payload;
        state.enrollmentStatus[courseId] = { enrolled, status };
      })
      .addCase(checkEnrollmentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, clearEnrollmentStatus } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;
