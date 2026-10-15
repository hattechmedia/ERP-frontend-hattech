import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiMail, FiPhone, FiBriefcase, FiEye, FiEyeOff } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";

const extractUsername = (input) => {
    if (!input) return "";
    let clean = input.trim();
    clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/|tiktok\.com\/@?|facebook\.com\/|x\.com\/|twitter\.com\/)/i, '');
    clean = clean.replace(/\/.*$/, '');
    clean = clean.replace(/^@/, '');
    return clean.trim();
};

export default function Clients() {
    const { confirm } = useModal();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isLight, setIsLight] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        setIsLight(document.body.classList.contains('light'));
        const observer = new MutationObserver(() => {
            setIsLight(document.body.classList.contains('light'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const initialFormState = {
        id: "",
        _id: "",
        contactPerson: "",
        email: "",
        companyName: "",
        phone: "",
        password: "",
        role: "client",
        clientType: "monthly",
        currency: "EUR",
        subscriptionAmount: 0,
        subscriptionStartDate: "",
        milestones: [
            { name: "Milestone 1", price: "", status: "pending" },
            { name: "Milestone 2", price: "", status: "pending" },
            { name: "Milestone 3", price: "", status: "pending" }
        ],
        projects: []
    };

    // Form State
    const [formData, setFormData] = useState(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [projects, setProjects] = useState([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState([]); // Array of IDs

    const getRate = (code) => {
        switch (code) {
            case 'USD': return 1.08;
            case 'GBP': return 0.85;
            case 'CHF': return 0.96;
            case 'EUR': return 1.0;
            default: return 1.0;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [clientRes, projectRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/projects')
                ]);

                if (clientRes.data.success) {
                    setClients(clientRes.data.data);
                }
                if (projectRes.data.success) {
                    // Filter projects that don't have a client or allow re-assignment?
                    // For now just load all projects
                    setProjects(projectRes.data.data);
                }
            } catch (error) {
                console.error("Failed to load clients/projects", error);
            }
        };

        loadData();

        // Theme check
        const checkTheme = () => {
            setIsLight(document.body.classList.contains('light'));
        };
        checkTheme();
        window.addEventListener('storage', checkTheme);
        window.addEventListener('theme-change', checkTheme);
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => {
            window.removeEventListener('storage', checkTheme);
            window.removeEventListener('theme-change', checkTheme);
            observer.disconnect();
        };
    }, []);

    const handleSave = async () => {
        if (!formData.contactPerson || !formData.email || !formData.companyName) {
            toast.error("Please fill in Name, Email, and Company.");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                contactPerson: formData.contactPerson,
                email: formData.email,
                password: formData.password,
                companyName: formData.companyName,
                phone: formData.phone,
                role: 'client',
                clientType: formData.clientType,
                currency: formData.currency || "EUR",
                subscriptionAmount: Number(formData.subscriptionAmount || 0),
                subscriptionStartDate: formData.subscriptionStartDate || null,
                subscriptionRenewalDate: formData.subscriptionRenewalDate || null,
                milestones: formData.clientType === 'service' ? formData.milestones.filter(m => m.name && m.price) : [],
                projects: selectedProjectIds
            };

            let res;
            if (isEditing) {
                const targetId = formData._id || formData.id;
                res = await api.put(`/clients/${targetId}`, payload);
            } else {
                res = await api.post('/clients', payload);
            }

            if (res.data.success) {
                const savedClient = res.data.data;

                // Bulk update projects to link to this client
                if (selectedProjectIds.length > 0) {
                    await Promise.all(selectedProjectIds.map(projectId => 
                        api.put(`/projects/${projectId}`, { client: savedClient._id || savedClient.id })
                    ));
                }

                // Refresh List
                const clientRes = await api.get('/clients');
                setClients(clientRes.data.data);

                setShowModal(false);
                setFormData(initialFormState);
                setSelectedProjectIds([]);
                setIsEditing(false);
                toast.success("Client saved successfully!");
            }
        } catch (error) {
            console.error("Failed to save client", error);
            toast.error("Failed to save client");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Client',
            message: 'Are you sure you want to delete this client? This will remove their access and project links.',
            type: 'danger',
            confirmText: 'Delete Client',
            cancelText: 'Keep Client'
        });

        if (isConfirmed) {
            try {
                await api.delete(`/clients/${id}`);
                setClients(clients.filter(c => c._id !== id));
                toast.success("Client deleted successfully");
            } catch (error) {
                console.error("Failed to delete client", error);
                toast.error("Failed to delete client");
            }
        }
    };

    const openEdit = (client) => {
        setFormData({ 
            ...client, 
            password: "",
            clientType: client.clientType || "monthly",
            currency: client.currency || "EUR",
            subscriptionAmount: client.subscriptionAmount || 0,
            subscriptionStartDate: client.subscriptionStartDate ? new Date(client.subscriptionStartDate).toISOString().split('T')[0] : "",
            subscriptionRenewalDate: client.subscriptionRenewalDate ? new Date(client.subscriptionRenewalDate).toISOString().split('T')[0] : "",
            milestones: client.milestones || [
                { name: "Milestone 1", price: "", status: "pending" },
                { name: "Milestone 2", price: "", status: "pending" },
                { name: "Milestone 3", price: "", status: "pending" }
            ]
        });
        setSelectedProjectIds(client.projects?.map(p => p._id || p) || []);
        setIsEditing(true);
        setShowModal(true);
    };
    const handleMilestoneChange = (index, field, value) => {
        const updated = [...formData.milestones];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, milestones: updated });
    };

    const addMilestoneRow = () => {
        setFormData({
            ...formData,
            milestones: [...formData.milestones, { name: `Milestone ${formData.milestones.length + 1}`, price: "", status: "pending" }]
        });
    };

    const removeMilestoneRow = (index) => {
        setFormData({
            ...formData,
            milestones: formData.milestones.filter((_, idx) => idx !== index)
        });
    };


    const filteredClients = clients.filter(c =>
        (c.contactPerson && c.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
        (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6 pt-14 md:pt-0 pb-10">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Client Management</h1>
                    <p className="text-sm text-gray-400">Manage your client accounts and access.</p>
                </div>
                <button
                    onClick={() => { setIsEditing(false); setFormData(initialFormState); setShowModal(true); }}
                    className="bg-[#004AAD] hover:bg-[#003882] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-[#004AAD]/20"
                >
                    <FiPlus /> Add Client
                </button>
            </div>

            {/* SEARCH */}
            <div className={`flex items-center px-4 py-3 rounded-lg border transition shadow-sm focus-within:ring-2 focus-within:ring-[#004AAD] ${isLight ? 'bg-white border-gray-200' : 'bg-[#1a1433] border-gray-700'}`}>
                <FiSearch className="text-gray-500 mr-3" size={20} />
                <input
                    type="text"
                    placeholder="Search by name or company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`flex-1 bg-transparent border-none outline-none text-base ${isLight ? 'text-gray-800 placeholder-gray-500' : 'text-white placeholder-gray-400'}`}
                />
            </div>

            {/* CLIENTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredClients.map(client => (
                        <motion.div
                            key={client._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => navigate(`/admin/client/${client._id}`)}
                            className={`p-6 rounded-xl border relative group transition-all duration-300 cursor-pointer ${isLight ? 'bg-white border-gray-200 hover:shadow-lg' : 'bg-[#1a1433] border-gray-700 hover:border-[#004AAD]/50'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-full bg-[#004AAD]/10 text-[#004AAD]">
                                    <FiBriefcase size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); openEdit(client); }} className="p-2 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition"><FiEdit2 /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(client._id); }} className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition"><FiTrash2 /></button>
                                </div>
                            </div>

                            <h3 className={`text-xl font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{client.contactPerson}</h3>
                            <p className={`text-sm font-bold mb-4 ${isLight ? 'text-[#004AAD]' : 'text-[#004AAD]'}`}>{client.companyName}</p>

                            <div className={`space-y-2 text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                                <div className="flex items-center gap-2">
                                    <FiMail /> {client.email}
                                </div>
                                <div className="flex items-center gap-2">
                                    <FiPhone /> {client.phone || "N/A"}
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${
                                    client.clientType === 'service'
                                        ? 'bg-pink-500/10 text-pink-500'
                                        : 'bg-[#004AAD]/10 text-[#004AAD]'
                                }`}>
                                    {client.clientType === 'service' ? 'Service Base' : 'Monthly Subs'}
                                </span>
                                <span className={`text-xs font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                    {client.clientType === 'service'
                                        ? `${client.currency || 'EUR'} ${(client.milestones || []).reduce((acc, m) => acc + (Number(m.price) || 0), 0)}`
                                        : `${client.currency || 'EUR'} ${client.subscriptionAmount || 0}/mo`
                                    }
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredClients.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    No clients found.
                </div>
            )}

            {/* MODAL */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar ${isLight ? 'bg-white' : 'bg-[#1a1433] border border-gray-700'}`}
                        >
                            <h2 className={`text-2xl font-bold mb-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>{isEditing ? "Edit Client" : "Add New Client"}</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400 mb-2 block">Client Billing Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, clientType: 'monthly' })}
                                            className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                                                formData.clientType === 'monthly'
                                                    ? 'bg-[#004AAD] text-white border-[#004AAD] shadow-md shadow-[#004AAD]/20'
                                                    : isLight
                                                    ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                                    : 'bg-[#0f0b1f] border-gray-700 text-gray-300 hover:bg-[#15102a]'
                                            }`}
                                        >
                                            Monthly Subscription
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, clientType: 'service' })}
                                            className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                                                formData.clientType === 'service'
                                                    ? 'bg-[#e91e63] text-white border-[#e91e63] shadow-md shadow-[#e91e63]/20'
                                                    : isLight
                                                    ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                                    : 'bg-[#0f0b1f] border-gray-700 text-gray-300 hover:bg-[#15102a]'
                                            }`}
                                        >
                                            Service / Milestones
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Currency</label>
                                    <select
                                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-bold ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                        value={formData.currency || "EUR"}
                                        onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                    >
                                        <option value="EUR">EUR (€ - Euro)</option>
                                        <option value="USD">USD ($ - US Dollar)</option>
                                        <option value="GBP">GBP (£ - British Pound)</option>
                                        <option value="CHF">CHF (Swiss Franc)</option>
                                    </select>
                                </div>

                                {formData.clientType === 'monthly' && (
                                    <>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-1 block">Monthly Subscription Amount ({formData.currency || "EUR"})</label>
                                            <input
                                                type="number"
                                                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none font-bold ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                                value={formData.subscriptionAmount}
                                                onChange={e => setFormData({ ...formData, subscriptionAmount: e.target.value })}
                                                placeholder="e.g. 500"
                                            />
                                        </div>

                                        {formData.currency !== "EUR" && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Converted Equivalent (EUR)</label>
                                                    <span className="text-[10px] text-gray-400 font-medium">Rate: 1 {formData.currency} = {getRate(formData.currency)} EUR</span>
                                                </div>
                                                <div className={`w-full p-3 rounded-lg border font-black text-sm flex items-center justify-between shadow-inner ${isLight ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800' : 'bg-[#0a1820] border-emerald-500/40 text-emerald-400'}`}>
                                                    <span>€ {((parseFloat(formData.subscriptionAmount) || 0) * getRate(formData.currency)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase font-bold tracking-wider">Auto Converted</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Start Date</label>
                                                <input
                                                    type="date"
                                                    className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                                    value={formData.subscriptionStartDate}
                                                    onChange={e => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Renewal Date</label>
                                                <input
                                                    type="date"
                                                    className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                                    value={formData.subscriptionRenewalDate}
                                                    onChange={e => setFormData({ ...formData, subscriptionRenewalDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {formData.clientType === 'service' && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm text-gray-400 block font-bold">Project Milestones</label>
                                            <button
                                                type="button"
                                                onClick={addMilestoneRow}
                                                className="text-xs text-[#004AAD] dark:text-blue-400 hover:underline font-bold"
                                            >
                                                + Add Milestone
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                                            {formData.milestones.map((m, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <input
                                                        className={`flex-1 p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#004AAD] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                                        value={m.name}
                                                        onChange={e => handleMilestoneChange(idx, 'name', e.target.value)}
                                                        placeholder="Milestone Name"
                                                    />
                                                    <input
                                                        type="number"
                                                        className={`w-28 p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#004AAD] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                                        value={m.price}
                                                        onChange={e => handleMilestoneChange(idx, 'price', e.target.value)}
                                                        placeholder={`${formData.currency || "EUR"} Amount`}
                                                    />
                                                    <select
                                                        className={`p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#004AAD] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                                        value={m.status || 'pending'}
                                                        onChange={e => handleMilestoneChange(idx, 'status', e.target.value)}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="completed">Completed</option>
                                                    </select>
                                                    {formData.milestones.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMilestoneRow(idx)}
                                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded transition cursor-pointer"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Total Milestones Calculation & Dedicated Converted EUR Box */}
                                        {formData.currency !== "EUR" && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Converted (EUR)</label>
                                                    <span className="text-[10px] text-gray-400 font-medium">Rate: 1 {formData.currency} = {getRate(formData.currency)} EUR</span>
                                                </div>
                                                <div className={`w-full p-3 rounded-lg border font-black text-sm flex items-center justify-between shadow-inner ${isLight ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800' : 'bg-[#0a1820] border-emerald-500/40 text-emerald-400'}`}>
                                                    <span>€ {( (formData.milestones.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0)) * getRate(formData.currency) ).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase font-bold tracking-wider">Auto Converted</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Full Name</label>
                                    <input
                                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                        value={formData.contactPerson}
                                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Company Name</label>
                                    <input
                                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                        value={formData.companyName}
                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Email Address</label>
                                    <input
                                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="client@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className={`w-full p-3 pr-11 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Set Client Password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white transition cursor-pointer"
                                            title={showPassword ? "Hide Password" : "Show Password"}
                                        >
                                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Phone (Optional)</label>
                                    <input
                                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#004AAD] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'}`}
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Project</label>
                                    <div className={`grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 rounded-lg border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#0f0b1f] border-gray-700'}`}>
                                        {projects.map((p) => (
                                            <label key={p._id || p.id} className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-600 text-[#004AAD] focus:ring-[#004AAD] bg-transparent"
                                                    checked={selectedProjectIds.includes(p._id || p.id)}
                                                    onChange={(e) => {
                                                        const id = p._id || p.id;
                                                        if (e.target.checked) {
                                                            setSelectedProjectIds([...selectedProjectIds, id]);
                                                        } else {
                                                            setSelectedProjectIds(selectedProjectIds.filter(pid => pid !== id));
                                                        }
                                                    }}
                                                />
                                                <span className={`text-xs truncate ${isLight ? 'text-gray-700' : 'text-gray-300'} group-hover:text-[#004AAD]`}>
                                                    {p.title || p.project || p.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Select one or more projects to link to this client.
                                    </p>
                                </div>
                            </div>

                             <div className="flex gap-3 mt-8">
                                 <button onClick={() => setShowModal(false)} disabled={saving} className="flex-1 py-3 bg-gray-600/20 text-gray-400 rounded-lg font-bold hover:bg-gray-600/30 transition disabled:opacity-50">Cancel</button>
                                 <button
                                     onClick={handleSave}
                                     disabled={saving}
                                     className={`flex-1 py-3 text-white rounded-lg font-bold transition shadow-lg ${
                                         saving
                                             ? 'bg-gray-500 cursor-not-allowed shadow-none'
                                             : 'bg-[#004AAD] hover:bg-[#003882] shadow-[#004AAD]/20'
                                     }`}
                                 >
                                     {saving ? "Saving..." : "Save Client"}
                                 </button>
                             </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
