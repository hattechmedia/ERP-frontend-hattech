import { useState, useEffect } from "react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageSquare, FiCheckCircle, FiXCircle, FiTrash2, FiClock, FiCalendar, FiUser, FiVideo, FiMapPin, FiMail, FiLink } from "react-icons/fi";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";

export default function Requests({ embedded = false }) {
    const { confirm } = useModal();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState(null);
    const [isLight, setIsLight] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approvalNote, setApprovalNote] = useState("");
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [showProposeModal, setShowProposeModal] = useState(false);
    const [proposeData, setProposeData] = useState({
        clientEmail: '',
        proposedDate: '',
        startTime: '10:00 AM',
        endTime: '02:00 PM'
    });
    const [isSending, setIsSending] = useState(false);

    const timeOptions = [
        "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM", "04:00 AM", "05:00 AM",
        "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
        "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
        "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"
    ];

    const fetchRequests = async () => {
        try {
            const res = await api.get('/clients/requests');
            if (res.data.success) {
                setRequests(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch requests", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkTheme = () => setIsLight(document.body.classList.contains('light'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        fetchRequests();
        const interval = setInterval(fetchRequests, 15000); // Poll every 15s

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, []);

    const handleStatusUpdate = async (id, status, comment = "") => {
        if (status === 'Approved' && !selectedRequestId && !comment) {
            setSelectedRequestId(id);
            setShowApproveModal(true);
            return;
        }

        const previousRequests = [...requests];
        setRequests(prev => prev.map(r => r._id === id ? { ...r, status, adminComment: comment } : r));

        try {
            const res = await api.put(`/clients/requests/${id}`, { status, adminComment: comment });
            if (res.data.success) {
                toast.success(`Request ${status} successfully`);
                setShowApproveModal(false);
                setApprovalNote("");
                setSelectedRequestId(null);
            } else {
                setRequests(previousRequests);
                toast.error("Failed to update status");
            }
        } catch (err) {
            setRequests(previousRequests);
            toast.error("Failed to update status");
        }
    };

    const handleGenerateLink = async (request) => {
        setGeneratingId(request._id);
        const loadToast = toast.loading("Generating Google Meet link...");
        try {
            // Calculate start and end times
            const date = new Date(request.meetingDetails.proposedDate);
            if (isNaN(date.getTime())) {
                throw new Error("Invalid proposed date");
            }
            const dateStr = date.toISOString().split('T')[0];
            const timeStr = request.meetingDetails.selectedTime || request.meetingDetails.proposedTime || "10:00 AM";
            
            // Robust conversion for start time
            const convertTo24Hour = (str) => {
                const match = str.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                if (!match) return "10:00";
                
                let [_, hours, minutes, modifier] = match;
                hours = parseInt(hours, 10);
                modifier = (modifier || '').toUpperCase();

                if (modifier === 'PM' && hours < 12) hours += 12;
                if (modifier === 'AM' && hours === 12) hours = 0;
                
                return `${String(hours).padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            };

            const startDateTimeStr = `${dateStr}T${convertTo24Hour(timeStr)}:00+05:00`;
            const startDate = new Date(startDateTimeStr);
            
            if (isNaN(startDate.getTime())) {
                throw new Error("Invalid start date calculation");
            }

            const startDateTime = startDate.toISOString();
            const endDateTime = new Date(startDate.getTime() + 60 * 60 * 1000).toISOString();

            const res = await api.post('/create-meeting', {
                summary: `Meeting: ${request.subject}`,
                description: request.message,
                startDateTime,
                endDateTime,
                email: request.client?.email || 'client@example.com'
            });

            if (res.data.success) {
                // Update Backend status/link
                await api.put(`/clients/requests/${request._id}`, { 
                    meetLink: res.data.meetLink,
                    status: 'Approved'
                });

                // Optimistic UI Update
                const updatedRequest = { ...request, meetLink: res.data.meetLink, status: 'Approved' };
                setRequests(prev => prev.map(r => r._id === request._id ? updatedRequest : r));
                
                toast.success("Meeting link generated!", { id: loadToast });
            } else {
                toast.error(res.data.error || "Failed to generate link", { id: loadToast });
            }
        } finally {
            setGeneratingId(null);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Request',
            message: 'Are you sure you want to delete this request forever? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete Forever',
            cancelText: 'Cancel'
        });

        if (!isConfirmed) return;
        try {
            const res = await api.delete(`/clients/requests/${id}`);
            if (res.data.success) {
                setRequests(prev => prev.filter(r => r._id !== id));
                toast.success("Request deleted successfully");
            }
        } catch (err) {
            toast.error("Failed to delete request");
        }
    };

    const handleProposeMeeting = async (e) => {
        e.preventDefault();
        setIsSending(true);
        try {
            const res = await api.post('/clients/propose-meeting', {
                clientEmail: proposeData.clientEmail,
                proposedDate: proposeData.proposedDate,
                proposedTimeRange: {
                    start: proposeData.startTime,
                    end: proposeData.endTime
                }
            });

            if (res.data.success) {
                setShowProposeModal(false);
                setProposeData({ clientEmail: '', proposedDate: '', startTime: '10:00 AM', endTime: '02:00 PM' });
                fetchRequests();
                toast.success("Meeting proposal sent to client!");
            }
        } catch (err) {
            console.error("Failed to propose meeting", err);
            toast.error("Failed to send proposal");
        } finally {
            setIsSending(false);
        }
    };

    const cardClass = isLight ? "bg-white border-gray-200" : "bg-[#1e1e2d] border-gray-800";
    const textMain = isLight ? "text-gray-900" : "text-white";
    const textSec = isLight ? "text-gray-500" : "text-gray-400";

    if (loading) return <LoadingSpinner />;

    return (
        <div className={`space-y-6 ${embedded ? 'pt-2' : 'pt-14 md:pt-0'}`}>
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    {!embedded && <h1 className="text-2xl font-bold text-[#004AAE]">Client Requests</h1>}
                    <p className={textSec}>Manage new project inquiries, proposals and client messages</p>
                </div>
                <button
                    onClick={() => setShowProposeModal(true)}
                    className="px-4 py-2 bg-[#004AAE] text-white rounded-xl font-bold shadow-lg hover:bg-[#003882] transition flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                >
                    <FiCalendar /> Propose Meeting
                </button>
            </div>

            <div className="grid gap-4">
                {requests.length === 0 ? (
                    <div className={`p-20 text-center border-2 border-dashed rounded-2xl ${isLight ? 'border-gray-200 text-gray-400' : 'border-gray-800 text-gray-500'}`}>
                        <FiMessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No fresh requests found</p>
                        <p className="text-sm">New client inquiries will appear here</p>
                    </div>
                ) : (
                    requests.map((r) => (
                        <div key={r._id} className={`p-6 rounded-2xl border ${cardClass} transition-all hover:border-[#004AAE]/50`}>
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#004AAE]/10 text-[#004AAE] flex items-center justify-center font-bold">
                                                {r.client?.name?.charAt(0) || "C"}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold ${textMain}`}>{r.subject}</h3>
                                                <p className="text-xs text-[#004AAE] font-medium uppercase tracking-tighter">[{r.type}]</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${r.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            r.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                            {r.status}
                                        </span>
                                    </div>

                                    <p className={`text-sm italic ${textSec}`}>"{r.message}"</p>

                                    <div className="flex flex-wrap gap-4 text-xs font-medium">
                                        <span className={`flex items-center gap-1.5 ${textSec}`}><FiUser /> {r.client?.name || r.clientName}</span>
                                        <span className={`flex items-center gap-1.5 ${textSec}`}><FiClock /> {new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {r.type === 'New Project' && r.projectDetails && (
                                        <div className={`mt-3 p-3 rounded-lg border ${isLight ? 'bg-blue-50/50 border-blue-100' : 'bg-blue-900/10 border-blue-500/20'} grid grid-cols-2 gap-4`}>
                                            <div>
                                                <p className="text-[10px] uppercase text-gray-500">Category</p>
                                                <p className={`text-sm font-bold ${textMain}`}>{r.projectDetails.projectType}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-gray-500">Budget</p>
                                                <p className="text-sm font-bold text-green-500">{r.projectDetails.budget}</p>
                                            </div>
                                        </div>
                                    )}

                                    {r.type === 'Meeting' && (
                                        <div className={`mt-3 p-4 rounded-xl border-l-4 ${isLight
                                            ? 'bg-purple-50/50 border-purple-200 border-l-purple-600'
                                            : 'bg-purple-950/20 border-purple-500/20 border-l-purple-500'} transition-all hover:shadow-md`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <FiCalendar className="text-purple-500" />
                                                <span className={`text-[10px] font-bold uppercase tracking-wide ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>Proposed Schedule</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] uppercase text-gray-400 font-bold mb-1">Proposed Date</p>
                                                    <p className={`text-sm font-bold flex items-center gap-2 ${textMain}`}>
                                                        {r.meetingDetails?.proposedDate ? new Date(r.meetingDetails.proposedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase text-gray-400 font-bold mb-1">Proposed Time (PKT)</p>
                                                    <p className={`text-sm font-bold flex items-center gap-2 ${textMain}`}>
                                                        <FiClock className="opacity-50" /> 
                                                        {r.meetingDetails?.proposedTimeRange ? 
                                                            `${r.meetingDetails.proposedTimeRange.start} - ${r.meetingDetails.proposedTimeRange.end}` : 
                                                            (r.meetingDetails?.proposedTime || 'N/A')}
                                                    </p>
                                                </div>
                                            </div>
                                            {r.meetingDetails?.selectedTime && (
                                                <div className="mt-3 pt-3 border-t border-purple-500/10">
                                                    <div className={`bg-green-500/10 text-green-500 p-2 rounded-lg text-xs font-bold flex items-center gap-2`}>
                                                        <FiCheckCircle /> Final Selected Time: {r.meetingDetails.selectedTime}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {r.status === 'Approved' && r.type === 'Meeting' && !r.meetLink && (
                                        <button
                                            onClick={() => handleGenerateLink(r)}
                                            disabled={generatingId === r._id}
                                            className={`mt-3 w-full py-2 bg-[#004AAE] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-[#004AAE]/20 ${generatingId === r._id ? 'opacity-70 cursor-wait' : 'hover:bg-[#003882]'}`}
                                        >
                                            {generatingId === r._id ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <FiLink size={14} /> Generate Meet Link
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {r.meetLink && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <a
                                                href={r.meetLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-2 bg-green-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-lg shadow-green-500/20"
                                            >
                                                <FiVideo size={14} /> Join Meeting
                                            </a>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(r.meetLink);
                                                    toast.success("Link copied!");
                                                }}
                                                className={`p-2 rounded-xl border ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-gray-800 border-gray-700'} hover:opacity-80 transition`}
                                            >
                                                <FiLink size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex md:flex-col gap-2 shrink-0">
                                    {r.status === 'Pending' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(r._id, 'Approved')}
                                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-lg shadow-green-500/20"
                                            >
                                                <FiCheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(r._id, 'Rejected')}
                                                className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition"
                                            >
                                                <FiXCircle size={18} />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(r._id)}
                                        className="p-2 bg-gray-500/10 text-gray-400 hover:text-red-500 rounded-lg transition"
                                    >
                                        <FiTrash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* APPROVAL MODAL */}
            <AnimatePresence>
                {showApproveModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden ${cardClass}`}
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
                                        <FiCheckCircle size={28} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${textMain}`}>Approve Request</h3>
                                        <p className={`text-sm ${textSec}`}>Add a note or feedback for the client.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${textSec}`}>Admin Note (Optional)</label>
                                    <textarea
                                        value={approvalNote}
                                        onChange={(e) => setApprovalNote(e.target.value)}
                                        placeholder="e.g. Project approved! We will start the onboarding soon..."
                                        className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition-all resize-none h-32 ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800/50 border-gray-700 text-white'}`}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowApproveModal(false);
                                            setSelectedRequestId(null);
                                            setApprovalNote("");
                                        }}
                                        className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedRequestId, 'Approved', approvalNote)}
                                        className="flex-[2] py-4 rounded-2xl bg-[#004AAE] text-white font-bold text-sm shadow-xl shadow-[#004AAE]/20 hover:bg-[#003882] transition-all"
                                    >
                                        Confirm & Approve
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* PROPOSE MEETING MODAL */}
            <AnimatePresence>
                {showProposeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                        onClick={() => setShowProposeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 40 }}
                            onClick={e => e.stopPropagation()}
                            className={`${isLight ? 'bg-white' : 'bg-[#1e1e2d]'} p-8 rounded-[2rem] w-full max-w-md shadow-2xl border ${isLight ? 'border-gray-100' : 'border-gray-700/50'} relative`}
                        >
                            <button
                                onClick={() => setShowProposeModal(false)}
                                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-500/10 rounded-xl"
                            >
                                <FiXCircle size={20} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004AAE] to-[#003882] flex items-center justify-center text-white shadow-xl shadow-[#004AAE]/20">
                                    <FiCalendar size={28} className="text-white" />
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold ${textMain}`}>Schedule Meeting</h2>
                                    <p className={`text-xs ${textSec} font-medium`}>Propose an availability range</p>
                                </div>
                            </div>

                            <form onSubmit={handleProposeMeeting} className="space-y-6">
                                <div className="space-y-2">
                                    <label className={`block text-[10px] font-black uppercase tracking-widest ml-1 ${textSec}`}>Client Email</label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            required
                                            placeholder="client@example.com"
                                            value={proposeData.clientEmail}
                                            onChange={e => setProposeData({ ...proposeData, clientEmail: e.target.value })}
                                            className={`w-full ${isLight ? 'bg-gray-100' : 'bg-[#151521]'} border border-transparent focus:border-[#004AAE]/50 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-[#004AAE]/5 outline-none ${textMain} transition-all`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={`block text-[10px] font-black uppercase tracking-widest ml-1 ${textSec}`}>Proposed Date</label>
                                    <div className="relative group">
                                        <input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            value={proposeData.proposedDate}
                                            onChange={e => setProposeData({ ...proposeData, proposedDate: e.target.value })}
                                            className={`w-full ${isLight ? 'bg-gray-100' : 'bg-[#151521]'} border border-transparent focus:border-[#004AAE]/50 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-[#004AAE]/5 outline-none ${textMain} transition-all`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest ml-1 ${textSec}`}>Availability From</label>
                                        <div className="relative">
                                            <select
                                                value={proposeData.startTime}
                                                onChange={e => setProposeData({ ...proposeData, startTime: e.target.value })}
                                                className={`w-full ${isLight ? 'bg-gray-100' : 'bg-[#151521]'} border border-transparent focus:border-[#004AAE]/50 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-[#004AAE]/5 outline-none ${textMain} appearance-none cursor-pointer transition-all`}
                                            >
                                                {timeOptions.map(t => <option key={t} value={t} className="bg-[#1e1e2d]">{t}</option>)}
                                            </select>
                                            <FiClock className="absolute right-4 top-1/2 -translate-y-1/2 text-[#004AAE] pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest ml-1 ${textSec}`}>Availability To</label>
                                        <div className="relative">
                                            <select
                                                value={proposeData.endTime}
                                                onChange={e => setProposeData({ ...proposeData, endTime: e.target.value })}
                                                className={`w-full ${isLight ? 'bg-gray-100' : 'bg-[#151521]'} border border-transparent focus:border-[#004AAE]/50 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-[#004AAE]/5 outline-none ${textMain} appearance-none cursor-pointer transition-all`}
                                            >
                                                {timeOptions.map(t => <option key={t} value={t} className="bg-[#1e1e2d]">{t}</option>)}
                                            </select>
                                            <FiClock className="absolute right-4 top-1/2 -translate-y-1/2 text-[#004AAE] pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className={`w-full py-5 bg-gradient-to-r from-[#004AAE] to-[#003882] rounded-[1.25rem] font-bold shadow-xl shadow-[#004AAE]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 group ${isSending ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {isSending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span className="text-white !text-white">Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-white !text-white">Send Proposal Email</span>
                                            <FiMail className="group-hover:translate-x-1 transition-transform text-white !text-white" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
