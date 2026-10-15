import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useFinance();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setErrorMessage('');
    setLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      setLoading(false);
      if (!success) {
        setErrorMessage('Invalid email address or password. Please check your credentials and try again.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Dynamic Background Glow Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-7 z-10 animate-in zoom-in-95 duration-200">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-block p-2 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-md">
            <img src="/logo.jpg" alt="HATTECH MEDIA" className="w-16 h-16 object-contain rounded-xl" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">HATTECH FINANCE ERP</h1>
            <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-1 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>SECURE ADMINISTRATIVE CONSOLE</span>
            </p>
          </div>
        </div>

        {/* Quick Credentials Info Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">ADMIN CREDENTIALS</span>
            <div className="font-mono text-slate-200 font-bold text-[11px] mt-0.5">
              admin@hattech.com <span className="text-slate-500">|</span> admin123
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@hattech.com');
              setPassword('admin123');
              if (errorMessage) setErrorMessage('');
            }}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold text-[11px] rounded-lg border border-blue-500/30 transition-colors cursor-pointer"
          >
            Auto Fill
          </button>
        </div>

        {/* Prominent Red Warning Alert Box when credentials are invalid */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/40 p-4 rounded-2xl flex items-start gap-3 text-rose-300 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-rose-400 uppercase tracking-wider block">Access Denied</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Address Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="Enter admin email..."
                className={`w-full bg-slate-800/90 border rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 font-medium placeholder:text-slate-500 transition-colors ${
                  errorMessage ? 'border-rose-500/60 focus:ring-rose-500' : 'border-slate-700 focus:ring-blue-500'
                }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              ADMIN PASSWORD
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password..."
                className={`w-full bg-slate-800/90 border rounded-xl pl-10 pr-10 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 placeholder:text-slate-500 transition-colors ${
                  errorMessage ? 'border-rose-500/60 focus:ring-rose-500' : 'border-slate-700 focus:ring-blue-500'
                }`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-200 absolute right-3 top-3 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-500 font-medium tracking-wider">
          © 2026 HATTECH MEDIA • ENCRYPTED ADMIN SESSION
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
