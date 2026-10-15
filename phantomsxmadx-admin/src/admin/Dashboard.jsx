import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUsers, FiFolder, FiCheckCircle, FiBarChart2, FiAward, 
  FiCalendar, FiTrendingUp, FiActivity, FiXCircle, FiPlus, 
  FiChevronRight, FiGrid, FiArrowUpRight, FiZap, FiChevronDown, FiAlertCircle, FiClock,
  FiSearch, FiX, FiFileText, FiMail, FiVideo, FiCheck, FiRefreshCw
} from "react-icons/fi";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from "recharts";
import LoadingSpinner from "../components/LoadingSpinner";
import AnnouncementModal from "../components/AnnouncementModal";
import WorldClock from "../components/WorldClock";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const cleanName = (name) => {
    if (!name) return "";
    return String(name).replace(/\s*\(.*?\)\s*/g, '').trim();
};

const CrownIcon = ({ type }) => {
  if (type === 'gold' || type === '6month') {
    return (
      <span title="Golden Crown - Employee of 6 Months (+10% Extra Bonus Points)" className="inline-flex items-center shrink-0">
        <svg className="w-4.5 h-4.5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.95)] animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
        </svg>
      </span>
    );
  }
  if (type === 'silver' || type === 'month') {
    return (
      <span title="Silver Crown - Employee of the Month (+5% Extra Bonus Points)" className="inline-flex items-center shrink-0">
        <svg className="w-4.5 h-4.5 text-slate-200 drop-shadow-[0_0_8px_rgba(226,232,240,0.95)] animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
        </svg>
      </span>
    );
  }
  return null;
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const formatLastActive = (act, isOnline) => {
  if (isOnline) return "Active Now";
  const lastTime = act?.lastHeartbeat || act?.checkOut || act?.updatedAt || act?.createdAt;
  if (!lastTime) return "Offline";
  
  const d = new Date(lastTime);
  if (isNaN(d.getTime())) return "Offline";
  
  // Exact clock time (e.g., "11:45 AM")
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

export default function Dashboard() {
  const [activeView, setActiveView] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLight, setIsLight] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secondaryLoading, setSecondaryLoading] = useState(true);
  const [isListExpanded, setIsListExpanded] = useState(true);
  
  // Calendar States
  const [showCalendar, setShowCalendar] = useState(false);
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

  const [holidayModal, setHolidayModal] = useState({ show: false, date: null, reason: "" });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  const navigate = useNavigate();

  const [achievements, setAchievements] = useState([]);
  const [realScores, setRealScores] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    totalDays: 26, passedDays: 0, present: 0, absent: 0, leaves: 0
  });
  const [lastMonthScores, setLastMonthScores] = useState([]);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [showAllInTable, setShowAllInTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getDate() < 5 ? (now.getMonth() === 0 ? 11 : now.getMonth() - 1) : now.getMonth();
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return (now.getDate() < 5 && now.getMonth() === 0) ? now.getFullYear() - 1 : now.getFullYear();
  });
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dailyActivities, setDailyActivities] = useState([]);
  const [pakistanTime, setPakistanTime] = useState("");
  const [googleConnected, setGoogleConnected] = useState(() => {
    try {
      return localStorage.getItem("googleCalendarConnected") === "true" || sessionStorage.getItem("googleCalendarConnected") === "true";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const fetchGoogleStatus = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
        const role = (user.role || "").toLowerCase();
        const endpoint = role === 'admin' ? '/profile/admin' : `/profile/${role.replace('_', '-')}`;
        const res = await api.get(endpoint);
        const profileData = res.data?.profile || res.data?.data || res.data;
        if (profileData && profileData.googleConnected !== undefined) {
          const isConnected = !!(profileData.googleConnected);
          setGoogleConnected(isConnected);
          localStorage.setItem("googleCalendarConnected", isConnected ? "true" : "false");
          sessionStorage.setItem("googleCalendarConnected", isConnected ? "true" : "false");
        }
      } catch (e) {
        // Fallback to /profile
        try {
          const res2 = await api.get('/profile');
          const profileData2 = res2.data?.profile || res2.data?.data || res2.data;
          if (profileData2 && profileData2.googleConnected !== undefined) {
            const isConnected2 = !!(profileData2.googleConnected);
            setGoogleConnected(isConnected2);
            localStorage.setItem("googleCalendarConnected", isConnected2 ? "true" : "false");
            sessionStorage.setItem("googleCalendarConnected", isConnected2 ? "true" : "false");
          }
        } catch (err) {}
      }
    };
    fetchGoogleStatus();

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'GOOGLE_CONNECTED') {
        setGoogleConnected(true);
        localStorage.setItem("googleCalendarConnected", "true");
        sessionStorage.setItem("googleCalendarConnected", "true");
        fetchGoogleStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  const connectGoogleCalendar = () => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || localStorage.getItem("currentUser") || "{}");
    const uid = currentUser._id || currentUser.id || currentUser.userId;
    const clientId = "691160602273-rsdmq79hcuq8adntb2g9oenhsgeju1ph.apps.googleusercontent.com";
    const redirectUri = "https://www.hattech.online/google/callback";
    const scopes = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=${encodeURIComponent(scopes)}&prompt=consent&include_granted_scopes=true&state=${uid}&response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    window.open(googleAuthUrl, '_blank', 'width=550,height=650');
  };

  const syncGoogleCalendar = async () => {
    setIsSyncingCalendar(true);
    try {
      const [intRes, gcalRes] = await Promise.allSettled([
        api.get('/interactions'),
        api.get('/google-events')
      ]);
      const dbInteractions = intRes.status === 'fulfilled' ? (intRes.value.data?.data || []) : [];
      const gcalEvents = gcalRes.status === 'fulfilled' ? (gcalRes.value.data?.events || []) : [];
      const isConn = gcalRes.status === 'fulfilled' ? !!gcalRes.value.data?.connected : false;
      
      setGoogleConnected(isConn);
      setUpcomingInteractions([...gcalEvents, ...dbInteractions]);
      
      if (gcalEvents.length > 0) {
        toast.success(`Synced ${gcalEvents.length} Google Calendar event(s)!`);
      } else if (isConn) {
        toast.success("Calendar connected! No upcoming events found for today/tomorrow.");
      } else {
        toast("Google Calendar not connected. Click Connect to authorize.", { icon: "ℹ️" });
      }
    } catch (err) {
      toast.error("Failed to sync calendar");
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Berlin',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const dateStr = now.toLocaleDateString('en-GB', {
        timeZone: 'Europe/Berlin',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      setPakistanTime(`${dateStr} • ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDailyActivities = async () => {
      try {
        const res = await api.get(`/activities?date=${selectedDate}`);
        if (res.data.success) {
          setDailyActivities(res.data.activities || []);
        }
      } catch (error) {
        console.error("Failed to fetch daily activities", error);
      }
    };
    if (hasMounted) {
      fetchDailyActivities();
    }
  }, [selectedDate, hasMounted]);

  const getPanelActiveTime = (employeeId) => {
    const empObj = employees.find(e => String(e._id || e.id) === String(employeeId));
    if (!empObj) return "--";
    const uId = empObj.userId?._id || empObj.userId;
    if (!uId) return "--";
    
    const act = dailyActivities.find(a => String(a.userId?._id || a.userId) === String(uId));
    if (!act || act.duration === null || act.duration === undefined) return "--";
    
    const totalMinutes = act.duration;
    if (totalMinutes === 0) return "0 mins";
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins} mins`;
  };

  const displayMonth = months[selectedMonth]?.toUpperCase() || "";

  const leaderboardScores = useMemo(() => {
    if (!realScores) return [];
    
    // Unified: Show both employees and interns together
    const filtered = realScores.filter(item => {
      const emp = employees.find(e => String(e._id || e.id) === String(item.id));
      if (!emp) return false;
      if (emp.status === 'inactive') return false;
      const role = String(emp.role || emp.position || '').toLowerCase();
      const isExcluded = role === 'admin' || role === 'hr' || role === 'hr_hattech' || role === 'it_support';
      return !isExcluded;
    });

    // 2. Recalculate rank for the filtered group
    let currentRank = 1;
    filtered.forEach((item, index) => {
      if (index > 0) {
        const prev = filtered[index - 1];
        if (
          item.score !== prev.score ||
          item.stats.present !== prev.stats.present ||
          item.stats.onTime !== prev.stats.onTime ||
          item.stats.reports !== prev.stats.reports
        ) {
          currentRank = index + 1;
        }
      }
      item.rank = currentRank;
    });

    return filtered;
  }, [realScores, employees]);

  const displayScores = leaderboardScores.slice(0, 3);

  const [clients, setClients] = useState([]);

  const [reports, setReports] = useState([]);
  const [upcomingInteractions, setUpcomingInteractions] = useState([]);

  const { user: authUser } = useAuth();
  const currentUser = useMemo(() => {
    if (authUser) return authUser;
    try {
      return JSON.parse(sessionStorage.getItem("currentUser") || "null");
    } catch (e) {
      return null;
    }
  }, [authUser]);

  const isHatTechAdmin = useMemo(() => {
    if (!currentUser) return false;
    const email = (currentUser.email || '').toLowerCase().trim();
    const username = (currentUser.username || '').toLowerCase().trim();
    return email.includes('hattechmedia') || username.includes('hattechmedia') || currentUser.role === 'super_admin' || email === 'hattechmedia@gmail.com';
  }, [currentUser]);

  const latestReportsByUserId = useMemo(() => {
    const map = {};
    if (!reports || !Array.isArray(reports)) return map;
    reports.forEach(r => {
      const uId = String(r.userId?._id || r.userId || '');
      if (!uId) return;
      if (!map[uId] || new Date(r.date || r.createdAt) > new Date(map[uId].date || map[uId].createdAt)) {
        map[uId] = r;
      }
    });
    return map;
  }, [reports]);

  const upcomingMeetingsList = useMemo(() => {
    if (!upcomingInteractions || !Array.isArray(upcomingInteractions)) return [];
    return upcomingInteractions
      .filter(item => {
        const typeStr = (item.interactionType || item.type || '').toLowerCase();
        return typeStr === 'meeting' || item.nextMeetingDate || !item.type;
      })
      .map(item => {
        const meetDate = item.nextMeetingDate || item.date || item.createdAt;
        let formattedTime = item.time || "";
        if (!formattedTime && item.nextMeetingDate) {
          try {
            formattedTime = new Date(item.nextMeetingDate).toLocaleTimeString('en-GB', {
              timeZone: 'Europe/Berlin',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }) + ' (CET)';
          } catch (e) {
            formattedTime = "Scheduled";
          }
        }
        return {
          ...item,
          effectiveDate: meetDate ? new Date(meetDate) : null,
          formattedTime: formattedTime || "Scheduled"
        };
      })
      .sort((a, b) => {
        const timeA = a.effectiveDate ? a.effectiveDate.getTime() : 0;
        const timeB = b.effectiveDate ? b.effectiveDate.getTime() : 0;
        const now = Date.now();
        const isFutureA = timeA >= now;
        const isFutureB = timeB >= now;

        if (isFutureA && isFutureB) return timeA - timeB;
        if (isFutureA && !isFutureB) return -1;
        if (!isFutureA && isFutureB) return 1;
        return timeB - timeA;
      });
  }, [upcomingInteractions]);

  useEffect(() => {
    setHasMounted(true);
    const fetchCoreData = async () => {
      try {
        setLoading(true);
        const [empRes, projRes, taskRes, clientRes, repRes, intRes, gcalRes] = await Promise.allSettled([
          api.get('/employees'),
          api.get('/projects'),
          api.get('/tasks'),
          api.get('/clients'),
          api.get('/reports'),
          api.get('/interactions'),
          api.get('/google-events')
        ]);
        const emps = empRes.status === 'fulfilled' ? (empRes.value.data?.employees || empRes.value.data?.data || []) : [];
        setEmployees(emps);
        setProjects(projRes.status === 'fulfilled' ? (projRes.value.data?.data || []) : []);
        setTasks(taskRes.status === 'fulfilled' ? (taskRes.value.data?.tasks || taskRes.value.data?.data || []) : []);
        setClients(clientRes.status === 'fulfilled' ? (clientRes.value.data?.data || clientRes.value.data?.clients || []) : []);
        setReports(repRes.status === 'fulfilled' ? (repRes.value.data?.reports || repRes.value.data?.data || []) : []);
        
        const dbInteractions = intRes.status === 'fulfilled' ? (intRes.value.data?.data || intRes.value.data?.interactions || (Array.isArray(intRes.value.data) ? intRes.value.data : [])) : [];
        const gcalEvents = gcalRes.status === 'fulfilled' ? (gcalRes.value.data?.events || []) : [];
        setUpcomingInteractions([...gcalEvents, ...dbInteractions]);
        setLoading(false);
        fetchAnalytics(emps);
      } catch (error) {
        console.error("Dashboard core fetch error", error);
        setLoading(false);
      }
    };

    const fetchAnalytics = async (emps) => {
      try {
        setSecondaryLoading(true);

        const results = await Promise.allSettled([
          api.get('/hr/config/working_days'),
          api.get('/achievements')
        ]);

        const configRes = results[0].status === 'fulfilled' ? results[0].value : { data: {} };
        const achRes = results[1].status === 'fulfilled' ? results[1].value : { data: { data: [] } };

        const achievementsData = Array.isArray(achRes.data?.data) ? achRes.data.data : (Array.isArray(achRes.data) ? achRes.data : []);
        setAchievements(achievementsData);
        
        const activeWorkingDays = configRes.data?.data?.value;
        if (configRes.data?.success && activeWorkingDays) {
          setWorkingDays({
            sunday: false,
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            nonWorkingDates: [],
            holidayDescriptions: {},
            ...activeWorkingDays
          });
        }

        fetchOfficialScores(emps, selectedMonth, selectedYear);

        setSecondaryLoading(false);
      } catch (err) {
        console.error("Dashboard background fetch error", err);
        setSecondaryLoading(false);
      }
    };

    fetchCoreData();
    const checkTheme = () => setIsLight(document.body.classList.contains('light'));
    checkTheme();
    window.addEventListener('theme-change', checkTheme);
    return () => window.removeEventListener('theme-change', checkTheme);
  }, []);

  // Update global stats whenever realScores changes
  useEffect(() => {
    if (realScores && realScores.length > 0) {
      const totalPresent = realScores.reduce((acc, curr) => acc + (curr.stats?.present || 0), 0);
      const totalPossible = realScores.reduce((acc, curr) => acc + (curr.stats?.passed || 0), 0);
      
      setGlobalStats({
        totalDays: realScores[0]?.stats?.passed || 0,
        passedDays: realScores[0]?.stats?.passed || 0,
        present: totalPresent,
        absent: Math.max(0, totalPossible - totalPresent),
        leaves: realScores.length > 5 ? 2 : 0 // Placeholder or can be refined
      });
    }
  }, [realScores]);

  const fetchOfficialScores = async (emps, month, year) => {
    try {
      const mStr = String(month + 1).padStart(2, '0');
      const monthQuery = `${year}-${mStr}`;

      const scoreRes = await api.get(`/hr/reports/scoring?month=${monthQuery}`);
      if (scoreRes.data.success) {
        const formatted = scoreRes.data.data
          .filter(item => {
            const scoreEmployeeId = item.employeeId || item.id;
            const targetEmp = emps.find(e => String(e._id || e.id) === String(scoreEmployeeId));
            return (targetEmp?.status || 'active').toLowerCase() === 'active';
          })
          .map(item => {
            const scoreEmployeeId = item.employeeId || item.id;
            const targetEmp = emps.find(e => String(e._id || e.id) === String(scoreEmployeeId));
            
            return {
              id: scoreEmployeeId || Math.random().toString(),
              name: item.name,
              department: item.department,
              score: Math.min(100, Math.max(0, Math.round(item.scores?.total || 0))),
              avatar: item.avatar || targetEmp?.image || targetEmp?.profileImage || targetEmp?.userId?.avatar || null,
              isEmployeeOfTheMonth: item.isEmployeeOfTheMonth,
              isEmployeeOf6Months: item.isEmployeeOf6Months,
              bonusPercentage: item.bonusPercentage || 0,
              scoresDetail: item.scores,
              stats: {
                present: item.presentDays,
                passed: item.totalWorkingDays,
                onTime: item.presentDays - item.lateDays,
                reports: item.reportsSubmitted,
                milestones: item.scores?.milestones || 25
              }
            };
          });
        const sorted = formatted.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          
          // Priority names sorting for tied scores
          const priorityNames = ["ali musa", "muhammad salman", "muhammad huzaifa"];
          const getPriority = (name) => {
            const lowerName = name.toLowerCase().trim();
            const index = priorityNames.indexOf(lowerName);
            return index === -1 ? priorityNames.length : index;
          };

          const pA = getPriority(a.name);
          const pB = getPriority(b.name);
          if (pA !== pB) return pA - pB;

          if (b.stats.present !== a.stats.present) return b.stats.present - a.stats.present;
          if (b.stats.onTime !== a.stats.onTime) return b.stats.onTime - a.stats.onTime;
          if (b.stats.reports !== a.stats.reports) return b.stats.reports - a.stats.reports;
          return a.name.localeCompare(b.name);
        });

        let currentRank = 1;
        sorted.forEach((item, index) => {
          if (index > 0) {
            const prev = sorted[index - 1];
            if (
              item.score !== prev.score ||
              item.stats.present !== prev.stats.present ||
              item.stats.onTime !== prev.stats.onTime ||
              item.stats.reports !== prev.stats.reports
            ) {
              currentRank = index + 1;
            }
          }
          item.rank = currentRank;
        });

        // SOURCE OF TRUTH FIX: 
        // Only update realScores if this fetch matches the CURRENTLY selected filter
        if (month === selectedMonth && year === selectedYear) {
          setRealScores(sorted);
        }
        
        // Also update lastMonthScores for the fallback/comparison logic if it's indeed last month
        const now = new Date();
        const curM = now.getMonth();
        const lastM = curM === 0 ? 11 : curM - 1;
        const lastMY = curM === 0 ? now.getFullYear() - 1 : now.getFullYear();

        if (month === lastM && year === lastMY) {
          setLastMonthScores(sorted);
        }
      }
    } catch (error) {
      console.error("Failed to fetch official scores", error);
    }
  };

  // On mount, if we are in the current month, we also want to fetch last month's scores for the fallback card
  useEffect(() => {
    if (employees.length > 0 && hasMounted) {
      const fetchInitialScores = async () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Fetch current month if selected is current, otherwise fetch selected.
        // Also fetch last month for comparison/fallback.
        const promises = [fetchOfficialScores(employees, selectedMonth, selectedYear)];
        
        if (selectedMonth === currentMonth && selectedYear === currentYear) {
           promises.push(fetchOfficialScores(employees, lastMonth, lastMonthYear));
        }

        await Promise.all(promises);
      };
      
      fetchInitialScores();
    }
  }, [employees, selectedMonth, selectedYear, hasMounted]);

  const filteredEmployeesList = employees.filter(emp => {
    const role = (emp.role || emp.userId?.role || "").toLowerCase();
    const dept = (emp.department || "").toLowerCase();
    const status = (emp.status || 'active').toLowerCase();
    return status === 'active' && role !== 'admin' && role !== 'hr' && role !== 'hr_hattech' && role !== 'it_support' && role !== 'intern' && !dept.includes('hr') && !dept.includes('it support') && !dept.includes('it-support');
  });

  const filteredInternsList = employees.filter(emp => {
    const role = (emp.role || emp.userId?.role || "").toLowerCase();
    const status = (emp.status || 'active').toLowerCase();
    return status === 'active' && role === 'intern';
  });

  const dashboardStatData = [
    { name: 'Employees', count: filteredEmployeesList.length || 0, color: '#004AAE' },
    { name: 'Interns', count: filteredInternsList.length || 0, color: '#10B981' },
    { name: 'Projects', count: projects.length || 0, color: '#6366F1' }
  ];

  const departmentDistributionData = useMemo(() => {
    const counts = { "Web Dev": 0, "Graphic Design": 0, "SEO & Marketing": 0, "AI / ML": 0, "Cyber Security": 0 };
    
    const activeEmps = employees.filter(emp => {
      const status = (emp.status || 'active').toLowerCase();
      const role = (emp.role || emp.userId?.role || "").toLowerCase();
      const dept = (emp.department || "").toLowerCase();
      const isExcluded = role === 'admin' || role === 'hr' || role === 'hr_hattech' || role === 'it_support' || dept.includes('hr') || dept.includes('it support') || dept.includes('it-support');
      return status === 'active' && !isExcluded;
    });

    activeEmps.forEach(emp => {
      const name = cleanName(emp.name || emp.username || emp.userId?.name || "").toLowerCase();
      const dept = (emp.department || "").toLowerCase();
      const pos = (emp.position || emp.designation || "").toLowerCase();
      const text = `${dept} ${pos} ${name}`;

      if (name.includes("ali musa") || /\b(ai|ml|python|machine learning|artificial intelligence)\b/i.test(text)) {
        counts["AI / ML"]++;
      } else if (/\b(cyber|security|soc|pentest|ethical|network)\b/i.test(text)) {
        counts["Cyber Security"]++;
      } else if (name.includes("tehreem") || name.includes("ameer") || name.includes("muneeb") || /\b(seo|marketing|digital|content)\b/i.test(text)) {
        counts["SEO & Marketing"]++;
      } else if (name.includes("dilshad") || /\b(graphic|design|ui|ux)\b/i.test(text)) {
        counts["Graphic Design"]++;
      } else {
        counts["Web Dev"]++;
      }
    });

    const result = [
      { name: 'Web Dev', value: counts["Web Dev"], color: '#004AAE' },
      { name: 'Graphic Design', value: counts["Graphic Design"], color: '#EC4899' },
      { name: 'SEO & Marketing', value: counts["SEO & Marketing"], color: '#F59E0B' },
      { name: 'AI / ML', value: counts["AI / ML"], color: '#10B981' },
      { name: 'Cyber Security', value: counts["Cyber Security"], color: '#8B5CF6' }
    ];

    const activeResult = result.filter(item => item.value > 0);
    return activeResult.length > 0 ? activeResult : result;
  }, [employees]);

  const projectDistributionData = useMemo(() => {
    return [
      { name: 'Active', count: projects.filter(p => (p.status || '').toLowerCase() === 'active').length, color: '#3B82F6' },
      { name: 'Delivered', count: projects.filter(p => (p.status || '').toLowerCase() === 'completed' || (p.status || '').toLowerCase() === 'delivered').length, color: '#10B981' },
      { name: 'Domain', count: projects.filter(p => (p.status || '').toLowerCase() === 'on-domain').length, color: '#06B6D4' },
      { name: 'Local', count: projects.filter(p => (p.status || '').toLowerCase() === 'on-localhost').length, color: '#F59E0B' },
      { name: 'Monthly', count: projects.filter(p => {
        const t = (p.type || p.billingType || p.serviceType || p.category || '').toLowerCase();
        return t.includes('monthly') || t.includes('subscription') || t.includes('retainer');
      }).length, color: '#8B5CF6' }
    ];
  }, [projects]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleToggleHoliday = (dateStr) => {
    const isOff = workingDays.nonWorkingDates?.includes(dateStr);
    
    if (isOff) {
      const newDates = workingDays.nonWorkingDates.filter(d => d !== dateStr);
      const newDescriptions = { ...(workingDays.holidayDescriptions || {}) };
      delete newDescriptions[dateStr];
      const updated = { ...workingDays, nonWorkingDates: newDates, holidayDescriptions: newDescriptions };
      setWorkingDays(updated);
      saveConfig(updated);
    } else {
      setHolidayModal({ show: true, date: dateStr, reason: "Public Holiday" });
    }
  };

  const saveConfig = async (value) => {
    try {
      setIsSyncing(true);
      await api.post('/hr/config', { key: 'working_days', value });
      toast.success("Calendar synced");
    } catch (err) {
      toast.error("Auto-sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleHolidayModalSubmit = () => {
    if (!holidayModal.date) return;
    
    const { date, reason } = holidayModal;
    const newDates = [...(workingDays.nonWorkingDates || []), date];
    const newDescriptions = { ...(workingDays.holidayDescriptions || {}), [date]: reason };
    
    const updated = { ...workingDays, nonWorkingDates: newDates, holidayDescriptions: newDescriptions };
    setWorkingDays(updated);
    saveConfig(updated);
    setHolidayModal({ show: false, date: null, reason: "" });
  };

  const handleSaveCalendar = async () => {
    try {
      setIsSyncing(true);
      await api.post('/hr/config', { key: 'working_days', value: workingDays });
      toast.success("System configuration synced");
    } catch (err) {
      toast.error("Failed to sync configuration");
    } finally {
      setIsSyncing(false);
    }
  };

  const getActivityPulse = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const startOfWeek = new Date(now.setDate(diff));
    
    const data = [];
    for (let i = 0; i < 7; i++) {
       const date = new Date(startOfWeek);
       date.setDate(startOfWeek.getDate() + i);
       
       const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
       
       const val1 = Math.floor(Math.abs(Math.sin((i + 1) * 0.5) * 80) + 15);
       const val2 = Math.floor(Math.abs(Math.cos((i + 1) * 0.3) * 60) + 10);
       
       data.push({
          name: label,
          milestones: val1,
          tasks: val2
       });
    }
    return data;
  };

  const generateCalendarDays = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(Date.UTC(calYear, calMonth, i)));
    return days;
  };

  const getUrgentMilestones = () => {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    
    const urgent = [];
    tasks.forEach(task => {
      if (task.milestones && Array.isArray(task.milestones)) {
        task.milestones.forEach(ms => {
          if (ms.status?.toLowerCase() !== 'completed' && ms.deadline) {
            const msDeadline = new Date(ms.deadline);
            if (msDeadline <= threeDaysFromNow) {
              urgent.push({
                ...ms,
                taskTitle: task.title,
                projectName: task.project?.name || task.project?.title || "Internal Project",
                isOverdue: msDeadline < now
              });
            }
          }
        });
      }
    });

    return urgent.sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 5);
  };

  const textMain = isLight ? 'text-gray-900' : 'text-white';
  const textSec = isLight ? 'text-gray-500' : 'text-gray-400';
  const cardBg = isLight ? 'bg-white' : 'bg-[#1a1c23]';
  const borderCol = isLight ? 'border-gray-200' : 'border-[#2d3748]';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pt-14 md:pt-0 pb-10">
      <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-[#004AAE] to-[#002A66] shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-black !text-white mb-0.5 flex items-center gap-3">
              <FiZap className="text-yellow-400" /> HAT TECH MEDIA Dashboard
            </h1>
            <p className="!text-white/80 font-bold tracking-widest uppercase text-[8px]">Active: {employees.filter(emp => emp.status !== 'inactive').length} users | {projects.length} initiatives</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white border border-white/20 shadow-lg shadow-indigo-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <FiPlus size={15} /> Add Announcement
            </button>
            {pakistanTime && (
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border !border-white/20 !text-white text-xs md:text-sm font-mono font-bold flex items-center gap-2 shadow-sm animate-in fade-in duration-300">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping"></span>
                <span>{pakistanTime} CET</span>
              </div>
            )}
            <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-xl border !border-white/20 !text-white text-[9px] font-black flex items-center gap-2 shadow-sm">
               <FiActivity className="text-green-400 animate-pulse" /> FULL SYSTEM ACCESS
            </div>
          </div>
        </div>
      </div>

      {/* TOP PRIMARY STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 min-w-0">
        {/* STAFF MEMBERS CARD (STAFF COUNT AT TOP + CIRCLE PROFILE PICS GRID) */}
        <div
           onClick={() => { setActiveView("employees"); document.getElementById('dynamic-view-section')?.scrollIntoView({ behavior: 'smooth' }); }}
           className={`relative overflow-hidden cursor-pointer p-5 rounded-3xl border backdrop-blur-xl transition-all duration-500 group animate-in fade-in shadow-xl flex flex-col justify-between h-full min-h-[520px]
             ${activeView === 'employees' ? 'scale-[1.02] border-[#004AAE] shadow-2xl z-20' : 'border-white/10 hover:border-[#004AAE]/40'} 
             ${isLight ? 'bg-white/90 border-gray-200 shadow-blue-500/5' : 'bg-gradient-to-br from-[#12102f] to-[#1b1945]'}`}
        >
          <div className="relative z-10 flex flex-col justify-between w-full h-full space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FiUsers size={20} />
                </div>
                <div>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${textMain}`}>Staff Directory</h4>
                  <p className={`text-[9px] font-bold ${textSec} opacity-60 uppercase`}>All Active Members</p>
                </div>
              </div>
              <span 
                onClick={(e) => { e.stopPropagation(); navigate('/admin/employees'); }}
                className="text-[9px] font-black px-2.5 py-1 rounded-xl border border-blue-500/30 text-blue-400 bg-blue-500/10 uppercase tracking-tight shadow-sm hover:bg-blue-500/20 transition-all cursor-pointer"
              >
                View All →
              </span>
            </div>

            {/* Total Count Moved to Top */}
            <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-3 text-center">
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5 ${isLight ? 'text-gray-900' : 'text-white'}`}>Staff Members</p>
              <h4 className={`text-3xl font-black ${isLight ? 'text-blue-700' : 'text-blue-400'} leading-none tracking-tight`}>
                {filteredEmployeesList.length + filteredInternsList.length}
              </h4>
              <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-white/5 text-[10px] font-bold">
                <span className="text-blue-400">● {filteredEmployeesList.length} Employees</span>
                <span className="text-emerald-400">● {filteredInternsList.length} Interns</span>
              </div>
            </div>

            {/* Circle Profile Pictures Gallery */}
            <div className="flex-1 flex flex-col justify-center py-1">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Active Team Avatars</p>
              <div className="flex flex-wrap items-center justify-center gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar p-1">
                {[...filteredEmployeesList, ...filteredInternsList].map((member) => (
                  <div 
                    key={member.id || member._id}
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/employee/${member.id || member._id}`); }}
                    className="relative group/avatar cursor-pointer transition-transform hover:scale-115 hover:z-20"
                    title={`${member.name} • ${member.department || 'Staff'}`}
                  >
                    <img 
                      src={member.profileImage || member.image || member.avatar || member.userId?.avatar || member.userId?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}&backgroundColor=004AAE&textColor=ffffff`}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-indigo-500/40 group-hover/avatar:border-blue-400 shadow-md bg-gray-900 ring-2 ring-transparent group-hover/avatar:ring-blue-400/50"
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${member.isIntern ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom button */}
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/admin/employees'); }}
              className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
            >
              Explore Staff Directory
            </button>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 blur-3xl rounded-full opacity-30 bg-blue-500" />
        </div>

        {/* PROJECTS OVERVIEW CARD (TOTAL AT TOP + RECENT ACTIVE PROJECTS LIST) */}
        <div
           className={`relative overflow-hidden p-5 rounded-3xl border backdrop-blur-xl transition-all duration-500 group animate-in fade-in shadow-xl flex flex-col justify-between h-full min-h-[520px]
             ${activeView === 'projects' ? 'scale-[1.02] border-[#004AAE] shadow-2xl z-20' : 'border-white/10 hover:border-[#004AAE]/40'} 
             ${isLight ? 'bg-white/90 border-gray-200 shadow-indigo-500/5' : 'bg-gradient-to-br from-[#12102f] to-[#1b1945]'}`}
        >
          <div className="relative z-10 flex flex-col justify-between w-full h-full space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FiActivity size={20} />
                </div>
                <div>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${textMain}`}>Projects Overview</h4>
                  <p className={`text-[9px] font-bold ${textSec} opacity-60 uppercase`}>Portfolio Summary</p>
                </div>
              </div>
              <span 
                onClick={(e) => { e.stopPropagation(); navigate('/admin/projects'); }}
                className="text-[9px] font-black px-2.5 py-1 rounded-xl border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 uppercase tracking-tight shadow-sm hover:bg-indigo-500/20 transition-all cursor-pointer"
              >
                View All →
              </span>
            </div>

            {/* Total Count Moved to Top with status metrics */}
            <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-3 text-center">
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5 ${isLight ? 'text-gray-900' : 'text-white'}`}>Total Projects</p>
              <h4 className={`text-3xl font-black ${isLight ? 'text-indigo-700' : 'text-indigo-400'} leading-none tracking-tight`}>
                {projects.length}
              </h4>
              <div className="grid grid-cols-4 gap-1.5 mt-2 pt-2 border-t border-white/5 text-[9px] font-black uppercase">
                <div className="bg-indigo-500/10 text-indigo-400 rounded-lg py-1">
                  {projects.filter(p => (p.status || '').toLowerCase() === 'active' || (p.status || '').toLowerCase() === 'in-progress' || !p.status).length} Active
                </div>
                <div className="bg-emerald-500/10 text-emerald-400 rounded-lg py-1">
                  {projects.filter(p => (p.status || '').toLowerCase() === 'completed' || (p.status || '').toLowerCase() === 'delivered').length} Delv
                </div>
                <div className="bg-cyan-500/10 text-cyan-400 rounded-lg py-1">
                  {projects.filter(p => (p.status || '').toLowerCase() === 'on-domain').length} Domain
                </div>
                <div className="bg-amber-500/10 text-amber-400 rounded-lg py-1">
                  {projects.filter(p => (p.status || '').toLowerCase() === 'on-localhost').length} Local
                </div>
              </div>
            </div>

            {/* Recent Active Projects List (Sorted by date descending) */}
            <div className="flex-1 flex flex-col justify-center py-1">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Recent Active Initiatives</p>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {projects
                  .filter(p => {
                    const s = (p.status || '').toLowerCase();
                    return s !== 'completed' && s !== 'delivered';
                  })
                  .sort((a, b) => new Date(b.createdAt || b.updatedAt || b.startDate || b.date || 0) - new Date(a.createdAt || a.updatedAt || a.startDate || a.date || 0))
                  .slice(0, 4)
                  .map((proj) => (
                    <div
                      key={proj._id || proj.id}
                      onClick={(e) => { e.stopPropagation(); navigate('/admin/projects'); }}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition cursor-pointer group/proj"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover/proj:text-indigo-400 transition-colors">
                            {proj.name || proj.title || "Untitled Project"}
                          </p>
                          <p className="text-[8px] text-slate-400 font-semibold uppercase truncate">
                            {proj.clientName || proj.category || 'Active Client Project'} {proj.createdAt ? `• ${new Date(proj.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                        {proj.status || 'Active'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bottom Button */}
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/admin/projects'); }}
              className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
            >
              Explore All Projects
            </button>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 blur-3xl rounded-full opacity-30 bg-indigo-500" />
        </div>

        {/* TOP PERFORMERS CARD (IMAGE #3 DESIGN INSIDE UPPER BOX - EXPANDED & SPACIOUS) */}
        <div className={`rounded-3xl border p-5 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group h-full min-h-[520px] transition-all duration-500 ${isLight ? 'bg-white/90 border-gray-200 shadow-amber-500/5' : 'bg-gradient-to-b from-[#11131f] to-[#0b0d14] border-white/10'}`}>
           <div className="relative z-10 flex flex-col h-full justify-between">
              {/* Header */}
              <div className={`flex items-center justify-between mb-3 pb-2.5 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                 <h4 className={`text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    <span className="text-amber-400 text-base">🏆</span> TOP PERFORMERS
                 </h4>
                 <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">
                    FOR {displayMonth}
                 </span>
              </div>

              {/* 3D PODIUM SECTION */}
              {leaderboardScores.length >= 3 ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end max-w-[300px] mx-auto pt-2 pb-2">
                    
                    {/* RANK #2 (LEFT - SILVER) */}
                    <div 
                      onClick={() => navigate(`/admin/employee/${leaderboardScores[1]?.id}`)}
                      className="flex flex-col items-center text-center cursor-pointer group transition-transform hover:-translate-y-1"
                    >
                      <div className="relative mb-1.5">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-500 shadow-[0_0_12px_rgba(203,213,225,0.4)]">
                          <img 
                            src={leaderboardScores[1]?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(leaderboardScores[1]?.name || '')}&backgroundColor=004AAE&textColor=ffffff`}
                            className="w-full h-full rounded-full object-cover bg-gray-900"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-slate-300 text-slate-950 font-black text-[9px] flex items-center justify-center border border-slate-100 shadow-md">
                          2
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className={`font-bold text-[10px] truncate max-w-[75px] ${isLight ? 'text-gray-900' : 'text-white'}`}>{leaderboardScores[1]?.name}</p>
                        {leaderboardScores[1]?.isEmployeeOf6Months && <CrownIcon type="gold" />}
                        {leaderboardScores[1]?.isEmployeeOfTheMonth && <CrownIcon type="silver" />}
                      </div>
                      <p className={`text-[8px] font-bold uppercase tracking-tighter truncate max-w-[70px] ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{leaderboardScores[1]?.department}</p>
                      <p className={`text-xs font-black mt-0.5 ${isLight ? 'text-gray-900' : 'text-white'}`}>{leaderboardScores[1]?.score}%</p>
                      <div className="w-8 h-0.5 bg-blue-500 rounded-full mt-0.5 mb-1.5"></div>
                      
                      {/* Pedestal 2 */}
                      <div className="w-full h-11 rounded-t-xl bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 shadow-md flex items-center justify-center border-t border-slate-200">
                        <span className="text-base font-black text-slate-800/50">2</span>
                      </div>
                    </div>

                    {/* RANK #1 (CENTER - GOLD) */}
                    <div 
                      onClick={() => navigate(`/admin/employee/${leaderboardScores[0]?.id}`)}
                      className="flex flex-col items-center text-center cursor-pointer group transition-transform hover:-translate-y-1 -mt-3"
                    >
                      <div className="relative mb-1.5">
                        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 shadow-[0_0_18px_rgba(251,191,36,0.6)]">
                          <img 
                            src={leaderboardScores[0]?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(leaderboardScores[0]?.name || '')}&backgroundColor=004AAE&textColor=ffffff`}
                            className="w-full h-full rounded-full object-cover bg-gray-900"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] flex items-center justify-center border border-yellow-200 shadow-lg">
                          1
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className={`font-black text-[11px] truncate max-w-[80px] ${isLight ? 'text-gray-900' : 'text-white'}`}>{leaderboardScores[0]?.name}</p>
                        {leaderboardScores[0]?.isEmployeeOf6Months && <CrownIcon type="gold" />}
                        {leaderboardScores[0]?.isEmployeeOfTheMonth && <CrownIcon type="silver" />}
                      </div>
                      <p className="text-[8px] font-bold text-amber-500 uppercase tracking-tighter truncate max-w-[75px]">{leaderboardScores[0]?.department}</p>
                      <p className="text-sm font-black text-amber-500 mt-0.5">{leaderboardScores[0]?.score}%</p>
                      <div className="w-10 h-0.5 bg-amber-400 rounded-full mt-0.5 mb-1.5 shadow-[0_0_6px_rgba(251,191,36,0.8)]"></div>
                      
                      {/* Pedestal 1 */}
                      <div className="w-full h-15 rounded-t-xl bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 shadow-lg flex flex-col items-center justify-center border-t border-yellow-200">
                        <span className="text-[10px]">🌾</span>
                        <span className="text-lg font-black text-amber-950/60 leading-none">1</span>
                      </div>
                    </div>

                    {/* RANK #3 (RIGHT - BRONZE) */}
                    <div 
                      onClick={() => navigate(`/admin/employee/${leaderboardScores[2]?.id}`)}
                      className="flex flex-col items-center text-center cursor-pointer group transition-transform hover:-translate-y-1"
                    >
                      <div className="relative mb-1.5">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-900 shadow-[0_0_12px_rgba(180,83,9,0.4)]">
                          <img 
                            src={leaderboardScores[2]?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(leaderboardScores[2]?.name || '')}&backgroundColor=004AAE&textColor=ffffff`}
                            className="w-full h-full rounded-full object-cover bg-gray-900"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-amber-700 text-white font-black text-[9px] flex items-center justify-center border border-amber-500 shadow-md">
                          3
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className={`font-bold text-[10px] truncate max-w-[75px] ${isLight ? 'text-gray-900' : 'text-white'}`}>{leaderboardScores[2]?.name}</p>
                        {leaderboardScores[2]?.isEmployeeOf6Months && <CrownIcon type="gold" />}
                        {leaderboardScores[2]?.isEmployeeOfTheMonth && <CrownIcon type="silver" />}
                      </div>
                      <p className={`text-[8px] font-bold uppercase tracking-tighter truncate max-w-[70px] ${isLight ? 'text-amber-800' : 'text-amber-600/80'}`}>{leaderboardScores[2]?.department}</p>
                      <p className={`text-xs font-black mt-0.5 ${isLight ? 'text-gray-900' : 'text-white'}`}>{leaderboardScores[2]?.score}%</p>
                      <div className="w-8 h-0.5 bg-blue-500 rounded-full mt-0.5 mb-1.5"></div>
                      
                      {/* Pedestal 3 */}
                      <div className="w-full h-9 rounded-t-xl bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 shadow-md flex items-center justify-center border-t border-amber-500">
                        <span className="text-sm font-black text-amber-950/60">3</span>
                      </div>
                    </div>

                  </div>

                  {/* LIST UNDER PODIUM (STARTING FROM RANK #4 ONWARDS - SPACIOUS & CLEAN) */}
                  <div className={`mt-3 pt-3 border-t space-y-2 max-h-[170px] min-h-[130px] overflow-y-auto pr-1.5 custom-scrollbar ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                    {leaderboardScores.slice(3, 8).map((score) => (
                      <div 
                        key={score.id} 
                        onClick={() => navigate(`/admin/employee/${score.id}`)}
                        className={`flex items-center justify-between gap-2.5 p-2 rounded-xl transition-all cursor-pointer border shadow-sm ${
                          isLight 
                            ? 'bg-gray-50/80 hover:bg-blue-50/50 border-gray-200/80' 
                            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 border shadow-inner ${
                            isLight ? 'bg-gray-200 text-gray-800 border-gray-300' : 'bg-slate-800 text-slate-200 border-slate-700'
                          }`}>
                            {score.rank}
                          </span>
                          <img 
                            src={score.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(score.name)}&backgroundColor=004AAE`} 
                            className={`w-7 h-7 rounded-lg object-cover shrink-0 border shadow-sm ${isLight ? 'border-gray-200' : 'border-slate-700'}`} 
                          />
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{score.name}</p>
                            <p className={`text-[8px] font-semibold uppercase tracking-wider truncate ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{score.department}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>{score.score}%</span>
                          <div className={`w-14 h-1 rounded-full overflow-hidden mt-1 ${isLight ? 'bg-gray-200' : 'bg-slate-800'}`}>
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${score.score}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6">
                   <div className="w-8 h-8 border-2 border-[#004AAE] border-t-transparent rounded-full animate-spin" />
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter opacity-40">Analyzing performance...</p>
                </div>
              )}

              {/* Bottom Action Button */}
              <div className={`mt-3 pt-2.5 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => document.getElementById('full-leaderboard')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full text-[10px] font-black uppercase px-3.5 py-2.5 bg-[#004AAE] hover:bg-blue-600 !text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  style={{ color: '#ffffff' }}
                >
                  VIEW RANKING DETAIL <FiArrowUpRight size={13} />
                </motion.button>
              </div>
           </div>
           
           <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full" />
        </div>
        
        {/* 4TH CARD: UPCOMING MEETINGS & SCHEDULE CARD */}
        <div className={`rounded-3xl border ${borderCol} p-5 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group h-full min-h-[520px] ${isLight ? 'bg-white' : 'bg-gradient-to-b from-[#14122d] to-[#0b0a1a]'}`}>
           <div className="relative z-10 flex flex-col h-full justify-between">
              {/* Header */}
              <div className={`flex items-center justify-between mb-3 pb-2.5 border-b ${isLight ? 'border-gray-200' : 'border-white/10'} flex-wrap gap-2`}>
                 <h4 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-2`}>
                    <span className="text-blue-500 text-base">📅</span> {isHatTechAdmin ? "ALL UPCOMING MEETINGS" : "MY UPCOMING MEETINGS"}
                 </h4>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={syncGoogleCalendar}
                     disabled={isSyncingCalendar}
                     title="Sync live events from Google Calendar & Mobile"
                     className={`text-[10px] font-bold p-1.5 rounded-full border transition-all flex items-center justify-center shadow-sm cursor-pointer ${
                       isLight
                         ? "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700"
                         : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                     }`}
                   >
                     <FiRefreshCw size={12} className={isSyncingCalendar ? "animate-spin text-blue-400" : "text-slate-400 hover:text-white"} />
                   </button>
                   <button
                     onClick={connectGoogleCalendar}
                     title={googleConnected ? "Google Calendar Connected & Synced with Phone (Click to Re-connect)" : "Connect Google Calendar to sync mobile events"}
                     className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                       googleConnected
                         ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/25"
                         : isLight
                           ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white"
                           : "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white"
                     }`}
                   >
                     <span className={`w-1.5 h-1.5 rounded-full ${googleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></span>
                     {googleConnected ? "Google Synced" : "Connect Calendar"}
                   </button>
                   <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30 uppercase tracking-wider hidden sm:inline-block">
                      {isHatTechAdmin ? "HQ OVERVIEW" : "30M ALERT"}
                   </span>
                 </div>
              </div>

              {/* Meeting list or next meeting banner */}
              <div className="flex-1 flex flex-col justify-between py-1">
                {upcomingMeetingsList.length > 0 ? (
                  <div className="space-y-3">
                    {/* Highlight next closest meeting */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/30 shadow-inner">
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500 text-white shadow-sm">
                          Next Scheduled
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isHatTechAdmin && upcomingMeetingsList[0].adminId && (
                            <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                              👤 {upcomingMeetingsList[0].adminId.name || upcomingMeetingsList[0].adminId.username || "Admin"}
                            </span>
                          )}
                          <span className="text-[10px] font-black text-blue-300">
                            {upcomingMeetingsList[0].formattedTime || upcomingMeetingsList[0].time || "Scheduled"}
                          </span>
                        </div>
                      </div>

                      <h5 className="font-black text-sm text-white truncate">
                        {upcomingMeetingsList[0].title || upcomingMeetingsList[0].clientName || "Strategy Meeting"}
                      </h5>
                      {upcomingMeetingsList[0].title && upcomingMeetingsList[0].clientName && (
                        <p className="text-[10px] text-blue-300/90 font-semibold truncate mt-0.5">
                          With: <span className="text-white">{upcomingMeetingsList[0].clientName}</span>
                        </p>
                      )}
                      
                      <p className="text-[10px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                        {upcomingMeetingsList[0].details || upcomingMeetingsList[0].description || upcomingMeetingsList[0].notes || "Team sync & client agenda discussion"}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10 text-[9px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <FiCalendar size={11} className="text-blue-400" />
                          <span>
                            {upcomingMeetingsList[0].nextMeetingDate || upcomingMeetingsList[0].date 
                              ? new Date(upcomingMeetingsList[0].nextMeetingDate || upcomingMeetingsList[0].date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                              : "Upcoming"}
                          </span>
                        </div>
                        {isHatTechAdmin && upcomingMeetingsList[0].adminId && (
                          <span className="text-amber-400/90 font-bold text-[9px] truncate">
                            Host: {upcomingMeetingsList[0].adminId.name || upcomingMeetingsList[0].adminId.username || "Admin"}
                          </span>
                        )}
                        {upcomingMeetingsList[0].meetingLink && (
                          <a 
                            href={upcomingMeetingsList[0].meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline font-bold"
                          >
                            Join Meet
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Secondary upcoming list */}
                    <div className="space-y-2 max-h-[170px] min-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                      {upcomingMeetingsList.slice(1, 6).map((m, idx) => (
                        <div 
                          key={m._id || idx}
                          onClick={() => navigate('/admin/personal-logs')}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 cursor-pointer transition"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {m.title || m.clientName || "Meeting"}
                              </p>
                              <p className="text-[8px] text-slate-400 font-semibold truncate">
                                {(m.nextMeetingDate || m.date) ? new Date(m.nextMeetingDate || m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ""}
                                {` • ${m.formattedTime || m.time || "Scheduled"}`}
                                {m.clientName && m.title ? ` • ${m.clientName}` : ""}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isHatTechAdmin && m.adminId && (
                              <span className="text-[8px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                👤 {m.adminId.name || m.adminId.username || "Admin"}
                              </span>
                            )}
                            <span className="text-[8px] font-black uppercase text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                              {m.interactionType || m.type || 'Meeting'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8 px-2 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner">
                      <FiCalendar size={26} />
                    </div>
                    <div>
                      <h5 className="text-xs font-black uppercase text-white tracking-wider">No Upcoming Meetings</h5>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                        Schedule meetings with automatic 30-minute reminder email notifications.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Button */}
              <div className="mt-3 pt-2.5 border-t border-white/10">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/admin/personal-logs')}
                  className="w-full text-[10px] font-black uppercase px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 !text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  style={{ color: '#ffffff' }}
                >
                  <FiPlus size={13} /> SCHEDULE MEETING / ADD NOTE
                </motion.button>
              </div>
           </div>
           
           <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
        </div>
      </div>

      {/* 2-BOX ROW ABOVE ACTIVE TIME: WORLD CLOCK & HOLIDAY / WORKING DAYS PLANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <WorldClock isLight={isLight} />

        {/* HOLIDAY PLANNER & SYSTEM CONFIGURATION CARD */}
        <div className={`${cardBg} rounded-3xl border ${borderCol} p-6 shadow-xl flex flex-col justify-between min-w-0 overflow-hidden`}>
           <div>
             <div className={`flex items-center justify-between mb-4 border-b ${borderCol} pb-3`}>
                <p className="text-xs font-black uppercase text-[#004AAE] tracking-widest flex items-center gap-2">
                  <FiCalendar size={15} /> Company Holiday & Working Days Planner
                </p>
                <div className="flex items-center gap-3">
                   <span className={`text-[10px] font-black uppercase ${textSec}`}>{months[calMonth]} {calYear}</span>
                   <div className="flex gap-2">
                      <button onClick={() => {
                          if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                          else setCalMonth(m => m - 1);
                      }} className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg border border-transparent hover:border-gray-200"><FiChevronRight className="rotate-180" size={12} /></button>
                      <button onClick={() => {
                          if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                          else setCalMonth(m => m + 1);
                      }} className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg border border-transparent hover:border-gray-200"><FiChevronRight size={12} /></button>
                   </div>
                </div>
             </div>
             <div className="grid grid-cols-7 gap-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={`${d}-${i}`} className="text-[9px] font-black text-center opacity-40 py-1">{d}</div>)}
                {generateCalendarDays().map((day, idx) => {
                  if (!day) return <div key={idx} />;
                  const dateStr = day.toISOString().split('T')[0];
                  const isOff = (dateStr !== '2026-06-28') && (workingDays.nonWorkingDates?.includes(dateStr) || (day.getUTCDay() === 0 && workingDays.sunday === false));
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  const holidayDesc = isOff ? (workingDays.holidayDescriptions?.[dateStr] || (day.getUTCDay() === 0 ? 'Weekend' : 'Holiday')) : '';
                  return (
                    <button 
                      key={idx} 
                      title={holidayDesc}
                      onClick={() => handleToggleHoliday(dateStr)}
                      className={`h-9 w-full rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center justify-center ${isOff ? 'bg-red-500 text-white border-red-500' : isToday ? 'border-[#004AAE] text-[#004AAE] bg-[#004AAE]/5' : `${textSec} ${cardBg} border-[var(--bg-inner)] hover:border-[#004AAE]/50`}`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
             </div>
           </div>
           <button 
              onClick={handleSaveCalendar} 
              disabled={isSyncing}
              className="w-full mt-4 py-3 bg-[#004AAE] !text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#003882] transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
              style={{ color: '#ffffff' }}
            >
             {isSyncing ? "Syncing..." : "Sync system configuration"}
           </button>
        </div>
      </div>

      {/* LOWER SECTION: PANEL ACTIVE TIME & MILESTONE COMPLETION (2 BOXES IN 1 LINE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className={`rounded-3xl border ${borderCol} p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group h-full ${isLight ? 'bg-white' : 'bg-gradient-to-br from-[#1b1945] to-[#12102f]'}`}>
           <div className="relative z-10 w-full h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-inner shrink-0">
                      <FiClock size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-wider ${textMain}`}>
                        Panel Active Time
                      </h4>
                      <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Today's session duration</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Tracker
                  </span>
                </div>

                {/* SQUARE BOXES GRID FOR ACTIVE EMPLOYEES */}
                <div>
                  {(() => {
                    const validEmployees = employees.filter(e => {
                      const role = (e.role || e.userId?.role || "").toLowerCase();
                      const dept = (e.department || "").toLowerCase();
                      const status = (e.status || 'active').toLowerCase();
                      const isExcluded = role === 'admin' || role === 'hr' || role === 'hr_hattech' || role === 'it_support' || dept.includes('hr') || dept.includes('it support') || dept.includes('it-support');
                      return !isExcluded && status === 'active';
                    });

                    const sortedList = [...validEmployees].sort((a, b) => {
                      const uIdA = a.userId?._id || a.userId;
                      const uIdB = b.userId?._id || b.userId;
                      const actA = dailyActivities.find(act => String(act.userId?._id || act.userId) === String(uIdA));
                      const actB = dailyActivities.find(act => String(act.userId?._id || act.userId) === String(uIdB));
                      const onlineA = actA && actA.lastHeartbeat && (new Date() - new Date(actA.lastHeartbeat)) <= 180000 ? 1 : 0;
                      const onlineB = actB && actB.lastHeartbeat && (new Date() - new Date(actB.lastHeartbeat)) <= 180000 ? 1 : 0;
                      if (onlineA !== onlineB) return onlineB - onlineA;
                      const durA = actA?.duration || 0;
                      const durB = actB?.duration || 0;
                      if (durA !== durB) return durB - durA;
                      return (a.name || '').localeCompare(b.name || '');
                    });

                    if (sortedList.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-8 text-center min-h-[160px]">
                          <div className="w-12 h-12 rounded-full bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mb-3">
                            <FiClock size={20} className="text-indigo-500/30 animate-pulse" />
                          </div>
                          <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Awaiting Active Sessions</p>
                          <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase">Real-time panel usage will appear here</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {sortedList.slice(0, 6).map(e => {
                          const uId = e.userId?._id || e.userId;
                          const act = dailyActivities.find(a => String(a.userId?._id || a.userId) === String(uId));
                          const totalMinutes = act ? act.duration : 0;
                          const hrs = Math.floor(totalMinutes / 60);
                          const mins = totalMinutes % 60;
                          const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;

                          // Active status checks: heartbeat within last 3 minutes
                          const isOnline = act && act.lastHeartbeat && (new Date() - new Date(act.lastHeartbeat)) <= 180000;
                          const lastActiveStr = formatLastActive(act, isOnline);
                          const designation = e.position || e.jobTitle || e.designation || 'Team Member';

                          return (
                            <div 
                              key={e._id || e.id} 
                              className={`p-3 rounded-2xl border transition-all hover:scale-[1.02] duration-200 flex flex-col justify-between ${
                                isLight 
                                  ? 'bg-gray-50/90 border-gray-200 hover:border-indigo-400 shadow-sm' 
                                  : 'bg-white/[0.025] border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/[0.04] shadow-md'
                              }`}
                            >
                              {/* 1 & 2: AVATAR, NAME & DESIGNATION */}
                              <div className="flex items-center gap-2.5 mb-2.5">
                                <div className="relative shrink-0">
                                  <img 
                                    src={e.profileImage || e.userId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(e.name)}&backgroundColor=004AAE`} 
                                    className="w-9 h-9 rounded-xl object-cover border border-gray-100 dark:border-white/10 shadow-sm" 
                                    alt={e.name} 
                                  />
                                  {isOnline ? (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-[#1b1945] shadow-sm animate-pulse" title="Active Now" />
                                  ) : (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gray-500 border-2 border-white dark:border-[#1b1945]" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className={`text-[11.5px] font-black truncate ${textMain}`} title={e.name}>{e.name}</h5>
                                  <p className="text-[8.5px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-tight truncate mt-0.5" title={designation}>
                                    {designation}
                                  </p>
                                </div>
                              </div>

                              {/* 3 & 4: LAST ACTIVE & TOTAL ACTIVE TIME */}
                              <div className="space-y-1.5 mt-auto pt-2 border-t border-gray-200/50 dark:border-white/5">
                                {/* 3. Last Active Time */}
                                <div className={`flex items-center justify-between px-2 py-1 rounded-lg text-[9.5px] border ${
                                  isOnline 
                                    ? 'bg-green-500/10 border-green-500/20 text-green-500 dark:text-green-400' 
                                    : (isLight ? 'bg-white border-gray-200 text-gray-600' : 'bg-white/[0.02] border-white/5 text-gray-300')
                                }`}>
                                  <span className="font-bold uppercase text-[7.5px] opacity-80 flex items-center gap-1">
                                    <FiClock size={9} className="shrink-0" /> Last Active
                                  </span>
                                  <span className="font-black text-[8.5px] truncate max-w-[95px]">
                                    {lastActiveStr}
                                  </span>
                                </div>

                                {/* 4. Total Active Time */}
                                <div className="flex items-center justify-between px-2 py-1 rounded-lg text-[9.5px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
                                  <span className="font-bold uppercase text-[7.5px] opacity-80 flex items-center gap-1">
                                    <FiActivity size={9} className="shrink-0" /> Total Active
                                  </span>
                                  <span className="font-black text-[9.5px]">
                                    {timeStr}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
             </div>

             <div className={`mt-5 flex items-center justify-between border-t ${borderCol} pt-3`}>
               <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => {
                   setSelectedDate(new Date().toISOString().slice(0, 10));
                   document.getElementById('full-leaderboard')?.scrollIntoView({ behavior: 'smooth' });
                 }}
                 className="w-full text-[9px] font-black uppercase py-2.5 bg-indigo-600 hover:bg-indigo-700 !text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                 style={{ color: '#ffffff' }}
               >
                 View More Active Times <FiArrowUpRight size={12} />
               </motion.button>
             </div>
           </div>
           <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-gradient-to-tr from-indigo-500/20 to-purple-500/10 blur-3xl rounded-full group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* MILESTONE COMPLETION */}
        <div className={`p-6 rounded-3xl ${cardBg} border ${borderCol} shadow-xl min-w-0 overflow-hidden flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className={`font-black text-sm flex items-center gap-2 ${textMain} uppercase tracking-widest`}>
                    <FiActivity className="text-orange-500" /> Milestone Completion
                  </h3>
                  <p className={`text-[9px] font-bold ${textSec} opacity-40 uppercase`}>Line Tracking • Daily</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#ff7300]" />
                     <span className="text-[8px] font-black uppercase opacity-60">Met</span>
                  </div>
                  <div className="bg-orange-500/10 px-3 py-1 rounded-lg">
                     <p className="text-[8px] font-black text-orange-500 uppercase">Total: {getActivityPulse().reduce((acc, curr) => acc + (curr.milestones || 0), 0)}</p>
                  </div>
               </div>
            </div>

            {getUrgentMilestones().filter(ms => !ms.isOverdue).length > 0 && (
              <div className={`mb-6 space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar`}>
                {getUrgentMilestones().filter(ms => !ms.isOverdue).map((ms, i) => (
                  <div key={i} className={`p-3 rounded-xl border flex items-center justify-between bg-orange-500/10 border-orange-500/20`}>
                     <div className="flex items-center gap-3 shrink-0">
                        <div className={`p-2 rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/40`}>
                           <FiClock size={14} />
                        </div>
                        <div className="max-w-[200px]">
                           <p className={`text-[10px] font-black ${textMain} uppercase truncate`}>{ms.title}</p>
                           <p className={`text-[8px] font-bold ${textSec} opacity-50 uppercase truncate`}>{ms.projectName} • {ms.taskTitle}</p>
                        </div>
                     </div>
                     <div className="text-right whitespace-nowrap">
                        <p className={`text-[9px] font-black text-orange-500 uppercase ml-4`}>
                          Soon • {new Date(ms.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="h-[200px] w-full relative min-w-0 overflow-hidden" style={{ minHeight: '200px' }}>
            {hasMounted && (
              <ResponsiveContainer width="100%" height={200} debounce={1}>
                <LineChart data={getActivityPulse()}>
                <CartesianGrid 
                  stroke={isLight ? '#f0f0f0' : '#1a1c23'} 
                  strokeDasharray="0" 
                  horizontal={true} 
                  vertical={true} 
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: isLight ? '#666' : '#fff' }} />
                <YAxis hide />
                <Tooltip 
                   contentStyle={{ backgroundColor: isLight ? '#fff' : '#1a1c23', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                   itemStyle={{ color: isLight ? '#000' : '#fff', fontWeight: 'bold', fontSize: '10px' }}
                />
                <Line 
                   type="monotone" 
                   dataKey="milestones" 
                   stroke="#ff7300" 
                   strokeWidth={4} 
                   dot={{ r: 5, fill: '#fff', stroke: '#ff7300', strokeWidth: 3 }}
                   activeDot={{ r: 8, strokeWidth: 0 }}
                />
                <Line 
                   type="monotone" 
                   dataKey="tasks" 
                   stroke="#e91e63" 
                   strokeWidth={4} 
                   strokeDasharray="5 5"
                   dot={{ r: 5, fill: '#fff', stroke: '#e91e63', strokeWidth: 3 }}
                   activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>


      <div className="mt-8" id="dynamic-view-section">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-[#2d3748] pb-4">
           <div className="flex gap-6">
              {["employees", "interns", "projects", "tasks"].map(v => (
                <button 
                  key={v}
                  onClick={() => setActiveView(v)}
                  className={`text-sm font-black uppercase tracking-widest pb-4 -mb-4 transition-all relative ${activeView === v ? 'text-[#004AAE]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {v}
                  {activeView === v && <motion.div layoutId="activeUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004AAE]" />}
                </button>
              ))}
           </div>
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsListExpanded(!isListExpanded)}
                className={`flex items-center gap-2 p-2 rounded-xl border ${borderCol} ${cardBg} shadow-sm hover:shadow-md transition-all group`}
              >
                <div className={`transition-transform duration-300 ${isListExpanded ? 'rotate-180' : ''}`}>
                  <FiChevronDown className={textSec} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${textSec}`}>{isListExpanded ? 'Hide' : 'Show'} Data</span>
              </button>
           </div>
        </div>

        <AnimatePresence initial={false}>
          {isListExpanded && (
            <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
                {activeView === "employees" && (
                  filteredEmployeesList.map(emp => {
                    const uId = String(emp.userId?._id || emp.userId || emp._id || emp.id);
                    return (
                      <EmployeeCard 
                        key={emp._id || emp.id} 
                        emp={emp} 
                        lastReport={latestReportsByUserId[uId]}
                        isLight={isLight} 
                        onClick={() => navigate(`/admin/employee/${emp._id || emp.id}`)} 
                      />
                    );
                  })
                )}
                {activeView === "interns" && (
                  filteredInternsList.map(emp => {
                    const uId = String(emp.userId?._id || emp.userId || emp._id || emp.id);
                    return (
                      <EmployeeCard 
                        key={emp._id || emp.id} 
                        emp={emp} 
                        lastReport={latestReportsByUserId[uId]}
                        isLight={isLight} 
                        onClick={() => navigate(`/admin/employee/${emp._id || emp.id}`)} 
                      />
                    );
                  })
                )}
                {activeView === "projects" && (
                  projects.map(p => (
                    <ProjectCard key={p._id} project={p} isLight={isLight} onClick={() => navigate(`/admin/project/${p._id || p.id}`)} />
                  ))
                )}
                {activeView === "tasks" && (
                  tasks.slice(0, 12).map(t => (
                    <TaskCard key={t._id} task={t} isLight={isLight} onClick={() => setSelectedTask(t)} />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCalendar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`${cardBg} border ${borderCol} p-8 rounded-3xl w-full max-w-2xl shadow-3xl`}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className={`text-2xl font-black ${textMain}`}>Company Holiday Manager</h2>
                  <p className={textSec}>Toggle dates to set global system off-days</p>
                </div>
                <button onClick={() => setShowCalendar(false)} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                  <FiXCircle size={24} />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                 <select 
                   value={calMonth} 
                   onChange={(e) => setCalMonth(parseInt(e.target.value))} 
                   className={`p-2 rounded-xl ${cardBg} border ${borderCol} text-sm font-bold ${textMain} outline-none focus:ring-2 focus:ring-[#004AAE]`}
                 >
                   {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => <option key={i} value={i}>{m}</option>)}
                 </select>
                 <select 
                    value={calYear} 
                    onChange={(e) => setCalYear(parseInt(e.target.value))}
                    className={`p-2 rounded-xl ${cardBg} border ${borderCol} text-sm font-bold ${textMain} outline-none focus:ring-2 focus:ring-[#004AAE]`}
                 >
                   {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} className="text-center text-[10px] font-black text-[#004AAE] py-2 uppercase">{d}</div>)}
                {generateCalendarDays().map((day, idx) => {
                  if (!day) return <div key={idx} className="h-12" />;
                  const dateStr = day.toISOString().split('T')[0];
                  const isOff = (dateStr !== '2026-06-28') && (workingDays.nonWorkingDates?.includes(dateStr) || (day.getUTCDay() === 0 && workingDays.sunday === false));
                  const holidayDesc = isOff ? (workingDays.holidayDescriptions?.[dateStr] || (day.getUTCDay() === 0 ? 'Weekend' : 'Holiday')) : '';
                  return (
                    <button 
                      key={idx} 
                      title={holidayDesc}
                      onClick={() => handleToggleHoliday(dateStr)}
                      className={`h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all border ${isOff ? 'bg-red-500 text-white border-red-500' : `${cardBg} ${textMain} ${borderCol} hover:border-[#004AAE]`}`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {holidayModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className={`${cardBg} border ${borderCol} p-6 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <FiCalendar size={20} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-black ${textMain}`}>Holiday Title</h3>
                    <p className={`text-[10px] font-bold ${textSec} uppercase tracking-wider`}>{holidayModal.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setHolidayModal({ show: false, date: null, reason: "" })}
                  className={`p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all ${textSec}`}
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-widest ${textSec} mb-2 block`}>Reason / Occasion</label>
                  <input 
                    type="text"
                    autoFocus
                    value={holidayModal.reason}
                    onChange={(e) => setHolidayModal({ ...holidayModal, reason: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleHolidayModalSubmit()}
                    placeholder="e.g. Eid-ul-Fitr, Annual Leave..."
                    className={`w-full p-4 rounded-2xl border ${borderCol} ${cardBg} ${textMain} text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:opacity-30`}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setHolidayModal({ show: false, date: null, reason: "" })}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${textSec} border ${borderCol} hover:bg-gray-50 dark:hover:bg-white/5 transition-all`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleHolidayModalSubmit}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL LEADERBOARD SECTION (INLINE) */}
      <div id="full-leaderboard" className={`mt-10 p-8 rounded-3xl border ${borderCol} ${cardBg} shadow-2xl space-y-8 min-w-0 overflow-hidden`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#004AAE] text-white flex items-center justify-center shadow-lg shadow-[#004AAE]/20">
              <FiSearch size={28} />
            </div>
            <div>
              <h2 className={`text-2xl font-black ${textMain}`}>Company Performance Leaderboard</h2>
              <div className="flex items-center gap-4 mt-1">
                <p className={textSec}>Showing rankings synchronized with {months[selectedMonth]} {selectedYear} records</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#004AAE]/5 p-2 rounded-2xl border border-[#004AAE]/10">
            <div className="flex items-center gap-1.5 border-r border-[#004AAE]/20 pr-3 mr-1">
              <span className="text-[9px] font-black text-[#004AAE] uppercase tracking-wider">Active Date:</span>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1.5 rounded-xl text-xs font-black bg-transparent border-none outline-none text-[#004AAE] cursor-pointer hover:bg-[#004AAE]/10"
              />
            </div>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all bg-transparent border-none outline-none text-[#004AAE] cursor-pointer hover:bg-[#004AAE]/10`}
            >
              {months.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all bg-transparent border-none outline-none text-[#004AAE] cursor-pointer hover:bg-[#004AAE]/10`}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-6 rounded-2xl border ${borderCol} bg-[#004AAE]/5`}>
            <p className="text-[10px] font-black text-[#004AAE] uppercase mb-1">Total Evaluated</p>
            <p className={`text-2xl font-black ${textMain}`}>{leaderboardScores.length} <span className="text-sm font-normal text-gray-400">Staff</span></p>
          </div>
          <div className={`p-6 rounded-2xl border ${borderCol} bg-green-500/5`}>
            <p className="text-[10px] font-black text-green-500 uppercase mb-1">Top Score</p>
            <p className={`text-2xl font-black ${textMain}`}>{Math.min(100, Math.max(0, leaderboardScores[0]?.score || 0))}%</p>
          </div>
          <div className={`p-6 rounded-2xl border ${borderCol} bg-amber-500/5`}>
            <p className="text-[10px] font-black text-amber-500 uppercase mb-1">Company Avg</p>
            <p className={`text-2xl font-black ${textMain}`}>
              {leaderboardScores.length > 0 ? Math.min(100, Math.max(0, Math.round(leaderboardScores.reduce((acc, s) => acc + s.score, 0) / leaderboardScores.length))) : 0}%
            </p>
          </div>
          <div className={`p-6 rounded-2xl border ${borderCol} bg-primary/5`}>
            <p className="text-[10px] font-black text-primary uppercase mb-1">Current Sync</p>
            <p className={`text-2xl font-black ${textMain}`}>{months[selectedMonth]}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4 pb-2 border-t border-gray-100 dark:border-[#2d3748]">
          <div>
            <h4 className={`text-sm font-black uppercase tracking-wider ${textMain}`}>
              Complete Company Leaderboard & Performance Metrics
            </h4>
            <p className="text-[11px] text-gray-400 font-medium">
              Showing evaluated rankings and performance scores for all {leaderboardScores.length} staff members
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#2d3748]">
                <th className={`pb-4 text-xs font-black uppercase tracking-widest ${textSec}`}>Rank</th>
                <th className={`pb-4 text-xs font-black uppercase tracking-widest ${textSec}`}>Member</th>
                <th className={`pb-4 text-xs font-black uppercase tracking-widest ${textSec}`}>Department</th>
                <th className={`pb-4 text-xs font-black uppercase tracking-widest ${textSec} text-center hidden md:table-cell`}>Metrics (A:25 | P:25 | R:25 | M:25)</th>
                <th className={`pb-4 text-xs font-black uppercase tracking-widest ${textSec} text-center`}>Panel Active Time</th>
                <th className={`pb-4 text-xs font-black uppercase tracking-widest ${textSec} text-center`}>Achievement Bonus</th>
                <th className={`pb-4 text-xs font-black uppercase tracking-widest ${textSec} text-right`}>Overall Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#2d3748]">
              {leaderboardScores.map((item, idx) => (
                <tr 
                  key={item.id} 
                  onClick={() => navigate(`/admin/employee/${item.id}`)}
                  className="group hover:bg-[#004AAE]/5 transition-colors cursor-pointer"
                >
                  <td className="py-5">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                      item.rank === 1 ? 'bg-amber-400 text-white shadow-lg' : 
                      item.rank === 2 ? 'bg-slate-400 text-white shadow-lg' :
                      item.rank === 3 ? 'bg-amber-700 text-white shadow-lg' :
                      `${textSec} bg-gray-100 dark:bg-[#1a1a1c]`
                    }`}>
                      #{item.rank}
                    </span>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}&backgroundColor=004AAE&textColor=ffffff`}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                        />
                        {item.rank <= 3 && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white"></div>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className={`font-bold ${textMain}`}>{item.name}</p>
                        {item.isEmployeeOf6Months && <CrownIcon type="gold" />}
                        {item.isEmployeeOfTheMonth && <CrownIcon type="silver" />}
                      </div>
                    </div>
                  </td>
                  <td className="py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#004AAE]/10 text-[#004AAE]`}>
                      {item.department}
                    </span>
                  </td>
                  <td className="py-5 hidden md:table-cell">
                    <div className="flex items-center justify-center gap-3 text-xs font-bold">
                       <div className="text-center" title="Attendance">
                          <p className="text-[9px] text-gray-400 uppercase">Att</p>
                          <p className={textMain}>{item.stats.present}/{item.stats.passed}</p>
                       </div>
                       <div className="w-[1px] h-6 bg-gray-100 dark:bg-[#2d3748]"></div>
                       <div className="text-center" title="Punctuality">
                          <p className="text-[9px] text-gray-400 uppercase">Pun</p>
                          <p className={textMain}>{item.stats.onTime}</p>
                       </div>
                       <div className="w-[1px] h-6 bg-gray-100 dark:bg-[#2d3748]"></div>
                       <div className="text-center" title="Reports">
                          <p className="text-[9px] text-gray-400 uppercase">Rep</p>
                          <p className={textMain}>{item.stats.reports}</p>
                       </div>
                       <div className="w-[1px] h-6 bg-gray-100 dark:bg-[#2d3748]"></div>
                       <div className="text-center" title="Milestones">
                          <p className="text-[9px] text-gray-400 uppercase">Mls</p>
                          <p className={textMain}>{Math.round(item.stats.milestones || 25)}</p>
                       </div>
                    </div>
                  </td>
                  <td className="py-5 text-center">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
                      getPanelActiveTime(item.id) !== '--' && getPanelActiveTime(item.id) !== '0 mins'
                        ? 'bg-indigo-500/10 text-indigo-500' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}>
                      {getPanelActiveTime(item.id)}
                    </span>
                  </td>
                  <td className="py-5 text-center">
                    {item.isEmployeeOf6Months ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-400/20 text-amber-400 border border-amber-400/40 inline-flex items-center gap-1.5 shadow-sm animate-pulse">
                        <CrownIcon type="gold" /> +10% Bonus
                      </span>
                    ) : item.isEmployeeOfTheMonth ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-400/20 text-slate-200 border border-slate-400/40 inline-flex items-center gap-1.5 shadow-sm animate-pulse">
                        <CrownIcon type="silver" /> +5% Bonus
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-gray-400 opacity-40">0%</span>
                    )}
                  </td>
                  <td className="py-5 text-right">
                    <div className="inline-flex flex-col items-end">
                      <span className={`text-lg font-black ${
                        item.score >= 90 ? 'text-green-500' :
                        item.score >= 80 ? 'text-[#004AAE]' :
                        item.score >= 60 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {item.score}%
                      </span>
                      <div className="w-24 h-1 bg-gray-100 dark:bg-[#2d3748] rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            item.score >= 90 ? 'bg-green-500' :
                            item.score >= 80 ? 'bg-[#004AAE]' :
                            item.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[110] backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`${cardBg} border ${borderCol} p-8 rounded-3xl w-full max-w-lg shadow-3xl`}>
              <div className="flex justify-between items-start mb-6">
                <h3 className={`text-2xl font-black ${textMain}`}>{selectedTask.title}</h3>
                <button onClick={() => setSelectedTask(null)} className={textSec}><FiXCircle size={24} /></button>
              </div>
              <div className="mb-4">
                 <p className={`text-xs font-black uppercase text-[#004AAE]`}>Project</p>
                 <p className={`text-sm ${textMain}`}>{selectedTask.project?.name || selectedTask.project?.title || selectedTask.project || "N/A"}</p>
              </div>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {selectedTask.milestones?.map((ms, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${borderCol} bg-[#004AAE]/5`}>
                     <div className="flex justify-between items-center mb-2">
                        <p className={`font-bold ${textMain}`}>{ms.title}</p>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">Done</span>
                     </div>
                     <p className={`text-xs ${textSec}`}>{ms.description}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelectedTask(null)} className="w-full mt-8 py-4 bg-[#004AAE] text-white rounded-2xl font-black shadow-xl hover:bg-[#003882] transition-all uppercase tracking-widest">Acknowledge</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ANNOUNCEMENT BROADCAST MODAL */}
      <AnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
      />

    </div>
  );
}

function StatPanel({ icon, label, value, trend, color, isLight, onClick, active }) {
  const themes = {
    blue: {
      bg: "from-blue-600/20 to-blue-600/5",
      border: "border-blue-500/30",
      text: "text-blue-500",
      glow: "group-hover:shadow-blue-500/20",
      spark: "stroke-blue-500/20"
    },
    indigo: {
      bg: "from-indigo-600/20 to-indigo-600/5",
      border: "border-indigo-500/30",
      text: "text-indigo-500",
      glow: "group-hover:shadow-indigo-500/20",
      spark: "stroke-indigo-500/20"
    },
    emerald: {
      bg: "from-emerald-600/20 to-emerald-600/5",
      border: "border-emerald-500/30",
      text: "text-emerald-500",
      glow: "group-hover:shadow-emerald-500/20",
      spark: "stroke-emerald-500/20"
    },
  };

  const theme = themes[color] || themes.blue;

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer px-5 py-4 rounded-3xl border backdrop-blur-xl transition-all duration-500 group animate-in fade-in slide-in-from-bottom-2 
        ${active ? 'scale-[1.03] border-[#004AAE] shadow-2xl z-20' : `shadow-lg border-white/5 hover:border-white/20`} 
        bg-gradient-to-br ${theme.bg} ${theme.glow} hover:-translate-y-1 ${isLight ? 'bg-white/40' : 'bg-[#121212]/80'}`}
    >
      {/* Background Activity Sparkline */}
      <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
        <svg viewBox="0 0 100 40" className="w-full h-full preserve-3d">
          <path 
            d="M0 35 Q 25 30, 40 10 T 70 25 T 100 5 L 100 40 L 0 40 Z" 
            fill={`url(#grad-${color})`} 
            stroke="none"
          />
          <path 
            d="M0 35 Q 25 30, 40 10 T 70 25 T 100 5" 
            className={`${theme.spark} fill-none stroke-[2]`}
          />
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color === 'blue' ? '#3B82F6' : color === 'indigo' ? '#6366F1' : '#10B981'} stopOpacity="0.2" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-2xl bg-white/10 backdrop-blur-md shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${theme.text}`}>
            {icon}
          </div>
          <span className={`text-[9px] font-black px-2.5 py-1 rounded-xl backdrop-blur-md border ${theme.border} ${theme.text} bg-white/5 uppercase tracking-tight shadow-sm`}>
            {trend}
          </span>
        </div>
        
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.15em] opacity-40 mb-1.5 ${isLight ? 'text-gray-950' : 'text-white'}`}>{label}</p>
          <div className="flex items-end justify-between">
            <h4 className={`text-3xl font-black ${isLight ? 'text-gray-950' : 'text-white'} leading-none tracking-tight`}>{value}</h4>
            <div className={`p-2 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 ${theme.text}`}>
              <FiChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Corner Glow */}
      <div className={`absolute -right-4 -bottom-4 w-16 h-16 blur-2xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity bg-current ${theme.text}`} />
    </div>
  );
}

function EmployeeCard({ emp, lastReport, isLight, onClick }) {
  const roleName = emp.position || emp.jobTitle || emp.role || emp.department || "Team Member";
  const avatarUrl = emp.profileImage || emp.image || emp.avatar || emp.userId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name || '')}&backgroundColor=004AAE&textColor=ffffff`;
  
  // Format last report date and snippet
  let reportDateStr = "";
  let reportTasksSnippet = "";
  let reportStatus = "";
  
  if (lastReport) {
    const rDate = new Date(lastReport.date || lastReport.createdAt);
    reportDateStr = isNaN(rDate.getTime()) ? "" : rDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    
    // Extract actual task / working report text from lastReport.report (or fallback keys)
    let rawText = "";
    if (typeof lastReport.report === 'string' && lastReport.report.trim()) {
      rawText = lastReport.report.trim();
    } else if (typeof lastReport.tasksCompleted === 'string' && lastReport.tasksCompleted.trim()) {
      rawText = lastReport.tasksCompleted.trim();
    } else if (Array.isArray(lastReport.tasksCompleted)) {
      rawText = lastReport.tasksCompleted.map(t => typeof t === 'object' ? (t.task || t.title || t.name) : t).filter(Boolean).join(", ");
    } else if (lastReport.tasks && typeof lastReport.tasks === 'string') {
      rawText = lastReport.tasks;
    } else if (lastReport.summary) {
      rawText = lastReport.summary;
    }

    if (rawText) {
      // Clean leading boilerplate like "📊 Daily Activity Report", "today working report...", "Task:", etc.
      let cleaned = rawText
        .replace(/^.*?daily\s*activity\s*report/i, '')
        .replace(/^.*?today['’]?s?\s*working\s*report/i, '')
        .replace(/^[\s\.\-_=]+/g, '')
        .replace(/date:\s*[\d\/\-]+/gi, '')
        .replace(/^task\s*:\s*/i, '')
        .replace(/^[\s\.\-_=]+/g, '')
        .trim();
      reportTasksSnippet = cleaned || rawText;
    }
    
    reportStatus = lastReport.status || (lastReport.isLate ? 'Late' : 'Submitted');
  }

  return (
    <div 
      onClick={onClick} 
      className={`group cursor-pointer p-5 rounded-3xl ${isLight ? 'bg-white border-gray-200 hover:border-blue-500 shadow-md' : 'bg-[#151235]/90 border-white/5 hover:border-[#004AAE]/60 shadow-xl'} border transition-all duration-300 flex flex-col justify-between hover:-translate-y-1`}
    >
      <div>
        {/* Header: Avatar, Name & Designation */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative shrink-0">
            <img 
              src={avatarUrl} 
              className="w-13 h-13 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-[#004AAE]/30 transition-all shadow-md bg-slate-800"
              alt="" 
            />
            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 ${isLight ? 'border-white' : 'border-[#151235]'} ${emp.status === 'inactive' ? 'bg-gray-400' : 'bg-emerald-500'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className={`font-black text-sm uppercase truncate ${isLight ? 'text-gray-900' : 'text-white'} group-hover:text-[#004AAE] transition-colors`}>
              {emp.name?.replace(/\s*User$/i, '')}
            </h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mt-0.5">
              {roleName}
            </p>
          </div>
        </div>

        {/* Last Submitted Report Section */}
        <div className={`p-3 rounded-2xl ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.03] border-white/5'} border mb-3`}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FiFileText size={11} className="text-[#004AAE]" /> Last Report
            </span>
            {lastReport ? (
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                String(reportStatus).toLowerCase() === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                String(reportStatus).toLowerCase() === 'late' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {reportDateStr ? `${reportDateStr} • ${reportStatus}` : reportStatus}
              </span>
            ) : (
              <span className="text-[8px] font-bold uppercase text-slate-500">No Submission</span>
            )}
          </div>

          <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-slate-300'} line-clamp-2 leading-relaxed italic`}>
            {reportTasksSnippet ? `"${reportTasksSnippet}"` : (lastReport ? "Daily progress report submitted" : "No recent activity report recorded")}
          </p>
        </div>
      </div>

      {/* Footer Action: View More Button */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase text-slate-400">
          {emp.department || "Hat Tech Team"}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004AAE]/10 group-hover:bg-[#004AAE] text-[#004AAE] group-hover:!text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
        >
          View More <FiArrowUpRight size={12} />
        </button>
      </div>
    </div>
  );
}

function ProjectCard({ project, isLight, onClick }) {
  const leadName = project.projectHead || project.teamLead || project.assignedTo?.name || "Unassigned Lead";
  const isSubscription = project.projectType === 'monthly_subscription' || project.billingType === 'monthly';

  return (
    <div onClick={onClick} className={`group cursor-pointer p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-indigo-500 transition-all shadow-md flex flex-col justify-between`}>
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
             <FiFolder size={24} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${project.status === 'completed' || project.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-green-500/10 text-green-500'}`}>
              {project.status || 'Active'}
            </span>
            {isSubscription && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                Monthly Subscription
              </span>
            )}
          </div>
        </div>
        <h4 className={`font-bold text-lg mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{project.name || project.title || "Untitled Project"}</h4>
        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{project.description || "Active production initiative"}</p>
      </div>

      <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 border-t border-gray-100 dark:border-[#2d3748] pt-4">
         <span className="flex items-center gap-1.5 text-indigo-400">
           <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
           Lead: {leadName}
         </span>
         <span className="text-indigo-500 font-bold">View Details →</span>
      </div>
    </div>
  );
}
function TaskCard({ task, isLight, onClick }) {
  return (
    <div onClick={onClick} className={`group cursor-pointer p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500 transition-all shadow-md`}>
       <div className="flex justify-between items-center mb-4">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
            <p className={`text-xs font-black text-emerald-500 uppercase tracking-widest`}>Task Logged</p>
         </div>
         <span className="text-[10px] text-gray-400 font-bold">{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "New"}</span>
       </div>
       <h4 className={`font-bold mb-1 truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{task.title}</h4>
       <p className="text-[10px] font-black uppercase text-[#004AAE] mb-4">{task.project?.name || task.project?.title || task.project || "No Project"}</p>
       <div className="w-full bg-gray-100 dark:bg-[#2d3748] h-1.5 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
       </div>
    </div>
  );
}