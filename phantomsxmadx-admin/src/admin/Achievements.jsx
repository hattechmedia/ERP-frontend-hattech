import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiAward, FiCalendar, FiUser, FiFileText } from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Achievements() {
    const { confirm } = useModal();
    const [achievements, setAchievements] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAchievementId, setEditingAchievementId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
    const role = (user.role || "").toLowerCase();

    const [form, setForm] = useState({
        user: "",
        title: "",
        description: "",
        awardType: "Other",
        date: new Date().toISOString().split('T')[0],
        images: []
    });

    const [editForm, setEditForm] = useState({
        user: "",
        title: "",
        description: "",
        awardType: "Other",
        date: new Date().toISOString().split('T')[0],
        images: []
    });

    const awardTypes = [
        'Employee of the Month',
        'Employee of 6 Months',
        'Employee of the Year',
        'Outstanding Performance',
        'Milestone Achievement',
        'Other'
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [achRes, empRes] = await Promise.all([
                api.get('/achievements'),
                api.get('/employees')
            ]);
            
            if (achRes.data.success) {
                setAchievements(achRes.data.data);
            }
            if (empRes.data.success) {
                const activeEmps = (empRes.data.data || []).filter(e => e.status !== 'inactive');
                activeEmps.sort((a, b) => {
                    const nameA = (a.name || a.username || "").toLowerCase();
                    const nameB = (b.name || b.username || "").toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                setEmployees(activeEmps);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load achievements");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAchievement = async (e) => {
        e.preventDefault();
        if (!form.user || !form.title) {
            toast.error("Please select an employee and enter a title");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await api.post('/achievements', form);
            if (res.data.success) {
                toast.success("Achievement added successfully!");
                setShowAddModal(false);
                setForm({
                    user: "",
                    title: "",
                    description: "",
                    awardType: "Other",
                    date: new Date().toISOString().split('T')[0],
                    images: []
                });
                fetchData();
            }
        } catch (error) {
            console.error("Failed to add achievement", error);
            toast.error(error.response?.data?.message || "Failed to add achievement");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEditModal = (ach) => {
        setEditingAchievementId(ach._id);
        const formattedDate = ach.date ? new Date(ach.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        setEditForm({
            user: ach.user?._id || ach.user || "",
            title: ach.title || "",
            description: ach.description || "",
            awardType: ach.awardType || "Other",
            date: formattedDate,
            images: ach.images || []
        });
        setShowEditModal(true);
    };

    const handleUpdateAchievement = async (e) => {
        e.preventDefault();
        if (!editForm.user || !editForm.title) {
            toast.error("Please select an employee and enter a title");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await api.put(`/achievements/${editingAchievementId}`, editForm);
            if (res.data.success) {
                toast.success("Achievement updated successfully!");
                setShowEditModal(false);
                setEditingAchievementId(null);
                fetchData();
            }
        } catch (error) {
            console.error("Failed to update achievement", error);
            toast.error(error.response?.data?.message || "Failed to update achievement");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Achievement',
            message: 'Are you sure you want to delete this achievement record?',
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!isConfirmed) return;

        try {
            const res = await api.delete(`/achievements/${id}`);
            if (res.data.success) {
                toast.success("Achievement deleted");
                setAchievements(achievements.filter(a => a._id !== id));
            }
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error("Failed to delete achievement");
        }
    };

    const filteredAchievements = achievements.filter(ach => 
        (ach.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ach.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ach.awardType || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 pt-14 md:pt-0 pb-10">
            {/* HEADER */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-theme-primary transition-colors flex items-center gap-3">
                        <FiAward className="text-yellow-500" /> Employee Achievements
                    </h1>
                    <p className="text-sm text-theme-secondary transition-colors">Recognize and celebrate employee success</p>
                </div>
                {(role === 'admin' || role === 'hr' || role === 'it_support') && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-2.5 rounded-xl bg-[#004AAE] text-white hover:bg-blue-600 transition flex items-center gap-2 font-bold shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <FiPlus /> Add Achievement
                    </button>
                )}
            </div>

            {/* SEARCH */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by employee name, title or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-6 pr-4 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition-all shadow-sm"
                />
            </div>

            {/* GRID VIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAchievements.length === 0 ? (
                    <div className="col-span-full py-20 text-center space-y-4">
                        <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                            <FiAward size={40} className="text-gray-400" />
                        </div>
                        <p className="text-theme-secondary text-lg">No achievements recorded yet.</p>
                    </div>
                ) : (
                    filteredAchievements.map((ach) => (
                        <motion.div
                            key={ach._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-xl relative group overflow-hidden hover:border-yellow-500/50 transition-all"
                        >
                            {/* Award Badge Overlay Appearance */}
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-yellow-400/10 rounded-full blur-2xl group-hover:bg-yellow-400/20 transition-all"></div>
                            
                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={ach.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ach.user?.name || 'User')}`}
                                        className="w-12 h-12 rounded-xl object-cover border-2 border-yellow-500/20"
                                        alt={ach.user?.name}
                                    />
                                    <div>
                                        <h3 className="font-bold text-theme-primary leading-tight">{ach.user?.name || "Unknown User"}</h3>
                                        <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-black uppercase tracking-widest mt-0.5">
                                            <FiAward /> {ach.awardType}
                                        </div>
                                    </div>
                                </div>
                                {(role === 'admin' || role === 'hr' || role === 'it_support') && (
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => handleOpenEditModal(ach)}
                                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Edit Achievement"
                                        >
                                            <FiEdit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(ach._id)}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete Achievement"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 relative z-10">
                                <h4 className="text-lg font-bold text-theme-primary leading-snug">{ach.title}</h4>
                                <p className="text-sm text-theme-secondary line-clamp-3 leading-relaxed">
                                    {ach.description || "No description provided."}
                                </p>
                                
                                <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-medium text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <FiCalendar /> {new Date(ach.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-1 italic">
                                        Issued by: {ach.issuedBy?.name || "Admin"}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* ADD MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--bg-card)] rounded-2xl p-8 w-full max-w-lg border border-[var(--border-color)] shadow-2xl relative"
                        >
                            <h3 className="font-bold text-2xl mb-6 text-theme-primary flex items-center gap-2">
                                <FiAward className="text-yellow-500" /> New Achievement
                            </h3>

                            <form onSubmit={handleAddAchievement} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-2 text-theme-secondary">Select Employee *</label>
                                    <select
                                        value={form.user}
                                        onChange={(e) => setForm({ ...form, user: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition outline-none"
                                        required
                                    >
                                        <option value="">Choose Employee</option>
                                        {employees.map(emp => {
                                            const targetId = emp.userId?._id || emp.userId || emp._id;
                                            return (
                                                <option key={emp._id || targetId} value={targetId}>
                                                    {emp.name || emp.username} ({emp.email || 'N/A'})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-theme-secondary">Award Type</label>
                                        <select
                                            value={form.awardType}
                                            onChange={(e) => setForm({ ...form, awardType: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition outline-none"
                                        >
                                            {awardTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-theme-secondary">Award Date</label>
                                        <input
                                            type="date"
                                            value={form.date}
                                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-2 text-theme-secondary">Achievement Title *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Employee of the Month - June"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-2 text-theme-secondary">Description</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Add some details about this recognition..."
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition outline-none resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 justify-end mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-6 py-2.5 rounded-xl bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 transition font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-2.5 rounded-xl bg-[#004AAE] text-white hover:bg-blue-600 transition font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {isSubmitting ? "Issuing..." : "Issue Award"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EDIT MODAL */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--bg-card)] rounded-2xl p-8 w-full max-w-lg border border-[var(--border-color)] shadow-2xl relative"
                        >
                            <h3 className="font-bold text-2xl mb-6 text-theme-primary flex items-center gap-2">
                                <FiEdit2 className="text-[#004AAE]" /> Edit Achievement
                            </h3>

                            <form onSubmit={handleUpdateAchievement} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-2 text-theme-secondary">Select Employee *</label>
                                    <select
                                        value={editForm.user}
                                        onChange={(e) => setEditForm({ ...editForm, user: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition outline-none"
                                        required
                                    >
                                        <option value="">Choose Employee</option>
                                        {employees.map(emp => {
                                            const targetId = emp.userId?._id || emp.userId || emp._id;
                                            return (
                                                <option key={emp._id || targetId} value={targetId}>
                                                    {emp.name || emp.username} ({emp.email || 'N/A'})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-theme-secondary">Award Type</label>
                                        <select
                                            value={editForm.awardType}
                                            onChange={(e) => setEditForm({ ...editForm, awardType: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition outline-none"
                                        >
                                            {awardTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-theme-secondary">Award Date</label>
                                        <input
                                            type="date"
                                            value={editForm.date}
                                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-2 text-theme-secondary">Achievement Title *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Employee of the Month - June"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-2 text-theme-secondary">Description</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Add some details about this recognition..."
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition outline-none resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 justify-end mt-8">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingAchievementId(null);
                                        }}
                                        className="px-6 py-2.5 rounded-xl bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 transition font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-2.5 rounded-xl bg-[#004AAE] text-white hover:bg-blue-600 transition font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {isSubmitting ? "Updating..." : "Update Achievement"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
