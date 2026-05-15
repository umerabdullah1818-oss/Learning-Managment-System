import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// timeoutMs default will be provided when used; here we export helper
export default function useAutoLock({ timeoutMs = 20 * 60 * 1000 } = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let timerId;

    const lockNow = () => {
      // only lock if user is authenticated
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      sessionStorage.setItem('returnTo', location.pathname + location.search);
      sessionStorage.setItem('isLocked', '1');
      navigate('/lock');
    };

    const resetTimer = () => {
      clearTimeout(timerId);
      timerId = setTimeout(lockNow, timeoutMs);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));

    // start timer only if logged in
    if (localStorage.getItem('accessToken')) resetTimer();

    return () => {
      clearTimeout(timerId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [navigate, location, timeoutMs]);
}
