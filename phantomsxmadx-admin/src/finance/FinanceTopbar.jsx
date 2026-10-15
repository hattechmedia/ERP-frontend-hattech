import { FiLogOut, FiClock, FiDollarSign } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoutModal from "../components/LogoutModal";
import ThemeToggle from "../components/ThemeToggle";
import api from "../services/api";
import { useCurrency, currencySymbols } from "../contexts/CurrencyContext";

function FinanceTopbar() {
  const { currency, setCurrency } = useCurrency();
  const [showLogout, setShowLogout] = useState(false);
  const [profile, setProfile] = useState({ name: "", image: "" });
  const [currentTime, setCurrentTime] = useState("");
  const navigate = useNavigate();

  // Live PKT Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const formatted = now.toLocaleString('en-US', options);
      setCurrentTime(`${formatted} PKT`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProfile = async () => {
    try {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
      if (!currentUser) return;

      try {
        const profileRes = await api.get('/profile/finance'); 
        if (profileRes.data.success) {
          setProfile({
            name: profileRes.data.profile.name || currentUser.name,
            image: profileRes.data.profile.image || currentUser.avatar || ""
          });
        }
      } catch (err) {
        setProfile({ name: currentUser.name || "Finance Manager", image: currentUser.avatar || "" });
      }
    } catch (error) {
      console.error("FinanceTopbar profile error:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
    window.addEventListener('storage', fetchProfile);
    window.addEventListener('profileUpdate', fetchProfile);

    return () => {
      window.removeEventListener('storage', fetchProfile);
      window.removeEventListener('profileUpdate', fetchProfile);
    };
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-30 h-16 md:h-14 w-full flex items-center justify-between px-4 md:px-6 shadow-sm bg-[var(--bg-main)] transition-all border-b border-[var(--bg-inner)]"
      >
        {/* LIVE CLOCK */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-500/10 border border-gray-500/20 text-xs font-mono font-bold text-theme-secondary">
            <FiClock size={13} className="text-[#004AAD] animate-spin-slow" />
            <span>{currentTime || "Loading time..."}</span>
          </div>
        </div>

        {/* CONTROLS & PROFILE */}
        <div className="flex items-center gap-3 ml-auto">
          {/* THEME TOGGLE */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>

          {/* PROFILE IMAGE */}
          <div
            className="cursor-pointer"
            onClick={() => navigate("/finance/profile")}
            title="View Profile"
          >
            <img
              src={profile.image && (profile.image.startsWith('data:') || profile.image.startsWith('http')) ? profile.image : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'Finance')}&backgroundColor=004AAE&textColor=ffffff`}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-[var(--bg-inner)] bg-white"
            />
          </div>

          {/* LOGOUT BUTTON */}
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center text-red-500 hover:text-red-700 transition-all p-1"
            title="Logout"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      {showLogout && (
        <LogoutModal onClose={() => setShowLogout(false)} />
      )}
    </>
  );
}

export default FinanceTopbar;
