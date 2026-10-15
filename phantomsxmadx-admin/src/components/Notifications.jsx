import { useState, useEffect } from "react";
import { FiBell, FiCheckCircle, FiTrash2, FiClock, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";

const Notifications = () => {
    const { confirm } = useModal();
    const { user: currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            if (res.data.success) {
                // Map backend notifications to UI format if necessary
                // Backend: recipient, title, message, read, createdAt
                const mapped = res.data.data.map(n => ({
                    id: n._id,
                    title: n.title,
                    message: n.message,
                    read: n.read,
                    time: new Date(n.createdAt).toLocaleString(),
                    type: n.type,
                    relatedId: n.relatedId,
                    onModel: n.onModel
                }));
                setNotifications(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchNotifications();
        }
    }, [currentUser]);

    const handleNotificationClick = async (notif) => {
        try {
            if (!notif.read) {
                await api.put(`/notifications/${notif.id}/read`);
                // Update local state instad of full fetch for speed
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
            }

            // Navigation Logic
            if (notif.onModel === 'Chat' && notif.relatedId) {
                const role = currentUser?.role || 'employee';
                let basePath = `/${role}/chat`;
                // Adjust path for projecthead if needed, usually /projecthead/chat works if defined in routes
                if (role === 'projecthead') basePath = '/projecthead/chat';

                navigate(basePath, { state: { chatId: notif.relatedId } });
            }
        } catch (err) {
            console.error("Failed to handle notification click", err);
        }
    };

    const markAsRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
            toast.success("Notification marked as read");
        } catch (err) {
            console.error("Failed to mark read", err);
            toast.error("Failed to update notification");
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            fetchNotifications();
            toast.success("All notifications marked as read");
        } catch (err) {
            console.error("Failed to mark all read", err);
            toast.error("Failed to update notifications");
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            fetchNotifications();
        } catch (err) {
            console.error("Failed to delete notification", err);
        }
    };

    const clearAll = async () => {
        // Backend mark-all-read is usually enough, but if we want to delete...
        // For now, let's just mark all as read or delete if we add delete-all
        const isConfirmed = await confirm({
            title: 'Clear Notifications',
            message: 'Are you sure you want to delete all your notifications? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (isConfirmed) {
            // Delete one by one if no bulk delete endpoint
            for (const n of notifications) {
                await api.delete(`/notifications/${n.id}`);
            }
            fetchNotifications();
            toast.success("All notifications cleared");
        }
    };

    const handleBackToDashboard = () => {
        // Navigate based on role or just go back
        if (currentUser?.role === 'admin') navigate('/admin');
        else if (currentUser?.role === 'projecthead') navigate('/project-head');
        else if (currentUser?.role === 'employee') navigate('/employee/dashboard');
        else if (currentUser?.role === 'client') navigate('/client/dashboard');
        else navigate('/'); // Fallback
    };

    return (
        <div className="space-y-8 pt-14 md:pt-0 max-w-5xl mx-auto px-4 sm:px-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[var(--border-color)] pb-6">
                <div>
                    <button
                        onClick={handleBackToDashboard}
                        className="mb-4 text-sm font-medium text-gray-800 hover:text-[#004AAE] flex items-center gap-2 transition-colors group"
                    >
                        <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-[#004AAE]/10 transition-colors">
                            <FiArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-theme-primary">
                        <span className="p-3 bg-[#004AAE] !text-white rounded-2xl shadow-lg shadow-blue-500/20">
                            <FiBell size={24} />
                        </span>
                        Notifications
                    </h1>
                    <p className="text-theme-secondary text-base mt-2 ml-14">Stay updated with your latest system activities and alerts.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    {notifications.length > 0 && (
                        <>
                            <button
                                onClick={markAllAsRead}
                                className="flex-1 md:flex-none px-5 py-2.5 bg-[#004AAE]/10 text-[#004AAE] rounded-xl text-sm font-bold hover:bg-[#004AAE]/20 transition flex items-center justify-center gap-2"
                            >
                                <FiCheckCircle /> Mark all read
                            </button>
                            <button
                                onClick={clearAll}
                                className="flex-1 md:flex-none px-5 py-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition flex items-center justify-center gap-2"
                            >
                                <FiTrash2 /> Clear all
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-theme-secondary bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] border-dashed">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
                            <FiBell className="text-4xl text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-theme-primary mb-2">No notifications yet</h3>
                        <p className="text-sm">We'll let you know when something important happens.</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-6 rounded-2xl border transition-all duration-300 group relative cursor-pointer
                        ${notif.read
                                    ? 'bg-[var(--bg-card)] border-[var(--border-color)] opacity-80 hover:opacity-100 hover:shadow-md'
                                    : 'bg-white dark:bg-gray-800 border-l-4 border-l-[#004AAE] border-y-[var(--border-color)] border-r-[var(--border-color)] shadow-lg shadow-blue-500/5 translate-x-2'}
                    `}
                        >
                            <div className="flex gap-5">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                            ${notif.read
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                        : 'bg-[#004AAE] !text-white'}
                        `}>
                                    <FiBell size={22} className={!notif.read ? 'animate-pulse-slow' : ''} />
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                        <h3 className={`font-bold text-lg leading-tight ${notif.read ? 'text-theme-secondary font-medium' : 'text-theme-primary'}`}>
                                            {notif.title}
                                        </h3>
                                        <span className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5 bg-[var(--bg-main)] px-3 py-1.5 rounded-full border border-[var(--border-color)] w-fit whitespace-nowrap">
                                            <FiClock size={12} className="text-[#004AAE]" /> {notif.time}
                                        </span>
                                    </div>

                                    <p className="text-theme-secondary text-sm leading-relaxed max-w-3xl">{notif.message}</p>

                                    {!notif.read && (
                                        <button
                                            onClick={(e) => markAsRead(notif.id, e)}
                                            className="text-xs font-bold text-[#004AAE] hover:text-[#003882] hover:underline mt-3 flex items-center gap-1"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-[#004AAE]" />
                                            Mark as read
                                        </button>
                                    )}
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2.5 text-gray-400 hover:text-red-500 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-900/10 focus:opacity-100"
                                    title="Delete notification"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
