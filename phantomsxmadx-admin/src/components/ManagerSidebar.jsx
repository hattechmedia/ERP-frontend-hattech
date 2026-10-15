import { NavLink } from "react-router-dom";
import {
  FiCheckSquare,
  FiFileText,
  FiUser,
  FiMenu,
  FiX,
  FiUsers,
  FiUserPlus,
  FiFolder,
  FiMessageSquare,
  FiChevronDown,
  FiTarget,
  FiRefreshCcw,
} from "react-icons/fi";
import { MdOutlineMarkUnreadChatAlt } from "react-icons/md";
import { BsShieldCheck } from "react-icons/bs";
import { useState, useEffect } from "react";
import SidebarItem from "./SidebarItem";

export default function ManagerSidebar() {
  const [open, setOpen] = useState(false);
  const [expandDepts, setExpandDepts] = useState(true);
  const [managerProfile, setManagerProfile] = useState({
    name: "Manager",
    image: ""
  });

  const closeSidebar = () => setOpen(false);

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
          <div className="flex justify-between items-center mb-4">
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

          {/* PROFILE */}
          <NavLink
            to="/manager/profile"
            onClick={closeSidebar}
            className="flex items-center gap-3 mb-6 p-3 rounded-lg hover:bg-primary/20 transition-all duration-200 cursor-pointer"
          >
            <img
              src={managerProfile.image || "https://via.placeholder.com/40"}
              className="w-10 h-10 rounded-full object-cover border border-primary"
              alt="Profile"
            />
            <div>
              <div className="text-sm font-medium text-theme-primary">
                {managerProfile.name || "Manager"}
              </div>
              <div className="text-xs text-theme-secondary">View Profile</div>
            </div>
          </NavLink>

          {/* LINKS */}
          <nav className="space-y-3">
            {/* CORE OPERATIONS */}
            <div className="mb-4">
              <p className="text-xs uppercase font-semibold text-theme-secondary px-3 mb-2">Core Operations</p>
              <SidebarItem to="/manager/assign-tasks" icon={<FiCheckSquare />} label="Assign Tasks" onClick={closeSidebar} />
              <SidebarItem to="/manager/activity" icon={<FiUsers />} label="Employee Activity" onClick={closeSidebar} />
              <SidebarItem to="/admin/monthly-subscriptions" icon={<FiRefreshCcw />} label="Monthly Subscription" onClick={closeSidebar} />
            </div>

            {/* MANAGER PANEL DEPARTMENTS */}
            <div className="border-t border-[var(--border-color)] pt-3">
              <button
                onClick={() => setExpandDepts(!expandDepts)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-theme-tertiary transition text-sm font-semibold text-theme-primary mb-2"
              >
                <span className="flex items-center gap-2">
                  <BsShieldCheck size={16} className="text-[#004AAD]" />
                  Manager Panel
                </span>
                <FiChevronDown size={16} className={`transition ${expandDepts ? 'rotate-180' : ''}`} />
              </button>

              {expandDepts && (
                <div className="space-y-1 pl-2 border-l-2 border-[#004AAD]/30">
                  <SidebarItem
                    to="/manager/hr"
                    icon={<FiUsers className="text-blue-500" />}
                    label="HR Management"
                    onClick={closeSidebar}
                    small
                  />
                  <SidebarItem
                    to="/manager/project-head"
                    icon={<FiTarget className="text-green-500" />}
                    label="Project Head"
                    onClick={closeSidebar}
                    small
                  />
                </div>
              )}
            </div>

            {/* BOTTOM SECTION */}
            <div className="border-t border-[var(--border-color)] pt-3 mt-4">
              <SidebarItem to="/manager/profile" icon={<FiUser />} label="Profile" onClick={closeSidebar} />
            </div>
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