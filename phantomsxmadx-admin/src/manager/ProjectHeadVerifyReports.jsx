import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiClock, FiFileText, FiDownload, FiUser, FiEye, FiShield } from "react-icons/fi";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import LinkifyText from "../components/LinkifyText";
import { toast } from "react-hot-toast";
import { FiXCircle, FiRefreshCw, FiMessageSquare } from "react-icons/fi";

export default function ProjectHeadVerifyReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState(null);
    const [filterDate, setFilterDate] = useState("");
    const [feedbackModal, setFeedbackModal] = useState({ show: false, reportId: null, action: '', report: null });
    const [feedbackText, setFeedbackText] = useState("");
    const [processing, setProcessing] = useState(false);
    const [unverifiedOnly, setUnverifiedOnly] = useState(false);

    const fetchReports = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const res = await api.get('/reports?t=' + Date.now());
            if (res.data.success) {
                const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
                const currentUserId = currentUser._id || currentUser.id || currentUser.userId;
                const fetchedReports = res.data.reports || res.data.data || [];
                const filtered = fetchedReports.filter(report => {
                    const reportUserId = report.userId?._id || report.userId;
                    return !(currentUserId && reportUserId && reportUserId.toString() === currentUserId.toString());
                });
                setReports(filtered);
            }
        } catch (err) {
            console.error("Failed to fetch reports", err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const verifyReport = async (reportId) => {
        try {
            setProcessing(reportId); // Set ID instead of boolean for local loading
            const res = await api.put(`/reports/${reportId}/verify`);
            if (res.data.success) {
                toast.success("Report verified successfully!");
                fetchReports(false); // Silent re-fetch
            }
        } catch (err) {
            console.error("Failed to verify report", err);
            toast.error("Failed to verify report");
        } finally {
            setProcessing(false);
        }
    };

    const handleFeedbackAction = async () => {
        if (!feedbackText.trim()) {
            toast.error("Please enter a comment.");
            return;
        }

        try {
            setProcessing(true);
            const { reportId, action } = feedbackModal;
            const endpoint = `/reports/${reportId}/${action}`;
            
            const res = await api.put(endpoint, { feedback: feedbackText });
            if (res.data.success) {
                toast.success(`Report status updated to ${action}!`);
                setFeedbackModal({ show: false, reportId: null, action: '', report: null });
                setFeedbackText("");
                fetchReports();
            }
        } catch (err) {
            console.error(`Failed to ${feedbackModal.action} report`, err);
            toast.error(`Failed to ${feedbackModal.action} report`);
        } finally {
            setProcessing(false);
        }
    };

    if (loading && reports.length === 0) return <LoadingSpinner />;

    return (
        <div className="space-y-6 pt-14 md:pt-0">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-theme-primary transition-colors">Verify Reports</h1>
                    <p className="text-sm text-theme-secondary transition-colors">Review and verify employee daily activity reports</p>
                </div>
                {/* DATE FILTER */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)] shadow-sm w-full md:w-auto">
                    <label className="text-sm font-semibold text-theme-secondary flex items-center gap-2 px-2">
                        <FiClock className="text-[#004AAE]" /> <span className="hidden xs:inline">Filter by Date</span><span className="xs:hidden">Filter</span>
                    </label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-2 md:px-3 py-1.5 rounded-lg bg-[var(--bg-main)] border border-theme text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] text-sm flex-1 md:flex-none"
                    />
                    {filterDate && (
                        <button
                            onClick={() => setFilterDate("")}
                            className="text-xs text-red-500 hover:text-red-600 font-bold px-2"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* UNVERIFIED FILTER */}
                <button
                    onClick={() => setUnverifiedOnly(!unverifiedOnly)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold transition-all text-sm ${
                        unverifiedOnly 
                        ? 'bg-[#004AAE] text-white border-[#004AAE] shadow-md' 
                        : 'bg-[var(--bg-card)] text-theme-secondary border-[var(--border-color)] hover:border-[#004AAE]'
                    }`}
                >
                    <FiShield className={unverifiedOnly ? 'text-white' : 'text-[#004AAE]'} />
                    {unverifiedOnly ? 'Showing Unverified' : 'Show Unverified Only'}
                </button>
            </div>

            {reports.length === 0 ? (
                <div className="p-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center text-theme-secondary">
                    <FiFileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No reports submitted yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reports
                        .filter(report => {
                            if (unverifiedOnly && report.status === 'verified') return false;
                            if (!filterDate) return true;
                            // Convert both to YYYY-MM-DD for accurate comparison using local timezone
                            const reportDate = new Date(report.date || report.createdAt);
                            const rYear = reportDate.getFullYear();
                            const rMonth = String(reportDate.getMonth() + 1).padStart(2, '0');
                            const rDay = String(reportDate.getDate()).padStart(2, '0');
                            return `${rYear}-${rMonth}-${rDay}` === filterDate;
                        })
                        .sort((a, b) => {
                            if (a.status !== 'verified' && b.status === 'verified') return -1;
                            if (a.status === 'verified' && b.status !== 'verified') return 1;
                            return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
                        })
                        .map((report) => {
                            let rawName = report.userId?.name || report.userId?.username || report.userId?.email?.split('@')[0] || "Employee";
                            // Remove numbers and trim
                            const employeeName = rawName.replace(/[0-9]/g, '').trim();
                            const profileImage = report.userId?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + employeeName;

                            return (
                                <div
                                    key={report._id}
                                    className={`p-4 md:p-6 rounded-2xl border transition-all bg-[var(--bg-card)] border-[var(--border-color)] ${report.status === 'verified' ? 'opacity-90' : 'shadow-lg border-blue-500/30'}`}
                                >
                                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 relative">
                                        {report.status === 'verified' && (
                                            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                                                <FiShield size={10} />
                                                VERIFIED
                                            </div>
                                        )}

                                        <div className="flex-shrink-0">
                                            <img
                                                src={profileImage}
                                                alt={employeeName}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-[var(--border-color)] bg-gray-100"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-lg text-theme-primary truncate">{employeeName}</h3>
                                                    <p className="text-sm text-theme-secondary flex items-center gap-2">
                                                        <FiClock size={14} /> {new Date(report.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
 
                                            <div className="bg-[var(--bg-main)]/30 p-3 md:p-4 rounded-xl mb-4 border border-[var(--border-color)]/50">
                                                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed break-words">
                                                    <LinkifyText text={report.report || "No content provided."} />
                                                </p>
                                            </div>

                                            {report.feedback && (
                                                <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                                    <p className="text-[10px] font-black text-orange-600 uppercase mb-1 flex items-center gap-1">
                                                        <FiMessageSquare size={12} /> Feedback / Note:
                                                    </p>
                                                    <p className="text-xs text-orange-700 italic">
                                                        "{report.feedback}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* REPORT IMAGES */}
                                            {report.images && report.images.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {report.images.map((img, idx) => {
                                                        const isPdf = typeof img === 'string' && (img.startsWith('data:application/pdf') || img.toLowerCase().endsWith('.pdf'));
                                                        return (
                                                            <div key={idx} className="relative group/img overflow-hidden rounded-lg border border-[var(--border-color)] w-20 h-20 bg-gray-100 flex items-center justify-center cursor-pointer" onClick={() => setPreviewImage({ type: isPdf ? 'pdf' : 'image', url: img })}>
                                                                {isPdf ? (
                                                                    <div className="flex flex-col items-center justify-center text-red-500">
                                                                        <FiFileText size={28} />
                                                                        <span className="text-[10px] mt-1 font-bold">PDF</span>
                                                                    </div>
                                                                ) : (
                                                                    <img
                                                                        src={img}
                                                                        alt="Report attachment"
                                                                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                                                                    />
                                                                )}
                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                                                                    <FiEye className="text-white" />
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                             {report.status === 'pending' || report.status === 'revision' ? (
                                                <div className="flex flex-row flex-nowrap justify-between md:justify-end gap-1.5 md:gap-2 pt-2 items-center">
                                                    <button
                                                        onClick={() => setFeedbackModal({ show: true, reportId: report._id, action: 'revision', report: report })}
                                                        disabled={processing}
                                                        className="flex-1 md:flex-none px-2 py-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 border border-yellow-500/30 font-bold transition-all text-[10px] md:text-[12px] flex items-center justify-center gap-1"
                                                    >
                                                        <FiRefreshCw /> Revision
                                                    </button>
                                                    <button
                                                        onClick={() => setFeedbackModal({ show: true, reportId: report._id, action: 'reject', report: report })}
                                                        disabled={processing}
                                                        className="flex-1 md:flex-none px-2 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/30 font-bold transition-all text-[10px] md:text-[12px] flex items-center justify-center gap-1"
                                                    >
                                                        <FiXCircle /> Reject
                                                    </button>
                                                    <button
                                                        onClick={() => verifyReport(report._id)}
                                                        disabled={processing}
                                                        className="flex-[1.5] md:flex-none px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5 active:scale-95 text-[11px] md:text-[13px]"
                                                    >
                                                        {processing === report._id ? (
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <FiCheckCircle />
                                                         )}
                                                        Verify Report
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end pt-2">
                                                    {report.status === 'verified' && (
                                                        <div className="flex items-center gap-2 text-green-500 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
                                                            <FiCheckCircle /> Report Verified
                                                        </div>
                                                    )}
                                                    {report.status === 'rejected' && (
                                                        <div className="flex items-center gap-2 text-red-500 font-bold text-sm bg-red-50 px-3 py-1.5 rounded-full border border-red-200 shadow-sm">
                                                            <FiXCircle /> Report Rejected
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* IMAGE PREVIEW MODAL */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setPreviewImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-[90vw] md:w-auto max-w-5xl bg-transparent p-2 rounded-2xl shadow-2xl flex justify-center items-center"
                            onClick={e => e.stopPropagation()}
                        >
                            {previewImage?.type === 'pdf' ? (
                                <iframe
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewImage.url)}&embedded=true`}
                                    className="w-[85vw] md:w-[800px] h-[80vh] rounded-xl bg-white shadow-2xl border-0"
                                    title="PDF Preview"
                                />
                            ) : (
                                <img
                                    src={previewImage?.url || previewImage}
                                    alt="Full Preview"
                                    className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
                                />
                            )}
                            <button
                                className="absolute -top-4 -right-4 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors z-50 hover:scale-110 transform duration-200"
                                onClick={() => setPreviewImage(null)}
                            >
                                ✕
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FEEDBACK MODAL */}
            <AnimatePresence>
                {feedbackModal.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setFeedbackModal({ show: false, reportId: null, action: '', report: null })}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={`p-4 ${feedbackModal.action === 'reject' ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>
                                <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    {feedbackModal.action === 'reject' ? <FiXCircle /> : <FiRefreshCw />}
                                    {feedbackModal.action === 'reject' ? 'Reject Report' : 'Request Revision'}
                                </h3>
                                <p className="text-xs opacity-90">Please provide a reason or instructions for the employee.</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-theme-secondary uppercase mb-2">Your Comments</label>
                                    <textarea
                                        autoFocus
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder={feedbackModal.action === 'reject' ? "Why is this report being rejected?" : "What needs to be revised?"}
                                        className="w-full h-32 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setFeedbackModal({ show: false, reportId: null, action: '', report: null })}
                                        className="flex-1 py-3 rounded-xl border border-[var(--border-color)] text-theme-secondary font-bold hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleFeedbackAction}
                                        disabled={processing || !feedbackText.trim()}
                                        className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 disabled:opacity-50
                                            ${feedbackModal.action === 'reject' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                                    >
                                        {processing ? 'Processing...' : 'Submit Feedback'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
