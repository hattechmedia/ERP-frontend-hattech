import { FiLogOut, FiBell } from "react-icons/fi";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LogoutModal from "./LogoutModal";
import ThemeToggle from "./ThemeToggle";
import WinnerCelebrationModal from "./WinnerCelebrationModal";
import api from "../services/api";
import { NAVIGATION_ITEMS } from "../constants/navigation";

function Topbar() {
  const [showLogout, setShowLogout] = useState(false);
  const [profile, setProfile] = useState({ name: "", image: "" });
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [employeeOfTheMonth, setEmployeeOfTheMonth] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchEOTM = async () => {
      try {
        const res = await api.get('/achievements');
        if (res.data.success && Array.isArray(res.data.data)) {
          const monthAwards = res.data.data
            .filter(a => {
              const type = (a.awardType || a.title || '').toLowerCase();
              return type.includes('month') && !type.includes('6');
            })
            .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

          if (monthAwards.length > 0) {
            const latest = monthAwards[0];
            setEmployeeOfTheMonth({
              name: latest.user?.name || latest.user?.username || 'Employee',
              avatar: latest.user?.avatar || latest.user?.image || latest.user?.profileImage || '',
              department: latest.user?.department || '',
              position: latest.user?.position || 'Core Team',
              awardType: latest.awardType || 'Employee of the Month',
              title: latest.title || latest.awardType || 'Best Employee of the Month',
              description: latest.description || '',
              date: latest.date || latest.createdAt,
              score: 100
            });
          }
        }
      } catch (e) {
        // ignore
      }
    };

    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements');
        if (res.data.success && Array.isArray(res.data.data)) {
          setAnnouncements(res.data.data);
        }
      } catch (e) {
        // ignore
      }
    };

    fetchEOTM();
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 60000);
    return () => clearInterval(interval);
  }, []);

  // Performance: Fetch profile only once on mount. Static profile data doesn't change during a session.
  const fetchProfile = useCallback(async () => {
    try {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
      if (!currentUser) return;
      setRole(currentUser.role);

      const userRole = (currentUser.role || "").toLowerCase();
      let profileUrl = '';

      if (userRole === 'manager') profileUrl = '/profile/manager';
      else if (userRole === 'employee') profileUrl = `/profile/employee/${currentUser.id}`;
      else if (userRole === 'hr') profileUrl = '/profile/hr'; 
      else if (userRole === 'projecthead') profileUrl = '/profile/projecthead';
      else if (userRole === 'client') profileUrl = '/profile/client';
      else if (userRole === 'it_support' || userRole === 'it-support' || userRole === 'it') profileUrl = '/profile/it-support';
      else if (userRole === 'finance') profileUrl = '/profile/finance';
      else if (userRole === 'admin') profileUrl = '/profile/admin';
      
      if (!profileUrl) {
          setProfile({
            name: currentUser.name || "User",
            image: currentUser.avatar || ""
          });
          return;
      }

      try {
        const profileRes = await api.get(profileUrl);
        if (profileRes.data.success) {
          setProfile({
            name: profileRes.data.profile.name || currentUser.name,
            image: profileRes.data.profile.image || currentUser.avatar || ""
          });
        }
      } catch (err) {
        setProfile({ name: currentUser.name || "User", image: currentUser.avatar || "" });
      }
    } catch (error) {
      console.error("TopBar profile error:", error);
    }
  }, []);

  // Performance: Fetch only notifications in the polling interval (not the full profile).
  const fetchNotifications = useCallback(async () => {
    try {
      const notifRes = await api.get('/notifications');
      if (notifRes.data.success) {
        const allNotifs = notifRes.data.data;
        setNotifications(allNotifs);
        setUnreadCount(allNotifs.filter(n => !n.read).length);
      }
    } catch (error) {
      console.warn("Notifications sync skipped due to timeout or network issue.");
    }
  }, []);

  // Legacy: keep fetchProfileAndNotifications as a combined trigger for external events.
  const fetchProfileAndNotifications = useCallback(async () => {
    await fetchProfile();
    await fetchNotifications();
  }, [fetchProfile, fetchNotifications]);

  // Performance: Use a ref to read current search value inside the click-outside handler
  // without making `search` a dependency of the polling effect.
  const searchRef = useRef(search);
  useEffect(() => { searchRef.current = search; }, [search]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        if (searchRef.current === "") setShowSearchInput(false);
        setResults([]);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    // Fetch profile once on mount; notifications are refreshed by the interval below.
    fetchProfile();
    fetchNotifications();

    // SOCKET SETUP REMOVED
    // User requested to disable global websockets to prevent Vercel 404 errors flooding the console.
    // Notifications will now rely solely on the 30-second polling interval below.

    // Performance: Poll ONLY notifications every 30s — not the full profile (which is static).
    const interval = setInterval(fetchNotifications, 30000);

    window.addEventListener('storage', fetchProfileAndNotifications);
    window.addEventListener('profileUpdate', fetchProfile);
    window.addEventListener('notificationUpdate', fetchNotifications);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(interval);
      window.removeEventListener('storage', fetchProfileAndNotifications);
      window.removeEventListener('profileUpdate', fetchProfile);
      window.removeEventListener('notificationUpdate', fetchNotifications);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps: run once on mount. search is read via searchRef to avoid re-registering the interval.

  // Compatibility wrapper for components that expect loadNotifications
  const loadNotifications = () => fetchProfileAndNotifications();

  const showSearchBar = true; // Enable for all roles as requested

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const query = search.trim();
      if (query) {
        try {
          // 1. Backend Search (Database)
          const res = await api.get(`/search?q=${query}`);
          let dbResults = res.data.success ? res.data.data : [];

          // 2. Frontend Search (Navigation/Sidebar)
          const roleKey = role?.toLowerCase() || "";
          const navItems = NAVIGATION_ITEMS[roleKey] || [];
          const navResults = navItems
            .filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
            .map(item => ({
              id: item.to,
              name: item.label,
              type: 'nav',
              path: item.to
            }));

          setResults([...navResults, ...dbResults]);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, role]);

  const handleResultClick = (item) => {
    setSearch("");
    setResults([]);
    setShowSearchInput(false);

    // --- NAVIGATION LOGIC ---
    if (item.type === 'nav') {
      navigate(item.path);
    }
    else if (item.type === 'employee') {
      if (role === 'admin') navigate(`/admin/employee/${item.id}`);
      else if (role === 'hr') navigate(`/hr/employee/${item.id}`);
      else if (role === 'projecthead') navigate(`/projecthead/employee/${item.id}`);
      else navigate(`/employee/performance`);
    }
    else if (item.type === 'project') {
      if (role === 'admin') navigate(`/admin/project/${item.id}`);
      else if (role === 'manager') navigate('/manager/assign-tasks');
      else if (role === 'projecthead') navigate('/projecthead/track-projects');
      else if (role === 'client') navigate(`/client/project/${item.id}`);
    }
    else if (item.type === 'task') {
      if (role === 'manager') navigate('/manager/assign-tasks');
      else if (role === 'projecthead') navigate('/projecthead/assign-projects');
      else if (role === 'employee') navigate('/employee/my-tasks');
      else if (role === 'admin') navigate('/admin/activity');
    }
    else if (item.type === 'request') {
      if (role === 'client') navigate('/client/requests');
    }
  };

  const handleSearchIconClick = () => {
    setShowSearchInput(true);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 10);
  };

  // Notification functions
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) fetchProfileAndNotifications();
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await api.put(`/notifications/${notif._id}/read`);
        // Update local state instad of full fetch for speed
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      setShowNotifications(false);

      // Navigation Logic
      // 1. CHAT
      if (notif.onModel === 'Chat' && notif.relatedId) {
        let basePath = '/admin/chat'; // Default
        if (role === 'projecthead') basePath = '/projecthead/chat';
        else if (role === 'client') basePath = '/client/chat';
        else if (role === 'employee') basePath = '/employee/chat';
        else if (role === 'hr') basePath = '/hr/chat';
        else if (role === 'manager') basePath = '/manager/chat';

        navigate(basePath, { state: { chatId: notif.relatedId } });
      }
      // 2. PROJECT
      else if (notif.onModel === 'Project' && notif.relatedId) {
        if (role === 'admin') navigate(`/admin/project/${notif.relatedId}`);
        else if (role === 'client') navigate(`/client/project/${notif.relatedId}`);
        else if (role === 'projecthead') navigate(`/projecthead/track-projects`); // Or specific details if available
        else if (role === 'manager') navigate(`/manager/assign-tasks`); // Or specific
        else if (role === 'employee') navigate(`/employee/my-tasks`); // Employee doesn't have project details view usually
      }
      // 3. TASK
      else if (notif.onModel === 'Task' && notif.relatedId) {
        if (role === 'admin') navigate(`/admin/activity`); // Or tasks view
        else if (role === 'employee') navigate(`/employee/my-tasks`);
        else if (role === 'manager') navigate(`/manager/assign-tasks`);
        else if (role === 'projecthead') navigate(`/projecthead/assign-projects`);
      }
      // 4. LEAVE / REQUESTS
      else if (notif.type === 'LEAVE_REQUEST' || notif.title.toLowerCase().includes('leave')) {
        if (role === 'admin') navigate(`/admin/requests`);
        else if (role === 'hr') navigate(`/hr/attendance`); // Assuming leave requests are there
        else if (role === 'manager') navigate(`/manager/attendance`);
        else navigate(`/${role}/attendance`);
      }
    } catch (err) {
      console.error("Failed to handle notification click", err);
    }
  };

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      fetchProfileAndNotifications();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications/read-all`);
      fetchProfileAndNotifications();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const clearAllNotifications = async () => {
    // Backend might not have clear-all, or it just marks all as read and hide?
    // Let's assume clear-all means delete all. 
    // For now, mark all as read is safer if delete all is not implemented.
    markAllAsRead();
    setShowNotifications(false);
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 h-16 md:h-14 w-full flex items-center justify-between px-3 md:px-4 shadow-sm bg-[var(--bg-main)] transition-all"
      >
        {/* EMPTY LEFT SIDE FOR BALANCE - Hide on mobile if search is open */}
        <div className={`flex-1 md:flex-none ${showSearchInput ? 'hidden md:block' : ''}`}></div>

        {/* RIGHT SIDE: SEARCH, NOTIFICATION, THEME, PROFILE, LOGOUT */}
        {/* If search is open on mobile, this container takes full width */}
        <div className={`flex items-center gap-2 md:gap-3 ml-auto ${showSearchInput ? 'w-full md:w-auto' : ''}`}>

          {/* SEARCH - MOVED BEFORE NOTIFICATIONS */}
          {showSearchBar && (
            <div className={`transition-all duration-200 ${showSearchInput ? 'flex-1 md:flex-none' : ''}`} ref={searchContainerRef}>
              <div className="flex items-center w-full relative">
                {showSearchInput ? (
                  <div className="fixed left-14 right-0 top-0 h-16 bg-[var(--bg-main)] z-[100] flex items-center px-4 md:static md:bg-transparent md:h-auto md:p-0 md:inset-auto animate-in fade-in slide-in-from-right-4 duration-200 shadow-md md:shadow-none rounded-l-xl md:rounded-none">
                    <div className="relative flex-1 md:flex-none w-full md:w-auto">
                      <input
                        ref={searchInputRef}
                        type="text"
                        className="w-full md:w-64 p-2 pl-4 pr-8 rounded-lg border border-gray-300 dark:border-gray-600 
                                 !text-gray-900 dark:!text-gray-100 !bg-gray-100 dark:!bg-gray-800 text-base 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        placeholder="Search..."
                        value={search}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowSearchInput(false);
                            setSearch("");
                            setResults([]);
                          }
                        }}
                      />

                      {search && (
                        <button
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          onClick={() => {
                            setSearch("");
                            setResults([]);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <button
                      className="ml-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium transition-colors whitespace-nowrap"
                      onClick={() => {
                        setShowSearchInput(false);
                        setSearch("");
                        setResults([]);
                      }}
                    >
                      Cancel
                    </button>

                    {/* SEARCH RESULTS DROPDOWN */}
                    {search.trim() !== "" && results.length > 0 && (
                      <div className="absolute top-full mt-2 left-0 right-0 md:bg-white md:dark:bg-gray-800 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 max-h-80 overflow-y-auto z-50 min-w-[200px] w-full md:w-80">
                        <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          Search Results ({results.length})
                        </div>
                        {results.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                            onClick={() => handleResultClick(item)}
                          >
                            <div className="flex items-center gap-3">
                              {/* ICON BASED ON TYPE */}
                              <div className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 
                                ${item.type === 'employee' ? 'bg-[#004AAD]/10 dark:bg-[#004AAD]/20 text-[#004AAD] dark:text-[#004AAD]' :
                                  item.type === 'project' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' :
                                    item.type === 'nav' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' :
                                      'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' // task
                                }`}>
                                {item.type === 'employee' ? (
                                  item.image ? (
                                    <img src={item.image} className="w-full h-full rounded-full object-cover" alt={item.name} />
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                  )
                                ) : item.type === 'project' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                  </svg>
                                ) : item.type === 'nav' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                  </svg>
                                ) : (
                                  // Task Icon
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                  </svg>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 truncate capitalize flex items-center gap-1">
                                  {item.type}
                                  {item.type === 'employee' && item.role ? ` • ${item.role}` : ''}
                                  {item.type === 'project' && item.client ? ` • ${item.client}` : ''}
                                  {item.type === 'task' && item.status ? ` • ${item.status}` : ''}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
                    title="Search"
                    onClick={handleSearchIconClick}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white [.light_&]:text-gray-700">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* NOTIFICATION BELL */}
          <div className={`relative ${showSearchInput ? 'hidden md:block' : ''}`} ref={notificationRef}>
            <button
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200 relative"
              title="Notifications"
              onClick={toggleNotifications}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white [.light_&]:text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            {showNotifications && (
              <div
                className="fixed top-20 left-1/2 -translate-x-1/2 w-[90vw] max-w-sm md:absolute md:top-12 md:right-0 md:w-80 md:left-auto md:translate-x-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 max-h-96 overflow-y-auto z-50"
              >
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!notification.read ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                            <FiBell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className={`font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {notification.time || new Date(notification.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
                    <button
                      onClick={() => navigate(`/${role}/notifications`)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* THEME TOGGLE */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>

          {/* PROFILE IMAGE */}
          {/* PROFILE IMAGE OR AVATAR */}
          <div
            className={`cursor-pointer group flex items-center gap-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all ${showSearchInput ? 'hidden md:flex' : 'flex'}`}
            onClick={() => {
              const userRole = role?.toLowerCase();
              if (userRole === "admin" || userRole === "it_support" || userRole === "it") navigate("/admin/profile");
              else if (userRole === "manager") navigate("/manager/profile");
              else if (userRole === "hr") navigate("/hr/profile");
              else if (userRole === "projecthead") navigate("/projecthead/profile");
              else if (userRole === "employee" || userRole === "teamlead") navigate("/employee/profile");
              else if (userRole === "client") navigate("/client/profile");
              else if (userRole === "finance") navigate("/finance/profile");
            }}
            title="View Profile"
          >
            <img
              src={profile.image && (profile.image.startsWith('data:') || profile.image.startsWith('http')) ? profile.image : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}&backgroundColor=004AAE&textColor=ffffff`}
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover border border-gray-300 dark:border-gray-600 bg-white group-hover:scale-105 transition-transform"
            />
          </div>

          {/* LOGOUT BUTTON */}
          <button
            onClick={() => setShowLogout(true)}
            className={`flex items-center gap-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm transition-colors duration-200 ${showSearchInput ? 'hidden md:flex' : ''}`}
          >
            <FiLogOut />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* LIVE ANNOUNCEMENTS MARQUEE / TICKER RIBBON */}
      {announcements && announcements.length > 0 && (
        <div className="w-full bg-gradient-to-r from-[#101426] via-[#181f38] to-[#101426] border-b border-indigo-500/30 px-4 py-2 flex items-center overflow-hidden text-xs shadow-md">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-[10px] uppercase tracking-wider shrink-0 border border-indigo-500/30 mr-4 shadow-sm">
            <span className="animate-pulse">📢</span> ANNOUNCEMENT
          </div>
          <div className="overflow-hidden whitespace-nowrap flex-1 relative">
            <div className="inline-block animate-marquee whitespace-nowrap text-slate-200 font-medium text-xs">
              {announcements.map((ann, idx) => {
                const annDateStr = ann.date ? new Date(ann.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
                return (
                  <span key={ann._id || idx} className="inline-flex items-center gap-2 mr-16">
                    <span className="font-black text-amber-300 uppercase">
                      {ann.type === 'holiday' ? '🏖️ [HOLIDAY/OFF]' : ann.type === 'urgent' ? '🚨 [URGENT NOTICE]' : ann.type === 'event' ? '🎉 [EVENT]' : '📢 [NOTICE]'}:
                    </span>
                    {annDateStr && (
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-amber-200 font-mono text-[10px] font-bold">
                        📅 {annDateStr}
                      </span>
                    )}
                    <span className="font-bold text-white">{ann.title}</span> —
                    <span className="text-slate-300">{ann.description}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING EMPLOYEE OF THE MONTH CIRCLE AVATAR (EXACTLY ABOVE CHAT BUTTON) */}
      {employeeOfTheMonth && 
       !location.pathname.startsWith('/client') && 
       !location.pathname.startsWith('/partner') && 
       (role?.toLowerCase() !== 'client') && 
       (role?.toLowerCase() !== 'partner') && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowWinnerModal(true)}
          className="fixed bottom-[90px] right-7 z-[100] w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-2xl hover:shadow-amber-500/60 cursor-pointer transition-all duration-300 group flex items-center justify-center ring-2 ring-amber-400/40"
          title={`Employee of the Month: ${employeeOfTheMonth.name} (Click to view celebration)`}
        >
          <img 
            src={employeeOfTheMonth.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employeeOfTheMonth.name)}&backgroundColor=004AAE&textColor=ffffff`}
            className="w-full h-full rounded-full object-cover border-2 border-[#0d101d] shadow-inner bg-gray-900"
            alt={employeeOfTheMonth.name}
          />
          {/* Floating Crown on Top */}
          <span className="absolute -top-2.5 -right-1 text-sm filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce">
            👑
          </span>
        </motion.button>
      )}

      {/* WINNER CELEBRATION MODAL */}
      <AnimatePresence>
        {showWinnerModal && employeeOfTheMonth && (
          <WinnerCelebrationModal
            winner={employeeOfTheMonth}
            onClose={() => setShowWinnerModal(false)}
          />
        )}
      </AnimatePresence>

      {/* LOGOUT MODAL */}
      {showLogout && (
        <LogoutModal onClose={() => setShowLogout(false)} />
      )}
    </>
  );
}

export default Topbar;