import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';


export default function useAutoLock({ timeoutMs = 20 * 60 * 1000 } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);
  const lastPathRef = useRef(location.pathname + location.search + location.hash);

  useEffect(() => {
    const isAuth = !!localStorage.getItem('accessToken');

    const lock = () => {
      if (!isAuth) return; // don't lock public/unauthenticated users

      const currentPath = lastPathRef.current || (location.pathname + location.search + location.hash);
      if (!sessionStorage.getItem('returnTo')) {
        sessionStorage.setItem('returnTo', currentPath);
      }
      sessionStorage.setItem('isLocked', 'true');

      if (location.pathname !== '/lock') {
        navigate('/lock', { replace: true });
      }
    };

    const resetTimer = () => {
      if (sessionStorage.getItem('isLocked') === 'true') return; // don't reset while locked
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(lock, timeoutMs);
    };

    const activityEvents = ['mousemove', 'mousedown', 'click', 'scroll', 'keydown', 'touchstart', 'wheel'];

    const onActivity = () => {
      // update last seen path except when on lock
      if (location.pathname !== '/lock') {
        lastPathRef.current = location.pathname + location.search + location.hash;
      }
      resetTimer();
    };

    // Start/attach only when authenticated
    if (isAuth) {
      activityEvents.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
      // also handle visibility changes as an activity signal
      document.addEventListener('visibilitychange', onActivity);
      resetTimer();
    }

    // Keep lastPath updated on route change
    lastPathRef.current = location.pathname + location.search + location.hash;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach((evt) => window.removeEventListener(evt, onActivity));
      document.removeEventListener('visibilitychange', onActivity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, location.hash, timeoutMs]);
}
