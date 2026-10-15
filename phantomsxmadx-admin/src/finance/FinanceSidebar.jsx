import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiArrowUpRight,
  FiArrowDownRight,
  FiMenu,
  FiX,
  FiFileText,
  FiBookOpen,
  FiCreditCard
} from "react-icons/fi";
import { useState } from "react";

export default function FinanceSidebar() {
  const [open, setOpen] = useState(false);
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const role = (user.role || "").toLowerCase();

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
          border-l-4 border-[#004AAD]
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 flex flex-col
        `}
      >
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
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

          <div className="mb-4 px-3">
            <p className="text-xs font-bold uppercase text-theme-secondary tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#004AAD]"></span>
              Finance Panel
            </p>
            <p className="text-xs text-gray-500 mt-1">Management Console</p>
          </div>

          <nav className="space-y-2">
            <Item to="/finance" icon={<FiHome />} label="Dashboard" onClick={closeSidebar} />
            <Item to="/finance/cashflow" icon={<FiDollarSign />} label="Cashflow" onClick={closeSidebar} />
            <Item to="/finance/payroll" icon={<FiFileText />} label="Payroll" onClick={closeSidebar} />
            <Item to="/finance/accounts" icon={<FiCreditCard />} label="Accounts" onClick={closeSidebar} />
            <Item to="/finance/statement" icon={<FiBookOpen />} label="Statement" onClick={closeSidebar} />
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

function Item({ to, icon, label, onClick, badge }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition relative
         ${isActive
          ? "bg-[#004AAD]/20 text-[#004AAD] font-bold"
          : "text-theme-secondary hover:bg-[#004AAD]/10"
        }`
      }
    >
      <span className="text-lg">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
