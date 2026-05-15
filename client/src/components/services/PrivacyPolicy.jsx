import React from 'react';
import { Link } from 'react-router-dom';
import './services.css';

const PrivacyPolicy = () => {
  return (
    <div className="services-page">
      <div className="container">
        {/* Header */}
        <div className="mb-5">
          <div className="privacy-header">
            <div className="privacy-icon-bg">
              <i className="bi bi-shield-exclamation"></i>
            </div>
            <h1>Privacy Policy</h1>
            <p className="lead">Your privacy and trust are our highest priorities</p>
          </div>
        </div>

        {/* Introduction Card */}
        <div className="services-card services-intro-card mb-4">
          <p className="intro-text">
            <strong>Kiaalap LMS</strong> is committed to protecting your privacy and ensuring transparency about how we handle your personal information. This comprehensive policy explains what information we collect, how we use it, and your rights regarding your data.
          </p>
        </div>

        {/* Additional Info Card */}
        <div className="services-card services-info-card">
          <h4 className="mb-3">
            <i className="bi bi-info-circle me-2"></i>Additional Information
          </h4>
          <div className="info-grid">
            <div className="info-item">
              <strong>Cookies:</strong>
              <p>We use cookies to enhance your experience and understand how you use our platform.</p>
            </div>
            <div className="info-item">
              <strong>Children's Privacy:</strong>
              <p>Our service is not intended for individuals under 13. We do not knowingly collect personal data from children.</p>
            </div>
            <div className="info-item">
              <strong>Policy Changes:</strong>
              <p>We may update this policy periodically. Significant changes will be communicated to users.</p>
            </div>
            <div className="info-item">
              <strong>Contact Us:</strong>
              <p>For privacy inquiries, please contact our administrator at <strong>admin@kiaalap.com</strong></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="privacy-footer">
          <p className="services-meta">
            <i className="bi bi-calendar-event me-2"></i>
            Last updated: December 05, 2025
          </p>
          <div className="mt-3">
            <Link to="/" className="btn btn-primary">Go to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
