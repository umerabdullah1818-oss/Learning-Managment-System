import React from 'react';
import { Link } from 'react-router-dom';
import './services.css';

const TermsOfService = () => {
  

  return (
    <div className="services-page">
      <div className="container">
        {/* Header */}
        <div className="mb-5">
          <div className="privacy-header">
            <div className="privacy-icon-bg">
              <i className="bi bi-file-text"></i>
            </div>
            <h1>Terms of Service</h1>
            <p className="lead">Please read our terms carefully before using Kiaalap LMS</p>
          </div>
        </div>

        {/* Introduction Card */}
        <div className="services-card services-intro-card mb-4">
          <p className="intro-text">
            Welcome to <strong>Kiaalap LMS</strong>. By accessing or using our services, you agree to be bound by these Terms of Service. These terms govern your use of our platform and establish the rights and responsibilities of both you and Kiaalap.
          </p>
        </div>

        {/* Important Notice Card */}
        <div className="services-card services-info-card">
          <h4 className="mb-3">
            <i className="bi bi-info-circle me-2"></i>Important Terms
          </h4>
          <div className="info-grid">
            <div className="info-item">
              <strong>User Conduct:</strong>
              <p>Users must not engage in harassment, discrimination, or any behavior that violates applicable laws or disrupts platform operations.</p>
            </div>
            <div className="info-item">
              <strong>Content Ownership:</strong>
              <p>You retain ownership of content you create. By posting, you grant Kiaalap a license to use it for platform operations.</p>
            </div>
            <div className="info-item">
              <strong>Compliance:</strong>
              <p>You agree to comply with all applicable laws, regulations, and these terms. Violations may result in account suspension or termination.</p>
            </div>
            <div className="info-item">
              <strong>Support & Issues:</strong>
              <p>For concerns regarding these terms, contact our support team at <strong>support@kiaalap.com</strong></p>
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

export default TermsOfService;
