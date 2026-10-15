import { NavLink } from "react-router-dom";
import api from "../services/api";
import {
  FiCheckSquare,
  FiFileText,
  FiUser,
  FiMenu,
  FiX,
  FiUserPlus,
  FiFolder,
  FiMessageSquare,
  FiTrendingUp,
  FiDollarSign,
  FiAward,
  FiUsers,
} from "react-icons/fi";
import { MdOutlineMarkUnreadChatAlt } from "react-icons/md";
import { BsShieldCheck } from "react-icons/bs";
import { useState, useEffect } from "react";

export default function EmployeeSidebar() {
  const [open, setOpen] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState({
    name: "Employee",
    image: ""
  });

  const closeSidebar = () => setOpen(false);

  const updateProfile = () => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (currentUser && currentUser.id) {
      // Prioritize currentUser as it is updated by Profile.jsx
      setEmployeeProfile({
        name: currentUser.name || "Employee",
        image: currentUser.avatar || ""
      });
    }
  };

  useEffect(() => {
    updateProfile();
    
    // Also verify role from backend to handle promotions without re-login
    const verifyRole = async () => {
      try {
        const res = await api.get('/auth/me'); // Assuming /auth/me exists and returns current user
        if (res.data.success && res.data.user) {
          const stored = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
          if (stored.role !== res.data.user.role) {
            const updated = { ...stored, role: res.data.user.role };
            sessionStorage.setItem("currentUser", JSON.stringify(updated));
            window.dispatchEvent(new Event('profileUpdate'));
          }
        }
      } catch (err) {
        console.error("Role verification failed", err);
      }
    };
    verifyRole();

    window.addEventListener("profileUpdate", updateProfile);
    window.addEventListener("storage", updateProfile);

    return () => {
      window.removeEventListener("profileUpdate", updateProfile);
      window.removeEventListener("storage", updateProfile);
    };
  }, []);

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 text-[#004AAD]"
      >
        <FiMenu size={24} />
      </button>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:static top-0 left-0 z-50
          h-full w-64 p-5
          bg-[var(--bg-card)]
          border-r border-white/5
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 flex flex-col
        `}
      >
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-1">
            <div className="flex-1 flex justify-center items-start mt-0 mb-2">
              <div className="p-3 mb-2">
                <img
                  src="/logo.png"
                  alt="HATTECH MEDIA"
                  className="h-28 w-auto object-contain logo-theme-aware"
                />
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="md:hidden text-theme-secondary"
            >
              <FiX size={22} />
            </button>
          </div>

          {/* PANEL LABEL */}
          <div className="mb-4 px-3">
            <p className="text-xs font-bold uppercase text-theme-secondary tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#004AAD]"></span>
              Employee Panel
            </p>
            <p className="text-xs text-gray-500 mt-1">System Monitoring</p>
          </div>

          {/* PROFILE CARD */}
          <NavLink
            to="/employee/profile"
            onClick={closeSidebar}
            className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-theme-tertiary hover:bg-theme-hover border border-theme transition-all duration-200 cursor-pointer group"
          >
            <img
              src={employeeProfile.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employeeProfile.name)}&backgroundColor=004AAE&textColor=ffffff`}
              className="w-10 h-10 rounded-full object-cover border border-[#004AAD]"
              alt="Profile"
            />
            <div>
              <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                {employeeProfile.name || "Employee"}
              </div>
              <div className="text-xs text-blue-500 font-medium">View Profile</div>
            </div>
          </NavLink>

          {/* LINKS */}
          <nav className="space-y-2">
            {/* PANEL LABEL */}
            <div className="mb-2 px-3">
              <p className="text-xs font-bold uppercase text-theme-secondary tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#004AAD]"></span>
                Menu
              </p>
            </div>

            <Item to="/employee/performance" icon={<FiTrendingUp />} label="Dashboard" onClick={closeSidebar} />
            <Item to="/employee/my-tasks" icon={<FiCheckSquare />} label="My Tasks" onClick={closeSidebar} />
            <Item to="/employee/daily-report" icon={<FiFileText />} label="Daily Report" onClick={closeSidebar} />
            {JSON.parse(sessionStorage.getItem("currentUser"))?.role === 'teamlead' && (
               <Item to="/employee/team" icon={<FiUsers />} label="My Team" onClick={closeSidebar} />
            )}
            <Item to="/employee/achievements" icon={<FiAward />} label="My Achievements" onClick={closeSidebar} />
            <Item to="/employee/attendance" icon={<FiCheckSquare />} label="Attendance" onClick={closeSidebar} />
            <Item to="/employee/notes" icon={<FiFileText className="text-yellow-500" />} label="Project Notes" onClick={closeSidebar} />
            <Item to="/employee/company-policy" icon={<BsShieldCheck className="text-emerald-400" />} label="Company Policy" onClick={closeSidebar} />
          </nav>
        </div>

        <div className="mt-auto pt-4 text-center border-t border-white/5">
          <p className="text-[8.5px] text-gray-500 font-medium tracking-[0.1em] uppercase opacity-50">
            © 2026 | Hatt-Tech Media
          </p>
        </div>
      </aside>
    </>
  );
}

function Item({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
         ${isActive
          ? "bg-[#004AAD]/20 text-[#004AAD] shadow-sm"
          : "text-theme-secondary hover:bg-[#004AAD]/10"
        }`
      }
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}