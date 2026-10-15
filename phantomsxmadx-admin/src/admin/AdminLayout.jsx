import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import Topbar from "../components/Topbar";
import { useState, useEffect } from "react";
import { IoIosChatboxes } from "react-icons/io";
import api from "../services/api";
import TaskAssignModal from "../components/TaskAssignModal";
import AdminAIChatDrawer from "../components/AdminAIChatDrawer";
import { Toaster } from "react-hot-toast";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [selectedProjectForChat, setSelectedProjectForChat] = useState(null);
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const checkTheme = () => setIsLight(document.body.classList.contains('light'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleOpenTaskModal = () => setShowTaskModal(true);
    window.addEventListener('open-task-assign', handleOpenTaskModal);
    return () => window.removeEventListener('open-task-assign', handleOpenTaskModal);
  }, []);

  // Calculate Unread Messages
  useEffect(() => {
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

    fetchUnreadCount();

    // Listen for custom events if needed or just poll
    fetchUnreadCount();

    // Listen for custom events if needed or just poll
    const interval = setInterval(fetchUnreadCount, 15000); // Poll every 15s backups

    // Event Listener for Manual Updates (from GeneralChat)
    const handleNotificationUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);

    // SOCKET REMOVED
    // Global WebSockets are disabled due to Vercel polling 404s.
    // WebSockets are now exclusive to the GeneralChat component.

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, [currentUser?.name]);

  // Fail-safe: If not logged in, don't render anything (ProtectedRoute catches this, but just in case)
  if (!currentUser) return null;

  const userRole = currentUser?.role || "admin";

  const tasks = [
    {
      title: "Design Dashboard UI",
      project: "Admin ERP Panel",
      assignedTo: "Ali Khan",
      status: "In Progress",
      progress: 65,
      assignedPersons: ["Ali Khan", "Sara Ahmed", "John Doe"]
    },
    {
      title: "Create Login Page",
      project: "Website Redesign",
      assignedTo: "Sara Ahmed",
      status: "Completed",
      progress: 100,
      assignedPersons: ["Sara Ahmed", "Mike Chen"]
    },
    {
      title: "API Integration",
      project: "Mobile App",
      assignedTo: "John Doe",
      status: "In Progress",
      progress: 30,
      assignedPersons: ["John Doe", "Emma Wilson"]
    },
  ];

  const projects = Array.from(new Set(tasks.map(t => t.project)));

  return (
    <div className="flex h-screen bg-[var(--bg-dark)] relative font-primary text-[var(--text-primary)]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-[var(--bg-dark)]">
          <Outlet />
        </main>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => navigate(`/${userRole}/chat`)}
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

      {/* Admin AI Chat Assistant */}
      <AdminAIChatDrawer />

      <Toaster position="top-right" />
    </div>
  );
}
