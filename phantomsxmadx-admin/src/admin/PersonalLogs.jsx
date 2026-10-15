import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  FiPlus, 
  FiPhone, 
  FiMail, 
  FiVideo, 
  FiTrash2, 
  FiEdit2, 
  FiClock, 
  FiSearch, 
  FiFilter, 
  FiFileText, 
  FiCalendar, 
  FiExternalLink, 
  FiCheckCircle, 
  FiCopy, 
  FiCheck, 
  FiTag, 
  FiBell, 
  FiMessageSquare,
  FiRefreshCw
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import Bookings from "./Bookings";
import Requests from "./Requests";

export default function PersonalLogs({ defaultTab = null }) {
  const { user: authUser } = useAuth();
  const currentUser = useMemo(() => {
    if (authUser) return authUser;
    try {
      return JSON.parse(sessionStorage.getItem("currentUser") || "null");
    } catch (e) {
      return null;
    }
  }, [authUser]);

  const isHatTechAdmin = useMemo(() => {
    if (!currentUser) return false;
    const email = (currentUser.email || '').toLowerCase().trim();
    const username = (currentUser.username || '').toLowerCase().trim();
    return email.includes('hattechmedia') || username.includes('hattechmedia') || currentUser.role === 'super_admin' || email === 'hattechmedia@gmail.com';
  }, [currentUser]);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialParamTab = searchParams.get("tab") || defaultTab;
  const [activeTab, setActiveTab] = useState(
    initialParamTab === "bookings" ? "bookings" :
    initialParamTab === "requests" ? "requests" :
    initialParamTab === "notes" ? "notes" : "meetings"
  );
  const [isLight, setIsLight] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("meeting"); // "meeting" | "note"
  const [editingLog, setEditingLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [copiedNoteId, setCopiedNoteId] = useState(null);

  useEffect(() => {
    const checkTheme = () => setIsLight(document.body.classList.contains('light'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["meetings", "bookings", "requests", "notes"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Form states
  const [formData, setFormData] = useState({
    clientName: "",
    title: "",
    details: "",
    notes: "",
    interactionType: "Meeting",
    status: "Pending",
    tags: ""
  });

  // 12-Hour Date/Time states
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingHour, setMeetingHour] = useState("03");
  const [meetingMinute, setMeetingMinute] = useState("30");
  const [meetingAmpm, setMeetingAmpm] = useState("PM");

  const [googleConnected, setGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchLogs();

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'GOOGLE_CONNECTED') {
        fetchLogs(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchLogs = async (showToast = false) => {
    try {
      if (showToast) setIsSyncing(true);
      else setLoading(true);
      const [intRes, gcalRes] = await Promise.allSettled([
        api.get("/interactions"),
        api.get("/google-events")
      ]);
      const dbLogs = intRes.status === 'fulfilled' ? (intRes.value.data?.data || []) : [];
      const gcalEvents = gcalRes.status === 'fulfilled' ? (gcalRes.value.data?.events || []) : [];
      const isConn = gcalRes.status === 'fulfilled' ? !!gcalRes.value.data?.connected : false;
      setGoogleConnected(isConn);
      setLogs([...gcalEvents, ...dbLogs]);
      if (showToast) {
        toast.success(`Synced! Found ${gcalEvents.length} calendar event(s) and ${dbLogs.length} interaction(s).`);
      }
    } catch (err) {
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const connectGoogleCalendar = () => {
    const user = JSON.parse(sessionStorage.getItem("currentUser") || localStorage.getItem("currentUser") || "{}");
    const uid = user._id || user.id || user.userId;
    const clientId = "691160602273-rsdmq79hcuq8adntb2g9oenhsgeju1ph.apps.googleusercontent.com";
    const redirectUri = "https://www.hattech.online/google/callback";
    const scopes = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=${encodeURIComponent(scopes)}&prompt=consent&include_granted_scopes=true&state=${uid}&response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    window.open(googleAuthUrl, '_blank', 'width=550,height=650');
  };

  const constructISODate = () => {
    if (!meetingDate) return null;
    let h = parseInt(meetingHour, 10);
    if (meetingAmpm === "PM" && h < 12) h += 12;
    if (meetingAmpm === "AM" && h === 12) h = 0;
    const hStr = String(h).padStart(2, '0');
    const mStr = String(meetingMinute).padStart(2, '0');
    return new Date(`${meetingDate}T${hStr}:${mStr}:00`).toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nextMeetingISO = (modalMode === "meeting" || formData.interactionType === "Meeting") 
        ? constructISODate() 
        : null;

      const payload = {
        ...formData,
        nextMeetingDate: nextMeetingISO,
        tags: typeof formData.tags === "string" 
          ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) 
          : formData.tags
      };

      if (editingLog) {
        await api.put(`/interactions/${editingLog._id}`, payload);
        toast.success("Log updated successfully");
      } else {
        await api.post("/interactions", payload);
        toast.success(
          nextMeetingISO 
            ? "Meeting logged! Confirmation email & 30-min reminder set." 
            : "Notes & Interaction logged successfully!"
        );
      }
      setShowModal(false);
      setEditingLog(null);
      resetForm();
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: "",
      title: "",
      details: "",
      notes: "",
      interactionType: "Meeting",
      status: "Pending",
      tags: ""
    });
    setMeetingDate("");
    setMeetingHour("03");
    setMeetingMinute("30");
    setMeetingAmpm("PM");
  };

  const openNewModal = (mode = "meeting") => {
    setEditingLog(null);
    resetForm();
    setModalMode(mode);
    if (mode === "note") {
      setFormData(prev => ({ ...prev, interactionType: "Other", status: "Completed" }));
    } else {
      setFormData(prev => ({ ...prev, interactionType: "Meeting", status: "Pending" }));
      // Default to today
      const today = new Date().toISOString().slice(0, 10);
      setMeetingDate(today);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await api.delete(`/interactions/${id}`);
      toast.success("Log deleted");
      fetchLogs();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const openEdit = (log) => {
    setEditingLog(log);
    setModalMode(log.nextMeetingDate ? "meeting" : "note");
    
    if (log.nextMeetingDate) {
      const d = new Date(log.nextMeetingDate);
      setMeetingDate(d.toISOString().slice(0, 10));
      let h = d.getHours();
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setMeetingHour(String(h).padStart(2, '0'));
      setMeetingMinute(String(d.getMinutes()).padStart(2, '0'));
      setMeetingAmpm(ampm);
    } else {
      setMeetingDate("");
    }

    setFormData({
      clientName: log.clientName || "",
      title: log.title || "",
      details: log.details || "",
      notes: log.notes || "",
      interactionType: log.interactionType || "Meeting",
      status: log.status || "Pending",
      tags: Array.isArray(log.tags) ? log.tags.join(", ") : (log.tags || "")
    });
    setShowModal(true);
  };

  const handleCopyNote = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedNoteId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const createGoogleCalendarUrl = (log) => {
    if (!log.nextMeetingDate) return "#";
    const start = new Date(log.nextMeetingDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration default

    const formatGCalDate = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(log.title || `Meeting with ${log.clientName}`);
    const details = encodeURIComponent(`${log.details || ''}\n\nNotes / Agenda:\n${log.notes || ''}`);
    const location = encodeURIComponent("HAT TECH MEDIA Office / Remote");
    const dates = `${formatGCalDate(start)}/${formatGCalDate(end)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  const formattedPreviewTime = useMemo(() => {
    if (!meetingDate) return null;
    const d = new Date(`${meetingDate}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    return `${dayName} at ${meetingHour}:${meetingMinute} ${meetingAmpm} (PKT)`;
  }, [meetingDate, meetingHour, meetingMinute, meetingAmpm]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const adminName = (log.adminId?.name || log.adminId?.username || log.adminId?.email || "").toLowerCase();
      const matchSearch = 
        (log.clientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.notes || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (isHatTechAdmin && adminName.includes(searchQuery.toLowerCase()));

      const matchType = typeFilter === "All" || log.interactionType === typeFilter;
      return matchSearch && matchType;
    });
  }, [logs, searchQuery, typeFilter, isHatTechAdmin]);

  const upcomingMeetings = useMemo(() => {
    return logs
      .filter((l) => l.nextMeetingDate && new Date(l.nextMeetingDate) > new Date())
      .sort((a, b) => new Date(a.nextMeetingDate) - new Date(b.nextMeetingDate));
  }, [logs]);

  const nextMeeting = upcomingMeetings[0] || null;

  const notesLogs = useMemo(() => {
    return logs.filter(l => l.notes || l.details);
  }, [logs]);

  return (
    <div className={`p-4 md:p-8 space-y-6 min-h-screen pt-20 md:pt-6 transition-colors duration-300 ${
      isLight ? "bg-[#f8fafc] text-gray-900" : "bg-slate-950 text-slate-100"
    }`}>
      {/* Header Section */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 ${
        isLight ? "border-gray-200" : "border-slate-800/80"
      }`}>
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#004AAE] to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <FiCalendar size={22} />
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isLight ? "text-gray-900" : "text-white"}`}>
                {isHatTechAdmin ? "Organization Logs, Meetings & Requests" : "Personal Logs & Meetings"}
              </h1>
              <p className={`text-xs md:text-sm mt-0.5 ${isLight ? "text-gray-600" : "text-slate-400"}`}>
                {isHatTechAdmin 
                  ? "HQ Master Hub: Manage client bookings, incoming requests, personal meetings, and meeting notes."
                  : "Track your client interactions, bookings, requests, and synchronized Google Meet schedules."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchLogs(true)}
            disabled={isSyncing}
            title="Sync live events from Google Calendar and Database"
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider cursor-pointer border ${
              isLight 
                ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-100" 
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <FiRefreshCw size={14} className={isSyncing ? "animate-spin text-blue-400" : "text-blue-500"} />
            <span>{isSyncing ? "Syncing..." : "Sync"}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={connectGoogleCalendar}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider cursor-pointer border ${
              googleConnected
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                : isLight
                  ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
            }`}
          >
            <FiVideo size={14} className={googleConnected ? "text-emerald-400" : "text-blue-400"} />
            <span>{googleConnected ? "Google Connected" : "Connect Google"}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openNewModal("note")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider cursor-pointer border ${
              isLight 
                ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-100" 
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <FiFileText size={15} className="text-blue-500" />
            <span>+ Add Note / Minutes</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openNewModal("meeting")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#004AAE] to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-500 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            <FiPlus size={16} />
            <span>Schedule Meeting</span>
          </motion.button>
        </div>
      </div>

      {/* 4 Unified Tabs Navigation */}
      <div className={`flex items-center justify-between border-b flex-wrap gap-2 ${
        isLight ? "border-gray-200" : "border-slate-800"
      }`}>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => { setActiveTab("meetings"); setSearchParams({ tab: "meetings" }); }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "meetings"
                ? "border-[#004AAE] text-blue-500 bg-blue-500/5"
                : isLight ? "border-transparent text-gray-500 hover:text-gray-900" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FiCalendar size={15} />
            <span>Scheduled Meetings ({logs.filter(l => l.nextMeetingDate).length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("bookings"); setSearchParams({ tab: "bookings" }); }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "bookings"
                ? "border-[#004AAE] text-blue-500 bg-blue-500/5"
                : isLight ? "border-transparent text-gray-500 hover:text-gray-900" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FiVideo size={15} />
            <span>Client Bookings</span>
          </button>

          <button
            onClick={() => { setActiveTab("requests"); setSearchParams({ tab: "requests" }); }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "requests"
                ? "border-[#004AAE] text-blue-500 bg-blue-500/5"
                : isLight ? "border-transparent text-gray-500 hover:text-gray-900" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FiMessageSquare size={15} />
            <span>Client Requests</span>
          </button>

          <button
            onClick={() => { setActiveTab("notes"); setSearchParams({ tab: "notes" }); }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "notes"
                ? "border-[#004AAE] text-blue-500 bg-blue-500/5"
                : isLight ? "border-transparent text-gray-500 hover:text-gray-900" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FiFileText size={15} />
            <span>Notes & Minutes ({notesLogs.length})</span>
          </button>
        </div>

        {activeTab === "notes" && (
          <button
            onClick={() => openNewModal("note")}
            className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1.5 py-2 px-3 bg-blue-500/10 rounded-xl border border-blue-500/20 cursor-pointer"
          >
            <FiPlus size={14} /> Add Quick Note
          </button>
        )}
      </div>

      {/* Next Meeting Countdown Widget (Active on Meetings Tab) */}
      {activeTab === "meetings" && nextMeeting && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#004AAE] via-indigo-700 to-blue-600 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden border border-white/10"
        >
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
             <FiCalendar size={220} />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Upcoming Meeting
                </span>
                <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <FiBell size={11} /> 30-Min Reminder Active
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">{nextMeeting.title || `Meeting with ${nextMeeting.clientName}`}</h2>
              <div className="flex items-center gap-4 text-xs text-blue-100 flex-wrap">
                <div className="flex items-center gap-1.5 font-bold">
                  <FiClock className="text-amber-300" />
                  <span>
                    {new Date(nextMeeting.nextMeetingDate).toLocaleString('en-US', { 
                      timeZone: 'Asia/Karachi', 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      hour12: true 
                    })} PKT
                  </span>
                </div>
                {nextMeeting.clientName && (
                  <span className="text-blue-200">Person/Client: <strong>{nextMeeting.clientName}</strong></span>
                )}
              </div>

              {/* Action Links */}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <a
                  href={createGoogleCalendarUrl(nextMeeting)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-slate-100 transition shadow-sm"
                >
                  <FiCalendar size={14} className="text-blue-600" />
                  <span>Add to Google Calendar</span>
                </a>
              </div>
            </div>

            <div className="bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 border border-white/20 self-stretch sm:self-auto flex items-center justify-center">
              <Countdown targetDate={nextMeeting.nextMeetingDate} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Search & Filter Bar (Shown only for Meetings and Notes tabs) */}
      {(activeTab === "meetings" || activeTab === "notes") && (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border transition-colors ${
          isLight ? "bg-white border-gray-200 shadow-sm" : "bg-slate-900/60 border-slate-800"
        }`}>
          <div className="relative w-full sm:w-80">
            <FiSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? "text-gray-400" : "text-slate-400"}`} size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "meetings" ? "Search meetings, client, details..." : "Search notes & minutes..."}
              className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#004AAE] transition ${
                isLight 
                  ? "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400" 
                  : "bg-slate-950/80 border-slate-800 text-white placeholder-slate-500"
              }`}
            />
          </div>

          {activeTab === "meetings" && (
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {["All", "Meeting", "Call", "Email", "Other"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    typeFilter === t
                      ? "bg-[#004AAE] text-white shadow-md shadow-blue-500/20"
                      : isLight 
                        ? "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200" 
                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: CLIENT BOOKINGS */}
      {activeTab === "bookings" && (
        <div className="w-full">
          <Bookings embedded={true} />
        </div>
      )}

      {/* TAB: CLIENT REQUESTS */}
      {activeTab === "requests" && (
        <div className="w-full">
          <Requests embedded={true} />
        </div>
      )}

      {/* TAB 1: MEETINGS & INTERACTIONS GRID */}
      {activeTab === "meetings" && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#004AAE]"></div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Loading Interactions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredLogs.map((log) => {
                  const isPast = log.nextMeetingDate && new Date(log.nextMeetingDate) < new Date();

                  return (
                    <motion.div
                      key={log._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 hover:border-slate-700 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-2xl ${
                            log.interactionType === 'Meeting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            log.interactionType === 'Call' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            log.interactionType === 'Email' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {log.interactionType === 'Meeting' && <FiVideo size={18} />}
                            {log.interactionType === 'Call' && <FiPhone size={18} />}
                            {log.interactionType === 'Email' && <FiMail size={18} />}
                            {log.interactionType === 'Other' && <FiFileText size={18} />}
                          </div>

                          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openEdit(log)} 
                              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                              title="Edit Log"
                            >
                              <FiEdit2 size={15} />
                            </button>
                            <button 
                              onClick={() => handleDelete(log._id)} 
                              className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete Log"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                              {log.title || log.clientName}
                            </h3>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              log.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              log.status === 'Follow-up' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                          
                          {isHatTechAdmin && log.adminId && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-md text-[10px] font-bold text-amber-300">
                              <span>👤 Host Admin:</span>
                              <span className="text-white">{log.adminId.name || log.adminId.username || log.adminId.email}</span>
                            </div>
                          )}

                          {log.title && log.clientName && (
                            <p className="text-xs text-slate-400">Client / Person: <span className="text-slate-300 font-semibold">{log.clientName}</span></p>
                          )}
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <FiClock size={12} />
                            <span>Logged {new Date(log.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-slate-300 text-xs line-clamp-3 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          {log.details}
                        </p>

                        {/* Notes Preview if available */}
                        {log.notes && (
                          <div className="mb-4 bg-blue-950/20 border border-blue-900/30 p-2.5 rounded-xl text-xs text-blue-300">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[10px] uppercase text-blue-400 flex items-center gap-1">
                                <FiFileText size={11} /> Notes / Minutes
                              </span>
                              <button 
                                onClick={() => handleCopyNote(log.notes, log._id)}
                                className="text-[10px] hover:text-white transition text-blue-300 flex items-center gap-0.5 cursor-pointer"
                              >
                                {copiedNoteId === log._id ? <FiCheck size={10} className="text-green-400" /> : <FiCopy size={10} />}
                              </button>
                            </div>
                            <p className="line-clamp-2 text-slate-300 text-[11px]">{log.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Scheduled Meeting Info Footer */}
                      {log.nextMeetingDate ? (
                        <div className="pt-3 border-t border-slate-800 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-medium">Meeting Time:</span>
                            <span className={`font-bold font-mono ${isPast ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {new Date(log.nextMeetingDate).toLocaleString('en-US', { 
                                timeZone: 'Asia/Karachi', 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: true 
                              })} PKT
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={createGoogleCalendarUrl(log)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                            >
                              <FiCalendar size={12} className="text-blue-400" />
                              <span>Add to Google Cal</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-400">
                          <span>Log Record Only</span>
                          <span className="text-slate-500">●</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredLogs.length === 0 && (
            <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FiFileText size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">No interaction logs found</h3>
              <p className="text-xs text-slate-400 mt-1">Start tracking your meetings, calls, and discussions</p>
            </div>
          )}
        </>
      )}

      {/* TAB 2: MEETING NOTES & MINUTES */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notesLogs.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 hover:border-slate-700 flex flex-col justify-between shadow-lg relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                        {item.clientName}
                      </span>
                      <h3 className="font-bold text-base text-white mt-1.5">
                        {item.title || `${item.interactionType} Notes`}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopyNote(item.notes || item.details, item._id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Copy Notes"
                    >
                      {copiedNoteId === item._id ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} />}
                    </button>
                  </div>

                  {/* Notes Content */}
                  <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 mb-4 max-h-[220px] overflow-y-auto custom-scrollbar">
                    <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {item.notes || item.details}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <FiTag size={12} className="text-indigo-400" />
                    <span>{item.interactionType}</span>
                  </div>
                  <button
                    onClick={() => openEdit(item)}
                    className="text-blue-400 hover:text-blue-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <FiEdit2 size={12} /> Edit Notes
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {notesLogs.length === 0 && (
            <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FiMessageSquare size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">No notes logged yet</h3>
              <p className="text-xs text-slate-400 mt-1">Click below to create your first meeting notes or minutes</p>
              <button
                onClick={() => openNewModal("note")}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[#004AAE] to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                + Add Meeting Notes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Interaction & Meeting Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    {modalMode === "meeting" ? <FiCalendar size={18} /> : <FiFileText size={18} />}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      {editingLog ? "Edit Record" : modalMode === "meeting" ? "Schedule Meeting" : "Add Meeting Notes / Minutes"}
                    </h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      {modalMode === "meeting" ? "Includes Instant Email & 30-Min Reminder" : "Store private notes and meeting minutes"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Mode Switcher */}
              {!editingLog && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl mb-4 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode("meeting");
                      setFormData(prev => ({ ...prev, interactionType: "Meeting", status: "Pending" }));
                      if (!meetingDate) setMeetingDate(new Date().toISOString().slice(0, 10));
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalMode === "meeting" ? "bg-[#004AAE] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FiCalendar size={13} /> Schedule Meeting
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode("note");
                      setFormData(prev => ({ ...prev, interactionType: "Other", status: "Completed" }));
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalMode === "note" ? "bg-[#004AAE] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FiFileText size={13} /> Note / Minutes Only
                  </button>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Client / Person / Subject *</label>
                  <input 
                    required
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    placeholder="e.g. John Doe / Acme Corp / Technical Team"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#004AAE] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Topic / Title (Optional)</label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Project Discovery Call / Sprint Planning"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#004AAE] transition"
                  />
                </div>

                {/* MEETING DATE & TIME PICKER WITH 12-HOUR AM/PM AND PKT PREVIEW */}
                {modalMode === "meeting" && (
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FiClock /> Meeting Date & Time (12-Hour PKT)
                      </label>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        PK Time (AM / PM)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 font-medium">Select Date</span>
                        <input 
                          required={modalMode === "meeting"}
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#004AAE] transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 font-medium">Select Time</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {/* Hour */}
                          <select
                            value={meetingHour}
                            onChange={(e) => setMeetingHour(e.target.value)}
                            className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#004AAE] font-mono font-bold text-center"
                          >
                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>

                          {/* Minute */}
                          <select
                            value={meetingMinute}
                            onChange={(e) => setMeetingMinute(e.target.value)}
                            className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#004AAE] font-mono font-bold text-center"
                          >
                            {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>

                          {/* AM / PM */}
                          <select
                            value={meetingAmpm}
                            onChange={(e) => setMeetingAmpm(e.target.value)}
                            className="px-2 py-2 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/40 rounded-xl text-xs text-amber-300 font-black focus:outline-none text-center"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Formatted Preview */}
                    {formattedPreviewTime && (
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
                        <span className="font-semibold text-[11px]">Scheduled for:</span>
                        <span className="font-bold text-emerald-400 font-mono text-[11px]">{formattedPreviewTime}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
                      <FiBell className="text-amber-400 shrink-0" size={13} />
                      <span>Instant confirmation email will be sent now, plus reminder <strong>30 minutes</strong> before.</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Type</label>
                    <select
                      value={formData.interactionType}
                      onChange={(e) => setFormData({...formData, interactionType: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#004AAE] transition"
                    >
                      <option value="Meeting">Meeting</option>
                      <option value="Call">Phone Call</option>
                      <option value="Email">Email Communication</option>
                      <option value="Other">Notes / General Discussion</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#004AAE] transition"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Follow-up">Follow-up Required</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {modalMode === "meeting" ? "Meeting Overview / Discussion Details *" : "Notes / Discussion Content *"}
                  </label>
                  <textarea 
                    required
                    value={formData.details}
                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                    placeholder={modalMode === "meeting" ? "Details, agenda, and discussion points..." : "Write your meeting notes, minutes or key details..."}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#004AAE] transition resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Meeting Notes & Key Action Items (Optional)</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Action items, decisions made, follow-up notes..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#004AAE] transition resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#004AAE] to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition cursor-pointer"
                  >
                    {editingLog ? "Update Record" : modalMode === "meeting" ? "Schedule & Confirm" : "Save Notes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, d: 0 });

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-3">
      {timeLeft.d > 0 && (
        <>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-black text-white">{timeLeft.d}</div>
            <div className="text-[9px] uppercase font-bold text-blue-200">DAYS</div>
          </div>
          <div className="text-xl font-black text-white/40">:</div>
        </>
      )}
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-black text-white">{timeLeft.h.toString().padStart(2, '0')}</div>
        <div className="text-[9px] uppercase font-bold text-blue-200">HRS</div>
      </div>
      <div className="text-xl font-black text-white/40">:</div>
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-black text-white">{timeLeft.m.toString().padStart(2, '0')}</div>
        <div className="text-[9px] uppercase font-bold text-blue-200">MIN</div>
      </div>
      <div className="text-xl font-black text-white/40">:</div>
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-black text-white">{timeLeft.s.toString().padStart(2, '0')}</div>
        <div className="text-[9px] uppercase font-bold text-blue-200">SEC</div>
      </div>
    </div>
  );
}
