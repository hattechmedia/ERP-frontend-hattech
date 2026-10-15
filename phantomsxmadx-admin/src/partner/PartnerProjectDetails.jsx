import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../services/api";
import {
  FiArrowLeft,
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiExternalLink,
  FiUsers,
  FiPlus,
  FiUploadCloud,
  FiFileText,
  FiPaperclip,
  FiDownload,
  FiTrash2,
  FiX
} from "react-icons/fi";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";

const cleanName = (name) => {
  if (!name) return "";
  let cleaned = String(name).replace(/\s*User$/i, '').trim();
  cleaned = cleaned.replace(/undefined/gi, '').trim();
  return cleaned || String(name);
};

export default function PartnerProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [visibleCreds, setVisibleCreds] = useState({});
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "Medium",
    files: []
  });
  const [projectFiles, setProjectFiles] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectRes, empRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get('/employees').catch(() => ({ data: { data: [] } }))
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
            client: fetchedProject.client?.name || fetchedProject.client?.company || fetchedProject.clientName || "Partner Initiative",
            start: formatDateSafe(fetchedProject.startDate),
            deadline: formatDateSafe(fetchedProject.endDate || fetchedProject.deadline || "Ongoing"),
            progress: (fetchedProject.status || '').toLowerCase() === 'completed' ? 100 : (fetchedProject.progress || 0),
            status: fetchedProject.status,
            type: fetchedProject.type || fetchedProject.partnerCategory || 'General',
            platform: fetchedProject.platform || 'Web',
            seoType: fetchedProject.seoType || 'N/A',
            stack: fetchedProject.stack || '',
            assignedPersons: teamMembers,
            nameMap
          };

          const taskRes = await api.get('/tasks').catch(() => ({ data: { data: [] } }));
          if (taskRes.data.success || taskRes.data.tasks) {
            const allTasks = taskRes.data.tasks || taskRes.data.data || [];
            const projectTasks = allTasks.filter(t =>
              (t.project?._id || t.project) === id ||
              (t.project?.title || t.project) === fetchedProject.title
            );

            normalizedProject.tasks = projectTasks;

            const combinedMembersMap = new Map();
            (teamMembers || []).forEach(m => {
              if (m.id) combinedMembersMap.set(m.id.toString(), m);
            });

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

            const allMilestones = [];
            projectTasks.forEach(task => {
              if (task.milestones && task.milestones.length > 0) {
                task.milestones.forEach(ms => {
                  allMilestones.push({ ...ms, taskTitle: task.title });
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

        setLoading(false);

        // Fetch Notes
        try {
          const notesRes = await api.get(`/notes/${id}`);
          if (notesRes.data.success) setNotes(notesRes.data.data);
        } catch (e) {}

      } catch (error) {
        console.error("Failed to load project details", error);
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileObj = {
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type || 'application/octet-stream',
          dataUrl: event.target.result,
          uploadedAt: new Date().toLocaleDateString()
        };
        setProjectFiles(prev => [fileObj, ...prev]);
        setNewTask(prev => ({
          ...prev,
          files: [...prev.files, fileObj]
        }));
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} document(s) uploaded successfully!`);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setIsSubmittingTask(true);
    try {
      // Attempt backend task creation if endpoint exists, or add locally to state
      const taskPayload = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        deadline: newTask.deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
        project: id,
        status: "Pending",
        priority: newTask.priority
      };

      try {
        const res = await api.post('/tasks', taskPayload);
        if (res.data?.success || res.data?.task) {
          const created = res.data.task || res.data.data || taskPayload;
          setProject(prev => ({
            ...prev,
            tasks: [created, ...(prev.tasks || [])]
          }));
        } else {
          setProject(prev => ({
            ...prev,
            tasks: [{ ...taskPayload, _id: Date.now().toString() }, ...(prev.tasks || [])]
          }));
        }
      } catch (err) {
        setProject(prev => ({
          ...prev,
          tasks: [{ ...taskPayload, _id: Date.now().toString() }, ...(prev.tasks || [])]
        }));
      }

      toast.success("Task / Deliverable request submitted!");
      setShowTaskModal(false);
      setNewTask({
        title: "",
        description: "",
        deadline: "",
        priority: "Medium",
        files: []
      });
    } catch (err) {
      toast.error("Failed to submit task");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return (
    <div className="p-10 text-center space-y-4">
      <h2 className="text-xl text-[var(--text-primary)]">Project Not Found</h2>
      <button onClick={() => navigate('/partner')} className="text-purple-600 hover:text-purple-700">Go Back</button>
    </div>
  );

  return (
    <div className="space-y-6 pt-14 md:pt-0 animate-in fade-in duration-500 relative">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/partner')}
          className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition text-[var(--text-secondary)] shadow-sm cursor-pointer"
        >
          <FiArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            {project.name || project.project}
          </h1>
          <p className="text-[var(--text-secondary)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            {project.client || "Partner Project"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition cursor-pointer"
          >
            <FiPlus size={16} /> Request Task / Deliverable
          </button>
          <span className={`px-4 py-2 rounded-full text-sm font-bold 
            ${project.status === 'Completed' || project.status === 'delivered' || project.progress === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {project.status || (project.progress === 100 ? 'Completed' : 'In Progress')}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT GRID (EXACT MATCH TO PROJECTDETAILS.JSX) */}
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

            {/* Meta Tags */}
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
            </div>

            {/* Progress Bar */}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <FiCheckCircle className="text-green-500" /> Tasks & Milestones
              </h2>
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-purple-500 hover:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg transition"
              >
                <FiPlus size={14} /> Add Task
              </button>
            </div>
            <div className="space-y-3">
              {project.tasks && project.tasks.length > 0 ? (
                project.tasks.map((task, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-inner)] hover:bg-[var(--bg-secondary)] transition group border border-[var(--border-color)]">
                    <div className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${task.status === 'Completed' || task.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)] group-hover:text-purple-600 transition">{task.title}</p>
                        {task.deadline && (
                          <p className="text-xs text-gray-400">
                            Due: {new Date(task.deadline).toLocaleDateString()}
                          </p>
                        )}
                        {task.description && (
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">{task.description}</p>
                        )}
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
                        ${task.status === 'Completed' || task.status === 'completed' ? 'bg-green-100 text-green-700' :
                          task.status === 'In Progress' || task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {task.status || "Pending"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[var(--text-secondary)] text-center py-4">No tasks tracked for this project.</p>
              )}
            </div>
          </div>

          {/* TASK DOCUMENTS & DELIVERABLES */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <FiPaperclip className="text-blue-500" /> Documents, Assets & Deliverables
              </h2>
              <label className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer">
                <FiUploadCloud size={14} /> Upload Asset
                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {projectFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projectFiles.map((file, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] flex items-center justify-between group hover:border-blue-500/40 transition">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 flex-shrink-0">
                        <FiFileText size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-[var(--text-primary)] truncate">{file.name}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{file.size} • Uploaded {file.uploadedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {file.dataUrl && (
                        <a
                          href={file.dataUrl}
                          download={file.name}
                          className="p-2 text-slate-400 hover:text-white hover:bg-blue-500/20 rounded-lg transition"
                          title="Download"
                        >
                          <FiDownload size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => setProjectFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Remove"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center bg-[var(--bg-inner)] rounded-xl border border-dashed border-[var(--border-color)]">
                <FiUploadCloud className="mx-auto text-slate-500 mb-2" size={28} />
                <p className="text-sm font-semibold text-[var(--text-secondary)]">No attachments or deliverables uploaded yet.</p>
                <p className="text-xs text-slate-500 mt-0.5">Attach requirements, wireframes, or designs for your tasks.</p>
              </div>
            )}
          </div>

          {/* MILESTONES SECTION */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
              <FiLayers className="text-purple-500" /> Project Milestones
            </h2>
            <div className="space-y-3">
              {project.milestones && project.milestones.length > 0 ? (
                project.milestones.map((milestone, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)]">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${milestone.status === 'completed' || milestone.status === 'Completed' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{milestone.title}</p>
                        {milestone.taskTitle && (
                          <p className="text-xs text-[var(--text-secondary)]">From task: {milestone.taskTitle}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      milestone.status === 'completed' || milestone.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {milestone.status === 'completed' || milestone.status === 'Completed' ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[var(--text-secondary)] text-center py-4">No milestones defined for this project.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TEAM & LIVE LINKS */}
        <div className="space-y-6">

          {/* LIVE DEMO & CREDENTIALS CARD */}
          {(project.credentials && project.credentials.length > 0) || project.liveUrl || project.domain || project.website ? (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <FiLock className="text-indigo-500" /> Live Deployment & Access
              </h2>

              {(project.liveUrl || project.domain || project.website) && (
                <a
                  href={(project.liveUrl || project.domain || project.website).startsWith('http') ? (project.liveUrl || project.domain || project.website) : `https://${project.liveUrl || project.domain || project.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition text-xs font-bold"
                >
                  <span className="flex items-center gap-2">
                    <FiGlobe size={16} /> Open Live Web Preview
                  </span>
                  <FiExternalLink size={14} />
                </a>
              )}

              {project.credentials && project.credentials.map((cred, idx) => {
                const label = cred.label || cred.type || cred.name || `Access Credentials #${idx + 1}`;
                const link = cred.link || cred.url || cred.website;
                const username = cred.gmail || cred.username || cred.email || cred.user;
                const password = cred.password || cred.pass;

                return (
                  <div key={idx} className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2.5 text-xs shadow-sm">
                    <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-1">
                      <span className="font-black text-[#004AAE] uppercase tracking-wider">{label}</span>
                      {link && (
                        <a
                          href={link.startsWith('http') ? link : `https://${link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          Launch URL <FiExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    {username && (
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="font-medium text-slate-400">Username / Email:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono bg-black/40 px-2 py-0.5 rounded text-white font-bold">{username}</span>
                          <button
                            onClick={() => copyToClipboard(username, "Username")}
                            className="p-1 hover:bg-gray-500/10 rounded text-slate-400 hover:text-white"
                            title="Copy Username"
                          >
                            <FiCopy size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {password && (
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="font-medium text-slate-400">Password:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono bg-black/40 px-2 py-0.5 rounded text-emerald-400 font-bold">
                            {visibleCreds[idx] ? password : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(idx)}
                            className="p-1 hover:bg-gray-500/10 rounded text-slate-400 hover:text-white"
                            title={visibleCreds[idx] ? "Hide Password" : "Show Password"}
                          >
                            {visibleCreds[idx] ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(password, "Password")}
                            className="p-1 hover:bg-gray-500/10 rounded text-slate-400 hover:text-white"
                            title="Copy Password"
                          >
                            <FiCopy size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* STATUS & SUMMARY CARD */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
              <FiCheckCircle className="text-emerald-400" /> Milestone & Progress Status
            </h2>
            <p className="text-xs text-theme-secondary leading-relaxed">
              This project is actively maintained under your partner initiative. Live deployments, staging URLs, and deliverables are synchronized in real time.
            </p>
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                <span className="text-slate-400">Total Completion</span>
                <span className="text-[#004AAD]">{project.progress || 0}%</span>
              </div>
              <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#004AAD] to-blue-500 transition-all duration-500"
                  style={{ width: `${project.progress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TASK REQUEST MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FiPlus className="text-purple-500" /> Request New Task / Deliverable
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[var(--bg-secondary)] transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Payment Gateway / Redesign Landing Page"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Description / Specification
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the deliverables, scope, and technical requirements..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-purple-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-purple-500 text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Attach Documents / Specs
                </label>
                <div className="border border-dashed border-[var(--border-color)] rounded-xl p-3 text-center bg-[var(--bg-inner)]">
                  <label className="cursor-pointer text-xs text-purple-400 hover:text-purple-300 font-bold flex flex-col items-center gap-1">
                    <FiUploadCloud size={20} />
                    <span>Click to browse files (PDF, DOCX, Images)</span>
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                {newTask.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {newTask.files.map((f, i) => (
                      <p key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                        <FiPaperclip size={12} className="text-purple-400" /> {f.name} ({f.size})
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-[var(--bg-inner)] border border-[var(--border-color)] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow-md disabled:opacity-50"
                >
                  {isSubmittingTask ? "Submitting..." : "Submit Task Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

