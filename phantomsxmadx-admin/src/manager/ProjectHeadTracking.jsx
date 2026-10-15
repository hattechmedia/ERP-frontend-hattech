import { useState, useEffect } from "react";
import { FiCheckCircle, FiClock, FiUser, FiBarChart2 } from "react-icons/fi";
import api from "../services/api";

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

export default function ProjectHeadTracking() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get('/projects?t=' + Date.now()),
        api.get('/employees?t=' + Date.now()),
        api.get('/tasks?t=' + Date.now())
      ]);

      const projRes = results[0].status === 'fulfilled' ? results[0].value : { data: {} };
      const empRes = results[1].status === 'fulfilled' ? results[1].value : { data: {} };
      const taskRes = results[2].status === 'fulfilled' ? results[2].value : { data: {} };

      if (projRes.data?.success) {
        const projData = projRes.data.data || projRes.data.projects || [];
        setProjects(projData);
        if (projData.length > 0 && !selectedProject) {
          setSelectedProject(projData[0]._id);
        }
      }
      if (empRes.data?.success) setEmployees(empRes.data.data || empRes.data.employees || []);
      if (taskRes.data?.success) setTasks(taskRes.data.tasks || taskRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch tracking data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categories = ["All", ...new Set(projects.map(p => p.type || "General"))];
  const filteredProjects = projects.filter(p => categoryFilter === "All" || (p.type || "General") === categoryFilter);

  const currentProject = projects.find(p => p._id === selectedProject);
  const projectTasks = tasks.filter(t => t.project?._id === selectedProject || t.project === selectedProject);

  const getCompletionPercentage = () => {
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  if (loading && projects.length === 0) return <div className="p-8 text-center text-theme-secondary">Loading project data...</div>;

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <div>
        <h1 className="text-3xl font-bold text-theme-primary">Track Projects</h1>
        <p className="text-sm text-theme-secondary">Monitor project progress and team task completion</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium mb-2 text-theme-primary">Select Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setSelectedProject(null);
            }}
            className="w-full px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium mb-2 text-theme-primary">Select Project</label>
          <select
            value={selectedProject || ""}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a project --</option>
            {filteredProjects.map(p => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {currentProject ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={<FiBarChart2 />}
              title="Task Progress"
              value={`${getCompletionPercentage()}%`}
              color="blue"
            />
            <StatCard
              icon={<FiCheckCircle />}
              title="Tasks Done"
              value={projectTasks.filter(t => t.status === 'completed').length}
              color="green"
            />
            <StatCard
              icon={<FiUser />}
              title="Team Size"
              value={(currentProject.team || []).length}
              color="custom-blue"
            />
          </div>

          <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-lg mb-4 text-theme-primary">{currentProject.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-theme-secondary mb-1">Description</p>
                <p className="text-sm text-theme-primary">{currentProject.description || "No description"}</p>
              </div>
              <div>
                <p className="text-sm text-theme-secondary mb-1">Deadline</p>
                <p className="text-sm text-theme-primary flex items-center gap-2">
                  <FiClock /> {currentProject.deadline ? new Date(currentProject.deadline).toLocaleDateString() : "No deadline"}
                </p>
              </div>
              <div>
                <p className="text-sm text-theme-secondary mb-1">Priority</p>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${currentProject.priority === 'high' ? 'bg-red-100 text-red-600' :
                  currentProject.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-[#004AAE]'
                  }`}>
                  {currentProject.priority}
                </span>
              </div>
              <div>
                <p className="text-sm text-theme-secondary mb-1">Status</p>
                <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-blue-100 text-[#004AAE]">
                  {currentProject.status}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-lg mb-4 text-theme-primary">Team Members</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(currentProject.team || []).map(empId => {
                const empUser = typeof empId === 'object' ? empId : employees.find(e => e.userId?._id === empId || e.userId === empId || e._id === empId);
                return (
                  <div key={empUser?._id || Math.random()} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                    <img
                      src={empUser?.profileImage || empUser?.avatar || empUser?.userId?.avatar || "https://via.placeholder.com/40"}
                      alt={empUser?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-theme-primary text-sm">{cleanName(empUser?.name || empUser?.username || empUser?.userId?.name || empUser?.userId?.username)}</p>
                      <p className="text-[10px] text-theme-secondary">{empUser?.email || empUser?.userId?.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
            <h3 className="font-semibold text-lg mb-4 text-theme-primary">Project Tasks</h3>
            {projectTasks.length === 0 ? (
              <p className="text-theme-secondary">No tasks assigned for this project yet.</p>
            ) : (
              <div className="space-y-4">
                {projectTasks.map(task => {
                  const completedMS = (task.milestones || []).filter(m => m.status === 'completed').length;
                  const totalMS = (task.milestones || []).length;
                  const progress = totalMS > 0 ? (completedMS / totalMS) * 100 : 0;

                  return (
                    <div key={task._id} className="p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-theme-primary">{task.title}</h4>
                          <p className="text-[10px] text-theme-secondary">Assigned to: {cleanName(task.assignedTo?.name || task.assignedTo?.username)}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${task.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-[10px] mb-1 text-theme-secondary">
                          <span>Milestones: {completedMS}/{totalMS}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-10 text-center text-gray-400 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <FiBarChart2 size={48} className="mx-auto mb-4 opacity-20" />
          <p>No projects found. Please create or assign projects first.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  const colorStyles = {
    blue: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" },
    green: { bg: "bg-green-100", text: "text-green-600", border: "border-green-200" },
    "custom-blue": { bg: "bg-blue-100", text: "text-[#004AAE]", border: "border-blue-200" },
  };
  const style = colorStyles[color] || colorStyles.blue;
  return (
    <div className={`p-5 rounded-2xl border ${style.border} bg-[var(--bg-card)] shadow-sm hover:translate-y-[-2px] transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${style.text}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${style.bg} ${style.text} text-2xl`}>{icon}</div>
      </div>
    </div>
  );
}
