import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DashboardCharts.css';

const DashboardCharts = ({ chartData }) => {

  return (
    <div className="dashboard-charts">
      {/* Combined card: Enrollment Trend + Top Professors side-by-side inside one card */}
      <div className="chart-card combined-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="chart-title mb-0">Enrollment Trend & Professor Load</h5>
        </div>
        <div className="charts-grid">
          <div className="inner-chart">
            <h6 className="small-chart-title">Enrollment Trend</h6>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="#3498db"
                  strokeWidth={2}
                  name="New Enrollments"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="inner-chart">
            <h6 className="small-chart-title">Top Professors by Course Load</h6>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.professorWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="courses" fill="#2ecc71" name="Courses Assigned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <h5 className="chart-title">Grade Distribution</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.gradeDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="grade" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#9b59b6" name="Number of Students" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
