import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import HRSidebar from "../components/HRSidebar";
import Topbar from "../components/Topbar";
import { IoIosChatboxes } from "react-icons/io";
import api from "../services/api";

export default function HRLayout() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");

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

    const interval = setInterval(fetchUnreadCount, 15000);

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

  return (
    <div className="flex h-screen bg-[var(--bg-dark)]">
      <HRSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-[var(--bg-dark)]">
          <Outlet />
        </main>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => navigate("/hr/chat")}
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
    </div>
  );
}
