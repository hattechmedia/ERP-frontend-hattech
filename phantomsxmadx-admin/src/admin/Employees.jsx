import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import { FiChevronDown } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";
import AdminTasksTab from "./AdminTasksTab";

export default function Employees() {
  const { confirm } = useModal();
  const navigate = useNavigate(); // Initialize hook
  // 🔹 ALL EMPLOYEES (FROM STORAGE)
  const [employees, setEmployees] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Employees");

  // Add Employee form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    image: "",
    role: "",
    subcategory: "",
    phone: "",
    department: "",
    joining: "",
    projectHead: ""
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

  // Example categories and subcategories
  // Expanded categories and subcategories
  const categories = [
    "All",
    "Web Developer",
    "App Developer",
    "Digital Marketing",
    "Graphic Designer",
    "Video Editor",
    "SEO Specialist",
    "SMM Specialist",
    "Content Writer",
    "QA Engineer",
    "Sales",
    "Operations",
    "Manager",
    "YouTube Automation",
    "AI ML",
    "IT Support",
    "Intern"
  ];

  const subcategories = {
    "Web Developer": ["Frontend Developer", "Backend Developer", "Full Stack Developer", "MERN Stack Developer", "PHP LARAVEL DEVELOPER"],
    "App Developer": ["Flutter Developer", "React Native Developer", "iOS Developer", "Android Developer"],
    "Digital Marketing": ["Social Media Marketer", "PPC Specialist", "Email Marketing Specialist", "Content Marketer"],
    "Graphic Designer": ["UI/UX Designer", "Logo Designer", "Brand Identity Designer"],
    "Video Editor": ["Motion Graphics", "Video Editor", "Animator"],
    "SEO Specialist": ["On-Page SEO", "Off-Page SEO", "Technical SEO"],
    "SMM Specialist": ["Facebook Ads", "Instagram Growth", "LinkedIn Marketing"],
    "Content Writer": ["Blog Writer", "Copywriter", "Technical Writer"],
    "QA Engineer": ["Manual QA", "Automation QA"],
    "HR": ["Recruiter", "HR Manager", "Payroll Specialist"],
    "Sales": ["Sales Executive", "Business Development Manager"],
    "Operations": ["Operations Manager", "Data Analyst"],
    "Manager": ["Project Head", "HR"],
    "YouTube Automation": ["Channel Management", "Script Writing", "Video Optimization", "Thumbnail Design"],
    "AI ML": ["Data Scientist", "Machine Learning Engineer", "AI Researcher", "NLP Specialist"],
    "Intern": ["Web Developer", "App Developer", "QA Engineer", "YouTube Automation", "AI ML", "Graphic Designer", "Video Editor", "SEO Specialist", "Digital Marketing", "SMM Specialist", "Content Writer", "Management"]
  };

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await api.get('/employees');
        if (res.data.success) {
          // Determine if we need to format the data
          // The API returns employees with populated userId (username, email, role).
          // The UI expects flat structure with role, email, etc.
          const formattedEmployees = res.data.data.map(emp => ({
            id: emp._id || emp.id,
            name: (emp.name || `${emp.firstName} ${emp.lastName}`).replace(/\s*User$/i, '').trim(),
            email: emp.email,
            role: emp.userId?.role || emp.role || 'employee', // Fallback
            department: emp.department,
            position: emp.position,
            status: emp.status,
            image: emp.image || emp.profileImage || emp.userId?.avatar || null, // Allow null to trigger fallback in render
            bio: `${emp.position} in ${emp.department}`, // Construct bio
            phone: emp.phone,
            documents: emp.documents || []
          })).sort((a, b) => {
            const warningsA = a.documents.filter(d => d.type === 'warning').length;
            const warningsB = b.documents.filter(d => d.type === 'warning').length;
            return warningsB - warningsA; // Descending order
          });

          setEmployees(formattedEmployees);
        }
      } catch (error) {
        console.error("Failed to fetch employees", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [showAddEmployee]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pt-14 md:pt-0">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">Team</h1>
          <div className="flex p-1 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)]">
            <button 
              onClick={() => setActiveTab("Employees")} 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Employees' ? 'bg-[#004AAE] text-white shadow-sm' : 'text-theme-secondary hover:text-theme-primary'}`}
            >
              Employees
            </button>
            <button 
              onClick={() => setActiveTab("Interns")} 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Interns' ? 'bg-[#004AAE] text-white shadow-sm' : 'text-theme-secondary hover:text-theme-primary'}`}
            >
              Interns
            </button>
            <button 
              onClick={() => setActiveTab("Managing")} 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Managing' ? 'bg-[#004AAE] text-white shadow-sm' : 'text-theme-secondary hover:text-theme-primary'}`}
            >
              Management
            </button>
            <button 
              onClick={() => setActiveTab("Ex-Employees")} 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Ex-Employees' ? 'bg-red-600 text-white shadow-sm' : 'text-theme-secondary hover:text-theme-primary'}`}
            >
              Ex-Employees
            </button>
            <button 
              onClick={() => setActiveTab("Tasks")} 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Tasks' ? 'bg-purple-600 text-white shadow-sm' : 'text-theme-secondary hover:text-theme-primary hover:bg-white/5'}`}
            >
              Tasks
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
          {/* Category Filter */}
          {activeTab !== "Tasks" && (
            <select
              className="px-3 py-1 rounded border border-theme bg-[var(--bg-card)] text-theme-primary w-full sm:w-auto"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
          {/* Search */}
          {activeTab !== "Tasks" && (
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1 rounded border border-theme bg-[var(--bg-card)] text-theme-primary w-full sm:w-auto"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}
          {activeTab !== "Tasks" && (
          <button
            className="w-full sm:w-auto px-6 py-2 rounded-full font-bold shadow-md bg-[#004AAD] text-white border-2 border-[#004AAD] hover:bg-[#003882] hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#004AAD]"
            style={{ minWidth: 140, fontSize: '1rem', letterSpacing: '0.03em' }}
            onClick={() => {
              if (activeTab === "Interns") {
                setForm(prev => ({ ...prev, role: "Intern", subcategory: "" }));
              } else if (activeTab === "Managing") {
                setForm(prev => ({ ...prev, role: "Manager", subcategory: "" }));
              } else {
                setForm(prev => ({ ...prev, role: "", subcategory: "" }));
              }
              setShowAddEmployee(true);
            }}
          >
            {activeTab === "Interns" ? "+ Add Intern" : activeTab === "Managing" ? "+ Add Manager" : "+ Add Employee"}
          </button>
          )}
        </div>
      </div>

      {/* ================= TASKS TAB ================= */}
      {activeTab === "Tasks" && <AdminTasksTab />}

      {/* ================= EMPLOYEE LIST ================= */}
      {activeTab !== "Tasks" && loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004AAD]"></div>
        </div>
      ) : activeTab !== "Tasks" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {employees
            .filter(emp => {
                const role = emp.role ? emp.role.toLowerCase() : '';
                if (role === 'admin') return false; 
                
                // Status filtering
                if (activeTab === "Ex-Employees") {
                    if (emp.status !== 'inactive') return false;
                } else {
                    if (emp.status === 'inactive') return false;
                    
                    if (activeTab === "Employees") {
                        if (role === 'hr_hattech' || role === 'it_support' || role === 'hr' || role === 'intern') return false;
                    } else if (activeTab === "Managing") {
                        if (role !== 'hr_hattech' && role !== 'it_support' && role !== 'hr') return false;
                    } else if (activeTab === "Interns") {
                        if (role !== 'intern') return false;
                    }
                }
                
                return (category === "All" || emp.position === category) &&
                (emp.name?.toLowerCase().includes(search.toLowerCase()) ||
                  emp.email?.toLowerCase().includes(search.toLowerCase()) ||
                  emp.bio?.toLowerCase().includes(search.toLowerCase()) ||
                  emp.position?.toLowerCase().includes(search.toLowerCase())
                );
            })
            .map((emp) => {
              const warnings = emp.documents?.filter(d => d.type === 'warning') || [];

              return (
                <div
                  key={emp.id}
                  className="p-6 rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#004AAE]/50 transition-all shadow-xl hover:shadow-[#004AAE]/10 flex flex-col items-center text-center relative group cursor-pointer"
                  onClick={() => navigate(`/admin/employee/${emp.id}`)}
                >
                  {/* Warning Badge */}
                  {warnings.length > 0 && (
                    <div className="absolute top-3 left-3 flex items-center justify-center bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md z-10" title={`${warnings.length} Warning(s) Issued`}>
                      {warnings.length} !
                    </div>
                  )}

                  {/* Avatar */}
                  <img
                    src={
                      emp.image && (emp.image.startsWith('data:') || emp.image.startsWith('http'))
                        ? emp.image
                        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=004AAE&textColor=ffffff`
                    }
                    className="w-20 h-20 rounded-full object-cover bg-gray-100 border-2 border-[#004AAE]/30 mb-3 shadow-md transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=gray`;
                    }}
                  />

                  {/* Name */}
                  <h4 className="font-black text-base text-[var(--text-primary)] tracking-tight leading-snug">{emp.name}</h4>

                  {/* Position Badge */}
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-[#004AAE]/10 text-[#004AAE] border border-[#004AAE]/20 mt-1.5">
                    {emp.position}{emp.subcategory ? ` (${emp.subcategory})` : ""}
                  </span>

                  {/* Action Button: Deactivate or Reactivate */}
                  <div className="mt-4 pt-3 border-t border-[var(--border-color)]/40 w-full flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--text-secondary)] font-semibold truncate">
                      {emp.department || "Team"}
                    </span>
                    
                    {emp.status === 'inactive' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          className="px-2.5 py-1 rounded-xl text-white text-xs font-bold bg-emerald-600 hover:bg-emerald-700 transition shadow-md active:scale-95 cursor-pointer shrink-0"
                          onClick={async (e) => {
                            e.stopPropagation(); 
                            const isConfirmed = await confirm({
                              title: 'Reactivate Employee',
                              message: `Are you sure you want to reactivate ${emp.name}? Their account will be restored to active status.`,
                              type: 'info',
                              confirmText: 'Reactivate',
                              cancelText: 'Cancel'
                            });

                            if (!isConfirmed) return;

                            try {
                              const res = await api.put(`/employees/${emp.id}`, { status: 'active' });
                              if (res.data.success || res.status === 200) {
                                setEmployees(employees.map(e => e.id === emp.id ? { ...e, status: 'active' } : e));
                                toast.success(`${emp.name} reactivated successfully`);
                              }
                            } catch (error) {
                              console.error("Failed to reactivate employee", error);
                              toast.error("Failed to reactivate employee");
                            }
                          }}
                          title="Reactivate Employee"
                        >
                          Reactivate
                        </button>
                        <button
                          className="px-2.5 py-1 rounded-xl text-white text-xs font-bold bg-red-600 hover:bg-red-700 transition shadow-md active:scale-95 cursor-pointer shrink-0"
                          onClick={async (e) => {
                            e.stopPropagation(); 
                            const isConfirmed = await confirm({
                              title: 'Delete Employee',
                              message: `Are you sure you want to permanently delete ${emp.name}? This will remove all associated user records and cannot be undone.`,
                              type: 'danger',
                              confirmText: 'Delete Permanently',
                              cancelText: 'Cancel'
                            });

                            if (!isConfirmed) return;

                            try {
                              const res = await api.delete(`/employees/${emp.id}?permanent=true`);
                              if (res.data.success || res.status === 200) {
                                setEmployees(employees.filter(e => e.id !== emp.id));
                                toast.success(`${emp.name} permanently deleted`);
                              }
                            } catch (error) {
                              console.error("Failed to permanently delete employee", error);
                              toast.error("Failed to delete employee");
                            }
                          }}
                          title="Permanently Delete Ex-Employee"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <button
                        className="px-3 py-1 rounded-xl text-white text-xs font-bold bg-red-500 hover:bg-red-700 transition shadow-md active:scale-95 cursor-pointer shrink-0"
                        onClick={async (e) => {
                          e.stopPropagation(); 
                          const isConfirmed = await confirm({
                            title: 'Deactivate Employee',
                            message: `Are you sure you want to deactivate ${emp.name}? They will no longer be able to login, but their records will be kept in the Ex-Employees tab.`,
                            type: 'danger',
                            confirmText: 'Deactivate',
                            cancelText: 'Cancel'
                          });

                          if (!isConfirmed) return;

                          try {
                            const res = await api.delete(`/employees/${emp.id}`);
                            if (res.data.success || res.status === 200) {
                              setEmployees(employees.map(e => e.id === emp.id ? { ...e, status: 'inactive' } : e));
                              toast.success("Employee deactivated successfully");
                            }
                          } catch (error) {
                            console.error("Failed to deactivate employee", error);
                            toast.error("Failed to deactivate employee");
                          }
                        }}
                        title="Deactivate Employee"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      ) : null}

      {/* Add Employee Modal/Section */}
      <AnimatePresence>
        {showAddEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={e => {
              if (e.target === e.currentTarget) setShowAddEmployee(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-theme relative overflow-hidden"
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                onClick={() => setShowAddEmployee(false)}
                tabIndex={-1}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <h2 className="text-2xl font-bold mb-6 text-center text-theme-primary">Add New Employee</h2>

              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setCreating(true);

                  try {
                    // Split name into First and Last
                    const nameParts = form.name.split(" ");
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(" ") || "User"; // Fallback last name

                    // Determine role
                    let role = "employee";
                    if (form.role === "Manager") {
                      if (form.subcategory === "HR") role = "hr";
                      else if (form.subcategory === "Project Head") role = "projecthead";
                      else role = "manager";
                    } else if (form.role === "IT Support") {
                      role = "it_support";
                    } else if (form.role === "Intern") {
                      role = "intern";
                    } else {
                      role = "employee";
                    }

                    const payload = {
                      firstName,
                      lastName,
                      email: form.email,
                      phone: form.phone || "000-000-0000",
                      department: form.department || "General",
                      position: form.role, // Use the UI role as position
                      joinDate: form.joining || new Date().toISOString(),
                      username: form.email.split('@')[0] + Math.floor(Math.random() * 1000), // Generate username
                      password: form.password,
                      role: role,
                      projectHead: form.projectHead || null
                    };

                    const res = await api.post('/employees', payload);

                    if (res.data.success) {
                      setShowAddEmployee(false);
                      setForm({ name: "", email: "", password: "", bio: "", image: "", role: "", subcategory: "", phone: "", department: "", joining: "", projectHead: "" });
                      toast.success("Employee added successfully!");
                    }
                  } catch (error) {
                    console.error("Failed to add employee", error);
                    const msg = error.response?.data?.message || "Failed to add employee";
                    const details = error.response?.data?.details ? ` (Details: ${error.response.data.details.join(', ')})` : "";
                    toast.error(msg + details);
                  } finally {
                    setCreating(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Full Name</label>
                    <input
                      className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-theme-primary transition-all"
                      placeholder="e.g. Ahmed Ali"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Email Address</label>
                    <input
                      className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-theme-primary transition-all"
                      placeholder="ahmed@example.pk"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Password</label>
                    <input
                      className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-theme-primary transition-all"
                      placeholder="********"
                      type="password"
                      value={form.password || ""}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Phone</label>
                    <input
                      className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-theme-primary transition-all"
                      placeholder="+92 300 1234567"
                      value={form.phone || ""}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Department</label>
                    <input
                      className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-theme-primary transition-all"
                      placeholder="e.g. Engineering"
                      value={form.department || ""}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Join Date</label>
                    <input
                      className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-theme-primary transition-all"
                      value={form.joining || ""}
                      onChange={e => setForm({ ...form, joining: e.target.value })}
                      type="date"
                    />
                  </div>
                </div>

                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Role</label>
                  <div className="relative">
                    <select
                      className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-theme-primary transition-all appearance-none cursor-pointer"
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value, subcategory: "" })}
                      required
                    >
                      <option value="">Select Role</option>
                      {categories.filter(c => c !== "All").map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                      <FiChevronDown />
                    </div>
                  </div>
                </div>

                {/* Subcategory Dropdown */}
                {form.role && subcategories[form.role] && (
                  <div className="space-y-1 animate-in slide-in-from-top-2 fade-in duration-300">
                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Specialization</label>
                    <select
                      className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-theme-primary transition-all appearance-none"
                      value={form.subcategory}
                      onChange={e => setForm({ ...form, subcategory: e.target.value })}
                      required
                    >
                      <option value="">Select Specialization</option>
                      {subcategories[form.role].map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Assign Project Head (Optional)</label>
                  <div className="relative">
                    <select
                      className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-theme-primary transition-all appearance-none cursor-pointer"
                      value={form.projectHead}
                      onChange={e => setForm({ ...form, projectHead: e.target.value })}
                    >
                      <option value="">No Project Head Assigned</option>
                      {projectHeads.map(ph => (
                        <option key={ph._id} value={ph._id}>{ph.name || ph.username}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                      <FiChevronDown />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-3.5 rounded-xl font-bold shadow-lg bg-[#004AAD] text-white hover:bg-[#003882] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {creating ? "Creating..." : "Create Employee Account"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
