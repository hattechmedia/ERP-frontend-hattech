import { useState, useEffect } from "react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiX, FiUser, FiBriefcase, FiMail, FiCalendar, FiDollarSign, FiZap, FiShield, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function AddSubscriptionModal({ isOpen, onClose, onSave, isLight }) {
    const [loading, setLoading] = useState(false);
    const [managers, setManagers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [fetchingManagers, setFetchingManagers] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [currentTeamSelection, setCurrentTeamSelection] = useState([]);
    
    useEffect(() => {
        const fetchManagers = async () => {
            try {
                setFetchingManagers(true);
                let allEmps = [];
                
                try {
                    const res = await api.get('/employees');
                    allEmps = res.data.data || res.data.employees || [];
                } catch (e1) {
                    console.warn("Failed to fetch from /employees, trying alternative...", e1);
                    try {
                        const res = await api.get('/users');
                        allEmps = res.data.data || res.data.users || [];
                    } catch (e2) {
                        console.error("Failed to fetch employees", e2);
                        allEmps = [];
                    }
                }
                
                const projectHeads = allEmps.filter(emp => {
                    const role = (emp.role || emp.userId?.role || "").toLowerCase();
                    const specialization = (emp.specialization || emp.userId?.specialization || "").toLowerCase();
                    
                    return role.includes('manager') || 
                           role.includes('admin') || 
                           role === 'projecthead' ||
                           specialization.includes('project head');
                });
                
                setManagers(projectHeads.length > 0 ? projectHeads : allEmps);
                
                setEmployees(allEmps.filter(emp => {
                    const role = (emp.role || emp.userId?.role || "").toLowerCase();
                    return (role === 'employee' || role === 'user' || role === 'developer') && 
                           !projectHeads.some(ph => (ph._id || ph.userId?._id) === (emp._id || emp.userId?._id));
                }));
            } catch (err) {
                console.error("Failed to fetch managers", err);
                toast.error("Failed to load project heads");
            } finally {
                setFetchingManagers(false);
            }
        };

        if (isOpen) {
            fetchManagers();
        }
    }, [isOpen]);
    
    const getInitialService = () => ({
        projectTitle: "",
        subscriptionCategory: "SEO",
        subscriptionFee: 0,
        platform: "Web",
        start: new Date().toISOString().split('T')[0],
        expiry: "",
        manager: "",
        assignedTeams: []
    });

    const [formData, setFormData] = useState({
        contactPerson: "",
        companyName: "",
        email: "",
        phone: "",
        password: "",
        services: [getInitialService()]
    });

    const handleServiceChange = (sIdx, field, value) => {
        setFormData(prev => {
            const newServices = [...prev.services];
            newServices[sIdx] = { ...newServices[sIdx], [field]: value };
            if (field === 'subscriptionCategory' && newServices[sIdx].assignedTeams.length > 0) {
                newServices[sIdx].assignedTeams[0].service = value;
            }
            return { ...prev, services: newServices };
        });
    };

    const toggleTeamMember = (sIdx, empId) => {
        setFormData(prev => {
            const newServices = [...prev.services];
            const service = { ...newServices[sIdx] };
            
            let teamObj = service.assignedTeams.find(t => t.service === service.subscriptionCategory);
            if (!teamObj) {
                teamObj = { service: service.subscriptionCategory, employees: [] };
                service.assignedTeams = [...service.assignedTeams, teamObj];
            } else {
                service.assignedTeams = service.assignedTeams.map(t => 
                    t.service === service.subscriptionCategory ? { ...t, employees: [...t.employees] } : t
                );
                teamObj = service.assignedTeams.find(t => t.service === service.subscriptionCategory);
            }
            
            if (teamObj.employees.includes(empId)) {
                teamObj.employees = teamObj.employees.filter(id => id !== empId);
            } else {
                teamObj.employees.push(empId);
            }   
            
            if (teamObj.employees.length === 0) {
                service.assignedTeams = service.assignedTeams.filter(t => t.service !== service.subscriptionCategory);
            }
            
            newServices[sIdx] = service;
            return { ...prev, services: newServices };
        });
    };

    const addMoreService = () => {
        setFormData(prev => ({
            ...prev,
            services: [...prev.services, getInitialService()]
        }));
    };

    const removeServiceBlock = (sIdx) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.filter((_, i) => i !== sIdx)
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!formData.contactPerson || !formData.email || !formData.companyName) {
            toast.error("Please fill in client details (Name, Email, Company).");
            return;
        }

        for (const [idx, svc] of formData.services.entries()) {
             if (!svc.projectTitle || !svc.start) {
                 toast.error(`Please fill in Project Name and Start Date for service #${idx + 1}`);
                 return;
             }
        }

        try {
            setLoading(true);
            
            toast.loading("Creating client account...", { id: 'onboarding' });
            const clientRes = await api.post('/clients', {
                contactPerson: formData.contactPerson,
                companyName: formData.companyName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password || "client123",
                role: 'client'
            });

            if (!clientRes.data.success) throw new Error("Failed to create client account");
            const clientId = clientRes.data.data._id || clientRes.data.data.id;

            toast.loading("Setting up subscription projects...", { id: 'onboarding' });
            
            for (const svc of formData.services) {
                const expiryDate = svc.expiry ? new Date(svc.expiry) : new Date(svc.start);
                if (!svc.expiry) expiryDate.setMonth(expiryDate.getMonth() + 1);

                await api.post('/projects', {
                    title: svc.projectTitle,
                    client: clientId,
                    startDate: svc.start,
                    deadline: expiryDate.toISOString(),
                    status: 'active',
                    description: `Monthly Subscription for ${svc.projectTitle}`,
                    platform: svc.platform,
                    owner: 'Client',
                    isSubscription: true,
                    subscriptionStartDate: svc.start,
                    subscriptionExpiryDate: expiryDate.toISOString(),
                    subscriptionFee: svc.subscriptionFee,
                    subscriptionCategory: svc.subscriptionCategory,
                    manager: svc.manager,
                    assignedTeams: svc.assignedTeams
                });
            }

            toast.success("Client & Subscriptions Onboarded successfully!", { id: 'onboarding' });
            onSave();
            onClose();
            setFormData({
                contactPerson: "", companyName: "", email: "", phone: "", password: "",
                services: [getInitialService()]
            });
            setCurrentTeamSelection([]);
        } catch (error) {
            console.error("Onboarding failed", error);
            toast.error(error.response?.data?.message || "Failed to complete onboarding", { id: 'onboarding' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div     
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className={`w-full max-w-5xl rounded-3xl p-6 md:p-10 shadow-2xl border transition-all duration-300 overflow-y-auto max-h-[90vh] ${
                            isLight ? 'bg-white border-gray-100' : 'bg-[#151235] border-[#312e81]'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                                    <FiZap size={24} />
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Unified Subscription Onboarding</h2>
                                    <p className="text-sm text-gray-500 font-medium tracking-tight">Create Client account and Subscription Project at once.</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100/5 p-2 rounded-full">
                                <FiX size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} id="subscriptionForm" className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* LEFT COLUMN: CLIENT INFO */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2 text-[#004AAD]">
                                    <FiUser />
                                    <h3 className="text-sm font-bold uppercase tracking-widest">Client Member Details</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Full Contact Name *</label>
                                        <input
                                            className={`w-full p-4 rounded-2xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                            }`}
                                            value={formData.contactPerson}
                                            onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                            placeholder="e.g. John Doe"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Company / Brand Name *</label>
                                        <input
                                            className={`w-full p-4 rounded-2xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                            }`}
                                            value={formData.companyName}
                                            onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                            placeholder="e.g. Acme Media Corp"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Email Address *</label>
                                            <input
                                                className={`w-full p-4 rounded-2xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                    isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                                }`}
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="email@acme.com"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Phone Number</label>
                                            <input
                                                className={`w-full p-4 rounded-2xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                    isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                                }`}
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+92 300..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Account Password</label>
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-xs text-[#004AAD] hover:text-blue-600 flex items-center gap-1"
                                            >
                                                {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                                                {showPassword ? "Hide" : "Show"}
                                            </button>
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className={`w-full p-4 rounded-2xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                            }`}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Min 6 characters (auto-generated if empty)"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1 ml-1">✓ Leave empty for auto-generated password</p>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: SUBSCRIPTION INFO */}
                            <div className="space-y-8 h-full">
                                {formData.services.map((svc, sIdx) => {
                                    const currentTeamSelection = (svc.assignedTeams.find(t => t.service === svc.subscriptionCategory)?.employees || []);
                                    return (
                                    <div key={sIdx} className={`space-y-6 relative p-6 rounded-3xl border transition-all ${isLight ? 'bg-white border-blue-100 shadow-sm' : 'bg-[#0f0b1f] border-blue-900/30 shadow-md'}`}>
                                        {sIdx > 0 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeServiceBlock(sIdx)}
                                                className="absolute top-4 right-4 text-red-500 hover:text-red-700 bg-red-100/10 p-2 rounded-xl transition-all"
                                                title="Remove Service"
                                            >
                                                <FiX size={18} />
                                            </button>
                                        )}
                                        <div className="flex items-center gap-2 mb-2 text-blue-500">
                                            <FiZap />
                                            <h3 className="text-sm font-bold uppercase tracking-widest">Service #{sIdx + 1} Details</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Project / Service Name *</label>
                                                <input
                                                    className={`w-full p-4 rounded-2xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                        isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-black/20 border-gray-700 text-white'
                                                    }`}
                                                    value={svc.projectTitle}
                                                    onChange={e => handleServiceChange(sIdx, 'projectTitle', e.target.value)}
                                                    placeholder="e.g. Monthly SEO Retainer"
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Primary Category</label>
                                                    <select
                                                        className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-[#004AAD] ${
                                                            isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-black/20 border-gray-700 text-white'
                                                        }`}
                                                        value={svc.subscriptionCategory}
                                                        onChange={e => handleServiceChange(sIdx, 'subscriptionCategory', e.target.value)}
                                                    >
                                                        <option value="SEO">SEO Services</option>
                                                        <option value="SMM">Social Media Marketing</option>
                                                        <option value="Google Ads">Google Ads Management</option>
                                                        <option value="Web Development">Web Development</option>
                                                        <option value="Graphic Design">Graphic Design</option>
                                                        <option value="Web Maintenance">Web Maintenance & Hosting</option>
                                                        <option value="Lead Gen">Lead Generation & CRM</option>
                                                        <option value="Full Digital Marketing">Full Digital Marketing</option>
                                                        <option value="Other">Other Service</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Monthly Fee ($)</label>
                                                    <input
                                                        type="number"
                                                        className={`w-full p-4 rounded-2xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                            isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-black/20 border-gray-700 text-white'
                                                        }`}
                                                        value={svc.subscriptionFee}
                                                        onChange={e => handleServiceChange(sIdx, 'subscriptionFee', parseFloat(e.target.value) || 0)}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Start Date *</label>
                                                    <input
                                                        type="date"
                                                        className={`w-full p-4 rounded-2xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                            isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-black/20 border-gray-700 text-white'
                                                        }`}
                                                        value={svc.start}
                                                        onChange={e => handleServiceChange(sIdx, 'start', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Next Renewal Date</label>
                                                    <input
                                                        type="date"
                                                        className={`w-full p-4 rounded-2xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                            isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-black/20 border-gray-700 text-white'
                                                        }`}
                                                        value={svc.expiry}
                                                        onChange={e => handleServiceChange(sIdx, 'expiry', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Project Head Selection - Single Select */}
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block ml-1">Project Head (Manager)</label>
                                                {fetchingManagers && (
                                                    <div className={`w-full p-4 rounded-2xl border text-center text-sm ${
                                                        isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                                                    }`}>
                                                        Loading project heads...
                                                    </div>
                                                )}
                                                {!fetchingManagers && managers.length > 0 && (
                                                    <select
                                                        className={`w-full p-4 rounded-2xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                            isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-black/20 border-gray-700 text-white'
                                                        }`}
                                                        value={svc.manager}
                                                        onChange={e => handleServiceChange(sIdx, 'manager', e.target.value)}
                                                    >
                                                        <option value="">-- Select a Manager --</option>
                                                        {managers.map(m => {
                                                            const managerId = m._id || m.userId?._id;
                                                            const managerName = m.name || m.username || 'Unknown Manager';
                                                            return (
                                                                <option key={managerId} value={managerId}>
                                                                    {managerName}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                )}
                                            </div>

                                            {/* Team Selection Section */}
                                            <div className={`mt-4 p-5 rounded-2xl border-2 space-y-5 ${
                                                isLight ? 'bg-orange-50/50 border-orange-200' : 'bg-orange-500/5 border-orange-500/20'
                                            }`}>
                                                <p className="text-sm font-bold uppercase text-orange-600">
                                                    👥 Team for {svc.subscriptionCategory}
                                                </p>

                                                {/* Employee Selection */}
                                                <div>
                                                    <label className="text-xs font-bold text-orange-600 uppercase mb-2 block">
                                                        Select Team Members ({currentTeamSelection.length} selected):
                                                    </label>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                                                        {employees && employees.length > 0 ? employees.map(emp => {
                                                            const empId = emp._id || emp.userId?._id;
                                                            const isSelected = currentTeamSelection.includes(empId);
                                                            const specialization = emp?.department || emp?.position || emp?.subcategory || emp?.role || 'Employee';
                                                            
                                                            return (
                                                                <label
                                                                    key={empId}
                                                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                                                                        isSelected
                                                                            ? isLight
                                                                                ? 'bg-green-100 border-green-400 shadow-sm'
                                                                                : 'bg-green-500/20 border-green-500'
                                                                            : isLight
                                                                                ? 'bg-white border-gray-200 hover:bg-gray-50'
                                                                                : 'bg-black/20 border-gray-700 hover:bg-white/5'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleTeamMember(sIdx, empId)}
                                                                        className="w-4 h-4 accent-green-500"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-sm font-bold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                                            {emp.name || emp.username}
                                                                        </p>
                                                                        <p className="text-[10px] text-gray-500 truncate">
                                                                            {specialization}
                                                                        </p>
                                                                    </div>
                                                                    {isSelected && (
                                                                        <span className="text-green-500 font-bold text-sm">✓</span>
                                                                    )}
                                                                </label>
                                                            );
                                                        }) : (
                                                            <p className="text-xs text-gray-500 italic col-span-full py-4 text-center">No employees available</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={addMoreService}
                                    className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 font-bold transition-all ${
                                        isLight 
                                            ? 'border-blue-300 text-blue-600 hover:bg-blue-50' 
                                            : 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10'
                                    }`}
                                >
                                    <FiPlus size={20} />
                                    Add Another Service Form
                                </button>
                            </div>
                        </form>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            form="subscriptionForm"
                            disabled={loading || formData.services.some(s => !s.projectTitle || !s.start)}
                            className="w-full mt-8 bg-gradient-to-br from-[#004AAD] to-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/20 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
                        >
                            {loading ? "Completing Onboarding..." : "Add Subscription Member"}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}