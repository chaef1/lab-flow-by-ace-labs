import React from 'react';
import { Outlet } from 'react-router-dom';
import Dashboard from './Dashboard';

interface AppLayoutProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ title, subtitle, showSearch = false }) => {
  return (
    <Dashboard title={title} subtitle={subtitle} showSearch={showSearch}>
      <Outlet />
    </Dashboard>
  );
};

export default AppLayout;