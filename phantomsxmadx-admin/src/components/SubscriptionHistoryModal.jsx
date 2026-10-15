import { useState, useEffect } from "react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCalendar, FiClock, FiTrash2, FiRefreshCw, FiFileText } from "react-icons/fi";
import toast from "react-hot-toast";
import ConfirmModal from "./ConfirmModal";

export default function SubscriptionHistoryModal({ isOpen, onClose, project, isLight }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

    const handleSyncCurrentState = async () => {
        try {
            setLoading(true);
            const res = await api.put(`/projects/${project._id}`, {
                subscriptionSummary: project.subscriptionSummary,
                subscriptionSummaryImages: project.subscriptionSummaryImages
            });
            if (res.data.success) {
                toast.success("History Initialized");
                fetchHistory(); // Corrent function name
            }
        } catch (err) {
            toast.error("Sync failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReport = async (reportId) => {
        try {
            const res = await api.delete(`/subscriptions/reports/${reportId}`);
            if (res.data.success) {
                toast.success("Record deleted");
                setReports(reports.filter(r => r._id !== reportId));
                setConfirmConfig({ isOpen: false, id: null });
            }
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    useEffect(() => {
        if (isOpen && project) {
            fetchHistory(); // Correct function name
        }
    }, [isOpen, project]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/subscriptions/reports/${project._id}`);
            if (res.data.success) {
                setReports(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!project) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[120] backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className={`w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col rounded-[2.5rem] shadow-2xl border ${
                            isLight ? 'bg-white border-gray-100' : 'bg-[#0b0922] border-white/5'
                        }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-8 bg-blue-600 !text-white rounded-t-[2.5rem] border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <FiFileText size={24} style={{ color: 'white' }} className="!text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black uppercase tracking-tighter !text-white mb-0 piece-title" style={{ color: 'white' }}>Performance History</h2>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] !text-white/80 opacity-90" style={{ color: 'rgba(255,255,255,0.9)' }}>{project.title}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 !text-white rounded-full transition-all flex items-center justify-center">
                                <FiX size={20} style={{ color: 'white' }} className="!text-white" />
                            </button>
                        </div>

                        {/* DELETE REPORT CONFIRMATION */}
                        <ConfirmModal 
                            isOpen={confirmConfig.isOpen}
                            onClose={() => setConfirmConfig({ isOpen: false, id: null })}
                            onConfirm={() => handleDeleteReport(confirmConfig.id)}
                            title="Delete This Record?"
                            message="This specific daily performance report will be permanently removed from the history archive. This action cannot be undone."
                            confirmText="Delete Record"
                        />

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs font-bold text-white uppercase tracking-widest opacity-70">Loading Archive Records...</p>
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="text-center py-24">
                                    <FiClock size={56} className="mx-auto text-white mb-6 opacity-20" />
                                    <p className="text-white font-black uppercase tracking-[0.2em] text-sm opacity-80 mb-8">No historical records found for this subscription.</p>
                                    
                                    {(project?.subscriptionSummary || project?.subscriptionSummaryImages?.length > 0) && (
                                        <button 
                                            onClick={handleSyncCurrentState}
                                            className="px-8 py-4 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition shadow-2xl shadow-blue-500/40 flex items-center gap-3 mx-auto"
                                        >
                                            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                                            Initialize History with Latest Data
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    {reports.map((report, idx) => (
                                        <div key={report._id} className={`p-8 rounded-[2.5rem] border ${isLight ? 'bg-gray-50 border-gray-100 shadow-sm' : 'bg-white/5 border-white/10 shadow-2xl shadow-blue-500/5'}`}>
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-500/20 text-blue-500 rounded-xl">
                                                        <FiCalendar />
                                                    </div>
                                                    <span className={`text-xs font-black uppercase tracking-[0.1em] ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                        {new Date(report.reportDate || report.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black bg-blue-500 text-white px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/30">
                                                        REPORT #{reports.length - idx}
                                                    </span>
                                                    <button 
                                                        onClick={() => setConfirmConfig({ isOpen: true, id: report._id })}
                                                        className="p-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 transition-all hover:text-white"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <p className={`text-sm leading-relaxed mb-8 font-medium whitespace-pre-wrap ${isLight ? 'text-gray-700' : 'text-gray-200 opacity-90'}`}>
                                                {report.summary}
                                            </p>

                                            {report.images?.length > 0 && (
                                                <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5">
                                                    {report.images.map((img, i) => (
                                                        <div 
                                                            key={i} 
                                                            className="w-full aspect-square rounded-md overflow-hidden border border-white/10 cursor-zoom-in group"
                                                            onClick={() => setLightboxImage(img)}
                                                        >
                                                            <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Report" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* LIGHTBOX */}
            <AnimatePresence>
                {lightboxImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-8 backdrop-blur-xl"
                        onClick={() => setLightboxImage(null)}
                    >
                        <button className="absolute top-8 right-8 p-3 bg-white/10 text-white rounded-full hover:bg-white/20">
                            <FiX size={32} />
                        </button>
                        <img src={lightboxImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl border border-white/10" alt="Preview" />
                    </motion.div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
}
