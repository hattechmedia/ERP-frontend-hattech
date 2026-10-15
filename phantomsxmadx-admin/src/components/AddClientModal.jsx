import { useState, useEffect } from "react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiX, FiMail, FiPhone, FiBriefcase } from "react-icons/fi";
import { toast } from "react-hot-toast";

const extractUsername = (input) => {
    if (!input) return "";
    let clean = input.trim();
    clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/|tiktok\.com\/@?|facebook\.com\/|x\.com\/|twitter\.com\/)/i, '');
    clean = clean.replace(/\/.*$/, '');
    clean = clean.replace(/^@/, '');
    return clean.trim();
};

export default function AddClientModal({ isOpen, onClose, onSave, isLight }) {
    const [formData, setFormData] = useState({
        contactPerson: "",
        email: "",
        companyName: "",
        phone: "",
        password: "",
        role: "client",
        socialUsername: "",
        socialAccount1: "",
        socialAccount2: "",
        projects: []
    });

    const [projects, setProjects] = useState([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const loadProjects = async () => {
                try {
                    const res = await api.get('/projects');
                    if (res.data.success) {
                        // Filter for only Monthly Subscription projects
                        const subProjects = res.data.data.filter(p => p.isSubscription === true);
                        setProjects(subProjects);
                    }
                } catch (error) {
                    console.error("Failed to load projects", error);
                }
            };
            loadProjects();
        }
    }, [isOpen]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.contactPerson || !formData.email || !formData.companyName) {
            toast.error("Please fill in Name, Email, and Company.");
            return;
        }

        try {
            setLoading(true);
            const user1 = extractUsername(formData.socialAccount1 || formData.socialUsername);
            const user2 = extractUsername(formData.socialAccount2);

            const payload = {
                ...formData,
                socialUsername: user1,
                socialAccounts: {
                    account1: user1,
                    account2: user2,
                    instagram: user1
                },
                projects: selectedProjectIds
            };

            const res = await api.post('/clients', payload);

            if (res.data.success) {
                const savedClient = res.data.data;

                // Bulk update projects to link to this client
                if (selectedProjectIds.length > 0) {
                    await Promise.all(selectedProjectIds.map(projectId => 
                        api.put(`/projects/${projectId}`, { client: savedClient._id || savedClient.id })
                    ));
                }

                onSave(savedClient);
                setFormData({ 
                    contactPerson: "", 
                    email: "", 
                    companyName: "", 
                    phone: "", 
                    password: "", 
                    role: "client", 
                    socialUsername: "", 
                    socialAccount1: "", 
                    socialAccount2: "",
                    projects: [] 
                });
                setSelectedProjectIds([]);
                toast.success("Client saved successfully!");
                onClose();
            }
        } catch (error) {
            console.error("Failed to save client", error);
            toast.error("Failed to save client");
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
                        className={`w-full max-w-lg rounded-2xl p-6 md:p-8 shadow-2xl border transition-all duration-300 ${
                            isLight ? 'bg-white border-gray-100' : 'bg-[#1a1433] border-gray-700'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Add New Client</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <FiX size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Full Name</label>
                                <input
                                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                        isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                    }`}
                                    value={formData.contactPerson}
                                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Company</label>
                                    <input
                                        className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                            isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                        }`}
                                        value={formData.companyName}
                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                        placeholder="e.g. Acme Corp"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Phone</label>
                                    <input
                                        className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                            isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                        }`}
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Email Address</label>
                                <input
                                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                        isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                    }`}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="client@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Password</label>
                                <input
                                    type="password"
                                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                        isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                    }`}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Set Client Password"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block">
                                        Social Profile 1 (URL or Handle)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-3.5 text-gray-400 font-bold text-sm">@ / URL</span>
                                        <input
                                            className={`w-full pl-20 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                            }`}
                                            value={formData.socialAccount1 || formData.socialUsername || ""}
                                            onChange={e => setFormData({ ...formData, socialAccount1: e.target.value, socialUsername: e.target.value })}
                                            placeholder="instagram.com/username or @username"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block">
                                        Social Profile 2 - Optional (URL or Handle)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-3.5 text-gray-400 font-bold text-sm">@ / URL</span>
                                        <input
                                            className={`w-full pl-20 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all ${
                                                isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                            }`}
                                            value={formData.socialAccount2 || ""}
                                            onChange={e => setFormData({ ...formData, socialAccount2: e.target.value })}
                                            placeholder="instagram.com/brand2 or @brand2"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Live followers, following and total posts count will sync automatically via API into the client's portal.</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Link Projects</label>
                                <div className={`grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 rounded-xl border ${
                                    isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#0f0b1f] border-gray-700'
                                }`}>
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
                                            <span className={`text-[11px] truncate ${isLight ? 'text-gray-700' : 'text-gray-300'} group-hover:text-[#004AAD]`}>
                                                {p.title || p.project}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 bg-[#004AAD] hover:bg-[#003882] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#004AAD]/20 transition-all disabled:opacity-50"
                            >
                                {loading ? "Saving Client..." : "Save Client Member"}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
