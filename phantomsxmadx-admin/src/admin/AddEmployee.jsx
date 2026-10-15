import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";

const categories = [
  "Web Developer",
  "Graphic Designer",
  "QA Engineer",
  "YouTube Automation",
  "AI ML",
  "Manager",
  "Intern"
];

const subcategories = {
  "Web Developer": ["MERN Stack", "PHP LARAVEL DEVELOPER", "Web Designer"],
  "Graphic Designer": ["UI/UX", "Illustrator", "Animator"],
  "QA Engineer": ["Manual", "Automation"],
  "YouTube Automation": ["Channel Management", "Script Writing", "Video Optimization", "Thumbnail Design"],
  "AI ML": ["Data Scientist", "Machine Learning Engineer", "AI Researcher", "NLP Specialist"],
  "Manager": ["HR", "Project Head", "General Manager"],
  "Intern": ["Web Developer", "App Developer", "QA Engineer", "YouTube Automation", "AI ML", "Graphic Designer", "Video Editor", "SEO Specialist", "Digital Marketing", "SMM Specialist", "Content Writer", "Management"]
};

export default function AddEmployee() {
  const [employee, setEmployee] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    role: "",
    subcategory: "",
    projectHead: "",
  });

  const [projectHeads, setProjectHeads] = useState([]);

  useEffect(() => {
    const fetchProjectHeads = async () => {
      try {
        const res = await api.get('/auth/project-heads');
        if (res.data.success) {
          setProjectHeads(res.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch project heads", error);
      }
    };
    fetchProjectHeads();
  }, []);

  const addEmployee = async () => {
    if (!employee.name || !employee.email || !employee.password || !employee.role) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const nameParts = employee.name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "User";

      // Determine backend role
      let backendRole = "employee";
      if (employee.role === "Manager") {
        if (employee.subcategory === "HR") backendRole = "hr";
        else if (employee.subcategory === "Project Head") backendRole = "projecthead";
        else backendRole = "manager";
      } else if (employee.role === "Intern") {
        backendRole = "intern";
      }

      const payload = {
        firstName,
        lastName,
        email: employee.email,
        password: employee.password,
        phone: employee.phone || "000-000-0000",
        department: employee.department || "General",
        position: employee.role,
        subcategory: employee.subcategory,
        projectHead: employee.projectHead || null,
        role: backendRole,
        username: employee.email.split('@')[0] + Math.floor(Math.random() * 1000),
        joinDate: new Date().toISOString()
      };

      const res = await api.post('/employees', payload);

      if (res.data.success) {
        toast.success("Employee added successfully!");
        setEmployee({
          name: "",
          email: "",
          password: "",
          phone: "",
          department: "",
          role: "",
          subcategory: "",
          projectHead: "",
        });
      }
    } catch (error) {
      console.error("Failed to add employee", error);
      toast.error(error.response?.data?.message || "Failed to add employee");
    }
  };

  return (
    <div className="space-y-6 pt-14 md:pt-0 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-primary">Add New Employee</h1>

      <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Full Name</label>
            <input
              className="w-full p-3 rounded-xl bg-[var(--bg-inner)] ring-1 ring-[var(--border-secondary)] focus:ring-2 focus:ring-[#004AAD] transition text-[var(--text-primary)] outline-none"
              placeholder="e.g. Ahmed Ali"
              value={employee.name}
              onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Email Address</label>
            <input
              className="w-full p-3 rounded-xl bg-[var(--bg-inner)] ring-1 ring-[var(--border-secondary)] focus:ring-2 focus:ring-[#004AAD] transition text-[var(--text-primary)] outline-none"
              placeholder="ahmed@example.pk"
              type="email"
              value={employee.email}
              onChange={(e) => setEmployee({ ...employee, email: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Password</label>
            <input
              className="w-full p-3 rounded-xl bg-[var(--bg-inner)] ring-1 ring-[var(--border-secondary)] focus:ring-2 focus:ring-[#004AAD] transition text-[var(--text-primary)] outline-none"
              placeholder="********"
              type="password"
              value={employee.password}
              onChange={(e) => setEmployee({ ...employee, password: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Phone</label>
            <input
              className="w-full p-3 rounded-xl bg-[var(--bg-inner)] ring-1 ring-[var(--border-secondary)] focus:ring-2 focus:ring-[#004AAD] transition text-[var(--text-primary)] outline-none"
              placeholder="+92 300 1234567"
              value={employee.phone}
              onChange={(e) => setEmployee({ ...employee, phone: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Department</label>
            <input
              className="w-full p-3 rounded-xl bg-[var(--bg-inner)] ring-1 ring-[var(--border-secondary)] focus:ring-2 focus:ring-[#004AAD] transition text-[var(--text-primary)] outline-none"
              placeholder="e.g. Engineering"
              value={employee.department}
              onChange={(e) => setEmployee({ ...employee, department: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Role</label>
            <select
              className="w-full p-3 rounded-xl bg-[var(--bg-inner)] ring-1 ring-[var(--border-secondary)] focus:ring-2 focus:ring-[#004AAD] transition text-[var(--text-primary)] outline-none"
              value={employee.role}
              onChange={(e) => setEmployee({ ...employee, role: e.target.value, subcategory: "" })}
            >
              <option value="">Select Role</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {employee.role && subcategories[employee.role] && (
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Specialization</label>
              <select
                className="w-full p-3 rounded-xl bg-[var(--bg-inner)] ring-1 ring-[var(--border-secondary)] focus:ring-2 focus:ring-[#004AAD] transition text-[var(--text-primary)] outline-none"
                value={employee.subcategory}
                onChange={(e) => setEmployee({ ...employee, subcategory: e.target.value })}
              >
                <option value="">Select Specialization</option>
                {subcategories[employee.role].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Assign Project Head (Optional)</label>
            <select
              className="w-full p-3 rounded-xl bg-[var(--bg-inner)] ring-1 ring-[var(--border-secondary)] focus:ring-2 focus:ring-[#004AAD] transition text-[var(--text-primary)] outline-none"
              value={employee.projectHead}
              onChange={(e) => setEmployee({ ...employee, projectHead: e.target.value })}
            >
              <option value="">No Project Head Assigned</option>
              {projectHeads.map(ph => (
                <option key={ph._id} value={ph._id}>{ph.name || ph.username}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              onClick={addEmployee}
              className="w-full py-4 rounded-xl bg-[#004AAD] text-white font-bold shadow-lg hover:bg-[#003882] transition-all transform hover:-translate-y-0.5"
            >
              Add {employee.role || "Employee"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}