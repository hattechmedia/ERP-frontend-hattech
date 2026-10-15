import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import ProjectHeadSidebar from "../components/ProjectHeadSidebar";
import { IoIosChatboxes } from "react-icons/io";
import api from "../services/api";
import TaskAssignModal from "../components/TaskAssignModal";
import { Toaster } from "react-hot-toast";

export default function ProjectHeadLayout() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    const checkTheme = () => setIsLight(document.body.classList.contains('light'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const fetchWarnings = async () => {
    try {
      const res = await api.get('/hr/documents');
      if (res.data.success && Array.isArray(res.data.data)) {
        const userWarnings = res.data.data.filter(d => d.type === 'warning');
        setWarnings(userWarnings);
      }
    } catch (err) {
      console.error("Failed to fetch project head warnings", err);
    }
  };

  useEffect(() => {
    const handleOpenTaskModal = () => setShowTaskModal(true);
    window.addEventListener('open-task-assign', handleOpenTaskModal);
    return () => window.removeEventListener('open-task-assign', handleOpenTaskModal);
  }, []);

  // Calculate Unread Messages
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get(`/chats/unread/count?t=${new Date().getTime()}`);
      if (res.data.success) {
        setUnreadCount(res.data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchWarnings();

    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchWarnings();
    }, 15000);

    const handleNotificationUpdate = () => {
      fetchUnreadCount();
      fetchWarnings();
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, [currentUser?.name]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] relative">
      <ProjectHeadSidebar />
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <Topbar />

        {/* WARNING BADGE / BUTTON */}
        {warnings.length > 0 && (
          <button
            onClick={() => setShowWarningModal(true)}
            className="absolute top-20 right-6 z-40 bg-red-500 text-white p-3 rounded-full shadow-lg shadow-red-500/30 hover:scale-105 transition animate-bounce flex items-center justify-center"
            title="View Disciplinary Warnings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-white text-red-600 font-bold text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-red-500 shadow">
              {warnings.length}
            </span>
          </button>
        )}

        <main className="flex-1 p-6 md:p-8 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => navigate("/projecthead/chat")}
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

      {/* Task Assignment Modal */}
      <TaskAssignModal 
        isOpen={showTaskModal} 
        onClose={() => setShowTaskModal(false)} 
        isLight={isLight} 
      />

      {/* WARNING DETAILS MODAL */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] max-w-lg w-full rounded-2xl border-2 border-red-500 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-500/10 p-4 border-b border-red-500/30 flex justify-between items-center">
              <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Official Disciplinary Warnings ({warnings.length})
              </h3>
              <button onClick={() => setShowWarningModal(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {warnings.map((w) => (
                <div key={w._id} className="bg-[var(--bg-main)] p-4 rounded-xl border border-red-500/20 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-base text-[var(--text-primary)]">{w.title}</span>
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono">{new Date(w.createdAt || w.issuedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs leading-relaxed text-[var(--text-secondary)] bg-black/20 p-3 rounded-lg border border-red-500/10">
                    <span className="font-semibold text-red-400 block mb-1">Notice Details:</span>
                    {w.description || w.content || "No details provided."}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-color)] bg-[var(--bg-card)]">
              Please contact Management or HR for clarification regarding compliance notices.
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}
