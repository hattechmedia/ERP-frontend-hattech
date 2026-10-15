import { useState, useEffect } from "react";
import { FiSend, FiFileText, FiClock, FiCheckCircle, FiShield, FiX, FiEye } from "react-icons/fi";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Fix timezone date display: parse YYYY-MM-DD as local time, not UTC midnight
const formatDateLocal = (dateStr) => {
    if (!dateStr) return 'N/A';
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ProjectHeadDailyReport() {
    const [report, setReport] = useState("");
    const [images, setImages] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
            const myUserId = currentUser?.userId || currentUser?._id || currentUser?.id;
            if (!myUserId) { setLoading(false); return; }
            // Use userId-specific endpoint to get ONLY this user's own reports
            const res = await api.get(`/reports/${myUserId}`);
            if (res.data.success) {
                setReports(res.data.reports || []);
            }
        } catch (err) {
            console.error("Failed to fetch reports", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const processFile = (file) => {
        if (file.type === 'application/pdf' && file.size > 2 * 1024 * 1024) {
            toast.error(`The PDF "${file.name}" is too large! Maximum allowed size is 2MB.`);
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            if (file.type.startsWith('image/')) {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 1000;
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                    else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    setImages(prev => [...prev, { data: canvas.toDataURL('image/jpeg', 0.7), type: file.type, name: file.name || `Pasted Image ${new Date().getTime()}` }]);
                };
                img.src = event.target.result;
            } else {
                setImages(prev => [...prev, { data: event.target.result, type: file.type, name: file.name }]);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        files.forEach(processFile);
    };

    useEffect(() => {
        const handlePaste = (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            let imageCount = 0;
            
            for (const item of items) {
                if (item.type.indexOf("image") !== -1) {
                    const blob = item.getAsFile();
                    processFile(blob);
                    imageCount++;
                }
            }

            if (imageCount > 0) {
                toast.success(`Pasted ${imageCount} image${imageCount > 1 ? 's' : ''}!`);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!report.trim()) return toast.error("Please type your report.");
        // Images are now optional as requested

        try {
            setSubmitting(true);
            const base64Strings = images.map(img => img.data || img);
            const now = new Date();
            const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const res = await api.post('/reports', {
                report: report.trim(),
                date: localDate,
                images: base64Strings
            });

            if (res.data.success) {
                toast.success("Daily report submitted & auto-verified! ✅");
                setReport("");
                setImages([]);
                fetchReports();
            }
        } catch (err) {
            console.error("Failed to submit report", err);
            toast.error("Failed to submit report");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 pt-14 md:pt-0">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-primary">My Daily Report</h1>
                    <p className="text-sm text-gray-400">Submit your daily work progress — auto-verified & sent to Admin</p>
                </div>
                <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold flex items-center gap-1 border border-green-500/20">
                    <FiShield size={12} /> Auto-Verified
                </span>
            </div>

            <div className="space-y-6">
                {/* SUBMISSION FORM */}
                <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <FiFileText />
                            <span>What did you work on today?</span>
                        </div>

                        <textarea
                            value={report}
                            onChange={(e) => setReport(e.target.value)}
                            className="w-full h-32 p-4 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
                            placeholder="List your tasks, accomplishments, and challenges..."
                        />

                        {/* FILE UPLOAD */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider">
                                Work Screenshots <span className="text-xs text-gray-500 lowercase">(Optional)</span>
                            </label>
                            <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-[var(--bg-main)]/50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,application/pdf"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
                                    <FiFileText size={24} />
                                </div>
                                <p className="text-sm font-bold text-[var(--text-primary)]">Click or Paste to Upload Screenshots</p>
                                <p className="text-xs text-gray-400 mt-1">Select from computer or use Ctrl+V to paste images</p>
                            </div>

                            {images.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                                    {images.map((fileObj, idx) => {
                                        const isPdf = fileObj.type === 'application/pdf';
                                        return (
                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border-color)] group shadow-sm bg-[var(--bg-main)] flex items-center justify-center">
                                                {isPdf ? (
                                                    <div className="flex flex-col items-center text-red-500">
                                                        <FiFileText size={32} />
                                                        <span className="text-[10px] mt-2 font-bold px-2 truncate w-full text-center">{fileObj.name || "PDF"}</span>
                                                    </div>
                                                ) : (
                                                    <img src={fileObj.data} className="w-full h-full object-cover" alt={`preview ${idx}`} />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button type="button" onClick={() => removeImage(idx)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-transform hover:scale-110">
                                                        <FiX size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2 transform active:scale-95"
                            >
                                {submitting ? "Submitting..." : <><FiSend /> Submit Report</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* HISTORY */}
                <div className="space-y-4">
                    <h2 className="font-bold flex items-center gap-2 text-primary">
                        <FiClock /> My Report History
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reports.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4">No reports submitted yet.</p>
                        ) : (
                            reports.map((item) => (
                                <div key={item._id} className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-xl transition-all relative overflow-hidden group">
                                    {/* Auto-verified badge */}
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                                        <FiShield size={10} /> VERIFIED
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <FiClock className="text-primary/50" />
                                            <span className="text-sm font-bold text-primary">
                                                {formatDateLocal(item.date)}
                                            </span>
                                        </div>
                                        <FiCheckCircle className="text-green-500" title="Auto-Verified" />
                                    </div>

                                    <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl mb-4 min-h-[60px]">
                                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{item.report}</p>
                                    </div>

                                    {item.images && item.images.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border-color)]/50">
                                            {item.images.map((fileStr, idx) => {
                                                const isPdf = typeof fileStr === 'string' && fileStr.startsWith('data:application/pdf');
                                                return (
                                                    <div key={idx} className="relative group/img">
                                                        {isPdf ? (
                                                            <div onClick={() => setPreviewFile({ type: 'pdf', url: fileStr })} className="w-16 h-16 rounded-lg bg-red-50 text-red-500 flex flex-col items-center justify-center border border-red-200 cursor-pointer hover:scale-105 transition-transform" title="View PDF">
                                                                <FiFileText size={24} />
                                                                <span className="text-[8px] font-bold mt-1">PDF</span>
                                                            </div>
                                                        ) : (
                                                            <img src={fileStr} className="w-16 h-16 rounded-lg bg-gray-100 object-cover border border-[var(--border-color)] cursor-pointer hover:scale-105 transition-transform" alt="Proof" onClick={() => setPreviewFile({ type: 'image', url: fileStr })} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {previewFile && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-[90vw] md:w-auto max-w-5xl bg-transparent p-2 rounded-2xl shadow-2xl flex justify-center items-center" onClick={e => e.stopPropagation()}>
                            {previewFile?.type === 'pdf' ? (
                                (() => {
                                    let pdfUrl = previewFile.url;
                                    if (typeof pdfUrl === 'string' && pdfUrl.startsWith('data:application/pdf;base64,')) {
                                        try {
                                            const base64Data = pdfUrl.split(',')[1];
                                            const byteCharacters = atob(base64Data);
                                            const byteNumbers = new Array(byteCharacters.length);
                                            for (let i = 0; i < byteCharacters.length; i++) {
                                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                                            }
                                            const byteArray = new Uint8Array(byteNumbers);
                                            const blob = new Blob([byteArray], { type: 'application/pdf' });
                                            pdfUrl = URL.createObjectURL(blob);
                                        } catch (e) {
                                            console.error("PDF Blob conversion failed", e);
                                        }
                                    }
                                    return (
                                        <div className="w-[85vw] md:w-[900px] h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col border-4 border-white/10">
                                            <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-100/80 backdrop-blur-md">
                                                <div className="flex items-center gap-2 pl-2">
                                                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                                                    <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">Project Report PDF</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                      onClick={() => window.open(pdfUrl, '_blank')}
                                                      className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
                                                    >
                                                      <FiEye size={14} /> Full Screen / Fix Blank
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-gray-200/50 relative">
                                                <iframe
                                                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                                    className="w-full h-full border-0 bg-white"
                                                    title="PDF Preview"
                                                    loading="lazy"
                                                />
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <img src={previewFile?.url} alt="Full Preview" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" />
                            )}
                            <button className="absolute -top-4 -right-4 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors z-50 hover:scale-110 transform duration-200" onClick={() => setPreviewFile(null)}>✕</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
