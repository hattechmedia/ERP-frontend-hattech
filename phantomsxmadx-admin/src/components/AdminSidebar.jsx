import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiFolder,
  FiCalendar,
  FiClock,
  FiMenu,
  FiX,
  FiUserPlus,
  FiMessageSquare,
  FiBriefcase,
  FiDollarSign,
  FiEdit,
  FiAward,
  FiGrid,
  FiChevronDown,
  FiChevronRight,
  FiShare2,
  FiFileText
} from "react-icons/fi";
import { useState, useEffect } from "react";
import api from "../services/api";

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const role = (user.role || "").toLowerCase();
  const [adminProfile, setAdminProfile] = useState({
    name: "Admin",
    image: ""
  });

  const [partnerCompanies, setPartnerCompanies] = useState(() => {
    try {
      const saved = localStorage.getItem("hattech_partner_companies");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [projectsExpanded, setProjectsExpanded] = useState(() => {
    return location.pathname.startsWith('/admin/projects');
  });

  const [expandedPartnerId, setExpandedPartnerId] = useState(null);

  const closeSidebar = () => setOpen(false);

  // Sync partner companies across backend MongoDB, projects, and localStorage
  useEffect(() => {
    const syncPartners = async () => {
      let current = [];
      try {
        const saved = localStorage.getItem("hattech_partner_companies");
        if (saved) current = JSON.parse(saved);
      } catch (e) {}

      // 1. Fetch from backend MongoDB CompanyConfig
      try {
        const res = await api.get('/hr/config/partner_companies');
        if (res.data.success && Array.isArray(res.data.data?.value)) {
          const serverList = res.data.data.value;
          const map = new Map();
          current.forEach(p => {
            if (p && p.name) map.set(p.name.toLowerCase().trim(), p);
          });
          serverList.forEach(p => {
            if (p && p.name) {
              const key = p.name.toLowerCase().trim();
              const existing = map.get(key);
              map.set(key, {
                ...existing,
                ...p,
                logo: p.logo || existing?.logo || (key === 'novarch' ? '/novarch-logo.png' : '')
              });
            }
          });
          if (map.has('novarch')) {
            const nov = map.get('novarch');
            if (!nov.logo) nov.logo = '/novarch-logo.png';
          }
          const merged = Array.from(map.values());
          if (merged.length > 0) {
            setPartnerCompanies(merged);
            localStorage.setItem("hattech_partner_companies", JSON.stringify(merged));
            return;
          }
        }
      } catch (e) {}

      // 2. Fallback: Fetch from projects if any have partnerCompany
      try {
        const projRes = await api.get('/projects');
        const projs = projRes.data?.data || [];
        const partnerProjs = projs.filter(p => p.partnerCompany);
        if (partnerProjs.length > 0) {
          const map = new Map();
          current.forEach(p => p && p.name && map.set(p.name.toLowerCase().trim(), p));
          partnerProjs.forEach(p => {
            const key = p.partnerCompany.toLowerCase().trim();
            if (!map.has(key)) {
              map.set(key, {
                id: p.partnerCompanyId || String(Date.now()),
                name: p.partnerCompany,
                logo: p.partnerCompanyLogo || '',
                description: 'Partner Company'
              });
            }
          });
          const merged = Array.from(map.values());
          setPartnerCompanies(merged);
          localStorage.setItem("hattech_partner_companies", JSON.stringify(merged));
        }
      } catch (e) {}
    };

    syncPartners();
    window.addEventListener('storage', syncPartners);
    window.addEventListener('partnerCompaniesUpdated', syncPartners);
    const interval = setInterval(syncPartners, 6000);
    return () => {
      window.removeEventListener('storage', syncPartners);
      window.removeEventListener('partnerCompaniesUpdated', syncPartners);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/projects')) {
      setProjectsExpanded(true);
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab') || '';
      if (tab.startsWith('partner_')) {
        const pId = tab.split('-')[0].replace('partner_', '');
        setExpandedPartnerId(pId);
      }
    }
  }, [location]);

  useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (currentUser) {
      const savedProfile = JSON.parse(
        sessionStorage.getItem("adminProfile") || '{"name": "Admin", "image": ""}'
      );
      setAdminProfile({
        name: savedProfile.name || currentUser.name || "Admin",
        image: savedProfile.image || ""
      });
    }
  }, []);

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
              {role === 'admin' ? 'Executive Admin Panel' : 'Management Panel'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Management Console</p>
          </div>

          <nav className="space-y-2">
            <Item to="/admin" icon={<FiHome />} label="Dashboard" onClick={closeSidebar} />
            <Item to="/admin/employees" icon={<FiUsers />} label="Employees" onClick={closeSidebar} />
            {role !== 'it_support' && <Item to="/admin/add-admin" icon={<FiUserPlus />} label="Add Admin" onClick={closeSidebar} />}
            <Item to="/admin/clients" icon={<FiBriefcase />} label="Clients" onClick={closeSidebar} />

            <Item to="/admin/projects" icon={<FiFolder />} label="Projects" onClick={closeSidebar} />
            <Item to="/admin/business-partners" icon={<FiBriefcase />} label="BD Partners" onClick={closeSidebar} />
            <Item to="/admin/personal-logs" icon={<FiCalendar />} label="Personal Logs" onClick={closeSidebar} />
            <Item to="/admin/achievements" icon={<FiAward />} label="Achievements" onClick={closeSidebar} />
            <Item to="/admin/activity" icon={<FiClock />} label="Employee Activity" onClick={closeSidebar} />
            {role !== 'it_support' && <Item to="/admin/payroll" icon={<FiDollarSign />} label="Payroll" onClick={closeSidebar} />}
            <Item to="/admin/hierarchy" icon={<FiGrid />} label="Hierarchy" onClick={closeSidebar} />
            <Item to="/admin/governance" icon={<FiFileText />} label="Policy & Updates" onClick={closeSidebar} />
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
          ? "bg-[#004AAD]/20 text-[#004AAD]"
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
