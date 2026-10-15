import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { LogoutConfirmationModal } from '../../components/common/LogoutConfirmationModal';
import { User, KeyRound, Mail, Phone, CheckCircle2, Lock, LogOut, RotateCcw, ShieldAlert } from 'lucide-react';

export const ProfilePage = () => {
  const { currentUser, updateAdminProfile, changeAdminPassword, logout, resetAllDataToZero } = useFinance();

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        role: currentUser.role || '',
        department: currentUser.department || '',
      });
    }
  }, [currentUser]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateAdminProfile(profileForm);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }

    const success = changeAdminPassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (success) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleResetSystemData = () => {
    if (window.confirm('Are you sure you want to RESET ALL ERP DATA to zero? This will wipe all sample entries so you can enter live company data.')) {
      resetAllDataToZero();
    }
  };

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">ADMIN PROFILE & SECURITY</h1>
          <p className="text-xs text-slate-500 font-medium">Manage administrator account credentials, personal details & security password</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSystemData}
            className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset all system datasets to zero for clean testing"
          >
            <RotateCcw className="w-4 h-4" /> Reset All Data to 0
          </button>

          <button
            onClick={() => setLogoutModalOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* User Summary Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center border-4 border-blue-400/30 shadow-lg">
            {currentUser.avatar || 'FM'}
          </div>
          <div>
            <h2 className="text-xl font-black">{currentUser.name}</h2>
            <p className="text-xs text-blue-400 font-bold">{currentUser.role}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>AUTHENTICATED ADMIN</span>
        </span>
      </div>

      {/* Main 2-Column Grid: Profile Details vs Password Change */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Update Admin Profile Details */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-black text-slate-900 uppercase">PROFILE INFORMATION</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                FULL NAME
              </label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                PHONE NUMBER
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ROLE TITLE
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profileForm.role}
                  onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  DEPARTMENT
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer mt-2 uppercase tracking-wider"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Box 2: Change Admin Password */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-black text-slate-900 uppercase">CHANGE ADMIN PASSWORD</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                CURRENT PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                NEW PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                CONFIRM NEW PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer mt-2 uppercase tracking-wider"
            >
              Update Admin Password
            </button>
          </form>
        </div>
      </div>

      {/* Production Testing Clear Data Box */}
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-amber-900">
          <ShieldAlert className="w-8 h-8 text-amber-600 flex-shrink-0" />
          <div>
            <h3 className="font-black text-sm uppercase">LIVE PRODUCTION TESTING RESET</h3>
            <p className="text-xs font-medium text-amber-800">
              Clicking "Reset System Data" will permanently wipe all cached sample records, bank accounts & employee entries to zero.
            </p>
          </div>
        </div>
        <button
          onClick={handleResetSystemData}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-sm transition-all flex-shrink-0 cursor-pointer uppercase tracking-wider"
        >
          Reset All Data to 0
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={logout}
      />
    </div>
  );
};

export default ProfilePage;
