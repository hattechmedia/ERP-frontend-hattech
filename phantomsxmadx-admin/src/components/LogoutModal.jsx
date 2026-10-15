import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";


export default function LogoutModal({ onClose }) {
  const navigate = useNavigate();

  const confirmLogout = () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
      if (currentUser.role === "employee") {
        const activities = JSON.parse(localStorage.getItem("employeeActivities")) || [];
        const today = new Date().toISOString().split('T')[0];

        // Find today's login record
        const activityIndex = activities.findIndex(a => a.employeeId === currentUser.id && a.date === today);

        if (activityIndex >= 0) {
          // Update checkout time
          activities[activityIndex].checkOut = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
          localStorage.setItem("employeeActivities", JSON.stringify(activities));
        }
      }
    }

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("checkIn");
    sessionStorage.removeItem("checkOut");
    window.location.href = "/";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[var(--bg-card)] p-8 rounded-2xl w-full max-w-sm space-y-6 border border-[var(--border-color)] shadow-2xl relative"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Log Out</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-2">Are you sure you want to end your session?</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmLogout}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition shadow-lg shadow-red-500/20"
            >
              Log Out
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
