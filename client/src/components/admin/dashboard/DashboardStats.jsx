import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardStats.css';

const DashboardStats = ({ stats }) => {
  const statCards = [
    {
      id: 1,
      label: 'Total Students',
      value: stats.totalStudents,
      icon: 'fas fa-users',
      color: 'primary',
      link: '/all-students',
      bgColor: '#3498db'
    },
    {
      id: 2,
      label: 'Total Professors',
      value: stats.totalProfessors,
      icon: 'fas fa-chalkboard-user',
      color: 'success',
      link: '/all-professors',
      bgColor: '#2ecc71'
    },
    {
      id: 3,
      label: 'Active Courses',
      value: stats.totalCourses,
      icon: 'fas fa-book',
      color: 'info',
      link: '/all-courses',
      bgColor: '#9b59b6'
    },
    {
      id: 4,
      label: 'Departments',
      value: stats.totalDepartments,
      icon: 'fas fa-building',
      color: 'warning',
      link: '/departments',
      bgColor: '#f39c12'
    },
    {
      id: 5,
      label: 'Total Enrollments',
      value: stats.totalEnrollments,
      icon: 'fas fa-user-check',
      color: 'danger',
      link: '#',
      bgColor: '#e74c3c'
    },
  ];

  return (
    <div className="dashboard-stats">
      {statCards.map((card) => (
        <Link key={card.id} to={card.link} className="stat-card-link">
          <div className="stat-card" style={{ borderLeftColor: card.bgColor }}>
            <div className="stat-card-header">
              <div className="stat-icon" style={{ backgroundColor: card.bgColor }}>
                <i className={card.icon}></i>
              </div>
            </div>
            <div className="stat-card-body">
              <h5 className="stat-value">{card.value}</h5>
              <p className="stat-label">{card.label}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default DashboardStats;
