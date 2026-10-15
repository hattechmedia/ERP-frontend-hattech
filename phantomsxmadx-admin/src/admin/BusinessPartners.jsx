import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCamera,
  FiMoreVertical,
  FiLayers,
  FiX,
  FiUsers,
  FiFolder,
  FiEdit2,
  FiGlobe,
  FiMail,
  FiPhone,
  FiLock,
  FiUserCheck,
  FiUploadCloud,
  FiCheckCircle,
  FiPaperclip,
  FiDownload,
  FiFileText,
  FiEye,
  FiImage
} from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";

// Helper to extract clean names
const cleanName = (name) => {
  if (!name) return "";
  return String(name).replace(/\s*\(.*?\)\s*/g, '').trim();
};

// Helper to smart detect team leads (EXACT MATCH TO PROJECTS.JSX)
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

    if (!matchedLead) return;

    const leadKey = matchedLead.toLowerCase();
    if (leadsMap.has(leadKey)) return;

    const emp = (allEmployees || []).find(e => {
      const eName = cleanName(e.name || e.username || e.userId?.name || "").toLowerCase();
      return eName && (eName.includes(leadKey) || leadKey.includes(eName));
    });

    const photo = emp?.image || emp?.avatar || emp?.userId?.image || emp?.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedLead)}&background=004AAD&color=fff&bold=true`;

    leadsMap.set(leadKey, { name: matchedLead, image: photo });
  };

  // 1. Explicit assignedLead takes top priority
  if (project.assignedLead) {
    addLead(project.assignedLead);
  }

  // 2. Check manager / project head
  if (project.manager) {
    const mgrName = typeof project.manager === 'object' ? (project.manager.name || project.manager.username) : project.manager;
    if (mgrName) addLead(mgrName);
  }

  // 3. Check services array leads
  if (project.services && project.services.length > 0) {
    project.services.forEach(svc => {
      if (svc.assignedLead) addLead(svc.assignedLead);
    });
  }

  // 4. Inspect explicit team members
  if (Array.isArray(project.team) && project.team.length > 0) {
    project.team.forEach(tMember => {
      const tmName = typeof tMember === 'object' ? (tMember.name || tMember.username) : tMember;
      if (tmName) addLead(tmName);
    });
  }

  return Array.from(leadsMap.values());
};

export default function BusinessPartners() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const userRole = (user.role || "").toLowerCase();
  const isLight = document.body.classList.contains("light");

  const [partnerCompanies, setPartnerCompanies] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState("novarch");
  const [activeSubTab, setActiveSubTab] = useState("all");
  const [allProjects, setAllProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [nameMap, setNameMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showEditPartnerModal, setShowEditPartnerModal] = useState(false);
  const [showAddPartnerProjectModal, setShowAddPartnerProjectModal] = useState(false);
  const [partnerRequests, setPartnerRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestReviewModal, setShowRequestReviewModal] = useState(false);
  const [selectedProposalForAssign, setSelectedProposalForAssign] = useState(null);
  const [showAssignProposalModal, setShowAssignProposalModal] = useState(false);
  const [convertingRequest, setConvertingRequest] = useState(false);

  // Form State
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    logo: "",
    description: "",
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    partnershipModel: "Revenue Share (30%)",
    portalEmail: "",
    portalPassword: "",
    sendEmailNotification: true
  });
  const [savingPartner, setSavingPartner] = useState(false);

  // Default Novarch
  const defaultNovarch = {
    id: "novarch",
    name: "Novarch",
    logo: "/novarch-logo.png",
    description: "Collaborative Partner Initiative",
    contactPerson: "Novarch BD Directorate",
    email: "contact@novarch.com",
    phone: "+92 300 0000000",
    website: "https://novarch.com"
  };

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    let currentPartners = [];

    try {
      const saved = localStorage.getItem("hattech_partner_companies");
      if (saved) currentPartners = JSON.parse(saved);
    } catch (e) {}

    try {
      const res = await api.get('/hr/config/partner_companies');
      if (res.data.success && Array.isArray(res.data.data?.value)) {
        currentPartners = res.data.data.value;
      }
    } catch (e) {}

    const map = new Map();
    map.set("novarch", defaultNovarch);
    currentPartners.forEach(p => {
      if (p && p.name) {
        const key = p.name.toLowerCase().trim();
        map.set(key, { ...p, id: p.id || key, logo: p.logo || (key === "novarch" ? "/novarch-logo.png" : "") });
      }
    });

    const finalPartners = Array.from(map.values());
    setPartnerCompanies(finalPartners);
    localStorage.setItem("hattech_partner_companies", JSON.stringify(finalPartners));

    if (!finalPartners.some(p => String(p.id) === String(activePartnerId))) {
      setActivePartnerId(finalPartners[0]?.id || "novarch");
    }

    // Fetch Projects, Tasks, Employees, and Partner Requests
    try {
      const [projRes, taskRes, empRes, reqRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/employees'),
        api.get('/partner/requests/all').catch(() => ({ data: { data: [] } }))
      ]);

      const serverProjects = projRes.data?.data || [];
      const allTasks = taskRes.data?.tasks || taskRes.data?.data || [];
      const allEmps = empRes.data?.data || empRes.data?.employees || [];
      const allRequests = reqRes.data?.data || [];
      setPartnerRequests(allRequests);

      // Name map
      const nMap = {};
      allEmps.forEach(emp => {
        if (emp.userId?._id || emp.userId) {
          nMap[emp.userId?._id || emp.userId] = emp.name;
        }
      });
      setNameMap(nMap);
      setEmployees(allEmps.filter(emp => emp.status !== 'inactive'));
      setTasks(allTasks);

      // Map projects with their tasks and team members
      const processed = serverProjects.map(p => {
        const projectTasks = allTasks.filter(t => {
          const tProjId = t.project?._id || t.project || t.projectId;
          return tProjId && String(tProjId) === String(p._id || p.id);
        });

        const teamMembersFromTasks = new Set();
        projectTasks.forEach(t => {
          if (t.assignedTo) {
            if (Array.isArray(t.assignedTo)) {
              t.assignedTo.forEach(id => {
                const memberId = id._id || id;
                if (memberId && nMap[memberId]) teamMembersFromTasks.add(nMap[memberId]);
              });
            } else {
              const memberId = t.assignedTo._id || t.assignedTo;
              if (memberId && nMap[memberId]) teamMembersFromTasks.add(nMap[memberId]);
            }
          }
        });

        const combinedTeam = new Set([...(p.assignedPersons || []), ...teamMembersFromTasks]);
        const teamLeads = getSmartTeamLeads(p, allEmps);

        return {
          ...p,
          name: p.name || p.title || "Untitled Project",
          title: p.title || p.name || "Untitled Project",
          tasks: projectTasks,
          assignedPersons: combinedTeam,
          teamLeads
        };
      });

      setAllProjects(processed);
    } catch (err) {
      console.warn("Could not fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('partnerCompaniesUpdated', fetchData);
    return () => window.removeEventListener('partnerCompaniesUpdated', fetchData);
  }, []);

  // Save Partner Companies
  const savePartnerCompanies = async (newList) => {
    setPartnerCompanies(newList);
    try {
      localStorage.setItem("hattech_partner_companies", JSON.stringify(newList));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("partnerCompaniesUpdated"));
      await api.post('/hr/config', {
        key: 'partner_companies',
        value: newList,
        description: 'List of partner companies'
      });
    } catch (e) {
      console.error("Failed to persist partner companies to backend", e);
    }
  };

  // Add Partner Company
  const handleAddPartnerCompany = async (e) => {
    e.preventDefault();
    if (!partnerForm.name.trim()) {
      toast.error("Company Name is required");
      return;
    }

    setSavingPartner(true);
    try {
      const partnerId = partnerForm.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      const newPartner = {
        id: partnerId,
        name: partnerForm.name.trim(),
        logo: partnerForm.logo.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerForm.name)}&background=004AAD&color=fff&bold=true`,
        description: partnerForm.description.trim() || "Collaborative Partner Initiative",
        contactPerson: partnerForm.contactPerson.trim(),
        email: partnerForm.email.trim(),
        phone: partnerForm.phone.trim(),
        website: partnerForm.website.trim(),
        partnershipModel: partnerForm.partnershipModel || "Revenue Share (30%)"
      };

      // Create Partner Portal User Login Account and email credentials
      const targetEmail = partnerForm.portalEmail?.trim() || partnerForm.email?.trim();
      if (targetEmail && partnerForm.portalPassword) {
        try {
          await api.post('/auth/partner-account', {
            email: targetEmail,
            password: partnerForm.portalPassword,
            companyName: partnerForm.name.trim(),
            partnerName: partnerForm.contactPerson.trim(),
            sendEmailNotification: partnerForm.sendEmailNotification !== false
          });
          if (partnerForm.sendEmailNotification !== false) {
            toast.success(`Partner login credentials emailed to ${targetEmail}!`);
          } else {
            toast.success(`Partner portal login created for ${targetEmail}!`);
          }
        } catch (userErr) {
          console.warn("Could not create user account for partner:", userErr);
        }
      }

      const updated = [...partnerCompanies.filter(p => p.id !== partnerId), newPartner];
      await savePartnerCompanies(updated);
      setActivePartnerId(newPartner.id);
      setActiveSubTab("all");
      setShowAddPartnerModal(false);
      setPartnerForm({
        name: "",
        logo: "",
        description: "",
        contactPerson: "",
        email: "",
        phone: "",
        website: "",
        partnershipModel: "Revenue Share (30%)",
        portalEmail: "",
        portalPassword: "",
        sendEmailNotification: true
      });
      toast.success(`${newPartner.name} tab created successfully!`);
    } catch (err) {
      toast.error("Failed to add partner company");
    } finally {
      setSavingPartner(false);
    }
  };

  // Edit Partner Company
  const handleSaveEditPartner = async (e) => {
    e.preventDefault();
    setSavingPartner(true);
    try {
      const updated = partnerCompanies.map(c => {
        if (String(c.id) === String(activePartnerId)) {
          return {
            ...c,
            ...partnerForm,
            name: partnerForm.name.trim() || c.name,
            logo: partnerForm.logo.trim() || c.logo
          };
        }
        return c;
      });

      // Create/Update login credentials and email partner if password entered
      const targetEmail = partnerForm.portalEmail?.trim() || partnerForm.email?.trim() || currentPartner.email?.trim();
      if (targetEmail && partnerForm.portalPassword) {
        try {
          await api.post('/auth/partner-account', {
            email: targetEmail,
            password: partnerForm.portalPassword,
            companyName: partnerForm.name.trim() || currentPartner.name,
            partnerName: partnerForm.contactPerson.trim() || currentPartner.contactPerson,
            sendEmailNotification: partnerForm.sendEmailNotification !== false
          });
          if (partnerForm.sendEmailNotification !== false) {
            toast.success(`Credentials emailed to ${targetEmail}!`);
          } else {
            toast.success(`Portal account updated for ${targetEmail}!`);
          }
        } catch (uErr) {
          console.warn("Could not update partner account:", uErr);
        }
      }

      await savePartnerCompanies(updated);
      setShowEditPartnerModal(false);
      toast.success("Partner company updated successfully!");
    } catch (err) {
      toast.error("Failed to update company");
    } finally {
      setSavingPartner(false);
    }
  };

  // File Upload Helper for Form
  const handleLogoFileSelect = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo file size must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPartnerForm(prev => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Update Logo directly via file upload
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
        if (String(c.id) === String(partnerId)) {
          return { ...c, logo: dataUrl };
        }
        return c;
      });
      savePartnerCompanies(updated);
      toast.success("Partner company logo updated!");
    };
    reader.readAsDataURL(file);
  };

  // Delete Partner Company
  const handleDeletePartnerCompany = async (partnerId) => {
    if (partnerId === 'novarch') {
      toast.error("Novarch is a core partner and cannot be deleted.");
      return;
    }
    if (!window.confirm("Are you sure you want to remove this partner company?")) return;

    const updated = partnerCompanies.filter(c => String(c.id) !== String(partnerId));
    await savePartnerCompanies(updated);
    setActivePartnerId(updated[0]?.id || "novarch");
    setActiveSubTab("all");
    toast.success("Partner company removed");
  };

  // Add Partner Project
  const handleAddPartnerProject = async (projectData) => {
    const payload = {
      ...projectData,
      owner: 'Client',
      tags: ['Partner', projectData.partnerCompany, projectData.partnerCategory, projectData.stack].filter(Boolean)
    };

    try {
      const res = await api.post('/projects', payload);
      if (res.data.success) {
        const newProj = res.data.data || res.data.project;
        setAllProjects(prev => [newProj, ...prev]);
        setShowAddPartnerProjectModal(false);
        fetchData();
        toast.success("Project added successfully!");
      }
    } catch (err) {
      toast.error("Failed to add project: " + (err.response?.data?.message || err.message));
    }
  };

  // Status Update
  const handleStatusUpdate = async (projectId, newStatus) => {
    try {
      const res = await api.put(`/projects/${projectId}`, { status: newStatus });
      if (res.data.success) {
        setAllProjects(prev => prev.map(p => (p._id === projectId || p.id === projectId ? { ...p, status: newStatus } : p)));
        toast.success(`Project marked as ${newStatus}`);
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Delete Project
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await api.delete(`/projects/${projectId}`);
      if (res.data.success) {
        setAllProjects(prev => prev.filter(p => p._id !== projectId && p.id !== projectId));
        toast.success("Project deleted successfully");
      }
    } catch (err) {
      toast.error("Failed to delete project");
    }
  };

  // Acknowledge & Convert Proposal into Live Partner Project with Team Lead Assignment
  const handleAcknowledgeProposal = async (proposalId, assignPayload = {}) => {
    try {
      setConvertingRequest(true);
      const res = await api.post(`/partner/requests/${proposalId}/convert-to-project`, assignPayload);
      if (res.data.success) {
        toast.success(res.data.message || "Proposal acknowledged & project created!");
        setShowRequestReviewModal(false);
        setShowAssignProposalModal(false);
        setSelectedRequest(null);
        setSelectedProposalForAssign(null);
        await fetchData();
        setActiveSubTab("all");
      }
    } catch (err) {
      console.error("Failed to acknowledge proposal:", err);
      toast.error(err.response?.data?.message || "Failed to acknowledge proposal");
    } finally {
      setConvertingRequest(false);
    }
  };

  // Delete Proposal
  const handleDeleteProposal = async (proposalId) => {
    if (!window.confirm("Are you sure you want to delete this proposal?")) return;
    try {
      const res = await api.delete(`/partner/requests/${proposalId}`);
      if (res.data.success) {
        toast.success("Proposal deleted successfully");
        setPartnerRequests(prev => prev.filter(r => r._id !== proposalId));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete proposal");
    }
  };

  // Current Active Partner
  const currentPartner = partnerCompanies.find(c => String(c.id) === String(activePartnerId)) || partnerCompanies[0] || defaultNovarch;

  // Filter Projects strictly for current partner
  const partnerProjects = allProjects.filter(project => {
    if (!currentPartner) return false;
    const targetId = String(currentPartner.id).trim().toLowerCase();
    const targetName = String(currentPartner.name).trim().toLowerCase();

    const pId = String(project.partnerCompanyId || '').trim().toLowerCase();
    const pCompany = String(project.partnerCompany || '').trim().toLowerCase();
    const pOwner = String(project.owner || '').trim().toLowerCase();
    const pTags = Array.isArray(project.tags) ? project.tags.map(t => String(t).trim().toLowerCase()) : [];

    const isMatch = (targetId && pId === targetId) ||
                    (pCompany && pCompany === targetName) ||
                    (pOwner && pOwner === targetName) ||
                    pTags.includes(targetName) ||
                    pTags.includes(`partner:${targetName}`);

    if (!isMatch) return false;

    const cat = (project.partnerCategory || '').toLowerCase();
    const pStatus = (project.status || 'active').toLowerCase();
    const pType = (project.type || '').toLowerCase();

    if (activeSubTab === 'all') return true;
    if (activeSubTab === 'prototype') return cat.includes('prototype') || pType.includes('prototype');
    if (activeSubTab === 'collaborated') return cat.includes('collab') || pType.includes('collab');
    if (activeSubTab === 'ongoing') return cat.includes('ongoing') || pStatus === 'active' || pStatus === 'planning' || pStatus === 'on-domain' || pStatus === 'on-localhost';
    if (activeSubTab === 'delivered') return cat.includes('delivered') || pStatus === 'delivered' || pStatus === 'completed';
    return true;
  });

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm mb-6">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Business Development Partners</h1>
          <p className="text-xs text-theme-secondary mt-0.5">
            Partner company tabs, collaborative initiatives, and prototype projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPartnerForm({
                name: "",
                logo: "",
                description: "",
                contactPerson: "",
                email: "",
                phone: "",
                website: "",
                partnershipModel: "Revenue Share (30%)",
                createLoginAccount: true,
                portalUsername: "",
                portalPassword: ""
              });
              setShowAddPartnerModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#004AAE] to-[#1E6BFF] !text-white rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95 group border border-white/10 cursor-pointer"
            title="Add Partner Company"
          >
            <FiBriefcase size={18} className="!text-white" />
            <span className="text-sm font-bold !text-white">Add Partner Company</span>
          </button>
        </div>
      </div>

      {/* ================= PRIMARY COMPANY TABS ================= */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {partnerCompanies.map((company) => {
          const isActive = String(activePartnerId) === String(company.id);
          const compLogo = company.logo || (company.name?.toLowerCase() === 'novarch' ? '/novarch-logo.png' : '');

          return (
            <button
              key={company.id}
              onClick={() => {
                setActivePartnerId(company.id);
                setActiveSubTab("all");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition font-bold cursor-pointer ${
                isActive
                  ? "bg-[#004AAE] text-white shadow-lg shadow-blue-900/30"
                  : "bg-[#004AAE]/10 text-[#004AAE] hover:bg-[#004AAE]/20"
              }`}
            >
              {compLogo ? (
                <img
                  src={compLogo}
                  alt={company.name}
                  className="w-5 h-5 rounded-full object-cover border border-white/20 bg-white"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#004AAD]/30 text-white flex items-center justify-center text-[10px] font-bold">
                  {company.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span>{company.name}</span>
            </button>
          );
        })}

        <button
          onClick={() => {
            setPartnerForm({
              name: "",
              logo: "",
              description: "",
              contactPerson: "",
              email: "",
              phone: "",
              website: "",
              partnershipModel: "Revenue Share (30%)",
              createLoginAccount: true,
              portalUsername: "",
              portalPassword: ""
            });
            setShowAddPartnerModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-theme-secondary hover:text-theme-primary bg-[var(--bg-inner)] hover:bg-[#004AAD]/10 transition cursor-pointer border border-dashed border-white/20"
        >
          <FiPlus size={16} />
          <span>+ Add Company</span>
        </button>
      </div>

      {/* ================= COMPANY BANNER & SUB-TABS (EXACT MATCH TO PROJECTS.JSX) ================= */}
      {currentPartner && (
        <div className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border mb-6 animate-in fade-in duration-300 ${
          isLight ? 'bg-white border-gray-200' : 'bg-[var(--bg-card)] border-[var(--border-color)]'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="relative group cursor-pointer" title="Click to change logo">
              {currentPartner.logo || (currentPartner.name?.toLowerCase() === 'novarch' ? '/novarch-logo.png' : '') ? (
                <img 
                  src={currentPartner.logo || '/novarch-logo.png'} 
                  alt={currentPartner.name} 
                  className="w-12 h-12 rounded-xl object-cover border border-[#004AAD]/40 shadow-md group-hover:opacity-75 transition bg-white" 
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#004AAD]/10 border border-[#004AAD]/30 flex items-center justify-center text-[#004AAD] font-black text-lg group-hover:bg-[#004AAD]/20 transition">
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
                
                {/* Edit Company Details Link */}
                <button
                  onClick={() => {
                    setPartnerForm({
                      name: currentPartner.name || "",
                      logo: currentPartner.logo || "",
                      description: currentPartner.description || "",
                      contactPerson: currentPartner.contactPerson || "",
                      email: currentPartner.email || "",
                      phone: currentPartner.phone || "",
                      website: currentPartner.website || "",
                      partnershipModel: currentPartner.partnershipModel || "Revenue Share (30%)",
                      portalEmail: currentPartner.email || "",
                      portalPassword: "",
                      sendEmailNotification: true
                    });
                    setShowEditPartnerModal(true);
                  }}
                  className="text-[11px] text-[#004AAD] hover:underline cursor-pointer flex items-center gap-1 font-semibold ml-2"
                >
                  <FiEdit2 size={12} />
                  <span>Edit Company</span>
                </button>

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
              <p className="text-xs text-theme-secondary">{currentPartner.description || "Collaborative Partner Initiative"}</p>
            </div>
          </div>

          {/* Sub-tabs & Add Project Button */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'prototype', label: 'Prototype' },
              { id: 'collaborated', label: 'Collaborated Project' },
              { id: 'ongoing', label: 'On Going' },
              { id: 'delivered', label: 'Delivered' },
              { 
                id: 'proposals', 
                label: `Proposals (${partnerRequests.filter(r => (r.partnerCompany?.toLowerCase() === (currentPartner?.name || '').toLowerCase() || r.partnerCompanyId === currentPartner?.id || (currentPartner?.id === 'novarch' && (!r.partnerCompanyId || r.partnerCompany?.toLowerCase().includes('novarch')))) && r.status === 'Pending').length})` 
              }
            ].map(sub => {
              const isSubActive = activeSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTab(sub.id)}
                  className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isSubActive
                      ? 'bg-[#004AAE] text-white shadow-lg shadow-blue-900/40'
                      : sub.id === 'proposals' && partnerRequests.some(r => r.status === 'Pending')
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      : 'text-theme-secondary hover:text-theme-primary bg-[var(--bg-inner)] hover:bg-[#004AAD]/10'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}

            <button
              onClick={() => setShowAddPartnerProjectModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-br from-[#004AAE] to-[#1E6BFF] !text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer ml-1"
            >
              <FiPlus size={16} />
              <span>Add Project</span>
            </button>

            {currentPartner.id !== 'novarch' && (
              <button
                onClick={() => handleDeletePartnerCompany(currentPartner.id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                title="Delete Partner Company"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= PROPOSALS & REQUESTS VIEW ================= */}
      {activeSubTab === 'proposals' ? (
        <div className="space-y-4">
          {(() => {
            const companyProposals = partnerRequests.filter(r => 
              (r.partnerCompany?.toLowerCase() === (currentPartner?.name || '').toLowerCase() || 
               r.partnerCompanyId === currentPartner?.id ||
               (currentPartner?.id === 'novarch' && (!r.partnerCompanyId || r.partnerCompany?.toLowerCase().includes('novarch'))))
            );

            if (companyProposals.length === 0) {
              return (
                <div className="col-span-full text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-2">
                  <FiPaperclip className="mx-auto text-gray-400 opacity-40 mb-2" size={36} />
                  <div className="text-gray-300 text-base font-bold">
                    No proposal requests from {currentPartner?.name}
                  </div>
                  <p className="text-gray-500 text-xs max-w-sm mx-auto">
                    When this partner submits prototype tasks or collaborated project proposals from their portal, they will appear here with downloadable document attachments.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid md:grid-cols-2 gap-5">
                {companyProposals.map((req) => (
                  <div
                    key={req._id}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#004AAD]/50 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#004AAD]/10 text-[#004AAD] border border-[#004AAD]/20">
                              {req.type}
                            </span>
                            {req.serviceCategory && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {req.serviceCategory}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              req.priority === 'Urgent' ? 'bg-red-500/20 text-red-400' :
                              req.priority === 'High' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-blue-500/10 text-blue-400'
                            }`}>
                              {req.priority} Priority
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-theme-primary mt-1.5 line-clamp-1">{req.title}</h3>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            req.status === "Approved" || req.status === "Acknowledged"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : req.status === "Rejected"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <p className="text-xs text-theme-secondary line-clamp-3 leading-relaxed whitespace-pre-line">
                        {req.description}
                      </p>

                      {req.requirements && (
                        <div className="p-3 bg-[var(--bg-inner)] rounded-2xl border border-white/5 text-[11px] text-theme-secondary space-y-1">
                          <span className="font-bold text-theme-primary block uppercase tracking-wider text-[10px]">Specifications:</span>
                          <p className="line-clamp-2">{req.requirements}</p>
                        </div>
                      )}

                      {/* ATTACHMENTS PREVIEW & DOWNLOAD */}
                      {req.attachments && req.attachments.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-theme-secondary flex items-center gap-1">
                            <FiPaperclip size={11} /> {req.attachments.length} Attached Document(s):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {req.attachments.map((file, fIdx) => (
                              <div
                                key={fIdx}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--bg-inner)] hover:bg-[#004AAD]/10 rounded-xl border border-white/10 text-[11px] text-blue-400 transition group"
                              >
                                {file.type === 'image' ? <FiImage size={12} /> : <FiFileText size={12} />}
                                <span className="truncate max-w-[120px] text-theme-primary font-medium">{file.name}</span>
                                
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-gray-400 hover:text-white transition"
                                  title="View Document in New Tab"
                                >
                                  <FiEye size={12} />
                                </a>

                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="p-1 text-[#004AAD] hover:text-blue-300 transition"
                                  title="Download Document"
                                >
                                  <FiDownload size={12} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-[11px] text-theme-secondary">
                        Submitted: {new Date(req.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2">
                        {req.status === "Pending" ? (
                          <>
                            <button
                              onClick={() => handleDeleteProposal(req._id)}
                              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                              title="Delete Proposal"
                            >
                              <FiTrash2 size={13} />
                              <span>Delete</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProposalForAssign(req);
                                setShowAssignProposalModal(true);
                              }}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-900/30 transition cursor-pointer"
                            >
                              <FiCheckCircle size={14} />
                              <span>✓ Acknowledge & Assign Lead</span>
                            </button>
                          </>
                        ) : req.convertedProjectId ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/20">
                              <FiCheckCircle size={14} /> Active In Live Projects
                            </span>
                            <button
                              onClick={() => handleDeleteProposal(req._id)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 transition cursor-pointer"
                              title="Delete Proposal Record"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ) : (
        /* ================= PROJECTS GRID (IDENTICAL TO PROJECTCARD IN PROJECTS.JSX) ================= */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partnerProjects.length > 0 ? (
            partnerProjects.map((project, i) => (
              <ProjectCard
                key={project._id || project.id || i}
                project={project}
                userRole={userRole}
                isLight={isLight}
                onStatusChange={handleStatusUpdate}
                onDelete={handleDeleteProject}
                employees={employees}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
              <FiFolder className="mx-auto text-gray-400 mb-2" size={36} />
              <div className="text-gray-400 text-base font-bold mb-1">
                No projects found for {currentPartner?.name} ({activeSubTab.toUpperCase()})
              </div>
              <div className="text-gray-500 text-xs max-w-sm mx-auto mb-4">
                Click &quot;Add Project&quot; above to create a new prototype, ongoing, or collaborated project under this partner!
              </div>
              <button
                onClick={() => setShowAddPartnerProjectModal(true)}
                className="px-4 py-2 bg-[#004AAD] hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition cursor-pointer"
              >
                + Add First Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= ADD PARTNER COMPANY MODAL ================= */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl border my-8 ${
            isLight ? 'bg-white border-gray-200' : 'bg-[#15102a] border-gray-700'
          }`}>
            <button
              onClick={() => setShowAddPartnerModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <FiX size={20} />
            </button>

            <h3 className="text-lg font-bold text-theme-primary mb-1 flex items-center gap-2">
              <FiBriefcase className="text-[#004AAD]" /> Add Partner Company
            </h3>
            <p className="text-xs text-theme-secondary mb-4">
              Create a dedicated company tab & portal account for a business development partner.
            </p>

            <form onSubmit={handleAddPartnerCompany} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Novarch, Apex Digital, etc."
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                  }`}
                />
              </div>

              {/* LOGO FILE CHOOSER WITH PREVIEW */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1.5 block">
                  Company Logo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#004AAD]/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {partnerForm.logo ? (
                      <img src={partnerForm.logo} alt="Preview" className="w-full h-full object-contain p-1 bg-white" />
                    ) : (
                      <FiUploadCloud size={24} className="text-[#004AAD]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-xs font-bold text-theme-primary cursor-pointer transition">
                      <FiCamera /> Choose Logo Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLogoFileSelect(e.target.files?.[0])}
                      />
                    </label>
                    <span className="text-[10px] text-gray-400 block mt-1">PNG, JPG, SVG up to 5MB</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Director / BD Lead"
                    value={partnerForm.contactPerson}
                    onChange={(e) => setPartnerForm({ ...partnerForm, contactPerson: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="bd@company.com"
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* PARTNER PORTAL LOGIN CREDENTIALS SECTION */}
              <div className="p-4 rounded-2xl bg-[#004AAD]/10 border border-[#004AAD]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiLock className="text-[#004AAD]" size={16} />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Partner Panel Login Access
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Role: Partner
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Set login email and password for this partner to access their private dashboard at <code>/partner</code>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Login Email *
                    </label>
                    <input
                      type="email"
                      placeholder="partner@company.com"
                      value={partnerForm.portalEmail || partnerForm.email}
                      onChange={(e) => setPartnerForm({ ...partnerForm, portalEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-[#004AAD]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Login Password *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Novarch@2026"
                      value={partnerForm.portalPassword}
                      onChange={(e) => setPartnerForm({ ...partnerForm, portalPassword: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-[#004AAD]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 pt-1 text-xs text-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={partnerForm.sendEmailNotification}
                    onChange={(e) => setPartnerForm({ ...partnerForm, sendEmailNotification: e.target.checked })}
                    className="w-4 h-4 rounded text-[#004AAD] accent-[#004AAD] cursor-pointer"
                  />
                  <span className="font-semibold text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <FiMail size={13} /> Send login credentials & portal link directly to partner&apos;s email
                  </span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                  Description / Initiative Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Overview of this business partnership..."
                  value={partnerForm.description}
                  onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium resize-none ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartnerModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-xs font-bold uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPartner}
                  className="flex-1 py-2.5 rounded-xl bg-[#004AAD] hover:bg-blue-700 text-white text-xs font-bold uppercase shadow-lg transition cursor-pointer"
                >
                  {savingPartner ? "Saving..." : "Create Tab & Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT PARTNER COMPANY MODAL ================= */}
      {showEditPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl border my-8 ${
            isLight ? 'bg-white border-gray-200' : 'bg-[#15102a] border-gray-700'
          }`}>
            <button
              onClick={() => setShowEditPartnerModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <FiX size={20} />
            </button>

            <h3 className="text-lg font-bold text-theme-primary mb-1 flex items-center gap-2">
              <FiEdit2 className="text-[#004AAD]" /> Edit Partner Company
            </h3>
            <p className="text-xs text-theme-secondary mb-4">
              Update branding, logo file, contact, and portal login for {currentPartner?.name}.
            </p>

            <form onSubmit={handleSaveEditPartner} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                  }`}
                />
              </div>

              {/* LOGO FILE CHOOSER WITH PREVIEW */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1.5 block">
                  Company Logo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#004AAD]/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {partnerForm.logo ? (
                      <img src={partnerForm.logo} alt="Preview" className="w-full h-full object-contain p-1 bg-white" />
                    ) : (
                      <FiUploadCloud size={24} className="text-[#004AAD]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-xs font-bold text-theme-primary cursor-pointer transition">
                      <FiCamera /> Choose New Logo Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLogoFileSelect(e.target.files?.[0])}
                      />
                    </label>
                    <span className="text-[10px] text-gray-400 block mt-1">PNG, JPG, SVG up to 5MB</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Director / BD Lead"
                    value={partnerForm.contactPerson}
                    onChange={(e) => setPartnerForm({ ...partnerForm, contactPerson: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="partner@company.com"
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium ${
                      isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* UPDATE PORTAL LOGIN CREDENTIALS */}
              <div className="p-4 rounded-2xl bg-[#004AAD]/10 border border-[#004AAD]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiLock className="text-[#004AAD]" size={16} />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Partner Panel Login Access
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Role: Partner
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Update login email and password for this partner to access their private dashboard at <code>/partner</code>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Login Email *
                    </label>
                    <input
                      type="email"
                      placeholder="partner@company.com"
                      value={partnerForm.portalEmail || partnerForm.email}
                      onChange={(e) => setPartnerForm({ ...partnerForm, portalEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-[#004AAD]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Set New Password
                    </label>
                    <input
                      type="text"
                      placeholder="Enter new password"
                      value={partnerForm.portalPassword}
                      onChange={(e) => setPartnerForm({ ...partnerForm, portalPassword: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none focus:border-[#004AAD]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 pt-1 text-xs text-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={partnerForm.sendEmailNotification}
                    onChange={(e) => setPartnerForm({ ...partnerForm, sendEmailNotification: e.target.checked })}
                    className="w-4 h-4 rounded text-[#004AAD] accent-[#004AAD] cursor-pointer"
                  />
                  <span className="font-semibold text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <FiMail size={13} /> Email updated credentials & portal link directly to partner
                  </span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                  Description / Partnership Scope
                </label>
                <textarea
                  rows={2}
                  value={partnerForm.description}
                  onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium resize-none ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditPartnerModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-xs font-bold uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPartner}
                  className="flex-1 py-2.5 rounded-xl bg-[#004AAD] hover:bg-blue-700 text-white text-xs font-bold uppercase shadow-lg transition cursor-pointer"
                >
                  {savingPartner ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD PARTNER PROJECT MODAL ================= */}
      {showAddPartnerProjectModal && currentPartner && (
        <AddPartnerProjectModal
          partner={currentPartner}
          isLight={isLight}
          onClose={() => setShowAddPartnerProjectModal(false)}
          onAdd={handleAddPartnerProject}
        />
      )}

      {/* ================= ACKNOWLEDGE & ASSIGN PROPOSAL MODAL ================= */}
      {showAssignProposalModal && selectedProposalForAssign && (
        <AcknowledgeAssignModal
          proposal={selectedProposalForAssign}
          employees={employees}
          isLight={isLight}
          loading={convertingRequest}
          onClose={() => {
            setShowAssignProposalModal(false);
            setSelectedProposalForAssign(null);
          }}
          onAssign={(payload) => handleAcknowledgeProposal(selectedProposalForAssign._id, payload)}
        />
      )}
    </div>
  );
}

/* ================= ACKNOWLEDGE & ASSIGN PROPOSAL MODAL ================= */
function AcknowledgeAssignModal({ proposal, employees = [], isLight, loading, onClose, onAssign }) {
  const [assignedLeadId, setAssignedLeadId] = useState("");
  const [platform, setPlatform] = useState("Web");
  const [deadline, setDeadline] = useState(
    proposal.targetDeadline ? new Date(proposal.targetDeadline).toISOString().split('T')[0] : ""
  );
  const [adminComment, setAdminComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedEmp = employees.find(emp => String(emp._id || emp.id || emp.userId?._id || emp.userId) === String(assignedLeadId));
    const leadName = selectedEmp ? cleanName(selectedEmp.name || selectedEmp.username) : "";

    onAssign({
      assignedLead: leadName,
      assignedLeadId: selectedEmp ? (selectedEmp.userId?._id || selectedEmp.userId || selectedEmp._id || selectedEmp.id) : null,
      platform,
      deadline,
      adminComment
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className={`relative w-full max-w-xl rounded-3xl p-6 md:p-8 shadow-2xl border my-8 ${
        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#15102a] border-gray-700 text-white'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition cursor-pointer"
        >
          <FiX size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <FiCheckCircle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black">Acknowledge & Assign Proposal</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Convert {proposal.partnerCompany}&apos;s proposal into a live project and assign to a team lead
            </p>
          </div>
        </div>

        {/* PROPOSAL BRIEF SUMMARY BOX */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 mb-5">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#004AAD]/20 text-[#004AAD] border border-[#004AAD]/30">
              {proposal.type}
            </span>
            <span className="text-xs font-bold text-gray-400">
              Partner: <strong className="text-white">{proposal.partnerCompany}</strong>
            </span>
          </div>
          <h4 className="text-sm font-black text-white">{proposal.title}</h4>
          <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
            {proposal.description}
          </p>

          {/* ATTACHED DOCUMENTS CHIPS */}
          {proposal.attachments && proposal.attachments.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1">
                <FiPaperclip size={11} /> {proposal.attachments.length} Attached Document(s) will be linked to project:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {proposal.attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 text-[11px] text-blue-400 font-medium"
                  >
                    <FiFileText size={12} />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ASSIGNMENT FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5 block">
              Assign Team Lead / Project Head <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={assignedLeadId}
              onChange={(e) => setAssignedLeadId(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-900 border border-white/20 text-white text-xs font-bold outline-none focus:border-[#004AAD] transition"
            >
              <option value="">-- Choose Team Lead / Assignee --</option>
              {employees.map((emp) => {
                const empId = emp._id || emp.id || emp.userId?._id || emp.userId;
                return (
                  <option key={empId} value={empId}>
                    {emp.name || emp.username} {emp.department ? `(${emp.department})` : ''} {emp.role === 'teamlead' || emp.role === 'projecthead' ? '👑 Lead' : ''}
                  </option>
                );
              })}
            </select>
            <span className="text-[10px] text-gray-400 mt-1 block">
              The assigned lead will receive an instant notification along with direct access to all attached documents and specs.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5 block">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-gray-900 border border-white/20 text-white text-xs outline-none focus:border-[#004AAD]"
              >
                <option value="Web">Web Application</option>
                <option value="Mobile">Mobile App</option>
                <option value="Desktop">Desktop</option>
                <option value="Other">Prototype / Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5 block">
                Target Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/20 text-white text-xs outline-none focus:border-[#004AAD] cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5 block">
              Admin Notes / Instructions for Lead (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Please review the attached prototype brief with the team and prepare initial milestone breakdown."
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/20 text-white text-xs outline-none focus:border-[#004AAD] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 text-xs font-bold uppercase transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !assignedLeadId}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FiCheckCircle size={15} />
              <span>{loading ? "Assigning & Creating..." : "✓ Acknowledge & Assign"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= EXACT PROJECT CARD COMPONENT (MATCHING PROJECTS.JSX) ================= */
function ProjectCard({ project, userRole, isLight, onStatusChange, onDelete, employees = [] }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

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

  const leads = (project.teamLeads && project.teamLeads.length > 0) 
    ? project.teamLeads 
    : getSmartTeamLeads(project, employees);

  return (
    <div
      onClick={() => navigate(`/admin/project/${project._id || project.id}`)}
      className={`project-card${isLight ? ' light' : ''} cursor-pointer shadow-lg transition-all duration-300 overflow-hidden min-h-[400px] hover:scale-[1.02] hover:shadow-[#004AAD]/20`}
      style={{
        backgroundColor: 'var(--bg-card)',
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
              {project.partnerCategory && (
                <span className="text-xs text-[#004AAD] font-bold">
                  • {project.partnerCategory}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-gray-500/10 text-gray-500 border-gray-500/20">
                {project.partnerCompany || project.owner || "Client"}
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
            </div>
          </div>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 hover:bg-theme-tertiary rounded-full transition cursor-pointer"
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
                      className="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary transition text-theme-primary cursor-pointer"
                      onClick={(e) => handleAction(e, 'active')}
                    >
                      Mark as Active
                    </button>
                  )}
                  {project.status !== 'completed' && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary transition text-theme-primary cursor-pointer"
                      onClick={(e) => handleAction(e, 'completed')}
                    >
                      Mark as Completed
                    </button>
                  )}
                  {project.status !== 'delivered' && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary transition text-theme-primary cursor-pointer"
                      onClick={(e) => handleAction(e, 'delivered')}
                    >
                      Mark as Delivered
                    </button>
                  )}
                  {project.status !== 'on-domain' && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary transition text-theme-primary cursor-pointer"
                      onClick={(e) => handleAction(e, 'on-domain')}
                    >
                      Mark as On Domain
                    </button>
                  )}
                  {project.status !== 'on-localhost' && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary transition text-theme-primary cursor-pointer"
                      onClick={(e) => handleAction(e, 'on-localhost')}
                    >
                      Mark as On Localhost
                    </button>
                  )}
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-500/10 text-red-500 transition border-t border-theme mt-1 cursor-pointer"
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

        {/* Description */}
        {project.description && (
          <p className="text-xs text-theme-secondary line-clamp-2 mt-1 mb-3">
            {project.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-theme-muted">Progress</span>
            <span className="text-sm font-medium text-[#004AAD]">{project.progress || 0}%</span>
          </div>
          <div className="h-2 w-full bg-theme-secondary rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full bg-[#004AAD] transition-all duration-500"
              style={{ width: `${project.progress || 0}%` }}
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

        {/* Assigned Team Outer Box */}
        <div className="mt-4 pt-4 border-t border-theme">
          <div className="mb-2">
            <h4 className="text-sm font-medium text-theme-secondary mb-2">Assigned Team</h4>
            {leads.length === 0 ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="text-xs text-amber-500/80 italic flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>No Team Lead Assigned</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/project/${project._id || project.id}`);
                  }}
                  className="px-2.5 py-1 bg-[#004AAD]/10 hover:bg-[#004AAD] text-[#004AAD] hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                >
                  + Assign Lead
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {leads.map((lead, lIdx) => (
                  <div key={lIdx} className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
                    <img
                      src={lead.image}
                      alt={lead.name}
                      className="w-7 h-7 rounded-full object-cover border-2 border-amber-400 shadow-sm"
                    />
                    <div>
                      <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">👑 Lead {leads.length > 1 ? `#${lIdx + 1}` : ''}</div>
                      <div className="text-xs font-bold text-theme-primary">{lead.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= ADD PARTNER PROJECT MODAL ================= */
function AddPartnerProjectModal({ partner, isLight, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [partnerCategory, setPartnerCategory] = useState("Prototype");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [platform, setPlatform] = useState("Web");
  const [type, setType] = useState("Custom Development");
  const [stack, setStack] = useState("MERN Stack");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project Name is required");
      return;
    }
    setSaving(true);
    await onAdd({
      name: name.trim(),
      clientName: clientName.trim() || `${partner.name} Client`,
      partnerCompany: partner.name,
      partnerCompanyId: partner.id,
      partnerCompanyLogo: partner.logo,
      partnerCategory,
      stack,
      deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      budget: Number(budget) || 0,
      platform,
      type,
      description: description.trim(),
      status: partnerCategory === 'Delivered' ? 'delivered' : 'active',
      progress: partnerCategory === 'Delivered' ? 100 : 10
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl border ${
        isLight ? 'bg-white border-gray-200' : 'bg-[#15102a] border-gray-700'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer"
        >
          <FiX size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          {partner.logo && (
            <img src={partner.logo} alt={partner.name} className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-white/20" />
          )}
          <div>
            <h3 className="text-lg font-bold text-theme-primary">
              Add Project for {partner.name}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#004AAD] bg-[#004AAD]/10 px-2 py-0.5 rounded-full">
              Partner Initiative
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Real Estate Portal, AI Lead Engine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium ${
                isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                Category / Stage
              </label>
              <select
                value={partnerCategory}
                onChange={(e) => setPartnerCategory(e.target.value)}
                className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium ${
                  isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                }`}
              >
                <option value="Prototype">Prototype</option>
                <option value="Collaborated Project">Collaborated Project</option>
                <option value="On Going">On Going</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                Tech Stack
              </label>
              <input
                type="text"
                placeholder="e.g. MERN Stack, Next.js, Python AI"
                value={stack}
                onChange={(e) => setStack(e.target.value)}
                className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium ${
                  isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                Client / Brand Name
              </label>
              <input
                type="text"
                placeholder={`e.g. ${partner.name} Client`}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium ${
                  isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
                Deadline Date
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium ${
                  isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1 block">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Overview of this project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none text-xs font-medium resize-none ${
                isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
              }`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-xs font-bold uppercase transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#004AAD] hover:bg-blue-700 text-white text-xs font-bold uppercase shadow-lg transition cursor-pointer"
            >
              {saving ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
