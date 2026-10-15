import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../services/api";
import { FiArrowLeft, FiLayers, FiCheckCircle, FiUser, FiX, FiEdit, FiTrash2, FiPlus, FiClock, FiLock, FiEye, FiEyeOff, FiCopy, FiExternalLink } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
const cleanName = (name) => {
  if (!name) return "";
  let cleaned = String(name).replace(/\s*User$/i, '').trim();
  cleaned = cleaned.replace(/undefined/gi, '').trim();
  return cleaned || String(name);
};

export default function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [allEmployees, setAllEmployees] = useState([]);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [notesLoading, setNotesLoading] = useState(false);
    const [visibleCreds, setVisibleCreds] = useState({});

    useEffect(() => {
        const loadData = async () => {
            try {
                const [projectRes, empRes] = await Promise.all([
                    api.get(`/projects/${id}`),
                    api.get('/employees')
                ]);

                if (projectRes.data.success) {
                    const fetchedProject = projectRes.data.data;
                    const employees = empRes.data.data || empRes.data.employees || [];

                    // Create a map of userId -> full name
                    const nameMap = {};
                    employees.forEach(emp => {
                        if (emp.userId?._id || emp.userId) {
                            nameMap[emp.userId?._id || emp.userId] = emp.name;
                        }
                    });

                    // Map team members to objects with proper names
                    const teamMembers = (fetchedProject.team || []).map(t => {
                        const userId = t._id || t;
                        let name = nameMap[userId] || t.username || `${t.firstName || ''} ${t.lastName || ''}`.trim();
                        if (!name || name === 'undefined undefined') name = t.username || "Team Member";

                        // Clean " User" suffix
                        name = name.replace(/\s*User$/i, '').trim();

                        return {
                            id: userId,
                            name: name,
                            role: t.role || "Member",
                            image: t.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
                        };
                    });

                    const formatDateSafe = (d) => {
                        if (!d) return "N/A";
                        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
                            const [y, m, day] = d.split('T')[0].split('-').map(Number);
                            return new Date(y, m - 1, day).toLocaleDateString();
                        }
                        return new Date(d).toLocaleDateString();
                    };

                    const normalizedProject = {
                        ...fetchedProject,
                        name: fetchedProject.title || fetchedProject.name || fetchedProject.project,
                        client: fetchedProject.client?.name || fetchedProject.client?.company || "External",
                        start: formatDateSafe(fetchedProject.startDate),
                        deadline: formatDateSafe(fetchedProject.endDate || fetchedProject.deadline || "Ongoing"),
                        progress: (fetchedProject.status || '').toLowerCase() === 'completed' ? 100 : (fetchedProject.progress || 0),
                        status: fetchedProject.status,
                        type: fetchedProject.type || 'General',
                        platform: fetchedProject.platform || 'Web',
                        seoType: fetchedProject.seoType || 'N/A',
                        stack: fetchedProject.stack || '',
                        assignedPersons: teamMembers,
                        nameMap // Store for task resolution
                    };

                    // We might need to fetch tasks for this project to calculate progress/show tasks
                    // Filter tasks by project ID or Name?
                    // Tasks usually have projectId.
                    // Let's fetch all tasks and filter (inefficient but works for now) or add endpoint.
                    // Currently we don't have getTasksByProject.
                    // Let's rely on tasks we can fetch.

                    const taskRes = await api.get('/tasks');
                    if (taskRes.data.success || taskRes.data.tasks) {
                        const allTasks = taskRes.data.tasks || taskRes.data.data || [];
                        const projectTasks = allTasks.filter(t =>
                            (t.project?._id || t.project) === id ||
                            (t.project?.title || t.project) === fetchedProject.title
                        );

                        normalizedProject.tasks = projectTasks;

                        // Combine team members from project.team AND task assignees
                        const combinedMembersMap = new Map();

                        // 1. Add members from project.team
                        (teamMembers || []).forEach(m => {
                            if (m.id) {
                                combinedMembersMap.set(m.id.toString(), m);
                            }
                        });

                        // 2. Add members assigned to tasks in this project
                        (projectTasks || []).forEach(t => {
                            const assignee = t.assignedTo;
                            if (!assignee) return;
                            const userId = (assignee._id || assignee).toString();
                            if (!combinedMembersMap.has(userId)) {
                                let name = nameMap[userId] || cleanName(assignee.name || assignee.username);
                                if (!name || name === 'undefined undefined') name = "Team Member";
                                combinedMembersMap.set(userId, {
                                    id: userId,
                                    name: name,
                                    role: assignee.role || "Member",
                                    image: assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
                                });
                            }
                        });

                        normalizedProject.assignedPersons = Array.from(combinedMembersMap.values());

                        // Aggregate all milestones from tasks
                        const allMilestones = [];
                        projectTasks.forEach(task => {
                            if (task.milestones && task.milestones.length > 0) {
                                task.milestones.forEach(ms => {
                                    allMilestones.push({
                                        ...ms,
                                        taskTitle: task.title
                                    });
                                });
                            }
                        });
                        normalizedProject.milestones = allMilestones;

                        if (projectTasks.length > 0) {
                            let totalWeight = 0;
                            let completedWeight = 0;

                            projectTasks.forEach(task => {
                                totalWeight += 1;
                                if (task.milestones && task.milestones.length > 0) {
                                    const msTotal = task.milestones.length;
                                    const msCompleted = task.milestones.filter(m => (m.status || '').toLowerCase() === 'completed').length;
                                    completedWeight += (msCompleted / msTotal);
                                } else {
                                    if ((task.status || '').toLowerCase() === 'completed') {
                                        completedWeight += 1;
                                    }
                                }
                            });

                            normalizedProject.progress = Math.round((completedWeight / totalWeight) * 100);
                        }
                    }

                    setProject(normalizedProject);
                }

                if (empRes.data.success) {
                    // Format employees for "Add Member" list
                    const rawEmployees = empRes.data.employees || empRes.data.data || [];
                    const activeEmployees = rawEmployees.filter(e => e.status !== 'inactive');
                    const formattedEmps = activeEmployees.map(e => ({
                        id: e.userId?._id || e._id,
                        name: e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Employee',
                        role: e.userId?.role || e.position || 'employee',
                        image: e.userId?.avatar || e.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(e.name || 'User')}`,
                        department: e.department
                    }));
                    setAllEmployees(formattedEmps);
                }

                setLoading(false);

                // Fetch Notes
                fetchNotes();

            } catch (error) {
                console.error("Failed to load project details from server, checking local cache...", error);
                try {
                    const localProjects = JSON.parse(localStorage.getItem("hattech_local_projects") || "[]");
                    const found = localProjects.find(p => String(p._id || p.id) === String(id));
                    if (found) {
                        const teamMembers = (found.assignedPersons || []).map(p => {
                            const name = typeof p === 'string' ? p : (p.name || 'Member');
                            return {
                                id: p._id || p.id || name,
                                name: name,
                                role: 'Team Member',
                                image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
                            };
                        });

                        const normalizedProject = {
                            ...found,
                            name: found.title || found.name || found.project || "Partner Project",
                            client: found.partnerCompany || found.owner || "Partner Client",
                            start: found.createdAt ? new Date(found.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
                            deadline: found.deadline ? new Date(found.deadline).toLocaleDateString() : "Ongoing",
                            progress: (found.status || '').toLowerCase() === 'completed' ? 100 : (found.progress || 0),
                            status: found.status || 'active',
                            type: found.type || found.partnerCategory || 'Prototype',
                            platform: found.platform || 'Web',
                            stack: found.stack || '',
                            credentials: found.credentials || [],
                            assignedPersons: teamMembers,
                            milestones: []
                        };
                        setProject(normalizedProject);
                    }
                } catch (e) {
                    console.error("Local project fallback failed", e);
                }
                setLoading(false);
            }
        };

        const fetchNotes = async () => {
            try {
                setNotesLoading(true);
                const res = await api.get(`/notes/${id}`);
                if (res.data.success) {
                    setNotes(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch notes", err);
            } finally {
                setNotesLoading(false);
            }
        };

        loadData();
    }, [id]);

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        try {
            const res = await api.post(`/notes/${id}`, { content: newNote });
            if (res.data.success) {
                setNotes([res.data.data, ...notes]);
                setNewNote("");
                toast.success("Note added");
            }
        } catch (err) {
            toast.error("Failed to add note");
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Delete this point?")) return;
        try {
            const res = await api.delete(`/notes/delete/${noteId}`);
            if (res.data.success) {
                setNotes(notes.filter(n => n._id !== noteId));
                toast.success("Note deleted");
            }
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const handleAddMember = async (employee) => {
        if (!project) return;

        // Check if already in team (compare IDs)
        if (project.assignedPersons.some(p => p.id === employee.id)) return;

        try {
            // Construct new team list of IDs
            const newTeamIds = [...project.assignedPersons.map(p => p.id), employee.id];

            // API Call
            const res = await api.put(`/projects/${project._id}`, { team: newTeamIds });

            if (res.data.success) {
                // Update local state
                setProject(prev => ({
                    ...prev,
                    assignedPersons: [...prev.assignedPersons, {
                        id: employee.id,
                        name: employee.name,
                        role: employee.role,
                        image: employee.image
                    }]
                }));
                setShowAddMember(false);
                toast.success(`${employee.name} added to the team.`);
            }
        } catch (error) {
            console.error("Failed to add member", error);
            toast.error("Failed to add team member");
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task? This will permanently remove it from the employee's dashboard as well.")) return;
        try {
            const res = await api.delete(`/tasks/${taskId}`);
            if (res.data.success) {
                toast.success("Task deleted successfully");
                setProject(prev => {
                    const newTasks = prev.tasks.filter(t => t._id !== taskId);
                    return { ...prev, tasks: newTasks };
                });
            }
        } catch (err) {
            console.error("Failed to delete task", err);
            toast.error("Failed to delete task");
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!project) return (
        <div className="p-10 text-center space-y-4">
            <h2 className="text-xl text-[var(--text-primary)]">Project Not Found</h2>
            <button onClick={() => navigate(-1)} className="text-purple-600 hover:text-purple-700">Go Back</button>
        </div>
    );

    return (
        <div className="space-y-6 pt-14 md:pt-0 animate-in fade-in duration-500 relative">
            {/* HEADER */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition text-[var(--text-secondary)] shadow-sm"
                >
                    <FiArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                        {project.name || project.project}
                    </h1>
                    <p className="text-[var(--text-secondary)] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        {project.client || "Client Project"}
                    </p>
                </div>
                <div className="ml-auto">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold 
               ${project.status === 'Completed' || project.progress === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {project.status || (project.progress === 100 ? 'Completed' : 'In Progress')}
                    </span>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: STATS & DETAILS */}
                <div className="lg:col-span-2 space-y-6">

                    {/* OVERVIEW CARD */}
                    <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg relative overflow-hidden group">

                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-primary)]">
                            <FiLayers className="text-purple-500" /> Project Overview
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)]">
                                <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider mb-1">Start Date</p>
                                <p className="font-bold text-lg text-[var(--text-primary)]">{project.start || project.startDate || "2026-01-01"}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)]">
                                <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider mb-1">Deadline</p>
                                <p className="font-bold text-lg text-[var(--text-primary)]">{project.deadline || "Ongoing"}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)]">
                                <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider mb-1">Total Tasks</p>
                                <p className="font-bold text-lg text-[var(--text-primary)]">{project.tasks?.length || 0}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)]">
                                <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider mb-1">Completion</p>
                                <p className="font-bold text-lg text-purple-600">{project.progress || 0}%</p>
                            </div>
                        </div>

                        {/* Additional Meta Tags */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                Platform: {project.platform}
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Type: {project.type}
                            </div>
                            {project.stack && (
                                <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                    Stack: {project.stack}
                                </div>
                            )}
                            {project.type === 'SEO' && project.seoType && project.seoType !== 'N/A' && (
                                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    SEO: {project.seoType}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--text-secondary)]">Progress</span>
                                <span className="text-purple-600 font-bold">{project.progress || 0}%</span>
                            </div>
                            <div className="h-3 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                                    style={{ width: `${project.progress || 0}%` }}
                                />
                            </div>
                        </div>

                        {project.description && (
                            <div className="mt-8">
                                <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wide mb-2">Description</h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed text-lg">{project.description}</p>
                            </div>
                        )}
                    </div>

                    {/* TASKS LIST */}
                    <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                            <FiCheckCircle className="text-green-500" /> Recent Tasks
                        </h2>
                        <div className="space-y-3">
                            {project.tasks && project.tasks.length > 0 ? (
                                project.tasks.map((task, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-inner)] hover:bg-[var(--bg-secondary)] transition group border border-[var(--border-color)]">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2.5 h-2.5 rounded-full ${task.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                            <div>
                                                <p className="font-semibold text-[var(--text-primary)] group-hover:text-purple-600 transition">{task.title}</p>
                                                <p className="text-xs text-gray-400">
                                                    Assigned to: {(() => {
                                                        const userId = task.assignedTo?._id || task.assignedTo;
                                                        let name = project.nameMap?.[userId] || task.assignedTo?.name || task.assignedTo?.username || "Unassigned";
                                                        return typeof name === 'string' ? name.replace(/\s*User$/i, '').trim() : "Unassigned";
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {task.milestones && task.milestones.length > 0 && (
                                                <div className="hidden md:flex flex-col items-end gap-1">
                                                    <div className="flex gap-1">
                                                        {task.milestones.map((ms, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className={`w-2 h-2 rounded-full ${ms.status === 'completed' || ms.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'}`}
                                                                title={ms.title}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Milestones</span>
                                                </div>
                                            )}
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold 
                                                ${task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                                task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {task.status || "Pending"}
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteTask(task._id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition ml-2"
                                                title="Delete Task"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[var(--text-secondary)] text-center py-4">No tasks tracked for this project.</p>
                            )}
                        </div>
                    </div>

                    {/* MILESTONES SECTION */}
                    <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                            <FiLayers className="text-purple-500" /> Project Milestones
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {project.milestones && project.milestones.length > 0 ? (
                                project.milestones.map((ms, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] flex items-center justify-between group hover:border-purple-500/30 transition shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${ms.status === 'completed' || ms.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`}>
                                                <FiCheckCircle size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[var(--text-primary)] text-sm">{ms.title}</p>
                                                <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wider">{ms.taskTitle}</p>
                                                {ms.description && (
                                                    <p className="text-xs text-gray-500 mt-1 italic">{ms.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded
                                            ${ms.status === 'completed' || ms.status === 'Completed' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>
                                            {ms.status || "Pending"}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-8 text-center bg-[var(--bg-inner)] rounded-2xl border border-dashed border-[var(--border-color)]">
                                    <p className="text-[var(--text-secondary)] italic">No milestones defined for this project's tasks.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: TEAM & INFO */}
                <div className="space-y-6">

                    {/* TEAM CARD (GROUPED BY TEAM LEAD / DEPARTMENT) */}
                    <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                            <FiUser className="text-blue-500" /> Project Teams & Members
                        </h2>

                        {(() => {
                            const assigned = project.assignedPersons || [];
                            if (assigned.length === 0) {
                                return <p className="text-[var(--text-secondary)] italic">No team members assigned.</p>;
                            }

                            // Helper to match team lead & department from database employee record
                            const getTeamInfo = (person) => {
                                const pName = cleanName(person.name || person.username || '').toLowerCase();
                                const pRole = (person.role || '').toLowerCase();

                                // 1. Direct Team Lead match
                                if (pName.includes('farrukh')) return { lead: "Farrukh Saleem", title: "PHP Web Development Team" };
                                if (pName.includes('salman')) return { lead: "Muhammad Salman", title: "MERN Stack & Development Team" };
                                if (pName.includes('tehreem')) return { lead: "Tehreem Ijaz", title: "SEO & Digital Marketing Team" };
                                if (pName.includes('ali musa') || (pName.includes('ali') && pName.includes('musa'))) return { lead: "Ali Musa", title: "AI / ML Engineering Team" };

                                // SEO & Digital Marketing Team Members (Ameer Haider, Muneeb .)
                                if (pName.includes('ameer') || pName.includes('muneeb')) {
                                    return { lead: "Tehreem Ijaz", title: "SEO & Digital Marketing Team" };
                                }

                                // Web / MERN Development Team Members (Muhammad Huzaifa, Malaika Ramzan)
                                if (pName.includes('huzaifa') || pName.includes('malaika')) {
                                    return { lead: "Muhammad Salman", title: "MERN Stack & Web Development Team" };
                                }

                                // PHP Web Development Team Members (Umer Hannan, etc.)
                                if (pName.includes('umer')) {
                                    return { lead: "Farrukh Saleem", title: "PHP Web Development Team" };
                                }

                                // Find database employee record in allEmployees (from /api/employees)
                                const emp = (allEmployees || []).find(e => {
                                    const eId = e._id || e.id || e.userId?._id;
                                    if (eId && (eId.toString() === person.id?.toString() || eId.toString() === person._id?.toString())) return true;
                                    const eName = cleanName(e.name || e.username || '').toLowerCase();
                                    return eName && pName && (eName.includes(pName) || pName.includes(eName));
                                });

                                // 2. Check official MongoDB Hierarchy relationship (teamLead / projectHead / manager)
                                const rawLead = emp?.teamLead || emp?.projectHead || emp?.manager;
                                if (rawLead) {
                                    let lName = typeof rawLead === 'object' ? (rawLead.name || rawLead.username || rawLead.userId?.name) : rawLead;
                                    
                                    // If rawLead is an ID, find in allEmployees
                                    if (lName && /^[0-9a-fA-F]{24}$/.test(lName)) {
                                        const leadEmp = (allEmployees || []).find(e => {
                                            const id = e._id || e.id || e.userId?._id;
                                            return id && id.toString() === lName.toString();
                                        });
                                        if (leadEmp) lName = leadEmp.name || leadEmp.username;
                                    }

                                    if (lName && !/admin/i.test(lName)) {
                                        const cLName = cleanName(lName);
                                        const lowerL = cLName.toLowerCase();
                                        if (lowerL.includes('tehreem')) return { lead: "Tehreem Ijaz", title: "SEO & Digital Marketing Team" };
                                        if (lowerL.includes('salman')) return { lead: "Muhammad Salman", title: "MERN Stack & Development Team" };
                                        if (lowerL.includes('farrukh')) return { lead: "Farrukh Saleem", title: "PHP Web Development Team" };
                                        if (lowerL.includes('ali musa') || (lowerL.includes('ali') && lowerL.includes('musa'))) return { lead: "Ali Musa", title: "AI / ML Engineering Team" };
                                        return { lead: cLName, title: `${cLName}'s Team` };
                                    }
                                }

                                // 3. Official Department & Designation mapping from database
                                const dept = (emp?.department || person.department || '').toLowerCase();
                                const desig = (emp?.designation || person.role || '').toLowerCase();

                                // Web & MERN Developers (Muhammad Huzaifa, Malaika Ramzan) -> Muhammad Salman
                                if (dept.includes('mern') || dept.includes('web') || desig.includes('web') || desig.includes('mern') || desig.includes('react') || desig.includes('node') || pRole.includes('web') || pRole.includes('mern')) {
                                    return { lead: "Muhammad Salman", title: "MERN Stack & Web Development Team" };
                                }

                                // PHP Developers (Umer Hannan, etc.) -> Farrukh Saleem
                                if (dept.includes('php') || desig.includes('php') || desig.includes('laravel') || pRole.includes('php')) {
                                    return { lead: "Farrukh Saleem", title: "PHP Web Development Team" };
                                }

                                // SEO & Marketing -> Tehreem Ijaz
                                if (dept.includes('seo') || desig.includes('seo') || pRole.includes('seo') || dept.includes('content') || dept.includes('marketing')) {
                                    return { lead: "Tehreem Ijaz", title: "SEO & Digital Marketing Team" };
                                }

                                // AI / ML -> Ali Musa
                                if (dept.includes('ai') || dept.includes('ml') || desig.includes('ai') || desig.includes('python')) {
                                    return { lead: "Ali Musa", title: "AI / ML Engineering Team" };
                                }

                                // Default fallback to Muhammad Salman (Web Lead)
                                return { lead: "Muhammad Salman", title: "MERN Stack & Web Development Team" };
                            };

                            // Group members by team lead
                            const groups = {};
                            assigned.forEach(person => {
                                const info = getTeamInfo(person);
                                if (!groups[info.lead]) {
                                    groups[info.lead] = { title: info.title, lead: info.lead, members: [] };
                                }
                                groups[info.lead].members.push(person);
                            });

                            return Object.values(groups).map((group, gIdx) => (
                                <div key={gIdx} className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-3">
                                    {/* Team Header Card */}
                                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                                                <span>👑 {group.lead.includes('Members') ? 'TEAM / DEPARTMENT' : 'TEAM LEAD / PROJECT HEAD'}</span>
                                            </span>
                                            <h4 className="text-xs font-bold text-[var(--text-primary)]">{group.lead}</h4>
                                            <span className="text-[10px] text-[var(--text-secondary)] font-medium">{group.title}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                                            {group.members.length} Member{group.members.length > 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* Team Members List */}
                                    <div className="space-y-2">
                                        {group.members.map((person, i) => {
                                            const empRecord = (allEmployees || []).find(e => {
                                                const eId = e._id || e.id || e.userId?._id;
                                                if (eId && (eId === person.id || eId === person._id)) return true;
                                                const eName = (e.name || e.username || '').toLowerCase();
                                                const pName = (person.name || '').toLowerCase();
                                                return eName && pName && (eName.includes(pName) || pName.includes(eName));
                                            });

                                            const personPhoto = person.image || empRecord?.image || empRecord?.avatar || empRecord?.userId?.image || empRecord?.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=004AAD&color=fff&bold=true`;

                                            const personTasks = (project.tasks || []).filter(t => {
                                                const taskUserId = t.assignedTo?._id || t.assignedTo;
                                                return taskUserId === person.id || taskUserId === person._id;
                                            });

                                            return (
                                                <div key={i} className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={personPhoto}
                                                            alt={person.name}
                                                            className="w-8 h-8 rounded-full object-cover border border-purple-500/30"
                                                            onError={(e) => {
                                                                e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(person.name) + "&background=004AAD&color=fff&bold=true";
                                                            }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-xs text-[var(--text-primary)] truncate">{person.name}</p>
                                                            <p className="text-[10px] text-[var(--text-secondary)]">{empRecord?.designation || empRecord?.department || person.role || "Team Member"}</p>
                                                        </div>
                                                    </div>

                                                    {personTasks.length > 0 && (
                                                        <div className="mt-2 pt-1.5 border-t border-[var(--border-color)]/50">
                                                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">📋 Tasks:</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {personTasks.map((task, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold gap-1 ${
                                                                            task.status === 'Completed'
                                                                                ? 'bg-green-500/20 text-green-600'
                                                                                : task.status === 'In Progress'
                                                                                ? 'bg-blue-500/20 text-blue-600'
                                                                                : 'bg-yellow-500/20 text-yellow-600'
                                                                        }`}
                                                                        title={`${task.title} (${task.status})`}
                                                                    >
                                                                        {task.status === 'Completed' && '✓'}
                                                                        <span className="truncate max-w-[100px]">{task.title}</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>

                    {/* CREDENTIALS CARD */}
                    {project.credentials && project.credentials.length > 0 && (
                        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                                <FiLock className="text-red-500" /> Project Credentials
                            </h2>
                            <div className="space-y-4">
                                {project.credentials.map((cred, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2 relative group transition hover:border-[#004AAE]/30">
                                        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-2">
                                            <span className="text-xs font-black text-[#004AAE] uppercase tracking-wider">{cred.label || `Credential #${idx + 1}`}</span>
                                            {cred.link && (
                                                <a 
                                                    href={cred.link.startsWith('http') ? cred.link : `https://${cred.link}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-1 hover:bg-[#004AAE]/10 rounded text-[#004AAE] transition"
                                                    title="Open Link"
                                                >
                                                    <FiExternalLink size={14} />
                                                </a>
                                            )}
                                        </div>
                                        {cred.gmail && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[var(--text-secondary)] font-medium">Username/Email:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[var(--text-primary)] font-bold">{cred.gmail}</span>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(cred.gmail);
                                                            toast.success("Username copied!");
                                                        }}
                                                        className="p-1 hover:bg-gray-500/10 rounded text-[var(--text-secondary)]"
                                                        title="Copy Username"
                                                    >
                                                        <FiCopy size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {cred.password && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[var(--text-secondary)] font-medium">Password:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[var(--text-primary)] font-bold">
                                                        {visibleCreds[idx] ? cred.password : "••••••••"}
                                                    </span>
                                                    <button 
                                                        onClick={() => setVisibleCreds(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                                        className="p-1 hover:bg-gray-500/10 rounded text-[var(--text-secondary)] animate-in fade-in"
                                                        title={visibleCreds[idx] ? "Hide Password" : "Show Password"}
                                                    >
                                                        {visibleCreds[idx] ? <FiEyeOff size={12} /> : <FiEye size={12} />}
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(cred.password);
                                                            toast.success("Password copied!");
                                                        }}
                                                        className="p-1 hover:bg-gray-500/10 rounded text-[var(--text-secondary)]"
                                                        title="Copy Password"
                                                    >
                                                        <FiCopy size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* NOTES CARD (ADMIN VIEW) */}
                    <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                            <FiEdit className="text-yellow-500" /> Project Notes
                        </h2>
                        
                        <form onSubmit={handleAddNote} className="mb-6 relative">
                            <textarea 
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Add a project point..."
                                className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-yellow-500/50 resize-none h-24 mb-2"
                            />
                            <button 
                                type="submit"
                                disabled={!newNote.trim()}
                                className="w-full bg-yellow-500 text-black py-2 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-yellow-400 transition"
                            >
                                <FiPlus /> Add Point
                            </button>
                        </form>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {notes.map(note => (
                                <div key={note._id} className="p-3 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] relative group">
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={note.author?.avatar || `https://ui-avatars.com/api/?name=${note.author?.firstName}`} className="w-5 h-5 rounded-full" />
                                        <span className="text-[10px] font-bold text-[var(--text-primary)]">{note.author?.firstName} {note.author?.lastName}</span>
                                        <span className="text-[9px] text-[var(--text-secondary)] ml-auto flex items-center gap-1">
                                            <FiClock size={10} /> {new Date(note.createdAt).toLocaleDateString()}
                                        </span>
                                        <button onClick={() => handleDeleteNote(note._id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition pl-2">
                                            <FiTrash2 size={12} />
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-secondary)] whitespace-pre-wrap">{note.content}</p>
                                </div>
                            ))}
                            {notes.length === 0 && !notesLoading && <p className="text-center text-[10px] text-[var(--text-muted)] py-4 italic underline-offset-4 decoration-yellow-500/30">No collaborative notes yet.</p>}
                        </div>
                    </div>

                </div>
            </div>

            {/* ADD MEMBER MODAL */}
            <AnimatePresence>
                {showAddMember && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowAddMember(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-inner)] shrink-0">
                                <h3 className="font-bold text-lg text-[var(--text-primary)]">Add Team Member</h3>
                                <button
                                    onClick={() => setShowAddMember(false)}
                                    className="p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-red-500 transition"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
                                {allEmployees.map((emp) => (
                                    <div
                                        key={emp.id}
                                        onClick={() => handleAddMember(emp)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] cursor-pointer transition border border-transparent hover:border-purple-500/20 group"
                                    >
                                        <div className="relative">
                                            <img
                                                src={emp.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(emp.name) + "&background=random"}
                                                alt={emp.name}
                                                className="w-10 h-10 rounded-full object-cover shadow-sm"
                                            />
                                            {/* Online status indicator could go here */}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text-primary)] group-hover:text-purple-500 transition">{emp.name}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">{emp.department || "Employee"}</p>
                                        </div>
                                        <div className="ml-auto">
                                            {project.assignedPersons?.some(p => p.id === emp.id) ? (
                                                <span className="px-2 py-1 rounded text-[10px] bg-green-500/10 text-green-500 font-bold border border-green-500/20">Added</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded text-[10px] bg-purple-500/10 text-purple-500 font-bold border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition">+ Add</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {allEmployees.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-[var(--text-secondary)]">No employees found.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
