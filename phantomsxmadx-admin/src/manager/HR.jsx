import { useState, useEffect } from "react";
import { FiUsers, FiCheckCircle, FiClock, FiFileText, FiPlus } from "react-icons/fi";

export default function HR() {
  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const isLight = typeof document !== 'undefined' && document.body.classList.contains('light');

  useEffect(() => {
    const storedEmployees = JSON.parse(localStorage.getItem("employees")) || [];
    setEmployees(storedEmployees);
  }, []);

  const activeCount = employees.filter(e => e.status === "Active").length;
  const onLeave = employees.filter(e => e.status === "On Leave").length;

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
            <FiUsers size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">HR Management</h1>
            <p className="text-sm text-theme-secondary">Manage employees, attendance, and HR operations</p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DeptCard
          icon={<FiUsers className="text-blue-500" />}
          title="Total Employees"
          value={employees.length}
          color="blue"
          isLight={isLight}
        />
        <DeptCard
          icon={<FiCheckCircle className="text-green-500" />}
          title="Active"
          value={activeCount}
          color="green"
          isLight={isLight}
        />
        <DeptCard
          icon={<FiClock className="text-orange-500" />}
          title="On Leave"
          value={onLeave}
          color="orange"
          isLight={isLight}
        />
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-[var(--border-color)]">
        <Tab active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
          Employee Overview
        </Tab>
        <Tab active={activeTab === "attendance"} onClick={() => setActiveTab("attendance")}>
          Attendance Records
        </Tab>
        <Tab active={activeTab === "documents"} onClick={() => setActiveTab("documents")}>
          HR Documents
        </Tab>
      </div>

      {/* CONTENT */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {employees.length > 0 ? (
            employees.map((emp) => (
              <div
                key={emp.id}
                className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={emp.image || "https://via.placeholder.com/48"}
                      className="w-12 h-12 rounded-full object-cover"
                      alt={emp.name}
                    />
                    <div>
                      <p className="font-semibold">{emp.name}</p>
                      <p className="text-sm text-gray-500">{emp.department || "N/A"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-theme-primary">
                      {emp.status || "Active"}
                    </p>
                    <p className="text-xs text-gray-500">Email: {emp.email}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={<FiUsers />} message="No employees found" />
          )}
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
            <FiFileText size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Attendance records will be synced from Employee Panel</p>
            <p className="text-xs text-gray-400 mt-1">Auto-marked attendance data appears here</p>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
            <FiFileText size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">HR documents and policies stored here</p>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 mx-auto">
              <FiPlus /> Upload Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeptCard({ icon, title, value, color, isLight }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-900 dark:text-blue-300' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-900 dark:text-green-300' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-900 dark:text-orange-300' }
  };

  return (
    <div className={`p-5 rounded-xl border border-2 ${colorMap[color].bg} ${colorMap[color].text}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-3xl opacity-50">{icon}</div>
      </div>
    </div>
  );
}

function Tab({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition border-b-2 ${
        active
          ? 'text-theme-primary border-purple-500'
          : 'text-gray-500 border-transparent hover:text-theme-primary'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="p-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
      <div className="text-4xl text-gray-400 mb-3">{icon}</div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
