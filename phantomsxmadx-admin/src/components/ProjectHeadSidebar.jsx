import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiCheckSquare,
  FiTrendingUp,
  FiMenu,
  FiX,
  FiFileText,
  FiBriefcase,
  FiClock,
  FiChevronDown,
  FiChevronRight
} from "react-icons/fi";
import { MdOutlineMarkUnreadChatAlt } from "react-icons/md";
import { useState, useEffect } from "react";
import api from "../services/api";

export default function ProjectHeadSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "Project Head",
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
    return location.pathname.startsWith('/projecthead/projects');
  });

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
    if (location.pathname.startsWith('/projecthead/projects')) {
      setProjectsExpanded(true);
    }
  }, [location]);

  useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (currentUser) {
      setProfile({
        name: currentUser.name || "Project Head",
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
              Project Panel
            </p>
            <p className="text-xs text-gray-500 mt-1">Project Management</p>
          </div>

          {/* LINKS */}
          <nav className="space-y-2">
            <Item
              to="/projecthead/dashboard"
              icon={<FiHome />}
              label="Dashboard"
              onClick={closeSidebar}
            />

            {/* PROJECTS WITH PARTNER COMPANIES DROPDOWN */}
            <div className="space-y-1">
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition cursor-pointer group ${
                  location.pathname.startsWith("/projecthead/projects") && !location.search.includes("partner_")
                    ? "bg-[#004AAD]/20 text-[#004AAD] font-bold"
                    : "text-theme-secondary hover:bg-[#004AAD]/10"
                }`}
                onClick={() => {
                  navigate("/projecthead/projects");
                  if (partnerCompanies.length > 0) {
                    setProjectsExpanded(!projectsExpanded);
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <FiBriefcase className="text-lg" />
                  <span>Projects</span>
                </div>
                {partnerCompanies.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectsExpanded(!projectsExpanded);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-theme-secondary hover:text-theme-primary transition"
                  >
                    {projectsExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                  </button>
                )}
              </div>

              {/* ONLY PARTNER COMPANIES IN DROPDOWN */}
              {projectsExpanded && partnerCompanies.length > 0 && (
                <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-[#004AAD]/30 ml-4 animate-in slide-in-from-top-1 duration-200">
                  {partnerCompanies.map((company) => {
                    const isCompanySelected = location.search.includes(`partner_${company.id}`);

                    return (
                      <div
                        key={company.id}
                        onClick={() => {
                          navigate(`/projecthead/projects?tab=partner_${company.id}`);
                          closeSidebar();
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isCompanySelected
                            ? "bg-[#004AAD] text-white shadow-sm"
                            : "text-theme-secondary hover:text-theme-primary hover:bg-[#004AAD]/10"
                        }`}
                      >
                        {company.logo || (company.name?.toLowerCase() === 'novarch' ? '/novarch-logo.png' : '') ? (
                          <img
                            src={company.logo || '/novarch-logo.png'}
                            alt={company.name}
                            className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/20"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-[#004AAD]/20 flex items-center justify-center text-[9px] text-[#004AAD] shrink-0 font-bold">
                            {company.name.charAt(0)}
                          </div>
                        )}
                        <span className="truncate">{company.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Item
              to="/projecthead/my-tasks"
              icon={<FiCheckSquare />}
              label="My Tasks"
              onClick={closeSidebar}
            />
            <Item
              to="/projecthead/assign-projects"
              icon={<FiCheckSquare />}
              label="Assign Projects"
              onClick={closeSidebar}
            />
            <Item
              to="/projecthead/track-projects"
              icon={<FiTrendingUp />}
              label="Track Projects"
              onClick={closeSidebar}
            />
            <Item
              to="/projecthead/verify-reports"
              icon={<FiFileText />}
              label="Verify Reports"
              onClick={closeSidebar}
            />
            <Item
              to="/projecthead/assessment"
              icon={<FiCheckSquare />}
              label="Weekly Assessment"
              onClick={closeSidebar}
            />
            <Item
              to="/projecthead/daily-report"
              icon={<FiFileText />}
              label="My Daily Report"
              onClick={closeSidebar}
            />
            <Item
              to="/projecthead/attendance"
              icon={<FiClock />}
              label="My Attendance"
              onClick={closeSidebar}
            />
            <Item
              to="/projecthead/performance"
              icon={<FiTrendingUp />}
              label="My Performance"
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
