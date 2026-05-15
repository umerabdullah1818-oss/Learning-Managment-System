import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config/api';

// Async thunk for user registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for user login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store the access token in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      // Decode the token to get user info
      const decoded = jwtDecode(data.accessToken);
      localStorage.setItem('username', decoded.UserInfo.username || decoded.UserInfo.email || 'Admin');

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for forgot password
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send recovery email');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for reset password
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch current user's profile (used on app load / refresh)
export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No auth token');

      const response = await fetch(`${API_BASE_URL}/api/auth/get-profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');

      return data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    studentDetails: null,
    token: localStorage.getItem('accessToken') || null,
    loading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.studentDetails = null;
      state.isAuthenticated = false;
      state.token = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('username');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('avatarUrl');
    },
    hydrateAuth: (state) => {
      // Hydrate Redux state from localStorage on app startup
      const token = localStorage.getItem('accessToken');
      const storedUser = (() => {
        try {
          const raw = localStorage.getItem('user');
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();

      if (token && storedUser) {
        state.token = token;
        state.user = storedUser;
        state.isAuthenticated = true;
      }
    },
    checkAuth: (state) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        state.isAuthenticated = true;
        state.token = token;
        // Decode the token to get user info
        const decoded = jwtDecode(token);
        state.user = { role: decoded.UserInfo.role, username: decoded.UserInfo.username || decoded.UserInfo.email, uuid: decoded.UserInfo.uuid, professorId: decoded.UserInfo.professorId };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Registration cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken || localStorage.getItem('accessToken') || null;
        state.isAuthenticated = true;
        state.error = null;
        // If student, set studentDetails
        if (action.payload.user.role === 'student' && action.payload.studentDetails) {
          state.studentDetails = action.payload.studentDetails;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Registration failed: ${action.payload}`);
      })
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.error = null;
        state.token = action.payload.accessToken;
        // Decode the token to get user info
        const decoded = jwtDecode(action.payload.accessToken);
        state.user = { role: decoded.UserInfo.role, username: decoded.UserInfo.username || decoded.UserInfo.email, uuid: decoded.UserInfo.uuid, professorId: decoded.UserInfo.professorId, firstLogin: action.payload.user ? action.payload.user.firstLogin : undefined };
        // Pick avatar from returned details (professorDetails or studentDetails) or fallback to localStorage
        const prof = action.payload.professorDetails;
        const stud = action.payload.studentDetails;
        let avatar = null;
        if (prof) avatar = prof.avatar || prof.profile_image || prof.profileImage || prof.profileImageUrl;
        else if (stud) avatar = stud.avatar || stud.profile_image || stud.profileImage || stud.profileImageUrl;
        else if (action.payload.user && (action.payload.user.avatar || action.payload.user.profileImage || action.payload.user.profile_image)) {
          avatar = action.payload.user.avatar || action.payload.user.profileImage || action.payload.user.profile_image;
        }
        state.user.avatar = avatar || null;
        state.user.name = action.payload.user?.name || decoded.UserInfo.username || decoded.UserInfo.email;
        
        // Persist full user object to localStorage for page refresh
        localStorage.setItem('user', JSON.stringify(state.user));
        localStorage.setItem('role', state.user.role);
        
        // If student, set studentDetails
        if (decoded.UserInfo.role === 'student' && action.payload.studentDetails) {
          state.studentDetails = action.payload.studentDetails;
        }
      })

      // Fetch profile handlers
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // action.payload is the user object returned from server
        state.user = {
          role: action.payload.role,
          username: action.payload.username || action.payload.email,
          uuid: action.payload.uuid,
          firstLogin: action.payload.firstLogin,
          // Use avatar from server payload if provided; otherwise null
          avatar: action.payload.avatar || null
        };
        state.isAuthenticated = true;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // If fetch failed, clear auth state
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
        localStorage.removeItem('accessToken');
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Login failed: ${action.payload}`);
      })
      // Forgot password cases
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        toast.success('Recovery email sent successfully!');
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to send recovery email: ${action.payload}`);
      })
      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        toast.success('Password reset successful!');
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Password reset failed: ${action.payload}`);
      });
  },
});

export const { clearError, logout, checkAuth, hydrateAuth } = authSlice.actions;
export default authSlice.reducer;
