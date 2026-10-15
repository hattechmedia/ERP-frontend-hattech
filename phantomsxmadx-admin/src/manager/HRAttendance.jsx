import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiXCircle, FiClock, FiDownload, FiArchive, FiFileText, FiBarChart2, FiEdit } from "react-icons/fi";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import api from "../services/api";

export default function HRAttendance() {
  const [employees, setEmployees] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    return localStorage.getItem('hr_attendance_date') || new Date().toISOString().split('T')[0];
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState({ show: false, employee: null, startDate: '', endDate: '', data: [] });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [workingDays, setWorkingDays] = useState({
    sunday: false,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    nonWorkingDates: []
  });
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [editingMarked, setEditingMarked] = useState(new Set());


  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, attRes] = await Promise.all([
        api.get('/employees'),
        api.get(`/hr/attendance?date=${selectedDate}`)
      ]);

      if (empRes.data.success) {
        const filteredEmps = (empRes.data.data || []).filter(emp => {
          const name = (emp.name || "").toLowerCase();
          const dept = (emp.department || '').toLowerCase();
          const status = (emp.status || 'active').toLowerCase();
          
          if (status !== 'active') return false;
          if (name.includes('hr hattech') || name.includes('it support') || name.includes('soa w')) return false;
          
          return !dept.includes('hr') && !dept.includes('it support') && !dept.includes('it-support');
        });
        setEmployees(filteredEmps);
      }
      if (attRes.data.success) {
        const attendance = attRes.data.data || [];
        const reports = attRes.data.reports || [];
        
        const combined = attendance.map(att => {
          const matchingReport = reports.find(r => (r.userId?._id || r.userId) === (att.user?._id || att.user));
          return {
            ...att,
            dailyReport: matchingReport ? matchingReport.report : 'No report submitted'
          };
        });
        
        setActivities(combined);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/hr/config/working_days');
      if (res.data.success && res.data.data) {
        setWorkingDays(res.data.data.value);
      }
    } catch (err) {
      console.error("Failed to fetch working days config", err);
    }
  };

  useEffect(() => {
    localStorage.setItem('hr_attendance_date', selectedDate);
    fetchData();
    fetchConfig();
  }, [selectedDate]);

  const toggleSpecificDate = (dateStr) => {
    setWorkingDays(prev => {
      const isOff = prev.nonWorkingDates?.includes(dateStr);
      const newDates = isOff 
        ? prev.nonWorkingDates.filter(d => d !== dateStr)
        : [...(prev.nonWorkingDates || []), dateStr];
      return { ...prev, nonWorkingDates: newDates };
    });
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calMonth, calYear);
    const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday
    const days = [];
    
    // Empty slots for alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(calYear, calMonth, i);
      days.push(date);
    }
    
    return days;
  };

  // Performance: Pre-index activities by userId for O(1) lookup instead of O(N) linear scan per employee row.
  // Previously getEmployeeActivity did activities.find(...) on every render for every employee card.
  const activitiesByUserId = useMemo(() => {
    const map = new Map();
    activities.forEach(a => {
      if (!a.date) return;
      const dateStr = new Date(a.date).toISOString().split('T')[0];
      if (dateStr !== selectedDate) return;
      const uid = a.user?._id || a.user;
      if (uid) map.set(String(uid), a);
    });
    return map;
  }, [activities, selectedDate]);

  const getEmployeeActivity = (userId) => {
    return activitiesByUserId.get(String(userId)) || null;
  };

  const handleVerifyAttendance = async (userId, status) => {
    try {
      const res = await api.post('/hr/attendance/verify', {
        userId,
        date: selectedDate,
        status: status
      });

      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to verify attendance", err);
      toast.error("Failed to verify attendance");
    }
  };

  const handleFetchReport = async () => {
    const targetUserId = reportModal.employee?.userId?._id || reportModal.employee?.userId || reportModal.employee?.id;
    if (!targetUserId || !reportModal.startDate || !reportModal.endDate) return;
    try {
      const res = await api.get(`/hr/attendance?userId=${targetUserId}&startDate=${reportModal.startDate}&endDate=${reportModal.endDate}`);
      if (res.data.success) {
        const attendance = res.data.data || [];
        const reports = res.data.reports || [];

        const combined = attendance.map(att => {
          const attDate = new Date(att.date).toISOString().split('T')[0];
          const matchingReport = reports.find(r => new Date(r.date).toISOString().split('T')[0] === attDate);
          return {
            ...att,
            dailyReport: matchingReport ? matchingReport.report : 'No report submitted'
          };
        });

        reports.forEach(r => {
          const rDate = new Date(r.date).toISOString().split('T')[0];
          if (!combined.some(c => new Date(c.date).toISOString().split('T')[0] === rDate)) {
            combined.push({
              date: r.date,
              status: 'Report Only',
              dailyReport: r.report,
              checkIn: null,
              checkOut: null
            });
          }
        });

        setReportModal(prev => ({ ...prev, data: combined.sort((a, b) => new Date(b.date) - new Date(a.date)) }));
      }
    } catch (err) {
      console.error("Failed to fetch report", err);
    }
  };

  const handleClearDay = async () => {
    if (!window.confirm(`Are you sure you want to DELETE ALL attendance records for ${selectedDate}? This cannot be undone.`)) return;
    
    try {
      const res = await api.delete('/hr/attendance/day', { data: { date: selectedDate } });
      if (res.data.success) {
        toast.success(`Cleared all records for ${selectedDate}`);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to clear day", err);
      toast.error("Failed to clear day");
    }
  };

  const stats = useMemo(() => {
    let present = 0, absent = 0, pending = 0;

    employees.forEach(emp => {
      const activity = activitiesByUserId.get(String(emp.userId?._id || emp.userId));
      if (!activity) {
        absent++;
      } else {
        if (activity.status === 'Verified' || activity.status === 'Present' || activity.status === 'Late') present++;
        else if (activity.status === 'Absent') absent++;
        else if (activity.status === 'Leave' || activity.status === 'Short Leave') absent++;
        else pending++;
      }
    });

    const leaveCount = activities.filter(a => a.status === 'Leave').length;
    const shortLeaveCount = activities.filter(a => a.status === 'Short Leave').length;

    return { present, absent, pending, leave: leaveCount, shortLeave: shortLeaveCount };
  }, [employees, activitiesByUserId, activities]);

  const handleExportReport = () => {
    const data = employees.map(emp => {
      const activity = getEmployeeActivity(emp.userId?._id || emp.userId);
      return {
        'Employee Name': emp.name,
        'Email': emp.email,
        'Date': selectedDate,
        'Login Time': activity?.checkIn ? new Date(activity.checkIn).toLocaleTimeString() : 'N/A',
        'Logout Time': activity?.checkOut ? new Date(activity.checkOut).toLocaleTimeString() : 'N/A',
        'Status': activity?.status || 'Pending',
        'Is Late': activity?.status === 'Late' ? 'Yes' : 'No'
      };
    });

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading && employees.length === 0) return <div className="p-8 text-center text-theme-secondary">Loading attendance data...</div>;

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FiClock className="text-[#004AAE]" /> Attendance Management
          </h2>
          <p className="text-sm text-gray-500 mb-2">Verify employee logins and manage records</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2 rounded-lg bg-[#004AAE] !text-white hover:bg-[#003882] flex items-center gap-2 transition text-xs whitespace-nowrap w-full md:w-auto justify-center"
              title="Configure Company Working Days"
            >
              <FiArchive /> Company Calendar
            </button>
            <button
              onClick={handleClearDay}
              className="px-4 py-2 rounded-lg bg-red-600 !text-white hover:bg-red-700 flex items-center gap-2 transition text-xs whitespace-nowrap w-full md:w-auto justify-center"
              title="Clear all records for this date"
            >
              <FiXCircle /> Clear Day
            </button>
            <input
              type="file"
              accept=".csv, .xls, .xlsx"
              id="csvUpload"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (event) => {
                  const data = new Uint8Array(event.target.result);
                  const workbook = XLSX.read(data, { type: 'array' });
                  const sheetName = workbook.SheetNames[0];
                  const sheet = workbook.Sheets[sheetName];

                  // Get raw data (Array of Arrays) to handle complex layouts
                  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

                  if (rawData.length === 0) {
                    toast.error("File is empty");
                    return;
                  }

                  let records = [];
                  const firstRow = rawData[0];

                  // --- DETECT FORMAT ---
                  const isStandard = firstRow.includes("Employee Name") && firstRow.includes("Date");

                  if (isStandard) {
                    // STANDARD FORMAT
                    const headers = firstRow.map(h => String(h).trim());
                    records = rawData.slice(1).map(row => {
                      const record = {};
                      headers.forEach((h, i) => {
                        if (h) {
                          // Normalize keys locally to help backend
                          let key = h;
                          if (h.toLowerCase().includes('name')) key = 'Employee Name';
                          if (h.toLowerCase().includes('date')) key = 'Date';
                          if (h.toLowerCase().includes('login') || h.toLowerCase().includes('check in')) key = 'Check In';
                          if (h.toLowerCase().includes('logout') || h.toLowerCase().includes('check out')) key = 'Check Out';
                          record[key] = row[i];
                        }
                      });
                      return record;
                    });
                  } else {
                    // BIOMETRIC GRID FORMAT (Grid++Report style)
                    // Heuristic: Row 0 has numbers 1, 2, 3... representing days?
                    // Or maybe row 0 is empty and Row 1 has days? The user screenshot shows Row 1 (Index 1 in Excel, 0 in Array?) 
                    // Let's find the "Day Header Row". It's the row with many numbers (1..31).

                    let dayHeaderRowIdx = -1;
                    let dayColMap = {}; // { colIndex: dayNumber }

                    // Find the header row (contains 1, 2, 3...)
                    for (let r = 0; r < Math.min(rawData.length, 5); r++) {
                      let numberCount = 0;
                      rawData[r].forEach((cell, idx) => {
                        if (!isNaN(parseInt(cell)) && parseInt(cell) >= 1 && parseInt(cell) <= 31) {
                          numberCount++;
                        }
                      });
                      if (numberCount > 5) { // Threshold to confirm it's the day header
                        dayHeaderRowIdx = r;
                        rawData[r].forEach((cell, idx) => {
                          const d = parseInt(cell);
                          if (!isNaN(d) && d >= 1 && d <= 31) {
                            dayColMap[idx] = d;
                          }
                        });
                        break;
                      }
                    }

                    if (dayHeaderRowIdx === -1) {
                      toast.error("Could not detect format. Please use the Standard Template or ensure Day Numbers (1-31) are in the header.");
                      return;
                    }

                    // Process Rows pairs
                    // --- DETECT MONTH/YEAR FROM FILE ---
                    let detectedMonth = -1;
                    let detectedYear = -1;
                    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
                    const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

                    // Scan first 10 rows for month names or "Month:" / "Year:" labels
                    for (let r = 0; r < Math.min(rawData.length, 10); r++) {
                      for (let c = 0; c < rawData[r].length; c++) {
                        const cellVal = String(rawData[r][c] || "").trim().toLowerCase();
                        if (!cellVal) continue;

                        monthNames.forEach((m, idx) => {
                          if (cellVal.includes(m)) detectedMonth = idx;
                        });
                        if (detectedMonth === -1) {
                          shortMonths.forEach((m, idx) => {
                            if (cellVal.includes(m)) detectedMonth = idx;
                          });
                        }

                        const yearMatch = cellVal.match(/\b(202[0-9])\b/);
                        if (yearMatch) detectedYear = parseInt(yearMatch[1]);
                      }
                    }

                    const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number);
                    const currentYear = detectedYear !== -1 ? detectedYear : selYear;
                    const currentMonth = detectedMonth !== -1 ? detectedMonth : selMonth - 1; // 0-indexed

                    if (detectedMonth === -1 || detectedYear === -1) {
                      const fallbackMonthName = monthNames[currentMonth];
                      toast(`No date found in file. Using current view: ${fallbackMonthName} ${currentYear}`, { icon: '⚠️' });
                    } else {
                      const foundMonthName = monthNames[detectedMonth];
                      toast.success(`Detected File Date: ${foundMonthName} ${detectedYear}`);
                    }

                    let currentEmployee = null;

                    for (let r = dayHeaderRowIdx + 1; r < rawData.length; r++) {
                      const row = rawData[r];

                      // SEARCH FOR EMPLOYEE INFO
                      let nameFound = false;
                      for (let c = 0; c < row.length; c++) {
                        const cellVal = String(row[c] || "").trim().toLowerCase();

                        if (cellVal === 'name' || cellVal.includes('employee')) {
                          // The Name is likely in the NEXT non-empty cell
                          for (let k = c + 1; k < row.length; k++) {
                            const val = String(row[k] || "").trim();
                            if (val !== '') {
                              currentEmployee = val;
                              nameFound = true;
                              break;
                            }
                          }
                        }
                        if (nameFound) break;
                      }

                      // Fallback: If no "Name" label, but row starts with "Reg. No." or similar
                      if (!nameFound && (String(row[0] || "").toLowerCase().includes("reg") || String(row[0] || "").toLowerCase().includes("id"))) {
                        // Scan for any string that looks like an employee name (heuristic)
                        for (let c = 1; c < row.length; c++) {
                          const val = String(row[c] || "").trim();
                          if (val.length > 2 && isNaN(val)) {
                            currentEmployee = val;
                            nameFound = true;
                            break;
                          }
                        }
                      }

                      if (nameFound) {
                        // If we found a name, this is an INFO ROW.
                        // The attendance data is likely in the NEXT row (r+1), aligned with `dayColMap`.
                        // Let's peek at r+1
                        if (r + 1 < rawData.length) {
                          const attendanceRow = rawData[r + 1];

                          // Check if this row actually has attendance data? 
                          // Or is it the SAME row?
                          // Screenshot shows Reg No/Name in one row, and Data below it?
                          // "Row 2: Reg No... Row 3: 09:41..." -> YES, Next Row.

                          Object.keys(dayColMap).forEach(colIdx => {
                            const cellContent = attendanceRow[colIdx];
                            if (cellContent) {
                              const day = dayColMap[colIdx];
                              // Construct Date SAFELY for local time
                              const monthStr = (currentMonth + 1).toString().padStart(2, '0');
                              const dayStr = day.toString().padStart(2, '0');
                              const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

                              // Parse Time: "09:41 10:12" or "14:04" or "09:41\n10:12"
                              // Normalize delimiters
                              const timeStr = String(cellContent).replace(/\n/g, ' ').replace(/\r/g, '').trim();
                              const times = timeStr.split(/\s+/);

                              let checkIn = null;
                              let checkOut = null;

                              // Helper to format HH:MM to HH:MM AM/PM if needed, or keep as 24h
                              // Backend `parseTime` handles "HH:mm" (24h) or "HH:mm AM".
                              // Incoming is likely 24h "14:04".

                              if (times.length >= 1) checkIn = times[0];
                              if (times.length >= 2) checkOut = times[times.length - 1]; // Take last as out?

                              if (checkIn && checkIn !== 'N/A' && checkIn !== '??') {
                                records.push({
                                  "Employee Name": currentEmployee,
                                  "Date": dateStr,
                                  "Check In": checkIn,
                                  "Check Out": checkOut,
                                  "Source": "Biometric"
                                });
                              }
                            }
                          });

                          // Skip the attendance row in the main loop so we don't process it as an info row
                          r++;
                        }
                      }
                    }
                  }

                  if (records.length === 0) {
                    toast.error("No valid records found in file.");
                    return;
                  }

                  try {
                    setLoading(true);
                    const res = await api.post('/hr/attendance/upload', { records });
                    if (res.data.success) {
                      toast.success(`Successfully imported ${res.data.count} records`);
                      fetchData();
                    }
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Import failed");
                  } finally {
                    setLoading(false);
                  }
                  e.target.value = '';
                };
                reader.readAsArrayBuffer(file);
              }}
            />
            <button
              onClick={() => document.getElementById('csvUpload').click()}
              className="px-4 py-2 rounded-lg bg-green-600 !text-white hover:bg-green-700 flex items-center gap-2 transition text-xs whitespace-nowrap w-full md:w-auto justify-center"
            >
              <FiDownload className="rotate-180" /> Import Excel/CSV
            </button>
        </div>
        </div>

      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-2 text-theme-secondary">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] dark:[color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-theme-secondary">Filter</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] dark:[color-scheme:dark]"
          >
            <option value="all">All</option>
            <option value="Verified">Present/Verified</option>
            <option value="Absent">Absent</option>
            <option value="Pending">Pending</option>
            <option value="Leave">Leave</option>
            <option value="Short Leave">Short Leave</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Present" value={stats.present} icon={<FiCheckCircle />} color="green" />
        <StatCard label="Absent" value={stats.absent} icon={<FiXCircle />} color="red" />
        <StatCard label="Leave" value={stats.leave} icon={<FiCheckCircle />} color="orange" />
        <StatCard label="Short Leave" value={stats.shortLeave} icon={<FiCheckCircle />} color="purple" />
        <StatCard label="Late" value={activities.filter(a => a.status === 'Late').length} icon={<FiClock />} color="red" />
        <StatCard label="Pending Verify" value={stats.pending} icon={<FiClock />} color="custom-blue" />
      </div>

      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[var(--border-color)]">
              <tr>
                <th className="text-left p-4 font-semibold text-theme-primary">Employee</th>
                <th className="text-left p-4 font-semibold text-theme-primary">Biometric In</th>
                <th className="text-left p-4 font-semibold text-theme-primary">Biometric Out</th>
                <th className="text-left p-4 font-semibold text-theme-primary">Status</th>
                <th className="text-left p-4 font-semibold text-theme-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const userId = emp.userId?._id || emp.userId;
                const activity = getEmployeeActivity(userId);
                const isLocked = activity && (activity.status === 'Verified' || activity.status === 'Absent');

                if (filterStatus !== 'all') {
                  const status = activity?.status || 'Pending';
                  if (status === 'Verified' && filterStatus === 'Verified') { }
                  else if (status !== filterStatus) return null;
                }

                return (
                  <tr key={emp._id} className="border-b border-[var(--border-color)] hover:bg-theme-tertiary">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={emp.userId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=004AAE&textColor=ffffff`}
                          alt={emp.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-theme-primary">{emp.name}</p>
                          <p className="text-xs text-theme-secondary">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`p-4 text-sm font-medium ${activity?.status === 'Late' ? 'text-red-500 font-bold' : 'text-theme-primary'}`}>
                      {(activity?.status === 'Absent' || activity?.status === 'Leave' || activity?.status === 'Short Leave' || !activity?.checkIn) 
                        ? '--:--' 
                        : new Date(activity.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-sm">
                      {(activity?.status === 'Absent' || activity?.status === 'Leave' || activity?.status === 'Short Leave')
                        ? '--:--'
                        : (activity?.checkOut ? new Date(activity.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--')}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold w-fit ${!activity ? 'bg-red-50 text-red-600 border border-red-100' :
                          activity.status === 'Pending' ? 'bg-blue-100 text-blue-700' :
                            (activity.status === 'Verified' || activity.status === 'Present') ? 'bg-green-100 text-green-700' :
                              activity.status === 'Leave' ? 'bg-orange-100 text-orange-700' :
                                activity.status === 'Short Leave' ? 'bg-purple-100 text-purple-700' :
                                  activity.status === 'Late' ? 'bg-red-100 text-red-700' :
                                   'bg-red-100 text-red-700'
                          }`}>
                          {activity?.status || 'Absent (No Record)'} {activity?.isVerified ? '(Verified)' : ''}
                        </span>
                        {activity?.isVerified && activity.verifiedBy && (
                          <span className="text-[9px] text-gray-400 mt-1">By {activity.verifiedBy.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 flex gap-2 items-center">
                      <button
                        onClick={() => setReportModal({
                          show: true,
                          employee: emp,
                          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                          endDate: new Date().toISOString().split('T')[0],
                          data: []
                        })}
                        className="px-3 py-1 bg-[#004AAE] text-white rounded text-xs font-bold hover:bg-[#003882] transition"
                      >
                        Monthly Report
                      </button>

                      {!editingMarked.has(userId) ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMarked(prev => new Set(prev).add(userId));
                            }}
                            className="px-3 py-1 bg-blue-100 text-[#004AAE] rounded text-xs font-bold hover:bg-[#004AAE] hover:text-white transition"
                            title="Correct or Change Status"
                          >
                            Edit
                          </button>

                          {!isLocked && (
                            <>
                              <button
                                onClick={() => handleVerifyAttendance(userId, 'Leave')}
                                className="px-3 py-1 bg-orange-100 text-orange-600 rounded text-xs font-bold hover:bg-orange-600 hover:text-white transition"
                                title="Approve Leave Request"
                              >
                                Approve Leave
                              </button>
                              <button
                                onClick={() => handleVerifyAttendance(userId, 'Short Leave')}
                                className="px-3 py-1 bg-purple-100 text-purple-600 rounded text-xs font-bold hover:bg-purple-600 hover:text-white transition"
                                title="Approve Short Leave"
                              >
                                Short Leave
                              </button>
                              <button
                                onClick={() => handleVerifyAttendance(userId, 'Late')}
                                className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-600 hover:text-white transition"
                                title="Mark as Late"
                              >
                                Mark Late
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button 
                            onClick={() => {
                              handleVerifyAttendance(userId, 'Present');
                              setEditingMarked(prev => { const s = new Set(prev); s.delete(userId); return s; });
                            }}
                            className="px-2 py-1 bg-green-600 text-[9px] font-black text-white rounded hover:bg-green-700 uppercase"
                          >
                            Present
                          </button>
                          <button 
                            onClick={() => {
                              handleVerifyAttendance(userId, 'Late');
                              setEditingMarked(prev => { const s = new Set(prev); s.delete(userId); return s; });
                            }}
                            className="px-2 py-1 bg-yellow-600 text-[9px] font-black text-white rounded hover:bg-yellow-700 uppercase"
                          >
                            Late
                          </button>
                          <button 
                            onClick={() => {
                              handleVerifyAttendance(userId, 'Short Leave');
                              setEditingMarked(prev => { const s = new Set(prev); s.delete(userId); return s; });
                            }}
                            className="px-2 py-1 bg-purple-600 text-[9px] font-black text-white rounded hover:bg-purple-700 uppercase"
                          >
                            Short
                          </button>
                          <button 
                            onClick={() => {
                              handleVerifyAttendance(userId, 'Absent');
                              setEditingMarked(prev => { const s = new Set(prev); s.delete(userId); return s; });
                            }}
                            className="px-2 py-1 bg-red-600 text-[9px] font-black text-white rounded hover:bg-red-700 uppercase"
                          >
                            Absent
                          </button>
                          <button 
                            onClick={() => setEditingMarked(prev => {
                              const ns = new Set(prev);
                              ns.delete(userId);
                              return ns;
                            })}
                            className="px-2 py-1 bg-gray-600 text-[9px] font-black text-white rounded hover:bg-gray-700 uppercase"
                          >
                            X
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* ATTENDANCE REPORT MODAL */}
      <AnimatePresence>
        {reportModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setReportModal({ ...reportModal, show: false })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button
                onClick={() => setReportModal({ ...reportModal, show: false })}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <FiXCircle size={24} />
              </button>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-theme-primary font-outfit">Detailed Attendance Report</h3>
                  <p className="text-sm text-theme-secondary">{reportModal.employee?.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                        const presentDays = reportModal.data.filter(a => a.status === 'Verified' || a.status === 'Present' || a.status === 'Late').length;
                        const lateDays = reportModal.data.filter(a => a.status === 'Late').length;
                        const reportsSubmitted = reportModal.data.filter(a => a.dailyReport && a.dailyReport !== 'No report submitted').length;
                        
                        const start = new Date(reportModal.startDate);
                        const end = new Date(reportModal.endDate);
                        const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
                        
                        // Account for Join Date in Working Days
                        let startDayForCalc = 1;
                        if (reportModal.employee?.joinDate) {
                          const joinD = new Date(reportModal.employee.joinDate);
                          if (joinD.getFullYear() === start.getFullYear() && joinD.getMonth() === start.getMonth()) {
                            startDayForCalc = joinD.getDate();
                          } else if (joinD.getFullYear() > start.getFullYear() || (joinD.getFullYear() === start.getFullYear() && joinD.getMonth() > start.getMonth())) {
                            startDayForCalc = lastDay + 1; // Joined in future
                          }
                        }

                        const totalCWD = (() => {
                          if (!workingDays) return (lastDay - startDayForCalc + 1);
                          const sundaysOff = workingDays.sunday === false;
                          const nonWorkingDates = workingDays.nonWorkingDates || [];
                          let wd = 0;
                          for (let d = startDayForCalc; d <= lastDay; d++) {
                            const date = new Date(start.getFullYear(), start.getMonth(), d);
                            const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const isSunday = date.getDay() === 0;
                            const isOff = nonWorkingDates.includes(dateStr);
                            const isWorkday = (dateStr === '2026-06-28') || (isSunday ? (!sundaysOff && !isOff) : !isOff);
                            if (isWorkday) wd++;
                          }
                          return wd;
                        })();
                        const empWD = reportModal.data.filter(a => (a.checkIn && a.checkIn !== '--:--') || (a.dailyReport && a.dailyReport !== 'No report submitted') || ['Leave', 'Short Leave'].includes(a.status)).length;

                        const attendanceScore = totalCWD > 0 ? Math.min((presentDays / totalCWD) * 40, 40) : 0;
                        const punctualityScore = presentDays > 0 ? Math.min(((presentDays - lateDays) / presentDays) * 30, 30) : 0;
                        const reportScore = totalCWD > 0 ? Math.min((reportsSubmitted / totalCWD) * 30, 30) : 0;
                        const totalScore = attendanceScore + punctualityScore + reportScore;

                        const csvData = reportModal.data.map(a => ({
                            Date: new Date(a.date).toLocaleDateString(),
                            'Daily Report': a.dailyReport || 'No report submitted'
                        }));

                        csvData.push({});
                        csvData.push({ Date: 'Total Company Working Days', 'Daily Report': totalCWD });
                        csvData.push({ Date: 'Employee Working Days', 'Daily Report': empWD });
                        csvData.push({ Date: 'FINAL SCORE (%)', 'Daily Report': `${totalScore.toFixed(1)}%` });

                        const ws = XLSX.utils.json_to_sheet(csvData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Daily Reports");
                        XLSX.writeFile(wb, `${reportModal.employee?.name}-daily-reports.xlsx`);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition"
                  >
                    <FiFileText /> Export Reports
                  </button>
                  <button
                    onClick={() => {
                      const presentDays = reportModal.data.filter(a => a.status === 'Verified' || a.status === 'Present' || a.status === 'Late').length;
                      const lateDays = reportModal.data.filter(a => a.status === 'Late').length;
                      const reportsSubmitted = reportModal.data.filter(a => a.dailyReport && a.dailyReport !== 'No report submitted').length;
                      
                      const start = new Date(reportModal.startDate);
                      const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
                      const totalCWD = (() => {
                        if (!workingDays) return lastDay;
                        const sundaysOff = workingDays.sunday === false;
                        const nonWorkingDates = workingDays.nonWorkingDates || [];
                        let wd = 0;
                        for (let d = 1; d <= lastDay; d++) {
                          const date = new Date(start.getFullYear(), start.getMonth(), d);
                          const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isSunday = date.getDay() === 0;
                          const isOff = nonWorkingDates.includes(dateStr);
                          const isWorkday = (dateStr === '2026-06-28') || (isSunday ? (!sundaysOff && !isOff) : !isOff);
                          if (isWorkday) wd++;
                        }
                        return wd;
                      })();
                      const empWD = reportModal.data.filter(a => (a.checkIn && a.checkIn !== '--:--') || (a.dailyReport && a.dailyReport !== 'No report submitted') || ['Leave', 'Short Leave'].includes(a.status)).length;

                      const csvData = reportModal.data.map(a => ({
                        Date: new Date(a.date).toLocaleDateString(),
                        Status: a.status,
                        'Check In': a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '--',
                        'Check Out': a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '--',
                        'Daily Report': a.dailyReport || '--'
                      }));

                      csvData.push({});
                      csvData.push({ Date: 'Total Company Working Days', Status: totalCWD });
                      csvData.push({ Date: 'Employee Working Days', Status: empWD });

                      const ws = XLSX.utils.json_to_sheet(csvData);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
                      XLSX.writeFile(wb, `${reportModal.employee?.name}-attendance.xlsx`);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition"
                  >
                    <FiDownload /> Export XLSX
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-bold hover:bg-gray-700 transition"
                  >
                    Print Report
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-theme-secondary mb-1 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={reportModal.startDate}
                    onChange={(e) => setReportModal({ ...reportModal, startDate: e.target.value })}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-[#004AAE]/20"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-theme-secondary mb-1 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={reportModal.endDate}
                    onChange={(e) => setReportModal({ ...reportModal, endDate: e.target.value })}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-[#004AAE]/20"
                  />
                </div>
                <button
                  onClick={handleFetchReport}
                  className="mt-auto px-8 py-2 bg-[#004AAE] text-white rounded-lg text-sm font-bold hover:bg-[#003882] transition shadow-md"
                >
                  Generate Report
                </button>
              </div>

              {/* ATTENDANCE STAT CARDS */}
              {(() => {
                const sDate = reportModal.startDate ? new Date(reportModal.startDate) : new Date();
                const eDate = reportModal.endDate ? new Date(reportModal.endDate) : new Date();
                
                let totalCWD = 0;
                const nonWorkingDates = workingDays?.nonWorkingDates || [];
                const sundaysOff = workingDays?.sunday === false;

                let cur = new Date(sDate);
                cur.setHours(0,0,0,0);
                const endLimit = new Date(eDate);
                endLimit.setHours(23,59,59,999);

                if (reportModal.employee?.joinDate) {
                  const joinD = new Date(reportModal.employee.joinDate);
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

                const presentDays = reportModal.data.filter(a => ['Verified', 'Present', 'Late'].includes(a.status) || (a.checkIn && a.checkIn !== '--:--')).length;
                const leaveDays = reportModal.data.filter(a => ['Leave', 'Short Leave'].includes(a.status)).length;
                const empWD = presentDays;
                
                const explicitAbsent = reportModal.data.filter(a => a.status === 'Absent' || a.status === 'Report not submitted').length;
                const calculatedAbsent = Math.max(0, totalCWD - presentDays - leaveDays);
                const absentDays = explicitAbsent > 0 ? Math.max(explicitAbsent, calculatedAbsent) : calculatedAbsent;

                return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Total Working Days</p>
                      <p className="text-2xl font-bold text-indigo-400">{totalCWD}</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Employee Working Days</p>
                      <p className="text-2xl font-bold text-blue-400">{empWD}</p>
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

              {/* PERFORMANCE SCORING SUMMARY */}
              <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <h4 className="text-sm font-bold uppercase tracking-widest text-amber-600 mb-4 flex items-center gap-2">
                  Performance Scoring (Based on Range)
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                      const presentDays = reportModal.data.filter(a => a.status === 'Verified' || a.status === 'Present' || a.status === 'Late').length;
                      const lateDays = reportModal.data.filter(a => a.status === 'Late').length;
                      const reportsSubmitted = reportModal.data.filter(a => a.dailyReport && a.dailyReport !== 'No report submitted').length;
                      
                      const start = new Date(reportModal.startDate);
                      const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
                      
                      let startDayForCalc = 1;
                      if (reportModal.employee?.joinDate) {
                        const joinD = new Date(reportModal.employee.joinDate);
                        if (joinD.getFullYear() === start.getFullYear() && joinD.getMonth() === start.getMonth()) {
                          startDayForCalc = joinD.getDate();
                        } else if (joinD.getFullYear() > start.getFullYear() || (joinD.getFullYear() === start.getFullYear() && joinD.getMonth() > start.getMonth())) {
                          startDayForCalc = lastDay + 1;
                        }
                      }

                      const totalCWD = (() => {
                        if (!workingDays) return (lastDay - startDayForCalc + 1);
                        const sundaysOff = workingDays.sunday === false;
                        const nonWorkingDates = workingDays.nonWorkingDates || [];
                        let wd = 0;
                        for (let d = startDayForCalc; d <= lastDay; d++) {
                          const date = new Date(start.getFullYear(), start.getMonth(), d);
                          const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isSunday = date.getDay() === 0;
                          const isOff = nonWorkingDates.includes(dateStr);
                          const isWorkday = (dateStr === '2026-06-28') || (isSunday ? (!sundaysOff && !isOff) : !isOff);
                          if (isWorkday) wd++;
                        }
                        return wd;
                      })();
                      const boundaryDate = new Date();
                      const isCurrentMonth = start.getFullYear() === boundaryDate.getFullYear() && start.getMonth() === boundaryDate.getMonth();
                      const dayToCompare = isCurrentMonth ? boundaryDate.getDate() : lastDay;
                      
                      const wdTillNow = (() => {
                        if (!workingDays) return (dayToCompare - startDayForCalc + 1);
                        const sundaysOff = workingDays.sunday === false;
                        const nonWorkingDates = workingDays.nonWorkingDates || [];
                        let wd = 0;
                        for (let d = startDayForCalc; d <= dayToCompare; d++) {
                          const date = new Date(start.getFullYear(), start.getMonth(), d);
                          const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isSunday = date.getDay() === 0;
                          const isOff = nonWorkingDates.includes(dateStr);
                          const isWorkday = (dateStr === '2026-06-28') || (isSunday ? (!sundaysOff && !isOff) : !isOff);
                          if (isWorkday) wd++;
                        }
                        return wd;
                      })();

                      const attendanceScore = wdTillNow > 0 ? Math.min((presentDays / wdTillNow) * 40, 40) : 0;
                      const punctualityScore = presentDays > 0 ? Math.min(((presentDays - lateDays) / presentDays) * 30, 30) : 0;
                      const reportScore = wdTillNow > 0 ? Math.min((reportsSubmitted / wdTillNow) * 30, 30) : 0;
                      const totalScore = attendanceScore + punctualityScore + reportScore;

                      return (
                        <>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-amber-700/60 uppercase tracking-wider">Attendance</span>
                            <span className="text-xl font-black text-amber-500">{attendanceScore.toFixed(1)}<span className="text-xs opacity-50">/40</span></span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-amber-700/60 uppercase tracking-wider">Punctuality</span>
                            <span className="text-xl font-black text-amber-500">{punctualityScore.toFixed(1)}<span className="text-xs opacity-50">/30</span></span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-amber-700/60 uppercase tracking-wider">Reports</span>
                            <span className="text-xl font-black text-amber-500">{reportScore.toFixed(1)}<span className="text-xs opacity-50">/30</span></span>
                          </div>
                          <div className="flex flex-col p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Performance Score</span>
                            <span className="text-2xl font-black text-amber-600">{totalScore.toFixed(1)}%</span>
                          </div>
                        </>
                      );
                  })()}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border-color)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-main)]">
                    <tr className="text-left border-b border-[var(--border-color)]">
                      <th className="p-4 font-bold text-theme-primary">Date</th>
                      <th className="p-4 font-bold text-theme-primary">In Time</th>
                      <th className="p-4 font-bold text-theme-primary">Out Time</th>
                      <th className="p-4 font-bold text-theme-primary">Status</th>
                      <th className="p-4 font-bold text-theme-primary">Daily Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportModal.data.map((a, i) => (
                      <tr key={i} className="border-b border-[var(--border-color)] hover:bg-white/5">
                        <td className="p-4 text-theme-primary">{new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td className="p-4 text-theme-primary">
                          {['Absent', 'Leave', 'Short Leave'].includes(a.status) || !a.checkIn
                            ? (a.status || '--:--')
                            : new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 text-theme-primary">
                          {['Absent', 'Leave', 'Short Leave'].includes(a.status)
                            ? a.status
                            : (a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'Verified' || a.status === 'Present' ? 'bg-green-100 text-green-700' :
                            a.status === 'Late' ? 'bg-red-600 text-white' :
                            a.status === 'Leave' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-xs max-w-xs truncate text-theme-secondary" title={a.dailyReport}>
                            {a.dailyReport || '--'}
                          </p>
                        </td>
                      </tr>
                    ))}
                    {reportModal.data.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-theme-secondary italic">No records found for this period. Click 'Generate' to load data.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WORKING DAYS CONFIG MODAL */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowConfigModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-2xl w-full max-w-md shadow-2xl relative"
            >
              <h2 className="text-2xl font-bold text-theme-primary mb-2">Company Calendar</h2>
              <p className="text-sm text-theme-secondary mb-6">Select the standard working days and mark specific non-working dates. This affects performance scoring calculations.</p>

              <div className="mb-6 bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setCalMonth(m => { if(m===0) { setCalYear(y=>y-1); return 11; } return m-1; })} className="p-2 hover:bg-white/10 rounded-lg text-theme-primary transition">&lt;</button>
                  <h3 className="text-lg font-bold text-theme-primary">{new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                  <button onClick={() => setCalMonth(m => { if(m===11) { setCalYear(y=>y+1); return 0; } return m+1; })} className="p-2 hover:bg-white/10 rounded-lg text-theme-primary transition">&gt;</button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-theme-secondary uppercase">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2">{day}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2 text-sm">
                  {generateCalendarDays().map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} className="p-2"></div>;
                    
                    const dateStr = date.toISOString().split('T')[0];
                    const dayOfWeek = date.getDay();
                    const isSunday = dayOfWeek === 0;
                    const isExplicitlyOff = workingDays.nonWorkingDates?.includes(dateStr);
                    const isWorkingDay = isSunday ? (workingDays.sunday && !isExplicitlyOff) : !isExplicitlyOff;

                    return (
                      <div 
                        key={dateStr}
                        onClick={() => toggleSpecificDate(dateStr)}
                        className={`flex items-center justify-center h-10 w-10 mx-auto rounded-full cursor-pointer transition-all border font-bold shadow-sm hover:scale-105 active:scale-95 ${
                          isWorkingDay 
                            ? 'bg-blue-100/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white' 
                            : 'bg-red-500 text-white border-red-500 shadow-red-500/30'
                        }`}
                        title={isWorkingDay ? 'Working Day (Click to mark as off)' : 'Non-Working Day (Click to mark as workday)'}
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--border-color)] text-theme-secondary font-bold hover:bg-[var(--bg-main)] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.post('/hr/config', {
                        key: 'working_days',
                        value: workingDays,
                        description: 'Company standard working days'
                      });
                      if (res.data.success) {
                        toast.success("Calendar updated successfully!");
                        setShowConfigModal(false);
                      }
                    } catch (err) {
                      toast.error("Failed to update calendar");
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-br from-[#004AAE] to-blue-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition transform hover:-translate-y-1"
                >
                  Save Calendar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function StatCard({ label, value, icon, color }) {
  const colorStyles = {
    green: { border: "border-green-200", bg: "bg-green-50", text: "text-green-600" },
    red: { border: "border-red-200", bg: "bg-red-50", text: "text-red-600" },
    orange: { border: "border-yellow-200", bg: "bg-yellow-50", text: "text-yellow-600" },
    "custom-blue": { border: "border-blue-200", bg: "bg-blue-50", text: "text-[#004AAE]" },
  };
  const style = colorStyles[color] || colorStyles.green;
  return (
    <div className={`p-5 rounded-2xl border ${style.border} bg-[var(--bg-card)] shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${style.text}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${style.bg} ${style.text} text-2xl`}>{icon}</div>
      </div>
    </div>
  );
}
