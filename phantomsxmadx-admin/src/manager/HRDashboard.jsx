import { useState, useEffect } from "react";
import api from "../services/api";
import { FiUsers, FiFileText, FiCheckCircle, FiClock, FiBell } from "react-icons/fi";
import LoadingSpinner from "../components/LoadingSpinner";
import AnnouncementModal from "../components/AnnouncementModal";

export default function HRDashboard() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingDocuments: 0
  });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, statsRes] = await Promise.all([
          api.get('/employees'),
          api.get('/hr/stats')
        ]);

        const loadedEmployees = empRes.data.employees || empRes.data.data || [];
        // Include all staff roles except admin, client, and it_support
        const filteredEmployees = loadedEmployees.filter(emp => emp.userId?.role && !['admin', 'client', 'it_support'].includes(emp.userId.role));
        setEmployees(filteredEmployees);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching HR data", error);
      }
    };
    fetchData().finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#004AAE]/20 text-[#004AAE]">
            <FiUsers size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-theme-primary transition-colors">HR Dashboard</h1>
            <p className="text-sm text-theme-secondary transition-colors">Manage employees, attendance, and HR documents</p>
          </div>
        </div>

        <button
          onClick={() => setShowAnnouncementModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-[#004AAE] to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 transition cursor-pointer"
        >
          <FiBell size={16} /> Add Announcement
        </button>
      </div>

      {/* ANNOUNCEMENT MODAL */}
      <AnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
      />

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<FiUsers className="text-[#004AAE]" />}
          title="Total Employees"
          value={stats.totalEmployees}
          color="blue"
        />
        <StatCard
          icon={<FiCheckCircle className="text-green-500" />}
          title="Present Today"
          value={stats.presentToday}
          color="green"
        />
        <StatCard
          icon={<FiClock className="text-orange-500" />}
          title="Absent Today"
          value={stats.absentToday}
          color="orange"
        />
        <StatCard
          icon={<FiFileText className="text-[#004AAE]" />}
          title="Pending Docs"
          value={stats.pendingDocuments}
          color="custom-blue"
        />
      </div>

      {/* QUICK ACCESS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickAccessCard
          title="Employee Records"
          description="View and manage employee information, contracts, and details"
          icon={<FiUsers />}
          link="/hr/employee-records"
        />
        <QuickAccessCard
          title="Attendance Verification"
          description="Check and verify daily employee attendance records"
          icon={<FiCheckCircle />}
          link="/hr/attendance"
        />
        <QuickAccessCard
          title="Documents & Letters"
          description="Issue offer letters, appointment letters, and HR documents"
          icon={<FiFileText />}
          link="/hr/documents"
        />
        <QuickAccessCard
          title="Add New Employee"
          description="Register a new employee into the system"
          icon={<FiUsers />}
          link="/hr/employee-records"
        />
      </div>

      {/* RECENT EMPLOYEES */}
      <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <h3 className="font-semibold text-lg mb-4 text-theme-primary">Recent Employees</h3>
        <div className="space-y-3">
          {employees.slice(0, 5).map((emp) => (
            <div key={emp._id || emp.id} className="flex items-center justify-between p-3 rounded-lg bg-theme-tertiary">
              <div className="flex items-center gap-3">
                <img
                  src={emp.userId?.avatar || (emp.image && emp.image.length > 10 ? emp.image : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=004AAE&textColor=ffffff`)}
                  className="w-8 h-8 rounded-full object-cover"
                  alt={emp.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=gray`;
                  }}
                />
                <div>
                  <p className="font-medium text-sm text-theme-primary">{emp.name?.split(' ')[0]}</p>
                  <p className="text-xs text-theme-secondary">{emp.department || "N/A"}</p>
                </div>
              </div>
              <p className="text-xs px-2 py-1 rounded bg-[#004AAE]/20 text-[#004AAE]">Active</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  const colorStyles = {
    green: {
      border: "border-green-500/20",
      bg: "bg-green-500/10",
      text: "text-[#004AAE]",
      icon: "text-green-500",
    },
    red: {
      border: "border-red-500/20",
      bg: "bg-red-500/10",
      text: "text-[#004AAE]",
      icon: "text-red-500",
    },
    orange: {
      border: "border-orange-500/20",
      bg: "bg-orange-500/10",
      text: "text-[#004AAE]",
      icon: "text-orange-500",
    },
    purple: {
      border: "border-[#004AAE]/20",
      bg: "bg-[#004AAE]/10",
      text: "text-[#004AAE]",
      icon: "text-[#004AAE]",
    },
    "custom-blue": {
      border: "border-[#004AAE]/20",
      bg: "bg-[#004AAE]/10",
      text: "text-[#004AAE]",
      icon: "text-[#004AAE]",
    },
    blue: {
      border: "border-[#004AAE]/20",
      bg: "bg-[#004AAE]/10",
      text: "text-[#004AAE]",
      icon: "text-[#004AAE]",
    }
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className={`p-5 rounded-2xl border ${style.border} bg-[var(--bg-card)] shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-theme-secondary uppercase tracking-wide">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${style.text}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${style.bg} ${style.icon} text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAccessCard({ title, description, icon, link }) {
  return (
    <a
      href={link}
      className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-md transition cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-lg bg-[#004AAE]/20 text-[#004AAE] group-hover:scale-110 transition">
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-theme-primary">{title}</p>
          <p className="text-sm text-theme-secondary mt-1">{description}</p>
        </div>
      </div>
    </a>
  );
}
