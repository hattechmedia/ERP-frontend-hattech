import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function AssignTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    employeeId: "",
    projectId: "",
    deadline: "",
  });

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem("employeeTasks")) || [];
    setTasks(storedTasks);

    const storedEmployees = JSON.parse(localStorage.getItem("employees")) || [];
    setEmployees(storedEmployees);

    // Load projects from localStorage or use default projects
    const storedProjects = JSON.parse(localStorage.getItem("projects")) || [];
    const defaultProjects = [
      { id: 1, name: "Admin ERP Panel" },
      { id: 2, name: "Website Redesign" },
      { id: 3, name: "Mobile App" },
      { id: 4, name: "E-commerce Platform" },
      { id: 5, name: "CRM System" }
    ];
    setProjects(storedProjects.length > 0 ? storedProjects : defaultProjects);
  }, []);

  const assignTask = () => {
    if (!newTask.title || !newTask.employeeId || !newTask.projectId) return;

    // Get project name from projectId
    const selectedProject = projects.find(p => p.id === parseInt(newTask.projectId));
    const projectName = selectedProject ? selectedProject.name : "Unknown Project";

    // Get employee name
    const selectedEmployee = employees.find(e => String(e.id) === String(newTask.employeeId));
    const employeeName = selectedEmployee ? selectedEmployee.name : "Unknown Employee";

    const task = {
      ...newTask,
      project: projectName, // Add project name
      assignedTo: employeeName, // Add assigned person name
      assignedPersons: [employeeName], // Add assigned persons array
      progress: 0, // Add progress
      id: Date.now(),
      status: "Pending",
      assignedDate: new Date().toLocaleDateString(),
    };

    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    localStorage.setItem("employeeTasks", JSON.stringify(updatedTasks));

    setNewTask({
      title: "",
      description: "",
      employeeId: "",
      projectId: "",
      deadline: "",
    });

    setSelectedEmployee(null);
    toast.success("Task assigned successfully!");
  };

  const updateTaskStatus = (id, status) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, status } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem("employeeTasks", JSON.stringify(updatedTasks));
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(selectedEmployee?.id === employee.id ? null : employee);
    setNewTask({
      ...newTask,
      employeeId: employee.id,
    });
  };

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <h1 className="text-2xl font-semibold">Assign Tasks</h1>

      {/* TASK ASSIGNMENT FORM */}
      <div className="p-4 md:p-6 rounded-xl bg-[var(--bg-card)] space-y-4">
        <h2 className="text-lg font-medium">Assign New Task</h2>

        <select
          className="w-full p-3 rounded-xl bg-transparent ring-1 ring-gray-700 focus:ring-2 focus:ring-purple-500 transition text-[var(--text-primary)] dark:bg-[#1a1433] dark:text-white"
          value={newTask.employeeId}
          onChange={(e) => setNewTask({ ...newTask, employeeId: e.target.value })}
        >
          <option value="" className="bg-[var(--bg-card)]">Select Employee</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id} className="bg-[var(--bg-card)]">{emp.name}</option>
          ))}
        </select>

        <input
          className="w-full p-3 rounded-xl bg-transparent ring-1 ring-gray-700 focus:ring-2 focus:ring-purple-500 transition text-[var(--text-primary)]"
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        />

        <textarea
          className="w-full p-3 rounded-xl bg-transparent ring-1 ring-gray-700 focus:ring-2 focus:ring-purple-500 transition text-[var(--text-primary)]"
          placeholder="Task Description"
          rows={3}
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
        />

        <select
          className="w-full p-3 rounded-xl bg-transparent ring-1 ring-gray-700 focus:ring-2 focus:ring-purple-500 transition text-[var(--text-primary)] dark:bg-[#1a1433] dark:text-white"
          value={newTask.projectId}
          onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
        >
          <option value="" className="bg-[var(--bg-card)]">Select Project</option>
          {projects
            .filter(project => !project.status || project.status === 'Active' || project.status === 'active')
            .map(project => (
              <option key={project.id} value={project.id} className="bg-[var(--bg-card)]">{project.name}</option>
            ))}
        </select>

        <input
          type="date"
          className="w-full p-3 rounded-xl bg-transparent ring-1 ring-gray-700 focus:ring-2 focus:ring-purple-500 transition text-[var(--text-primary)] [color-scheme:dark]"
          value={newTask.deadline}
          onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
        />

        <button
          onClick={assignTask}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white shadow-sm hover:bg-purple-700 transition-colors w-full md:w-auto"
        >
          Assign Task
        </button>
      </div>

      {/* TASK LIST */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Assigned Tasks</h2>
        {tasks.map(task => (
          <div key={task.id} className="p-4 rounded-xl bg-[var(--bg-card)]">
            <h3 className="font-medium">{task.title}</h3>
            <p className="text-sm text-gray-400">{task.description}</p>
            <p className="text-sm">Employee: {employees.find(e => e.id === task.employeeId)?.name}</p>
            <p className="text-sm">Project: {task.project || projects.find(p => p.id === task.projectId)?.name || "Unknown"}</p>
            <p className="text-sm">Deadline: {task.deadline}</p>
            <p className="text-sm">Status: {task.status}</p>
            <div className="mt-2 space-x-2">
              <button
                onClick={() => updateTaskStatus(task.id, "In Progress")}
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
              >
                In Progress
              </button>
              <button
                onClick={() => updateTaskStatus(task.id, "Completed")}
                className="px-3 py-1 rounded bg-green-600 text-white text-sm"
              >
                Completed
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}