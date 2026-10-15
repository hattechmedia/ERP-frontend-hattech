import { Outlet, useLocation, useNavigate } from "react-router-dom";
import EmployeeSidebar from "../components/EmployeeSidebar";
import Topbar from "../components/Topbar";
import { useState, useEffect } from "react";
import { IoIosChatboxes } from "react-icons/io";
import { FiClock, FiCalendar, FiAlertCircle, FiCheckCircle, FiChevronRight } from "react-icons/fi";
import api from "../services/api";
import PolicyAcceptanceModal from "../components/PolicyAcceptanceModal";

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [warnings, setWarnings] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [attendanceSummary, setAttendanceSummary] = useState({ late: 0, absent: 0, leave: 0, present: 0 });
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("currentUser") || "{}");
    } catch (e) {
      return {};
    }
  });

  const fetchWarnings = async () => {
    try {
      const res = await api.get('/hr/documents');
      if (res.data.success) {
        // Filter for warnings
        const userWarnings = res.data.data.filter(d => d.type === 'warning');
        setWarnings(userWarnings);
      }
    } catch (err) {
      console.error("Failed to fetch warnings", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const res = await api.get('/hr/attendance');
      if (res.data.success && Array.isArray(res.data.data)) {
        const now = new Date();
        const curMonth = now.getMonth();
        const curYear = now.getFullYear();

        const monthData = res.data.data.filter(a => {
          const d = new Date(a.date);
          return d.getMonth() === curMonth && d.getFullYear() === curYear;
        });

        const late = monthData.filter(a => a.status === 'Late' || a.isLate).length;
        const absent = monthData.filter(a => a.status === 'Absent').length;
        const leave = monthData.filter(a => a.status === 'Leave' || a.status === 'Short Leave').length;
        const present = monthData.filter(a => ['Present', 'Verified', 'Late', 'Report not submitted'].includes(a.status) || a.isVerified).length;

        setAttendanceSummary({ late, absent, leave, present });
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchWarnings();
    fetchAttendanceSummary();

    // Check policy acceptance status
    const checkPolicy = async () => {
      const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      setCurrentUser(user);
      if (user && user.policyAccepted === false) {
        setShowPolicyModal(true);
      } else if (user && user.id) {
        // Double-check with backend /auth/me
        try {
          const meRes = await api.get('/auth/me');
          if (meRes.data.success && meRes.data.user) {
            const dbUser = meRes.data.user;
            if (dbUser.policyAccepted === false) {
              setShowPolicyModal(true);
            }
          }
        } catch (e) {}
      }
    };
    checkPolicy();

    // Poll for warnings and attendance
    const interval = setInterval(() => {
      fetchWarnings();
      fetchAttendanceSummary();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Chat Notification Logic
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/chats/unread/count');
      if (res.data.success) {
        setUnreadCount(res.data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  };

  useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 15000);

    const handleNotificationUpdate = () => {
      fetchUnreadCount();
      fetchAttendanceSummary();
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, []);

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="flex h-screen bg-[var(--bg-main)] transition-colors duration-200 relative">
      <EmployeeSidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        <Topbar />

        {/* MONTHLY ATTENDANCE SUMMARY STATUS STRIP */}
        <div className="bg-[#12162a]/95 border-b border-indigo-500/20 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md z-30 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-[#004AAE]/20 text-blue-400 border border-[#004AAE]/30">
              <FiCalendar size={13} />
            </div>
            <span className="font-black text-white text-[11px] uppercase tracking-wider">
              {currentMonthName} Logs:
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* LATE COUNT BADGE */}
            <div 
              onClick={() => navigate('/employee/attendance')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs cursor-pointer hover:bg-amber-500/20 transition-all shadow-sm"
              title="Total Late days this month"
            >
              <FiClock size={12} className="animate-pulse" />
              <span>Late: <strong className="text-amber-300 ml-0.5">{attendanceSummary.late}</strong></span>
            </div>

            {/* ABSENT COUNT BADGE */}
            <div 
              onClick={() => navigate('/employee/attendance')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-black text-xs cursor-pointer hover:bg-red-500/20 transition-all shadow-sm"
              title="Total Absent days this month"
            >
              <FiAlertCircle size={12} />
              <span>Absent: <strong className="text-red-300 ml-0.5">{attendanceSummary.absent}</strong></span>
            </div>

            {/* LEAVES COUNT BADGE */}
            <div 
              onClick={() => navigate('/employee/attendance')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-black text-xs cursor-pointer hover:bg-yellow-500/20 transition-all shadow-sm"
              title="Total Leave days this month"
            >
              <FiCalendar size={12} />
              <span>Leave: <strong className="text-yellow-300 ml-0.5">{attendanceSummary.leave}</strong></span>
            </div>

            {/* PRESENT COUNT BADGE */}
            <div 
              onClick={() => navigate('/employee/attendance')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-xs cursor-pointer hover:bg-emerald-500/20 transition-all shadow-sm"
              title="Total Present days this month"
            >
              <FiCheckCircle size={12} />
              <span>Present: <strong className="text-emerald-300 ml-0.5">{attendanceSummary.present}</strong></span>
            </div>

            {/* NAVIGATE BUTTON */}
            <button
              onClick={() => navigate('/employee/attendance')}
              className="text-[10px] uppercase font-black tracking-wider text-blue-400 hover:text-blue-300 flex items-center gap-0.5 hover:underline pl-1 cursor-pointer"
            >
              <span>Full Details</span>
              <FiChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* WARNING ICON (BADGE) */}
        {!loading && warnings.length > 0 && (
          <button
            onClick={() => setShowWarningModal(true)}
            className="absolute top-24 right-6 z-40 bg-red-500 text-white p-3 rounded-full shadow-lg shadow-red-500/30 hover:scale-105 transition animate-bounce"
            title="View Warnings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-white text-red-600 font-bold text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-red-500">
              {warnings.length}
            </span>
          </button>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-[var(--bg-dark)] relative">
          <Outlet key={location.pathname} />
        </main>

        {/* WARNING DETAILS MODAL */}
        {showWarningModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[var(--bg-card)] max-w-lg w-full rounded-2xl border-2 border-red-500 shadow-2xl overflow-hidden">
              <div className="bg-red-500/10 p-4 border-b border-red-500/30 flex justify-between items-center">
                <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  Warning Details ({warnings.length})
                </h3>
                <button onClick={() => setShowWarningModal(false)} className="text-gray-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {warnings.map((w) => (
                  <div key={w._id} className="bg-[var(--bg-main)] p-4 rounded-xl border border-red-500/20">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-lg text-[var(--text-primary)]">{w.title}</span>
                      <span className="text-xs text-[var(--text-secondary)]">{new Date(w.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      <span className="font-semibold text-red-400 block mb-1">Reason:</span>
                      {w.description || w.content || "No details provided."}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-color)] bg-[var(--bg-card)]">
                Please contact HR for further discussion regarding these warnings.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => navigate("/employee/chat")}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-gradient-to-br from-[#004AAE] to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-[#004AAE]/40 transition-all transform hover:scale-110 active:scale-95 group border border-white/10"
        title="General Chat"
      >
        <IoIosChatboxes size={30} fill="white" style={{ color: 'white' }} className="group-hover:rotate-6 transition-transform text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 bg-red-500 text-white text-[11px] font-bold rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center shadow-lg animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* MANDATORY POLICY ACCEPTANCE MODAL FOR NEW EMPLOYEES */}
      <PolicyAcceptanceModal
        isOpen={showPolicyModal}
        user={currentUser}
        onAcceptSuccess={(updatedUser) => {
          setCurrentUser(updatedUser);
          setShowPolicyModal(false);
        }}
      />
    </div>
  );
}
