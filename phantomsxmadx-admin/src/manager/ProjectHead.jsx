import { useState, useEffect } from "react";
import { FiFolder, FiCheckCircle, FiUsers } from "react-icons/fi";

export default function ProjectHead() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("projects");

  useEffect(() => {
    const storedProjects = JSON.parse(localStorage.getItem("projects")) || [];
    const storedTasks = JSON.parse(localStorage.getItem("employeeTasks")) || [];

    if (storedProjects.length === 0) {
      const defaultProjects = [
        { id: 1, name: "Admin ERP Panel", status: "In Progress", progress: 65 },
        { id: 2, name: "Website Redesign", status: "Completed", progress: 100 },
        { id: 3, name: "Mobile App", status: "In Progress", progress: 30 }
      ];
      setProjects(defaultProjects);
    } else {
      setProjects(storedProjects);
    }

    setTasks(storedTasks);
  }, []);

  const activeProjects = projects.filter(p => p.status !== "Completed").length;
  const completedProjects = projects.filter(p => p.status === "Completed").length;
  const taskCount = tasks.length;

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-green-500/20 text-green-500">
            <FiFolder size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-theme-primary transition-colors">Project Head</h1>
            <p className="text-sm text-theme-secondary transition-colors">Manage projects, assign tasks, track progress</p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DeptCard
          icon={<FiFolder className="text-green-500" />}
          title="Active Projects"
          value={activeProjects}
          color="green"
        />
        <DeptCard
          icon={<FiCheckCircle className="text-blue-500" />}
          title="Completed"
          value={completedProjects}
          color="blue"
        />
        <DeptCard
          icon={<FiUsers className="text-purple-500" />}
          title="Tasks"
          value={taskCount}
          color="purple"
        />
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-[var(--border-color)]">
        <Tab active={activeTab === "projects"} onClick={() => setActiveTab("projects")}>
          All Projects
        </Tab>
        <Tab active={activeTab === "tasks"} onClick={() => setActiveTab("tasks")}>
          Assigned Tasks
        </Tab>
        <Tab active={activeTab === "progress"} onClick={() => setActiveTab("progress")}>
          Progress Tracking
        </Tab>
      </div>

      {/* CONTENT */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          {projects.length > 0 ? (
            projects.map((project) => (
              <div
                key={project.id}
                className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg text-theme-primary">{project.name}</h3>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${project.status === "Completed"
                      ? "bg-green-500/20 text-green-600"
                      : "bg-blue-500/20 text-blue-600"
                    }`}>
                    {project.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-theme-secondary mb-1">
                    <span>Progress</span>
                    <span className="font-medium text-theme-primary">{project.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={<FiFolder />} message="No projects yet" />
          )}
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-4">
          {tasks.length > 0 ? (
            tasks.map((task, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-theme-primary">{task.title}</p>
                    <p className="text-sm text-theme-secondary">{task.project}</p>
                    <p className="text-xs text-theme-muted mt-1">Assigned to: {task.assignedTo}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${task.status === "Completed"
                      ? "bg-green-500/20 text-green-600"
                      : task.status === "In Progress"
                        ? "bg-blue-500/20 text-blue-600"
                        : "bg-gray-500/20 text-gray-600"
                    }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={<FiUsers />} message="No tasks assigned yet" />
          )}
        </div>
      )}

      {activeTab === "progress" && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h3 className="font-semibold mb-4 text-theme-primary">Project Progress Overview</h3>
            {projects.map((project) => (
              <div key={project.id} className="mb-6 last:mb-0">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-sm text-theme-primary">{project.name}</p>
                  <p className="text-sm font-bold text-purple-500">{project.progress || 0}%</p>
                </div>
                <div className="h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DeptCard({ icon, title, value, color }) {
  const colorMap = {
    green: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' }
  };

  return (
    <div className={`p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-theme-secondary opacity-75 uppercase tracking-wide">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${colorMap[color].text}`}>{value}</p>
        </div>
        <div className={`text-3xl ${colorMap[color].text} opacity-80`}>{icon}</div>
      </div>
    </div>
  );
}

function Tab({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition border-b-2 ${active
          ? 'text-theme-primary border-purple-500'
          : 'text-theme-secondary border-transparent hover:text-theme-primary'
        }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="p-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
      <div className="text-4xl text-gray-400 mb-3 mx-auto">{icon}</div>
      <p className="text-theme-muted">{message}</p>
    </div>
  );
}
