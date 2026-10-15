import { useEffect, useState } from "react";
import { FiCheckCircle, FiTrash2, FiClock, FiArchive, FiX, FiPlus, FiMessageSquare } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const ensureAbsoluteUrl = (url) => {
  if (!url) return "#";
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url;
  }
  return `https://${url}`;
};

// Fix timezone date display: parse YYYY-MM-DD as local time, not UTC midnight
const formatDateLocal = (dateStr) => {
  if (!dateStr) return 'N/A';
  // If it's a plain YYYY-MM-DD string, parse as local to avoid off-by-one day
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString();
  }
  // Otherwise it's a full ISO timestamp — convert to local date
  return new Date(dateStr).toLocaleDateString();
};

import toast from "react-hot-toast";

export default function MyTasks() {
   const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [milestoneInputs, setMilestoneInputs] = useState({});
  const [deleteModal, setDeleteModal] = useState({ show: false, taskId: null, milestoneId: null, isInput: false, inputIdx: null });
  const [messageModal, setMessageModal] = useState({ show: false, type: 'success', title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, taskId: null, milestoneId: null, title: '' });
  const [credentialsModal, setCredentialsModal] = useState({
    show: false,
    projectId: null,
    credentials: [{ link: '', gmail: '', password: '', label: 'Primary' }]
  });
  const [generalCredentials, setGeneralCredentials] = useState([]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const res = await api.get(`/tasks?assignedTo=${currentUser.id}`);
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneralCredentials = async () => {
    try {
      const res = await api.get('/projects/general-links/view');
      if (res.data.success && res.data.data) {
        setGeneralCredentials(res.data.data.credentials || []);
      }
    } catch (err) {
      console.error("Failed to fetch general credentials", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchGeneralCredentials();
  }, []);

  /* ================= HANDLERS ================= */

  const handleMilestoneInputChange = (taskId, idx, field, value) => {
    setMilestoneInputs(prev => ({
      ...prev,
      [`${taskId}-${idx}-${field}`]: value
    }));
  };

  const handleAddMoreMilestones = async (task) => {
    try {
      const newAllowed = (task.allowedMilestones || 3) + 1;
      const res = await api.put(`/tasks/${task._id}`, { allowedMilestones: newAllowed });
      if (res.data.success) {
        toast.success("Additional milestone slot added!");
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to add milestone slot", err);
      toast.error("Failed to add milestone slot");
    }
  };

  const saveMilestones = async (taskId) => {
    const taskIndex = tasks.findIndex(t => t._id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const allowed = task.allowedMilestones || 3;
    const currentCount = task.milestones ? task.milestones.length : 0;
    const remaining = allowed - currentCount;

    const newMilestones = [];
    for (let i = 0; i < remaining; i++) {
      const inputKeyIndex = currentCount + i;
      const title = milestoneInputs[`${taskId}-${inputKeyIndex}-title`];
      const desc = milestoneInputs[`${taskId}-${inputKeyIndex}-desc`];
      const date = milestoneInputs[`${taskId}-${inputKeyIndex}-date`];

      if (title && title.trim() && desc && desc.trim() && date) {
        newMilestones.push({
          title: title,
          description: desc,
          deadline: date,
          status: 'pending'
        });
      }
    }

    if (newMilestones.length === 0) {
      toast.error("Please fill in at least one new milestone to save.");
      return;
    }

    try {
      const updatedMilestones = [...(task.milestones || []), ...newMilestones];
      const res = await api.put(`/tasks/${taskId}`, {
        milestones: updatedMilestones,
        milestonesSubmittedAt: new Date(),
        status: 'in-progress'
      });

      if (res.data.success) {
        toast.success('Milestones saved successfully!');
        fetchTasks();
        // Clear inputs
        setMilestoneInputs(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(k => {
            if (k.startsWith(`${taskId}-`)) delete next[k];
          });
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to save milestones", err);
      toast.error("Failed to save milestones");
    }
  };

  const toggleMilestone = async (taskId, milestoneId) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const ms = task.milestones.find(m => m._id === milestoneId);
    if (!ms) return;

    if (ms.status !== 'completed') {
      setConfirmModal({
        show: true,
        taskId,
        milestoneId,
        title: ms.title
      });
    } else {
      // Logic to unmark as complete if allowed, but usually marks are one-way for verification
      executeToggleMilestone(taskId, milestoneId);
    }
  };

  const executeToggleMilestone = async (taskId, milestoneId) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const updatedMilestones = task.milestones.map(ms => {
      if (ms._id === milestoneId) {
        const isCompleting = ms.status !== 'completed';
        return {
          ...ms,
          status: isCompleting ? 'completed' : 'pending',
          completedAt: isCompleting ? new Date() : null
        };
      }
      return ms;
    });

    try {
      const res = await api.put(`/tasks/${taskId}`, { milestones: updatedMilestones });
      if (res.data.success) {
        fetchTasks();
        setConfirmModal({ show: false, taskId: null, milestoneId: null, title: '' });
      }
    } catch (err) {
      console.error("Failed to toggle milestone", err);
      toast.error("Failed to toggle milestone");
    }
  };

  const reactivateTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to reactivate this task?")) return;
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: 'in-progress' });
      if (res.data.success) {
        toast.success("Task reactivated successfully!");
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to reactivate task", err);
      toast.error("Failed to reactivate task");
    }
  };

  const confirmDeleteMilestone = async () => {
    const { taskId, milestoneId, isInput, inputIdx } = deleteModal;

    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    try {
      if (isInput) {
        // Decrease allowedMilestones for this task
        const newAllowed = Math.max((task.milestones?.length || 0), (task.allowedMilestones || 3) - 1);
        const res = await api.put(`/tasks/${taskId}`, { allowedMilestones: newAllowed });
        if (res.data.success) {
          // Also clear any text in that specific slot
          setMilestoneInputs(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => {
              if (k.startsWith(`${taskId}-${inputIdx}-`)) delete next[k];
            });
            return next;
          });
          fetchTasks();
          setDeleteModal({ show: false, taskId: null, milestoneId: null, isInput: false, inputIdx: null });
          toast.success('Milestone slot removed.');
        }
        return;
      }

      const updatedMilestones = task.milestones.filter(m => String(m._id) !== String(milestoneId));
      const res = await api.put(`/tasks/${taskId}`, { milestones: updatedMilestones });
      if (res.data.success) {
        fetchTasks();
        setDeleteModal({ show: false, taskId: null, milestoneId: null, isInput: false, inputIdx: null });
        toast.success('Milestone deleted successfully.');
      }
    } catch (err) {
      console.error("Failed to process deletion", err);
      toast.error("Failed to process deletion");
    }
  };

  const handleSaveCredentials = async () => {
    try {
      const { projectId, credentials } = credentialsModal;

      // Validation: each entry must have at least a link or email
      const validCredentials = credentials.filter(c => c.link || c.gmail);
      if (validCredentials.length === 0) return toast.error("Please enter at least one project link or email.");

      let res;
      if (!projectId || projectId === "general") {
        res = await api.put('/projects/general-links/save', {
          credentials: validCredentials
        });
      } else {
        res = await api.put(`/projects/${projectId}`, {
          credentials: validCredentials
        });
      }

      if (res.data.success) {
        toast.success('Credentials saved successfully!');
        setCredentialsModal({ show: false, projectId: null, credentials: [{ link: '', gmail: '', password: '', label: 'Primary' }] });
        fetchTasks();
        fetchGeneralCredentials();
      }
    } catch (err) {
      console.error("Failed to save credentials", err);
      const errorMessage = err.response?.data?.message || "Failed to save credentials";
      toast.error(errorMessage);
    }
  };
  const addCredentialRow = () => {
    setCredentialsModal(prev => ({
      ...prev,
      credentials: [...prev.credentials, { link: '', gmail: '', password: '', label: '', owner: 'Client' }]
    }));
  };

  const removeCredentialRow = (index) => {
    setCredentialsModal(prev => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== index)
    }));
  };

  const updateCredentialValue = (index, field, value) => {
    setCredentialsModal(prev => {
      const updated = [...prev.credentials];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, credentials: updated };
    });
  };

  const [completionNoteModal, setCompletionNoteModal] = useState({ show: false, taskId: null, note: '' });

  const handleSaveCompletionNote = async () => {
    try {
      const res = await api.put(`/tasks/${completionNoteModal.taskId}`, { completionNote: completionNoteModal.note });
      if (res.data.success) {
        toast.success('Note saved!');
        setTasks(prev => prev.map(t => t._id === completionNoteModal.taskId ? { ...t, completionNote: completionNoteModal.note } : t));
        setCompletionNoteModal({ show: false, taskId: null, note: '' });
      }
    } catch {
      toast.error('Failed to save note');
    }
  };

  if (loading) return <LoadingSpinner />;

  const activeTasks = tasks.filter(t => (t.status || '').toLowerCase() !== "completed");
  const completedTasks = tasks.filter(t => (t.status || '').toLowerCase() === "completed");
  const needsMilestone = activeTasks.some(t => !t.milestones || t.milestones.length < (t.allowedMilestones || 3));

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-4 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-bold text-theme-primary">My Tasks</h1>
        <button
          onClick={() => setCredentialsModal({
            show: true,
            projectId: "",
            credentials: generalCredentials.length > 0
              ? generalCredentials
              : [{ link: '', gmail: '', password: '', label: '' }]
          })}
          className="px-4 py-2 bg-[#004AAE] text-white rounded-xl text-sm font-bold hover:bg-[#003882] transition shadow-md flex items-center gap-2"
        >
          <FiPlus /> Add Project Link
        </button>
      </div>

      {needsMilestone && (
        <div className="bg-[#004AAE]/10 !text-[#004AAE] p-6 rounded-2xl flex items-center gap-4 animate-in fade-in duration-700 shadow-sm transition-all duration-300">
          <div className="p-3 bg-[#004AAE] rounded-2xl text-white shadow-lg shadow-[#004AAE]/30">
            <FiCheckCircle size={20} />
          </div>
          <div>
            <h3 className="font-bold">Action Required</h3>
            <p className="text-sm">Please define and save milestones for your assigned tasks.</p>
          </div>
        </div>
      )}

      {/* GENERAL LINKS SECTION */}
      {generalCredentials.length > 0 && (
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-lg text-theme-primary">General Links (No Project)</h2>
              <p className="text-xs text-theme-secondary">Credentials and quick links saved without a specific project mapping.</p>
            </div>
            <button
              onClick={() => setCredentialsModal({
                show: true,
                projectId: "",
                credentials: generalCredentials
              })}
              className="text-xs text-[#004AAE] dark:text-blue-400 font-bold hover:underline"
            >
              Edit General Links
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {generalCredentials.map((cred, idx) => (
              <div key={idx} className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex flex-col gap-1 relative group">
                <div className="flex justify-between items-center gap-2 mb-1">
                  {cred.label && <span className="text-[9px] font-black text-green-600 uppercase tracking-wider truncate flex-1">{cred.label}</span>}
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                    cred.owner === 'Our Company' 
                      ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' 
                      : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                  }`}>
                    {cred.owner === 'Our Company' ? 'Internal' : 'Client'}
                  </span>
                </div>
                <div className="text-[10px] text-theme-secondary truncate">
                  <span className="font-bold text-theme-primary block">Link:</span>
                  <a href={ensureAbsoluteUrl(cred.link)} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{cred.link || "N/A"}</a>
                </div>
                {cred.gmail && (
                  <div className="text-[10px] text-theme-secondary truncate">
                    <span className="font-bold text-theme-primary">User:</span> {cred.gmail}
                  </div>
                )}
                {cred.password && (
                  <div className="text-[10px] text-theme-secondary truncate">
                    <span className="font-bold text-theme-primary">Pass:</span> {cred.password}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE TASKS LIST */}
      <div className="space-y-4">
        {activeTasks.length === 0 && <p className="text-gray-400 text-sm">No active tasks found.</p>}

        {activeTasks.map((task) => {
          const allowed = task.allowedMilestones || 3;
          const currentCount = task.milestones ? task.milestones.length : 0;
          const remaining = allowed - currentCount;

          return (
            <div key={task._id} className="p-6 rounded-2xl bg-[var(--bg-card)] shadow-sm hover:shadow-md transition-all">
              <div className="mb-4">
                <h3 className="font-bold text-xl text-theme-primary">{task.title}</h3>
                <p className="text-sm text-theme-secondary">{task.project?.title || "No Project"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-[#004AAE]">Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}</span>
                </div>
                {task.description && (
                  <p className="text-xs text-theme-secondary mt-3 bg-[var(--bg-main)]/50 p-4 rounded-xl border border-white/5 leading-relaxed whitespace-pre-wrap">
                    <span className="font-bold text-theme-primary block mb-1 text-[10px] uppercase tracking-wider">Task Description:</span>
                    {task.description}
                  </p>
                )}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mt-3">
                  {task.project?._id && (
                    <button
                      onClick={() => setCredentialsModal({
                        show: true,
                        projectId: task.project._id,
                        credentials: (task.project.credentials && task.project.credentials.length > 0)
                          ? task.project.credentials
                          : [{ link: '', gmail: '', password: '', label: '' }]
                      })}
                      className="px-4 py-1.5 bg-[#004AAE]/10 text-[#004AAE] rounded-lg text-[10px] font-bold hover:bg-[#004AAE] hover:text-white transition flex items-center gap-2"
                    >
                      <FiPlus /> {task.project.credentials?.length > 0 ? "Edit Links" : "Add Link"}
                    </button>
                  )}
                  {task.project?.credentials?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {task.project.credentials.map((cred, idx) => (
                        <div key={idx} className="bg-green-500/10 border border-green-500/20 rounded px-2 py-1 flex flex-col gap-0.5 max-w-[200px]">
                          {cred.label && <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">{cred.label}</span>}
                          <div className="flex items-center gap-2 text-[10px] text-theme-secondary truncate">
                            <span className="font-bold text-theme-primary">Link:</span>
                            <a href={ensureAbsoluteUrl(cred.link)} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{cred.link || "N/A"}</a>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-theme-secondary truncate">
                            <span className="font-bold text-theme-primary">Email:</span> {cred.gmail || "N/A"}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-theme-secondary truncate">
                            <span className="font-bold text-theme-primary">Pass:</span> {cred.password || "N/A"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* MILESTONES CONTAINER */}
              <div className="mb-4 bg-[var(--bg-main)] p-4 rounded-xl shadow-inner border-none">
                <h4 className="text-sm font-bold text-theme-secondary mb-4 flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Project Milestones ({currentCount} / {allowed})
                </h4>

                {/* 1. COMPLETED/SAVED MILESTONES */}
                <div className="space-y-3 mb-6">
                  {task.milestones?.map((ms) => (
                    <div key={ms._id} className="p-3 bg-[var(--bg-card)] rounded-xl flex flex-col gap-3 group/ms transition-all hover:ring-1 hover:ring-[#004AAE]/20 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded-md border-gray-300 text-[#004AAE] focus:ring-[#004AAE] cursor-pointer"
                            checked={ms.status === 'completed'}
                            onChange={() => toggleMilestone(task._id, ms._id)}
                          />
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter text-center">Tick if<br />completed</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold break-words ${ms.status === 'completed' ? 'line-through text-gray-400' : 'text-theme-primary'}`}>{ms.title}</p>
                          <p className="text-xs text-theme-muted break-words">{ms.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-8 sm:ml-0 flex-shrink-0">
                        <span className="text-[10px] bg-[#004AAE]/10 text-[#004AAE] font-black px-2 py-1 rounded uppercase tracking-wider whitespace-nowrap">
                          {ms.deadline ? formatDateLocal(ms.deadline) : 'N/A'}
                        </span>
                        <button
                          onClick={() => setDeleteModal({ show: true, taskId: task._id, milestoneId: ms._id, isInput: false })}
                          className="flex items-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all text-xs font-bold whitespace-nowrap"
                          title="Delete Milestone"
                        >
                          <FiTrash2 size={12} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. NEW INPUTS (If slots remaining) */}
                {remaining > 0 && (
                  <div className="space-y-3 pt-3">
                    <p className="text-xs !text-[#004AAE] font-bold">Add New Milestones ({remaining} slots left)</p>
                    {Array.from({ length: remaining }).map((_, idx) => {
                      const inputKeyIndex = currentCount + idx;
                      return (
                        <div key={idx} className="p-4 bg-[var(--bg-main)]/80 rounded-2xl space-y-4 transition-all relative border-none">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-bold text-theme-secondary">Milestone {inputKeyIndex + 1}</p>
                            <button
                              onClick={() => setDeleteModal({ show: true, taskId: task._id, milestoneId: null, isInput: true, inputIdx: inputKeyIndex })}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder={`Enter Milestone Title...`}
                            value={milestoneInputs[`${task._id}-${inputKeyIndex}-title`] || ""}
                            onChange={(e) => handleMilestoneInputChange(task._id, inputKeyIndex, 'title', e.target.value)}
                            className="w-full bg-[var(--bg-card)] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#004AAE]/50 outline-none shadow-sm"
                          />
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="date"
                              placeholder="Select Date"
                              value={milestoneInputs[`${task._id}-${inputKeyIndex}-date`] || ""}
                              onChange={(e) => handleMilestoneInputChange(task._id, inputKeyIndex, 'date', e.target.value)}
                              className="w-full sm:w-[200px] flex-shrink-0 bg-[var(--bg-card)] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#004AAE]/50 outline-none shadow-sm font-bold"
                            />
                            <input
                              type="text"
                              placeholder="Describe this milestone..."
                              value={milestoneInputs[`${task._id}-${inputKeyIndex}-desc`] || ""}
                              onChange={(e) => handleMilestoneInputChange(task._id, inputKeyIndex, 'desc', e.target.value)}
                              className="w-full flex-grow bg-[var(--bg-card)] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#004AAE]/50 outline-none shadow-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. ACTION BUTTONS (SIDE BY SIDE) */}
                <div className="mt-4 flex flex-col md:flex-row gap-2">
                    <button
                      onClick={() => handleAddMoreMilestones(task)}
                      className="flex-1 py-2 rounded border-2 border-[#004AAE] bg-[#004AAE]/5 !text-[#004AAE] hover:bg-[#004AAE] hover:!text-white transition text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <span>+ Want More Milestones?</span>
                    </button>

                  {remaining > 0 && (
                    <button
                      onClick={() => saveMilestones(task._id)}
                      className="flex-1 py-2 bg-[#004AAE] hover:bg-[#003882] !text-white rounded font-bold text-sm transition shadow-lg shadow-[#004AAE]/20"
                    >
                      Save Milestones
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPLETED TASKS SECTION */}
      {completedTasks.length > 0 && (
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-2 border-b border-theme pb-2">
            <FiArchive className="text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-400">Completed Tasks</h2>
          </div>
          <div className="space-y-4 opacity-70">
            {completedTasks.map((task) => (
              <div key={task._id} className="p-6 rounded-2xl bg-[var(--bg-card)] border border-green-500/20 shadow-sm relative overflow-hidden group">
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <button
                    onClick={() => reactivateTask(task._id)}
                    className="text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white px-3 py-1 rounded-full uppercase transition-all shadow-sm"
                  >
                    Reactivate
                  </button>
                  <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded-full uppercase">Finished</span>
                </div>
                <h3 className="font-bold text-lg text-theme-primary flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" />
                  {task.title}
                </h3>
                <p className="text-sm text-theme-secondary">{task.project?.title || "No Project"}</p>
                {task.description && (
                  <p className="text-xs text-theme-secondary mt-2 bg-[var(--bg-main)]/20 p-3 rounded-xl border border-white/5 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}

                {/* Milestones for completed tasks */}
                {task.milestones && task.milestones.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-theme-muted mb-2">Milestones Archive</p>
                    {task.milestones.map((ms) => (
                      <div key={ms._id} className="flex items-center gap-3 p-2 rounded-lg bg-theme-tertiary/30">
                        <FiCheckCircle className="text-green-500 flex-shrink-0" size={14} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-theme-primary truncate">{ms.title}</p>
                          <p className="text-[10px] text-theme-muted truncate">{ms.description}</p>
                        </div>
                        <span className="text-[9px] font-bold text-theme-muted whitespace-nowrap">
                          {ms.completedAt ? new Date(ms.completedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {!task.milestones || task.milestones.length === 0 && (
                  <div className="mt-3 text-xs text-theme-muted italic">
                    No individual milestones tracked for this task.
                  </div>
                )}

                {/* Completion Note */}
                <div className="mt-4 border-t border-white/5 pt-3">
                  {task.completionNote ? (
                    <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-1.5 mb-1">
                        <FiMessageSquare size={10}/> Your Note
                      </p>
                      <p className="text-xs text-gray-300 italic leading-relaxed">{task.completionNote}</p>
                      <button
                        onClick={() => setCompletionNoteModal({ show: true, taskId: task._id, note: task.completionNote || '' })}
                        className="mt-2 text-[9px] text-blue-400 font-bold hover:underline"
                      >
                        Edit Note
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCompletionNoteModal({ show: true, taskId: task._id, note: '' })}
                      className="flex items-center gap-2 text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl hover:bg-blue-500/20 transition uppercase tracking-wide"
                    >
                      <FiMessageSquare size={11}/> Add Completion Note
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REQUEST MODAL REMOVED - AUTO-ADD ENABLED */}

      {/* COMPLETION NOTE MODAL */}
      <AnimatePresence>
        {completionNoteModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) setCompletionNoteModal({ show: false, taskId: null, note: '' }); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-md border border-blue-500/30 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-blue-400 flex items-center gap-2"><FiMessageSquare /> Completion Note</h3>
                <button onClick={() => setCompletionNoteModal({ show: false, taskId: null, note: '' })} className="p-2 rounded-xl hover:bg-white/10 text-gray-400"><FiX size={16}/></button>
              </div>
              <p className="text-xs text-gray-500">Add a note about how you completed this task. This note will be visible to your team lead and admin for review.</p>
              <textarea
                rows={5}
                className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-blue-500/20 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Describe what you did, any links, screenshots info, etc..."
                value={completionNoteModal.note}
                onChange={e => setCompletionNoteModal({ ...completionNoteModal, note: e.target.value })}
              />
              <div className="flex gap-3">
                <button onClick={() => setCompletionNoteModal({ show: false, taskId: null, note: '' })} className="flex-1 py-3 text-gray-400 font-bold rounded-xl hover:bg-white/5 transition">Cancel</button>
                <button onClick={handleSaveCompletionNote} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all">Save Note</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MESSAGE MODAL */}
      <AnimatePresence>
        {messageModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setMessageModal({ ...messageModal, show: false })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`p-8 rounded-2xl w-full max-w-sm shadow-2xl border relative text-center ${messageModal.type === 'error' ? 'bg-red-950/90 border-red-500/50' : 'bg-green-950/90 border-green-500/50'}`}
            >
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${messageModal.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                {messageModal.type === 'error' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <FiCheckCircle size={32} />
                )}
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${messageModal.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{messageModal.title}</h3>
              <p className="text-white text-sm mb-8">{messageModal.message}</p>
              <button
                onClick={() => setMessageModal({ ...messageModal, show: false })}
                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition transform hover:scale-[1.02] ${messageModal.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                Okay, Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM MODAL */}
      <AnimatePresence>
        {confirmModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setConfirmModal({ show: false, taskId: null, milestoneId: null, title: '' })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-card)] border border-[#004AAE]/30 p-8 rounded-2xl w-full max-w-sm shadow-2xl bg-gradient-to-b from-[var(--bg-card)] to-[#004AAE]/5"
            >
              <div className="w-12 h-12 rounded-full bg-[#004AAE]/20 flex items-center justify-center mb-4 text-[#004AAE]">
                <FiCheckCircle size={24} />
              </div>
              <h3 className="font-bold text-xl mb-2 text-theme-primary">Mark as Complete?</h3>
              <p className="text-theme-secondary text-sm mb-8">
                Are you sure you want to mark "<span className="text-theme-primary font-semibold">{confirmModal.title}</span>" as complete?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ show: false, taskId: null, milestoneId: null, title: '' })}
                  className="flex-1 py-3 rounded-xl border border-gray-600 hover:bg-gray-700/50 transition text-sm font-semibold text-theme-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeToggleMilestone(confirmModal.taskId, confirmModal.milestoneId)}
                  className="flex-1 py-3 rounded-xl bg-[#004AAE] text-white font-bold text-sm shadow-lg hover:bg-[#003882] transition hover:scale-[1.02]"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREDENTIALS MODAL */}
      <AnimatePresence>
        {credentialsModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setCredentialsModal({ ...credentialsModal, show: false })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-2xl w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setCredentialsModal({ ...credentialsModal, show: false })}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
              <h3 className="text-xl font-bold mb-1 text-theme-primary">Project Links</h3>
              <p className="text-theme-secondary text-xs mb-6">Enter project links and login details for administration.</p>

              <div className="mb-6">
                <label className="text-[10px] font-bold text-theme-secondary mb-1 block uppercase tracking-wider">Target Project (Optional)</label>
                <select
                  value={credentialsModal.projectId || ""}
                  onChange={(e) => {
                    const selectedProjId = e.target.value;
                    if (!selectedProjId || selectedProjId === "general") {
                      setCredentialsModal({
                        ...credentialsModal,
                        projectId: selectedProjId,
                        credentials: generalCredentials.length > 0
                          ? generalCredentials
                          : [{ link: '', gmail: '', password: '', label: '' }]
                      });
                    } else {
                      const proj = tasks.find(t => t.project?._id === selectedProjId)?.project;
                      setCredentialsModal({
                        ...credentialsModal,
                        projectId: selectedProjId,
                        credentials: (proj?.credentials && proj.credentials.length > 0)
                          ? proj.credentials
                          : [{ link: '', gmail: '', password: '', label: '' }]
                      });
                    }
                  }}
                  className="w-full bg-[var(--bg-card)] border border-theme rounded-lg px-3 py-2 text-theme-primary focus:ring-2 focus:ring-[#004AAE] outline-none text-sm font-bold"
                >
                  <option value="">General Links (No Project)</option>
                  {(() => {
                    const uniqueProjects = [];
                    const projectIds = new Set();
                    tasks.forEach(t => {
                      if (t.project && !projectIds.has(t.project._id)) {
                        projectIds.add(t.project._id);
                        uniqueProjects.push(t.project);
                      }
                    });
                    return uniqueProjects.map(p => (
                      <option key={p._id} value={p._id}>{p.title || p.name}</option>
                    ));
                  })()}
                </select>
              </div>

              <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {credentialsModal.credentials.map((cred, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-theme bg-theme-tertiary/20 space-y-3 relative">
                    <button
                      onClick={() => removeCredentialRow(idx)}
                      className="absolute top-2 right-2 text-red-500 hover:bg-red-500/10 p-1 rounded-lg transition"
                      title="Remove row"
                    >
                      <FiTrash2 size={16} />
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-theme-secondary mb-1 block uppercase tracking-wider">Title / Label (e.g. Admin Panel, Client Site)</label>
                        <input
                          type="text"
                          placeholder="e.g. Frontend Link, Dashboard, etc."
                          value={cred.label}
                          onChange={(e) => updateCredentialValue(idx, 'label', e.target.value)}
                          className="w-full bg-[var(--bg-main)] border border-theme rounded-lg px-3 py-2 text-theme-primary focus:ring-2 focus:ring-[#004AAE] outline-none text-xs"
                        />
                      </div>
                      {(!credentialsModal.projectId || credentialsModal.projectId === "general") && (
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-theme-secondary mb-1 block uppercase tracking-wider">Project Category / Owner</label>
                          <select
                            value={cred.owner || "Client"}
                            onChange={(e) => updateCredentialValue(idx, 'owner', e.target.value)}
                            className="w-full bg-[var(--bg-main)] border border-theme rounded-lg px-3 py-2 text-theme-primary focus:ring-2 focus:ring-[#004AAE] outline-none text-xs font-bold"
                          >
                            <option value="Client">Client Project</option>
                            <option value="Our Company">Internal Project</option>
                          </select>
                        </div>
                      )}
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-theme-secondary mb-1 block uppercase tracking-wider">Project URL *</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={cred.link}
                          onChange={(e) => updateCredentialValue(idx, 'link', e.target.value)}
                          className="w-full bg-[var(--bg-main)] border border-theme rounded-lg px-3 py-2 text-theme-primary focus:ring-2 focus:ring-[#004AAE] outline-none text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-theme-secondary mb-1 block uppercase tracking-wider">Gmail/User</label>
                        <input
                          type="text"
                          placeholder="email@gmail.com"
                          value={cred.gmail}
                          onChange={(e) => updateCredentialValue(idx, 'gmail', e.target.value)}
                          className="w-full bg-[var(--bg-main)] border border-theme rounded-lg px-3 py-2 text-theme-primary focus:ring-2 focus:ring-[#004AAE] outline-none text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-theme-secondary mb-1 block uppercase tracking-wider">Password</label>
                        <input
                          type="text"
                          placeholder="password"
                          value={cred.password}
                          onChange={(e) => updateCredentialValue(idx, 'password', e.target.value)}
                          className="w-full bg-[var(--bg-main)] border border-theme rounded-lg px-3 py-2 text-theme-primary focus:ring-2 focus:ring-[#004AAE] outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addCredentialRow}
                className="mt-4 w-full py-2 flex items-center justify-center gap-2 border-2 border-dashed border-[#004AAE]/30 text-[#004AAE] rounded-xl text-xs font-bold hover:bg-[#004AAE]/5 transition"
              >
                <FiPlus /> Add Another Credential Set
              </button>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setCredentialsModal({ ...credentialsModal, show: false })}
                  className="flex-1 py-3 rounded-xl border border-gray-600 hover:bg-gray-700/50 transition text-sm font-semibold text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCredentials}
                  className="flex-1 py-3 rounded-xl bg-[#004AAE] text-white font-bold text-sm shadow-lg hover:bg-[#003882] transition hover:scale-[1.02]"
                >
                  Save All Credentials
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDeleteModal({ show: false, taskId: null, milestoneId: null, isInput: false, inputIdx: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-card)] border border-red-500/30 p-8 rounded-2xl w-full max-w-sm shadow-2xl bg-gradient-to-b from-[var(--bg-card)] to-red-500/5"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 text-red-500">
                <FiTrash2 size={24} />
              </div>
              <h3 className="font-bold text-xl mb-2 text-theme-primary">Delete Milestone</h3>
              <p className="text-theme-secondary text-sm mb-8">
                Are you sure? This action cannot be undone and will permanently remove this milestone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ show: false, taskId: null, milestoneId: null, isInput: false, inputIdx: null })}
                  className="flex-1 py-3 rounded-xl border border-gray-600 hover:bg-gray-700/50 transition text-sm font-semibold text-theme-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMilestone}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm shadow-lg hover:bg-red-700 transition hover:scale-[1.02]"
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
