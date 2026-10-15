import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiFolder,
  FiLayers,
  FiGlobe,
  FiLock,
  FiEye,
  FiEyeOff,
  FiExternalLink,
  FiCheckCircle,
  FiPlus
} from "react-icons/fi";
import api from "../services/api";
import PartnerRequestModal from "./PartnerRequestModal";

export default function PartnerProjects() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const isLight = document.body.classList.contains("light");

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [partnerLogo, setPartnerLogo] = useState("/novarch-logo.png");
  const [partnerName, setPartnerName] = useState(user.name || "Novarch");
  const [partnerId, setPartnerId] = useState(user.partnerCompanyId || "novarch");
  const [activeSubTab, setActiveSubTab] = useState("all");
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hattech_partner_companies");
      if (saved) {
        const list = JSON.parse(saved);
        const match = list.find(c => 
          c.name?.toLowerCase() === (user.name || '').toLowerCase() || 
          c.id === user.partnerCompanyId ||
          c.name?.toLowerCase() === 'novarch'
        );
        if (match) {
          if (match.logo) setPartnerLogo(match.logo);
          if (match.name) setPartnerName(match.name);
          if (match.id) setPartnerId(match.id);
        }
      }
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projRes, taskRes] = await Promise.all([
          api.get('/projects').catch(() => ({ data: { data: [] } })),
          api.get('/tasks').catch(() => ({ data: { data: [] } }))
        ]);

        let localProjects = [];
        try {
          localProjects = JSON.parse(localStorage.getItem("hattech_local_projects") || "[]");
        } catch (e) {}

        const serverProjects = projRes.data?.data || [];
        const serverIds = new Set(serverProjects.map(p => String(p._id || p.id)));
        const missingLocal = localProjects.filter(lp => !serverIds.has(String(lp._id || lp.id)));
        const combinedRawProjects = [...serverProjects, ...missingLocal];

        const allTasks = taskRes.data?.tasks || taskRes.data?.data || [];

        const processed = combinedRawProjects.map(p => {
          const projectTasks = allTasks.filter(t => {
            const tProjId = t.project?._id || t.project || t.projectId;
            return tProjId && String(tProjId) === String(p._id || p.id);
          });

          return {
            ...p,
            name: p.name || p.title || "Untitled Project",
            title: p.title || p.name || "Untitled Project",
            tasks: projectTasks
          };
        });

        setAllProjects(processed);
      } catch (err) {
        console.error("Failed to load partner projects", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter projects strictly added under this partner in Business Development Partners
  const partnerProjects = allProjects.filter(project => {
    const targetId = String(partnerId || 'novarch').trim().toLowerCase();
    const targetName = String(partnerName || user.name || 'Novarch').trim().toLowerCase();

    const pId = String(project.partnerCompanyId || '').trim().toLowerCase();
    const pCompany = String(project.partnerCompany || '').trim().toLowerCase();
    const pOwner = String(project.owner || '').trim().toLowerCase();
    const pTags = Array.isArray(project.tags) ? project.tags.map(t => String(t).trim().toLowerCase()) : [];

    // Filter out dummy duplicate partner company container if titled same as partner name and no client
    if (String(project.title || project.name || '').trim().toLowerCase() === targetName && !project.partnerCategory && !project.clientName) {
      return false;
    }

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
    <div className="space-y-6 pt-14 md:pt-0 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm mb-6">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Partner Projects & Pipeline</h1>
          <p className="text-xs text-theme-secondary mt-0.5">
            Collaborative initiatives, prototype deliverables, and active sprints for {partnerName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#004AAD] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/30 transition cursor-pointer"
          >
            <FiPlus size={15} />
            <span>Request Prototype / Project</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#004AAD]/10 border border-[#004AAD]/20 text-[#004AAD] text-xs font-bold">
            <FiBriefcase size={15} />
            <span>{partnerName} Portal</span>
          </div>
        </div>
      </div>

      {/* ================= COMPANY BANNER & SUB-TABS ================= */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border mb-6 animate-in fade-in duration-300 ${
        isLight ? 'bg-white border-gray-200' : 'bg-[var(--bg-card)] border-[var(--border-color)]'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img 
              src={partnerLogo || '/novarch-logo.png'} 
              alt={partnerName} 
              className="w-12 h-12 rounded-xl object-contain border border-[#004AAD]/40 shadow-md bg-white p-1" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-theme-primary">{partnerName}</h3>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#004AAD]/10 text-[#004AAD] border border-[#004AAD]/20">
                BD Partner
              </span>
            </div>
            <p className="text-xs text-theme-secondary">Live collaborative development pipeline & deliverables</p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'prototype', label: 'Prototype' },
            { id: 'collaborated', label: 'Collaborated Project' },
            { id: 'ongoing', label: 'On Going' },
            { id: 'delivered', label: 'Delivered' }
          ].map(sub => {
            const isSubActive = activeSubTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubTab(sub.id)}
                className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isSubActive
                    ? 'bg-[#004AAE] text-white shadow-lg shadow-blue-900/40'
                    : 'text-theme-secondary hover:text-theme-primary bg-[var(--bg-inner)] hover:bg-[#004AAD]/10'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= PROJECTS GRID (NO ASSIGNED TEAM, SHOWS CREDENTIALS & PROGRESS) ================= */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partnerProjects.length > 0 ? (
          partnerProjects.map((project, i) => (
            <PartnerProjectCard
              key={project._id || project.id || i}
              project={project}
              isLight={isLight}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
            <FiFolder className="mx-auto text-gray-400 mb-2" size={36} />
            <div className="text-gray-400 text-base font-bold mb-1">
              No projects found in this stage ({activeSubTab.toUpperCase()})
            </div>
            <p className="text-gray-500 text-xs max-w-sm mx-auto">
              There are currently no active projects matching this category for your partner portal.
            </p>
          </div>
        )}
      </div>

      <PartnerRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </div>
  );
}

/* ================= EXACT PARTNER PROJECT CARD COMPONENT ================= */
function PartnerProjectCard({ project, isLight }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

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

  const liveUrl = project.liveUrl || project.domain || project.website || project.demoUrl || project.prototypeUrl;
  const firstCred = project.credentials && project.credentials.length > 0 ? project.credentials[0] : null;

  return (
    <div
      onClick={() => navigate(`/partner/project/${project._id || project.id}`)}
      className={`project-card${isLight ? ' light' : ''} cursor-pointer shadow-lg transition-all duration-300 overflow-hidden min-h-[350px] hover:scale-[1.02] hover:shadow-[#004AAD]/20 flex flex-col justify-between`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 16
      }}
    >
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Project Header */}
        <div>
          <div className="flex justify-between items-start mb-2 relative">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
                <h3 className="font-semibold text-lg text-theme-primary truncate">
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
                  {project.partnerCompany || project.owner || "Partner"}
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
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-xs text-theme-secondary line-clamp-2 mt-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-theme-muted font-bold uppercase tracking-wider">Development Progress</span>
            <span className="text-sm font-bold text-[#004AAD]">{project.progress || 0}%</span>
          </div>
          <div className="h-2.5 w-full bg-theme-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#004AAD] to-blue-500 transition-all duration-500"
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Milestone Progress Bar */}
        {project.hasMilestones && (
          <div>
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

        {/* ================= CREDENTIALS & ACCESS SECTION ================= */}
        <div className="pt-3 border-t border-theme space-y-2">
          {liveUrl && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-theme-muted flex items-center gap-1 font-medium">
                <FiGlobe className="text-blue-400" /> Web Preview:
              </span>
              <a
                href={liveUrl.startsWith('http') ? liveUrl : `https://${liveUrl}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-400 hover:underline font-bold flex items-center gap-1 truncate max-w-[170px]"
              >
                <span>{liveUrl.replace(/^https?:\/\//, '')}</span>
                <FiExternalLink size={12} />
              </a>
            </div>
          )}

          {firstCred ? (
            <div className="p-2.5 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] text-xs space-y-1.5" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 truncate max-w-[170px]">
                  <FiLock size={11} className="text-indigo-400 shrink-0" /> {firstCred.label || firstCred.type || "Access Credentials"}
                </span>
                {(firstCred.link || firstCred.url) && (
                  <a
                    href={(firstCred.link || firstCred.url).startsWith('http') ? (firstCred.link || firstCred.url) : `https://${firstCred.link || firstCred.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 shrink-0"
                  >
                    Open <FiExternalLink size={10} />
                  </a>
                )}
              </div>
              {(firstCred.gmail || firstCred.username) && (
                <div className="flex justify-between items-center text-slate-300 text-[11px]">
                  <span>User:</span>
                  <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-white truncate max-w-[180px]">{firstCred.gmail || firstCred.username}</span>
                </div>
              )}
              {firstCred.password && (
                <div className="flex justify-between items-center text-slate-300 text-[11px]">
                  <span>Pass:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-emerald-400">
                      {showPassword ? firstCred.password : '••••••••'}
                    </span>
                    <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white p-0.5">
                      {showPassword ? <FiEyeOff size={12} /> : <FiEye size={12} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !liveUrl ? (
            <div className="text-[11px] text-slate-400 italic flex items-center justify-between py-1">
              <span>Access & Credentials:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <FiCheckCircle size={12} /> Active In Pipeline
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
