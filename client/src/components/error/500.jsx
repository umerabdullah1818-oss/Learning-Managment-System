import React, { useEffect, useState } from 'react';

const Error500 = () => {
  const [countdown, setCountdown] = useState(30);
  const [currentTime, setCurrentTime] = useState('--:--');

  useEffect(() => {
    // Update time
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentTime(timeString);
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Stop countdown on click
    const handleClick = () => {
      clearInterval(countdownInterval);
      document.querySelector('.refresh-hint').style.display = 'none';
    };
    document.addEventListener('click', handleClick);

    console.log('500 Error - Internal Server Error:', window.location.pathname);

    return () => {
      clearInterval(timeInterval);
      clearInterval(countdownInterval);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="error-page">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="error-container">
        <div className="error-icon">
          <i className="bi bi-gear"></i>
        </div>
        <h1 className="error-code">500</h1>
        <h2 className="error-title">Internal Server Error</h2>
        <p className="error-message">
          We're sorry, but something went wrong on our server. Our team has been notified and is working to fix the issue.
        </p>
        <div className="error-actions">
          <a href="javascript:location.reload()" className="error-btn btn-primary-error">
            <i className="bi bi-arrow-clockwise"></i>
            Try Again
          </a>
          <a href="/" className="error-btn btn-secondary-error">
            <i className="bi bi-house-door"></i>
            Go to Dashboard
          </a>
        </div>
        <div className="error-details">
          <h4><i className="bi bi-info-circle"></i> What you can try:</h4>
          <ul>
            <li>
              <i className="bi bi-arrow-clockwise"></i>
              Refresh the page - the issue might be temporary
            </li>
            <li>
              <i className="bi bi-clock-history"></i>
              Wait a few minutes and try again
            </li>
            <li>
              <i className="bi bi-trash3"></i>
              Clear your browser cache and cookies
            </li>
            <li>
              <i className="bi bi-browser-chrome"></i>
              Try using a different browser
            </li>
            <li>
              <i className="bi bi-headset"></i>
              Contact support if the problem persists
            </li>
          </ul>
        </div>
        <div className="status-info">
          <div className="status-item">
            <h5>Error Code</h5>
            <p>500</p>
          </div>
          <div className="status-item">
            <h5>Time</h5>
            <p>{currentTime}</p>
          </div>
          <div className="status-item">
            <h5>Status</h5>
            <p>Investigating</p>
          </div>
        </div>
        <div className="refresh-hint">
          <div className="spinner"></div>
          <span>Auto-refresh in <span>{countdown}</span> seconds</span>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .error-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          position: relative;
          overflow: hidden;
        }
        .error-container {
          text-align: center;
          z-index: 10;
          padding: 2rem;
          max-width: 700px;
          margin: 0 auto;
        }
        .error-icon {
          font-size: 80px;
          color: rgba(255,255,255,0.8);
          margin-bottom: 30px;
          animation: rotate 2s linear infinite;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .error-code {
          font-size: 10rem;
          font-weight: 700;
          color: white;
          text-shadow: 3px 3px 20px rgba(0,0,0,0.2);
          margin-bottom: 0;
          line-height: 1;
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .error-title {
          font-size: 2.5rem;
          font-weight: 600;
          color: white;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        .error-message {
          font-size: 1.25rem;
          color: rgba(255,255,255,0.9);
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }
        .error-btn {
          padding: 12px 30px;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 50px;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary-error {
          background: white;
          color: #f5576c;
          border: 2px solid white;
        }
        .btn-primary-error:hover {
          background: transparent;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .btn-secondary-error {
          background: transparent;
          color: white;
          border: 2px solid white;
        }
        .btn-secondary-error:hover {
          background: white;
          color: #f5576c;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .error-details {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
          text-align: left;
        }
        .error-details h4 {
          color: white;
          font-size: 18px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .error-details ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .error-details li {
          color: rgba(255,255,255,0.9);
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .error-details li:last-child {
          border-bottom: none;
        }
        .error-details li i {
          color: rgba(255,255,255,0.7);
          font-size: 16px;
        }
        .status-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        .status-item {
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 8px;
          color: white;
        }
        .status-item h5 {
          font-size: 14px;
          margin-bottom: 5px;
          opacity: 0.8;
        }
        .status-item p {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        .refresh-hint {
          color: rgba(255,255,255,0.8);
          font-size: 14px;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .bg-shape {
          position: absolute;
          opacity: 0.1;
        }
        .shape-1 {
          width: 500px;
          height: 500px;
          background: white;
          border-radius: 50%;
          top: -250px;
          left: -250px;
          animation: float 20s ease-in-out infinite;
        }
        .shape-2 {
          width: 300px;
          height: 300px;
          background: white;
          border-radius: 50%;
          bottom: -150px;
          right: -150px;
          animation: float 15s ease-in-out infinite reverse;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        @media (max-width: 768px) {
          .error-code {
            font-size: 6rem;
          }
          .error-title {
            font-size: 1.8rem;
          }
          .error-message {
            font-size: 1rem;
          }
          .error-actions {
            flex-direction: column;
            align-items: center;
          }
          .error-btn {
            width: 200px;
            justify-content: center;
          }
        }
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
      `}} />
    </div>
  );
};

export default Error500;
