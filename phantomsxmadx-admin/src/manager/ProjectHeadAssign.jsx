import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiTrash2, FiCalendar, FiFlag, FiStar, FiMessageSquare, FiX } from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";

const cleanName = (name) => {
  if (!name || typeof name !== 'string') return name || "Employee";
  let base = name.split('@')[0];
  if (base.includes(' ')) {
    return base.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }
  let cleaned = base.replace(/\d+/g, '').replace(/\s*User$/i, '').trim();
  if (!cleaned || cleaned.length < 3) {
    if (cleaned) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    return "Employee";
  }
  return cleaned.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function ProjectHeadAssign() {
  const { confirm } = useModal();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    projectId: "",
    teamMemberIds: [],
    deadline: "",
  });


  const fetchData = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const results = await Promise.allSettled([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/employees')
      ]);

      const taskRes = results[0].status === 'fulfilled' ? results[0].value : { data: {} };
      const projRes = results[1].status === 'fulfilled' ? results[1].value : { data: {} };
      const empRes = results[2].status === 'fulfilled' ? results[2].value : { data: {} };

      if (taskRes.data?.success) {
        const filteredTasks = taskRes.data.tasks.filter(t => 
          String(t.assignedBy?._id || t.assignedBy) === String(currentUser.id || currentUser._id)
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTasks(filteredTasks);
      }
      if (projRes.data?.success) setProjects(projRes.data.data);
      if (empRes.data?.success) {
        const activeEmps = (empRes.data.data || []).filter(e => e.status !== 'inactive');
        setEmployees(activeEmps);
      }

    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // If navigated from Dashboard with a preselected project, open the modal
  useEffect(() => {
    const preSelectedProjectId = location.state?.projectId;
    if (preSelectedProjectId && !loading) {
      setNewTask(prev => ({ ...prev, projectId: preSelectedProjectId }));
      setShowForm(true);
      // Clear state so refresh doesn't re-open modal
      window.history.replaceState({}, document.title);
    }
  }, [loading, location.state]);

  const handleAssignTask = async () => {
    if (!newTask.title || newTask.teamMemberIds.length === 0 || !newTask.deadline) {
      toast.error("Please fill all required fields (Title, Deadline, and select at least one Team Member)");
      return;
    }

    try {
      const promises = newTask.teamMemberIds.map(empId => {
        const emp = employees.find(e => e._id === empId);
        const assigneeId = emp?.userId?._id || emp?.userId || empId;

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
      setShowForm(false);
      setNewTask({ title: "", description: "", projectId: "", teamMemberIds: [], deadline: "" });
      fetchData();

    } catch (error) {
      console.error("Failed to assign tasks", error);
      toast.error("Failed to assign tasks. Please try again.");
    }
  };

  const handleDeleteTask = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Task',
      cancelText: 'Cancel'
    });
    if (!isConfirmed) return;
    try {
      const res = await api.delete(`/tasks/${id}`);
      if (res.data.success) {
        setTasks(tasks.filter(t => t._id !== id));
        toast.success("Task deleted successfully");
      }
    } catch (error) {
      console.error("Failed to delete task", error);
      toast.error("Failed to delete task");
    }
  };

  /* ================= REVIEW LOGIC ================= */
  const [reviewTask, setReviewTask] = useState(null);
  const [taskReviewModal, setTaskReviewModal] = useState({ show: false, task: null, review: "", rating: 5 });

  const handleTaskReview = async () => {
    if (!taskReviewModal.review) {
      toast.error("Please write a review");
      return;
    }
    try {
      const res = await api.post(`/team/tasks/${taskReviewModal.task._id}/review`, {
        review: taskReviewModal.review,
        rating: taskReviewModal.rating,
      });
      if (res.data.success) {
        toast.success("Review submitted!");
        setTasks(tasks.map(t => t._id === taskReviewModal.task._id ? { ...t, review: taskReviewModal.review, reviewRating: taskReviewModal.rating } : t));
        setTaskReviewModal({ show: false, task: null, review: "", rating: 5 });
      }
    } catch (err) {
      toast.error("Failed to submit review");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-theme-secondary">Loading...</div>;
  }

  return (
    <div className="space-y-6 pt-14 md:pt-0 relative">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-theme-primary transition-colors">Assign Tasks</h1>
          <p className="text-sm text-theme-secondary transition-colors">Assign new tasks to team members</p>
        </div>
        <div className="flex gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-lg bg-[#004AAE] !text-white hover:bg-[#003882] flex items-center gap-2 font-medium shadow-md shadow-blue-600/20"
              style={{ color: 'white' }}
            >
              <FiPlus /> New Task
            </button>
        </div>
      </div>

      {/* CREATE TASK FORM */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--bg-card)] rounded-xl p-6 w-full max-w-lg border border-theme shadow-2xl relative overflow-y-auto max-h-[90vh]"
            >
              <h3 className="font-bold text-2xl mb-6 text-theme-primary">Assign New Task</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Task Title *</label>
                  <input
                    type="text"
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-theme text-theme-primary focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Description *</label>
                  <textarea
                    placeholder="Task instructions..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-theme text-theme-primary focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-secondary">
                      Project <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <select
                      value={newTask.projectId}
                      onChange={(e) => {
                        setNewTask({ ...newTask, projectId: e.target.value });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-theme text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition font-bold"
                    >
                      <option value="">— No Project —</option>
                      {projects
                        .filter(p => p.status === 'active' || !p.status)
                        .map(p => (
                          <option key={p._id} value={p._id}>{p.title || p.name}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Team Members *</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 rounded-lg bg-[var(--bg-main)] border border-theme">
                    {employees
                      .map(e => (
                        <label key={e._id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition">
                          <input
                            type="checkbox"
                            checked={newTask.teamMemberIds.includes(e._id)}
                            onChange={(ev) => {
                              const ids = [...newTask.teamMemberIds];
                              if (ev.target.checked) {
                                ids.push(e._id);
                              } else {
                                const index = ids.indexOf(e._id);
                                if (index > -1) ids.splice(index, 1);
                              }
                              setNewTask({ ...newTask, teamMemberIds: ids });
                            }}
                            className="w-4 h-4 rounded border-theme text-[#004AAE] focus:ring-[#004AAE]"
                          />
                          <span className="text-xs text-theme-primary truncate">{cleanName(e.name || e.username || e.userId?.name || e.userId?.username)}</span>
                        </label>
                      ))}
                  </div>
                  <p className="text-[10px] text-theme-muted mt-1 italic">Select team members assigned to this task.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Deadline *</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-theme text-theme-primary focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition"
                  style={{ color: 'white' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTask}
                  className="px-4 py-2 rounded-lg bg-[#004AAE] !text-white hover:bg-[#003882] transition font-medium shadow-md shadow-blue-600/20"
                  style={{ color: 'white' }}
                >
                  Assign Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TASKS LIST */}
      <div className="grid grid-cols-1 gap-4">
        {tasks.length === 0 ? (
          <div className="text-center p-8 text-theme-muted bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
            No tasks assigned yet. Click "New Task" to get started.
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task._id}
              className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-md transition group"
            >
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-lg text-theme-primary">{task.title}</h4>
                    <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-600 capitalize">
                      {task.status}
                    </span>
                  </div>
                  <p className="text-sm text-theme-secondary mb-3">{task.description}</p>

                  {/* VIEW MILESTONES BUTTON */}
                  {task.milestones && task.milestones.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setReviewTask(task)}
                        className="text-xs px-3 py-1.5 rounded bg-blue-500/10 text-blue-600 font-bold flex items-center gap-1 hover:bg-blue-500 hover:text-white transition shadow-sm border border-blue-500/20"
                        title="Click to view details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        View Milestones
                      </button>
                    </div>
                  )}

                  {/* Completion Note */}
                  {task.completionNote && (
                    <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg my-2 text-xs italic text-theme-secondary flex items-start gap-2">
                      <FiMessageSquare className="mt-0.5 text-blue-400 flex-shrink-0" />
                      <div>
                        <strong>Employee Note:</strong> "{task.completionNote}"
                      </div>
                    </div>
                  )}

                  {/* Review Detail */}
                  {task.review ? (
                    <div className="bg-purple-500/5 border border-purple-500/20 p-3 rounded-lg my-2 text-xs text-theme-secondary flex items-start gap-2">
                      <FiStar className="mt-0.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                      <div>
                        <strong>Review:</strong> "{task.review}" ({task.reviewRating}/5 stars)
                      </div>
                    </div>
                  ) : task.status === 'completed' ? (
                    <button
                      onClick={() => setTaskReviewModal({ show: true, task, review: "", rating: 5 })}
                      className="mt-2 text-xs px-3 py-1.5 rounded bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white transition font-bold"
                    >
                      + Write Review
                    </button>
                  ) : null}

                  <div className="flex items-center justify-between text-xs text-theme-muted border-t border-[var(--border-color)] pt-3">
                    <span className="flex items-center gap-1">
                      <FiCalendar /> {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold px-2 py-1 rounded bg-[var(--bg-main)] text-theme-primary mt-1">
                        Assigned: {cleanName(task.assignedTo?.name || task.assignedTo?.username)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition"
                    title="Delete Task"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MILESTONE DETAILS MODAL */}
      <AnimatePresence>
        {reviewTask && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-theme-card rounded-xl w-full max-w-2xl border border-theme shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
            >
              <div className="p-4 bg-theme-secondary-bg border-b border-theme flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-theme-primary">
                    <span className="p-1 bg-[#004AAE]/20 text-[#004AAE] rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    Milestone Details
                  </h3>
                </div>
                <button onClick={() => setReviewTask(null)} className="text-theme-secondary hover:text-theme-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="bg-blue-500/10 p-3 rounded border border-blue-500/30 text-sm mb-4 text-theme-primary">
                  <strong>Employee:</strong> {cleanName(reviewTask.assignedTo?.name || reviewTask.assignedTo?.username)}
                </div>

                <h4 className="font-semibold text-lg border-b border-theme pb-2 mb-4 text-theme-primary">Milestones Breakdown</h4>

                {reviewTask.milestones.map((ms, idx) => (
                  <div key={idx} className="bg-[var(--bg-main)] p-4 rounded-lg border border-theme relative">
                    <span className="absolute top-4 right-4 text-xs font-mono bg-gray-700 text-white px-2 py-1 rounded">Target: {ms.deadline ? new Date(ms.deadline).toLocaleDateString() : 'N/A'}</span>
                    <h5 className="font-bold text-base text-[#004AAE] mb-1">#{idx + 1} {ms.title}</h5>
                    <p className="text-sm text-theme-secondary leading-relaxed bg-[var(--bg-card)] p-2 rounded mt-2">
                      {ms.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${ms.status === 'completed' ? 'bg-[#004AAE] !text-white' : 'bg-gray-600 text-gray-400'}`}>
                        {ms.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-theme flex justify-end">
                <button onClick={() => setReviewTask(null)} className="px-6 py-2 bg-[#004AAE] text-white rounded hover:bg-[#003882] transition shadow-sm shadow-blue-500/20">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* TASK REVIEW MODAL */}
      <AnimatePresence>
        {taskReviewModal.show && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--bg-card)] rounded-xl w-full max-w-md border border-purple-500/30 shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2"><FiStar /> Review Task</h3>
                <button onClick={() => setTaskReviewModal({ show: false, task: null, review: "", rating: 5 })} className="text-theme-secondary hover:text-theme-primary"><FiX size={18}/></button>
              </div>

              <div className="bg-[var(--bg-main)] p-3 rounded-lg border border-theme">
                <p className="text-[10px] text-gray-500 uppercase font-black mb-0.5">Task</p>
                <p className="text-sm font-bold text-theme-primary">{taskReviewModal.task?.title}</p>
                <p className="text-[11px] text-theme-secondary mt-0.5">
                  Assigned To: {cleanName(taskReviewModal.task?.assignedTo?.name || taskReviewModal.task?.assignedTo?.username)}
                </p>
              </div>

              {/* Employee note if exists */}
              {taskReviewModal.task?.completionNote && (
                <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg">
                  <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Employee Note</p>
                  <p className="text-xs text-theme-secondary italic">"{taskReviewModal.task.completionNote}"</p>
                </div>
              )}

              {/* Star rating */}
              <div>
                <label className="text-[10px] font-black uppercase text-theme-secondary block mb-2">Rating</label>
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
                <label className="text-[10px] font-black uppercase text-theme-secondary block mb-2">Feedback *</label>
                <textarea rows={4}
                  className="w-full p-3 rounded-lg bg-[var(--bg-main)] border border-theme text-sm text-theme-primary resize-none outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Write your feedback on how this task was completed..."
                  value={taskReviewModal.review}
                  onChange={e => setTaskReviewModal({ ...taskReviewModal, review: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setTaskReviewModal({ show: false, task: null, review: "", rating: 5 })} className="flex-1 py-2.5 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition">Cancel</button>
                <button onClick={handleTaskReview} className="flex-[2] py-2.5 bg-purple-600 text-white rounded-lg font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all">Submit Review</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
