import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiDownload, FiCheckCircle, FiXCircle, FiClock, FiEye, FiBarChart2, FiArchive, FiFileText, FiEdit } from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import api from "../services/api";
import LinkifyText from "../components/LinkifyText";

const cleanName = (name) => {
  if (!name || typeof name !== 'string') return name || "Employee";

  // If the name already looks like a full name (has spaces and capitalized words), leave it
  if (name.includes(' ') && /[A-Z]/.test(name)) return name;

  let base = name.split('@')[0];
  if (base.includes(' ')) {
    return base.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }

  // Handle technical usernames like "sh0523759"
  let cleaned = base.replace(/\d+/g, '').replace(/\s*User$/i, '').trim();
  if (!cleaned || cleaned.length < 3) {
    if (cleaned) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    return name; // Return original if cleaning is too aggressive
  }

  return cleaned.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const formatTimeSafe = (val) => {
  if (!val || val === '--:--' || val === '--') return '--:--';
  if (typeof val === 'string' && /^\d{1,2}:\d{2}$/.test(val)) return val;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    return String(val);
  }
};

const formatDateSafe = (d) => {
  if (!d) return null;
  // If already a YYYY-MM-DD string, return as is
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    return d.split('T')[0];
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  
  // Use local date components to avoid timezone shifts (e.g. PKT +05:00)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function EmployeeActivity() {
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get("userId");

  const [activities, setActivities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [tab, setTab] = useState("Attendance");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(queryUserId || "");
  const [selectedDate, setSelectedDate] = useState(() => {
    return localStorage.getItem('admin_activity_date') || new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [reviewTask, setReviewTask] = useState(null);
  const [reportModal, setReportModal] = useState({ show: false, employee: null, startDate: '', endDate: '', data: [] });
  const [markingStatus, setMarkingStatus] = useState({}); // Track local updates { [empId]: 'Absent' | 'Leave' | 'Marking...' }
  const [editingMarked, setEditingMarked] = useState(new Set());
  const [lateConfirm, setLateConfirm] = useState(null); // { id: string, name: string }
  const [verifyingIds, setVerifyingIds] = useState(new Set()); // Track reports currently being verified
  const [leaveModal, setLeaveModal] = useState({ show: false, empId: null });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    // If it's early in the month (before the 5th), show the previous month by default
    const m = now.getMonth();
    return now.getDate() < 5 ? (m === 0 ? 11 : m - 1) : m;
  });
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [companyConfig, setCompanyConfig] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [downloadMonth, setDownloadMonth] = useState(selectedDate.substring(0, 7));
  const [scoringMonth, setScoringMonth] = useState(selectedDate.substring(0, 7));

  useEffect(() => {
    const checkTheme = () => setIsLight(document.body.classList.contains('light'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const attUrl = selectedEmployeeId ? `hr/attendance?userId=${selectedEmployeeId}` : `hr/attendance?date=${selectedDate}`;
      const repUrl = selectedEmployeeId ? `reports?userId=${selectedEmployeeId}` : `reports?date=${selectedDate}`;

      // If viewing a specific employee, also fetch historical data for the selected month/year if needed
      // Actually, the existing header logic uses 'activities' which is fetched based on selectedDate or selectedEmployeeId.
      // If selectedEmployeeId is present, hr/attendance?userId=... returns ALL attendance for that user.
      // We then filter it in the UI.

      const [attRes, repRes, taskRes, assessRes, empRes, configRes] = await Promise.all([
        api.get(attUrl),
        api.get(repUrl),
        api.get('tasks'),
        api.get('performance'),
        api.get('employees'),
        api.get('hr/config/working_days')
      ]);

      if (configRes.data.success) {
        setCompanyConfig(configRes.data.data?.value || null);
      }

      if (attRes.data.success) {
        // Normalize Attendance
        const rawAttendance = (attRes.data.data || []);
        const attendanceData = rawAttendance.map(att => ({
          id: att._id,
          employeeId: att.user?._id || att.user,
          name: cleanName(att.user?.name || att.user?.username),
          role: att.user?.role || "Employee",
          avatar: att.user?.avatar || null,
          date: formatDateSafe(att.date),
          checkIn: att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
          checkOut: att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
          status: att.status || 'Pending',
          isVerified: att.isVerified || false,
          verifiedBy: att.verifiedBy?.name || null
        }));

        // Normalize Reports
        const rawReports = (repRes.data.success ? (repRes.data.reports || []) : []);
        const reportsData = rawReports.map(rep => ({
          id: rep._id,
          employeeId: rep.userId?._id || rep.userId,
          name: cleanName(rep.userId?.name || rep.userId?.username),
          role: rep.userId?.role || "Employee",
          avatar: rep.userId?.avatar || null,
          date: formatDateSafe(rep.date),
          report: rep.report,
          reportStatus: rep.status,
          images: rep.images || [],
          reportVerifiedBy: rep.verifiedBy?.name || null,
          reportVerifiedAt: rep.verifiedAt ? new Date(rep.verifiedAt).toLocaleString() : null,
          feedback: rep.feedback,
          feedbackBy: rep.feedbackBy?.name || null,
          feedbackAt: rep.feedbackAt ? new Date(rep.feedbackAt).toLocaleString() : null,
          submissionTime: rep.createdAt ? new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
        }));

        // Combine Attendance and Reports
        const combinedMap = new Map();

        attendanceData.forEach(att => {
          const key = `${att.employeeId}-${att.date}`;
          combinedMap.set(key, { ...att, report: "No report submitted" });
        });

        reportsData.forEach(rep => {
          const key = `${rep.employeeId}-${rep.date}`;
          const existing = combinedMap.get(key);
          if (existing) {
            combinedMap.set(key, { ...existing, ...rep });
          } else {
            combinedMap.set(key, { ...rep, checkIn: '--:--', checkOut: '--:--' });
          }
        });

        setActivities(Array.from(combinedMap.values()));
      }

      if (taskRes.data.success) {
        setTasks(taskRes.data.tasks || []);
      }

      if (assessRes.data.success) {
        const formattedAssess = assessRes.data.data.map(a => ({
          id: a._id,
          employeeName: cleanName(a.employeeId?.name || a.employeeId?.username),
          projectHeadName: cleanName(a.projectHeadId?.name || a.projectHeadId?.username || "Project Head"),
          weekRange: a.weekRange,
          rating: a.rating,
          summary: a.summary,
          improvements: a.improvements,
          date: new Date(a.date).toLocaleDateString()
        }));
        setAssessments(formattedAssess);
      }

      if (empRes.data.success) {
        const allEmployees = empRes.data.data
          .filter(e => e.userId?._id || e.userId) // Ensure we have an ID
          .filter(e => {
            const name = (e.name || "").toLowerCase();
            const role = (e.userId?.role || e.position || e.role || "").toLowerCase();
            const dept = (e.department || "").toLowerCase();
            const status = (e.status || "active").toLowerCase();

            // Filter out inactive/ex-employees
            if (status !== 'active') return false;

            // Filter out HR and IT Support
            if (name.includes('hr hattech') || name.includes('it support')) return false;
            if (role.includes('hr_hattech') || role.includes('it_support') || role.includes('hr')) return false;
            if (dept.includes('hr') || dept.includes('it support') || dept.includes('it-support')) return false;

            // Filter out "Soa w" or specific variations
            if (name === 'soa w' || name.includes('soa w')) return false;

            return true;
          })
          .map(e => ({
            id: e.userId?._id || e.userId,
            name: cleanName(e.name),
            role: e.position || e.role || "Employee",
            avatar: e.profileImage || e.userId?.avatar || e.avatar || null,
            joinDate: e.joinDate
          }));

        setEmployees(allEmployees);
      }

    } catch (err) {
      console.error("Failed to fetch employee activity", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedEmployeeId]);

  useEffect(() => {
    localStorage.setItem('admin_activity_date', selectedDate);
    fetchData();
    const interval = setInterval(fetchData, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [fetchData, selectedDate]);

  const handleVerifyAllReports = async () => {
    try {
      setLoading(true);
      const res = await api.put('/reports/verify-all', {
        userId: selectedEmployeeId || undefined,
        date: selectedEmployeeId ? undefined : selectedDate
      });
      if (res.data.success) {
        setActivities(prev => prev.map(act => {
          if (act.hasReport && (act.reportStatus === 'pending' || act.reportStatus === 'Pending')) {
            return {
              ...act,
              reportStatus: 'verified',
              reportVerifiedBy: 'Admin'
            };
          }
          return act;
        }));
        toast.success(`All reports verified successfully! (${res.data.modifiedCount || 0} updated)`);
      }
    } catch (err) {
      console.error("Failed to verify all reports", err);
      toast.error("Failed to verify all reports");
    } finally {
      setLoading(false);
      fetchData();
    }
  };

  const handleVerifyReport = async (reportId) => {
    if (verifyingIds.has(reportId)) return;
    try {
      setVerifyingIds(prev => new Set(prev).add(reportId));
      const res = await api.put(`/reports/${reportId}/verify`);
      if (res.data.success) {
        // Find and update locally for immediate feedback
        setActivities(prev => prev.map(act => {
          if (act.id === reportId) {
            return {
              ...act,
              reportStatus: 'verified',
              reportVerifiedBy: 'Admin' // Placeholder for UI
            };
          }
          return act;
        }));
        toast.success("Report verified successfully");
      }
    } catch (err) {
      console.error("Failed to verify report", err);
      toast.error("Failed to verify report");
    } finally {
      setVerifyingIds(prev => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };

  const handleMarkLate = async (reportId) => {
    if (verifyingIds.has(reportId)) return;
    try {
      setVerifyingIds(prev => new Set(prev).add(reportId));
      const res = await api.put(`/reports/${reportId}/late`);
      if (res.data.success) {
        setActivities(prev => prev.map(act => {
          if (act.id === reportId) {
            return {
              ...act,
              reportStatus: res.data.report.status
            };
          }
          return act;
        }));
        toast.success(`Report marked as ${res.data.report.status}`);
      }
    } catch (err) {
      console.error("Failed to mark late", err);
      toast.error("Failed to update report status");
    } finally {
      setVerifyingIds(prev => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };

  const handleRejectReport = async (reportId) => {
    if (verifyingIds.has(reportId)) return;
    try {
      setVerifyingIds(prev => new Set(prev).add(reportId));
      const res = await api.put(`/reports/${reportId}/reject`, { feedback: 'Not Approved' });
      if (res.data.success) {
        setActivities(prev => prev.map(act => {
          if (act.id === reportId) {
            return {
              ...act,
              reportStatus: 'not-approved'
            };
          }
          return act;
        }));
        toast.success("Report marked as Not Approved");
      }
    } catch (err) {
      console.error("Failed to reject report", err);
      toast.error("Failed to update report status");
    } finally {
      setVerifyingIds(prev => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };

  const handleUpdateAttendance = async (userId, status, leaveType = null) => {
    try {
      if (!userId) {
        toast.error("Invalid Employee ID");
        return;
      }
      
      setMarkingStatus(prev => ({ ...prev, [userId]: 'Marking...' }));
      
      const payload = {
        userId: String(userId),
        date: selectedDate,
        status: status,
        leaveType: leaveType
      };
      
      const res = await api.post('/hr/attendance/verify', payload);
      if (res.data.success) {
        const label = leaveType ? `${status} (${leaveType})` : status;
        toast.success(`Employee marked as ${label}`);
        setMarkingStatus(prev => ({ ...prev, [userId]: label }));
        setEditingMarked(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        
        // Short delay before refresh to let the user see the "Marked" status
        setTimeout(fetchData, 1500);
      }
    } catch (err) {
      console.error(`Failed to mark as ${status}`, err);
      const errorMsg = err.response?.data?.message || err.message;
      toast.error(`Error: ${errorMsg}`);
      setMarkingStatus(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const handleFetchReport = async (overrideStart, overrideEnd, overrideUserId) => {
    const targetUserId = 
      overrideUserId ||
      reportModal.employee?.id || 
      reportModal.employee?.employeeId || 
      reportModal.employee?.userId?._id || 
      reportModal.employee?.userId || 
      reportModal.employee?._id ||
      selectedEmployeeId; 

    const startDate = overrideStart || reportModal.startDate;
    const endDate = overrideEnd || reportModal.endDate;
    
    if (!targetUserId) {
      toast.error("No employee ID found for report");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    const reportPromise = api.get(`/hr/attendance?userId=${targetUserId}&startDate=${startDate}&endDate=${endDate}`);

    toast.promise(reportPromise, {
      loading: 'Generating report...',
      success: (res) => {
        if (res.data.success) {
          const attendance = res.data.data || [];
          const reports = res.data.reports || [];

          const combined = attendance.map(att => {
            const attDate = formatDateSafe(att.date);
            const matchingReport = reports.find(r => formatDateSafe(r.date) === attDate);
            return {
              ...att,
              dailyReport: matchingReport ? matchingReport.report : 'No report submitted'
            };
          });

          reports.forEach(r => {
            const rDate = formatDateSafe(r.date);
            if (!combined.some(c => formatDateSafe(c.date) === rDate)) {
              combined.push({
                date: r.date,
                status: 'Report Only',
                dailyReport: r.report,
                checkIn: null,
                checkOut: null
              });
            }
          });

          const finalResult = combined.filter(item => {
            const itemDate = formatDateSafe(item.date);
            return itemDate >= startDate && itemDate <= endDate;
          });

          setReportModal(prev => ({ ...prev, data: finalResult.sort((a, b) => new Date(b.date) - new Date(a.date)) }));
          return "Report generated successfully!";
        }
        throw new Error(res.data.message || "Failed to generate report");
      },
      error: (err) => {
        console.error("Admin Report Error:", err);
        return err.message || "Failed to fetch report data";
      }
    });
  };

  const textMain = isLight ? "text-gray-900" : "text-white";
  const textSec = isLight ? "text-gray-600" : "text-gray-400";
  const cardClass = isLight ? "bg-white border-gray-200 shadow-sm" : "bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm";

  // Performance: Hoist expensive computations out of the JSX render body.
  // Previously these were computed in an IIFE inside the JSX — recalculated on every render.
  const uniqueActivities = useMemo(() => {
    const seen = new Set();
    return activities.filter(a => {
      const key = `${a.employeeId}-${a.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activities]);

  // Map keyed by `${employeeId}-${date}` for O(1) lookups replacing .find() in render loops.
  const uniqueActivitiesMap = useMemo(() => {
    const map = new Map();
    uniqueActivities.forEach(a => {
      map.set(`${a.employeeId}-${a.date}`, a);
      // Also index by employeeId alone for quick "exists for any date" lookups
      if (!map.has(a.employeeId)) map.set(a.employeeId, a);
    });
    return map;
  }, [uniqueActivities]);

  const missingEmployees = useMemo(() => {
    const employeesWithReports = new Set(
      uniqueActivities
        .filter(a => a.report && a.report !== "No report submitted")
        .map(a => a.employeeId)
    );
    return employees.filter(emp => {
      if (employeesWithReports.has(emp.id)) return false;
      const role = (emp.role || "").toLowerCase();
      const name = (emp.name || "").toLowerCase();
      const isExcluded =
        role.includes('admin') ||
        role.includes('client') ||
        role.includes('hr') ||
        role.includes('it support') ||
        role.includes('it_support') ||
        role.includes('it-support') ||
        name.includes('hr ') ||
        name.startsWith('hr') ||
        name.includes(' it support') ||
        name.includes('it_support');
      return !isExcluded;
    });
  }, [uniqueActivities, employees]);

  const filteredActivities = useMemo(() =>
    filterVerified
      ? uniqueActivities.filter(a => a.reportStatus === "Verified")
      : uniqueActivities.filter(a => a.report && a.report !== "No report submitted")
  , [uniqueActivities, filterVerified]);

  return (
    <div className="space-y-6 pt-14 md:pt-0 pb-10">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className={`text-2xl font-bold ${isLight ? 'text-[#004AAE]' : 'text-primary'}`}>Employee Activity</h1>
          {loading && <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>}
        </div>

        {/* FILTERS */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <button
              onClick={() => setShowScoringModal(true)}
              className="p-2 rounded-lg bg-[#004AAE] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#003882] transition shadow-lg w-full md:w-auto justify-center"
          >
              <FiDownload /> SCORING REPORT
          </button>

          <button
              onClick={() => setShowDownloadModal(true)}
              className="p-2 rounded-lg bg-green-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-lg w-full md:w-auto justify-center"
          >
              <FiDownload /> MONTHLY DETAILED REPORT
          </button>
          
          {/* DATE PICKER */}
          <div className="relative w-full md:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`w-full md:w-48 p-2 rounded-lg border transition-all duration-200 outline-none
                ${isLight 
                  ? 'bg-gray-100 border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#004AAE]/20 focus:border-[#004AAE]' 
                  : 'bg-[#1a1433] border-[#2a2255] text-white focus:ring-2 focus:ring-[#004AAE]/50 focus:border-[#004AAE]'
                }`}
              style={{ colorScheme: isLight ? 'light' : 'dark' }}
            />
          </div>

          {/* EMPLOYEE FILTER DROPDOWN */}
          <div className="w-full md:w-64 relative">
            <select
              className={`w-full p-2 rounded-lg border transition-all duration-200 outline-none
                ${isLight 
                  ? 'bg-gray-100 border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#004AAE]/20 focus:border-[#004AAE]' 
                  : 'bg-[#1a1433] border-[#2a2255] text-white focus:ring-2 focus:ring-[#004AAE]/50 focus:border-[#004AAE]'
                }`}
              style={{ colorScheme: isLight ? 'light' : 'dark' }}
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="" className={!isLight ? 'bg-[#1a1433] text-white' : ''}>All Employees</option>
              {employees
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((emp, i) => (
                  <option key={`${emp.id}-${i}`} value={emp.id} className={!isLight ? 'bg-[#1a1433] text-white' : ''}>{emp.name}</option>
                ))
              }
            </select>
          </div>
        </div>
      </div>

      {/* SELECTED EMPLOYEE VIEW */}
      {selectedEmployeeId ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Employee Details & Timeline */}
          {(() => {
            const empActivities = activities.filter(a => {
              if (!a.date) return false;
              let y, m;
              if (a.date.includes('-')) {
                [y, m] = a.date.split('-').map(Number);
              } else if (a.date.includes('/')) {
                const parts = a.date.split('/');
                y = Number(parts[2]);
                m = Number(parts[1]);
              }
              return a.employeeId === selectedEmployeeId && (m - 1) === selectedMonth && y === selectedYear;
            });
            const empTasks = tasks.filter(t => t.assignedTo?._id === selectedEmployeeId || t.assignedTo === selectedEmployeeId); 
            const empAssessments = assessments.filter(a => a.employeeName === (activities.find(ac => ac.employeeId === selectedEmployeeId)?.name));

            const selectedEmp = employees.find(e => e.id === selectedEmployeeId) || activities.find(a => a.employeeId === selectedEmployeeId);
            const empDetails = {
              name: selectedEmp?.name || "Selected Employee",
              role: selectedEmp?.role || "Employee",
              avatar: selectedEmp?.avatar || null
            };

            return (
              <div className="space-y-8">
                <button
                  onClick={() => setSelectedEmployeeId("")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                    ${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-[var(--bg-main)] text-white/80 hover:bg-[var(--bg-card)] border border-[var(--border-color)]'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to List
                </button>

                <div className={`p-6 rounded-2xl border ${cardClass} flex flex-col md:flex-row items-center gap-6 relative`}>
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#004AAE]/20 shadow-lg">
                    <img
                      src={empDetails.avatar && (empDetails.avatar.startsWith('data:') || empDetails.avatar.startsWith('http')) ? empDetails.avatar : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(empDetails.name)}&backgroundColor=004AAE&textColor=ffffff`}
                      alt={empDetails.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h2 className={`text-3xl font-bold ${textMain}`}>{empDetails.name}</h2>
                    <p className={`text-lg ${textSec}`}>{empDetails.role}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                      {(() => {
                        const cm = selectedMonth;
                        const cy = selectedYear;
                        const now = new Date();
                        const isCurrentMonth = now.getMonth() === cm && now.getFullYear() === cy;
                        const lastDayOfMonth = new Date(cy, cm + 1, 0).getDate();
                        const calculationEndDate = isCurrentMonth ? now.getDate() : lastDayOfMonth;

                        const thisMonthActivities = empActivities.filter(a => {
                          const d = new Date(a.date);
                          return d.getMonth() === cm && d.getFullYear() === cy;
                        });

                        const verifiedCount = thisMonthActivities.filter(a => 
                          String(a.reportStatus || '').toLowerCase() === 'verified'
                        ).length;

                        const holidayDateStrings = companyConfig?.nonWorkingDates || [];
                        const sundaysOff = companyConfig?.sunday === false;

                        const isWorkdayFunc = (dateStr, dayIndex) => {
                          const isSunday = dayIndex === 0;
                          const isExplicitlyOff = holidayDateStrings.includes(dateStr);
                          if (dateStr === '2026-06-28') return true;
                          return isSunday ? (!sundaysOff && !isExplicitlyOff) : !isExplicitlyOff;
                        };

                        const inclusiveWorkingDays = thisMonthActivities.filter(a => {
                          const d = new Date(a.date);
                          const dStr = formatDateSafe(a.date);
                          if (!isWorkdayFunc(dStr, d.getDay())) return false;

                          const isLeave = ['Leave', 'Short Leave', 'leave'].includes(a.status);
                          const isAbsent = ['Absent', 'absent'].includes(a.status);
                          if (isLeave || isAbsent) return false;

                          const hasReport = a.report && a.report !== "No report submitted";
                          const hasCheckIn = a.checkIn && a.checkIn !== '--:--' && a.checkIn !== '--';
                          const isPresent = a.status === 'Present' || a.status === 'Verified' || a.status === 'Late' || a.status === 'WFH';
                          
                          return hasReport || hasCheckIn || isPresent;
                        }).length;

                        const absentCount = thisMonthActivities.filter(a => {
                          const d = new Date(a.date);
                          const dStr = formatDateSafe(a.date);
                          return isWorkdayFunc(dStr, d.getDay()) && a.status === 'Absent';
                        }).length;

                        const leaveCount = thisMonthActivities.filter(a => {
                          const d = new Date(a.date);
                          const dStr = formatDateSafe(a.date);
                          return isWorkdayFunc(dStr, d.getDay()) && ['Leave', 'Short Leave', 'leave'].includes(a.status);
                        }).length;

                        const lateCount = thisMonthActivities.filter(a => {
                          const d = new Date(a.date);
                          const dStr = formatDateSafe(a.date);
                          if (!isWorkdayFunc(dStr, d.getDay())) return false;
                          return a.status === 'Late' || a.isLate === true || String(a.reportStatus || '').toLowerCase() === 'late';
                        }).length;

                        const submittedReportsCount = thisMonthActivities.filter(a => a.report && a.report !== 'No report submitted').length;

                        const calculateCompanyWorkingDays = (year, month, lastDay, startDay = 1) => {
                          if (!companyConfig) return (lastDay - startDay + 1); 
                          const sundaysOff = companyConfig.sunday === false;
                          const nonWorkingDates = companyConfig.nonWorkingDates || [];
                          
                          let workingDays = 0;
                          for (let d = startDay; d <= lastDay; d++) {
                            const date = new Date(year, month, d);
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const isSunday = date.getDay() === 0;
                            const isExplicitlyOff = nonWorkingDates.includes(dateStr);
                            
                            const isWorkday = (dateStr === '2026-06-28') || (isSunday ? (!sundaysOff && !isExplicitlyOff) : !isExplicitlyOff);
                            if (isWorkday) workingDays++;
                          }
                          return workingDays;
                        };

                        // Calculate start day based on Join Date
                        let startDayForCalc = 1;
                        if (selectedEmp?.joinDate) {
                          const joinD = new Date(selectedEmp.joinDate);
                          if (joinD.getFullYear() === cy && joinD.getMonth() === cm) {
                            startDayForCalc = joinD.getDate();
                          } else if (joinD.getFullYear() > cy || (joinD.getFullYear() === cy && joinD.getMonth() > cm)) {
                            // Employee joined AFTER this month
                            startDayForCalc = lastDayOfMonth + 1; 
                          }
                        }

                        const totalCompanyWorkingDays = calculateCompanyWorkingDays(cy, cm, lastDayOfMonth, startDayForCalc);
                        const workingDaysUpToNow = calculateCompanyWorkingDays(cy, cm, Math.max(startDayForCalc - 1, calculationEndDate), startDayForCalc);

                        return (
                          <>
                            <div className="flex flex-col mb-2 w-full md:w-auto">
                              <div className="flex gap-2">
                                <select 
                                  value={selectedMonth}
                                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                  className={`p-1.5 rounded-lg border text-xs font-bold focus:ring-2 focus:ring-[#004AAE] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#1a1c23] border-[#2d3748] text-white dark:[color-scheme:dark]'}`}
                                  style={{ colorScheme: isLight ? 'light' : 'dark' }}
                                >
                                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                                    <option key={i} value={i} className={!isLight ? 'bg-[#1a1c23] text-white' : ''}>{m}</option>
                                  ))}
                                </select>
                                <select 
                                  value={selectedYear}
                                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                  className={`p-1.5 rounded-lg border text-xs font-bold focus:ring-2 focus:ring-[#004AAE] outline-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#1a1c23] border-[#2d3748] text-white dark:[color-scheme:dark]'}`}
                                  style={{ colorScheme: isLight ? 'light' : 'dark' }}
                                >
                                  {[2024, 2025, 2026, 2027].map(y => (
                                    <option key={y} value={y} className={!isLight ? 'bg-[#1a1c23] text-white' : ''}>{y}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="w-full h-0 md:hidden"></div>
                            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-indigo-900/10 border-indigo-800/50 text-[#004AAE]'}`}>
                              <span className="block text-xs font-bold uppercase opacity-70">Month Working Days</span>
                              <span className="text-xl font-bold">{totalCompanyWorkingDays}</span>
                            </div>
                             <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg shadow-indigo-600/20' : 'bg-[#004AAE] border-indigo-500/30 text-white shadow-lg shadow-[#004AAE]/20'}`}>
                              <span className="block text-xs font-bold uppercase opacity-70">Working Days Till Now</span>
                              <span className="text-xl font-bold">{workingDaysUpToNow}</span>
                            </div>
                            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-[#004AAE]/10 border-[#004AAE]/30 text-[#004AAE]'}`}>
                              <span className="block text-xs font-bold uppercase opacity-70">Employee Working Days</span>
                              <span className="text-xl font-bold">{inclusiveWorkingDays}</span>
                            </div>
                            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-red-50 border-red-100 text-red-700' : 'bg-red-900/10 border-red-900/30 text-red-400'}`}>
                              <span className="block text-xs font-bold uppercase opacity-70">Absent</span>
                              <span className="text-xl font-bold">{absentCount}</span>
                            </div>
                            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-orange-900/10 border-orange-900/30 text-orange-400'}`}>
                              <span className="block text-xs font-bold uppercase opacity-70">Leaves</span>
                              <span className="text-xl font-bold">{leaveCount}</span>
                            </div>
                            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-amber-900/10 border-amber-900/30 text-amber-400'}`}>
                              <span className="block text-xs font-bold uppercase opacity-70">Late</span>
                              <span className="text-xl font-bold">{lateCount}</span>
                            </div>
                            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-indigo-900/10 border-indigo-800/50 text-[#004AAE]'}`}>
                              <span className="block text-xs font-bold uppercase opacity-70">Submitted Reports</span>
                              <span className="text-xl font-bold">{submittedReportsCount}</span>
                            </div>
                            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-green-50 border-green-100 text-green-700' : 'bg-green-900/10 border-green-900/30 text-green-400'}`}>
                              <span className="block text-xs font-bold uppercase opacity-70">Verify Reports</span>
                              <span className="text-xl font-bold">{verifiedCount}</span>
                            </div>
                          </>
                        );
                      })()}
                      <div className="flex flex-wrap items-center gap-2 self-center mt-2 md:mt-0">
                        <button
                          onClick={handleVerifyAllReports}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg active:scale-95 cursor-pointer"
                          title="Verify all pending daily reports"
                        >
                          <FiCheckCircle /> Verify All Reports
                        </button>
                        <button
                          onClick={() => {
                            const now = new Date();
                            const y = now.getFullYear();
                            const m = now.getMonth();
                            const monthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`;
                            const monthEnd = `${y}-${String(m + 1).padStart(2, '0')}-${new Date(y, m + 1, 0).getDate()}`;
                            setReportModal({ show: true, employee: selectedEmp, startDate: monthStart, endDate: monthEnd, data: [] });
                            setTimeout(() => handleFetchReport(monthStart, monthEnd, selectedEmp?.id || selectedEmployeeId), 100);
                          }}
                          className="px-5 py-2 bg-[#004AAE] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#003882] transition shadow-lg"
                        >
                          <FiDownload /> Generate Monthly Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={`text-xl font-bold ${textMain} border-b pb-2 border-gray-200 dark:border-gray-700`}>Activity History</h3>
                  {(() => {
                    const sortedActivities = [...empActivities].sort((a, b) => new Date(b.date) - new Date(a.date));
                    const hasSelectedDate = sortedActivities.some(a => a.date === selectedDate);
                    const displayActivities = [...sortedActivities];
                    if (!hasSelectedDate) {
                      displayActivities.unshift({
                        date: selectedDate,
                        isEmptyPlaceholder: true,
                        name: empDetails.name,
                        role: empDetails.role
                      });
                      displayActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
                    }
                    
                    // Final Filter to strictly remove Sundays
                    const filteredDisplay = displayActivities.filter(item => {
                        let dObj;
                        if (item.date.includes('/')) {
                          const [d, m, y] = item.date.split('/');
                          dObj = new Date(`${y}-${m}-${d}`);
                        } else {
                          dObj = new Date(item.date);
                        }
                        const y = dObj.getFullYear();
                        const m = String(dObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dObj.getDate()).padStart(2, '0');
                        const dateStr = `${y}-${m}-${day}`;
                        return dObj.getDay() !== 0 || dateStr === '2026-06-28'; // Strictly hide Sundays
                    });

                    if (filteredDisplay.length === 0) return <p className="text-gray-500 italic text-center py-10">No history found for this employee.</p>;

                    return (
                      <div className="relative pl-8 border-l-2 border-[#004AAE]/30 space-y-8 py-2">
                        {filteredDisplay.map((item, idx) => (
                          <div key={item.id || `${item.employeeId}-${item.date}-${idx}`} className="relative">
                            <div className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full border-4 border-white dark:border-[#1a1a1a] shadow-md z-10 transition-colors ${item.date === selectedDate ? 'bg-blue-600 animate-pulse' : 'bg-[#004AAE]'}`}></div>
                            <div className="mb-2">
                              <span className={`text-sm font-bold px-3 py-1 rounded-full ${item.date === selectedDate ? 'bg-[#004AAE] text-white' : (isLight ? 'bg-[#004AAE]/10 text-[#004AAE]' : 'bg-[#004AAE]/20 text-[#004AAE]')}`}>
                                {(() => {
                                  let dObj;
                                  if (item.date.includes('/')) {
                                    const [d, m, y] = item.date.split('/');
                                    dObj = new Date(`${y}-${m}-${d}`);
                                  } else {
                                    dObj = new Date(item.date);
                                  }
                                  return (
                                    <>
                                      {dObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                      {item.date === selectedDate && " (Selected Date)"}
                                      {dObj.getDay() === 0 && (() => {
                                         const y = dObj.getFullYear();
                                         const m = String(dObj.getMonth() + 1).padStart(2, '0');
                                         const day = String(dObj.getDate()).padStart(2, '0');
                                         const dateStr = `${y}-${m}-${day}`;
                                         return dateStr !== '2026-06-28';
                                       })() && " (Sunday/Weekend)"}
                                    </>
                                  );
                                })()}
                              </span>
                            </div>

                            {item.isEmptyPlaceholder ? (
                              <div className={`p-6 rounded-xl border border-dashed ${isLight ? 'border-gray-300 bg-gray-50' : 'border-gray-700 bg-gray-900/50'} text-center`}>
                                <p className={`text-lg font-bold ${textSec}`}>No activity or reports found for this date</p>
                                <p className="text-sm text-gray-500">Attendance data might not have been imported yet.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-xl border ${cardClass} relative overflow-hidden group hover:shadow-md transition-all`}>
                                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                  <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Attendance
                                  </h4>
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className={`text-xs ${textSec}`}>Check In</p>
                                      <p className={`text-lg font-bold ${textMain}`}>{(item.status === 'Absent' || item.status === 'Leave') ? '--:--' : (item.checkIn || '--:--')}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-xs ${textSec}`}>Check Out</p>
                                      {(item.status === 'Absent' || item.status === 'Leave') ? (
                                        <span className="text-gray-400 font-bold opacity-50">--:--</span>
                                      ) : (
                                        <p className={`text-lg font-bold ${textMain}`}>{item.checkOut || '--:--'}</p>
                                      )}
                                    </div>

                                  </div>
                                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded
                                      ${item.isVerified ? 'bg-green-100 text-green-700' : 
                                        item.status === 'Absent' ? 'bg-red-100 text-red-700' : 
                                        item.status === 'Leave' ? 'bg-yellow-100 text-yellow-700' : 
                                        'bg-blue-100 text-blue-700'}`}>
                                      {item.isVerified ? 'Verified' : 'Pending'} ({item.status})
                                    </span>
                                    {item.verifiedBy && <span className="text-[10px] text-gray-500">By {item.verifiedBy}</span>}
                                  </div>
                                </div>

                                <div className={`p-4 rounded-xl border ${cardClass} relative overflow-hidden group hover:shadow-md transition-all`}>
                                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                  <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Daily Activity Report
                                  </h4>
                                  {item.report && item.report !== 'No report submitted' ? (
                                    <>
                                      <p className={`text-sm leading-relaxed mb-3 ${textMain}`}>{item.report}</p>
                                      {item.images && item.images.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                          {item.images.map((img, i) => {
                                            const isPdf = typeof img === 'string' && (img.startsWith('data:application/pdf') || img.toLowerCase().endsWith('.pdf'));
                                            return isPdf ? (
                                              <div
                                                key={i}
                                                className="w-16 h-16 flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 cursor-pointer hover:scale-110 transition"
                                                onClick={() => setSelectedImage({ url: img, type: 'pdf' })}
                                                title="View PDF"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-[10px] font-bold mt-1">PDF</span>
                                              </div>
                                            ) : (
                                              <img
                                                key={i}
                                                src={img}
                                                alt="Attachment"
                                                className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-110 transition"
                                                onClick={() => setSelectedImage({ url: img, type: 'image' })}
                                              />
                                            );
                                          })}
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center mt-auto">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.reportStatus?.toLowerCase() === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                          Report: {item.reportStatus ? item.reportStatus.charAt(0).toUpperCase() + item.reportStatus.slice(1) : 'Pending'}
                                        </span>
                                        {item.reportStatus?.toLowerCase() !== 'verified' && (
                                          <button onClick={() => handleVerifyReport(item.id)} className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">Verify</button>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic">No report submitted for this day.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <>
          <div className={`flex gap-2 border-b mb-4 overflow-x-auto no-scrollbar ${isLight ? 'border-gray-200' : 'border-theme'}`}>
            {['Attendance', 'Daily Report', 'Tasks', 'Assessments'].map(t => (
              <button
                key={t}
                className={`px-3 md:px-4 py-2 text-sm md:text-base font-bold focus:outline-none transition border-b-2 whitespace-nowrap flex-shrink-0 ${tab === t
                  ? (isLight ? 'border-[#004AAE] text-[#004AAE]' : 'border-primary text-primary')
                  : (isLight ? 'border-transparent text-gray-500 hover:text-[#004AAE]' : 'border-transparent text-theme-secondary hover:text-primary')}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'Attendance' && (
            <div className="space-y-4">
              {(() => {
                const groupActivitiesByDate = (list) => {
                  const groups = {};
                  const formatDateLocal = (dateObj) => {
                    const d = String(dateObj.getDate()).padStart(2, '0');
                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const y = dateObj.getFullYear();
                    return `${d}/${m}/${y}`;
                  };
                  const todayObj = new Date();
                  const todayStr = formatDateLocal(todayObj);
                  const yestObj = new Date(todayObj);
                  yestObj.setDate(yestObj.getDate() - 1);
                  const yestStr = formatDateLocal(yestObj);

                  list.forEach(item => {
                    let dateKey = item.date;
                    if (!dateKey) return;
                    if (dateKey.includes('/')) {
                      const [d, m, y] = dateKey.split('/');
                      const testD = new Date(`${y}-${m}-${d}`);
                      if (!isNaN(testD.getTime())) {
                        const canonical = formatDateLocal(testD);
                        if (canonical === todayStr) dateKey = "Today";
                        else if (canonical === yestStr) dateKey = "Yesterday";
                        else dateKey = canonical;
                      }
                    } else {
                      if (dateKey === todayObj.toISOString().split('T')[0]) dateKey = "Today";
                    }
                    if (!groups[dateKey]) groups[dateKey] = [];
                    groups[dateKey].push(item);
                  });
                  return groups;
                };

                const grouped = groupActivitiesByDate(activities);
                const sortedKeys = Object.keys(grouped).sort((a, b) => {
                  if (a === "Today") return -1;
                  if (b === "Today") return 1;
                  if (a === "Yesterday") return -1;
                  if (b === "Yesterday") return 1;
                  const parseKey = (k) => {
                    if (k.includes('/')) {
                      const [d, m, y] = k.split('/');
                      return new Date(`${y}-${m}-${d}`);
                    }
                    return new Date(k);
                  };
                  const dateA = parseKey(a);
                  const dateB = parseKey(b);
                  return dateB - dateA;
                });

                if (sortedKeys.length === 0) return <p className="text-gray-400">No attendance records found.</p>;

                return sortedKeys.map(dateLabel => {
                  const parseKey = (k) => {
                    if (k === "Today") return new Date();
                    if (k === "Yesterday") return new Date(Date.now() - 86400000);
                    if (k.includes('/')) {
                      const [d, m, y] = k.split('/');
                      return new Date(`${y}-${m}-${d}`);
                    }
                    return new Date(k);
                  };
                  const dateObj = parseKey(dateLabel);
                  const isSunday = (() => {
                    const y = dateObj.getFullYear();
                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const dateStr = `${y}-${m}-${day}`;
                    return dateObj.getDay() === 0 && dateStr !== '2026-06-28';
                  })();
                  const itemsToShow = grouped[dateLabel].filter(emp => {
                    if (isSunday && emp.status === 'Absent') return false;
                    return true;
                  });

                  return (
                    <div key={dateLabel}>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">{dateLabel}</h3>
                      <div className="space-y-2">
                        {isSunday && itemsToShow.length === 0 ? (
                          <div className={`p-4 rounded-xl border border-dashed ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-900/20 border-gray-800'} text-center text-sm text-gray-500`}>
                            Weekend (Sunday) - No attendance activity recorded.
                          </div>
                        ) : (
                          itemsToShow.map((emp, i) => {
                            const matchedEmp = employees.find(e => e.id === emp.employeeId);
                            const bestAvatar = matchedEmp?.avatar || emp.avatar;
                            const profileImage = bestAvatar && (bestAvatar.startsWith('data:') || bestAvatar.startsWith('http'))
                              ? bestAvatar
                              : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=004AAE&textColor=ffffff`;
                            
                            return (
                              <div
                                key={`${emp.employeeId || emp.userId}-${emp.date || i}`}
                                onClick={() => setSelectedEmployeeId(emp.employeeId)}
                                className={`p-3 rounded-lg flex flex-col md:flex-row md:items-center md:gap-4 border ${cardClass} cursor-pointer hover:border-[#004AAE] hover:shadow-md transition-all group`}
                              >
                                <img
                                  src={profileImage}
                                  alt={emp.name}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200 hidden md:block"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=gray`;
                                  }}
                                />
                                <div className="flex-1">
                                  <p className={`font-medium text-base ${isLight ? 'text-gray-900' : 'text-[var(--text-primary)]'}`}>{emp.name}</p>
                                  <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-[var(--text-secondary)]'}`}>{emp.role}</p>
                                </div>
                                <div className="flex flex-col md:flex-row md:gap-4 mt-2 md:mt-0 items-end">
                                  <div className="flex flex-col text-right mr-4">
                                    {((emp.status !== 'Absent' && emp.status !== 'Leave') || (emp.checkIn && emp.checkIn !== '--:--')) ? (
                                      <>
                                        <span className={`${isLight ? 'text-[#004AAE]' : 'text-[#004AAE]'} font-bold`}>
                                          In: {emp.checkIn || '--:--'}
                                        </span>
                                        {emp.checkOut && (
                                          <span className={`${isLight ? 'text-[#004AAE]' : 'text-[#004AAE]'} font-bold`}>
                                            Out: {emp.checkOut}
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-red-500 font-bold uppercase text-xs tracking-widest">
                                        {emp.status}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-2 items-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1
                                       ${emp.isVerified ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        emp.status === 'Absent' ? 'bg-red-500 text-white border-red-500/20' :
                                        emp.status === 'Leave' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                          'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                      {(() => {
                                        if (markingStatus[emp.employeeId]) return markingStatus[emp.employeeId];
                                        if (emp.status === 'Absent') return 'Absent';
                                        if (emp.status === 'Leave') return 'Leave';
                                        return `${emp.isVerified ? 'Verified' : 'Pending'} (${emp.status})`;
                                      })()}
                                      {emp.verifiedBy && emp.status !== 'Absent' && emp.status !== 'Leave' ? ` by ${emp.verifiedBy}` : ''}
                                    </span>

                                    {!editingMarked.has(emp.employeeId) ? (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingMarked(prev => new Set(prev).add(emp.employeeId));
                                        }}
                                        className="p-1 text-gray-400 hover:text-[#004AAE] transition-all"
                                        title="Edit Status"
                                      >
                                        <FiEdit size={14} />
                                      </button>
                                    ) : (
                                       <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                          <button 
                                            onClick={() => handleUpdateAttendance(emp.employeeId, 'Present')}
                                            className="px-2 py-0.5 bg-green-600 text-[8px] font-black text-white rounded hover:bg-green-700 uppercase"
                                          >
                                            On Time
                                          </button>
                                          <button 
                                            onClick={() => handleUpdateAttendance(emp.employeeId, 'Late')}
                                            className="px-2 py-0.5 bg-yellow-600 text-[8px] font-black text-white rounded hover:bg-yellow-700 uppercase"
                                          >
                                            Late
                                          </button>
                                          <button 
                                            onClick={() => handleUpdateAttendance(emp.employeeId, 'Absent')}
                                            className="px-2 py-0.5 bg-red-600 text-[8px] font-black text-white rounded hover:bg-red-700 uppercase"
                                          >
                                            Absent
                                          </button>
                                          <button 
                                            onClick={() => setEditingMarked(prev => {
                                              const ns = new Set(prev);
                                              ns.delete(emp.employeeId);
                                              return ns;
                                            })}
                                            className="px-2 py-0.5 bg-gray-600 text-[8px] font-black text-white rounded hover:bg-gray-700 uppercase"
                                          >
                                            X
                                          </button>
                                       </div>
                                    )}
                                  </div>

                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {tab === 'Daily Report' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${textSec}`}>
                  <input
                    type="checkbox"
                    checked={filterVerified}
                    onChange={(e) => setFilterVerified(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#004AAE] focus:ring-[#004AAE]"
                  />
                  Show Verified Only
                </label>
              </div>

              {(() => {
                // Performance: uniqueActivities, missingEmployees, and filteredActivities
                // are now pre-computed by useMemo hooks above the return statement.
                // This IIFE now only handles the date-grouping and rendering logic.

                if (filteredActivities.length === 0 && missingEmployees.length === 0) return <p className="text-gray-400">No reports found{filterVerified ? " matching filter" : ""}.</p>;

                const groups = {};
                const formatDateLocal = (dateObj) => {
                  const d = String(dateObj.getDate()).padStart(2, '0');
                  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const y = dateObj.getFullYear();
                  return `${d}/${m}/${y}`;
                };

                const todayObj = new Date();
                const todayStr = formatDateLocal(todayObj);
                const yestObj = new Date(todayObj);
                yestObj.setDate(yestObj.getDate() - 1);
                const yestStr = formatDateLocal(yestObj);

                filteredActivities.forEach(item => {
                  let dateKey = item.date;
                  if (!dateKey) return;
                  if (dateKey.includes('/')) {
                    const [d, m, y] = dateKey.split('/');
                    const dateObj = new Date(`${y}-${m}-${d}`);
                    if (!isNaN(dateObj.getTime())) {
                      const canonical = formatDateLocal(dateObj);
                      if (canonical === todayStr) dateKey = "Today";
                      else if (canonical === yestStr) dateKey = "Yesterday";
                      else dateKey = canonical;
                    }
                  } else {
                    if (dateKey === todayObj.toISOString().split('T')[0]) dateKey = "Today";
                  }
                  if (!groups[dateKey]) groups[dateKey] = [];
                  groups[dateKey].push(item);
                });

                const sortedKeys = Object.keys(groups).sort((a, b) => {
                  if (a === "Today") return -1;
                  if (b === "Today") return 1;
                  if (a === "Yesterday") return -1;
                  if (b === "Yesterday") return 1;
                  const parseKey = (k) => {
                    if (k.includes('/')) {
                      const [d, m, y] = k.split('/');
                      return new Date(`${y}-${m}-${d}`);
                    }
                    return new Date(k);
                  };
                  const dateA = parseKey(a);
                  const dateB = parseKey(b);
                  return dateB - dateA;
                });

                return (
                  <>
                    {missingEmployees.length > 0 && !filterVerified && (
                      <div className="mb-6">
                        <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2 mt-4">Not Submitted</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {missingEmployees.map(emp => (
                            <div key={emp.id} className={`p-3 rounded-lg border flex flex-col gap-3 ${isLight ? 'bg-red-50 border-red-100' : 'bg-red-500/10 border-red-500/20'} animate-in fade-in duration-300 shadow-sm`}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-red-600 font-bold text-xs">{emp.name?.charAt(0) || '?'}</div>
                                <div className="flex-1">
                                  <p className={`text-sm font-bold ${isLight ? 'text-red-700' : 'text-red-400'}`}>{emp.name}</p>
                                  <p className="text-[10px] text-red-500/70 font-semibold uppercase tracking-wider mt-0.5">
                                    {(() => {
                                      const act = uniqueActivitiesMap.get(`${emp.id}-${selectedDate}`);
                                      if (!act) return 'No report submitted';
                                      const statusText = act.leaveType ? `${act.status} (${act.leaveType})` : act.status;
                                      const times = (act.checkIn && act.checkIn !== '--:--') ? ` (In: ${act.checkIn}${act.checkOut ? ` Out: ${act.checkOut}` : ''})` : '';
                                      return `${statusText}${times}`;
                                    })()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {(() => {
                                  if (markingStatus[emp.id]) {
                                    return (
                                      <div className={`flex-1 py-1.5 px-3 rounded-md text-[10px] font-black uppercase text-center border ${
                                        markingStatus[emp.id] === 'Marking...' 
                                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-500 animate-pulse' 
                                          : 'bg-green-500/10 border-green-500/30 text-green-500'
                                      }`}>
                                        {markingStatus[emp.id] === 'Marking...' ? 'Updating UI...' : `MARKED AS ${markingStatus[emp.id]}`}
                                      </div>
                                    );
                                  }
                                  const existingActivity = uniqueActivitiesMap.get(`${emp.id}-${selectedDate}`)
                                    || (selectedDate === new Date().toISOString().split('T')[0] ? uniqueActivitiesMap.get(`${emp.id}-Today`) : undefined);
                                  if (existingActivity && (existingActivity.status === 'Absent' || existingActivity.status === 'Leave' || existingActivity.status === 'Report not submitted') && !editingMarked.has(emp.id)) {
                                    return (
                                      <div className="flex gap-2 w-full">
                                        <div className="flex-1 py-1.5 px-3 rounded-md text-[10px] font-black uppercase text-center bg-gray-500/10 border border-gray-500/30 text-gray-500">
                                          Status: {existingActivity.leaveType ? `${existingActivity.status} (${existingActivity.leaveType})` : existingActivity.status}
                                        </div>
                                        <button 
                                          onClick={() => setEditingMarked(prev => new Set(prev).add(emp.id))}
                                          className={`px-3 py-1 bg-white/5 border border-[#004AAE]/30 text-[#004AAE]/70 rounded-md text-[9px] font-black uppercase hover:bg-white/10 transition-all shadow-sm`}
                                        >
                                          Edit
                                        </button>
                                      </div>
                                    );
                                  }
                                  return (
                                    <>
                                      <button
                                        onClick={() => handleUpdateAttendance(emp.id, 'Absent')}
                                        className="flex-1 py-1 px-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-md transition-colors shadow-sm uppercase tracking-wider"
                                      >
                                        Mark Absent
                                      </button>
                                      <button
                                        onClick={() => setLeaveModal({ show: true, empId: emp.id })}
                                        className="flex-1 py-1 px-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold rounded-md transition-colors shadow-sm uppercase tracking-wider"
                                      >
                                        Mark Leave
                                      </button>

                                        <button
                                          onClick={() => handleUpdateAttendance(emp.id, 'Report not submitted')}
                                          className="flex-1 py-1 px-2 bg-[#004AAE] hover:bg-[#003882] text-white text-[10px] font-bold rounded-md transition-colors shadow-sm uppercase tracking-wider"
                                        >
                                          Report not submitted
                                        </button>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredActivities.length === 0 && filterVerified && <p className="text-gray-400 mb-4 mt-4">No verified reports found.</p>}

                    {sortedKeys.map(dateLabel => (
                      <div key={dateLabel}>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">{dateLabel}</h3>
                        <div className="space-y-2">
                          {groups[dateLabel].map((emp, i) => {
                            const matchedEmp = employees.find(e => e.id === emp.employeeId);
                            const bestAvatar = matchedEmp?.avatar || emp.avatar;
                            const profileImage = bestAvatar && (bestAvatar.startsWith('data:') || bestAvatar.startsWith('http'))
                              ? bestAvatar
                              : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=004AAE&textColor=ffffff`;
                            const isReportVerified = emp.reportStatus?.toLowerCase() === 'verified';

                            return (
                              <div
                                key={`${emp.employeeId || emp.userId}-${emp.date || i}`}
                                onClick={() => setSelectedEmployeeId(emp.employeeId)}
                                className={`p-4 rounded-lg flex flex-col md:flex-row md:items-start md:gap-4 border cursor-pointer hover:border-[#004AAE] hover:shadow-md transition-all group
                                  ${emp.reportStatus?.toLowerCase() === 'late' 
                                    ? (isLight ? 'bg-red-50 border-red-200' : 'bg-red-950/20 border-red-900/40') 
                                    : cardClass}`}
                              >
                                <img
                                  src={profileImage}
                                  alt={emp.name}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200 mt-1 hidden md:block"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=gray`;
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className={`font-medium text-base ${textMain}`}>{emp.name}</p>
                                      <div className="flex items-center gap-2">
                                        <p className={`text-xs ${textSec}`}>{emp.role}</p>
                                        {emp.submissionTime && (
                                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-400/10 px-1.5 py-0.5 rounded">
                                            <FiClock className="w-2.5 h-2.5" /> {emp.submissionTime}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1.5">
                                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border flex items-center gap-1
                                  ${
                                    emp.reportStatus?.toLowerCase() === 'verified' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                    (emp.reportStatus?.toLowerCase() === 'rejected' || emp.reportStatus?.toLowerCase() === 'not-approved') ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    emp.reportStatus?.toLowerCase() === 'revision' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                    emp.reportStatus?.toLowerCase() === 'late' ? 'bg-red-600/20 text-red-600 border-red-600/30' :
                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                  }`}>
                                        {emp.reportStatus?.toLowerCase() === 'late' ? 'LATE SUBMISSION' : (emp.reportStatus?.toLowerCase() === 'verified' ? `Verified ${emp.reportVerifiedBy ? 'by ' + emp.reportVerifiedBy : ''}` : (emp.reportStatus?.toLowerCase() === 'not-approved' ? 'NOT APPROVED' : (emp.reportStatus || 'Pending Verification')))}
                                      </span>
                                      
                                      {emp.id && emp.reportStatus?.toLowerCase() !== 'verified' && (
                                        <div className="flex gap-1.5">

                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleVerifyReport(emp.id);
                                            }}
                                            disabled={verifyingIds.has(emp.id)}
                                            className="text-xs bg-[#004AAE] hover:bg-[#003882] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {verifyingIds.has(emp.id) ? 'Processing...' : 'Verify Now'}
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRejectReport(emp.id);
                                            }}
                                            disabled={verifyingIds.has(emp.id)}
                                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {verifyingIds.has(emp.id) ? '...' : 'Not Approved'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className={`p-3 rounded-lg border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-[var(--bg-main)] border-[var(--border-color)]'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                      <p className="text-xs text-[#004AAE] font-bold uppercase tracking-wider">Report Content</p>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${textMain}`}>
                                      <LinkifyText text={emp.report} />
                                    </p>
                                    {emp.feedback && (
                                      <div className={`mt-2 p-2 rounded-lg text-xs border ${isLight ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/10 border-orange-500/20'}`}>
                                        <span className="font-bold text-orange-600 block mb-0.5 uppercase tracking-tighter">Feedback:</span>
                                        <span className="text-orange-700 italic">"{emp.feedback}"</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {emp.images && emp.images.map((img, idx) => {
                                      const isPdf = typeof img === 'string' && (img.startsWith('data:application/pdf') || img.toLowerCase().endsWith('.pdf'));
                                      return isPdf ? (
                                        <div
                                          key={idx}
                                          className="h-20 w-20 flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 cursor-pointer hover:scale-105 transition"
                                          onClick={() => setSelectedImage({ url: img, type: 'pdf' })}
                                          title="View PDF"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                          </svg>
                                          <span className="text-[10px] font-bold mt-1">PDF</span>
                                        </div>
                                      ) : (
                                        <img
                                          key={idx}
                                          src={img}
                                          alt="Report attachment"
                                          className="h-20 w-20 object-cover rounded-lg border border-[var(--border-color)] cursor-pointer hover:scale-105 transition"
                                          onClick={() => setSelectedImage({ url: img, type: 'image' })}
                                        />
                                      );
                                    })}
                                  </div>

                                  {isReportVerified && emp.reportVerifiedBy && (
                                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Verified by {emp.reportVerifiedBy} at {emp.reportVerifiedAt}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          )}
          {tab === 'Tasks' && (
            <div className="space-y-2">
              <h2 className={`text-lg font-bold ${isLight ? 'text-[#004AAE]' : 'text-primary'}`}>Assigned Tasks</h2>
              {tasks.filter(task => !task.milestone).map((task, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg flex flex-col md:flex-row md:items-center md:gap-6 ${cardClass} cursor-pointer hover:border-[#004AAE] transition-all group`}
                  onClick={() => setReviewTask(task)}
                >
                  <div className="flex-1">
                    <p className={`font-medium text-base ${textMain} group-hover:text-[#004AAE]`}>{task.title}</p>
                    <p className={`text-xs ${textSec}`}>{task.project?.title || "No Project"}   •   {cleanName(task.assignedTo?.name || task.assignedTo?.username)}</p>
                    <span className="text-xs text-[#004AAE]">{task.status}</span>
                  </div>
                  <div className="hidden md:block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#004AAE] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          {
            tab === 'Milestones' && (
              <div className="space-y-2">
                <h2 className={`text-lg font-bold ${isLight ? 'text-[#004AAE]' : 'text-primary'}`}>Milestones / Progress</h2>
                {tasks.filter(task => task.milestone).map((task, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg flex flex-col md:flex-row md:items-center md:gap-6 ${cardClass} cursor-pointer hover:border-[#004AAE] transition-all group`}
                    onClick={() => setReviewTask(task)}
                  >
                    <div className="flex-1">
                      <p className={`font-medium text-base ${textMain} group-hover:text-[#004AAE]`}>{task.title}</p>
                      <p className={`text-xs ${textSec}`}>{task.project?.title || "No Project"}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <span className="text-xs text-theme-secondary">Progress:</span>
                      <progress value={task.progress || 0} max="100" className="w-32 h-2 align-middle" />
                      <span className="text-xs text-theme-primary">{task.progress || 0}%</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#004AAE] opacity-0 group-hover:opacity-100 transition-opacity ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )
          }

          {
            tab === 'Assessments' && (
              <div className="space-y-4">
                <h2 className={`text-lg font-bold ${isLight ? 'text-[#004AAE]' : 'text-primary'}`}>Assessment History</h2>
                {assessments.length === 0 ? (
                  <p className="text-gray-400">No assessments recorded.</p>
                ) : (
                  assessments.map((assess) => (
                    <div key={assess.id} className={`p-4 rounded-lg border ${cardClass}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className={`font-bold text-lg ${textMain}`}>{assess.employeeName}</h3>
                          <p className={`text-xs ${textSec}`}>Week: {assess.weekRange}</p>
                          <p className={`text-xs ${textSec}`}>Evaluated by: {assess.projectHeadName}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-500/10 px-3 py-1 rounded-full text-yellow-500 border border-yellow-500/20">
                          <span className="font-bold">{assess.rating}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-3 rounded-md ${isLight ? 'bg-gray-50' : 'bg-[var(--bg-main)]'}`}>
                          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Summary</p>
                          <p className={`text-sm ${textMain}`}>{assess.summary}</p>
                        </div>
                        {assess.improvements && (
                          <div className="bg-red-500/5 p-3 rounded-md border border-red-500/10">
                            <p className="text-xs text-red-400 font-bold uppercase mb-1">Improvements</p>
                            <p className={`text-sm ${textMain}`}>{assess.improvements}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-right text-xs text-gray-500 mt-2">Submitted: {assess.date}</p>
                    </div>
                  ))
                )}
              </div>
            )
          }
        </>
      )}

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-[90vw] md:w-auto max-w-5xl bg-transparent p-2 rounded-2xl shadow-2xl flex justify-center items-center"
              onClick={e => e.stopPropagation()}
            >
              {selectedImage?.type === 'pdf' ? (
                <div className="flex flex-col gap-4 items-center w-full max-w-4xl">
                  <div className="w-full h-[70vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 flex items-center justify-center">
                    {(() => {
                      const url = selectedImage.url;
                      const isCloudinary = url.includes('cloudinary.com');
                      const previewUrl = isCloudinary 
                        ? url.replace(/\.pdf(\?.*)?$/i, '.jpg$1').replace(/\/upload\//, '/upload/pg_1,w_1000,c_limit,q_auto,f_auto/')
                        : url;
                      
                      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
                      
                      return (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                          {isCloudinary ? (
                            <img 
                              src={previewUrl} 
                              alt="PDF Preview" 
                              className="max-w-full max-h-full object-contain shadow-sm rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          
                          <iframe 
                            src={isCloudinary ? googleDocsUrl : url} 
                            style={{ display: isCloudinary ? 'none' : 'block' }}
                            className="w-full h-full border-none rounded-lg bg-white"
                            title="PDF Content"
                            onError={(e) => {
                                console.error("Iframe failed to load", e);
                            }}
                          />

                          <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg pointer-events-none">
                            PDF Preview
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex gap-4 w-full">
                    <a
                      href={selectedImage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-4 bg-[#004AAE] hover:bg-[#003882] text-white rounded-xl font-black flex items-center justify-center gap-3 transition-all shadow-xl text-lg uppercase tracking-tight"
                      onClick={e => e.stopPropagation()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open & Read Full PDF
                    </a>
                  </div>
                </div>
              ) : (
                <img
                  src={selectedImage?.url || selectedImage}
                  alt="Full view"
                  className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                />
              )}
            </motion.div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/20 p-2 rounded-full hover:bg-black/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* MILESTONE DETAILS MODAL - Same as Project Head panel */}
        {reviewTask && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`${isLight ? 'bg-white' : 'bg-[#1a1c23]'} rounded-xl w-full max-w-2xl border ${isLight ? 'border-gray-200' : 'border-[#2d3748]'} shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative`}
            >
              <div className={`p-4 ${isLight ? 'bg-gray-50' : 'bg-[#242632]'} border-b ${isLight ? 'border-gray-200' : 'border-[#2d3748]'} flex justify-between items-center`}>
                <h3 className={`text-xl font-bold flex items-center gap-2 ${isLight ? 'text-[#004AAE]' : 'text-primary'}`}>
                  <span className="p-1 bg-[#004AAE]/20 text-[#004AAE] rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  Task & Milestone Details
                </h3>
                <button onClick={() => setReviewTask(null)} className={`${textSec} hover:${textMain}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className={`bg-[#004AAE]/10 p-3 rounded border border-[#004AAE]/30 text-sm mb-4 ${textMain}`}>
                  <strong>Project:</strong> {reviewTask.project?.title || "No Project"} <br />
                  <strong>Task:</strong> {reviewTask.title} <br />
                  <strong>Assigned to:</strong> {cleanName(reviewTask.assignedTo?.name || reviewTask.assignedTo?.username)}
                </div>

                <h4 className={`font-semibold text-lg border-b ${isLight ? 'border-gray-200' : 'border-[#2d3748]'} pb-2 mb-4 ${textMain}`}>Milestones Breakdown</h4>

                {reviewTask.milestones && reviewTask.milestones.length > 0 ? (
                  reviewTask.milestones.map((ms, idx) => (
                    <div key={idx} className={`${isLight ? 'bg-gray-50' : 'bg-[#1a1c23]'} p-4 rounded-lg border ${isLight ? 'border-gray-200' : 'border-[#2d3748]'} relative`}>
                      <span className="absolute top-4 right-4 text-xs font-mono bg-[#004AAE] text-white px-2 py-1 rounded">Target: {ms.deadline ? new Date(ms.deadline).toLocaleDateString() : 'N/A'}</span>
                      <h5 className="font-bold text-base text-[#004AAE] mb-1">#{idx + 1} {ms.title}</h5>
                      <p className={`text-sm ${textSec} leading-relaxed mt-2`}>
                        {ms.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${ms.status === 'completed' ? 'bg-[#004AAE] text-white' : 'bg-gray-500 text-white'}`}>
                          {ms.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={textSec}>No milestones added for this task yet.</p>
                )}
              </div>

              <div className={`p-4 border-t ${isLight ? 'border-gray-200' : 'border-[#2d3748]'} flex justify-end`}>
                <button onClick={() => setReviewTask(null)} className="px-6 py-2 bg-[#004AAE] text-white rounded hover:bg-[#003882] transition shadow-sm shadow-blue-500/20">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* ATTENDANCE REPORT MODAL */}
          {reportModal.show && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setReportModal({ ...reportModal, show: false })}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className={`p-6 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative border ${isLight ? 'bg-white border-gray-100' : 'bg-[#1a1c23] border-[#2d3748]'}`}
              >
                <button
                  onClick={() => setReportModal({ ...reportModal, show: false })}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <FiXCircle size={24} />
                </button>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className={`text-xl font-bold font-outfit ${textMain}`}>Detailed Attendance Report</h3>
                    <p className={`text-sm ${textSec}`}>{reportModal.employee?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const presentDays = reportModal.data.filter(a => a.status === 'Verified' || a.status === 'Present').length;
                        const lateDays = reportModal.data.filter(a => a.isLate).length;
                        const reportsSubmitted = reportModal.data.filter(a => a.dailyReport && a.dailyReport !== 'No report submitted').length;
                        
                        const start = new Date(reportModal.startDate);
                        const end = new Date(reportModal.endDate);
                        const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
                        
                        // Account for Join Date in Working Days
                        let startDayForCalc = 1;
                        const targetEmp = employees.find(e => e.id === (reportModal.employee?.id || reportModal.employee?._id || selectedEmployeeId));
                        if (targetEmp?.joinDate) {
                          const joinD = new Date(targetEmp.joinDate);
                          if (joinD.getFullYear() === start.getFullYear() && joinD.getMonth() === start.getMonth()) {
                            startDayForCalc = joinD.getDate();
                          } else if (joinD.getFullYear() > start.getFullYear() || (joinD.getFullYear() === start.getFullYear() && joinD.getMonth() > start.getMonth())) {
                            startDayForCalc = lastDay + 1;
                          }
                        }

                        const calculateCompanyWorkingDays = (year, month, lastDay, startDay = 1) => {
                          if (!companyConfig) return (lastDay - startDay + 1);
                          const sundaysOff = companyConfig.sunday === false;
                          const nonWorkingDates = companyConfig.nonWorkingDates || [];
                          let workingDays = 0;
                          for (let d = startDay; d <= lastDay; d++) {
                            const date = new Date(year, month, d);
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const isSunday = date.getDay() === 0;
                            const isExplicitlyOff = nonWorkingDates.includes(dateStr);
                            const isWorkday = (dateStr === '2026-06-28') || (isSunday ? (!sundaysOff && !isExplicitlyOff) : !isExplicitlyOff);
                            if (isWorkday) workingDays++;
                          }
                          return workingDays;
                        };
                        const totalCWD = calculateCompanyWorkingDays(start.getFullYear(), start.getMonth(), lastDay, startDayForCalc);
                        const empWD = reportModal.data.filter(a => (a.checkIn && a.checkIn !== '--:--') || (a.dailyReport && a.dailyReport !== 'No report submitted') || ['Leave', 'Short Leave'].includes(a.status)).length;

                        const attendanceScore = totalCWD > 0 ? Math.min((presentDays / totalCWD) * 40, 40) : 0;
                        const punctualityScore = presentDays > 0 ? Math.min(((presentDays - lateDays) / presentDays) * 30, 30) : 0;
                        const reportScore = totalCWD > 0 ? Math.min((reportsSubmitted / totalCWD) * 30, 30) : 0;
                        const totalScore = attendanceScore + punctualityScore + reportScore;

                        const csvData = reportModal.data.map(a => ({
                          Date: new Date(a.date).toLocaleDateString(),
                          Status: a.status,
                          'Check In': a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '--',
                          'Check Out': a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '--',
                          'Daily Report': a.dailyReport || '--'
                        }));

                        // Add Summary Rows to Excel
                        csvData.push({}); // Empty row
                        csvData.push({ Date: 'Total Company Working Days', Status: totalCWD });
                        csvData.push({ Date: 'Employee Working Days', Status: empWD });
                        csvData.push({ Date: 'Attendance Score (/40)', Status: attendanceScore.toFixed(1) });
                        csvData.push({ Date: 'Punctuality Score (/30)', Status: punctualityScore.toFixed(1) });
                        csvData.push({ Date: 'Report Score (/30)', Status: reportScore.toFixed(1) });
                        csvData.push({ Date: 'FINAL PERFORMANCE SCORE', Status: `${totalScore.toFixed(1)}%` });

                        const ws = XLSX.utils.json_to_sheet(csvData);
                        // Add column widths
                        ws['!cols'] = [
                          { wch: 25 }, // Date / Summary Label
                          { wch: 15 }, // Status / Value
                          { wch: 15 }, // Check In
                          { wch: 15 }, // Check Out
                          { wch: 100 } // Daily Report
                        ];
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
                        XLSX.writeFile(wb, `${reportModal.employee?.name}-attendance.xlsx`);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-lg"
                    >
                      <FiDownload /> Export XLSX
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-bold hover:bg-gray-700 transition shadow-lg"
                    >
                      Print Report
                    </button>
                  </div>
                </div>

                <div className={`flex flex-wrap items-end gap-4 mb-6 p-4 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-[var(--bg-main)] border-[#2d3748]'}`}>
                  {/* Month/Year Filter (Presets) */}
                  <div className="flex gap-2">
                    <div className="w-40">
                      <label className={`block text-[10px] font-black ${textSec} mb-1 uppercase tracking-widest`}>Selection Month</label>
                      <select
                        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#004AAE] font-bold ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1a1c23] border-[#2d3748] text-white dark:[color-scheme:dark]'}`}
                        value={reportModal.startDate ? new Date(reportModal.startDate).getMonth() : new Date().getMonth()}
                        onChange={(e) => {
                          const m = parseInt(e.target.value);
                          const currentYear = reportModal.startDate ? new Date(reportModal.startDate).getFullYear() : new Date().getFullYear();
                          const start = `${currentYear}-${String(m + 1).padStart(2, '0')}-01`;
                          const end = `${currentYear}-${String(m + 1).padStart(2, '0')}-${new Date(currentYear, m + 1, 0).getDate()}`;
                          setReportModal(prev => ({ ...prev, startDate: start, endDate: end, data: [] }));
                          handleFetchReport(start, end);
                        }}
                      >
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                          <option key={i} value={i}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className={`block text-[10px] font-black ${textSec} mb-1 uppercase tracking-widest`}>Year</label>
                      <select
                        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#004AAE] font-bold ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1a1c23] border-[#2d3748] text-white dark:[color-scheme:dark]'}`}
                        value={reportModal.startDate ? new Date(reportModal.startDate).getFullYear() : new Date().getFullYear()}
                        onChange={(e) => {
                          const y = parseInt(e.target.value);
                          const currentMonth = reportModal.startDate ? new Date(reportModal.startDate).getMonth() : new Date().getMonth();
                          const start = `${y}-${String(currentMonth + 1).padStart(2, '0')}-01`;
                          const end = `${y}-${String(currentMonth + 1).padStart(2, '0')}-${new Date(y, currentMonth + 1, 0).getDate()}`;
                          setReportModal(prev => ({ ...prev, startDate: start, endDate: end, data: [] }));
                          handleFetchReport(start, end);
                        }}
                      >
                        {[2024, 2025, 2026, 2027].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="hidden lg:block w-px h-10 bg-gray-300 dark:bg-gray-700 mx-2"></div>

                  {/* Manual Date Filter */}
                  <div className="flex gap-2">
                    <div className="w-40">
                      <label className={`block text-[10px] font-black ${textSec} mb-1 uppercase tracking-widest`}>Start Date <span className="text-primary">*</span></label>
                      <input
                        type="date"
                        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#004AAE] font-bold ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1a1c23] border-[#2d3748] text-white dark:[color-scheme:dark]'}`}
                        value={reportModal.startDate}
                        onChange={(e) => setReportModal(prev => ({ ...prev, startDate: e.target.value, data: [] }))}
                      />
                    </div>
                    <div className="w-40">
                      <label className={`block text-[10px] font-black ${textSec} mb-1 uppercase tracking-widest`}>End Date <span className="text-primary">*</span></label>
                      <input
                        type="date"
                        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#004AAE] font-bold ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1a1c23] border-[#2d3748] text-white dark:[color-scheme:dark]'}`}
                        value={reportModal.endDate}
                        onChange={(e) => setReportModal(prev => ({ ...prev, endDate: e.target.value, data: [] }))}
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleFetchReport()}
                    className="px-8 py-2.5 bg-[#004AAE] text-white rounded-lg text-sm font-black hover:bg-[#003882] transition shadow-lg active:scale-95 uppercase tracking-tighter"
                  >
                    Refresh Report
                  </button>
                </div>

                {/* ATTENDANCE STAT CARDS */}
                {(() => {
                  const targetEmp = employees.find(e => e.id === (reportModal.employee?.id || reportModal.employee?._id || selectedEmployeeId));
                  const sDate = reportModal.startDate ? new Date(reportModal.startDate) : new Date();
                  const eDate = reportModal.endDate ? new Date(reportModal.endDate) : new Date();
                  
                  let totalCWD = 0;
                  const nonWorkingDates = companyConfig?.nonWorkingDates || [];
                  const sundaysOff = companyConfig?.sunday === false;

                  let cur = new Date(sDate);
                  cur.setHours(0,0,0,0);
                  const endLimit = new Date(eDate);
                  endLimit.setHours(23,59,59,999);

                  if (targetEmp?.joinDate) {
                    const joinD = new Date(targetEmp.joinDate);
                    joinD.setHours(0,0,0,0);
                    if (joinD > cur) cur = joinD;
                  }

                  while (cur <= endLimit) {
                    const y = cur.getFullYear();
                    const m = String(cur.getMonth() + 1).padStart(2, '0');
                    const d = String(cur.getDate()).padStart(2, '0');
                    const dateStr = `${y}-${m}-${d}`;
                    const isSunday = cur.getDay() === 0;
                    const isExplicitlyOff = nonWorkingDates.includes(dateStr);
                    const isWorkday = (dateStr === '2026-06-28') || (isSunday ? (!sundaysOff && !isExplicitlyOff) : !isExplicitlyOff);
                    if (isWorkday) totalCWD++;
                    cur.setDate(cur.getDate() + 1);
                  }

                  const presentDays = reportModal.data.filter(a => ['Verified', 'Present', 'Late', 'WFH', 'Work From Home', 'Half Day', 'Pending', 'Official Duty'].includes(a.status) || (a.checkIn && a.checkIn !== '--:--')).length;
                  const leaveDays = reportModal.data.filter(a => ['Leave', 'Short Leave'].includes(a.status)).length;
                  const empWD = presentDays;
                  
                  const explicitAbsent = reportModal.data.filter(a => a.status === 'Absent' || a.status === 'Report not submitted').length;
                  const calculatedAbsent = Math.max(0, totalCWD - presentDays - leaveDays);
                  const absentDays = explicitAbsent > 0 ? Math.max(explicitAbsent, calculatedAbsent) : calculatedAbsent;

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div className={`p-4 rounded-xl border text-center ${isLight ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>Total Working Days</p>
                        <p className={`text-2xl font-bold ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>{totalCWD}</p>
                      </div>
                      <div className={`p-4 rounded-xl border text-center ${isLight ? 'bg-blue-50 border-blue-100' : 'bg-blue-500/10 border-blue-500/20'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Employee Working Days</p>
                        <p className={`text-2xl font-bold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{empWD}</p>
                      </div>
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Present</p>
                        <p className="text-2xl font-bold text-green-600">{presentDays}</p>
                      </div>
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Absent</p>
                        <p className="text-2xl font-bold text-red-600">{absentDays}</p>
                      </div>
                      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Leave</p>
                        <p className="text-2xl font-bold text-orange-600">{leaveDays}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* SCORING SUMMARY IN MODAL */}
                <div className={`mb-6 p-4 rounded-xl border ${isLight ? 'bg-amber-50 border-amber-100' : 'bg-white/5 border-white/10 shadow-lg'}`}>
                  <h4 className={`text-sm font-bold uppercase tracking-widest ${isLight ? 'text-amber-600' : 'text-white'} mb-4 flex items-center gap-2`}>
                    <FiBarChart2 /> Performance Scoring (Based on Selected Range)
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      const presentDays = reportModal.data.filter(a => ['Verified', 'Present', 'Late'].includes(a.status) || (a.checkIn && a.checkIn !== '--:--')).length;
                      const lateDays = reportModal.data.filter(a => a.isLate || a.status === 'Late').length;
                      const reportsSubmitted = reportModal.data.filter(a => a.dailyReport && a.dailyReport !== 'No report submitted').length;
                      
                      const targetEmp = employees.find(e => e.id === (reportModal.employee?.id || reportModal.employee?._id || selectedEmployeeId));
                      const sDate = reportModal.startDate ? new Date(reportModal.startDate) : new Date();
                      const eDate = reportModal.endDate ? new Date(reportModal.endDate) : new Date();
                      
                      let totalCWD = 0;
                      const nonWorkingDates = companyConfig?.nonWorkingDates || [];
                      const sundaysOff = companyConfig?.sunday === false;

                      let cur = new Date(sDate);
                      cur.setHours(0,0,0,0);
                      const endLimit = new Date(eDate);
                      endLimit.setHours(23,59,59,999);

                      if (targetEmp?.joinDate) {
                        const joinD = new Date(targetEmp.joinDate);
                        joinD.setHours(0,0,0,0);
                        if (joinD > cur) cur = joinD;
                      }

                      while (cur <= endLimit) {
                        const y = cur.getFullYear();
                        const m = String(cur.getMonth() + 1).padStart(2, '0');
                        const d = String(cur.getDate()).padStart(2, '0');
                        const dateStr = `${y}-${m}-${d}`;
                        const isSunday = cur.getDay() === 0;
                        const isExplicitlyOff = nonWorkingDates.includes(dateStr);
                        const isWorkday = (dateStr === '2026-06-28') || (isSunday ? (!sundaysOff && !isExplicitlyOff) : !isExplicitlyOff);
                        if (isWorkday) totalCWD++;
                        cur.setDate(cur.getDate() + 1);
                      }

                      const attendanceScore = totalCWD > 0 ? Math.min((presentDays / totalCWD) * 40, 40) : 0;
                      const punctualityScore = presentDays > 0 ? Math.min(((presentDays - lateDays) / presentDays) * 30, 30) : 0;
                      const reportScore = totalCWD > 0 ? Math.min((reportsSubmitted / totalCWD) * 30, 30) : 0;
                      const totalScore = attendanceScore + punctualityScore + reportScore;

                      const titleColor = isLight ? 'text-amber-700/60' : 'text-gray-400';
                      const valueColor = isLight ? 'text-amber-700' : 'text-white';

                      return (
                        <>
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-bold ${titleColor} uppercase`}>Attendance</span>
                            <span className={`text-xl font-black ${valueColor}`}>{attendanceScore.toFixed(1)}<span className="text-xs opacity-50">/40</span></span>
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-bold ${titleColor} uppercase`}>Punctuality</span>
                            <span className={`text-xl font-black ${valueColor}`}>{punctualityScore.toFixed(1)}<span className="text-xs opacity-50">/30</span></span>
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-bold ${titleColor} uppercase`}>Reports</span>
                            <span className={`text-xl font-black ${valueColor}`}>{reportScore.toFixed(1)}<span className="text-xs opacity-50">/30</span></span>
                          </div>
                          <div className={`flex flex-col p-2 ${isLight ? 'bg-amber-500/20 border-amber-500/30' : 'bg-white/10 border-white/20'} rounded-lg border`}>
                            <span className={`text-[10px] font-bold ${isLight ? 'text-amber-700' : 'text-gray-300'} uppercase`}>Total performance Score</span>
                            <span className={`text-2xl font-black ${isLight ? 'text-amber-800' : 'text-white'}`}>{totalScore.toFixed(1)}%</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-gray-200' : 'border-[#2d3748]'}`}>
                  <table className="w-full text-sm border-collapse print:text-black">
                    <thead className={isLight ? 'bg-gray-50' : 'bg-[#242632]'}>
                      <tr className="text-left border-b border-theme">
                        <th className={`p-4 font-bold ${textMain}`}>Date</th>
                        <th className={`p-4 font-bold ${textMain}`}>In Time</th>
                        <th className={`p-4 font-bold ${textMain}`}>Out Time</th>
                        <th className={`p-4 font-bold ${textMain}`}>Status</th>
                        <th className={`p-4 font-bold ${textMain}`}>Daily Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportModal.data.map((a, i) => (
                        <tr key={a._id || `${a.date}-${i}`} className={`border-b ${isLight ? 'border-gray-100 hover:bg-gray-50' : 'border-[#2d3748] hover:bg-white/5'} transition-colors`}>
                          <td className="p-4 font-medium">{new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td className="p-4">
                            <div className={`flex items-center gap-2 ${a.isLate ? 'text-red-600 font-bold' : ''}`}>
                              {a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </div>
                          </td>
                          <td className="p-4">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'Verified' || a.status === 'Present' ? 'bg-green-100 text-green-700' :
                              a.status === 'Leave' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className={`text-xs max-w-xs truncate ${textSec}`} title={a.dailyReport}>
                              {a.dailyReport || '--'}
                            </p>
                          </td>
                        </tr>
                      ))}
                      {reportModal.data.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-12 text-center text-theme-secondary italic">
                            No attendance data available for the selected range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}
        {/* LATE SUBMISSION CONFIRMATION MODAL */}
          {lateConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setLateConfirm(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className={`p-6 rounded-2xl w-full max-w-md shadow-2xl relative border ${isLight ? 'bg-white border-gray-100' : 'bg-[#1a1c23] border-[#2d3748]'}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${lateConfirm.status === 'late' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                    <FiClock size={24} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold font-outfit ${textMain}`}>
                      {lateConfirm.status === 'late' ? 'Remove Late Mark?' : 'Mark as Late Submission?'}
                    </h3>
                    <p className={`text-sm ${textSec}`}>{lateConfirm.name}'s daily report</p>
                  </div>
                </div>
                
                <p className={`text-sm mb-6 ${textSec} leading-relaxed`}>
                  {lateConfirm.status === 'late' 
                    ? "Are you sure you want to mark this report as valid? The red highlight will be removed."
                    : "Are you sure this report was submitted late? This will flag the report and highlight it in red for other admins."}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setLateConfirm(null)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${isLight ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100' : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleMarkLate(lateConfirm.id);
                      setLateConfirm(null);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg text-white
                      ${lateConfirm.status === 'late' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {lateConfirm.status === 'late' ? 'Remove Mark' : 'Yes, Mark Late'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        {/* IMAGE PREVIEW MODAL */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-5xl w-full flex flex-col items-center"
              >
                <div className="absolute -top-12 right-0 flex gap-4">
                  <a 
                    href={selectedImage.url} 
                    download 
                    className="text-white hover:text-[#004AAE] font-bold text-sm flex items-center gap-2 transition-colors bg-white/10 px-4 py-2 rounded-lg"
                  >
                    <FiDownload size={18} /> Download
                  </a>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-white hover:text-red-500 font-bold text-sm flex items-center gap-2 transition-colors bg-white/10 px-4 py-2 rounded-lg"
                  >
                    Close
                  </button>
                </div>

                {selectedImage.type === 'pdf' ? (
                  (() => {
                    let pdfUrl = selectedImage.url;
                    if (typeof pdfUrl === 'string' && pdfUrl.startsWith('data:application/pdf;base64,')) {
                      try {
                        const base64Data = pdfUrl.split(',')[1];
                        const byteCharacters = atob(base64Data);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'application/pdf' });
                        pdfUrl = URL.createObjectURL(blob);
                      } catch (e) {
                        console.error("PDF Blob conversion failed", e);
                      }
                    }
                    const isCloudinary = pdfUrl.includes('cloudinary.com');
                    const previewUrl = isCloudinary 
                      ? pdfUrl.replace(/\.pdf(\?.*)?$/i, '.jpg$1').replace(/\/upload\//, '/upload/pg_1,w_1000,c_limit,q_auto,f_auto/')
                      : pdfUrl;
                    
                    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
                    // Fix: don't append toolbar to base64 URLs
                    const finalIframeUrl = (pdfUrl.startsWith('http') && !isCloudinary) ? `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1` : (isCloudinary ? googleDocsUrl : pdfUrl);

                    return (
                      <div className="w-full h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col border-4 border-white/10">
                        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-100/80 backdrop-blur-md">
                          <div className="flex items-center gap-2 pl-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">Activity Proof PDF</span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => window.open(pdfUrl, '_blank')}
                              className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
                            >
                              <FiEye size={14} /> Full Screen / Fix Blank
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 bg-white relative flex items-center justify-center overflow-hidden">
                          {/* LOADING INDICATOR */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-0">
                            <div className="w-10 h-10 border-4 border-[#004AAE] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 font-bold animate-pulse text-xs tracking-widest uppercase">Initialising Preview...</p>
                          </div>

                          {isCloudinary ? (
                            <img 
                              src={previewUrl} 
                              alt="PDF Preview" 
                              className="max-w-full max-h-full object-contain shadow-sm z-10"
                              onLoad={(e) => {
                                // Hide loading when image is ready
                                e.target.previousSibling.style.display = 'none';
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <iframe
                            src={finalIframeUrl}
                            style={{ display: isCloudinary ? 'none' : 'block' }}
                            className="w-full h-full border-0 bg-white z-10"
                            title="PDF Preview"
                            onLoad={(e) => {
                                // Hide loading when iframe is ready (note: may not reliably trigger for base64)
                                try {
                                    const loadingDiv = e.target.parentElement.firstChild;
                                    if(loadingDiv) loadingDiv.style.display = 'none';
                                } catch(err) {}
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <img
                    src={selectedImage.url}
                    alt="Preview"
                    className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border-2 border-white/20"
                  />
                )}
                
                <p className="mt-4 text-white/60 text-sm font-medium">Click outside to close</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
      {/* LEAVE SELECTION MODAL */}
      <AnimatePresence>
        {leaveModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-gray-100' : 'bg-[#1a1c23] border-[#2d3748]'} shadow-2xl w-full max-w-sm`}
            >
              <h3 className={`text-lg font-black uppercase mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>Select Leave Type</h3>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-6 italic opacity-70 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Define reason for record keeping</p>
              
              <div className="flex flex-col gap-2">
                {['Casual Leave', 'Sick Leave', 'Medical Leave', 'Emergency Leave', 'Official Work', 'Other'].map(type => (
                  <button
                    key={type}
                    onClick={() => {
                        handleUpdateAttendance(leaveModal.empId, 'Leave', type);
                        setLeaveModal({ show: false, empId: null });
                    }}
                    className={`w-full py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl text-left transition-all border border-white/5 
                        ${isLight ? 'bg-gray-50 hover:bg-orange-500 hover:text-white text-gray-700' : 'bg-[#12141a] hover:bg-orange-600 hover:text-white text-white'}`}
                  >
                    {type}
                  </button>
                ))}
                <button 
                  onClick={() => setLeaveModal({ show: false, empId: null })}
                  className={`w-full mt-4 py-3 px-4 text-[10px] font-bold uppercase tracking-widest transition-all font-primary ${isLight ? 'text-gray-500 hover:text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* DOWNLOAD MODAL */}
      <AnimatePresence>
          {showDownloadModal && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
              >
                  <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className={`w-full max-w-md p-8 rounded-[2rem] border shadow-2xl ${isLight ? 'bg-white border-gray-100' : 'bg-[#1a1433] border-[#2a2255]'}`}
                  >
                      <h3 className={`text-2xl font-black mb-6 text-center ${isLight ? 'text-[#004AAE]' : 'text-white'}`}>Download Monthly Report</h3>
                      <div className="space-y-6">
                          <div>
                              <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 opacity-60 ${isLight ? 'text-gray-900' : 'text-white'}`}>Select Month</label>
                              <input
                                  type="month"
                                  value={downloadMonth}
                                  onChange={(e) => setDownloadMonth(e.target.value)}
                                  className={`w-full p-4 rounded-2xl border outline-none font-bold text-lg transition-all
                                      ${isLight 
                                          ? 'bg-gray-100 border-gray-200 text-gray-900 focus:ring-4 focus:ring-[#004AAE]/10 focus:border-[#004AAE]' 
                                          : 'bg-[#0f0a1f] border-[#2a2255] text-white focus:ring-4 focus:ring-[#004AAE]/30 focus:border-[#004AAE]'
                                      }`}
                              />
                          </div>
                          <div className="flex gap-4">
                              <button
                                  onClick={() => setShowDownloadModal(false)}
                                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                              >
                                  Cancel
                              </button>
                              <button
                                  onClick={async () => {
                                       try {
                                           setLoading(true);
                                           const [year, month] = downloadMonth.split('-').map(Number);
                                           const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
                                           const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
                                           
                                           const res = await api.get(`/hr/attendance?startDate=${startDate}&endDate=${endDate}`);
                                           if (!res.data.success) throw new Error("Fetch failed");

                                           const attendance = res.data.data || [];
                                           const reports = res.data.reports || [];
                                           
                                           const daysInMonth = new Date(year, month, 0).getDate();
                                           const holidayDates = (companyConfig?.value?.nonWorkingDates || []).map(d => formatDateSafe(d));
                                           const isSundayOff = !(companyConfig?.value?.sunday === true);

                                           const wb = XLSX.utils.book_new();
                                           const employeeSheets = {}; 

                                           const formatTime = (iso) => {
                                               if (!iso) return '--:--';
                                               const date = new Date(iso);
                                               return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                                           };

                                           // Process all employees
                                           employees.forEach(emp => {
                                                  const empName = emp.name;
                                                  const empId = emp.id;
                                                  const rows = [];

                                                  for (let d = 1; d <= daysInMonth; d++) {
                                                      const currentDayStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                      const dateObj = new Date(currentDayStr);
                                                      const isSunday = dateObj.getUTCDay() === 0;
                                                      const isJune28 = currentDayStr === '2026-06-28';
                                                      if (((isSunday && isSundayOff) || holidayDates.includes(currentDayStr)) && !isJune28) continue;

                                                      const att = attendance.find(a => formatDateSafe(a.date) === currentDayStr && (a.user?._id || a.user) === empId);
                                                      const rep = reports.find(r => formatDateSafe(r.date) === currentDayStr && (r.userId?._id || r.userId) === empId);

                                                      rows.push({
                                                          'Date': currentDayStr,
                                                          'Attendance Status': att ? att.status : 'Absent',
                                                          'Check In': formatTime(att?.checkIn),
                                                          'Check Out': formatTime(att?.checkOut),
                                                          'Report Text': rep ? rep.report : 'No report submitted',
                                                          'Report Status': rep ? (rep.status || 'Pending') : 'N/A',
                                                          'Verified By': rep?.verifiedBy ? (rep.verifiedBy.name || rep.verifiedBy.username || 'Admin') : 'N/A'
                                                      });
                                                  }

                                                  if (rows.length > 0) {
                                                      employeeSheets[empName] = rows;
                                                  }
                                              });

                                              const zip = new JSZip();
                                              const zipFolder = zip.folder(`Reports_${downloadMonth}`);

                                              // Create individual files in the ZIP folder
                                              Object.keys(employeeSheets).sort().forEach(name => {
                                                  const wb = XLSX.utils.book_new();
                                                  const ws = XLSX.utils.json_to_sheet(employeeSheets[name]);
                                                  XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");
                                                  
                                                  // Generate binary data for the Excel file
                                                  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                                                  zipFolder.file(`${name.replace(/[\\/?*\[\]]/g, "")}_${downloadMonth}.xlsx`, excelBuffer);
                                              });

                                              // Create a main summary file inside the ZIP as well
                                              const summaryData = Object.keys(employeeSheets).sort().map(name => ({
                                                  'Employee Name': name,
                                                  'Working Days': employeeSheets[name].length,
                                                  'Present Days': employeeSheets[name].filter(r => ['Present', 'Verified', 'Late'].includes(r.Status)).length,
                                                  'Absents': employeeSheets[name].filter(r => r.Status === 'Absent').length
                                              }));
                                              const summaryWb = XLSX.utils.book_new();
                                              const summaryWs = XLSX.utils.json_to_sheet(summaryData);
                                              XLSX.utils.book_append_sheet(summaryWb, summaryWs, "Summary");
                                              const summaryBuffer = XLSX.write(summaryWb, { bookType: 'xlsx', type: 'array' });
                                              zipFolder.file(`AA_MAIN_SUMMARY_${downloadMonth}.xlsx`, summaryBuffer);

                                              // Generate and download the ZIP
                                              const zipContent = await zip.generateAsync({ type: "blob" });
                                              const url = URL.createObjectURL(zipContent);
                                              const link = document.createElement("a");
                                              link.href = url;
                                              link.download = `Reports_Folder_${downloadMonth}.zip`;
                                              link.click();
                                              URL.revokeObjectURL(url);

                                              toast.success("Reports folder (ZIP) downloaded");
                                              setShowDownloadModal(false);
                                          } catch (err) {
                                              toast.error("Failed to download report");
                                          } finally {
                                              setLoading(false);
                                          }
                                      }}
                                  className="flex-1 py-4 rounded-2xl bg-[#004AAE] text-white font-black shadow-lg shadow-[#004AAE]/20 hover:scale-[1.02] active:scale-95 transition-all"
                              >
                                  Download
                              </button>
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      {/* SCORING REPORT MODAL */}
      <AnimatePresence>
          {showScoringModal && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
              >
                  <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className={`w-full max-w-md p-8 rounded-[2rem] border shadow-2xl ${isLight ? 'bg-white border-gray-100' : 'bg-[#1a1433] border-[#2a2255]'}`}
                  >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                          <FiBarChart2 size={24} />
                        </div>
                        <div>
                          <h3 className={`text-2xl font-black ${isLight ? 'text-[#004AAE]' : 'text-white'}`}>Scoring Report</h3>
                          <p className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${isLight ? 'text-gray-900' : 'text-white'}`}>Performance & Punctuality Analysis</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                          <div>
                              <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 opacity-60 ${isLight ? 'text-gray-900' : 'text-white'}`}>Select Report Month</label>
                              <input
                                  type="month"
                                  value={scoringMonth}
                                  onChange={(e) => setScoringMonth(e.target.value)}
                                  className={`w-full p-4 rounded-2xl border outline-none font-bold text-lg transition-all
                                      ${isLight 
                                          ? 'bg-gray-100 border-gray-200 text-gray-900 focus:ring-4 focus:ring-[#004AAE]/10 focus:border-[#004AAE]' 
                                          : 'bg-[#0f0a1f] border-[#2a2255] text-white focus:ring-4 focus:ring-[#004AAE]/30 focus:border-[#004AAE]'
                                      }`}
                              />
                          </div>
                          
                          <div className={`p-4 rounded-xl border text-xs leading-relaxed ${isLight ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-blue-900/10 border-blue-900/30 text-blue-300'}`}>
                            <p className="font-bold mb-1 uppercase tracking-tighter">Report Sorting</p>
                            This report will be sorted by <strong>Total Score</strong> (Descending). Top performing employees will appear at the top.
                          </div>

                          <div className="flex gap-4 pt-2">
                              <button
                                  onClick={() => setShowScoringModal(false)}
                                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                              >
                                  Cancel
                              </button>
                              <button
                                  onClick={async () => {
                                      try {
                                          setLoading(true);
                                          const res = await api.get(`/hr/reports/scoring?month=${scoringMonth}`);
                                          if (res.data.success) {
                                              const csvData = [
                                                  ["Rank", "Employee Name", "Department", "Present Days", "Late Days", "Reports Submitted", "Total Working Days", "Attendance (40%)", "Punctuality (30%)", "Report Score (30%)", "Total Performance (100%)"],
                                                  ...res.data.data.map((row, index) => [
                                                      index + 1,
                                                      row.name,
                                                      row.department,
                                                      row.presentDays,
                                                      row.lateDays,
                                                      row.reportsSubmitted,
                                                      row.totalWorkingDays,
                                                      `${row.scores.attendance}%`,
                                                      `${row.scores.punctuality}%`,
                                                      `${row.scores.reports}%`,
                                                      `${row.scores.total}%`
                                                  ])
                                              ].map(e => e.join(",")).join("\n");
                                              
                                              const blob = new Blob([csvData], { type: 'text/csv' });
                                              const url = window.URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = `Scoring_Report_${scoringMonth}.csv`;
                                              a.click();
                                              toast.success(`Scoring report for ${scoringMonth} downloaded`);
                                              setShowScoringModal(false);
                                          }
                                      } catch (err) {
                                          toast.error("Failed to download scoring report");
                                      } finally {
                                          setLoading(false);
                                      }
                                  }}
                                  className="flex-1 py-4 rounded-2xl bg-[#004AAE] text-white font-black shadow-lg shadow-[#004AAE]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                  <FiDownload /> Download CSV
                              </button>
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}
