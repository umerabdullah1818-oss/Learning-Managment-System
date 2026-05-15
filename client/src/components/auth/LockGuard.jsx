import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LockGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isLocked = sessionStorage.getItem('isLocked') === 'true';
    const isAuth = !!localStorage.getItem('accessToken');

    // If locked and authenticated, force user to stay on /lock
    if (isLocked && isAuth && location.pathname !== '/lock') {
      // Save current attempt as returnTo if not already set
      if (!sessionStorage.getItem('returnTo')) {
        sessionStorage.setItem('returnTo', location.pathname + location.search + location.hash);
      }
      navigate('/lock', { replace: true });
    }
  }, [location, navigate]);

  return null;
}
