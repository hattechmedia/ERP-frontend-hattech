import { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";

export default function HREmployees() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [category, setCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

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
        projectHead: "",
        teamLead: ""
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

        const fetchPossibleTeamLeads = async () => {
            try {
                // Fetch all employees to allow any of them to be assigned as TL initially
                const res = await api.get('/employees');
                if (res.data.success) {
                    setTeamLeads(res.data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch possible team leads", error);
            }
        };

        fetchProjectHeads();
        fetchPossibleTeamLeads();
    }, []);

    const [teamLeads, setTeamLeads] = useState([]);

    const categories = [
        "Web Developer",
        "App Developer",
        "Digital Marketing",
        "Graphic Designer",
        "Video Editor",
        "SEO Specialist",
        "SMM Specialist",
        "Content Writer",
        "QA Engineer",
        "Team Lead",
        "HR",
        "Sales",
        "Operations",
        "Manager",
        "YouTube Automation",
        "AI ML",
        "Intern",
    ];

    const subCategories = {
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

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const res = await api.get('/employees');
                if (res.data.success) {
                    const formattedEmployees = res.data.data.map(emp => ({
                        id: emp._id || emp.id,
                        name: (emp.name || `${emp.firstName} ${emp.lastName}`).replace(/\s*User$/i, '').trim(),
                        email: emp.email,
                        role: emp.userId?.role || emp.role || 'employee',
                        department: emp.department,
                        position: emp.position,
                        status: emp.status,
                        image: emp.image || emp.profileImage || emp.userId?.avatar || null,
                        bio: `${emp.position} in ${emp.department}`,
                        phone: emp.phone,
                        joining: emp.joinDate
                    }));
                    setEmployees(formattedEmployees);
                }
            } catch (error) {
                console.error("Failed to fetch employees", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, [showAddEmployee]); // Refresh when add modal closes (implies success)

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 pt-14 md:pt-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold text-primary">Manage Employees</h1>
                <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
                    <select
                        className="px-3 py-1 rounded border border-theme bg-[var(--bg-card)] text-theme-primary w-full sm:w-auto"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="px-3 py-1 rounded border border-theme bg-[var(--bg-card)] text-theme-primary w-full sm:w-auto"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button
                        className="w-full sm:w-auto px-6 py-2 rounded-full font-bold shadow-md bg-[#004AAD] text-white border-2 border-[#004AAD] hover:bg-[#003882] hover:scale-105 transition-all duration-200"
                        onClick={() => setShowAddEmployee(true)}
                    >
                        + Add Employee
                    </button>
                </div>
            </div>

            {employees.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No employees found.</p>
            ) : (
                <div className="grid md:grid-cols-3 gap-3">
                    {employees
                        .filter(emp =>
                            (category === "All" || emp.position === category) &&
                            (emp.name?.toLowerCase().includes(search.toLowerCase()) ||
                                emp.email?.toLowerCase().includes(search.toLowerCase()) ||
                                emp.position?.toLowerCase().includes(search.toLowerCase()))
                        )
                        .map((emp) => (
                            <div key={emp.id} className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-md transition group relative overflow-hidden">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                                        <img
                                            src={emp.image && (emp.image.startsWith('data:') || emp.image.startsWith('http')) ? emp.image : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=004AAD&textColor=ffffff`}
                                            alt={emp.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-theme-primary truncate">{emp.name}</h3>
                                        <p className="text-xs text-theme-secondary truncate">{emp.position} • {emp.department}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {emp.role === 'teamlead' ? (
                                                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-black rounded border border-green-500/20 uppercase tracking-tighter">Team Lead</span>
                                            ) : (
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            const res = await api.put(`/employees/${emp.id}`, { role: 'teamlead' });
                                                            if (res.data.success) {
                                                                toast.success(`${emp.name} promoted to Team Lead!`);
                                                                setEmployees(employees.map(e => e.id === emp.id ? { ...e, role: 'teamlead' } : e));
                                                            }
                                                        } catch (err) { toast.error("Promotion failed"); }
                                                    }}
                                                    className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded hover:bg-primary hover:text-white transition-all uppercase tracking-tighter"
                                                >
                                                    Promote to TL
                                                </button>
                                            )}
                                            <span className="text-[10px] text-gray-500 font-medium">{emp.phone || 'No Phone'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* Add Employee Modal */}
            <AnimatePresence>
                {showAddEmployee && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) setShowAddEmployee(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-2xl w-full max-w-lg border-2 border-primary relative"
                        >
                            <button
                                className="absolute top-3 right-3 text-xl text-red-500 hover:text-red-700 transition-colors"
                                onClick={() => setShowAddEmployee(false)}
                            >×</button>
                            <h2 className="text-2xl font-bold mb-4 text-center text-primary">Add New Employee</h2>
                            <form
                                onSubmit={async e => {
                                    e.preventDefault();
                                    try {
                                        const nameParts = form.name.split(" ");
                                        const firstName = nameParts[0];
                                        const lastName = nameParts.slice(1).join(" ") || "User";

                                        // Determine role
                                        let role = "employee";
                                        if (form.role === "Manager") {
                                            if (form.subcategory === "HR") role = "hr";
                                            else if (form.subcategory === "Project Head") role = "projecthead";
                                            else role = "manager";
                                        } else if (form.role === "Team Lead") {
                                            role = "teamlead";
                                        } else if (form.role === "Intern") {
                                            role = "intern";
                                        }

                                        const payload = {
                                            firstName,
                                            lastName,
                                            email: form.email,
                                            phone: form.phone,
                                            department: form.department,
                                            position: form.role,
                                            joinDate: form.joining || new Date().toISOString(),
                                            username: form.email.split('@')[0] + Math.floor(Math.random() * 1000),
                                            password: form.password,
                                            role: role,
                                            projectHead: form.projectHead || null,
                                            teamLead: form.teamLead || null
                                        };

                                        const res = await api.post('/employees', payload);
                                        if (res.data.success) {
                                            setShowAddEmployee(false);
                                            setForm({ name: "", email: "", password: "", phone: "", department: "", joining: "", role: "", subcategory: "", bio: "", projectHead: "" });
                                            toast.success("Employee added successfully!");
                                        }
                                    } catch (error) {
                                        const msg = error.response?.data?.message || "Failed to add employee";
                                        toast.error(msg);
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div className="flex gap-2">
                                    <input className="flex-1 p-2 rounded border border-theme bg-transparent outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                    <input className="flex-1 p-2 rounded border border-theme bg-transparent outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                                </div>
                                <div className="flex gap-2">
                                    <input className="flex-1 p-2 rounded border border-theme bg-transparent outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                                    <input className="flex-1 p-2 rounded border border-theme bg-transparent outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                </div>
                                <div className="flex gap-2">
                                    <input className="flex-1 p-2 rounded border border-theme bg-transparent outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                                    <input className="flex-1 p-2 rounded border border-theme bg-transparent outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Joining Date" type="date" value={form.joining} onChange={e => setForm({ ...form, joining: e.target.value })} />
                                </div>
                                <select className="w-full p-2 rounded border border-theme bg-transparent outline-none focus:ring-2 focus:ring-primary transition-all" value={form.role} onChange={e => setForm({ ...form, role: e.target.value, subcategory: "" })} required>
                                    <option value="">Select Role</option>
                                    {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                {form.role && subCategories[form.role] && (
                                    <select className="w-full p-2 rounded border border-theme bg-transparent outline-none focus:ring-2 focus:ring-primary transition-all" value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })}>
                                        <option value="">Select Subcategory</option>
                                        {subCategories[form.role].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                    </select>
                                )}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Assign Team Lead (Optional)</label>
                                    <select
                                        className="w-full p-2 rounded border border-theme bg-transparent outline-none focus:ring-2 focus:ring-primary transition-all text-theme-primary"
                                        value={form.teamLead}
                                        onChange={e => setForm({ ...form, teamLead: e.target.value })}
                                    >
                                        <option value="">No Team Lead Assigned</option>
                                        {teamLeads.map(tl => (
                                            <option key={tl.userId?._id || tl._id} value={tl.userId?._id || tl._id}>
                                                {tl.name || tl.username} ({tl.position})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-2 rounded-full font-bold bg-[#004AAD] text-white hover:bg-[#003882] shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02]">Add Employee</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
