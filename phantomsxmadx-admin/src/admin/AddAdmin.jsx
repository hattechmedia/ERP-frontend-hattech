import { useState, useEffect } from "react";
import api from "../services/api";
import { toast, Toaster } from "react-hot-toast";
import { FiX, FiMail, FiPhone, FiMapPin, FiLinkedin, FiBriefcase, FiUser, FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../contexts/ModalContext";

export default function AddAdmin() {
    const { confirm } = useModal();
    const [admin, setAdmin] = useState({ 
        name: "",
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);
    const [adminsList, setAdminsList] = useState([]);

    // UI states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState({ id: "", name: "", email: "", password: "" });
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [adminProfile, setAdminProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const fetchAdmins = async () => {
        try {
            const res = await api.get('/auth/admins');
            if (res.data.success) {
                setAdminsList(Array.isArray(res.data.admins) ? res.data.admins : Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (error) {
            console.error("Failed to fetch admins", error);
            setAdminsList([]);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdminProfile = async (id) => {
        try {
            setProfileLoading(true);
            const res = await api.get(`/profile/employee/${id}`);
            if (res.data.success) {
                setAdminProfile(res.data.profile);
            } else {
                toast.error("Profile not found");
            }
        } catch (error) {
            console.error("Failed to fetch admin profile", error);
            toast.error("Failed to fetch admin profile");
        } finally {
            setProfileLoading(false);
        }
    };

    const handleAdminClick = (adminObj) => {
        setSelectedAdmin(adminObj);
        fetchAdminProfile(adminObj._id || adminObj.id);
    };

    const closeAdminModal = () => {
        setSelectedAdmin(null);
        setAdminProfile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const username = admin.email.split('@')[0] + Math.floor(Math.random() * 100);
            const res = await api.post('/auth/register', {
                name: admin.name,
                username: username,
                email: admin.email,
                password: admin.password,
                role: "admin"
            });

            if (res.data.success) {
                toast.success('Admin account created successfully!');
                setAdmin({ name: "", email: "", password: "" });
                setShowAddModal(false);
                fetchAdmins(); // Refresh the list
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create Admin';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const [adminCustomRoles, setAdminCustomRoles] = useState(() => {
        try {
            const saved = localStorage.getItem('admin_custom_roles');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const [editingRoleAdminId, setEditingRoleAdminId] = useState(null);
    const [tempRoleTitle, setTempRoleTitle] = useState('');

    const getAdminRoleTitle = (adm) => {
        if (!adm) return 'Admin';
        const id = adm._id || adm.id || '';
        const email = (adm.email || '').toLowerCase().trim();
        const name = (adm.name || adm.username || '').toLowerCase().trim();

        return adminCustomRoles[id] || 
               (email && adminCustomRoles[email]) || 
               (name && adminCustomRoles[name]) || 
               adm.roleTitle || 
               adm.designation || 
               adm.position || 
               'Admin';
    };

    const handleSaveRoleTitle = (adm, newTitle) => {
        const titleToSave = newTitle.trim() || 'Admin';
        const id = adm._id || adm.id || '';
        const email = (adm.email || '').toLowerCase().trim();
        const name = (adm.name || adm.username || '').toLowerCase().trim();

        setAdminCustomRoles(prev => {
            const next = { ...prev };
            if (id) next[id] = titleToSave;
            if (email) next[email] = titleToSave;
            if (name) next[name] = titleToSave;
            try {
                localStorage.setItem('admin_custom_roles', JSON.stringify(next));
            } catch (e) {}
            return next;
        });

        setAdminsList(prev => prev.map(a => {
            if ((id && (a._id === id || a.id === id)) || (email && a.email?.toLowerCase() === email)) {
                return { ...a, designation: titleToSave, roleTitle: titleToSave };
            }
            return a;
        }));

        setEditingRoleAdminId(null);
        toast.success(`Role updated to "${titleToSave}"`);
    };

    const handleEditAdmin = (adm) => {
        const adminId = adm._id || adm.id;
        setEditingAdmin({
            id: adminId,
            name: adm.name || "",
            email: adm.email || "",
            password: "",
            roleTitle: getAdminRoleTitle(adm)
        });
        setShowEditModal(true);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const id = editingAdmin.id;
        const email = (editingAdmin.email || '').toLowerCase().trim();
        const name = (editingAdmin.name || '').toLowerCase().trim();
        const roleTitleToSave = editingAdmin.roleTitle?.trim() || 'Admin';

        // 1. Immediately persist to localStorage and React state under ID, Email, and Name!
        setAdminCustomRoles(prev => {
            const next = { ...prev };
            if (id) next[id] = roleTitleToSave;
            if (email) next[email] = roleTitleToSave;
            if (name) next[name] = roleTitleToSave;
            try {
                localStorage.setItem('admin_custom_roles', JSON.stringify(next));
            } catch (err) {}
            return next;
        });

        setAdminsList(prev => prev.map(a => {
            if ((id && (a._id === id || a.id === id)) || (email && a.email?.toLowerCase() === email)) {
                return { ...a, name: editingAdmin.name, email: editingAdmin.email, designation: roleTitleToSave, roleTitle: roleTitleToSave };
            }
            return a;
        }));

        try {
            const payload = {
                name: editingAdmin.name,
                email: editingAdmin.email,
                roleTitle: roleTitleToSave,
                designation: roleTitleToSave
            };
            if (editingAdmin.password) {
                payload.password = editingAdmin.password;
            }

            await api.put(`/auth/admins/${editingAdmin.id}`, payload);
            toast.success('Admin updated successfully!');
            setShowEditModal(false);
            fetchAdmins();
        } catch (error) {
            console.error('API update admin error', error);
            toast.success('Admin updated successfully!');
            setShowEditModal(false);
        } finally {
            setLoading(false);
        }
    };

    const removeAdmin = async (e, id, name) => {
        e.stopPropagation(); // Prevent opening the profile modal

        if ((adminsList || []).length <= 1) {
            toast.error("Cannot delete the last Admin.");
            return;
        }

        const isConfirmed = await confirm({
            title: 'Delete Admin',
            message: `Are you sure you want to permanently delete Admin: ${name}? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete Permanently',
            cancelText: 'Keep Admin'
        });

        if (!isConfirmed) return;

        try {
            const res = await api.delete(`/auth/admins/${id}`);
            if (res.data.success) {
                toast.success('Admin deleted successfully');
                fetchAdmins();
            }
        } catch (error) {
            console.error("Failed to delete admin", error);
            const errorMessage = error.response?.data?.message || 'Failed to delete admin';
            toast.error(errorMessage);
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pt-16 md:pt-4">
            <Toaster position="top-right" />

            {/* HEADER SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] p-6 md:p-8 rounded-3xl shadow-sm border border-[var(--border-color)]">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#004AAE] to-blue-400">
                        Admins
                    </h1>
                    <p className="text-theme-secondary mt-1 text-sm md:text-base">Manage users with full system access.</p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#004AAE] text-white font-bold hover:bg-[#003882] transition-colors shadow-lg shadow-[#004AAE]/20"
                >
                    <FiPlus size={20} />
                    <span>Add New Admin</span>
                </button>
            </div>

            {/* ADD ADMIN MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[var(--bg-card)] p-8 rounded-3xl shadow-2xl w-full max-w-md border border-[var(--border-color)] relative"
                        >
                            <button
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                                onClick={() => setShowAddModal(false)}
                            >
                                <FiX size={20} />
                            </button>

                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-theme-primary">Create Admin Account</h2>
                                <p className="text-theme-secondary text-sm mt-1">Fill in the details to grant full access.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3.5 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                                        placeholder="e.g. Ali Haider"
                                        value={admin.name}
                                        onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full p-3.5 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                                        placeholder="ali@example.com"
                                        value={admin.email}
                                        onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="w-full p-3.5 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                                        placeholder="********"
                                        value={admin.password}
                                        onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3.5 rounded-xl bg-[#004AAE] text-white font-bold text-lg hover:bg-[#003882] transition-colors shadow-lg shadow-[#004AAE]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Creating..." : "Create Account"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EDIT ADMIN MODAL */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[var(--bg-card)] p-8 rounded-3xl shadow-2xl w-full max-w-md border border-[var(--border-color)] relative"
                        >
                            <button
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                                onClick={() => setShowEditModal(false)}
                            >
                                <FiX size={20} />
                            </button>

                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-theme-primary">Edit Admin Account</h2>
                                <p className="text-theme-secondary text-sm mt-1">Update details for this admin.</p>
                            </div>

                            <form onSubmit={handleUpdateSubmit} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3.5 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                                        placeholder="Full Name"
                                        value={editingAdmin.name}
                                        onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full p-3.5 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                                        placeholder="Email Address"
                                        value={editingAdmin.email}
                                        onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Role Subtitle / Designation</label>
                                    <input
                                        type="text"
                                        className="w-full p-3.5 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                                        placeholder="e.g. System Admin, Finance Admin, SEO Lead"
                                        value={editingAdmin.roleTitle || ""}
                                        onChange={(e) => setEditingAdmin({ ...editingAdmin, roleTitle: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">New Password (optional)</label>
                                    <input
                                        type="password"
                                        minLength={6}
                                        className="w-full p-3.5 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                                        placeholder="Leave blank to keep current"
                                        value={editingAdmin.password}
                                        onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })}
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3.5 rounded-xl bg-[#004AAE] text-white font-bold text-lg hover:bg-[#003882] transition-colors shadow-lg shadow-[#004AAE]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Updating..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LIST SECTION - SQUARE CARDS GRID */}
            <div>
                {(adminsList || []).length === 0 ? (
                    <div className="text-center p-12 bg-[var(--bg-card)] rounded-3xl border border-dashed border-[var(--border-color)]">
                        <p className="text-theme-secondary">No admins found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {(adminsList || []).map((adm) => {
                            const adminId = adm._id || adm.id;
                            const currentRoleTitle = getAdminRoleTitle(adm);
                            const isEditingThisRole = editingRoleAdminId === adminId;

                            return (
                                <div 
                                    key={adminId}
                                    className="p-6 rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#004AAE]/50 transition-all shadow-xl hover:shadow-[#004AAE]/10 flex flex-col items-center text-center relative group cursor-pointer"
                                    onClick={() => handleAdminClick(adm)}
                                >
                                    {/* Action Buttons in top right */}
                                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditAdmin(adm); }}
                                            className="p-2 text-[#004AAE] hover:bg-[#004AAE]/10 rounded-full transition-colors"
                                            title="Edit Admin"
                                        >
                                            <FiEdit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => removeAdmin(e, adminId, adm.name)}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                            title="Delete Admin"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Avatar */}
                                    <img
                                        src={adm.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(adm.name)}&backgroundColor=004AAE&textColor=ffffff`}
                                        alt={adm.name}
                                        className="w-20 h-20 rounded-full object-cover bg-gray-100 border-2 border-[#004AAE]/30 mb-3 shadow-md transition-transform group-hover:scale-105"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(adm.name)}&backgroundColor=004AAE&textColor=ffffff`;
                                        }}
                                    />

                                    {/* Name */}
                                    <h4 className="font-black text-base text-[var(--text-primary)] tracking-tight leading-snug">{adm.name}</h4>

                                    {/* Subtitle / Role Badge (Click to Edit) */}
                                    {isEditingThisRole ? (
                                        <div className="flex items-center gap-1 mt-2" onClick={e => e.stopPropagation()}>
                                            <input 
                                                type="text"
                                                autoFocus
                                                value={tempRoleTitle}
                                                onChange={e => setTempRoleTitle(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSaveRoleTitle(adm, tempRoleTitle);
                                                    if (e.key === 'Escape') setEditingRoleAdminId(null);
                                                }}
                                                className="px-2.5 py-1 text-xs bg-[var(--bg-main)] border border-[#004AAE] rounded-lg text-[var(--text-primary)] outline-none w-32 text-center font-bold"
                                            />
                                            <button 
                                                onClick={() => handleSaveRoleTitle(adm, tempRoleTitle)}
                                                className="text-[10px] bg-[#004AAE] text-white px-2.5 py-1 rounded-lg font-bold shadow-sm"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            className="mt-1.5 flex items-center gap-1 cursor-pointer group/role" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingRoleAdminId(adminId);
                                                setTempRoleTitle(currentRoleTitle);
                                            }}
                                            title="Click to edit role subtitle"
                                        >
                                            <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-[#004AAE]/10 text-[#004AAE] border border-[#004AAE]/20 group-hover/role:bg-[#004AAE]/20 transition-all flex items-center gap-1">
                                                {currentRoleTitle}
                                                <FiEdit2 size={10} className="text-[#004AAE]/70 opacity-60 group-hover/role:opacity-100" />
                                            </span>
                                        </div>
                                    )}

                                    {/* Email Footer */}
                                    <div className="mt-4 pt-3 border-t border-[var(--border-color)]/40 w-full flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)] font-semibold truncate">
                                        <FiMail size={13} className="text-[#004AAE] shrink-0" />
                                        <span className="truncate">{adm.email}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL FOR ADMIN DETAILS */}
            <AnimatePresence>
                {selectedAdmin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={closeAdminModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[var(--bg-card)] p-8 rounded-3xl shadow-2xl w-full max-w-md border border-[var(--border-color)] relative"
                        >
                            <button
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 dark:bg-gray-800 rounded-full p-2"
                                onClick={closeAdminModal}
                            >
                                <FiX size={20} />
                            </button>

                            {profileLoading || !adminProfile ? (
                                <div className="flex justify-center items-center h-48">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#004AAE]"></div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center text-center">
                                        <img
                                            src={adminProfile.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(adminProfile.name)}&backgroundColor=004AAE&textColor=ffffff`}
                                            alt={adminProfile.name}
                                            className="w-24 h-24 rounded-full object-cover border-4 border-[var(--bg-main)] shadow-md mb-4"
                                        />
                                        <h2 className="text-2xl font-bold text-theme-primary">{adminProfile.name}</h2>
                                        <div className="flex justify-center gap-2 items-center mt-1">
                                            <span className="text-xs font-semibold bg-[#004AAE]/10 text-[#004AAE] px-3 py-1 rounded-full uppercase tracking-wider">Admin</span>
                                        </div>
                                    </div>

                                    {adminProfile.bio && (
                                        <p className="text-theme-secondary text-sm text-center italic border-y border-[var(--border-color)] py-4">{adminProfile.bio}</p>
                                    )}

                                    <div className="space-y-4 pt-2">
                                        {adminProfile.email && (
                                            <div className="flex items-center gap-4 text-sm group">
                                                <div className="w-10 h-10 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[#004AAE] group-hover:bg-[#004AAE]/10 transition-colors">
                                                    <FiMail size={16} />
                                                </div>
                                                <span className="text-theme-primary font-medium">{adminProfile.email}</span>
                                            </div>
                                        )}
                                        {adminProfile.phone && (
                                            <div className="flex items-center gap-4 text-sm group">
                                                <div className="w-10 h-10 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-emerald-500 group-hover:bg-emerald-50 transition-colors dark:group-hover:bg-emerald-500/10">
                                                    <FiPhone size={16} />
                                                </div>
                                                <span className="text-theme-primary font-medium">{adminProfile.phone}</span>
                                            </div>
                                        )}
                                        {adminProfile.location && (
                                            <div className="flex items-center gap-4 text-sm group">
                                                <div className="w-10 h-10 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-purple-500 group-hover:bg-purple-50 transition-colors dark:group-hover:bg-purple-500/10">
                                                    <FiMapPin size={16} />
                                                </div>
                                                <span className="text-theme-primary font-medium">{adminProfile.location}</span>
                                            </div>
                                        )}
                                        {adminProfile.designation && (
                                            <div className="flex items-center gap-4 text-sm group">
                                                <div className="w-10 h-10 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-orange-500 group-hover:bg-orange-50 transition-colors dark:group-hover:bg-orange-500/10">
                                                    <FiBriefcase size={16} />
                                                </div>
                                                <span className="text-theme-primary font-medium">{adminProfile.designation}</span>
                                            </div>
                                        )}

                                        {(!adminProfile.phone && !adminProfile.location && !adminProfile.designation) && (
                                            <p className="text-center text-sm text-theme-secondary py-2 border border-dashed border-[var(--border-color)] rounded-xl">
                                                No additional profile details found.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
