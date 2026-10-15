import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckSquare, FiX } from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";

export default function TaskAssignModal({ isOpen, onClose, isLight }) {
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        projectId: "",
        teamMemberIds: [],
        deadline: "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [empRes, projRes] = await Promise.all([
                api.get('/employees'),
                api.get('/projects')
            ]);
            
            if (empRes.data.success) {
                const activeData = (empRes.data.data || []).filter(e => e.status !== 'inactive');
                setEmployees(activeData.map(e => ({
                    id: e.userId?._id || e.userId,
                    name: e.name,
                    role: e.position || e.role || "Employee"
                })).filter(e => {
                    const r = (e.role || "").toLowerCase();
                    return !r.includes('hr') && !r.includes('it support');
                }));
            }

            if (projRes.data.success) {
                setProjects(projRes.data.data.filter(p => (p.status || '').toLowerCase() === 'active'));
            }
        } catch (err) {
            console.error("Failed to fetch data for task assign", err);
            toast.error("Failed to load employees or projects");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTask = async () => {
        if (!newTask.title || newTask.teamMemberIds.length === 0 || !newTask.deadline) {
            toast.error("Please fill all required fields (Title, Assignees, Deadline)");
            return;
        }

        try {
            const promises = newTask.teamMemberIds.map(assigneeId => {
                return api.post('/tasks', {
                    title: newTask.title,
                    description: newTask.description || "No description provided",
                    ...(newTask.projectId ? { project: newTask.projectId } : {}),
                    assignedTo: assigneeId,
                    deadline: newTask.deadline,
                    priority: "medium",
                });
            });
            await Promise.all(promises);
            toast.success("Tasks assigned successfully!");
            setNewTask({ title: "", description: "", projectId: "", teamMemberIds: [], deadline: "" });
            onClose();
            window.dispatchEvent(new CustomEvent('tasksUpdated'));
        } catch (err) {
            console.error("Failed to assign tasks", err);
            toast.error("Failed to assign tasks");
        }
    };

    if (!isOpen) return null;

    const noProject = !newTask.projectId;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`rounded-2xl p-6 w-full max-w-lg border shadow-2xl relative overflow-y-auto max-h-[90vh] ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1a1b2e] border-gray-800 text-white'}`}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <FiCheckSquare size={24} className="text-emerald-500" />
                            <h3 className="font-bold text-2xl">Assign New Task</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition">
                            <FiX size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">

                        {/* Task Title */}
                        <div>
                            <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-wider text-[10px]">Task Title *</label>
                            <input
                                type="text"
                                placeholder="Enter task title"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-wider text-[10px]">Description</label>
                            <textarea
                                placeholder="Task instructions..."
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                rows="2"
                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}
                            />
                        </div>

                    {/* Project — Optional */}
                        <div>
                            <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-wider text-[10px]">
                                Project <span className="text-gray-400 normal-case font-normal">(Optional)</span>
                            </label>
                            <select
                                value={newTask.projectId}
                                onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}
                            >
                                <option value="">— No Project —</option>
                                {projects.map(p => (
                                    <option key={p._id} value={p._id} className="text-black">{p.title || p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Team Members */}
                        <div>
                            <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-wider text-[10px]">Team Members *</label>
                            <div className={`grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-3 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}>
                                {employees.map(e => (
                                    <label key={e.id} className="flex items-center gap-2 cursor-pointer hover:bg-black/5 p-2 rounded-lg transition">
                                        <input
                                            type="checkbox"
                                            checked={newTask.teamMemberIds.includes(e.id)}
                                            onChange={(ev) => {
                                                const ids = [...newTask.teamMemberIds];
                                                if (ev.target.checked) ids.push(e.id);
                                                else {
                                                    const index = ids.indexOf(e.id);
                                                    if (index > -1) ids.splice(index, 1);
                                                }
                                                setNewTask({ ...newTask, teamMemberIds: ids });
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-xs font-semibold truncate">{e.name}</span>
                                    </label>
                                ))}
                                {employees.length === 0 && !loading && <p className="col-span-2 text-center py-2 text-xs opacity-50 italic">No employees found</p>}
                                {loading && <p className="col-span-2 text-center py-2 text-xs opacity-50 animate-pulse">Loading list...</p>}
                            </div>
                        </div>

                        {/* Task Deadline */}
                        <div>
                            <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-wider text-[10px]">Task Deadline *</label>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={newTask.deadline}
                                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end mt-8">
                        <button
                            onClick={onClose}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssignTask}
                            disabled={loading}
                            className={`flex-[2] py-3 rounded-xl bg-[#004AAE] text-white hover:bg-[#003882] transition-all font-bold text-sm shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50`}
                        >
                            Assign Task
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
