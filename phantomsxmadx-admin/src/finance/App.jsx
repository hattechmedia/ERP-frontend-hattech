import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CashflowPage } from './pages/cashflow/CashflowPage';
import { PayrollPage } from './pages/payroll/PayrollPage';
import { AccountsPage } from './pages/accounts/AccountsPage';
import { StatementPage } from './pages/statement/StatementPage';
import { ProfilePage } from './pages/profile/ProfilePage';

const AppContent = () => {
  const { isAuthenticated, activeTab } = useFinance();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'cashflow':
        return <CashflowPage />;
      case 'payroll':
        return <PayrollPage />;
      case 'accounts':
        return <AccountsPage />;
      case 'statement':
        return <StatementPage />;
      case 'profile':
        return <ProfilePage />;
      case 'dashboard':
      default:
        return <DashboardPage />;
    }
  };

  return <DashboardLayout>{renderContent()}</DashboardLayout>;
};

function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}

export default App;
