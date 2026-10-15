import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiPhone, FiMail, FiBriefcase, FiDownload } from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { useModal } from "../contexts/ModalContext";

export default function HREmployeeRecords() {
  const { confirm } = useModal();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Employees");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectHeads, setProjectHeads] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);

  // Categories and Subcategories
  // Categories and Subcategories
  const categories = [
    "Web Developer",
    "App Developer",
    "YouTube Automation",
    "AI ML",
    "Digital Marketing",
    "Graphic Designer",
    "Video Editor",
    "SEO Specialist",
    "SMM Specialist",
    "Content Writer",
    "QA Engineer",
    "HR",
    "Sales",
    "Operations",
    "Manager",
    "Intern"
  ];

  const subcategories = {
    "Web Developer": ["Frontend Developer", "Backend Developer", "Full Stack Developer", "MERN Stack Developer", "PHP LARAVEL DEVELOPER"],
    "App Developer": ["Flutter Developer", "React Native Developer", "iOS Developer", "Android Developer"],
    "YouTube Automation": ["Channel Manager", "Video Strategist", "Automation Scripting"],
    "AI ML": ["Machine Learning Engineer", "Data Scientist", "AI Researcher", "NLP Specialist"],
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
    "Intern": ["Web Developer", "App Developer", "QA Engineer", "YouTube Automation", "AI ML", "Graphic Designer", "Video Editor", "SEO Specialist", "Digital Marketing", "SMM Specialist", "Content Writer", "Management"]
  };

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    joinDate: "",
    salary: "",
    image: "",
    role: "",
    subcategory: "",
    password: "",
    projectHead: "",
    teamLead: ""
  });

  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchTerm(location.state.searchQuery);
    }
  }, [location.state]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees');
      if (res.data.success) {
        setEmployees(res.data.data);
        setFilteredEmployees(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchProjectHeads();
    fetchTeamLeads();
  }, []);

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

  const fetchTeamLeads = async () => {
    try {
      const res = await api.get('/auth/team-leads');
      if (res.data.success) {
        setTeamLeads(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch team leads", error);
    }
  };

  useEffect(() => {
    const filtered = employees.filter(emp => {
      const role = (emp.role || emp.userId?.role || "").toLowerCase();
      const status = (emp.status || 'active').toLowerCase();
      const nameMatch = (emp.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (emp.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!nameMatch) return false;

      if (activeTab === "Ex-Employees") {
        return status === 'inactive';
      } else {
        if (status === 'inactive') return false;

        if (activeTab === "Employees") {
          return role !== 'hr_hattech' && role !== 'it_support' && role !== 'hr' && role !== 'admin' && role !== 'client' && role !== 'intern';
        } else if (activeTab === "Management") {
          return role === 'hr_hattech' || role === 'it_support' || role === 'hr';
        } else if (activeTab === "Interns") {
          return role === 'intern';
        }
      }
      return true;
    });
    setFilteredEmployees(filtered);
  }, [searchTerm, employees, activeTab]);

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email || (!editingEmployee && !newEmployee.password)) {
      toast.error("Please fill in required fields (Name, Email, Password)");
      return;
    }

    const nameParts = newEmployee.name.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "."; // Fallback for single names
    
    // Generate a unique username for the backend if not present
    const username = newEmployee.username || newEmployee.email.split('@')[0] + Math.floor(Math.random() * 1000);

    // Map UI "role" (Category) to backend fields correctly
    let backendRole = "employee";
    if (newEmployee.role === "Manager") {
      if (newEmployee.subcategory === "HR") backendRole = "hr";
      else if (newEmployee.subcategory === "Project Head") backendRole = "projecthead";
      else backendRole = "manager";
    } else if (newEmployee.role === "HR") {
      backendRole = "hr";
    } else if (newEmployee.role === "Intern") {
      backendRole = "intern";
    }

    // STRICT PAYLOAD: Only include fields allowed by the backend Joi schema
    // Fields like 'salary', 'image', 'name' are NOT allowed in the POST /employees endpoint
    const payload = {
      firstName,
      lastName,
      email: newEmployee.email,
      phone: newEmployee.phone || "000-000-0000",
      department: newEmployee.department || "General",
      position: newEmployee.position || newEmployee.role || "Employee",
      joinDate: newEmployee.joinDate || new Date().toISOString(),
      username,
      password: newEmployee.password,
      role: backendRole,
      subcategory: newEmployee.subcategory || "",
      projectHead: newEmployee.projectHead || null,
      teamLead: newEmployee.teamLead || null
    };

    try {
      if (editingEmployee) {
        // For updates, remove fields that are not in the update Joi schema
        const { username, joinDate, ...updatePayload } = payload;
        if (!updatePayload.password) {
          delete updatePayload.password;
        }
        await api.put(`/employees/${editingEmployee._id}`, updatePayload);
      } else {
        // For creation, we must send the full strict payload
        await api.post('/employees', payload);
      }
      fetchEmployees();
      handleCancelEdit();
      toast.success(editingEmployee ? "Employee updated" : "Employee added");
    } catch (error) {
      console.error("Failed to save employee", error);
      // Show the actual backend error message if available
      const errMsg = error.response?.data?.message || "Failed to save employee";
      toast.error(errMsg);
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Delete Employee',
      message: `Are you sure you want to delete ${name}? This action cannot be undone and will remove all associated records.`,
      type: 'danger',
      confirmText: 'Delete Employee',
      cancelText: 'Cancel'
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees();
      toast.success("Employee deleted successfully");
    } catch (error) {
      console.error("Failed to delete employee", error);
      toast.error("Failed to delete employee");
    }
  };

  const handleEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setNewEmployee({
      ...emp,
      role: emp.position || emp.role || "",
      projectHead: emp.projectHead?._id || emp.projectHead || "",
      teamLead: emp.teamLead?._id || emp.teamLead || "",
      password: "" // Don't show password or reset it for update
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      joinDate: "",
      salary: "",
      image: "",
      role: "",
      subcategory: "",
      projectHead: "",
      teamLead: ""
    });
    setShowAddForm(false);
  };

  /* ================= WARNING LOGIC ================= */
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningData, setWarningData] = useState({
    employeeId: null,
    employeeName: "",
    title: "Warning Letter",
    content: ""
  });

  const handleOpenWarning = (emp) => {
    setWarningData({
      employeeId: emp._id,
      userId: emp.userId?._id || emp.userId, // Use userId from populated data
      employeeName: emp.name,
      title: "Warning Letter",
      content: ""
    });
    setShowWarningModal(true);
  };

  const handleIssueWarning = async () => {
    if (!warningData.title || !warningData.content) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await api.post('/hr/documents', {
        userId: warningData.userId,
        title: warningData.title,
        content: warningData.content,
        type: 'warning',
        status: 'Pending',
        url: 'generated-warning' // Required by Document model
      });
      toast.success(`Warning issued to ${warningData.employeeName}`);
      setShowWarningModal(false);
      fetchEmployees(); // Refresh to show warning count if implemented
    } catch (err) {
      console.error("Failed to issue warning", err);
      toast.error("Failed to issue warning");
    }
  };

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-theme-primary transition-colors">Employee Records</h1>
          <p className="text-sm text-theme-secondary transition-colors">Manage all employee information</p>
        </div>
        <button
          onClick={() => {
            if (!showAddForm && activeTab === "Interns") {
              setNewEmployee(prev => ({ ...prev, role: "Intern", subcategory: "" }));
            } else if (!showAddForm && activeTab === "Management") {
              setNewEmployee(prev => ({ ...prev, role: "Manager", subcategory: "" }));
            } else if (!showAddForm) {
              setNewEmployee(prev => ({ ...prev, role: "", subcategory: "" }));
            }
            setShowAddForm(!showAddForm);
          }}
          className="px-4 py-2 rounded-lg bg-[#004AAE] !text-white hover:bg-blue-600 transition flex items-center gap-2"
        >
          <FiPlus /> {activeTab === "Interns" ? "Add Intern" : activeTab === "Management" ? "Add Manager" : "Add Employee"}
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '3rem' }}
          className="w-full pr-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition-colors"
        />
        <FiSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      </div>

      {/* TABS */}
      <div className="flex p-1 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] w-fit">
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
          onClick={() => setActiveTab("Management")} 
          className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Management' ? 'bg-[#004AAE] text-white shadow-sm' : 'text-theme-secondary hover:text-theme-primary'}`}
        >
          Management
        </button>
        <button 
          onClick={() => setActiveTab("Ex-Employees")} 
          className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Ex-Employees' ? 'bg-red-600 text-white shadow-sm' : 'text-theme-secondary hover:text-theme-primary'}`}
        >
          Ex-Employees
        </button>
      </div>

      {/* WARNING MODAL */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--bg-card)] rounded-xl p-6 w-full max-w-md border border-red-500/50 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-4 text-red-500">
                <div className="p-2 bg-red-500/10 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl">Issue Warning</h3>
              </div>

              <p className="text-sm text-theme-secondary mb-4">
                Issuing warning to: <span className="font-bold text-theme-primary">{warningData.employeeName}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Subject</label>
                  <input
                    type="text"
                    value={warningData.title}
                    onChange={(e) => setWarningData({ ...warningData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Warning Details</label>
                  <textarea
                    rows="4"
                    placeholder="Explain the reason for the warning..."
                    value={warningData.content}
                    onChange={(e) => setWarningData({ ...warningData, content: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-500 !text-white hover:!text-black hover:bg-gray-600 transition shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIssueWarning}
                  className="px-4 py-2 rounded-lg bg-red-600 !text-white hover:bg-red-700 transition font-medium shadow-lg shadow-red-600/20"
                >
                  Issue Warning
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD/EDIT EMPLOYEE MODAL */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--bg-card)] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--border-color)] shadow-2xl relative"
            >
              <h3 className="font-bold text-2xl mb-6 text-theme-primary">{editingEmployee ? "Edit Employee" : "Add New Employee"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Email *</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Password *</label>
                  <input
                    type="text"
                    placeholder="Set initial password"
                    value={newEmployee.password || ""}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Phone</label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Position</label>
                  <input
                    type="text"
                    placeholder="Enter position"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Department</label>
                  <input
                    type="text"
                    placeholder="Enter department"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Join Date</label>
                  <input
                    type="date"
                    value={newEmployee.joinDate}
                    onChange={(e) => setNewEmployee({ ...newEmployee, joinDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Role *</label>
                  <select
                    value={newEmployee.role || ""}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value, subcategory: "" })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition"
                  >
                    <option value="">Select Role</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {newEmployee.role && subcategories[newEmployee.role] && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-secondary">Subcategory *</label>
                    <select
                      value={newEmployee.subcategory || ""}
                      onChange={(e) => setNewEmployee({ ...newEmployee, subcategory: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition"
                    >
                      <option value="">Select Specialization</option>
                      {subcategories[newEmployee.role].map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Assign Project Head (Optional)</label>
                  <select
                    className="w-full p-3 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] focus:ring-2 focus:ring-[#004AAD] transition text-[var(--text-primary)] outline-none"
                    value={newEmployee.projectHead || ""}
                    onChange={(e) => setNewEmployee({ ...newEmployee, projectHead: e.target.value })}
                  >
                    <option value="">No Project Head Assigned</option>
                    {projectHeads.map(ph => (
                      <option key={ph._id} value={ph._id}>{ph.name || ph.username} ({ph.email})</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-theme-secondary">Assign Team Lead (Optional)</label>
                  <select
                    className="w-full p-3 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] focus:ring-2 focus:ring-[#004AAD] transition text-[var(--text-primary)] outline-none"
                    value={newEmployee.teamLead || ""}
                    onChange={(e) => setNewEmployee({ ...newEmployee, teamLead: e.target.value })}
                  >
                    <option value="">No Team Lead Assigned</option>
                    {teamLeads.map(tl => (
                      <option key={tl._id} value={tl._id}>{tl.name || tl.username} ({tl.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-lg bg-gray-500 !text-white hover:!text-black hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEmployee}
                  className="px-4 py-2 rounded-lg bg-[#004AAE] !text-white hover:bg-blue-600 transition font-medium"
                >
                  {editingEmployee ? "Update Employee" : "Add Employee"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EMPLOYEES TABLE */}
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="p-6 text-center text-theme-secondary">No employees found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--border-color)]">
                <tr>
                  <th className="text-left p-4 font-semibold text-theme-primary">Name</th>
                  <th className="text-left p-4 font-semibold text-theme-primary">Email</th>
                  <th className="text-left p-4 font-semibold text-theme-primary">Phone</th>
                  <th className="text-left p-4 font-semibold text-theme-primary">Category</th>
                  <th className="text-left p-4 font-semibold text-theme-primary">Subcategory</th>
                  <th className="text-left p-4 font-semibold text-theme-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="border-b border-[var(--border-color)] hover:bg-theme-tertiary">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <img
                            src={emp.userId?.avatar || (emp.image && emp.image.length > 10 ? emp.image : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=004AAE&textColor=ffffff`)}
                            alt={emp.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=gray`;
                            }}
                          />
                          <span className="font-medium text-theme-primary">{emp.name?.split(' ')[0]}</span>
                        </div>
                        {emp.documents?.length > 0 && (
                          <span className="ml-10 text-[10px] font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full inline-block w-fit mt-1 border border-red-500/20">
                            {emp.documents.filter(d => d.type === 'warning').length} Warning(s)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-theme-secondary">{emp.email}</td>
                    <td className="p-4 text-sm text-theme-secondary">{emp.phone || "N/A"}</td>
                    <td className="p-4 text-sm capitalize text-theme-secondary">{emp.role === 'employee' ? 'Employee' : emp.role}</td>
                    <td className="p-4 text-sm text-theme-secondary">{emp.subcategory || "N/A"}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenWarning(emp)}
                          className="p-1.5 bg-[#004AAE] !text-white rounded-lg hover:bg-blue-600 transition shadow-sm shadow-blue-500/20"
                          title="Issue Warning"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditEmployee(emp)}
                          className="p-1.5 bg-[#004AAE] !text-white rounded-lg hover:bg-blue-600 transition shadow-sm shadow-blue-500/20"
                          title="Edit Employee"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                          className="p-1.5 bg-red-500 !text-white rounded-lg hover:bg-red-600 transition shadow-sm shadow-red-500/20"
                          title="Delete Employee"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EMPLOYEES TABLE SECTION END */}
    </div>
  );
}
