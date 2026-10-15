import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiClock, FiFileText, FiDownload, FiUser, FiEye, FiShield } from "react-icons/fi";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";

export default function HRReports() {
    const [reports, setReports] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedDate, setSelectedDate] = useState(() => {
        return localStorage.getItem('hr_reports_date') || new Date().toISOString().split('T')[0];
    });
    const [markingStatus, setMarkingStatus] = useState({});
    const [attendance, setAttendance] = useState([]);
    const [leaveModal, setLeaveModal] = useState({ show: false, empId: null });
    const [editingMarked, setEditingMarked] = useState(new Set());

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Optimization: Fetch employees only once
            const apiCalls = [api.get(`/reports?date=${selectedDate}`)];
            if (employees.length === 0) apiCalls.push(api.get('/employees'));

            const [repRes, empRes] = await Promise.all(apiCalls);

            if (repRes.data.success) {
                setReports(repRes.data.reports || []);
            }
            if (empRes && empRes.data.success) {
                // Filter out HR, IT Support, and Inactive/Ex-employees
                const filteredEmps = (empRes.data.data || []).filter(emp => {
                    const dept = (emp.department || '').toLowerCase();
                    const status = (emp.status || 'active').toLowerCase();
                    return status === 'active' && !dept.includes('hr') && !dept.includes('it support') && !dept.includes('it-support');
                });
                setEmployees(filteredEmps);
            }

            // Also fetch attendance for the selected date to handle persistence
            const attRes = await api.get(`/hr/attendance?date=${selectedDate}`);
            if (attRes.data.success) {
                setAttendance(attRes.data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch reports/employees/attendance", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        localStorage.setItem('hr_reports_date', selectedDate);
        fetchData();
    }, [selectedDate]);

    const verifyReport = async (reportId) => {
        try {
            const res = await api.put(`/reports/${reportId}/verify`);
            if (res.data.success) {
                toast.success("Report verified successfully!");
                fetchData();
            }
        } catch (err) {
            console.error("Failed to verify report", err);
            toast.error("Failed to verify report");
        }
    };

    const handleUpdateAttendance = async (userId, status, leaveType = null) => {
        try {
            if (!userId) {
                toast.error("Invalid Employee ID");
                return;
            }
            
            setMarkingStatus(prev => ({ ...prev, [userId]: 'Marking...' }));
            
            const payload = {
                userId: String(userId),
                date: selectedDate,
                status: status,
                leaveType: leaveType
            };
            
            const res = await api.post('/hr/attendance/verify', payload);
            if (res.data.success) {
                const statusLabel = leaveType ? `${status} (${leaveType})` : status;
                toast.success(`Employee marked as ${statusLabel}`);
                setMarkingStatus(prev => ({ ...prev, [userId]: statusLabel }));
                setEditingMarked(prev => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
                
                // Refresh data after a short delay
                setTimeout(fetchData, 1500);
            }
        } catch (err) {
            console.error(`Failed to mark as ${status}`, err);
            const errorMsg = err.response?.data?.message || err.message;
            toast.error(`Error: ${errorMsg}`);
            setMarkingStatus(prev => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
        }
    };

    if (loading && reports.length === 0) return <LoadingSpinner />;

    return (
        <div className="space-y-6 pt-14 md:pt-0">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-theme-primary transition-colors">Daily Reports</h1>
                    <p className="text-sm text-theme-secondary transition-colors">Review and verify employee daily activity reports</p>
                </div>

                {/* DATE PICKER & SCORING */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="date"
                            className="w-full md:w-48 p-2 rounded-lg border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-primary transition"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {(() => {
                        // Calculate missing reports
                        const filterStr = selectedDate;
                        const filteredReports = reports.filter(r => new Date(r.date || r.createdAt).toISOString().split('T')[0] === filterStr);
                        const employeesWithReports = new Set(filteredReports.map(r => r.userId?._id || r.userId));
                        
                        // Check daily attendance for handled statuses (Absent/Leave/No Report)
                        const employeesWithAttendance = new Set(attendance.filter(a => a.status === 'Absent' || a.status === 'Leave' || a.status === 'Report not submitted').map(a => a.user?._id || a.user));

                        const missingEmployees = employees.filter(emp => {
                            const empId = emp.userId?._id || emp.userId || emp._id;
                            const role = (emp.position || emp.role || '').toLowerCase();
                            // If they submitted a report, they are NOT missing.
                            // If they have attendance (Absent/Leave), they ARE HANDLED but we still want to show them in this section as requested by the user.
                            return !employeesWithReports.has(empId) && !['admin', 'hr', 'hr_hattech', 'it_support', 'manager', 'project_head', 'client'].includes(role);
                        });

                        return (
                            <>
                                {missingEmployees.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2 mt-4">Not Submitted on {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                             {missingEmployees.map(emp => {
                                                const currentEmpId = emp.userId?._id || emp.userId || emp._id;
                                                let rawName = emp.name || emp.username || emp.email?.split('@')[0] || "Employee";
                                                const employeeName = rawName.replace(/[0-9]/g, '').trim();

                                                return (
                                                    <div key={emp._id} className={`p-3 rounded-lg border flex flex-col gap-3 animate-in fade-in duration-300 ${employeesWithAttendance.has(currentEmpId) ? 'bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20' : 'bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${employeesWithAttendance.has(currentEmpId) ? 'bg-blue-200 text-blue-600' : 'bg-red-200 text-red-600'}`}>{employeeName.charAt(0)}</div>
                                                            <div className="flex-1">
                                                                <p className={`text-sm font-bold ${employeesWithAttendance.has(currentEmpId) ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>{employeeName}</p>
                                                                <p className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${employeesWithAttendance.has(currentEmpId) ? 'text-blue-500/70' : 'text-red-500/70'}`}>
                                                                    {(() => {
                                                                        const att = attendance.find(a => (a.user?._id || a.user) === currentEmpId);
                                                                        if (!att) return 'No report submitted';
                                                                        return att.leaveType ? `${att.status} (${att.leaveType})` : att.status;
                                                                    })()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="w-full">
                                                             {employeesWithAttendance.has(currentEmpId) && !editingMarked.has(currentEmpId) ? (
                                                                 <div className="flex gap-2 w-full">
                                                                     <div className="flex-1 py-1.5 px-3 rounded-md text-[10px] font-black uppercase text-center bg-blue-500 text-white shadow-sm flex items-center justify-center gap-2">
                                                                         <FiCheckCircle size={12} />
                                                                         {(() => {
                                                                             const att = attendance.find(a => (a.user?._id || a.user) === currentEmpId);
                                                                             if (!att) return 'MARKED';
                                                                             return att.leaveType ? `${att.status} (${att.leaveType})` : att.status;
                                                                         })()}
                                                                     </div>
                                                                     <button 
                                                                         onClick={() => setEditingMarked(prev => new Set(prev).add(currentEmpId))}
                                                                         className="px-3 bg-white/10 hover:bg-white/20 text-blue-300 rounded-md text-[9px] font-black uppercase border border-blue-500/30 transition-all"
                                                                     >
                                                                         Edit
                                                                     </button>
                                                                 </div>
                                                             ) : markingStatus[currentEmpId] && !editingMarked.has(currentEmpId) ? (
                                                                 <div className="w-full py-2.5 rounded-md text-[10px] font-black uppercase text-center bg-blue-500/10 border border-blue-500/30 text-blue-500">
                                                                     {markingStatus[currentEmpId] === 'Marking...' ? 'UPDATING...' : `MARKED AS ${markingStatus[currentEmpId]}`}
                                                                 </div>
                                                             ) : (
                                                                 <div className="grid grid-cols-2 gap-2 w-full">
                                                                     <button
                                                                         onClick={() => handleUpdateAttendance(currentEmpId, 'Present')}
                                                                         className="py-1.5 px-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-md transition-colors shadow-sm uppercase tracking-wider text-center"
                                                                     >
                                                                         Mark Present
                                                                     </button>
                                                                     <button
                                                                         onClick={() => handleUpdateAttendance(currentEmpId, 'Absent')}
                                                                         className="py-1.5 px-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-md transition-colors shadow-sm uppercase tracking-wider text-center"
                                                                     >
                                                                         Mark Absent
                                                                     </button>
                                                                     <button
                                                                         onClick={() => setLeaveModal({ show: true, empId: currentEmpId })}
                                                                         className="py-1.5 px-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold rounded-md transition-colors shadow-sm uppercase tracking-wider text-center"
                                                                     >
                                                                         Mark Leave
                                                                     </button>
                                                                     <button
                                                                         onClick={() => handleUpdateAttendance(currentEmpId, 'Report not submitted')}
                                                                         className="py-1.5 px-2 bg-[#004AAE] hover:bg-[#003882] text-white text-[10px] font-bold rounded-md transition-colors shadow-sm uppercase tracking-wider text-center truncate"
                                                                         title="Report not submitted"
                                                                     >
                                                                         Not Submitted
                                                                     </button>
                                                                 </div>
                                                             )}
                                                         </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {filteredReports.length === 0 && (
                                    <div className="p-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center text-theme-secondary">
                                        <FiFileText size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>No reports submitted for this date.</p>
                                    </div>
                                )}

                                {filteredReports
                                    .filter((report) => {
                                        // Only show employees and interns — exclude admin/hr/it_support roles
                                        const role = (
                                            report.userId?.role ||
                                            report.userId?.userId?.role ||
                                            ''
                                        ).toLowerCase();
                                        const dept = (report.userId?.department || '').toLowerCase();
                                        const excludedRoles = ['admin', 'hr', 'hr_hattech', 'it_support', 'manager', 'project_head'];
                                        if (excludedRoles.includes(role)) return false;
                                        if (dept.includes('hr') || dept.includes('it support') || dept.includes('it-support')) return false;
                                        return true;
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
                                                className={`p-6 rounded-2xl border transition-all bg-[var(--bg-card)] border-[var(--border-color)] ${report.status === 'verified' ? 'opacity-90' : 'shadow-lg border-blue-500/30'}`}
                                            >
                                                <div className="flex flex-col md:flex-row gap-6 relative">
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

                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className="font-bold text-lg text-theme-primary">{employeeName}</h3>
                                                                <p className="text-sm text-theme-secondary flex items-center gap-2">
                                                                    <FiClock size={14} /> {new Date(report.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl mb-4 border border-[var(--border-color)]/50">
                                                            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                                                                {report.report || "No content provided."}
                                                            </p>
                                                        </div>

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

                                                        {!report.status || report.status !== 'verified' ? (
                                                            <div className="flex justify-end pt-2">
                                                                <button
                                                                    onClick={() => verifyReport(report._id)}
                                                                    className="px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 transform active:scale-95"
                                                                >
                                                                    <FiCheckCircle /> Verify Report
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-end pt-2">
                                                                <div className="flex items-center gap-2 text-green-500 font-bold text-sm">
                                                                    <FiCheckCircle /> Report Verified
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </>
                        );
                    })()}
                </div>
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
                                (() => {
                                    let pdfUrl = previewImage.url;
                                    const isBase64 = typeof pdfUrl === 'string' && pdfUrl.startsWith('data:application/pdf;base64,');
                                    
                                    if (isBase64) {
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
                                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                                    <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">PDF Viewer</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                      onClick={() => window.open(pdfUrl, '_blank')}
                                                      className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md hover:scale-105 active:scale-95"
                                                    >
                                                      <FiEye size={14} /> View Full Screen / Fix Blank
                                                    </button>
                                                    <a
                                                      href={pdfUrl}
                                                      download="document.pdf"
                                                      className="px-4 py-1.5 bg-gray-800 text-white text-[11px] font-bold rounded-lg hover:bg-black transition flex items-center gap-2 shadow-md hover:scale-105 active:scale-95"
                                                    >
                                                      <FiDownload size={14} /> Download
                                                    </a>
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
            {/* LEAVE TYPE MODAL */}
            <AnimatePresence>
                {leaveModal.show && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-2xl w-full max-w-sm"
                        >
                            <h3 className="text-lg font-black uppercase text-theme-primary mb-1">Select Leave Type</h3>
                            <p className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest mb-6 italic opacity-70">Define reason for record keeping</p>
                            
                            <div className="flex flex-col gap-2">
                                {['Casual Leave', 'Sick Leave', 'Medical Leave', 'Emergency Leave', 'Official Work', 'Other'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            handleUpdateAttendance(leaveModal.empId, 'Leave', type);
                                            setLeaveModal({ show: false, empId: null });
                                        }}
                                        className="w-full py-3 px-4 bg-[var(--bg-inner)] hover:bg-orange-500 hover:text-white text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl text-left transition-all border border-white/5"
                                    >
                                        {type}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setLeaveModal({ show: false, empId: null })}
                                    className="w-full mt-4 py-3 px-4 text-theme-secondary text-[10px] font-bold uppercase tracking-widest hover:text-red-500 transition-all font-primary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
