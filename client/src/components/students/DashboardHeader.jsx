import React from 'react';

const DashboardHeader = ({ user }) => {
  return (
    <div className="dashboard-header">
      <h1>Welcome back, {user?.first_name}!</h1>
      <p className="text-muted">Here's your academic overview</p>
    </div>
  );
};

export default DashboardHeader;
