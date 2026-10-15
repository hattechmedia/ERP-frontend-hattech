// ============================================================
// HATTECH ERP — MOCK DATABASE (localStorage-based)
// Tailored for European & German Market (Expo Showcase Ready)
// Currency: EUR (€) | High-Resolution Headshots | Dynamic Month/Date Filtering
// ============================================================

const KEYS = {
  USERS: 'ht_users',
  EMPLOYEES: 'ht_employees',
  CLIENTS: 'ht_clients',
  PROJECTS: 'ht_projects',
  TASKS: 'ht_tasks',
  REPORTS: 'ht_reports',
  ATTENDANCE: 'ht_attendance',
  PAYROLL: 'ht_payroll',
  NOTIFICATIONS: 'ht_notifications',
  ACHIEVEMENTS: 'ht_achievements',
  REQUESTS: 'ht_requests',
  BOOKINGS: 'ht_bookings',
  ANNOUNCEMENTS: 'ht_announcements',
  POLICIES: 'ht_policies',
  NOTES: 'ht_notes',
  PARTNERS: 'ht_partners',
  FINANCE_INCOME: 'ht_finance_income',
  FINANCE_EXPENSE: 'ht_finance_expense',
  FINANCE_ACCOUNTS: 'ht_finance_accounts',
  FINANCE_PAYROLL: 'ht_finance_payroll',
  SUBSCRIPTIONS: 'ht_subscriptions',
  INTERACTIONS: 'ht_interactions',
  ACTIVITIES: 'ht_activities',
  WORKING_DAYS: 'ht_working_days',
  HR_DOCS: 'ht_hr_docs',
  CHATS: 'ht_chats',
  MESSAGES: 'ht_messages',
  INITIALIZED: 'ht_initialized_v10_empty',
};

// ─── Helpers ────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const now = () => new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString();

// Verified professional corporate headshot photos
const AVATARS = {
  lukas: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  sarah: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  maximilian: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  hanna: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  sophie: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  leon: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  felix: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  jonas: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
  katharina: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
  markus: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  christian: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
  elena: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
};

// ─── Seed Data (Empty Clean State - Fully Functional CRUD) ─────
const SEED_USERS = [
  { _id: 'u_admin', id: 'u_admin', username: 'admin', email: 'admin@hattech.com', password: 'admin123', role: 'admin', name: 'Admin User', designation: 'Administrator', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_hr1', id: 'u_hr1', username: 'hr1', email: 'hr@hattech.com', password: 'hr123', role: 'hr', name: 'HR Manager', designation: 'HR Manager', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_ph1', id: 'u_ph1', username: 'ph1', email: 'ph@hattech.com', password: 'ph123', role: 'projecthead', name: 'Project Head', designation: 'Project Head', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_emp1', id: 'u_emp1', username: 'emp1', email: 'emp1@hattech.com', password: 'emp123', role: 'employee', name: 'Employee User', designation: 'Employee', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_finance1', id: 'u_finance1', username: 'finance1', email: 'finance@hattech.com', password: 'finance123', role: 'finance', name: 'Finance Manager', designation: 'Finance Manager', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_client1', id: 'u_client1', username: 'client1', email: 'client@hattech.com', password: 'client123', role: 'client', name: 'Client User', designation: 'Client', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_partner1', id: 'u_partner1', username: 'partner1', email: 'partner@hattech.com', password: 'partner123', role: 'partner', name: 'Partner User', designation: 'Partner', mustChangePassword: false, policyAccepted: true },
];

const SEED_EMPLOYEES = [];
const SEED_CLIENTS = [];
const SEED_PROJECTS = [];
const SEED_TASKS = [];
const SEED_REPORTS = [];
const SEED_ATTENDANCE = [];
const SEED_PAYROLL = [];
const SEED_ACHIEVEMENTS = [];
const SEED_NOTIFICATIONS = [];
const SEED_REQUESTS = [];
const SEED_BOOKINGS = [];
const SEED_ANNOUNCEMENTS = [];
const SEED_POLICIES = [];
const SEED_PARTNERS = [];
const SEED_FINANCE_INCOME = [];
const SEED_FINANCE_EXPENSE = [];
const SEED_SUBSCRIPTIONS = [];
const SEED_INTERACTIONS = [];
const SEED_ACTIVITIES = [];
const SEED_WORKING_DAYS = {
  sunday: false, monday: true, tuesday: true, wednesday: true,
  thursday: true, friday: true, saturday: false,
  nonWorkingDates: [], holidayDescriptions: {}
};
const SEED_HR_DOCS = [];
const SEED_CHATS = [
  { _id: 'chat_general', id: 'chat_general', type: 'general', name: 'General Hub', members: ['u_admin'] }
];
const SEED_MESSAGES = [];

// ─── Dynamic Scoring Generator per Month ────────────────────
// Generates varying, realistic metrics based on the selected month
export const generateScoringData = (employees, monthQuery) => {
  let monthNum = 10; // Default October
  let yearNum = 2026;
  if (monthQuery && typeof monthQuery === 'string') {
    const parts = monthQuery.split('-');
    if (parts.length >= 2) {
      yearNum = parseInt(parts[0]) || 2026;
      monthNum = parseInt(parts[1]) || 10;
    }
  }

  // Calculate working days in that month (Mon-Fri)
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const totalWorkingDays = Math.round(daysInMonth * (5 / 7));

  const eligibleEmps = employees.filter(e => e.status === 'active' && !['admin', 'hr', 'it_support'].includes(e.role));
  const count = eligibleEmps.length || 1;

  // Rotate top winner deterministically per month so expo presentations show dynamic change!
  const winnerIndex = (monthNum + yearNum) % count;
  const runnerUpIndex = (winnerIndex + 1) % count;

  return eligibleEmps.map((emp, i) => {
    // Relative rank offset for this specific month
    const rankOffset = (i - winnerIndex + count) % count;
    const isWinner = rankOffset === 0;
    const isRunnerUp = rankOffset === 1;

    // Realistic monthly numbers
    const presentDays = Math.max(16, totalWorkingDays - rankOffset - (monthNum % 2));
    const lateDays = Math.min(3, Math.max(0, rankOffset - 1));
    const reportsSubmitted = Math.max(15, presentDays - (rankOffset % 2));

    // Base score calculations
    const attendanceScore = Math.min(75, Math.round((presentDays / totalWorkingDays) * 75));
    const punctualityScore = Math.max(10, 20 - (lateDays * 4));
    const reportScore = Math.min(45, Math.round((reportsSubmitted / totalWorkingDays) * 45));
    const milestoneScore = Math.max(15, 30 - (rankOffset * 3));
    const totalScore = attendanceScore + punctualityScore + reportScore + milestoneScore;

    return {
      employeeId: emp._id,
      id: emp._id,
      name: emp.name,
      department: emp.department,
      avatar: emp.image || null,
      month: monthQuery,
      presentDays,
      totalWorkingDays,
      lateDays,
      reportsSubmitted,
      isEmployeeOfTheMonth: isWinner,
      isEmployeeOf6Months: isRunnerUp,
      bonusPercentage: isWinner ? 10 : (isRunnerUp ? 5 : 0),
      scores: {
        attendance: attendanceScore,
        reports: reportScore,
        milestones: milestoneScore,
        punctuality: punctualityScore,
        total: totalScore,
      }
    };
  });
};

// ─── Initialize Database ─────────────────────────────────────
export const initDb = (force = false) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  const isInit = localStorage.getItem(KEYS.INITIALIZED);
  if (!force && isInit === 'true') {
    return;
  }
  localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
  localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(SEED_EMPLOYEES));
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(SEED_CLIENTS));
  localStorage.setItem(KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
  localStorage.setItem(KEYS.TASKS, JSON.stringify(SEED_TASKS));
  localStorage.setItem(KEYS.REPORTS, JSON.stringify(SEED_REPORTS));
  localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(SEED_ATTENDANCE));
  localStorage.setItem(KEYS.PAYROLL, JSON.stringify(SEED_PAYROLL));
  localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(SEED_ACHIEVEMENTS));
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
  localStorage.setItem(KEYS.REQUESTS, JSON.stringify(SEED_REQUESTS));
  localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
  localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(SEED_ANNOUNCEMENTS));
  localStorage.setItem(KEYS.POLICIES, JSON.stringify(SEED_POLICIES));
  localStorage.setItem(KEYS.NOTES, JSON.stringify([]));
  localStorage.setItem(KEYS.PARTNERS, JSON.stringify(SEED_PARTNERS));
  localStorage.setItem(KEYS.FINANCE_INCOME, JSON.stringify(SEED_FINANCE_INCOME));
  localStorage.setItem(KEYS.FINANCE_EXPENSE, JSON.stringify(SEED_FINANCE_EXPENSE));
  localStorage.setItem(KEYS.FINANCE_ACCOUNTS, JSON.stringify([]));
  localStorage.setItem(KEYS.FINANCE_PAYROLL, JSON.stringify(SEED_PAYROLL));
  localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(SEED_SUBSCRIPTIONS));
  localStorage.setItem(KEYS.INTERACTIONS, JSON.stringify(SEED_INTERACTIONS));
  localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
  localStorage.setItem(KEYS.WORKING_DAYS, JSON.stringify(SEED_WORKING_DAYS));
  localStorage.setItem(KEYS.HR_DOCS, JSON.stringify(SEED_HR_DOCS));
  localStorage.setItem(KEYS.CHATS, JSON.stringify(SEED_CHATS));
  localStorage.setItem(KEYS.MESSAGES, JSON.stringify(SEED_MESSAGES));

  // Clear existing finance caches
  localStorage.removeItem('hattech_income_list');
  localStorage.removeItem('hattech_expense_list');
  localStorage.removeItem('hattech_payroll_list');
  localStorage.removeItem('hattech_ar_list');
  localStorage.removeItem('hattech_ap_list');
  localStorage.removeItem('hattech_accounts_list');

  localStorage.setItem(KEYS.INITIALIZED, 'true');
};

// Auto-run on script import
initDb();

// ─── CRUD Helpers ────────────────────────────────────────────
const getAll = (key) => {
  try {
    initDb();
    let data = JSON.parse(localStorage.getItem(key));
    if ((!data || (Array.isArray(data) && data.length === 0)) && key === KEYS.USERS) {
      initDb(true);
      data = JSON.parse(localStorage.getItem(key));
    }
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
const getObj = (key) => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } };
const setAll = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const findById = (key, id) => getAll(key).find(i => String(i._id || i.id) === String(id));
const create = (key, data) => {
  const items = getAll(key);
  const newItem = { ...data, _id: uid(), id: uid(), createdAt: now(), updatedAt: now() };
  setAll(key, [...items, newItem]);
  return newItem;
};
const update = (key, id, data) => {
  const items = getAll(key);
  const idx = items.findIndex(i => String(i._id || i.id) === String(id));
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...data, updatedAt: now() };
  setAll(key, items);
  return items[idx];
};
const remove = (key, id) => {
  const items = getAll(key);
  setAll(key, items.filter(i => String(i._id || i.id) !== String(id)));
};

// ─── DB API (exported) ───────────────────────────────────────
export const db = {
  // Users
  users: {
    getAll: () => getAll(KEYS.USERS),
    findByUsername: (u) => {
      initDb();
      const clean = String(u || '').trim().toLowerCase();
      if (!clean) return null;
      const allUsers = getAll(KEYS.USERS);
      return allUsers.find(x =>
        String(x.username || '').trim().toLowerCase() === clean ||
        String(x.email || '').trim().toLowerCase() === clean
      );
    },
    findById: (id) => findById(KEYS.USERS, id),
    create: (data) => create(KEYS.USERS, data),
    update: (id, data) => update(KEYS.USERS, id, data),
  },
  // Employees
  employees: {
    getAll: () => getAll(KEYS.EMPLOYEES),
    findById: (id) => findById(KEYS.EMPLOYEES, id),
    findByUserId: (uid) => getAll(KEYS.EMPLOYEES).find(e => String(e.userId?._id || e.userId) === String(uid)),
    create: (data) => create(KEYS.EMPLOYEES, data),
    update: (id, data) => update(KEYS.EMPLOYEES, id, data),
    remove: (id) => remove(KEYS.EMPLOYEES, id),
  },
  // Clients
  clients: {
    getAll: () => getAll(KEYS.CLIENTS),
    findById: (id) => findById(KEYS.CLIENTS, id),
    findByUserId: (uid) => getAll(KEYS.CLIENTS).find(c => String(c.userId?._id || c.userId) === String(uid)),
    create: (data) => create(KEYS.CLIENTS, data),
    update: (id, data) => update(KEYS.CLIENTS, id, data),
    remove: (id) => remove(KEYS.CLIENTS, id),
  },
  // Projects
  projects: {
    getAll: () => getAll(KEYS.PROJECTS),
    findById: (id) => findById(KEYS.PROJECTS, id),
    create: (data) => create(KEYS.PROJECTS, data),
    update: (id, data) => update(KEYS.PROJECTS, id, data),
    remove: (id) => remove(KEYS.PROJECTS, id),
    forClient: (clientId) => getAll(KEYS.PROJECTS).filter(p => String(p.clientId?._id || p.clientId) === String(clientId)),
    forEmployee: (empId) => getAll(KEYS.PROJECTS).filter(p => (p.assignedEmployees || []).includes(String(empId))),
  },
  // Tasks
  tasks: {
    getAll: () => getAll(KEYS.TASKS),
    findById: (id) => findById(KEYS.TASKS, id),
    forEmployee: (empId) => getAll(KEYS.TASKS).filter(t => String(t.assignedTo?._id || t.assignedTo) === String(empId)),
    forProject: (projId) => getAll(KEYS.TASKS).filter(t => String(t.projectId) === String(projId)),
    create: (data) => create(KEYS.TASKS, data),
    update: (id, data) => update(KEYS.TASKS, id, data),
    remove: (id) => remove(KEYS.TASKS, id),
  },
  // Reports
  reports: {
    getAll: () => getAll(KEYS.REPORTS),
    findById: (id) => findById(KEYS.REPORTS, id),
    forUser: (userId) => getAll(KEYS.REPORTS).filter(r => String(r.userId?._id || r.userId) === String(userId)),
    create: (data) => create(KEYS.REPORTS, data),
    update: (id, data) => update(KEYS.REPORTS, id, data),
  },
  // Attendance
  attendance: {
    getAll: () => getAll(KEYS.ATTENDANCE),
    forEmployee: (empId) => getAll(KEYS.ATTENDANCE).filter(a => String(a.employeeId) === String(empId)),
    forUser: (userId) => getAll(KEYS.ATTENDANCE).filter(a => String(a.userId) === String(userId)),
    create: (data) => create(KEYS.ATTENDANCE, data),
    update: (id, data) => update(KEYS.ATTENDANCE, id, data),
  },
  // Payroll
  payroll: {
    getAll: () => getAll(KEYS.PAYROLL),
    forEmployee: (empId) => getAll(KEYS.PAYROLL).filter(p => String(p.employeeId) === String(empId)),
    create: (data) => create(KEYS.PAYROLL, data),
    update: (id, data) => update(KEYS.PAYROLL, id, data),
  },
  // Achievements
  achievements: {
    getAll: () => getAll(KEYS.ACHIEVEMENTS),
    create: (data) => create(KEYS.ACHIEVEMENTS, data),
    update: (id, data) => update(KEYS.ACHIEVEMENTS, id, data),
    remove: (id) => remove(KEYS.ACHIEVEMENTS, id),
  },
  // Notifications
  notifications: {
    getAll: () => getAll(KEYS.NOTIFICATIONS),
    forUser: (userId) => getAll(KEYS.NOTIFICATIONS).filter(n => n.userId === userId || n.userId === 'all'),
    markRead: (id) => update(KEYS.NOTIFICATIONS, id, { read: true }),
    markAllRead: (userId) => {
      const items = getAll(KEYS.NOTIFICATIONS).map(n => n.userId === userId ? { ...n, read: true } : n);
      setAll(KEYS.NOTIFICATIONS, items);
    },
    create: (data) => create(KEYS.NOTIFICATIONS, data),
  },
  // Requests
  requests: {
    getAll: () => getAll(KEYS.REQUESTS),
    forEmployee: (empId) => getAll(KEYS.REQUESTS).filter(r => String(r.employeeId) === String(empId)),
    create: (data) => create(KEYS.REQUESTS, data),
    update: (id, data) => update(KEYS.REQUESTS, id, data),
    remove: (id) => remove(KEYS.REQUESTS, id),
  },
  // Bookings
  bookings: {
    getAll: () => getAll(KEYS.BOOKINGS),
    create: (data) => create(KEYS.BOOKINGS, data),
    update: (id, data) => update(KEYS.BOOKINGS, id, data),
    remove: (id) => remove(KEYS.BOOKINGS, id),
  },
  // Announcements
  announcements: {
    getAll: () => getAll(KEYS.ANNOUNCEMENTS),
    create: (data) => create(KEYS.ANNOUNCEMENTS, data),
    update: (id, data) => update(KEYS.ANNOUNCEMENTS, id, data),
    remove: (id) => remove(KEYS.ANNOUNCEMENTS, id),
  },
  // Policies
  policies: {
    getAll: () => getAll(KEYS.POLICIES),
    findById: (id) => findById(KEYS.POLICIES, id),
    create: (data) => create(KEYS.POLICIES, data),
    update: (id, data) => update(KEYS.POLICIES, id, data),
    remove: (id) => remove(KEYS.POLICIES, id),
  },
  // Notes
  notes: {
    getAll: () => getAll(KEYS.NOTES),
    forUser: (userId) => getAll(KEYS.NOTES).filter(n => String(n.userId) === String(userId)),
    create: (data) => create(KEYS.NOTES, data),
    update: (id, data) => update(KEYS.NOTES, id, data),
    remove: (id) => remove(KEYS.NOTES, id),
  },
  // Partners
  partners: {
    getAll: () => getAll(KEYS.PARTNERS),
    findById: (id) => findById(KEYS.PARTNERS, id),
    findByUserId: (uid) => getAll(KEYS.PARTNERS).find(p => String(p.userId?._id || p.userId) === String(uid)),
    create: (data) => create(KEYS.PARTNERS, data),
    update: (id, data) => update(KEYS.PARTNERS, id, data),
    remove: (id) => remove(KEYS.PARTNERS, id),
  },
  // Finance
  finance: {
    income: { getAll: () => getAll(KEYS.FINANCE_INCOME), create: (d) => create(KEYS.FINANCE_INCOME, d), update: (id,d) => update(KEYS.FINANCE_INCOME, id, d), remove: (id) => remove(KEYS.FINANCE_INCOME, id) },
    expense: { getAll: () => getAll(KEYS.FINANCE_EXPENSE), create: (d) => create(KEYS.FINANCE_EXPENSE, d), update: (id,d) => update(KEYS.FINANCE_EXPENSE, id, d), remove: (id) => remove(KEYS.FINANCE_EXPENSE, id) },
    accounts: { getAll: () => getAll(KEYS.FINANCE_ACCOUNTS), create: (d) => create(KEYS.FINANCE_ACCOUNTS, d), update: (id,d) => update(KEYS.FINANCE_ACCOUNTS, id, d), remove: (id) => remove(KEYS.FINANCE_ACCOUNTS, id) },
    payroll: { getAll: () => getAll(KEYS.FINANCE_PAYROLL), create: (d) => create(KEYS.FINANCE_PAYROLL, d), update: (id,d) => update(KEYS.FINANCE_PAYROLL, id, d) },
  },
  // Subscriptions
  subscriptions: {
    getAll: () => getAll(KEYS.SUBSCRIPTIONS),
    forClient: (id) => getAll(KEYS.SUBSCRIPTIONS).filter(s => String(s.clientId) === String(id)),
    create: (data) => create(KEYS.SUBSCRIPTIONS, data),
    update: (id, data) => update(KEYS.SUBSCRIPTIONS, id, data),
    remove: (id) => remove(KEYS.SUBSCRIPTIONS, id),
  },
  // Interactions
  interactions: {
    getAll: () => getAll(KEYS.INTERACTIONS),
    create: (data) => create(KEYS.INTERACTIONS, data),
    update: (id, data) => update(KEYS.INTERACTIONS, id, data),
    remove: (id) => remove(KEYS.INTERACTIONS, id),
  },
  // Activities (Dynamically reacts to selected date!)
  activities: {
    getAll: () => getAll(KEYS.ACTIVITIES),
    forDate: (selectedDate) => {
      const emps = getAll(KEYS.EMPLOYEES).filter(e => e.status === 'active');
      const seed = selectedDate ? selectedDate.split('-').reduce((acc, part) => acc + (parseInt(part, 10) || 0), 0) : 42;
      return emps.map((emp, idx) => {
        const isOnline = (seed + idx) % 4 !== 0;
        const duration = Math.min(540, Math.max(160, ((seed * 19 + idx * 47) % 460) + 120));
        const checkInHour = 8 + ((seed + idx) % 2);
        const checkInMin = String((seed * 7 + idx * 11) % 55).padStart(2, '0');
        return {
          _id: `act_${emp._id}_${selectedDate}`,
          userId: emp.userId || { _id: `u_${emp._id}` },
          employeeId: emp._id,
          date: selectedDate,
          checkIn: `0${checkInHour}:${checkInMin}`,
          lastHeartbeat: isOnline ? new Date().toISOString() : new Date(Date.now() - 3600000 * ((idx % 3) + 1)).toISOString(),
          duration,
          status: isOnline ? 'online' : 'offline'
        };
      });
    },
    create: (data) => create(KEYS.ACTIVITIES, data),
    update: (id, data) => update(KEYS.ACTIVITIES, id, data),
  },
  // Working Days Config
  workingDays: {
    get: () => getObj(KEYS.WORKING_DAYS),
    set: (data) => setAll(KEYS.WORKING_DAYS, data),
  },
  // HR Docs
  hrDocs: {
    getAll: () => getAll(KEYS.HR_DOCS),
    create: (data) => create(KEYS.HR_DOCS, data),
    update: (id, data) => update(KEYS.HR_DOCS, id, data),
    remove: (id) => remove(KEYS.HR_DOCS, id),
  },
  // Scoring: dynamically recalculates per selected month!
  scoring: {
    get: (monthQuery) => {
      const emps = getAll(KEYS.EMPLOYEES);
      return generateScoringData(emps, monthQuery);
    }
  },
  // Project Heads
  projectHeads: {
    getAll: () => getAll(KEYS.EMPLOYEES).filter(e => ['projecthead','hr','it_support'].includes(e.role)),
  },
  // Chats & Messages
  chats: {
    getAll: () => getAll(KEYS.CHATS),
    findById: (id) => findById(KEYS.CHATS, id),
    getGeneral: () => findById(KEYS.CHATS, 'chat_general') || { _id: 'chat_general', id: 'chat_general', name: 'General Hub (Berlin)' },
    getProject: (projId) => findById(KEYS.CHATS, projId) || { _id: projId, id: projId, name: 'Project Chat' },
  },
  messages: {
    forChat: (chatId) => getAll(KEYS.MESSAGES).filter(m => String(m.chatId) === String(chatId)),
    create: (data) => create(KEYS.MESSAGES, data),
    markChatRead: (chatId, userId) => {
      const msgs = getAll(KEYS.MESSAGES).map(m => {
        if (String(m.chatId) === String(chatId) && !m.readBy?.includes(userId)) {
          return { ...m, readBy: [...(m.readBy || []), userId] };
        }
        return m;
      });
      setAll(KEYS.MESSAGES, msgs);
    }
  }
};

export default db;
