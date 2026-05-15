import React, { useEffect } from 'react';

const Error404 = () => {
  useEffect(() => {
    // Animate error code
    const errorCode = document.querySelector('.error-code');
    if (errorCode) {
      errorCode.style.opacity = '0';
      errorCode.style.transform = 'scale(0.5)';
      setTimeout(() => {
        errorCode.style.transition = 'all 0.5s ease';
        errorCode.style.opacity = '1';
        errorCode.style.transform = 'scale(1)';
      }, 100);
    }

    // Handle search form
    const searchForm = document.querySelector('.search-group');
    if (searchForm) {
      searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = this.querySelector('input').value;
        if (query) {
          alert('Search functionality would search for: ' + query);
        }
      });
    }

    console.log('404 Error - Page not found:', window.location.pathname);
  }, []);

  return (
    <div className="error-page">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>
      <div className="error-container">
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Oops! Page Not Found</h2>
        <p className="error-message">
          The page you're looking for seems to have wandered off.
          It might have been removed, renamed, or perhaps it never existed.
        </p>
        <div className="error-actions">
          <a href="/" className="error-btn btn-home">
            <i className="bi bi-house-door"></i>
            Go to Homepage
          </a>
          <a href="javascript:history.back()" className="error-btn btn-back">
            <i className="bi bi-arrow-left"></i>
            Go Back
          </a>
        </div>
        <div className="error-search">
          <form action="/search" method="get" className="search-group">
            <input type="text" className="search-input" placeholder="Search for a page..." name="q" />
            <button type="submit" className="search-btn">
              <i className="bi bi-search"></i>
            </button>
          </form>
        </div>
        <div style={{marginTop: '3rem'}}>
          <p style={{color: 'rgba(255,255,255,0.7)', marginBottom: '1rem'}}>Popular pages:</p>
          <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <a href="/dashboard" style={{color: 'white', textDecoration: 'underline', opacity: 0.8}}>Dashboard</a>
            <a href="/all-students" style={{color: 'white', textDecoration: 'underline', opacity: 0.8}}>Students</a>
            <a href="/all-courses" style={{color: 'white', textDecoration: 'underline', opacity: 0.8}}>Courses</a>
            <a href="/events" style={{color: 'white', textDecoration: 'underline', opacity: 0.8}}>Events</a>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .error-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
        }
        .error-container {
          text-align: center;
          z-index: 10;
          padding: 2rem;
          max-width: 600px;
          margin: 0 auto;
        }
        .error-code {
          font-size: 10rem;
          font-weight: 700;
          color: white;
          text-shadow: 3px 3px 20px rgba(0,0,0,0.2);
          margin-bottom: 0;
          line-height: 1;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
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
        .btn-home {
          background: white;
          color: #667eea;
          border: 2px solid white;
        }
        .btn-home:hover {
          background: transparent;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .btn-back {
          background: transparent;
          color: white;
          border: 2px solid white;
        }
        .btn-back:hover {
          background: white;
          color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .bg-shape {
          position: absolute;
          opacity: 0.1;
        }
        .shape-1 {
          width: 400px;
          height: 400px;
          background: white;
          border-radius: 50%;
          top: -200px;
          right: -200px;
          animation: rotate 20s linear infinite;
        }
        .shape-2 {
          width: 300px;
          height: 300px;
          background: white;
          border-radius: 50%;
          bottom: -150px;
          left: -150px;
          animation: rotate 15s linear infinite reverse;
        }
        .shape-3 {
          width: 200px;
          height: 200px;
          background: white;
          transform: rotate(45deg);
          top: 50%;
          left: 10%;
          animation: float 5s ease-in-out infinite;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
        .error-search {
          margin-top: 2rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        .search-group {
          position: relative;
        }
        .search-input {
          width: 100%;
          padding: 12px 50px 12px 20px;
          border-radius: 50px;
          border: none;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        .search-input::placeholder {
          color: rgba(255,255,255,0.6);
        }
        .search-input:focus {
          outline: none;
          background: rgba(255,255,255,0.3);
          box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        }
        .search-btn {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          border: none;
          color: #667eea;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .search-btn:hover {
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
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

export default Error404;
