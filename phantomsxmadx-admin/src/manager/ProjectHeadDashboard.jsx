import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { FiCheckSquare, FiUsers, FiTrendingUp, FiClock, FiArrowRight } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";
import { motion, AnimatePresence } from "framer-motion";
import { FiXCircle, FiCheckCircle } from "react-icons/fi";

export default function ProjectHeadDashboard() {
  const { confirm } = useModal();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [milestoneRequests, setMilestoneRequests] = useState([]);
  const [allMilestones, setAllMilestones] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMilestoneReq, setSelectedMilestoneReq] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    teamMembers: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Use allSettled instead of all so one failing endpoint doesn't break the whole dashboard
      const results = await Promise.allSettled([
        api.get('/projects'),
        api.get('/employees'),
        api.get('/milestones'),
        api.get('/tasks')
      ]);

      const projRes = (results[0].status === 'fulfilled' && results[0].value.data?.success) ? results[0].value.data.data : [];
      const empRes = (results[1].status === 'fulfilled' && results[1].value.data?.success) ? results[1].value.data.data : [];
      const milestoneRes = (results[2].status === 'fulfilled' && results[2].value.data?.success) ? results[2].value.data.data : [];
      const taskRes = (results[3].status === 'fulfilled' && results[3].value.data?.tasks) ? results[3].value.data.tasks : [];

      const loadedProjects = Array.isArray(projRes) ? projRes : [];
      const loadedEmployees = Array.isArray(empRes) ? empRes : [];
      const loadedRequests = Array.isArray(milestoneRes) ? milestoneRes : [];
      const loadedTasks = Array.isArray(taskRes) ? taskRes : [];

      setProjects(loadedProjects);
      setEmployees(loadedEmployees);
      setAllMilestones(loadedRequests);
      setAllTasks(loadedTasks);

      // Filter for pending requests
      if (Array.isArray(loadedRequests)) {
        setMilestoneRequests(loadedRequests.filter(r => r.status === 'Pending'));
      }

      // Stats
      setStats({
        totalProjects: loadedProjects.length,
        activeProjects: loadedProjects.filter(p => p.status === 'active').length,
        completedProjects: loadedProjects.filter(p => p.status === 'completed').length,
        teamMembers: loadedEmployees.length
      });

    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateRequestStatus = async (req, status) => {
    try {
      const res = await api.put(`/milestones/${req._id}/status`, { status });
      if (res.data.success) {
        toast.success(`Request ${status}!`);
        fetchData(); // Reload data
      }
    } catch (error) {
      console.error(`Error updating request status to ${status}`, error);
      toast.error(`Failed to ${status.toLowerCase()} request`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen pt-14 md:pt-0">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004AAD]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-[#004AAE]/10 text-[#004AAE]">
            <FiCheckSquare size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-theme-primary transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis">
              ProjectHead Dashboard
            </h1>
            <p className="text-[10px] md:text-sm text-theme-secondary transition-colors duration-200">
              Manage projects and team assignments
            </p>
          </div>
        </div>
      </div>

      {/* MILESTONE REQUESTS SECTION (NEW) */}
      {milestoneRequests.length > 0 && (
        <div className="p-6 rounded-xl bg-[#004AAD]/10 border border-[#004AAD]/30 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-bold text-lg mb-4 text-[#004AAD] flex items-center gap-2">
            <FiClock /> Pending Milestone Requests
            <span className="bg-[#004AAD] text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse">
              {milestoneRequests.length}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestoneRequests.map(req => (
              <div 
                key={req._id} 
                className="bg-[var(--bg-card)] p-4 rounded-lg border border-theme flex justify-between items-center shadow-lg transition-all duration-200 hover:border-[#004AAD] cursor-pointer group"
                onClick={() => setSelectedMilestoneReq(req)}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-bold text-lg text-theme-primary truncate">
                    {(employees.find(e => (e.userId?._id || e.userId) === (req.employeeId?._id || req.employeeId))?.name || req.employeeId?.username || "Unknown Employee").replace(/\s*User$/i, '')}
                  </p>
                  <p className="text-sm text-theme-secondary">
                    Requesting <span className="text-[#004AAD] font-black text-xl">+{req.requestedAmount}</span> milestones
                  </p>
                  <p className="text-[10px] text-theme-muted mt-1 uppercase font-bold tracking-wider truncate">Task: {req.taskId?.title || "Unknown Task"}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); updateRequestStatus(req, 'Approved'); }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-black shadow-lg shadow-green-600/20 transition-all active:scale-95"
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateRequestStatus(req, 'Rejected'); }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-black shadow-lg shadow-red-500/20 transition-all active:scale-95"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<FiCheckSquare className="text-[#004AAE]" />}
          title="Total Projects"
          value={stats.totalProjects}
          color="green"
        />
        <StatCard
          icon={<FiTrendingUp className="text-[#004AAE]" />}
          title="Active Projects"
          value={stats.activeProjects}
          color="blue"
        />
        <StatCard
          icon={<FiCheckSquare className="text-[#004AAD]" />}
          title="Completed"
          value={stats.completedProjects}
          color="custom-blue"
        />
        <StatCard
          icon={<FiUsers className="text-[#004AAE]" />}
          title="Team Members"
          value={stats.teamMembers}
          color="custom-blue"
        />
      </div>

      {/* QUICK ACCESS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickAccessCard
          title="Verify Reports"
          description="Review and verify daily activity reports from employees"
          icon={<FiCheckSquare />}
          link="/projecthead/verify-reports"
        />
        <QuickAccessCard
          title="Assign Projects"
          description="Assign new projects to team members and set deadlines"
          icon={<FiCheckSquare />}
          link="/projecthead/assign-projects"
        />
        <QuickAccessCard
          title="Track Progress"
          description="Monitor project progress and team member performance"
          icon={<FiTrendingUp />}
          link="/projecthead/track-projects"
        />
      </div>

      {/* MY ASSIGNED PROJECTS */}
      <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-theme transition-colors duration-200">
        <h3 className="font-semibold text-lg mb-4 text-theme-primary">My Assigned Projects</h3>
        <div className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-theme-secondary text-sm">No assigned projects</p>
          ) : (
            projects.map((project) => (
              <div
                key={project._id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg bg-[var(--bg-main)] border border-transparent hover:border-[#004AAE]/30 hover:bg-[#004AAE]/5 transition-all gap-4 group"
              >
                <div 
                  onClick={() => navigate('/projecthead/assign-projects', { state: { projectId: project._id } })}
                  className="cursor-pointer flex-1"
                >
                  <p className="font-bold text-base text-theme-primary group-hover:text-[#004AAE] transition-colors">{project.title || "Untitled Project"}</p>
                  <p className="text-xs text-theme-secondary">Client: {project.client?.companyName || project.client?.contactPerson || "Company Client"} • Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  <select
                    value={project.status || 'active'}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        const res = await api.put(`/projects/${project._id}`, { status: newStatus });
                        if (res.data.success) {
                          toast.success(`Status updated to ${newStatus.toUpperCase()}!`);
                          setProjects(projects.map(p => p._id === project._id ? { ...p, status: newStatus } : p));
                        }
                      } catch (err) {
                        toast.error(err.response?.data?.message || "Failed to update project status");
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-theme text-xs font-bold text-theme-primary outline-none focus:ring-2 focus:ring-[#004AAE] uppercase tracking-wider"
                  >
                    <option value="active">Active (In Progress)</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                    <option value="on-domain">On Domain</option>
                    <option value="on-localhost">On Localhost</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => navigate('/projecthead/assign-projects', { state: { projectId: project._id } })}
                    className="px-3 py-1.5 bg-[#004AAE] hover:bg-[#003882] text-white rounded-lg text-xs font-bold transition shadow"
                  >
                    Assign Tasks
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SUBSCRIPTION ASSIGNMENTS - NEW SECTION */}
      {(() => {
        const subscriptions = projects.filter(p => p.isSubscription === true);
        return subscriptions.length > 0 && (
          <div className="p-6 rounded-xl bg-purple-500/5 border border-purple-500/30 transition-colors duration-200">
            <h3 className="font-semibold text-lg mb-4 text-purple-600 flex items-center gap-2">
              💼 My Subscription Assignments
            </h3>
            <div className="space-y-3">
              {subscriptions.map((project) => (
                <div
                  key={project._id}
                  className="p-4 rounded-lg bg-[var(--bg-main)] border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/5 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-sm text-theme-primary group-hover:text-purple-600 transition-colors">{project.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-500/20 text-purple-600">
                          {project.subscriptionCategory}
                        </span>
                      </div>
                      <p className="text-xs text-theme-secondary mb-2">
                        Client: {project.client?.contactPerson || "N/A"} ({project.client?.email || "N/A"})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="text-xs">
                          <span className="text-theme-muted">Monthly Fee:</span>
                          <p className="font-bold text-yellow-600">${project.subscriptionFee || 0}</p>
                        </div>
                        <div className="text-xs">
                          <span className="text-theme-muted">Start:</span>
                          <p className="font-bold">{new Date(project.subscriptionStartDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-xs">
                          <span className="text-theme-muted">Renews:</span>
                          <p className="font-bold">{new Date(project.subscriptionExpiryDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-xs">
                          <span className="text-theme-muted">Status:</span>
                          <p className="font-bold text-green-600">✓ Active</p>
                        </div>
                      </div>
                    </div>
                    <FiArrowRight className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0 ml-2" size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* MILESTONE DETAILS MODAL */}
      <AnimatePresence>
        {selectedMilestoneReq && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedMilestoneReq(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 bg-[#004AAD] text-white flex justify-between items-center">
                <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                  <FiClock /> Milestone Request Details
                </h3>
                <button onClick={() => setSelectedMilestoneReq(null)} className="hover:scale-110 transition-transform">
                  <FiXCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#004AAD]/5 border border-[#004AAD]/10">
                  <div className="w-12 h-12 rounded-full bg-[#004AAD] text-white flex items-center justify-center text-xl font-black">
                    {(() => {
                        const emp = employees.find(e => (e.userId?._id || e.userId) === (selectedMilestoneReq.employeeId?._id || selectedMilestoneReq.employeeId));
                        return (emp?.name || selectedMilestoneReq.employeeId?.username || "?")[0].toUpperCase();
                    })()}
                  </div>
                  <div>
                    <p className="font-black text-xl text-theme-primary">
                        {(employees.find(e => (e.userId?._id || e.userId) === (selectedMilestoneReq.employeeId?._id || selectedMilestoneReq.employeeId))?.name || selectedMilestoneReq.employeeId?.username || "Unknown Employee").replace(/\s*User$/i, '')}
                    </p>
                    <p className="text-xs text-theme-secondary font-bold uppercase tracking-widest">{selectedMilestoneReq.employeeId?.role || "Employee"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-theme bg-[var(--bg-main)]/50">
                        <p className="text-[10px] font-black text-theme-muted uppercase mb-1">Requested Count</p>
                        <p className="text-2xl font-black text-[#004AAD]">+{selectedMilestoneReq.requestedAmount}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-theme bg-[var(--bg-main)]/50">
                        <p className="text-[10px] font-black text-theme-muted uppercase mb-1">Completed History</p>
                        <p className="text-2xl font-black text-green-600">
                            {(() => {
                                const employeeId = selectedMilestoneReq.employeeId?._id || selectedMilestoneReq.employeeId;
                                const approvedRequests = allMilestones.filter(m => (m.employeeId?._id || m.employeeId) === employeeId && m.status === 'Approved').length;
                                const groupCompletedTasks = allTasks.filter(t => (t.assignedTo?._id || t.assignedTo) === employeeId);
                                const completedTaskMS = groupCompletedTasks.reduce((acc, t) => acc + (t.milestones || []).filter(ms => ms.status === 'completed').length, 0);
                                return approvedRequests + completedTaskMS;
                            })()}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Target Task</p>
                    <div className="p-4 rounded-xl border border-[#004AAD]/20 bg-[#004AAD]/5">
                        <p className="font-bold text-theme-primary text-base">{selectedMilestoneReq.taskId?.title || "N/A"}</p>
                        <p className="text-xs text-[#004AAD] font-bold mt-1 uppercase">Project ID: {selectedMilestoneReq.projectId?.title || selectedMilestoneReq.projectId || "N/A"}</p>
                        {selectedMilestoneReq.taskId?.description && (
                            <p className="text-sm text-theme-secondary mt-2 leading-relaxed italic">
                                "{selectedMilestoneReq.taskId.description}"
                            </p>
                        )}
                    </div>
                </div>

                {/* HISTORICAL MILESTONES LIST (UNIFIED) */}
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest">History Log</p>
                    <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {(() => {
                            const employeeId = selectedMilestoneReq.employeeId?._id || selectedMilestoneReq.employeeId;
                            
                            // 1. Get Milestone Requests (Approved/Rejected)
                            const prevRequests = allMilestones
                                .filter(m => (m.employeeId?._id || m.employeeId) === employeeId && m.status !== 'Pending')
                                .map(m => ({
                                    id: m._id,
                                    title: m.taskId?.title || "Milestone Request",
                                    description: m.taskId?.description,
                                    amount: `+${m.requestedAmount}`,
                                    status: m.status,
                                    date: m.createdAt,
                                    project: projects.find(p => p._id === (m.projectId?._id || m.projectId))?.title || "Project N/A",
                                    type: 'request'
                                }));

                            // 2. Get Task Milestones (Completed)
                            const completedTaskMilestones = allTasks
                                .filter(t => (t.assignedTo?._id || t.assignedTo) === employeeId)
                                .flatMap(t => (t.milestones || [])
                                    .filter(ms => ms.status === 'completed')
                                    .map(ms => ({
                                        id: ms._id,
                                        title: ms.title,
                                        description: ms.description,
                                        amount: "TASK MS",
                                        status: "COMPLETED",
                                        date: ms.completedAt || t.updatedAt,
                                        project: t.project?.title || projects.find(p => p._id === (t.project?._id || t.project))?.title || "Project N/A",
                                        type: 'internal'
                                    }))
                                );

                            const unifiedHistory = [...prevRequests, ...completedTaskMilestones]
                                .sort((a, b) => new Date(b.date) - new Date(a.date));

                            if (unifiedHistory.length === 0) {
                                return <p className="text-xs text-theme-muted italic">No previous milestone activity found.</p>;
                            }

                            return unifiedHistory.map((item, idx) => (
                                <div key={item.id || idx} className="p-3 rounded-lg bg-[var(--bg-main)] border border-theme space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-bold text-theme-primary text-[12px] truncate">{item.title}</p>
                                                {item.type === 'internal' && (
                                                    <span className="text-[8px] bg-blue-500/10 text-blue-600 px-1 rounded uppercase font-black">Internal</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-theme-muted font-bold uppercase tracking-tighter">
                                                {new Date(item.date).toLocaleDateString()} • {item.project}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                            <span className={`font-black text-[13px] ${item.type === 'internal' ? 'text-blue-600' : 'text-[#004AAD]'}`}>{item.amount}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${item.status === 'Approved' || item.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                    {item.description && (
                                        <p className="text-[11px] text-theme-secondary leading-tight line-clamp-2 border-t border-theme-muted/10 pt-1.5 italic">
                                            "{item.description}"
                                        </p>
                                    )}
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { updateRequestStatus(selectedMilestoneReq, 'Approved'); setSelectedMilestoneReq(null); }}
                    className="flex-1 py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black shadow-lg shadow-green-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                  >
                    <FiCheckCircle /> Approve
                  </button>
                  <button
                    onClick={() => { updateRequestStatus(selectedMilestoneReq, 'Rejected'); setSelectedMilestoneReq(null); }}
                    className="flex-1 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                  >
                    <FiXCircle /> Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  const colorStyles = {
    green: {
      border: "border-green-500/20",
      bg: "bg-[#004AAE]/10",
      text: "text-[#004AAE]",
      icon: "text-[#004AAE]",
    },
    red: {
      border: "border-red-500/20",
      bg: "bg-red-500/10",
      text: "text-red-500",
      icon: "text-red-500",
    },
    orange: {
      border: "border-orange-500/20",
      bg: "bg-orange-500/10",
      text: "text-orange-500",
      icon: "text-orange-500",
    },
    purple: {
      border: "border-[#004AAD]/20",
      bg: "bg-[#004AAD]/10",
      text: "text-[#004AAD]",
      icon: "text-[#004AAD]",
    },
    "custom-blue": {
      border: "border-[#004AAD]/20",
      bg: "bg-[#004AAD]/10",
      text: "text-[#004AAD]",
      icon: "text-[#004AAD]",
    },
    blue: {
      border: "border-blue-500/20",
      bg: "bg-blue-500/10",
      text: "text-[#004AAE]",
      icon: "text-[#004AAE]",
    }
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className={`p-5 rounded-2xl border ${style.border} bg-theme-card shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-theme-secondary uppercase tracking-wide">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${style.text}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${style.bg} ${style.icon} text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAccessCard({ title, description, icon, link }) {
  return (
    <a
      href={link}
      className="p-5 rounded-xl bg-theme-card border border-theme hover:shadow-md transition cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-lg bg-green-500/20 text-green-500 group-hover:scale-110 transition">
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-theme-primary transition-colors">{title}</p>
          <p className="text-sm text-theme-secondary mt-1 transition-colors">{description}</p>
        </div>
      </div>
    </a>
  );
}
