import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { FiCalendar, FiClock, FiVideo, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function SelectMeetingTime() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const autoTime = queryParams.get('time');
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [meetLink, setMeetLink] = useState("");

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                // Public endpoint for meeting selection
                const res = await api.get(`/clients/requests/public/${requestId}`);
                if (res.data.success) {
                    const data = res.data.data;
                    if (data.status !== 'TimeSelectionPending') {
                        setError("This meeting has already been confirmed or is no longer available.");
                    } else {
                        setRequest(data);
                    }
                } else {
                    setError(res.data.message || "Meeting request not found.");
                }
            } catch (err) {
                console.error("Failed to fetch meeting details", err);
                setError("Invalid link or meeting request not found.");
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [requestId]);

    // Auto-confirm if time is passed from email
    useEffect(() => {
        if (request && autoTime && !confirmed && !submitting && !selectedTime) {
            const confirmAuto = async () => {
                setSelectedTime(autoTime);
                setSubmitting(true);
                try {
                    const res = await api.post(`/clients/confirm-meeting/${requestId}`, { selectedTime: autoTime });
                    if (res.data.success) {
                        setConfirmed(true);
                        setMeetLink(res.data.meetLink);
                        toast.success(`Meeting confirmed for ${autoTime}!`);
                    }
                } catch (err) {
                    console.error("Auto-confirmation failed", err);
                    const msg = err.response?.data?.message || "Failed to automatically confirm meeting. Please select manually.";
                    toast.error(msg);
                } finally {
                    setSubmitting(false);
                }
            };
            confirmAuto();
        }
    }, [request, autoTime, confirmed, submitting, requestId]);

    const generateTimeSlots = (start, end) => {
        const slots = [];
        const times = [
            "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
            "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
            "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
        ];

        const startIdx = times.indexOf(start);
        const endIdx = times.indexOf(end);

        if (startIdx === -1 || endIdx === -1) return times;
        return times.slice(startIdx, endIdx + 1);
    };

    const handleConfirm = async () => {
        if (!selectedTime) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/clients/confirm-meeting/${requestId}`, { selectedTime });
            if (res.data.success) {
                setConfirmed(true);
                setMeetLink(res.data.meetLink);
            }
        } catch (err) {
            console.error("Failed to confirm meeting", err);
            const msg = err.response?.data?.message || "Failed to confirm meeting selection.";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#004AAE] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-medium">Loading meeting details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
                <div className="bg-[#1e1e2d] p-8 rounded-3xl border border-red-500/20 max-w-md w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <FiAlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Unavailable</h2>
                    <p className="text-gray-400 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (confirmed) {
        return (
            <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#1e1e2d] p-10 rounded-[2.5rem] border border-[#004AAE]/30 max-w-md w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                    <div className="w-20 h-20 bg-[#004AAE]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#004AAE]">
                        <FiCheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3">Confirmed!</h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        Your meeting is scheduled for <br />
                        <span className="text-[#004AAE] font-extrabold text-lg">
                            {request?.meetingDetails?.proposedDate ? new Date(request.meetingDetails.proposedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : "Scheduled"}
                        </span> 
                        <br /> at <span className="text-[#004AAE] font-extrabold text-lg">{selectedTime || "the requested time"}</span>
                    </p>

                    <div className="bg-[#151521] border border-gray-800 p-6 rounded-2xl mb-8">
                        <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-3">Google Meet Link</p>
                        <a
                            href={meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#004AAE] font-bold break-all hover:underline flex items-center justify-center gap-2"
                        >
                            <FiVideo /> Join Meeting
                        </a>
                        <p className="text-[10px] text-gray-500 mt-4 italic">Confirmation and link have been sent to your email.</p>
                    </div>

                    <p className="text-gray-400 text-xs">Thank you for choosing HAT TECH MEDIA.</p>
                </motion.div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
                <div className="bg-[#1e1e2d] p-8 rounded-3xl border border-red-500/20 max-w-md w-full text-center shadow-2xl">
                    <FiAlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Notice</h2>
                    <p className="text-gray-400 text-sm mb-6">Unable to load meeting invitation. Please check the link or contact us.</p>
                </div>
            </div>
        );
    }

    const availableSlots = generateTimeSlots(
        request.meetingDetails?.proposedTimeRange?.start || "10:00 AM",
        request.meetingDetails?.proposedTimeRange?.end || "02:00 PM"
    );

    return (
        <div className="min-h-screen bg-[#0f0f1a] py-12 px-4 flex items-center justify-center">
            <div className="max-w-2xl w-full grid md:grid-cols-5 gap-8 bg-[#1e1e2d] rounded-[3rem] p-8 md:p-12 border border-gray-800 shadow-2xl relative overflow-hidden">
                <div className="md:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#004AAE] to-[#003882] flex items-center justify-center text-white shadow-xl shadow-[#004AAE]/20">
                            <FiCalendar size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-white leading-tight">Pick Your Time Slot</h1>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Select a preferred time for your meeting with the <span className="text-[#004AAE] font-bold">HAT TECH MEDIA</span> team.
                        </p>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-gray-800">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-[#004AAE] group-hover:scale-110 transition-transform">
                                <FiCalendar size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Meeting Date</p>
                                <p className="text-white font-bold">{new Date(request.meetingDetails.proposedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-[#004AAE] group-hover:scale-110 transition-transform">
                                <FiClock size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Proposed Range</p>
                                <p className="text-white font-bold">{request.meetingDetails.proposedTimeRange?.start} - {request.meetingDetails.proposedTimeRange?.end}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3 bg-[#151521] rounded-[2rem] p-6 md:p-8 border border-gray-800/50">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <FiClock className="text-[#004AAE]" /> Available Slots
                    </h2>

                    <div className="grid grid-cols-2 gap-3 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableSlots.map((slot) => (
                            <button
                                key={slot}
                                onClick={() => setSelectedTime(slot)}
                                className={`py-4 px-2 rounded-2xl font-bold text-sm transition-all border-2 ${selectedTime === slot
                                    ? 'bg-[#004AAE] border-[#004AAE] text-white shadow-lg shadow-[#004AAE]/30 scale-[1.02]'
                                    : 'bg-[#1e1e2d] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                                    }`}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!selectedTime || submitting}
                        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${selectedTime && !submitting
                            ? 'bg-gradient-to-r from-[#004AAE] to-[#003882] text-white shadow-xl shadow-[#004AAE]/20 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            }`}
                    >
                        {submitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Confirming...</span>
                            </>
                        ) : (
                            <>
                                <FiCheckCircle />
                                <span>Book Meeting</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Styles for scrollbar */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #004AAE; }
            `}} />
        </div>
    );
}
