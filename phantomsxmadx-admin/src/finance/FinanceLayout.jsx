import React from 'react';
import { Outlet } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

export default function FinanceLayout() {
  return (
    <FinanceProvider>
      <div className="finance-panel-theme w-full h-full">
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </div>
    </FinanceProvider>
  );
}
