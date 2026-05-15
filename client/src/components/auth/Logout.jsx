import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Dispatch logout action to clear state and localStorage
    dispatch(logout());
    // Show success toast then navigate to login page immediately
    toast.success('Logged out successfully!');
    navigate('/');
  }, [dispatch, navigate]);
  return null;
};

export default Logout;
