import { useState, useEffect } from "react";
import {
    FiClipboard, FiFilter, FiUsers, FiClock, FiChevronRight, FiX,
    FiStar, FiMessageSquare, FiSearch
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
    review: "bg-yellow-500/20 text-yellow-400",
};

export default function AdminTasksTab() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);

    // Filters
    const [filters, setFilters] = useState({ search: "", status: "", assignedBy: "", date: "" });

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tasks');
            if (res.data.success) setTasks(res.data.tasks || res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch tasks", err);
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    // All unique assignedBy users for filter
    const assignedByList = [...new Map(
        tasks.filter(t => t.assignedBy).map(t => [t.assignedBy._id || t.assignedBy, t.assignedBy])
    ).values()];

    // Apply filters + sort newest first
    const filtered = tasks
        .filter(t => {
            const search = filters.search.toLowerCase();
            const matchSearch = !search ||
                (t.title || "").toLowerCase().includes(search) ||
                (t.assignedTo?.name || "").toLowerCase().includes(search) ||
                (t.assignedBy?.name || "").toLowerCase().includes(search);
            const matchStatus = !filters.status || t.status === filters.status;
            const matchBy = !filters.assignedBy || String(t.assignedBy?._id || t.assignedBy) === filters.assignedBy;
            const matchDate = !filters.date || (t.deadline && new Date(t.deadline).toISOString().split('T')[0] === filters.date);
            return matchSearch && matchStatus && matchBy && matchDate;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Stats
    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-5">
            {/* ── Stats Bar ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Tasks", value: stats.total, color: "text-white", bg: "bg-white/5 border-white/5" },
                    { label: "Pending", value: stats.pending, color: "text-gray-400", bg: "bg-gray-500/5 border-gray-500/10" },
                    { label: "In Progress", value: stats.inProgress, color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/10" },
                    { label: "Completed", value: stats.completed, color: "text-green-400", bg: "bg-green-500/5 border-green-500/10" },
                ].map(s => (
                    <div key={s.label} className={`p-4 rounded-2xl border ${s.bg} text-center`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-3 p-4 bg-[var(--bg-card)] rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 text-gray-400 self-center">
                    <FiFilter size={13} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[180px] h-11">
                    <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
                    <input
                        className="text-sm outline-none w-full h-full pl-10 pr-3 rounded-xl border border-white/5 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-theme-primary"
                        placeholder="Search task, member..."
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>

                {/* Assigned By */}
                <select
                    value={filters.assignedBy}
                    onChange={e => setFilters({ ...filters, assignedBy: e.target.value })}
                    className="px-3 rounded-xl bg-[var(--bg-main)] border border-white/5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary min-w-[140px] h-11"
                >
                    <option value="">All Assigners</option>
                    {assignedByList.map(u => (
                        <option key={u._id || u} value={u._id || u}>{u.name || u.username || "Unknown"}</option>
                    ))}
                </select>

                {/* Status */}
                <select
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 rounded-xl bg-[var(--bg-main)] border border-white/5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary h-11"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                </select>

                {/* Deadline date */}
                <input type="date" value={filters.date}
                    onChange={e => setFilters({ ...filters, date: e.target.value })}
                    className="px-3 rounded-xl bg-[var(--bg-main)] border border-white/5 text-sm outline-none focus:ring-2 focus:ring-primary h-11"
                    style={{ colorScheme: 'dark' }}
                />

                {Object.values(filters).some(v => v) && (
                    <button onClick={() => setFilters({ search: "", status: "", assignedBy: "", date: "" })}
                        className="px-3 h-11 rounded-xl bg-red-500/10 text-red-400 text-[10px] font-black uppercase border border-red-500/20 hover:bg-red-500/20 transition">
                        Clear
                    </button>
                )}

                <span className="ml-auto text-[10px] font-black text-gray-500 bg-white/5 px-3 h-11 rounded-xl border border-white/5 flex items-center justify-center">
                    {filtered.length} / {tasks.length}
                </span>
            </div>

            {/* ── Task List ── */}
            {filtered.length === 0 ? (
                <div className="text-center py-24 bg-[var(--bg-card)]/50 rounded-3xl border border-dashed border-white/10">
                    <FiClipboard size={40} className="mx-auto mb-3 text-gray-700 opacity-20" />
                    <p className="text-gray-500 italic">No tasks found.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(task => (
                        <div
                            key={task._id}
                            onClick={() => setSelectedTask(task)}
                            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-white/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${
                                    task.status === 'completed' ? 'bg-green-500' :
                                    task.status === 'in-progress' ? 'bg-blue-500' :
                                    task.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
                                }`} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <h4 className="font-bold text-white text-sm truncate">{task.title}</h4>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${priorityColor[task.priority] || priorityColor.medium}`}>{task.priority}</span>
                                        {task.review && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20 flex-shrink-0">✓ Reviewed</span>}
                                        {task.completionNote && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20 flex-shrink-0 flex items-center gap-1"><FiMessageSquare size={8}/> Note</span>}
                                    </div>

                                    {/* Assigned by → to */}
                                    <div className="flex items-center gap-1.5 text-[11px] mb-1.5">
                                        <span className="text-primary/80 font-bold">{task.assignedBy?.name || "—"}</span>
                                        <span className="text-gray-600">→</span>
                                        <span className="text-white font-bold">{task.assignedTo?.name || "Unknown"}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                        {task.deadline && <span className="flex items-center gap-1"><FiClock size={10}/>{new Date(task.deadline).toLocaleDateString()}</span>}
                                        {task.project?.title && <span className="text-primary/60 truncate max-w-[120px]">{task.project.title}</span>}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg capitalize ${statusColor[task.status] || statusColor.pending}`}>
                                        {task.status || "pending"}
                                    </span>
                                    <FiChevronRight size={14} className="text-gray-600 group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ════ TASK DETAIL MODAL ════ */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-start justify-between p-6 pb-4 border-b border-white/5 flex-shrink-0">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg capitalize ${statusColor[selectedTask.status] || statusColor.pending}`}>{selectedTask.status}</span>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-full border capitalize ${priorityColor[selectedTask.priority] || priorityColor.medium}`}>{selectedTask.priority}</span>
                                    {selectedTask.review && <span className="text-[9px] font-black px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20">✓ Reviewed</span>}
                                </div>
                                <h3 className="text-xl font-black text-white">{selectedTask.title}</h3>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="p-2 rounded-xl hover:bg-white/10 transition text-gray-400 flex-shrink-0"><FiX size={18} /></button>
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
                                    <p className="text-sm font-bold text-primary">{selectedTask.assignedBy?.name || "—"}</p>
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

                            {/* Employee's completion note */}
                            {selectedTask.completionNote && (
                                <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl space-y-1">
                                    <p className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-1.5"><FiMessageSquare size={11}/> Employee's Completion Note</p>
                                    <p className="text-sm text-gray-300 italic">"{selectedTask.completionNote}"</p>
                                </div>
                            )}

                            {/* Team Lead Review */}
                            {selectedTask.review ? (
                                <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-xl space-y-2">
                                    <p className="text-[10px] font-black uppercase text-purple-400 flex items-center gap-1.5"><FiStar size={11}/> Team Lead Review</p>
                                    <p className="text-sm text-gray-300 italic">"{selectedTask.review}"</p>
                                    {selectedTask.reviewRating && (
                                        <div className="flex gap-1">
                                            {[1,2,3,4,5].map(n => (
                                                <FiStar key={n} size={12} className={n <= selectedTask.reviewRating ? "text-amber-400 fill-amber-400" : "text-gray-600"} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : selectedTask.status === 'completed' ? (
                                <div className="bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-xl">
                                    <p className="text-[10px] text-yellow-500/70 font-bold">⏳ Awaiting team lead review</p>
                                </div>
                            ) : null}
                        </div>

                        <div className="p-6 pt-4 border-t border-white/5 flex-shrink-0">
                            <button onClick={() => setSelectedTask(null)} className="w-full py-3 text-gray-400 font-bold rounded-xl hover:bg-white/5 transition">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
