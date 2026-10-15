import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  LayoutGrid,
  DollarSign,
  FileText,
  CreditCard,
  BookOpen,
  User,
  X,
} from 'lucide-react';

export const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'cashflow', label: 'Cashflow', icon: DollarSign },
    { id: 'payroll', label: 'Payroll', icon: FileText },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'statement', label: 'Statement', icon: BookOpen },
    { id: 'profile', label: 'Admin Profile', icon: User },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-black text-slate-300 select-none border-r border-slate-800">
      {/* Brand & Logo Header */}
      <div className="p-6 flex flex-col items-center border-b border-slate-800 relative">
        <img
          src="/logo.jpg"
          alt="HATTECH MEDIA Logo"
          className="w-30 h-auto max-h-35 object-contain rounded-xl shadow-md transition-transform hover:scale-105"
        />

        {!collapsed && (
          <div className="mt-4 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              FINANCE PANEL
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Management Console</p>
          </div>
        )}

        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Footer Copyright */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800 text-center text-[10px] font-medium text-slate-500 tracking-wider">
          © 2026 | HATT-TECH MEDIA
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
