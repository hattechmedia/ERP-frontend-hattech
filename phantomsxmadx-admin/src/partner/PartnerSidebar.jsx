import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiFolder,
  FiMessageSquare,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiLayers
} from "react-icons/fi";
import { useState, useEffect } from "react";
import LogoutModal from "../components/LogoutModal";

export default function PartnerSidebar() {
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");

  const [partnerLogo, setPartnerLogo] = useState("/novarch-logo.png");
  const [partnerName, setPartnerName] = useState(user.name || "Partner");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hattech_partner_companies");
      if (saved) {
        const list = JSON.parse(saved);
        const match = list.find(c => c.name?.toLowerCase() === (user.name || '').toLowerCase() || c.id === user.partnerCompanyId);
        if (match) {
          if (match.logo) setPartnerLogo(match.logo);
          if (match.name) setPartnerName(match.name);
        }
      }
    } catch (e) {}
  }, [user]);

  const closeSidebar = () => setOpen(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 text-[#004AAD]"
      >
        <FiMenu size={24} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

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
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1 flex flex-col items-center justify-center p-2">
              <img
                src={partnerLogo || "/logo.png"}
                alt={partnerName}
                className="h-16 w-auto object-contain rounded-xl p-1 bg-white border border-white/10"
              />
              <h2 className="text-sm font-black text-white mt-2 uppercase tracking-wide truncate max-w-[180px]">
                {partnerName}
              </h2>
              <span className="text-[10px] font-bold text-[#004AAD] uppercase tracking-widest bg-[#004AAD]/10 px-2 py-0.5 rounded-full mt-0.5">
                BD Partner Portal
              </span>
            </div>
            <button
              onClick={closeSidebar}
              className="md:hidden text-theme-secondary"
            >
              <FiX size={22} />
            </button>
          </div>

          <div className="mb-4 px-3">
            <p className="text-xs font-bold uppercase text-theme-secondary tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Partner Console
            </p>
          </div>

          <nav className="space-y-2">
            <Item to="/partner" icon={<FiFolder />} label="My Projects & Pipeline" onClick={closeSidebar} />
            <Item to="/partner/requests" icon={<FiLayers />} label="Proposals & Requests" onClick={closeSidebar} />
          </nav>
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition cursor-pointer"
          >
            <FiLogOut size={16} />
            <span>Logout Portal</span>
          </button>
          <p className="text-[8.5px] text-center text-gray-500 font-medium tracking-[0.1em] uppercase opacity-50">
            Powered by HAT-TECH MEDIA
          </p>
        </div>
      </aside>

      {showLogoutModal && <LogoutModal onClose={() => setShowLogoutModal(false)} />}
    </>
  );
}

function Item({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/partner"}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
          isActive
            ? "bg-[#004AAD] text-white shadow-lg shadow-blue-900/40"
            : "text-theme-secondary hover:text-white hover:bg-[#004AAD]/10"
        }`
      }
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
