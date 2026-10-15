import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { IoEye, IoEyeOff } from "react-icons/io5";
import ThemeToggle from "../components/ThemeToggle";
import { db } from "../services/mockDb";

export default function Login() {
  const navigate = useNavigate();
  const { login, logout, user: authUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [view, setView] = useState("login"); // 'login', 'forgot', 'reset', 'forceChange'
  const [currentPassword, setCurrentPassword] = useState("");

  // Auto-redirect if already logged in
  useEffect(() => {
    if (authUser && authUser.role) {
      if (authUser.mustChangePassword) {
        setView("forceChange");
        return;
      }
      const role = authUser.role.toLowerCase();
      if (role === 'admin' || role === 'it_support') navigate("/admin");
      else if (role === 'hr') navigate("/hr");
      else if (role === 'projecthead') navigate("/projecthead");
      else if (role === 'employee' || role === 'teamlead' || role === 'intern') navigate("/employee");
      else if (role === 'client') navigate("/client");
      else if (role === 'finance') navigate("/finance");
      else if (role === 'partner') navigate("/partner");
    }
  }, [authUser, navigate]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError("");

    const inputEmail = e?.target?.elements?.email?.value || email;
    const inputPassword = e?.target?.elements?.password?.value || password;

    if (!inputEmail || !inputPassword) {
      setError("Username and password are required.");
      return;
    }

    const loadToast = toast.loading("Authenticating...");
    setLoading(true);

    try {
      const result = await login(inputEmail, inputPassword);

      if (result.success) {
        const user = JSON.parse(sessionStorage.getItem("currentUser"));

        if (result.mustChangePassword) {
          toast.success("Login successful! Please update your password.", { id: loadToast });
          setCurrentPassword(inputPassword);
          setView("forceChange");
          return;
        }

        toast.success("Welcome back!", { id: loadToast });
        const role = user?.role?.toLowerCase();
        if (role === 'admin' || role === 'it_support') navigate("/admin");
        else if (role === 'hr') navigate("/hr");
        else if (role === 'projecthead') navigate("/projecthead");
        else if (role === 'employee' || role === 'teamlead' || role === 'intern') navigate("/employee");
        else if (role === 'client') navigate("/client");
        else if (role === 'partner') navigate("/partner");
        else if (role === 'finance') navigate("/finance");
        else navigate("/");
      } else {
        toast.error(result.message || "Invalid credentials", { id: loadToast });
        setError(result.message);
      }
    } catch (err) {
      toast.error("An unexpected error occurred", { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error("Please enter your email");
    const user = db.users.findByUsername(forgotEmail);
    if (user) {
      toast.success("User found! You can reset your password now.");
      setView("reset");
    } else {
      // Still show success for security (don't reveal if email exists)
      toast.success("If your email is registered, you can reset your password.");
      setView("reset");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) return toast.error("Passwords do not match");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");

    const loadToast = toast.loading("Resetting password...");
    setLoading(true);
    try {
      const user = db.users.findByUsername(forgotEmail);
      if (user) {
        db.users.update(user._id || user.id, { password: newPassword });
        toast.success("Password reset successful! Please login with your new password.", { id: loadToast });
      } else {
        toast.success("Password reset successful! Please login.", { id: loadToast });
      }
      setView("login");
      setForgotEmail("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      toast.error("Error resetting password", { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  const handleForceChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) return toast.error("Passwords do not match");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword === currentPassword) return toast.error("New password must be different from current password");

    const loadToast = toast.loading("Updating password...");
    setLoading(true);
    try {
      const stored = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      db.users.update(stored._id || stored.id, { password: newPassword, mustChangePassword: false });
      toast.success("Password updated successfully! Please login with your new password.", { id: loadToast });
      logout();
    } catch (err) {
      toast.error("Failed to update password", { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  const [isLight, setIsLight] = useState(() => localStorage.getItem("theme") === "light");

  useEffect(() => {
    const handleThemeChange = () => {
      setIsLight(localStorage.getItem("theme") === "light");
    };
    window.addEventListener("theme-change", handleThemeChange);
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light");
      document.body.setAttribute("data-theme", "light");
    } else {
      document.body.classList.remove("light");
      document.body.setAttribute("data-theme", "dark");
    }
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  const bgClass = isLight ? "bg-gray-50 text-gray-900" : "bg-[#0f0b1f] text-white";
  const cardClass = isLight ? "bg-white border-gray-200 shadow-2xl" : "bg-[#1a1433] border-[#2a2255] shadow-[0_0_50px_rgba(0,0,0,0.5)]";
  const inputClass = isLight
    ? "bg-gray-50 border-gray-200 focus:border-[#004AAD] focus:ring-[#004AAD]/10 text-gray-900"
    : "bg-[#2a2255] border-[#3b2d6b] focus:border-[#004AAD] focus:ring-[#004AAD]/20 text-white placeholder-gray-500";
  const textMain = "text-[#004AAD]";
  const textSec = isLight ? "text-gray-500" : "text-gray-400";

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start pt-4 sm:pt-8 p-4 font-sans transition-colors duration-300 ${bgClass}`}>
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="flex justify-center w-full mb-4">
        <div className="p-2">
          <img
            src="/logo.png"
            alt="HATTECH MEDIA"
            className="h-28 sm:h-32 md:h-36 w-auto object-contain logo-theme-aware"
            onError={(e) => e.currentTarget.src = "https://via.placeholder.com/150"}
          />
        </div>
      </div>

      <div className={`w-full max-w-[26rem] p-6 sm:p-10 rounded-3xl border relative transition-all duration-300 ${cardClass}`}>

        {/* ── LOGIN ── */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-6">
            <h2 className={`text-2xl sm:text-3xl font-bold text-center mb-2 font-inter ${textMain}`}>Login</h2>
            {error && <div className="text-red-500 text-sm text-center bg-red-50/10 p-2 rounded border border-red-500/20">{error}</div>}

            <div className="space-y-4">
              <input
                type="text"
                name="email"
                placeholder="Username or Email"
                className={`w-full p-3 rounded-xl border transition outline-none ${inputClass}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className={`w-full p-3 pr-10 rounded-xl border transition outline-none ${inputClass}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004AAD] transition-colors"
                >
                  {showPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => setView("forgot")} className={`text-sm hover:underline font-bold text-[#004AAD]`}>
                Forgot Password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#004AAD] text-white hover:bg-[#003882] transition font-bold shadow-lg shadow-[#004AAD]/20 disabled:opacity-50">
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Demo credentials hint */}
            <div className={`text-xs ${textSec} space-y-2 border-t border-gray-500/20 pt-4`}>
              <p className="font-semibold text-center">Click any role below to auto-fill:</p>
              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  type="button"
                  onClick={() => { setEmail("admin"); setPassword("admin123"); }}
                  className="p-1.5 rounded-lg bg-[#004AAD]/10 hover:bg-[#004AAD]/20 border border-[#004AAD]/30 text-xs transition"
                >
                  <span className="font-bold text-[#004AAD] block">Admin</span>
                  <span className="font-mono text-[11px] opacity-80">admin / admin123</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail("emp1"); setPassword("emp123"); }}
                  className="p-1.5 rounded-lg bg-[#004AAD]/10 hover:bg-[#004AAD]/20 border border-[#004AAD]/30 text-xs transition"
                >
                  <span className="font-bold text-[#004AAD] block">Employee</span>
                  <span className="font-mono text-[11px] opacity-80">emp1 / emp123</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail("hr1"); setPassword("hr123"); }}
                  className="p-1.5 rounded-lg bg-[#004AAD]/10 hover:bg-[#004AAD]/20 border border-[#004AAD]/30 text-xs transition"
                >
                  <span className="font-bold text-[#004AAD] block">HR</span>
                  <span className="font-mono text-[11px] opacity-80">hr1 / hr123</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail("finance1"); setPassword("finance123"); }}
                  className="p-1.5 rounded-lg bg-[#004AAD]/10 hover:bg-[#004AAD]/20 border border-[#004AAD]/30 text-xs transition"
                >
                  <span className="font-bold text-[#004AAD] block">Finance</span>
                  <span className="font-mono text-[11px] opacity-80">finance1 / finance123</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail("client1"); setPassword("client123"); }}
                  className="p-1.5 rounded-lg bg-[#004AAD]/10 hover:bg-[#004AAD]/20 border border-[#004AAD]/30 text-xs transition col-span-2 text-center"
                >
                  <span className="font-bold text-[#004AAD] inline mr-2">Client:</span>
                  <span className="font-mono text-[11px] opacity-80">client1 / client123</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="text-center">
              <h2 className={`text-2xl sm:text-3xl font-bold mb-2 font-inter ${textMain}`}>Forgot Password</h2>
              <p className={`text-sm ${textSec}`}>Enter your email to reset your password.</p>
            </div>
            <input
              type="email"
              placeholder="Enter your email"
              className={`w-full p-3 rounded-xl border transition outline-none ${inputClass}`}
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#004AAD] text-white hover:bg-[#003882] transition font-bold shadow-lg shadow-[#004AAD]/20">
              {loading ? "Checking..." : "Continue"}
            </button>
            <button type="button" onClick={() => setView("login")} className={`w-full text-center text-sm transition-colors ${textSec} hover:text-[#004AAD]`}>
              Back to Login
            </button>
          </form>
        )}

        {/* ── RESET PASSWORD ── */}
        {view === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center">
              <h2 className={`text-2xl sm:text-3xl font-bold mb-2 font-inter ${textMain}`}>Reset Password</h2>
              <p className={`text-sm ${textSec}`}>Set your new password below.</p>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                className={`w-full p-3 pr-10 rounded-xl border transition outline-none ${inputClass}`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004AAD] transition-colors">
                {showPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              className={`w-full p-3 rounded-xl border transition outline-none ${inputClass}`}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#004AAD] text-white hover:bg-[#003882] transition font-bold shadow-lg shadow-[#004AAD]/20">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* ── FORCE CHANGE PASSWORD ── */}
        {view === "forceChange" && (
          <form onSubmit={handleForceChangePassword} className="space-y-4">
            <div className="text-center">
              <h2 className={`text-2xl sm:text-3xl font-bold mb-2 font-inter ${textMain}`}>Update Password</h2>
              <p className={`text-sm ${textSec}`}>For security, please set a new password for your account.</p>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                className={`w-full p-3 pr-10 rounded-xl border transition outline-none ${inputClass}`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004AAD] transition-colors">
                {showPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              className={`w-full p-3 rounded-xl border transition outline-none ${inputClass}`}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#004AAD] text-white hover:bg-[#003882] transition font-bold shadow-lg shadow-[#004AAD]/20">
              {loading ? "Updating..." : "Update Password"}
            </button>
            <button
              type="button"
              onClick={() => { sessionStorage.clear(); window.location.reload(); }}
              className="w-full text-center text-gray-400 text-sm hover:text-gray-600 transition"
            >
              Cancel & Logout
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
