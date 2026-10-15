import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiMenu,
  FiX,
  FiUser,
  FiCheckSquare,
  FiDollarSign,
} from "react-icons/fi";
import { MdOutlineMarkUnreadChatAlt } from "react-icons/md";
import { useState, useEffect } from "react";

export default function HRSidebar() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: "HR Manager",
    image: ""
  });

  const closeSidebar = () => setOpen(false);

  useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (currentUser) {
      setProfile({
        name: currentUser.name || "HR Manager",
        image: currentUser.image || ""
      });
    }
  }, []);

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 text-[#004AAD]"
      >
        <FiMenu size={24} />
      </button>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:static top-0 left-0 z-40
          h-full w-64 p-5
          bg-[var(--bg-card)]
          border-l-4 border-primary
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
              HR Panel
            </p>
            <p className="text-xs text-gray-500 mt-1">Human Resources</p>
          </div>

          {/* LINKS */}
          <nav className="space-y-2">
            <Item
              to="/hr/dashboard"
              icon={<FiHome />}
              label="Dashboard"
              onClick={closeSidebar}
            />
            <Item
              to="/hr/employee-records"
              icon={<FiUsers />}
              label="Employee Records"
              onClick={closeSidebar}
            />
            <Item
              to="/hr/attendance"
              icon={<FiCheckSquare />}
              label="Attendance"
              onClick={closeSidebar}
            />
            <Item
              to="/hr/reports"
              icon={<FiCheckSquare />}
              label="Daily Reports"
              onClick={closeSidebar}
            />

            <Item
              to="/hr/documents"
              icon={<FiFileText />}
              label="Documents"
              onClick={closeSidebar}
            />
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
        `flex items-center gap-3 px-3 py-2 rounded-lg transition
         ${isActive
          ? "bg-primary/20 text-primary"
          : "text-theme-secondary hover:bg-primary/10"
        }`
      }
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
