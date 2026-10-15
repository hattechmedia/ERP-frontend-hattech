import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { currencyOptions } from '../../utils/formatters';
import { LogoutConfirmationModal } from '../common/LogoutConfirmationModal';
import { Clock, LogOut, Menu, ChevronDown } from 'lucide-react';

export const Header = ({ setMobileOpen }) => {
  const { selectedCurrency, setSelectedCurrency, currentUser, logout, setActiveTab, showToast } = useFinance();

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Real-time Live Clock
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
      setTimeStr(`${formatted} PKT`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-20 shadow-2xs sticky top-0 no-print">
        {/* Left: Mobile Toggle & Live Clock Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Live PKT Time Badge */}
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full shadow-inner">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>{timeStr || 'Wed, Sep 02, 2026, 03:13:00 PM PKT'}</span>
          </div>
        </div>

        {/* Right: Currency Selector, User Avatar, Sign Out */}
        <div className="flex items-center gap-3">
          {/* Currency Selector (PKR, USD, EUR, GBP, AUD, SAR) */}
          <div className="relative">
            <select
              value={selectedCurrency}
              onChange={(e) => {
                setSelectedCurrency(e.target.value);
                showToast(`Currency changed to ${e.target.value}`, 'info');
              }}
              className="bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs transition-colors"
            >
              {currencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-slate-900 py-1">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* User Avatar Badge (Click to open Profile Page) */}
          <button
            onClick={() => setActiveTab('profile')}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center border-2 border-blue-200 shadow-xs transition-all cursor-pointer"
            title="Open Admin Profile Settings"
          >
            {currentUser.avatar || 'FM'}
          </button>

          {/* Sign Out Button (Opens Confirmation Popup) */}
          <button
            onClick={() => setLogoutModalOpen(true)}
            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Sign Out of Console"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal Popup */}
      <LogoutConfirmationModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={logout}
      />
    </>
  );
};
