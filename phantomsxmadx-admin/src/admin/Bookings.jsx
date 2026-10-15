import { useState, useEffect } from "react";
import { FiCalendar, FiClock, FiMail, FiMessageSquare, FiCheckCircle, FiXCircle, FiFilter, FiVideo, FiLink, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";

export default function Bookings({ initialTab = "Bookings", embedded = false }) {
  const { confirm } = useModal();
  const [isLight, setIsLight] = useState(false);
  const [tab, setTab] = useState(initialTab);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const timeOptions = [
    "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM", "04:00 AM", "05:00 AM",
    "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
    "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"
  ];

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Filter for Approved Meetings
  const bookings = requests.filter(r => r.type === 'Meeting' && (r.status === 'Approved' || r.status === 'TimeSelectionPending'));

  const loadRequests = async () => {
    try {
      const res = await api.get('/clients/requests');
      if (res.data.success) {
        const sorted = res.data.data.sort((a, b) => {
          if (a.status === 'Pending' && b.status !== 'Pending') return -1;
          if (a.status !== 'Pending' && b.status === 'Pending') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setRequests(sorted);
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

    loadRequests();
    const interval = setInterval(loadRequests, 10000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleProposeMeeting = async (e) => {
    // Moved to Requests.jsx
  };

  const handleStatusUpdate = async (id, newStatus, comment) => {
    try {
      const res = await api.put(`/clients/requests/${id}`, {
        status: newStatus,
        adminComment: comment
      });

      if (res.data.success) {
        loadRequests();
      }
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteRequest = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Booking',
      message: 'Are you sure you want to delete this booking? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Booking',
      cancelText: 'Keep it'
    });

    if (!isConfirmed) return;

    try {
      const res = await api.delete(`/clients/requests/${id}`);
      if (res.data.success) {
        setRequests(prev => prev.filter(r => r._id !== id));
        toast.success("Booking deleted successfully");
      }
    } catch (err) {
      console.error("Failed to delete request", err);
      toast.error("Failed to delete booking");
    }
  };

  const cardClass = isLight ? "bg-white border-gray-200" : "bg-[#1e1e2d] border-gray-700";
  const textMain = isLight ? "text-gray-900" : "text-white";
  const textSec = isLight ? "text-gray-600" : "text-gray-400";

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`space-y-6 ${embedded ? 'pt-2' : 'pt-14 md:pt-0'} animate-in fade-in duration-500`}>
      {!embedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className={`text-2xl font-bold text-[#004AAE]`}>
            Client Bookings
          </h1>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.map((b) => (
          <div key={b._id} className={`group p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${cardClass} hover:shadow-xl hover:scale-[1.01]`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${b.status === "Approved" ? "from-green-500/10 to-transparent" : "from-blue-500/10 to-transparent"} -mr-8 -mt-8 rounded-full blur-xl pointer-events-none`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#004AAE] to-[#003882] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {(b.client?.name || b.clientName || b.clientEmail || "C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`font-bold text-lg leading-tight ${textMain}`}>{b.client?.name || b.clientName || "Client"}</p>
                  <p className={`text-xs mt-0.5 flex items-center gap-1 ${textSec}`}>
                    <FiMail className="w-3 h-3" /> {b.client?.email || b.clientEmail || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${b.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  b.status === 'TimeSelectionPending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }`}>
                  {b.status === 'TimeSelectionPending' ? 'Wait for Client' : b.status}
                </span>
                <button
                  onClick={() => handleDeleteRequest(b._id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/30 hover:text-red-500 transition-all"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>

            <div className={`space-y-3 relative z-10 p-4 rounded-2xl border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#151521] border-gray-700/50'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs flex items-center gap-2 ${textSec}`}><FiCalendar className="text-[#004AAE]" /> Date</span>
                <span className={`text-sm font-bold ${textMain}`}>{b.meetingDetails?.proposedDate ? new Date(b.meetingDetails.proposedDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs flex items-center gap-2 ${textSec}`}><FiClock className="text-[#004AAE]" /> Time</span>
                <span className={`text-sm font-bold ${textMain}`}>
                  {b.status === 'Approved' ? (b.meetingDetails?.selectedTime || b.meetingDetails?.proposedTime) :
                    `${b.meetingDetails?.proposedTimeRange?.start || '10:00 AM'} - ${b.meetingDetails?.proposedTimeRange?.end || '02:00 PM'}`}
                </span>
              </div>

              {b.meetLink && (
                <div className="pt-3 mt-3 border-t border-gray-700/50">
                  <a
                    href={b.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-[#004AAE] text-white hover:bg-[#003882] rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#004AAE]/20"
                  >
                    <FiVideo /> Join Google Meet
                  </a>
                </div>
              )}

              {b.status === 'TimeSelectionPending' && (
                <div className="pt-3 mt-3 border-t border-gray-700/50 flex flex-col items-center">
                  <p className="text-[10px] text-yellow-500/80 font-medium mb-1 italic">Waiting for client to pick time...</p>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/select-time/${b._id}`;
                      navigator.clipboard.writeText(link);
                      toast.success("Link copied to clipboard!");
                    }}
                    className={`w-full py-2 ${isLight ? 'bg-gray-200 text-gray-700' : 'bg-gray-800 text-gray-300'} hover:opacity-80 rounded-xl transition-all font-bold text-[10px] flex items-center justify-center gap-2`}
                  >
                    <FiLink /> Copy Selection Link
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {bookings.length === 0 && (
          <div className={`col-span-full py-20 text-center rounded-3xl border-2 border-dashed ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
            <FiCalendar className="mx-auto text-4xl text-gray-500 mb-4" />
            <p className="text-gray-500 font-medium">No confirmed or pending meetings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}