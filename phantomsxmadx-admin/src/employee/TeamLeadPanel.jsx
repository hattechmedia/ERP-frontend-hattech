import { useState, useEffect } from "react";
import {
    FiUsers, FiFileText, FiCheckCircle, FiPlus, FiCheck, FiEye,
    FiCalendar, FiClock, FiChevronRight, FiX, FiStar, FiAlertCircle,
    FiXCircle, FiClipboard, FiFilter
} from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";

const priorityColor = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusColor = {
    pending: "bg-gray-500/20 text-gray-400",
    "in-progress": "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    overdue: "bg-red-500/20 text-red-400",
    reviewed: "bg-purple-500/20 text-purple-400",
};

export default function TeamLeadPanel() {
    const [activeTab, setActiveTab] = useState("projects");
    const [members, setMembers] = useState([]);
    const [reports, setReports] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Reports tab state
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [reviewModal, setReviewModal] = useState({ show: false, reportId: null, type: "verify", text: "" });

    // Tasks tab state
    const [taskFilter, setTaskFilter] = useState({ member: "", status: "", date: "" });
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskReviewModal, setTaskReviewModal] = useState({ show: false, task: null, review: "", rating: 5 });

    // Assign task modal
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskForm, setTaskForm] = useState({
        assignedTo: "", assignedName: "", project: "", title: "", description: "", deadline: "", priority: "medium",
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [memRes, repRes, projRes, taskRes] = await Promise.all([
                api.get('/team/members'),
                api.get('/team/reports'),
                api.get('/projects'),
                api.get('/team/tasks').catch(() => ({ data: { tasks: [] } })),
            ]);
            if (memRes.data.success) setMembers(memRes.data.data);
            if (repRes.data.success) setReports(repRes.data.reports);
            if (projRes.data.success) setProjects(projRes.data.data || []);
            const t = taskRes.data?.tasks || taskRes.data?.data || [];
            setTasks(t);
        } catch (err) {
            console.error("Failed to fetch team data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ─── ASSIGN TASK ────────────────────────────────────────────────────────────
    const handleAssignTask = async (e) => {
        e.preventDefault();
        if (!taskForm.title || !taskForm.deadline) {
            toast.error("Please fill in the task title and deadline");
            return;
        }
        try {
            const res = await api.post('/team/tasks', {
                assignedTo: taskForm.assignedTo,
                title: taskForm.title,
                description: taskForm.description,
                deadline: taskForm.deadline,
                priority: taskForm.priority,
                ...(taskForm.project ? { project: taskForm.project } : {}),
            });
            if (res.data.success) {
                toast.success("Task assigned!");
                setShowTaskForm(false);
                setTaskForm({ assignedTo: "", assignedName: "", project: "", title: "", description: "", deadline: "", priority: "medium" });
                fetchData();
            }
        } catch { toast.error("Failed to assign task"); }
    };

    // ─── VERIFY REPORT ──────────────────────────────────────────────────────────
    const handleVerify = async () => {
        try {
            const res = await api.post(`/team/reports/${reviewModal.reportId}/verify`, { feedback: reviewModal.text });
            if (res.data.success) {
                toast.success("Report verified!");
                setReports(reports.map(r => r._id === reviewModal.reportId ? { ...r, status: 'verified', feedback: reviewModal.text } : r));
                setReviewModal({ show: false, reportId: null, type: "verify", text: "" });
            }
        } catch { toast.error("Verification failed"); }
    };

    // ─── REJECT REPORT ──────────────────────────────────────────────────────────
    const handleReject = async () => {
        if (!reviewModal.text) { toast.error("Please provide a reason for rejection"); return; }
        try {
            const res = await api.post(`/team/reports/${reviewModal.reportId}/reject`, { reason: reviewModal.text });
            if (res.data.success) {
                toast.success("Report rejected");
                setReports(reports.map(r => r._id === reviewModal.reportId ? { ...r, status: 'rejected', feedback: reviewModal.text } : r));
                setReviewModal({ show: false, reportId: null, type: "verify", text: "" });
            }
        } catch { toast.error("Rejection failed"); }
    };

    // ─── REVIEW TASK ────────────────────────────────────────────────────────────
    const handleTaskReview = async () => {
        if (!taskReviewModal.review) { toast.error("Please write a review"); return; }
        try {
            const res = await api.post(`/team/tasks/${taskReviewModal.task._id}/review`, {
                review: taskReviewModal.review,
                rating: taskReviewModal.rating,
            });
            if (res.data.success) {
                toast.success("Review submitted!");
                setTasks(tasks.map(t => t._id === taskReviewModal.task._id ? { ...t, review: taskReviewModal.review, reviewRating: taskReviewModal.rating } : t));
                setTaskReviewModal({ show: false, task: null, review: "", rating: 5 });
                setSelectedTask(null);
            }
        } catch { toast.error("Failed to submit review"); }
    };

    // ─── FILTERED TASKS ─────────────────────────────────────────────────────────
    const filteredTasks = tasks.filter(t => {
        const memberMatch = !taskFilter.member || t.assignedTo?._id === taskFilter.member || t.assignedTo === taskFilter.member;
        const statusMatch = !taskFilter.status || t.status === taskFilter.status;
        const dateMatch = !taskFilter.date || (t.deadline && new Date(t.deadline).toISOString().split('T')[0] === taskFilter.date);
        return memberMatch && statusMatch && dateMatch;
    });

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Team Data...</div>;

    return (
        <div className="space-y-6 pt-14 md:pt-0">
            <div>
                <h1 className="text-2xl font-bold text-primary">Team Management</h1>
                <p className="text-sm text-gray-400">Manage your team members, tasks and reports</p>
            </div>

            {/* ── TABS ── */}
            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5 backdrop-blur-md flex-wrap">
                {[
                    { id: "members",  icon: <FiUsers size={13} />, label: "Team Members" },
                    { id: "projects", icon: <FiCheckCircle size={13} />, label: "Assigned Projects", badge: projects.length },
                    { id: "tasks",    icon: <FiClipboard size={13} />, label: "Tasks", badge: tasks.length },
                    { id: "reports",  icon: <FiFileText size={13} />, label: "Daily Reports" },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id ? "bg-primary text-white shadow-xl shadow-primary/40 scale-105" : "text-gray-500 hover:text-white"}`}
                    >
                        {tab.icon} {tab.label}
                        {tab.badge > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'}`}>{tab.badge}</span>}
                    </button>
                ))}
            </div>

            {/* ── PROJECTS TAB ── */}
            {activeTab === "projects" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(proj => (
                            <div key={proj._id} className="p-6 rounded-3xl bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border border-white/5 shadow-2xl flex flex-col justify-between group relative overflow-hidden space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-black text-lg text-white tracking-tight">{proj.title}</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">{proj.client?.companyName || proj.client?.contactPerson || "Company Client"}</p>
                                    </div>
                                    <select
                                        value={proj.status || 'active'}
                                        onChange={async (e) => {
                                            const newStatus = e.target.value;
                                            try {
                                                const res = await api.put(`/projects/${proj._id}`, { status: newStatus });
                                                if (res.data.success) {
                                                    toast.success(`Project status updated to ${newStatus.toUpperCase()}!`);
                                                    setProjects(projects.map(p => p._id === proj._id ? { ...p, status: newStatus } : p));
                                                }
                                            } catch (err) {
                                                toast.error(err.response?.data?.message || "Failed to update project status");
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary uppercase tracking-wider"
                                    >
                                        <option value="active">Active (In Progress)</option>
                                        <option value="completed">Completed</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="on-domain">On Domain</option>
                                        <option value="on-localhost">On Localhost</option>
                                        <option value="on-hold">On Hold</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div className="space-y-2 text-xs text-gray-400">
                                    <div className="flex justify-between">
                                        <span>Deadline:</span>
                                        <span className="font-bold text-white">{proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Priority:</span>
                                        <span className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${proj.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{proj.priority || 'medium'}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { 
                                        setTaskForm({ assignedTo: "", assignedName: "", project: proj._id, title: "", description: "", deadline: "", priority: "medium" }); 
                                        setShowTaskForm(true); 
                                    }}
                                    className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/30 uppercase tracking-widest"
                                >
                                    <FiPlus /> Assign Task To Team
                                </button>
                            </div>
                        ))}
                    </div>

                    {projects.length === 0 && (
                        <div className="text-center py-20 bg-[var(--bg-card)]/50 rounded-3xl border border-dashed border-white/10">
                            <FiCheckCircle size={48} className="mx-auto mb-4 text-gray-700 opacity-20" />
                            <p className="text-gray-500 italic font-medium">No projects assigned to you yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── MEMBERS TAB ── */}
            {activeTab === "members" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map(member => (
                            <div key={member._id} className="p-6 rounded-3xl bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border border-white/5 shadow-2xl flex items-center justify-between group relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="relative">
                                        <img src={member.userId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.userId?.name)}`} className="w-14 h-14 rounded-2xl border-2 border-primary/30 object-cover" alt="" />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[var(--bg-card)] rounded-full" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base text-white tracking-tight">{member.userId?.name}</h3>
                                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] opacity-80">{member.position}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setTaskForm({ assignedTo: member.userId?._id, assignedName: member.userId?.name, project: "", title: "", description: "", deadline: "", priority: "medium" }); setShowTaskForm(true); }}
                                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl flex items-center gap-2 text-[10px] font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/30 z-10 uppercase tracking-widest"
                                >
                                    <FiPlus /> ASSIGN TASK
                                </button>
                            </div>
                        ))}
                    </div>
                    {members.length === 0 && (
                        <div className="text-center py-20 bg-[var(--bg-card)]/50 rounded-3xl border border-dashed border-white/10">
                            <FiUsers size={48} className="mx-auto mb-4 text-gray-700 opacity-20" />
                            <p className="text-gray-500 italic font-medium">No team members assigned to you yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── TASKS TAB ── */}
            {activeTab === "tasks" && (
                <div className="space-y-5">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 p-4 bg-[var(--bg-card)] rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 text-gray-400">
                            <FiFilter size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                        </div>

                        {/* Member filter */}
                        <select
                            value={taskFilter.member}
                            onChange={e => setTaskFilter({ ...taskFilter, member: e.target.value })}
                            className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-white/5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">All Members</option>
                            {members.map(m => (
                                <option key={m._id} value={m.userId?._id}>{m.userId?.name}</option>
                            ))}
                        </select>

                        {/* Status filter */}
                        <select
                            value={taskFilter.status}
                            onChange={e => setTaskFilter({ ...taskFilter, status: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-white/5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="overdue">Overdue</option>
                        </select>

                        {/* Date filter (deadline) */}
                        <input
                            type="date"
                            value={taskFilter.date}
                            onChange={e => setTaskFilter({ ...taskFilter, date: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-white/5 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />

                        {(taskFilter.member || taskFilter.status || taskFilter.date) && (
                            <button onClick={() => setTaskFilter({ member: "", status: "", date: "" })} className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-[10px] font-black uppercase border border-red-500/20 hover:bg-red-500/20 transition">
                                Clear
                            </button>
                        )}

                        <span className="ml-auto text-[10px] font-black text-gray-500 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                            {filteredTasks.length} tasks
                        </span>
                    </div>

                    {/* Task list */}
                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-24 bg-[var(--bg-card)]/50 rounded-3xl border border-dashed border-white/10">
                            <FiClipboard size={40} className="mx-auto mb-3 text-gray-700 opacity-20" />
                            <p className="text-gray-500 italic">No tasks found for the selected filters.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTasks.map(task => (
                                <div
                                    key={task._id}
                                    onClick={() => setSelectedTask(task)}
                                    className="p-5 rounded-2xl bg-[var(--bg-card)] border border-white/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Status dot */}
                                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-blue-500' : task.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'}`} />

                                        <div className="flex-1 min-w-0">
                                            {/* Title + priority */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-bold text-white text-sm truncate">{task.title}</h4>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${priorityColor[task.priority] || priorityColor.medium}`}>{task.priority}</span>
                                                {task.review && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20 flex-shrink-0">✓ Reviewed</span>}
                                            </div>

                                            {/* Assigned by → assigned to */}
                                            <div className="flex items-center gap-3 text-[11px] mb-2">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <FiUsers size={10} />
                                                    <span className="text-primary/80 font-bold">{task.assignedBy?.name || "You"}</span>
                                                    <span className="text-gray-600 mx-1">→</span>
                                                    <span className="text-white font-bold">{task.assignedTo?.name || "Unknown"}</span>
                                                </span>
                                            </div>

                                            {/* Deadline + project */}
                                            <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                                {task.deadline && (
                                                    <span className="flex items-center gap-1"><FiClock size={10} />{new Date(task.deadline).toLocaleDateString()}</span>
                                                )}
                                                {task.project?.title && (
                                                    <span className="text-primary/60 truncate max-w-[120px]">{task.project.title}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg capitalize ${statusColor[task.status] || statusColor.pending}`}>
                                                {task.status || "pending"}
                                            </span>
                                            {/* Review button for completed tasks */}
                                            {task.status === 'completed' && !task.review && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); setTaskReviewModal({ show: true, task, review: "", rating: 5 }); }}
                                                    className="text-[9px] font-black px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:bg-purple-500/30 transition uppercase"
                                                >
                                                    + Review
                                                </button>
                                            )}
                                            <FiChevronRight size={14} className="text-gray-600 group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── REPORTS TAB ── */}
            {activeTab === "reports" && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
                        <span className="text-xs font-bold text-gray-500 uppercase">Filter by Date</span>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                            className="bg-[var(--bg-main)] border border-[var(--border-color)] text-theme-primary text-xs p-2 rounded-lg outline-none focus:ring-1 focus:ring-primary" />
                    </div>

                    {reports.filter(r => new Date(r.date).toISOString().split('T')[0] === selectedDate).map(report => (
                        <div key={report._id} className="p-6 rounded-3xl bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border border-white/5 shadow-2xl">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <img src={report.userId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(report.userId?.name)}`}
                                        className="w-12 h-12 rounded-2xl border border-primary/20 shadow-lg" alt="" />
                                    <div>
                                        <h4 className="font-black text-white text-lg">{report.userId?.name}</h4>
                                        <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                                            {new Date(report.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col gap-2 items-end">
                                    {report.status === 'verified' ? (
                                        <span className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase bg-green-500/10 px-4 py-2 rounded-2xl border border-green-500/20">
                                            <FiCheckCircle size={13} /> Verified
                                        </span>
                                    ) : report.status === 'rejected' ? (
                                        <span className="flex items-center gap-2 text-red-400 text-[10px] font-black uppercase bg-red-500/10 px-4 py-2 rounded-2xl border border-red-500/20">
                                            <FiXCircle size={13} /> Rejected
                                        </span>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setReviewModal({ show: true, reportId: report._id, type: "verify", text: "" })}
                                                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-[10px] font-black rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary/20 uppercase tracking-widest transition-all hover:scale-105"
                                            >
                                                <FiCheck size={13} /> Verify
                                            </button>
                                            <button
                                                onClick={() => setReviewModal({ show: true, reportId: report._id, type: "reject", text: "" })}
                                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-black rounded-xl flex items-center gap-1.5 border border-red-500/20 uppercase tracking-widest transition-all hover:scale-105"
                                            >
                                                <FiXCircle size={13} /> Reject
                                            </button>
                                        </div>
                                    )}
                                    {/* Show feedback if any */}
                                    {report.feedback && (
                                        <p className="text-[10px] text-gray-500 italic max-w-[200px] text-right">"{report.feedback}"</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[var(--bg-main)] p-6 rounded-2xl border border-white/5 shadow-inner">
                                <p className="text-sm leading-relaxed text-gray-300 font-medium whitespace-pre-wrap">{report.report}</p>
                                {report.images && report.images.length > 0 && (
                                    <div className="flex flex-wrap gap-3 mt-4">
                                        {report.images.map((img, idx) => (
                                            <div key={idx} className="relative group/img w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden" onClick={() => window.open(img, '_blank')}>
                                                <img src={img} alt={`attachment ${idx + 1}`} className="w-full h-full object-cover border border-white/10 group-hover/img:scale-110 group-hover/img:border-primary/50 transition-transform" />
                                                <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                    <FiEye className="text-white" size={20} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {reports.filter(r => new Date(r.date).toISOString().split('T')[0] === selectedDate).length === 0 && (
                        <div className="text-center py-32 bg-[var(--bg-card)]/50 rounded-3xl border border-dashed border-white/10">
                            <p className="text-gray-500 italic font-medium text-lg">No reports for this date.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════ MODALS ════════════ */}

            {/* ASSIGN TASK MODAL */}
            {showTaskForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md border border-primary/40 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-2"><FiPlus className="text-primary" /> Assign Task</h2>
                                {taskForm.assignedName && <p className="text-[11px] text-primary font-bold mt-0.5 uppercase tracking-widest opacity-70">→ {taskForm.assignedName}</p>}
                            </div>
                            <button onClick={() => setShowTaskForm(false)} className="p-2 rounded-xl hover:bg-white/10 transition text-gray-400 hover:text-white"><FiX size={18} /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 block mb-1.5">Assign To (Team Member) *</label>
                                <select 
                                    className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] outline-none focus:ring-2 focus:ring-primary font-bold text-sm text-white"
                                    value={taskForm.assignedTo} 
                                    onChange={e => {
                                        const selectedMember = members.find(m => String(m.userId?._id || m.userId) === String(e.target.value));
                                        setTaskForm({ 
                                            ...taskForm, 
                                            assignedTo: e.target.value,
                                            assignedName: selectedMember?.userId?.name || ""
                                        });
                                    }}
                                    required
                                >
                                    <option value="">— Select Team Member —</option>
                                    {members.map(m => (
                                        <option key={m._id} value={m.userId?._id || m.userId}>
                                            {m.userId?.name || m.position} ({m.userId?.email || 'Member'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 block mb-1.5">Related Project <span className="normal-case font-normal">(Optional)</span></label>
                                <select className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
                                    value={taskForm.project} onChange={e => setTaskForm({ ...taskForm, project: e.target.value })}>
                                    <option value="">— No Project —</option>
                                    {projects.map(proj => <option key={proj._id} value={proj._id}>{proj.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 block mb-1.5">Task Title *</label>
                                <input className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] outline-none focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="Brief task name" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 block mb-1.5">Description</label>
                                <textarea className="w-full h-24 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                                    placeholder="Instructions for team member..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1.5">Deadline *</label>
                                    <input type="date" min={new Date().toISOString().split('T')[0]}
                                        className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
                                        value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1.5">Priority</label>
                                    <select className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
                                        value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 pt-4 border-t border-white/5 flex-shrink-0">
                            <button onClick={() => setShowTaskForm(false)} className="flex-1 py-3 text-gray-400 font-bold rounded-xl hover:bg-white/5 transition">Cancel</button>
                            <button onClick={handleAssignTask} className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Assign Task</button>
                        </div>
                    </div>
                </div>
            )}

            {/* REPORT VERIFY / REJECT MODAL */}
            {reviewModal.show && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className={`text-lg font-black flex items-center gap-2 ${reviewModal.type === 'reject' ? 'text-red-400' : 'text-green-400'}`}>
                                {reviewModal.type === 'reject' ? <><FiXCircle /> Reject Report</> : <><FiCheck /> Verify Report</>}
                            </h3>
                            <button onClick={() => setReviewModal({ show: false, reportId: null, type: "verify", text: "" })} className="p-2 rounded-xl hover:bg-white/10 text-gray-400"><FiX size={16} /></button>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 block mb-2">
                                {reviewModal.type === 'reject' ? 'Reason for Rejection *' : 'Feedback / Review (Optional)'}
                            </label>
                            <textarea
                                rows={4}
                                className={`w-full p-3 rounded-xl bg-[var(--bg-main)] border text-sm resize-none outline-none focus:ring-2 ${reviewModal.type === 'reject' ? 'border-red-500/20 focus:ring-red-400' : 'border-[var(--border-color)] focus:ring-primary'}`}
                                placeholder={reviewModal.type === 'reject' ? 'Explain why you are rejecting this report...' : 'Add a note or feedback for the team member...'}
                                value={reviewModal.text}
                                onChange={e => setReviewModal({ ...reviewModal, text: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setReviewModal({ show: false, reportId: null, type: "verify", text: "" })} className="flex-1 py-3 text-gray-400 font-bold rounded-xl hover:bg-white/5 transition">Cancel</button>
                            <button
                                onClick={reviewModal.type === 'reject' ? handleReject : handleVerify}
                                className={`flex-[2] py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 ${reviewModal.type === 'reject' ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 'bg-green-600 shadow-green-500/20 hover:bg-green-700'}`}
                            >
                                {reviewModal.type === 'reject' ? 'Reject Report' : 'Verify Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TASK DETAIL MODAL */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-start justify-between p-6 pb-4 border-b border-white/5 flex-shrink-0">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg capitalize ${statusColor[selectedTask.status] || statusColor.pending}`}>{selectedTask.status || "pending"}</span>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-full border capitalize ${priorityColor[selectedTask.priority] || priorityColor.medium}`}>{selectedTask.priority}</span>
                                    {selectedTask.review && <span className="text-[9px] font-black px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20">✓ Reviewed</span>}
                                </div>
                                <h3 className="text-xl font-black text-white">{selectedTask.title}</h3>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="p-2 rounded-xl hover:bg-white/10 transition text-gray-400 hover:text-white flex-shrink-0"><FiX size={18} /></button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6 space-y-4">
                            {selectedTask.description && (
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Description</p>
                                    <p className="text-sm text-gray-300 leading-relaxed bg-[var(--bg-main)] p-4 rounded-xl border border-white/5">{selectedTask.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Assigned By</p>
                                    <p className="text-sm font-bold text-primary">{selectedTask.assignedBy?.name || "You"}</p>
                                </div>
                                <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Assigned To</p>
                                    <p className="text-sm font-bold text-white">{selectedTask.assignedTo?.name || "Unknown"}</p>
                                </div>
                                <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Deadline</p>
                                    <p className="text-sm font-bold text-white">{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : "—"}</p>
                                </div>
                                {selectedTask.project?.title && (
                                    <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Project</p>
                                        <p className="text-sm font-bold text-primary">{selectedTask.project.title}</p>
                                    </div>
                                )}
                            </div>

                            {/* Existing review */}
                            {selectedTask.review && (
                                <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-xl space-y-2">
                                    <p className="text-[10px] font-black uppercase text-purple-400 flex items-center gap-1.5"><FiStar size={11} /> Your Review</p>
                                    <p className="text-sm text-gray-300 italic">"{selectedTask.review}"</p>
                                    {selectedTask.reviewRating && (
                                        <div className="flex gap-1">
                                            {[1,2,3,4,5].map(n => (
                                                <FiStar key={n} size={12} className={n <= selectedTask.reviewRating ? "text-amber-400 fill-amber-400" : "text-gray-600"} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6 pt-4 border-t border-white/5 flex-shrink-0 flex gap-3">
                            <button onClick={() => setSelectedTask(null)} className="flex-1 py-3 text-gray-400 font-bold rounded-xl hover:bg-white/5 transition">Close</button>
                            {selectedTask.status === 'completed' && !selectedTask.review && (
                                <button
                                    onClick={() => setTaskReviewModal({ show: true, task: selectedTask, review: "", rating: 5 })}
                                    className="flex-[2] py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <FiStar size={14} /> Write Review
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TASK REVIEW MODAL */}
            {taskReviewModal.show && (
                <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md border border-purple-500/30 shadow-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-purple-400 flex items-center gap-2"><FiStar /> Review Task</h3>
                            <button onClick={() => setTaskReviewModal({ show: false, task: null, review: "", rating: 5 })} className="p-2 rounded-xl hover:bg-white/10 text-gray-400"><FiX size={16} /></button>
                        </div>

                        <div className="bg-[var(--bg-main)] p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Task</p>
                            <p className="text-sm font-bold text-white">{taskReviewModal.task?.title}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">→ {taskReviewModal.task?.assignedTo?.name}</p>
                        </div>

                        {/* Star rating */}
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 block mb-2">Rating</label>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(n => (
                                    <button key={n} onClick={() => setTaskReviewModal({ ...taskReviewModal, rating: n })}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${n <= taskReviewModal.rating ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white/5 text-gray-600 border border-white/5'}`}>
                                        <FiStar size={16} className={n <= taskReviewModal.rating ? "fill-amber-400" : ""} />
                                    </button>
                                ))}
                                <span className="ml-2 self-center text-sm font-black text-amber-400">{taskReviewModal.rating}/5</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 block mb-2">Your Feedback *</label>
                            <textarea
                                rows={4}
                                className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-purple-500/20 text-sm resize-none outline-none focus:ring-2 focus:ring-purple-400"
                                placeholder="Write your feedback on how this task was completed..."
                                value={taskReviewModal.review}
                                onChange={e => setTaskReviewModal({ ...taskReviewModal, review: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setTaskReviewModal({ show: false, task: null, review: "", rating: 5 })} className="flex-1 py-3 text-gray-400 font-bold rounded-xl hover:bg-white/5 transition">Cancel</button>
                            <button onClick={handleTaskReview} className="flex-[2] py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all">Submit Review</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
