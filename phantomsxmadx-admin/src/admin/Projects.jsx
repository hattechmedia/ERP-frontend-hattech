import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DiscussionPanel from "../components/DiscussionPanel";
import LoadingSpinner from "../components/LoadingSpinner";
import { FiMoreVertical, FiLayers, FiPlus, FiCheckSquare, FiBriefcase, FiTrash2, FiGlobe, FiExternalLink, FiUpload, FiX, FiCode, FiUsers, FiFileText, FiCamera } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";
import MonthlySubscriptions from "./MonthlySubscriptions";

const cleanName = (name) => {
  if (!name || typeof name !== 'string') return name || "Unknown";
  return name.replace(/\d+$/, '').replace(/\s*User$/i, '').trim();
};

const formatDateSafe = (d) => {
  if (!d) return "N/A";
  if (d === "Ongoing") return "Ongoing";
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    const [y, m, day] = d.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString();
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) return d; // Fallback to raw string if invalid date
  return date.toLocaleDateString();
};

const ensureAbsoluteUrl = (url) => {
  if (!url) return "#";
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url;
  }
  return `https://${url}`;
};

const DESIGNATED_LEADS = ["Ali Musa", "Farrukh Saleem", "Tehreem Ijaz", "Muhammad Salman"];

const getSmartTeamLeads = (project, allEmployees = []) => {
  if (!project) return [];

  const leadsMap = new Map();

  const isInvalid = (name) => {
    if (!name) return true;
    const n = name.toLowerCase();
    return n.includes('admin') || n.includes('it support') || n.includes('system admin');
  };

  const isDesignatedOrRoleLead = (name) => {
    if (!name || isInvalid(name)) return false;
    const cName = cleanName(name);
    const lower = cName.toLowerCase();

    if (lower.includes('salman') || lower.includes('farrukh') || lower.includes('tehreem') || lower.includes('ali musa')) {
      return true;
    }

    const emp = (allEmployees || []).find(e => {
      const eName = cleanName(e.name || e.username || e.userId?.name || "").toLowerCase();
      return eName && (eName.includes(lower) || lower.includes(eName));
    });

    if (emp) {
      const role = (emp.role || emp.userId?.role || "").toLowerCase();
      if ((role === 'teamlead' || role === 'projecthead') && !lower.includes('umer') && !lower.includes('subhan') && !lower.includes('huzaifa')) {
        return true;
      }
    }

    return false;
  };

  const addLead = (rawName) => {
    if (!rawName) return;
    const cName = cleanName(rawName);
    const lower = cName.toLowerCase();

    let matchedLead = null;
    if (lower.includes('salman')) matchedLead = "Muhammad Salman";
    else if (lower.includes('farrukh')) matchedLead = "Farrukh Saleem";
    else if (lower.includes('tehreem')) matchedLead = "Tehreem Ijaz";
    else if (lower.includes('ali musa') || (lower.includes('ali') && lower.includes('musa'))) matchedLead = "Ali Musa";
    else if (isDesignatedOrRoleLead(cName)) matchedLead = cName;

    if (!matchedLead) return; // Strictly reject regular employees (Umer Hannan, Huzaifa, Subhan, Wajeeha)

    const leadKey = matchedLead.toLowerCase();
    if (leadsMap.has(leadKey)) return;

    // Find actual employee in allEmployees list for real profile photo
    const emp = (allEmployees || []).find(e => {
      const eName = cleanName(e.name || e.username || e.userId?.name || "").toLowerCase();
      return eName && (eName.includes(leadKey) || leadKey.includes(eName));
    });

    const photo = emp?.image || emp?.avatar || emp?.userId?.image || emp?.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedLead)}&background=004AAD&color=fff&bold=true`;

    leadsMap.set(leadKey, { name: matchedLead, image: photo });
  };

  // 1. Explicit assignedLead takes top priority! If project already has an assigned lead, only use it
  if (project.assignedLead) {
    addLead(project.assignedLead);
  }

  // 2. Check services array leads
  if (project.services && project.services.length > 0) {
    project.services.forEach(svc => {
      if (svc.assignedLead) addLead(svc.assignedLead);
    });
  }

  // If explicit lead is already found, do not hallucinate/guess additional leads!
  if (leadsMap.size > 0) {
    return Array.from(leadsMap.values());
  }

  // 3. Inspect project team & tasks ONLY if no explicit lead was assigned
  const assignedList = Array.isArray(project.assignedPersons) ? project.assignedPersons : [];
  const taskList = Array.isArray(project.tasks) ? project.tasks : [];

  const allAssignedIds = new Set();
  const allAssignedNames = [];

  assignedList.forEach(p => {
    if (typeof p === 'string' && p.trim()) allAssignedNames.push(p.trim());
    else if (p) {
      if (p.name || p.username) allAssignedNames.push(cleanName(p.name || p.username));
      if (p._id || p.id) allAssignedIds.add(p._id || p.id);
    }
  });

  taskList.forEach(t => {
    if (t.assignedTo) {
      if (typeof t.assignedTo === 'string' && t.assignedTo.trim()) allAssignedNames.push(t.assignedTo.trim());
      else if (t.assignedTo.name || t.assignedTo.username) allAssignedNames.push(cleanName(t.assignedTo.name || t.assignedTo.username));
      if (t.assignedTo._id || t.assignedTo.id) allAssignedIds.add(t.assignedTo._id || t.assignedTo.id);
    }
    const tTitle = (t.title || '').toLowerCase();
    if (/\bseo\b/i.test(tTitle)) addLead("Tehreem Ijaz");
    if (/\b(php|laravel)\b/i.test(tTitle)) addLead("Farrukh Saleem");
    if (/\b(mern|react|node|nextjs|express)\b/i.test(tTitle)) addLead("Muhammad Salman");
    if (/\b(ai|artificial intelligence|ml|python|django|fastapi)\b/i.test(tTitle)) addLead("Ali Musa");
  });

  allAssignedNames.forEach(n => {
    if (/farrukh/i.test(n)) addLead("Farrukh Saleem");
    if (/salman/i.test(n)) addLead("Muhammad Salman");
    if (/tehreem/i.test(n)) addLead("Tehreem Ijaz");
    if (/ali\s*musa/i.test(n)) addLead("Ali Musa");
  });

  (allEmployees || []).forEach(emp => {
    const empId = emp._id || emp.id || emp.userId?._id;
    const empName = cleanName(emp.name || emp.username || "");
    if (!empName || empName.length < 2) return;

    const isAssigned = (empId && allAssignedIds.has(empId)) || allAssignedNames.some(n => n.toLowerCase() === empName.toLowerCase());

    if (isAssigned) {
      if (emp.teamLead) {
        const leadName = typeof emp.teamLead === 'object' ? (emp.teamLead.name || emp.teamLead.username) : emp.teamLead;
        if (leadName) addLead(leadName);
      }
      const role = (emp.role || emp.userId?.role || "").toLowerCase();
      if (role === 'teamlead' || role === 'projecthead') {
        addLead(empName);
      }
    }
  });

  // 4. Fallback stack & type mapping if still empty
  if (leadsMap.size === 0 && (taskList.length > 0 || assignedList.length > 0)) {
    const stack = (project.stack || '').toLowerCase();
    const type = (project.type || '').toLowerCase();
    const title = (project.title || project.name || '').toLowerCase();

    if (/\bseo\b/i.test(type) || /\bseo\b/i.test(title) || /\bseo\b/i.test(stack)) {
      addLead("Tehreem Ijaz");
    } else if (/\b(php|laravel)\b/i.test(stack) || /\b(courier)\b/i.test(title)) {
      addLead("Farrukh Saleem");
    } else if (/\b(ai|artificial intelligence|ml|python|django)\b/i.test(stack)) {
      addLead("Ali Musa");
    } else if (/\b(mern|react|node)\b/i.test(stack) || /\bdevelopment\b/i.test(type)) {
      addLead("Muhammad Salman");
    }
  }

  return Array.from(leadsMap.values());
};

const getSmartTeamLead = (project, allEmployees = []) => {
  const leads = getSmartTeamLeads(project, allEmployees);
  return leads.length > 0 ? leads.map(l => l.name).join(", ") : "";
};

export default function Projects() {
  const { confirm } = useModal();
  // Dynamic theme detection
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const checkTheme = () => setIsLight(document.body.classList.contains('light'));
    checkTheme();
    window.addEventListener('storage', checkTheme);
    window.addEventListener('theme-change', checkTheme);

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('storage', checkTheme);
      window.removeEventListener('theme-change', checkTheme);
      observer.disconnect();
    };
  }, []);

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
  const userRole = (currentUser?.role || "admin").toLowerCase();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "client-active");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  /* ================= API INTEGRATION ================= */
  const [tasks, setTasks] = useState([]);
  const [onboardingProjects, setOnboardingProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [nameMap, setNameMap] = useState({});
  const [editingProject, setEditingProject] = useState(null);

  const [loading, setLoading] = useState(true);

  // Partner Companies State
  const [partnerCompanies, setPartnerCompanies] = useState(() => {
    try {
      const saved = localStorage.getItem("hattech_partner_companies");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const savePartnerCompanies = async (newList) => {
    setPartnerCompanies(newList);
    try {
      localStorage.setItem("hattech_partner_companies", JSON.stringify(newList));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("partnerCompaniesUpdated"));
      
      // Persist permanently in MongoDB CompanyConfig
      await api.post('/hr/config', {
        key: 'partner_companies',
        value: newList,
        description: 'List of partner companies'
      });
    } catch (e) {
      console.error("Failed to persist partner companies to backend", e);
    }
  };

  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showAddPartnerProjectModal, setShowAddPartnerProjectModal] = useState(false);
  const [selectedPartnerForProject, setSelectedPartnerForProject] = useState(null);

  const isPartnerTab = activeTab.startsWith("partner_");
  const currentPartnerId = isPartnerTab ? activeTab.split('-')[0].replace('partner_', '') : null;
  const currentPartner = partnerCompanies.find(c => String(c.id) === String(currentPartnerId));
  const currentPartnerSubTab = isPartnerTab ? (activeTab.includes('-') ? activeTab.split('-').slice(1).join('-') : 'all') : 'all';

  const handleUpdatePartnerLogo = (partnerId, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo file size must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const updated = partnerCompanies.map(c => {
        if (String(c.id) === String(partnerId) || c.name?.toLowerCase() === currentPartner?.name?.toLowerCase()) {
          return { ...c, logo: dataUrl };
        }
        return c;
      });
      savePartnerCompanies(updated);
      toast.success("Partner company logo updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePartnerCompany = async (partnerId) => {
    const isConfirmed = await confirm({
      title: 'Delete Partner Company',
      message: 'Are you sure you want to remove this partner company?',
      type: 'danger'
    });
    if (!isConfirmed) return;
    const updated = partnerCompanies.filter(c => String(c.id) !== String(partnerId));
    savePartnerCompanies(updated);
    setActiveTab("client");
    toast.success("Partner company removed");
  };

  const handleAddPartnerProject = async (projectData) => {
    // Ensure owner is compliant with backend schema ('Client') while preserving partner metadata
    const payload = {
      ...projectData,
      owner: 'Client',
      tags: ['Partner', projectData.partnerCompany, projectData.partnerCategory].filter(Boolean)
    };

    try {
      const res = await api.post('/projects', payload);
      if (res.data.success) {
        const newProj = res.data.data || res.data.project;
        setOnboardingProjects(prev => [newProj, ...prev]);
        try {
          const existing = JSON.parse(localStorage.getItem("hattech_local_projects") || "[]");
          localStorage.setItem("hattech_local_projects", JSON.stringify([newProj, ...existing.filter(p => p._id !== newProj._id)]));
        } catch (e) {}
        toast.success(`Project added for ${projectData.partnerCompany}!`);
      }
    } catch (err) {
      console.error(err);
      const fallbackProj = {
        _id: 'temp_' + Date.now(),
        ...payload,
        createdAt: new Date().toISOString()
      };
      setOnboardingProjects(prev => [fallbackProj, ...prev]);
      try {
        const existing = JSON.parse(localStorage.getItem("hattech_local_projects") || "[]");
        localStorage.setItem("hattech_local_projects", JSON.stringify([fallbackProj, ...existing]));
      } catch (e) {}
      toast.success(`Project created for ${projectData.partnerCompany}!`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Projects, Tasks, and Employees
        const [projRes, taskRes, empRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks'),
          api.get('/employees')
        ]);

        const serverProjects = projRes.data.data || [];
        let localProjects = [];
        try {
          localProjects = JSON.parse(localStorage.getItem("hattech_local_projects") || "[]");
        } catch (e) {}

        const serverIds = new Set(serverProjects.map(p => String(p._id || p.id)));
        const missingLocal = localProjects.filter(lp => !serverIds.has(String(lp._id || lp.id)));
        const allProjects = [...serverProjects, ...missingLocal];

        const allTasks = taskRes.data.tasks || taskRes.data.data || [];
        const allEmps = empRes.data.data || empRes.data.employees || [];

        // Build name map
        const map = {};
        allEmps.forEach(emp => {
          if (emp.userId?._id || emp.userId) {
            map[emp.userId?._id || emp.userId] = emp.name;
          }
        });

        setNameMap(map);
        setEmployees(allEmps.filter(emp => emp.status !== 'inactive'));
        setTasks(allTasks);
        setOnboardingProjects(allProjects);

        // Fetch partner companies from backend MongoDB & projects
        try {
          let serverPartners = [];
          try {
            const configRes = await api.get('/hr/config/partner_companies');
            if (configRes.data.success && Array.isArray(configRes.data.data?.value)) {
              serverPartners = configRes.data.data.value;
            }
          } catch (err) {}

          const map = new Map();
          // Current local
          partnerCompanies.forEach(p => p && p.name && map.set(p.name.toLowerCase().trim(), p));
          // Server config
          serverPartners.forEach(p => {
            if (!p || !p.name) return;
            const key = p.name.toLowerCase().trim();
            const existing = map.get(key);
            map.set(key, {
              ...existing,
              ...p,
              logo: p.logo || existing?.logo || (key === 'novarch' ? '/novarch-logo.png' : '')
            });
          });
          // From all projects
          allProjects.forEach(p => {
            if (p.partnerCompany) {
              const key = p.partnerCompany.toLowerCase().trim();
              const existing = map.get(key);
              if (!existing) {
                map.set(key, {
                  id: p.partnerCompanyId || String(Date.now()),
                  name: p.partnerCompany,
                  logo: p.partnerCompanyLogo || (key === 'novarch' ? '/novarch-logo.png' : ''),
                  description: 'Partner Company'
                });
              } else if (!existing.logo && (p.partnerCompanyLogo || key === 'novarch')) {
                existing.logo = p.partnerCompanyLogo || '/novarch-logo.png';
              }
            }
          });

          if (map.has('novarch')) {
            const nov = map.get('novarch');
            if (!nov.logo) nov.logo = '/novarch-logo.png';
          }

          const mergedPartners = Array.from(map.values());
          if (mergedPartners.length > 0) {
            setPartnerCompanies(mergedPartners);
            localStorage.setItem("hattech_partner_companies", JSON.stringify(mergedPartners));
            window.dispatchEvent(new Event("partnerCompaniesUpdated"));
          }
        } catch (partnerErr) {
          console.error("Error syncing partner companies", partnerErr);
        }

      } catch (error) {
        console.error("Error loading projects", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Remove userRole dependency to prevent double fetch if role is stable, or keep if dynamic. Let's keep it empty for speed if role doesn't change mid-session.

  const handleStatusUpdate = async (projectId, newStatus) => {
    try {
      const res = await api.put(`/projects/${projectId}`, { status: newStatus });
      if (res.data.success) {
        setOnboardingProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: newStatus } : p));
      }
    } catch (error) {
      console.error("Failed to update project status", error);
      toast.error("Failed to update project status");
    }
  };

  const handleDeleteProject = async (projectId) => {
    const isConfirmed = await confirm({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone and will remove all associated tasks and discussions.',
      type: 'danger',
      confirmText: 'Delete Project',
      cancelText: 'Cancel'
    });

    if (!isConfirmed) return;
    try {
      const res = await api.delete(`/projects/${projectId}`);
      if (res.data.success) {
        setOnboardingProjects(prev => prev.filter(p => p._id !== projectId));
        toast.success("Project deleted successfully");
      }
    } catch (error) {
      console.error("Failed to delete project", error);
      toast.error("Failed to delete project");
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProject = async (updatedData) => {
    try {
      const targetId = editingProject._id || editingProject.id;
      const res = await api.put(`/projects/${targetId}`, updatedData);
      if (res.data.success) {
        const updatedProject = res.data.data || res.data.project;
        setOnboardingProjects(prev => prev.map(p => {
          const pid = p._id || p.id;
          return (pid && pid === targetId) ? { ...p, ...updatedProject } : p;
        }));
        setEditingProject(null);
        toast.success("Project updated successfully");
      }
    } catch (error) {
      console.error("Failed to update project", error);
      toast.error("Failed to update project: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm mb-6">
        <h1 className="text-2xl font-bold text-theme-primary">Projects</h1>
        <div className="flex items-center gap-3">
          {(userRole === 'admin' || userRole === 'it_support' || userRole === 'manager') && (
            <button
              onClick={() => setShowAddPartnerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#004AAE] to-[#1E6BFF] !text-white rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95 group border border-white/10 cursor-pointer"
              title="Add Partner Company"
            >
              <FiBriefcase size={18} className="!text-white" />
              <span className="text-sm font-bold !text-white">Add Partner Company</span>
            </button>
          )}
          {(userRole === 'admin' || userRole === 'it_support') && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-task-assign'))}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#004AAE] to-[#1E6BFF] !text-white rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95 group border border-white/10 cursor-pointer"
            >
              <FiCheckSquare size={18} className="!text-white" />
              <span className="text-sm font-bold !text-white">Task Assign</span>
            </button>
          )}
          {(userRole === "admin" || userRole === "manager" || userRole === "projecthead" || userRole === "it_support") && (
            <button
              onClick={() => setActiveTab("onboarding")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#004AAE] to-[#1E6BFF] !text-white rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95 group border border-white/10 cursor-pointer"
              title="Add Onboarding Project"
            >
              <FiPlus size={20} className="!text-white group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-sm font-bold !text-white">New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <Tab
          label="Client Projects"
          active={activeTab.startsWith("client")}
          onClick={() => setActiveTab("client")}
        />
        <Tab
          label="Our Company"
          active={activeTab.startsWith("internal")}
          onClick={() => setActiveTab("internal")}
          isInternal
        />
        <Tab
          label="Credentials"
          active={activeTab === "credentials"}
          onClick={() => setActiveTab("credentials")}
        />
        <Tab
          label="All Projects"
          active={activeTab === "list"}
          onClick={() => setActiveTab("list")}
        />
        <Tab
          label="Monthly Subscription"
          active={activeTab === "monthly-subscriptions"}
          onClick={() => setActiveTab("monthly-subscriptions")}
        />
      </div>

      {/* ================= SUB TABS FOR CLIENT / INTERNAL ================= */}
      {(activeTab.startsWith("internal") || activeTab.startsWith("client")) && (
        <div className="flex flex-wrap gap-3 p-1 pl-4 border-l-2 border-theme/30 animate-in slide-in-from-left-2 duration-300">
          <button
            onClick={() => setActiveTab(activeTab.split('-')[0])}
            className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all
              ${!activeTab.includes('-') ? 'bg-[#004AAE] text-white shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab(`${activeTab.split('-')[0]}-active`)}
            className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all
              ${activeTab.endsWith('-active') ? 'bg-[#004AAE] text-white shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab(`${activeTab.split('-')[0]}-completed`)}
            className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all
              ${activeTab.endsWith('-completed') ? 'bg-[#004AAE] text-white shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab(`${activeTab.split('-')[0]}-delivered`)}
            className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all
              ${activeTab.endsWith('-delivered') ? 'bg-[#004AAE] text-white shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
            Delivered
          </button>
          <button
            onClick={() => setActiveTab(`${activeTab.split('-')[0]}-on-domain`)}
            className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all
              ${activeTab.endsWith('-on-domain') ? 'bg-[#004AAE] text-white shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
            On Domain
          </button>
          <button
            onClick={() => setActiveTab(`${activeTab.split('-')[0]}-on-localhost`)}
            className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all
              ${activeTab.endsWith('-on-localhost') ? 'bg-[#004AAE] text-white shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
            On Localhost
          </button>
        </div>
      )}

      {/* ================= SUB TABS FOR PARTNER COMPANY ================= */}
      {isPartnerTab && currentPartner && (
        <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border mb-4 animate-in fade-in duration-300 ${
          isLight ? 'bg-white border-gray-200' : 'bg-[var(--bg-card)] border-[var(--border-color)]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" title="Click to change logo">
              {currentPartner.logo || (currentPartner.name?.toLowerCase() === 'novarch' ? '/novarch-logo.png' : '') ? (
                <img 
                  src={currentPartner.logo || '/novarch-logo.png'} 
                  alt={currentPartner.name} 
                  className="w-10 h-10 rounded-xl object-cover border border-[#004AAD]/40 shadow-md group-hover:opacity-75 transition" 
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#004AAD]/10 border border-[#004AAD]/30 flex items-center justify-center text-[#004AAD] font-black text-lg group-hover:bg-[#004AAD]/20 transition">
                  {currentPartner.name.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition cursor-pointer text-white">
                <FiCamera size={16} />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleUpdatePartnerLogo(currentPartner.id, e.target.files?.[0])} 
                />
              </label>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-theme-primary">{currentPartner.name}</h3>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#004AAD]/10 text-[#004AAD] border border-[#004AAD]/20">Partner</span>
                <label className="text-[11px] text-[#004AAD] hover:underline cursor-pointer flex items-center gap-1 font-semibold ml-2">
                  <FiCamera size={12} />
                  <span>Change Logo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleUpdatePartnerLogo(currentPartner.id, e.target.files?.[0])} 
                  />
                </label>
              </div>
              <p className="text-xs text-theme-secondary">{currentPartner.description || currentPartner.website || "Collaborative Partner Initiative"}</p>
            </div>
          </div>

          {/* Sub-tabs & Add Project Button */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'prototype', label: 'Prototype' },
              { id: 'collaborated', label: 'Collaborated Project' },
              { id: 'ongoing', label: 'On Going' },
              { id: 'delivered', label: 'Delivered' }
            ].map(sub => {
              const isSubActive = currentPartnerSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveTab(sub.id === 'all' ? `partner_${currentPartner.id}` : `partner_${currentPartner.id}-${sub.id}`)}
                  className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isSubActive
                      ? 'bg-[#004AAE] text-white shadow-lg'
                      : 'text-theme-secondary hover:text-theme-primary bg-[var(--bg-inner)] hover:bg-[#004AAD]/10'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}

            <button
              onClick={() => {
                setSelectedPartnerForProject(currentPartner);
                setShowAddPartnerProjectModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-br from-[#004AAE] to-[#1E6BFF] !text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer ml-1"
            >
              <FiPlus size={16} />
              <span>Add Project</span>
            </button>

            <button
              onClick={() => handleDeletePartnerCompany(currentPartner.id)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
              title="Delete Partner Company"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB CONTENT ================= */}
      {(activeTab === "list" || activeTab === "active" || activeTab === "completed" || activeTab === "delivered" || activeTab.startsWith("internal") || activeTab.startsWith("client") || activeTab.startsWith("partner_")) && (
        <ProjectList
          projects={onboardingProjects}
          tasks={tasks}
          employees={employees} // Added missing prop
          nameMap={nameMap}
          userRole={userRole}
          activeTab={activeTab}
          partnerCompanies={partnerCompanies}
          isLight={isLight}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDeleteProject}
          onEdit={handleEditProject}
        />
      )}
      {activeTab === "onboarding" && (userRole === "admin" || userRole === "manager" || userRole === "projecthead" || userRole === "it_support") && <OnboardingProjects onboardingProjects={onboardingProjects} setOnboardingProjects={setOnboardingProjects} employees={employees} isLight={isLight} />}
      {activeTab === "monthly-subscriptions" && <MonthlySubscriptions />}
      {activeTab === "credentials" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {onboardingProjects.filter(p => !isAnyPartnerProject(p, partnerCompanies) && p.credentials && p.credentials.length > 0).map((project, i) => (
            <div key={i} className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-gray-100' : 'bg-[var(--bg-card)] border-[var(--border-color)]'} shadow-xl group hover:scale-[1.01] transition-all`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-theme-primary leading-tight">{project.title}</h3>
                  <p className="text-xs text-theme-secondary mt-1">{project.owner === 'Our Company' ? 'Internal Project' : 'Client Project'}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-500 font-bold uppercase border border-green-500/20">
                  {project.credentials.length} Set(s) Stored
                </span>
              </div>

              <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {project.credentials.map((cred, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-theme-tertiary/20 border border-theme/30 space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-[#004AAE] uppercase tracking-wider">{cred.label || `Credential ${idx + 1}`}</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-theme-secondary uppercase block mb-0.5">Project Link</label>
                      <a
                        href={ensureAbsoluteUrl(cred.link)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 text-xs break-all hover:underline font-medium block"
                      >
                        {cred.link || 'Internal/No link'}
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-theme-secondary uppercase block mb-0.5">Gmail / User</label>
                        <p className="text-xs text-theme-primary truncate font-semibold">{cred.gmail || '--'}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-theme-secondary uppercase block mb-0.5">Password</label>
                        <p className="text-xs text-theme-primary truncate font-semibold font-mono">{cred.password || '--'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {onboardingProjects.filter(p => p.credentials && p.credentials.length > 0).length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-theme-secondary italic">No projects have credentials stored yet.</p>
            </div>
          )}
        </div>
      )}

      {/* GLOBAL LOADING OVERLAY */}
      {loading && <LoadingSpinner />}

      {/* EDIT MODAL */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={handleSaveProject}
          isLight={isLight}
        />
      )}

      {/* ADD PARTNER COMPANY MODAL */}
      <AddPartnerCompanyModal
        isOpen={showAddPartnerModal}
        onClose={() => setShowAddPartnerModal(false)}
        onSave={(newPartner) => {
          savePartnerCompanies([...partnerCompanies, newPartner]);
          setActiveTab(`partner_${newPartner.id}`);
          toast.success(`${newPartner.name} added as Partner Company!`);
        }}
        isLight={isLight}
      />

      {/* ADD PARTNER PROJECT MODAL */}
      <AddPartnerProjectModal
        isOpen={showAddPartnerProjectModal}
        onClose={() => {
          setShowAddPartnerProjectModal(false);
          setSelectedPartnerForProject(null);
        }}
        partner={selectedPartnerForProject}
        employees={employees}
        onSave={handleAddPartnerProject}
        isLight={isLight}
      />
    </div>
  );
}

/* ================= TAB BUTTON ================= */

function Tab({ label, active, onClick, isInternal }) {
  if (isInternal) {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-lg text-sm transition font-bold
          ${active
            ? "bg-purple-600 text-white shadow-lg ring-2 ring-purple-600/10"
            : "bg-purple-600/10 text-purple-600 hover:bg-purple-600/20"
          }`}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm transition font-bold
        ${active
          ? "bg-[#004AAE] text-white shadow-lg"
          : "bg-[#004AAE]/10 text-[#004AAE] hover:bg-[#004AAE]/20"
        }`}
    >
      {label}
    </button>
  );
}

/* ================= HELPER: PARTNER PROJECT ISOLATION ================= */
export const isProjectOfPartner = (project, partnerId, partnerName) => {
  if (!project) return false;
  const pId = String(project.partnerCompanyId || '').trim();
  const pCompany = String(project.partnerCompany || '').trim().toLowerCase();
  const pOwner = String(project.owner || '').trim().toLowerCase();
  const pTags = Array.isArray(project.tags) ? project.tags.map(t => String(t).trim().toLowerCase()) : [];

  const targetId = String(partnerId || '').trim();
  const targetName = String(partnerName || '').trim().toLowerCase();

  // Match by partner ID if present
  if (targetId && pId && pId === targetId) return true;

  // Match by exact company name
  if (targetName) {
    if (pCompany && pCompany === targetName) return true;
    if (pOwner && pOwner === targetName) return true;
    if (pTags.includes(targetName) || pTags.includes(`partner:${targetName}`)) return true;
  }

  return false;
};

export const isAnyPartnerProject = (project, partnerCompanies = []) => {
  if (!project) return false;
  if (project.partnerCompanyId || project.partnerCompany || project.partnerCategory) return true;
  if (Array.isArray(project.tags) && project.tags.some(t => {
    const st = String(t).toLowerCase();
    return st === 'partner' || st.startsWith('partner:');
  })) return true;

  const pOwner = String(project.owner || '').trim().toLowerCase();
  if (pOwner && pOwner !== 'client' && pOwner !== 'our company') {
    const isPartnerOwner = (partnerCompanies || []).some(pc => (pc.name || '').trim().toLowerCase() === pOwner);
    if (isPartnerOwner) return true;
  }

  return false;
};

/* ================= UPDATED PROJECT LIST ================= */

function ProjectList({ projects, tasks, employees, nameMap, userRole, activeTab, partnerCompanies = [], isLight, onStatusUpdate, onDelete, onEdit }) {
  // Use projects directly
  const allProjects = projects.filter(p => !!p).map(p => {
    // Find tasks for this project
    const projectTasks = tasks.filter(t =>
      (t.project?._id || t.project) === p._id ||
      (t.project?.title || t.project) === p.title
    );

    const totalTasks = projectTasks.length;
    let progress = p.progress || 0;

    if (totalTasks > 0) {
      let totalWeight = 0;
      let completedWeight = 0;

      projectTasks.forEach(task => {
        totalWeight += 1;
        if (task.milestones && task.milestones.length > 0) {
          const msTotal = task.milestones.length;
          const msCompleted = task.milestones.filter(m => m.status === 'completed' || m.status === 'Completed').length;
          completedWeight += (msCompleted / msTotal);
        } else {
          if (task.status === 'completed' || task.status === 'Completed') {
            completedWeight += 1;
          }
        }
      });
      progress = Math.round((completedWeight / totalWeight) * 100);
    }

    // Milestone-specific progress calculation
    let milestoneProgress = 0;
    const allMilestones = [];
    projectTasks.forEach(task => {
      if (task.milestones && task.milestones.length > 0) {
        task.milestones.forEach(m => allMilestones.push(m));
      }
    });

    if (allMilestones.length > 0) {
      const msCompleted = allMilestones.filter(m => (m.status || '').toLowerCase() === 'completed').length;
      milestoneProgress = Math.round((msCompleted / allMilestones.length) * 100);
    }

    const currentStatus = (p.status || 'active').toLowerCase();

    // Get unique team members from tasks
    const teamMembersFromTasks = new Set();
    projectTasks.forEach(task => {
      if (task.assignedTo) {
        if (Array.isArray(task.assignedTo)) {
          task.assignedTo.forEach(id => {
            const memberId = id._id || id;
            if (memberId && nameMap[memberId]) {
              teamMembersFromTasks.add(nameMap[memberId]);
            }
          });
        } else {
          const memberId = task.assignedTo._id || task.assignedTo;
          if (memberId && nameMap[memberId]) {
            teamMembersFromTasks.add(nameMap[memberId]);
          }
        }
      }
    });

    // Merge directly assigned persons and task assignees
    const combinedTeam = new Set([...(p.assignedPersons || []), ...teamMembersFromTasks]);

    // SMART TEAM LEAD DETECTION
    const teamLeads = getSmartTeamLeads(p, employees);

    return {
      ...p,
      name: p.name || p.title || p.project || "Untitled Project",
      title: p.title || p.name || p.project || "Untitled Project",
      totalTasks: totalTasks,
      teamLeads,
      progress,
      milestoneProgress,
      tasks: projectTasks,
      assignedPersons: combinedTeam,
      status: currentStatus
    };
  });

  // Filter projects based on activeTab
  const filteredProjects = allProjects.filter(project => {
    const [category, status] = activeTab.split('-');
    const isInternal = project.owner === 'Our Company';
    const currentStatus = (project.status || 'active').toLowerCase();
    const isPartnerProj = isAnyPartnerProject(project, partnerCompanies);

    // Group 3: Partner Company Projects
    if (activeTab.startsWith('partner_')) {
      const [pPrefix, ...rest] = activeTab.split('-');
      const partnerId = pPrefix.replace('partner_', '');
      const subTab = rest.join('-') || 'all';
      const targetPartner = (partnerCompanies || []).find(c => String(c.id) === String(partnerId));
      const partnerName = (targetPartner?.name || '').trim().toLowerCase();

      // Project MUST strictly belong to this specific partner company
      const isPartnerMatch = isProjectOfPartner(project, partnerId, partnerName);
      if (!isPartnerMatch) return false;

      const cat = (project.partnerCategory || '').toLowerCase();
      const pStatus = (project.status || 'active').toLowerCase();
      const pType = (project.type || '').toLowerCase();

      if (subTab === 'all') return true;
      if (subTab === 'prototype') return cat.includes('prototype') || pType.includes('prototype');
      if (subTab === 'collaborated') return cat.includes('collab') || pType.includes('collab');
      if (subTab === 'ongoing') return cat.includes('ongoing') || pStatus === 'active' || pStatus === 'planning' || pStatus === 'on-domain' || pStatus === 'on-localhost';
      if (subTab === 'delivered') return cat.includes('delivered') || pStatus === 'delivered' || pStatus === 'completed';
      return true;
    }

    // STRICT ISOLATION: Partner company projects must NEVER leak into non-partner tabs
    if (isPartnerProj) {
      return false;
    }

    // Group 1: list/active/completed/delivered (Top-level or legacy non-partner projects)
    if (activeTab === 'list') return true;
    if (activeTab === 'active') return currentStatus === 'active';
    if (activeTab === 'completed') return currentStatus === 'completed';
    if (activeTab === 'delivered') return currentStatus === 'delivered';
    if (activeTab === 'on-domain') return currentStatus === 'on-domain';
    if (activeTab === 'on-localhost') return currentStatus === 'on-localhost';

    // Group 2: Nested categories (internal/client)
    if (category === 'internal' || category === 'client') {
      const categoryMatch = category === 'internal' ? isInternal : !isInternal;
      if (!categoryMatch) return false;
      
      // If no sub-status is selected (e.g. activeTab is just 'internal')
      if (!status) return true;
      
      // Handle status matching including new ones
      const normalizedStatus = status === 'delivered' ? 'delivered' : 
                               status === 'on' ? (activeTab.includes('on-domain') ? 'on-domain' : 'on-localhost') : 
                               status;

      // The split('-') for 'on-domain' is ['internal', 'on', 'domain']
      const actualStatus = activeTab.split('-').slice(1).join('-');
      
      return currentStatus === actualStatus;
    }

    if (activeTab === 'onboarding') {
      return (currentStatus === 'planning' || project.type === 'onboarding') &&
        currentStatus !== 'active' &&
        currentStatus !== 'completed' &&
        currentStatus !== 'delivered';
    }
    return true;
  });

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredProjects.length > 0 ? (
        filteredProjects.map((project, i) => (
          <ProjectCard
            key={i}
            project={project}
            userRole={userRole}
            activeTab={activeTab}
            isLight={isLight}
            onStatusChange={onStatusUpdate}
            onDelete={onDelete}
            onEdit={onEdit}
            employees={employees}
          />
        ))
      ) : (
        <div className="col-span-full text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No projects found</div>
          <div className="text-gray-500 text-sm">
            {userRole === "admin"
              ? "Create some tasks or onboarding projects to get started."
              : userRole === "manager"
                ? "Assign some tasks to employees to see projects here."
                : "No tasks have been assigned to you yet."
            }
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= UPDATED PROJECT CARD COMPONENT ================= */

function ProjectCard({ project, userRole, activeTab, isLight, onStatusChange, onDelete, onEdit, employees = [] }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const assignedPersons = Array.from(project.assignedPersons);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'delivered': return 'bg-purple-500';
      case 'on-domain': return 'bg-indigo-500';
      case 'on-localhost': return 'bg-cyan-500';
      case 'on-hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const handleAction = (e, status) => {
    e.stopPropagation();
    onStatusChange(project._id || project.id, status);
    setShowMenu(false);
  };

  const isOnboarding = project.type === 'onboarding';
  return (
    <div
      onClick={() => navigate(`/admin/project/${project._id || project.id}`)}
      className={`project-card${isLight ? ' light' : ''} cursor-pointer shadow-lg transition-all duration-300 overflow-hidden min-h-[400px] ${isOnboarding ? (isLight ? 'bg-blue-50' : 'bg-[#1a1333]') : ''} hover:scale-[1.02] hover:shadow-[#004AAD]/20`}
      style={{
        backgroundColor: isOnboarding ? (isLight ? '#f6f3ff' : '#1a1333') : 'var(--bg-card)',
        borderRadius: 16
      }}
    >
      <div className="p-5">
        {/* Project Header */}
        <div className="flex justify-between items-start mb-3 relative">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
              <h3 className="font-semibold text-lg text-theme-primary">
                {project.name || project.title || project.project || "Untitled Project"}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full 
                ${project.status === 'completed' ? 'bg-blue-500/20 text-blue-500' :
                  project.status === 'delivered' ? 'bg-purple-500/20 text-purple-500' :
                    'bg-green-500/10 text-green-500'}`}>
                {(project.status || 'Active').charAt(0).toUpperCase() + (project.status || 'Active').slice(1)}
              </span>
              {project.type === 'onboarding' ? (
                <span className="text-xs text-theme-muted">
                  Onboarding
                </span>
              ) : (
                <span className="text-xs text-theme-muted">
                  {project.totalTasks} tasks
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border 
                ${project.owner === 'Our Company' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                {project.owner || "Client"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                {project.platform || "Web"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {project.type || "General"}
              </span>
              {project.stack && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  {project.stack}
                </span>
              )}
              {project.type === 'SEO' && project.seoType && project.seoType !== 'N/A' && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {project.seoType}
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 hover:bg-theme-tertiary rounded-full transition"
            >
              <FiMoreVertical className="text-theme-secondary" />
            </button>

            {showMenu && (
              <div
                className={`absolute right-0 mt-2 w-40 rounded-lg shadow-xl border z-20 overflow-hidden ${isLight ? 'bg-white border-gray-100' : 'bg-[#1e1b4b] border-[#312e81]'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  {project.status !== 'active' && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary transition text-theme-primary"
                      onClick={(e) => handleAction(e, 'active')}
                    >
                      Mark as Active
                    </button>
                  )}
                  {project.status !== 'completed' && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary transition text-theme-primary"
                      onClick={(e) => handleAction(e, 'completed')}
                    >
                      Mark as Completed
                    </button>
                  )}
                  {project.status !== 'delivered' && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary transition text-theme-primary"
                      onClick={(e) => handleAction(e, 'delivered')}
                    >
                      Mark as Delivered
                    </button>
                  )}
                  {project.status !== 'on-domain' && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary transition text-theme-primary"
                      onClick={(e) => handleAction(e, 'on-domain')}
                    >
                      Mark as On Domain
                    </button>
                  )}
                  {project.status !== 'on-localhost' && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary transition text-theme-primary"
                      onClick={(e) => handleAction(e, 'on-localhost')}
                    >
                      Mark as On Localhost
                    </button>
                  )}
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary transition text-theme-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(project);
                      setShowMenu(false);
                    }}
                  >
                    Edit Project
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-500/10 text-red-500 transition border-t border-theme mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(project._id || project.id);
                      setShowMenu(false);
                    }}
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-theme-muted">Progress</span>
            <span className="text-sm font-medium text-[#004AAD]">{project.progress}%</span>
          </div>
          <div className="h-2 w-full bg-theme-secondary rounded-full">
            <div
              className="h-2 rounded-full bg-[#004AAD] transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Milestone Progress Bar (If milestones exist) */}
        {project.hasMilestones && (
          <div className="mb-4 animate-in fade-in slide-in-from-left-2 duration-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-theme-secondary uppercase tracking-wider flex items-center gap-1">
                <FiLayers className="text-purple-500" /> Milestone Progress
              </span>
              <span className="text-xs font-bold text-purple-600">{project.milestoneProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-theme-secondary rounded-full">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-700"
                style={{ width: `${project.milestoneProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Always visible content (no click to expand needed) */}
        <div className="mt-4 pt-4 border-t border-theme">
          {/* Assigned Team Outer Box -> Display Team Leads Avatars & Names */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-theme-secondary mb-2">Assigned Team</h4>
            {(() => {
              const leads = getSmartTeamLeads(project, employees);
              if (leads.length === 0) {
                return (
                  <div className="text-xs text-gray-400 italic px-3 py-1.5 rounded-xl bg-gray-500/5 border border-gray-500/10 w-fit flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span>No Team Lead Assigned</span>
                  </div>
                );
              }
              return (
                <div className="flex flex-wrap gap-2.5">
                  {leads.map((lead, lIdx) => (
                    <div key={lIdx} className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
                      <img
                        src={lead.image}
                        alt={lead.name}
                        className="w-7 h-7 rounded-full object-cover border-2 border-amber-400 shadow-sm"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name)}&background=004AAD&color=fff&bold=true`;
                        }}
                      />
                      <div>
                        <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">👑 Lead {leads.length > 1 ? `#${lIdx + 1}` : ''}</div>
                        <div className="text-xs font-bold text-theme-primary">{lead.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Project Details */}
          {project.type === 'onboarding' ? (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-theme-secondary mb-2">Project Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-theme-muted">Client:</span>
                  <span className="text-xs font-medium text-theme-primary">
                    {project.client?.name || project.client?.username || (typeof project.client === 'string' ? project.client : "Pending")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-theme-muted">Start Date:</span>
                  <span className="text-xs font-medium text-theme-primary">{formatDateSafe(project.startDate)}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Task Status Summary for task-based projects */
            <div className="mb-4">
              <h4 className="text-sm font-medium text-theme-secondary mb-2">Task Overview</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-theme-tertiary">
                  <div className="text-xs text-theme-muted">In Progress</div>
                  <div className="font-medium text-theme-primary">
                    {(project.tasks || []).filter(t => t.status === "in-progress" || t.status === "In Progress").length}
                  </div>
                </div>
                <div className="p-2 rounded bg-theme-tertiary">
                  <div className="text-xs text-theme-muted">Completed</div>
                  <div className="font-medium text-theme-primary">
                    {(project.tasks || []).filter(t => t.status === "completed" || t.status === "Completed").length}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Delivered Details */}
          {activeTab === 'delivered' && (
            <div className="mt-4 pt-4 border-t border-theme">
              <div className="flex justify-between items-center">
                <span className="text-sm text-theme-muted">Delivered Date:</span>
                <span className="text-sm font-semibold text-[#004AAE]">{formatDateSafe(project.deliveredDate)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-theme-muted">Client:</span>
                <span className="text-sm font-semibold text-theme-primary">
                  {project.client?.name || project.client?.username || (typeof project.client === 'string' ? project.client : "Valued Client")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}

/* ================= ONBOARDING PROJECTS ================= */

/* ================= MODERNIZED ONBOARDING PROJECTS ================= */

function OnboardingProjects({ onboardingProjects, setOnboardingProjects, employees = [], isLight }) {
  const [form, setForm] = useState({
    project: "",
    owner: "Client",
    start: "",
    deadline: "",
  });

  const [services, setServices] = useState([
    { serviceType: 'Development', billingType: 'One-Time Project', techStack: '', assignedLead: '', teamMembers: [] }
  ]);

  const handleAddService = () => {
    setServices(prev => [
      ...prev,
      { serviceType: 'Development', billingType: 'One-Time Project', techStack: '', assignedLead: '', teamMembers: [] }
    ]);
  };

  const handleRemoveService = (index) => {
    if (services.length <= 1) return;
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index, field, val) => {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: val } : s));
  };

  const teamLeadsList = [
    { name: "Ali Musa", designation: "AI / ML Engineer" },
    { name: "Farrukh Saleem", designation: "PHP Web Developer" },
    { name: "Tehreem Ijaz", designation: "SEO & Digital Marketing" },
    { name: "Muhammad Salman", designation: "MERN Stack Lead" }
  ];

  // Dynamically include active team leads and project heads from employees list
  const activeLeadsMap = new Map();
  teamLeadsList.forEach(l => activeLeadsMap.set(l.name.toLowerCase(), l));

  (employees || []).forEach(emp => {
    if (emp.status === 'inactive') return;
    const role = (emp.role || emp.userId?.role || "").toLowerCase();
    const dept = (emp.department || "").toLowerCase();
    const name = cleanName(emp.name || emp.username);
    if (role === 'teamlead' || role === 'projecthead' || role === 'manager' || dept.includes('lead') || dept.includes('head')) {
      if (name && !activeLeadsMap.has(name.toLowerCase())) {
        activeLeadsMap.set(name.toLowerCase(), { name, designation: emp.designation || emp.role || "Team Lead" });
      }
    }
  });

  const availableTeamLeads = Array.from(activeLeadsMap.values());

  const addProject = async () => {
    if (!form.project || !form.start) {
      toast.error("Please enter Project Name and Start Date");
      return;
    }

    try {
      const deadlineDate = form.deadline ? new Date(form.deadline) : new Date(form.start);
      if (!form.deadline) deadlineDate.setMonth(deadlineDate.getMonth() + 1);

      const combinedTechStack = services.map(s => s.techStack).filter(Boolean).join(', ');
      const isSub = services.some(s => s.billingType === 'Monthly Subscription');

      const res = await api.post('/projects', {
        title: form.project,
        type: services[0]?.serviceType || 'Development',
        startDate: form.start,
        deadline: deadlineDate.toISOString(),
        status: 'active',
        description: `Onboarding project for ${form.project}`,
        owner: form.owner,
        stack: combinedTechStack,
        services: services,
        assignedLead: services[0]?.assignedLead || '',
        isSubscription: isSub,
        subscriptionCategory: isSub ? (services.find(s => s.billingType === 'Monthly Subscription')?.serviceType || 'Other') : 'N/A'
      });

      if (res.data.success) {
        const newProject = res.data.data || res.data.project;
        const formattedProject = {
          ...newProject,
          project: newProject.title || newProject.name,
          start: formatDateSafe(newProject.startDate),
          progress: newProject.progress || 0,
          owner: newProject.owner || form.owner,
          services: services,
          assignedLead: services[0]?.assignedLead || '',
          isSubscription: isSub
        };

        setOnboardingProjects(prev => [formattedProject, ...prev]);
        setForm({ project: "", owner: "Client", start: "", deadline: "" });
        setServices([{ serviceType: 'Development', billingType: 'One-Time Project', techStack: '', assignedLead: '', teamMembers: [] }]);
        toast.success("Project created successfully!");
      }
    } catch (error) {
      console.error("Failed to create project", error);
      toast.error(error.response?.data?.message || "Failed to create project");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ADD NEW PROJECT FORM CARD */}
      <div className={`
            p-6 md:p-8 rounded-2xl shadow-xl border backdrop-blur-sm transition-all duration-300
            ${isLight
          ? 'bg-white border-gray-100 shadow-blue-900/5'
          : 'bg-[#1e1b4b] border-[#312e81] shadow-black/40'
        }
          `}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-[#004AAD]/10 text-[#004AAD]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-xl text-theme-primary">Start New Project</h3>
            <p className="text-sm text-theme-muted">Define the basics for your new onboarding journey.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Project Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary ml-1">Project Name</label>
            <input
              className={`
                  w-full p-3 rounded-xl border transition-all duration-200 outline-none
                  focus:ring-2 focus:ring-[#004AAD]/20 focus:border-[#004AAD]
                  ${isLight
                  ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  : 'bg-[#151235] border-[#312e81] text-white placeholder-gray-500'
                }
                `}
              placeholder="e.g. CRM System Redesign"
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
            />
          </div>

          {/* Project Owner */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary ml-1">Project Owner</label>
            <div className="relative">
              <select
                className={`
                    w-full p-3 rounded-xl border appearance-none transition-all duration-200 outline-none
                    focus:ring-2 focus:ring-[#004AAD]/20 focus:border-[#004AAD]
                    ${isLight
                    ? 'bg-gray-50 border-gray-200 text-gray-900'
                    : 'bg-[#151235] border-[#312e81] text-white'
                  }
                  `}
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              >
                <option value="Client">Client Project</option>
                <option value="Our Company">Internal (Our Company)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary ml-1">Start Date</label>
            <input
              type="date"
              className={`
                  w-full p-3 rounded-xl border transition-all duration-200 outline-none
                  focus:ring-2 focus:ring-[#004AAD]/20 focus:border-[#004AAD]
                  ${isLight
                  ? 'bg-gray-50 border-gray-200 text-gray-900'
                  : 'bg-[#151235] border-[#312e81] text-white'
                }
                `}
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
            />
          </div>

          {/* Deadline Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary ml-1">Deadline (Optional)</label>
            <input
              type="date"
              className={`
                  w-full p-3 rounded-xl border transition-all duration-200 outline-none
                  focus:ring-2 focus:ring-[#004AAD]/20 focus:border-[#004AAD]
                  ${isLight
                  ? 'bg-gray-50 border-gray-200 text-gray-900'
                  : 'bg-[#151235] border-[#312e81] text-white'
                }
                `}
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

        </div>

        {/* DYNAMIC MULTI-SERVICES SECTION */}
        <div className="space-y-6 mb-8 pt-4 border-t border-gray-200 dark:border-gray-800">
          <h4 className="text-base font-bold text-theme-primary flex items-center gap-2">
            <span>Project Services & Team Assignments</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">{services.length} Service{services.length > 1 ? 's' : ''}</span>
          </h4>

          {services.map((svc, sIdx) => (
            <div key={sIdx} className={`p-5 rounded-2xl border transition-all relative ${isLight ? 'bg-gray-50/80 border-gray-200' : 'bg-[#151235] border-[#312e81]'}`}>
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveService(sIdx)}
                  className="absolute top-4 right-4 text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1 bg-red-500/10 rounded-lg transition-colors"
                >
                  Remove Service
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Service Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary">Service Type #{sIdx + 1}</label>
                  <select
                    className={`w-full p-3 rounded-xl border outline-none ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1e1b4b] border-[#312e81] text-white'}`}
                    value={svc.serviceType}
                    onChange={(e) => handleServiceChange(sIdx, 'serviceType', e.target.value)}
                  >
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="SEO">SEO</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Billing Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary">Billing Type</label>
                  <select
                    className={`w-full p-3 rounded-xl border outline-none ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1e1b4b] border-[#312e81] text-white'}`}
                    value={svc.billingType || 'One-Time Project'}
                    onChange={(e) => handleServiceChange(sIdx, 'billingType', e.target.value)}
                  >
                    <option value="One-Time Project">One-Time Project</option>
                    <option value="Monthly Subscription">Monthly Subscription</option>
                  </select>
                </div>

                {/* Tech Stack for this Service */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary">Tech Stack</label>
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, Python, Laravel"
                    className={`w-full p-3 rounded-xl border outline-none ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1e1b4b] border-[#312e81] text-white'}`}
                    value={svc.techStack || ''}
                    onChange={(e) => handleServiceChange(sIdx, 'techStack', e.target.value)}
                  />
                </div>

                {/* Assigned Team Lead */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary">Assigned Lead</label>
                  <select
                    className={`w-full p-3 rounded-xl border outline-none ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1e1b4b] border-[#312e81] text-white'}`}
                    value={svc.assignedLead || ''}
                    onChange={(e) => handleServiceChange(sIdx, 'assignedLead', e.target.value)}
                  >
                    <option value="">-- Select Team Lead --</option>
                    {availableTeamLeads.map((lead, lIdx) => (
                      <option key={lIdx} value={lead.name}>
                        {lead.name} ({lead.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* + ADD ANOTHER SERVICE FORM BUTTON */}
          <button
            type="button"
            onClick={handleAddService}
            className="w-full py-3.5 rounded-xl border-2 border-dashed border-[#004AAD]/50 hover:border-[#004AAD] text-[#004AAD] font-bold transition-all flex items-center justify-center gap-2 hover:bg-[#004AAD]/5 active:scale-[0.99]"
          >
            <FiPlus size={20} />
            <span>+ Add Another Service Form</span>
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-end md:w-1/2 md:ml-auto">
          <button
            onClick={addProject}
            className="w-full py-3.5 rounded-xl bg-[#004AAD] hover:bg-[#003882] text-white font-bold 
                       shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:-translate-y-0.5 
                       transform transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
            Create Project
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-theme-primary">Onboarding Pipeline</h3>
        <span className="text-xs font-medium px-3 py-1 bg-[#004AAD]/10 text-[#004AAD] rounded-full border border-[#004AAD]/20">
          {onboardingProjects.length} Pending
        </span>
      </div>

      {/* PROJECT CARDS GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {onboardingProjects.filter(p => {
          if (!p) return false;
          const currentStatus = (p.status || 'active').toLowerCase();
          return (p.type === 'onboarding' || currentStatus === 'planning') &&
            currentStatus !== 'active' &&
            currentStatus !== 'completed' &&
            currentStatus !== 'delivered';
        }).map((p, i) => {
          if (!p) return null;
          const leadName = (p.services && p.services[0]?.assignedLead) || p.assignedLead || null;
          return (
            <div key={i}
              className={`
                group relative p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                ${isLight
                  ? 'bg-white border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-blue-900/10 hover:border-blue-500/30'
                  : 'bg-[#1e1b4b] border-[#312e81] shadow-lg shadow-black/20 hover:border-blue-500/50'
                }
              `}
            >
              {/* Top Badge: Platform & Type */}
              <div className="absolute top-6 right-6 flex gap-2">
                <span className={`
                  text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md
                  ${p?.platform === 'Web' ? 'bg-indigo-500/10 text-indigo-500' :
                    p?.platform === 'Mobile' ? 'bg-pink-500/10 text-pink-500' : 'bg-green-500/10 text-green-500'}
                `}>
                  {p?.platform || "Web"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-blue-500/10 text-blue-500">
                  {p?.type || "Development"}
                </span>
              </div>

              <div className="mb-6 mt-6">
                <h4 className="text-lg font-bold text-theme-primary pr-24 line-clamp-1 group-hover:text-[#004AAD] transition-colors" title={p.project || p.title || p.name}>
                  {p.project || p.title || p.name}
                </h4>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-theme-muted">Client</span>
                  <span className="font-semibold text-theme-primary">
                    {p.client?.name || p.client?.username || (typeof p.client === 'string' ? p.client : null) || <span className="text-gray-400 italic font-normal">Pending Assignment</span>}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-theme-muted">Kickoff</span>
                  <span className="font-medium text-theme-primary bg-theme-tertiary px-2 py-0.5 rounded text-xs">{formatDateSafe(p.start || p.startDate)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-theme-muted">Deadline</span>
                  <span className="font-medium text-theme-primary bg-theme-tertiary px-2 py-0.5 rounded text-xs">
                    {formatDateSafe(p.deadline)}
                  </span>
                </div>
              </div>

              {/* PROGRESS SECTION */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-theme-muted font-medium">Onboarding Status</span>
                  <span className="font-bold text-[#004AAD]">{p.progress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#004AAD] to-blue-400 rounded-full transition-all duration-500 relative"
                    style={{ width: `${p.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>

              {/* Outer Card Assigned Team Lead Display */}
              <div className="mt-5 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                    <span>👑 Team Lead:</span>
                    <span className="text-theme-primary font-bold normal-case">{leadName || "Unassigned"}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Empty State Card */}
        {onboardingProjects.length === 0 && (
          <div className={`
               col-span-full border-2 border-dashed rounded-xl p-12 text-center
               ${isLight ? 'border-gray-200 bg-gray-50' : 'border-gray-700 bg-white/5'}
            `}>
            <p className="text-theme-muted">No onboarding projects yet.</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[#004AAD] text-sm font-medium mt-2 hover:underline">Create your first one above</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= PROJECT TASKS ================= */

function ProjectTasks({ tasks, setTasks }) {
  const updateTaskStatus = (index, newStatus) => {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, status: newStatus } : task
    );
    setTasks(updatedTasks);
  };

  const updateTaskProgress = (index, progress) => {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, progress: progress } : task
    );
    setTasks(updatedTasks);
  };

  return (
    <div className="space-y-3">
      {tasks.map((t, i) => (
        <div key={i} className="p-4 rounded-lg bg-[var(--bg-card)] shadow">
          <div className="space-y-3">
            <div>
              <p className="font-medium">{t.title}</p>
              <p className="text-sm text-[#004AAD]">{t.project}</p>
              <p className="text-xs text-gray-400">Assigned to: {t.assignedTo?.name || t.assignedTo?.username || String(t.assignedTo || "Unassigned")}</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Progress</span>
                <span className="text-xs font-medium text-[#004AAD]">{t.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-700 rounded">
                <div
                  className="h-1.5 rounded bg-[#004AAD]"
                  style={{ width: `${t.progress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <select
                value={t.status}
                onChange={(e) => updateTaskStatus(i, e.target.value)}
                className="text-sm px-3 py-1 rounded bg-gray-800 border border-gray-700"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateTaskProgress(i, Math.max(0, t.progress - 10))}
                  className="px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700"
                >
                  -10%
                </button>
                <button
                  onClick={() => updateTaskProgress(i, Math.min(100, t.progress + 10))}
                  className="px-2 py-1 text-xs rounded bg-[#004AAD] hover:bg-[#003882]"
                >
                  +10%
                </button>
              </div>
            </div>

            {t.assignedPersons && t.assignedPersons.length > 0 && (
              <div>
                <p className="text-xs text-gray-300 mb-1">Team:</p>
                <div className="flex flex-wrap gap-1">
                  {t.assignedPersons.map((person, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-gray-800">
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function EditProjectModal({ project, onClose, onSave, isLight }) {
  const [form, setForm] = useState({
    title: project.title || project.name || "",
    type: project.type || "Development",
    platform: project.platform || "Web",
    owner: project.owner || "Client",
    status: project.status || "active",
    priority: project.priority || "medium",
    deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : "",
    description: project.description || "",
    stack: project.stack || ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className={`p-8 rounded-2xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in duration-300 ${isLight ? 'bg-white' : 'bg-[#1e1e2d] border border-gray-700'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-theme-primary">Edit Project</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-500/10 rounded-full transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#004AAD]">Project Title</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required className={`w-full rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#004AAD]/50 border transition-all ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#004AAD]">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={`w-full rounded-xl px-4 py-3 outline-none border transition-all ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="delivered">Delivered</option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#004AAD]">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className={`w-full rounded-xl px-4 py-3 outline-none border transition-all ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="SEO">SEO</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#004AAD]">Platform</label>
              <select name="platform" value={form.platform} onChange={handleChange} className={`w-full rounded-xl px-4 py-3 outline-none border transition-all ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}>
                <option value="Web">Web</option>
                <option value="Mobile">Mobile</option>
                <option value="Desktop">Desktop</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#004AAD]">Owner</label>
              <select name="owner" value={form.owner} onChange={handleChange} className={`w-full rounded-xl px-4 py-3 outline-none border transition-all ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}>
                <option value="Client">Client</option>
                <option value="Our Company">Our Company</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#004AAD]">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className={`w-full rounded-xl px-4 py-3 outline-none border transition-all ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
             <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#004AAD]">Deadline</label>
              <input type="date" name="deadline" value={form.deadline} onChange={handleChange} required className={`w-full rounded-xl px-4 py-3 outline-none border transition-all ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#004AAD]">Tech Stack</label>
              <input type="text" name="stack" value={form.stack} onChange={handleChange} placeholder="e.g. React, Node.js, Laravel" className={`w-full rounded-xl px-4 py-3 outline-none border transition-all ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#004AAD]">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className={`w-full rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#004AAD]/50 border transition-all min-h-[100px] ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`} />
          </div>

          {/* TEAM & LEAD ASSIGNMENTS SECTION */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-bold text-[#004AAD] uppercase tracking-wider">Project Team Structure & Hierarchy</h4>
            
            {/* 1. PROJECT HEAD / TEAM LEAD CARD */}
            {(() => {
              const leadName = getSmartTeamLead(project);
              return (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'}`}>
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(leadName)}&background=004AAD&color=fff&bold=true`}
                      alt={leadName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leadName)}&background=004AAD&color=fff`;
                      }}
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                        <span>👑 Team Lead / Project Head</span>
                      </span>
                      <h5 className="text-sm font-bold text-theme-primary">{leadName}</h5>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
                    Lead Supervisor
                  </span>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. Currently Working Team Members */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/40'}`}>
                <h5 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Assigned Team Members ({ (project.team || []).filter(t => t.status !== 'inactive').length })
                </h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(project.team || []).filter(t => t.status !== 'inactive').map((emp, idx) => (
                    <div key={idx} className="text-xs font-medium text-theme-primary flex items-center justify-between p-1.5 bg-black/5 dark:bg-white/5 rounded-lg">
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {cleanName(emp.name || emp.username || (typeof emp === 'string' ? emp : 'Employee'))}
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Active Member</span>
                    </div>
                  ))}
                  {(project.team || []).filter(t => t.status !== 'inactive').length === 0 && (
                    <p className="text-xs text-gray-400 italic">No direct team members assigned yet</p>
                  )}
                </div>
              </div>

              {/* 3. Previously Worked / Ex-Employees */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'}`}>
                <h5 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Previously Worked / Ex-Employees
                </h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {((project.assignmentHistory && project.assignmentHistory.filter(h => h.status === 'previous')) || (project.team || []).filter(t => t.status === 'inactive')).map((prevEmp, idx) => (
                    <div key={idx} className="text-xs font-medium text-theme-primary flex items-center justify-between p-1.5 bg-black/5 dark:bg-white/5 rounded-lg">
                      <span>{cleanName(prevEmp.name || prevEmp.username || 'Former Employee')}</span>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Ex-Employee</span>
                    </div>
                  ))}
                  {(!project.assignmentHistory || project.assignmentHistory.filter(h => h.status === 'previous').length === 0) && (project.team || []).filter(t => t.status === 'inactive').length === 0 && (
                    <p className="text-xs text-gray-400 italic">No previous employees recorded</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className={`flex-1 py-3 rounded-xl border font-bold transition-all ${isLight ? 'border-gray-300 hover:bg-gray-100' : 'border-[#312e81] hover:bg-white/5'}`}>Cancel</button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-[#004AAD] text-white font-bold shadow-lg shadow-blue-900/40 hover:bg-[#003882] hover:-translate-y-0.5 transition-all">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= ADD PARTNER COMPANY MODAL ================= */

function AddPartnerCompanyModal({ isOpen, onClose, onSave, isLight }) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo size should be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter partner company name");
      return;
    }

    onSave({
      id: Date.now().toString(),
      name: name.trim(),
      logo: logo || "",
      website: website.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString()
    });

    setName("");
    setLogo("");
    setWebsite("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl border ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1a1433] border-gray-700 text-white'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
        >
          <FiX size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#004AAD]/10 border border-[#004AAD]/20 flex items-center justify-center text-[#004AAD]">
            <FiBriefcase size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Add Partner Company</h3>
            <p className="text-xs text-gray-400">Create a collaborative partner company profile</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Partner Company Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NextGen Technologies"
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-bold ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Partner Company Logo
            </label>
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl border border-dashed border-[#004AAD]/40 bg-[#004AAD]/5 flex items-center justify-center overflow-hidden shrink-0">
                {logo ? (
                  <img src={logo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FiUpload className="text-[#004AAD]" size={20} />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#004AAD] file:text-white hover:file:bg-[#003882] cursor-pointer"
                />
                <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, SVG up to 2MB</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Website / Portfolio Link
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://partnercompany.com"
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-medium text-sm ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Description / Collaboration Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description about collaboration..."
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-medium text-sm resize-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition cursor-pointer ${isLight ? 'border-gray-200 text-gray-600 hover:bg-gray-100' : 'border-gray-700 text-gray-300 hover:bg-white/5'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#004AAD] hover:bg-[#003882] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-900/40 hover:-translate-y-0.5 transition cursor-pointer"
            >
              Add Partner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= ADD PARTNER PROJECT MODAL ================= */

function AddPartnerProjectModal({ isOpen, onClose, partner, employees, onSave, isLight }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Prototype");
  const [stack, setStack] = useState("");
  const [description, setDescription] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [assignedLead, setAssignedLead] = useState("");
  const [selectedTeam, setSelectedTeam] = useState([]);
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  if (!isOpen || !partner) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter project title");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || `${category} project for ${partner.name}`,
        owner: 'Client',
        partnerCompany: partner.name,
        partnerCompanyId: partner.id,
        partnerCategory: category,
        tags: ['Partner', partner.name, category],
        type: category === 'Prototype' ? 'Prototype' : 'Partner Project',
        stack: stack.trim(),
        assignedLead: assignedLead || undefined,
        assignedPersons: selectedTeam,
        deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: status,
        credentials: projectLink ? [{ link: projectLink, label: "Live / Prototype URL" }] : []
      };

      await onSave(payload);
      setTitle("");
      setStack("");
      setDescription("");
      setProjectLink("");
      setAssignedLead("");
      setSelectedTeam([]);
      setDeadline("");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl border max-h-[90vh] overflow-y-auto custom-scrollbar ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1a1433] border-gray-700 text-white'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
        >
          <FiX size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          {partner.logo ? (
            <img src={partner.logo} alt={partner.name} className="w-10 h-10 rounded-xl object-cover border border-[#004AAD]/40" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#004AAD]/10 border border-[#004AAD]/20 flex items-center justify-center text-[#004AAD] font-bold">
              {partner.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold">Add Project / Prototype</h3>
            <p className="text-xs text-[#004AAD] dark:text-blue-400 font-semibold">For Partner: {partner.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI Workflow Prototype"
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-bold ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Category / Sub-Tab *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-bold text-xs cursor-pointer ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
              >
                <option value="Prototype">Prototype</option>
                <option value="Collaborated Projects">Collaborated Project</option>
                <option value="Ongoing">On Going</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-bold text-xs cursor-pointer ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
              >
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="completed">Completed</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Tech Stack
            </label>
            <input
              type="text"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="e.g. Next.js, FastAPI, PostgreSQL"
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-medium text-sm ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Prototype / Figma / Live Link
            </label>
            <input
              type="text"
              value={projectLink}
              onChange={(e) => setProjectLink(e.target.value)}
              placeholder="https://figma.com/... or https://..."
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-medium text-sm ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Lead Supervisor
              </label>
              <select
                value={assignedLead}
                onChange={(e) => setAssignedLead(e.target.value)}
                className={`w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-medium text-xs cursor-pointer ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
              >
                <option value="">Select Lead...</option>
                {employees.map(emp => (
                  <option key={emp._id || emp.id} value={emp.name || emp.username}>
                    {emp.name || emp.username} ({emp.role || "Team"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Deadline Date
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-medium text-xs ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Project Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of this project / prototype..."
              className={`w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-medium text-sm resize-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition cursor-pointer ${isLight ? 'border-gray-200 text-gray-600 hover:bg-gray-100' : 'border-gray-700 text-gray-300 hover:bg-white/5'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#004AAD] hover:bg-[#003882] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-900/40 hover:-translate-y-0.5 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
