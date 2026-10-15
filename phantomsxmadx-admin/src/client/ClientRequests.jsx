import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { FiSend, FiClock, FiCheckCircle, FiXCircle, FiVideo } from "react-icons/fi";

export default function ClientRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        type: "Resource",
        subject: "",
        message: "",
        date: "",
        time: "10:00",
        ampm: "AM"
    });
    const [isLight, setIsLight] = useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/clients/requests');
            if (res.data.success) {
                // Filter out New Project requests if they are handled separately, 
                // but usually the Request Center shows all EXCEPT maybe project requests or ALL.
                // For now, let's show all requests in history.
                setRequests(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch client requests", err);
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

        return () => observer.disconnect();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                type: formData.type,
                subject: formData.subject,
                message: formData.message,
            };

            if (formData.type === 'Meeting') {
                payload.meetingDetails = {
                    proposedDate: formData.date,
                    proposedTime: `${formData.time} ${formData.ampm}`
                };
            }

            const res = await api.post('/clients/requests', payload);

            if (res.data.success) {
                toast.success("Request submitted successfully!");
                setFormData({ type: "Resource", subject: "", message: "", date: "", time: "10:00", ampm: "AM" });
                fetchRequests();
            }
        } catch (err) {
            console.error("Failed to submit request", err);
            toast.error("Failed to submit request");
        }
    };

    const cardClass = isLight ? "bg-white border-gray-200 shadow-sm" : "bg-[var(--bg-card)] border-[var(--border-color)] shadow-md";
    const inputClass = isLight ? "bg-white border-gray-300 text-gray-900 focus:ring-[#004AAD]" : "bg-[#1a1433] border-gray-700 text-white focus:ring-[#004AAD]";
    const textMain = isLight ? "text-gray-900" : "text-white";
    const textSec = isLight ? "text-gray-600" : "text-gray-400";

    return (
        <div className="space-y-8 pt-14 md:pt-0 animate-in fade-in duration-500">
            <div>
                <h1 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${isLight ? 'from-[#004AAD] to-blue-600' : 'from-[#004AAD] to-blue-400'}`}>
                    Request Center
                </h1>
                <p className={textSec}>Submit new requests for resources, meetings, or general inquiries.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* NEW REQUEST FORM */}
                <div className={`lg:col-span-1 p-6 rounded-2xl border ${cardClass} h-fit`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${textMain}`}>
                        <FiSend className="text-[#004AAD]" /> New Request
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${textSec}`}>Request Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className={`w-full rounded-lg border px-3 py-2 ${inputClass} focus:outline-none focus:ring-2`}
                            >
                                <option>Resource</option>
                                <option>Meeting</option>
                                <option>Project Update</option>
                                <option>Other</option>
                            </select>
                        </div>

                        {/* Meeting Fields */}
                        {formData.type === 'Meeting' && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${textSec}`}>Date</label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className={`w-full rounded-lg border px-3 py-2 ${inputClass} focus:outline-none focus:ring-2`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${textSec}`}>Time (PKT)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="time"
                                            required
                                            value={formData.time}
                                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                                            className={`flex-1 rounded-lg border px-3 py-2 ${inputClass} focus:outline-none focus:ring-2`}
                                        />
                                        <select
                                            value={formData.ampm}
                                            onChange={e => setFormData({ ...formData, ampm: e.target.value })}
                                            className={`w-24 rounded-lg border px-2 py-2 ${inputClass} focus:outline-none focus:ring-2`}
                                        >
                                            <option>AM</option>
                                            <option>PM</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className={`block text-sm font-medium mb-1 ${textSec}`}>Subject</label>
                            <input
                                type="text"
                                required
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Brief subject..."
                                className={`w-full rounded-lg border px-3 py-2 ${inputClass} focus:outline-none focus:ring-2`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${textSec}`}>Message</label>
                            <textarea
                                required
                                rows="4"
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Describe your request..."
                                className={`w-full rounded-lg border px-3 py-2 ${inputClass} focus:outline-none focus:ring-2 resize-none`}
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2.5 rounded-lg bg-[#004AAD] hover:bg-[#003882] text-white font-bold transition shadow-lg shadow-[#004AAD]/20"
                        >
                            Submit Request
                        </button>
                    </form>
                </div>

                {/* PAST REQUESTS LIST */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${textMain}`}>
                        <FiClock className="text-[#004AAD]" /> Request History
                    </h3>

                    {loading && requests.length === 0 ? (
                        <div className="p-8 text-center text-theme-secondary">Loading requests...</div>
                    ) : (
                        requests.length === 0 ? (
                            <div className={`text-center py-12 border border-dashed rounded-xl ${isLight ? 'border-gray-300 text-gray-500' : 'border-gray-700 text-gray-400'}`}>
                                No requests submitted yet.
                            </div>
                        ) : (
                            requests.map((req) => (
                                <div key={req._id} className={`p-5 rounded-xl border flex flex-col md:flex-row gap-4 items-start ${cardClass}`}>
                                    <div className={`p-3 rounded-full shrink-0 ${req.status === 'Approved' ? 'bg-green-500/10 text-green-500' :
                                        req.status === 'Rejected' ? 'bg-red-500/10 text-red-500' :
                                            'bg-yellow-500/10 text-yellow-500'
                                        }`}>
                                        {req.status === 'Approved' ? <FiCheckCircle size={24} /> :
                                            req.status === 'Rejected' ? <FiXCircle size={24} /> :
                                                <FiClock size={24} />}
                                    </div>

                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`font-bold text-base ${textMain}`}>{req.subject}</h4>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${req.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                req.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                            <span className="font-medium text-[#004AAD]">{req.type}</span>
                                            <span>•</span>
                                            <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                            {req.meetingDetails?.proposedDate && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-blue-500">Requested: {new Date(req.meetingDetails.proposedDate).toLocaleDateString()} at {new Date(`1970-01-01T${req.meetingDetails.proposedTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </>
                                            )}
                                        </div>
                                        <p className={`text-sm leading-relaxed ${textSec}`}>
                                            {req.message}
                                        </p>

                                        {/* MEETING LINK */}
                                        {req.meetLink && req.status === 'Approved' && (
                                            <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between ${isLight ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-500/30'}`}>
                                                <div className="flex items-center gap-2 text-green-500 font-bold text-sm">
                                                    <FiVideo /> Meeting Link Available
                                                </div>
                                                <a
                                                    href={req.meetLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs bg-green-500 text-white px-4 py-1.5 rounded-full font-bold hover:bg-green-600 transition shadow-lg shadow-green-500/20"
                                                >
                                                    Join Meeting
                                                </a>
                                            </div>
                                        )}

                                        {/* ADMIN COMMENT */}
                                        {req.adminComment && (
                                            <div className={`mt-3 p-3 rounded-lg border text-sm ${isLight ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-[#004AAD]/20 border-[#004AAD]/20 text-blue-300'}`}>
                                                <span className="font-bold block mb-1">Admin Response:</span>
                                                {req.adminComment}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
