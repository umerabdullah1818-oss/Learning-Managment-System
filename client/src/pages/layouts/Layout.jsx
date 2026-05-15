import React, { useState } from 'react';
import Header from '../../components/layouts/Header';
import Sidebar from '../../components/layouts/Sidebar';
import Footer from '../../components/layouts/Footer';
import '../../components/layouts/Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-wrapper">
        <Header toggleSidebar={toggleSidebar} />
        <main className="content">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
