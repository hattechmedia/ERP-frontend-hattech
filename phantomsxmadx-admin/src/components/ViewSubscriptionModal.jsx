import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiZap, FiUser, FiBriefcase, FiCalendar, FiDollarSign, FiGlobe, FiMail, FiPhone, FiActivity } from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";

export default function ViewSubscriptionModal({ isOpen, onClose, project, isLight }) {
    if (!project) return null;

    const [localStatus, setLocalStatus] = useState(project.status || "active");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (project) setLocalStatus(project.status || "active");
    }, [project]);

    const handleStatusToggle = async (newStatus) => {
        try {
            setUpdating(true);
            const res = await api.put(`/projects/${project._id}`, { status: newStatus });
            if (res.data.success) {
                setLocalStatus(newStatus);
                toast.success(`Subscription marked as ${newStatus}`);
            }
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const calculateDaysLeft = (expiryDate) => {
        if (!expiryDate) return "N/A";
        const diff = new Date(expiryDate) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const daysLeft = calculateDaysLeft(project.subscriptionExpiryDate);
    const modalBg = isLight ? "bg-white border-gray-100" : "bg-[#151235] border-[#312e81]";
    const textMain = isLight ? "text-gray-900" : "text-white";
    const textSec = isLight ? "text-gray-500" : "text-[#8b949e]";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[110] backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className={`w-full max-w-3xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border ${modalBg}`}
                    >
                        {/* HEADER */}
                        <div className="flex justify-between items-start mb-10">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-[#004AAD]/10 text-[#004AAD] flex items-center justify-center shadow-inner">
                                    <FiZap size={32} />
                                </div>
                                <div>
                                    <h2 className={`text-3xl font-black ${textMain} tracking-tighter`}>{project.title}</h2>
                                    <span className="text-xs font-black text-[#004AAD] uppercase tracking-widest bg-[#004AAD]/10 px-3 py-1 rounded-full border border-[#004AAD]/20">
                                        {project.subscriptionCategory || "Monthly Retainer"}
                                    </span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 bg-gray-100/5 hover:bg-gray-100/10 rounded-full transition-colors">
                                <FiX size={24} className={textSec} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* CLIENT DETAILS */}
                            <div className="space-y-8">
                                <h3 className="text-sm font-black text-[#004AAD] uppercase tracking-[0.2em] flex items-center gap-2">
                                    <FiUser /> Client Information
                                </h3>
                                <div className="space-y-6">
                                    <DetailItem icon={<FiUser />} label="Contact Person" value={project.client?.contactPerson || project.client?.name || "N/A"} isLight={isLight} />
                                    <DetailItem icon={<FiBriefcase />} label="Company Name" value={project.client?.companyName || "N/A"} isLight={isLight} />
                                    <DetailItem icon={<FiMail />} label="Email Address" value={project.client?.email || "N/A"} isLight={isLight} />
                                    <DetailItem icon={<FiPhone />} label="Phone Number" value={project.client?.phone || "N/A"} isLight={isLight} />
                                </div>
                            </div>

                            {/* SUBSCRIPTION DETAILS */}
                            <div className="space-y-8">
                                <h3 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <FiCalendar /> Subscription Terms
                                </h3>
                                <div className="space-y-6">
                                    <DetailItem icon={<FiCalendar />} label="Start Date" value={new Date(project.subscriptionStartDate || project.startDate).toLocaleDateString()} isLight={isLight} />
                                    <DetailItem icon={<FiZap />} label="Renewal Date" value={new Date(project.subscriptionExpiryDate || project.deadline).toLocaleDateString()} isLight={isLight} />
                                    <DetailItem icon={<FiDollarSign />} label="Monthly Fee" value={`$${project.subscriptionFee || 0}`} isLight={isLight} />
                                    <div className="p-4 rounded-2xl bg-[#004AAD] text-white shadow-xl shadow-blue-500/20">
                                        <p className="text-[10px] font-bold uppercase opacity-70 mb-3">Subscription Management</p>
                                        <div className="flex bg-white/10 rounded-xl p-1 gap-1 mb-4">
                                            <button 
                                                onClick={() => handleStatusToggle("active")}
                                                disabled={updating}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${localStatus === 'active' ? 'bg-white text-[#004AAD] shadow-lg' : 'text-white/50 hover:text-white'}`}
                                            >
                                                Active
                                            </button>
                                            <button 
                                                onClick={() => handleStatusToggle("on-hold")}
                                                disabled={updating}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${localStatus !== 'active' ? 'bg-red-500 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                                            >
                                                Inactive
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center opacity-80 pt-2 border-t border-white/10">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Time Remaining</span>
                                            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-lg">
                                                {daysLeft} Days
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER ACTION */}
                        <div className="mt-12 pt-8 border-t border-gray-100/10 flex justify-end">
                            <button 
                                onClick={onClose}
                                className="px-10 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition active:scale-95 shadow-lg"
                            >
                                Close Details
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function DetailItem({ icon, label, value, isLight }) {
    return (
        <div className="flex items-start gap-4 group">
            <div className={`mt-1 p-2 rounded-lg transition-colors ${isLight ? 'bg-gray-100 text-gray-500 group-hover:bg-[#004AAD]/10 group-hover:text-[#004AAD]' : 'bg-white/5 text-gray-400 group-hover:bg-[#004AAD]/20 group-hover:text-blue-400'}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className={`text-base font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>{value}</p>
            </div>
        </div>
    );
}
