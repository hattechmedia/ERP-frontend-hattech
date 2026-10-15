// ============================================================
// HATTECH ERP — MOCK API SERVICE
// Replaces axios. Same interface (.get .post .put .delete .patch)
// All data from localStorage via mockDb. Zero network calls.
// ============================================================

import { db, uid, initDb } from './mockDb';
import socket from './socket';

// Initialize DB with seed data on first load
initDb();

// Simulate async delay (makes UI feel realistic)
const delay = (ms = 60) => new Promise(res => setTimeout(res, ms));

// Standard success/error response shapes
const ok = (data, extra = {}) => ({ data: { success: true, ...extra, ...data } });
const okList = (key, items) => ({ data: { success: true, [key]: items, data: items } });
const fail = (message = 'Not found') => { throw { response: { status: 404, data: { success: false, message } } }; };

// ─── Route Handler ────────────────────────────────────────────
async function handle(method, url, body = {}) {
  await delay();

  const path = url.replace(/\?.*$/, ''); // strip query params
  const query = url.includes('?') ? Object.fromEntries(new URLSearchParams(url.split('?')[1])) : {};
  const parts = path.split('/').filter(Boolean);

  // ── AUTH ──────────────────────────────────────────────────
  if (parts[0] === 'auth') {
    if (parts[1] === 'login' && method === 'POST') {
      const { username, password } = body;
      const user = db.users.findByUsername(username);
      if (!user || user.password !== password) fail('Invalid username or password');
      const token = 'mock_token_' + uid();
      return ok({ token, user: { ...user, password: undefined } });
    }
    if (parts[1] === 'register' && method === 'POST') {
      const existing = db.users.findByUsername(body.username || body.email);
      if (existing) fail('Username already exists');
      const newUser = db.users.create({ ...body, role: body.role || 'employee', policyAccepted: false, mustChangePassword: true });
      return ok({ message: 'User registered successfully', user: newUser });
    }
    if (parts[1] === 'forgot-password' && method === 'POST') {
      return ok({ message: 'If your email is registered, a reset code has been sent.' });
    }
    if (parts[1] === 'verify-reset-code' && method === 'POST') {
      return ok({ message: 'Code verified' });
    }
    if (parts[1] === 'reset-password' && method === 'POST') {
      const user = db.users.findByUsername(body.email);
      if (user) db.users.update(user._id, { password: body.newPassword });
      return ok({ message: 'Password reset successfully' });
    }
    if (parts[1] === 'change-password' && method === 'PUT') {
      const currentUser = getCurrentUser();
      if (!currentUser) fail('Not authenticated');
      db.users.update(currentUser._id || currentUser.id, { password: body.newPassword, mustChangePassword: false });
      return ok({ message: 'Password changed successfully' });
    }
    if (parts[1] === 'project-heads') {
      return ok({ data: db.projectHeads.getAll() });
    }
    if (parts[1] === 'users') {
      return ok({ data: db.users.getAll().map(u => ({...u, password: undefined})) });
    }
  }

  // ── EMPLOYEES ──────────────────────────────────────────────
  if (parts[0] === 'employees') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.employees.getAll(), employees: db.employees.getAll() });
      if (method === 'POST') {
        // Also create a user account for the employee
        const newUser = db.users.create({
          username: body.username || body.email?.split('@')[0] || 'emp_' + uid(),
          email: body.email,
          password: body.password || 'hattech123',
          role: body.role?.toLowerCase() || 'employee',
          name: body.name,
        });
        const emp = db.employees.create({ ...body, userId: { _id: newUser._id, role: newUser.role }, documents: [] });
        return ok({ data: emp, message: 'Employee created successfully' });
      }
    }
    if (parts[1] && !parts[2]) {
      const id = parts[1];
      if (method === 'GET') { const e = db.employees.findById(id); if (!e) fail(); return ok({ data: e, employee: e }); }
      if (method === 'PUT' || method === 'PATCH') { const e = db.employees.update(id, body); return ok({ data: e }); }
      if (method === 'DELETE') { db.employees.remove(id); return ok({ message: 'Employee removed' }); }
    }
    if (parts[1] && parts[2] === 'documents') {
      if (method === 'POST') {
        const emp = db.employees.findById(parts[1]);
        if (!emp) fail();
        const doc = { _id: uid(), ...body, createdAt: new Date().toISOString() };
        db.employees.update(parts[1], { documents: [...(emp.documents || []), doc] });
        return ok({ data: doc, message: 'Document added' });
      }
    }
    if (parts[1] && parts[2] === 'documents' && parts[3]) {
      if (method === 'DELETE') {
        const emp = db.employees.findById(parts[1]);
        if (emp) db.employees.update(parts[1], { documents: (emp.documents||[]).filter(d=>d._id!==parts[3]) });
        return ok({ message: 'Document removed' });
      }
    }
  }

  // ── CLIENTS ────────────────────────────────────────────────
  if (parts[0] === 'clients') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.clients.getAll(), clients: db.clients.getAll() });
      if (method === 'POST') {
        const newUser = db.users.create({ username: body.email?.split('@')[0] || 'cl_' + uid(), email: body.email, password: body.password || 'hattech123', role: 'client', name: body.name });
        const cl = db.clients.create({ ...body, userId: { _id: newUser._id }, projects: [] });
        return ok({ data: cl, message: 'Client created' });
      }
    }
    if (parts[1] === 'requests' && parts[2] === 'public') {
      return ok({
        data: {
          _id: parts[3] || 'req_demo',
          clientName: 'David Client',
          serviceName: 'Web Development Consultation',
          status: 'TimeSelectionPending',
          proposedTimes: ['10:00 AM', '02:00 PM', '04:30 PM']
        }
      });
    }
    if (parts[1] === 'confirm-meeting') {
      return ok({
        message: 'Meeting confirmed',
        meetLink: 'https://meet.google.com/abc-defg-hij'
      });
    }
    if (parts[1]) {
      const id = parts[1];
      if (method === 'GET') { const c = db.clients.findById(id); if (!c) fail(); return ok({ data: c, client: c }); }
      if (method === 'PUT' || method === 'PATCH') { const c = db.clients.update(id, body); return ok({ data: c }); }
      if (method === 'DELETE') { db.clients.remove(id); return ok({ message: 'Client removed' }); }
    }
  }

  // ── PROJECTS ───────────────────────────────────────────────
  if (parts[0] === 'projects') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.projects.getAll() });
      if (method === 'POST') { const p = db.projects.create(body); return ok({ data: p, message: 'Project created' }); }
    }
    if (parts[1]) {
      const id = parts[1];
      if (method === 'GET') { const p = db.projects.findById(id); if (!p) fail(); return ok({ data: p, project: p }); }
      if (method === 'PUT' || method === 'PATCH') { const p = db.projects.update(id, body); return ok({ data: p }); }
      if (method === 'DELETE') { db.projects.remove(id); return ok({ message: 'Project removed' }); }
    }
  }

  // ── TASKS ──────────────────────────────────────────────────
  if (parts[0] === 'tasks') {
    if (!parts[1]) {
      if (method === 'GET') {
        const user = getCurrentUser();
        let tasks = db.tasks.getAll();
        if (user?.role === 'employee' || user?.role === 'teamlead' || user?.role === 'intern') {
          const emp = db.employees.findByUserId(user._id || user.id);
          if (emp) tasks = db.tasks.forEmployee(emp._id);
        }
        return ok({ data: tasks, tasks });
      }
      if (method === 'POST') { const t = db.tasks.create(body); return ok({ data: t, task: t }); }
    }
    if (parts[1]) {
      const id = parts[1];
      if (method === 'GET') { const t = db.tasks.findById(id); return ok({ data: t }); }
      if (method === 'PUT' || method === 'PATCH') { const t = db.tasks.update(id, body); return ok({ data: t }); }
      if (method === 'DELETE') { db.tasks.remove(id); return ok({ message: 'Task removed' }); }
    }
  }

  // ── REPORTS ────────────────────────────────────────────────
  if (parts[0] === 'reports') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.reports.getAll(), reports: db.reports.getAll() });
      if (method === 'POST') { const r = db.reports.create(body); return ok({ data: r }); }
    }
    if (parts[1]) {
      if (method === 'PUT' || method === 'PATCH') { const r = db.reports.update(parts[1], body); return ok({ data: r }); }
    }
  }

  // ── ATTENDANCE ─────────────────────────────────────────────
  if (parts[0] === 'attendance') {
    if (method === 'GET') return ok({ data: db.attendance.getAll() });
    if (method === 'POST') { const a = db.attendance.create(body); return ok({ data: a }); }
    if (parts[1] && (method === 'PUT' || method === 'PATCH')) { const a = db.attendance.update(parts[1], body); return ok({ data: a }); }
  }

  // ── PAYROLL ────────────────────────────────────────────────
  if (parts[0] === 'payroll') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.payroll.getAll(), payroll: db.payroll.getAll() });
      if (method === 'POST') { const p = db.payroll.create(body); return ok({ data: p }); }
    }
    if (parts[1]) {
      if (method === 'PUT' || method === 'PATCH') { const p = db.payroll.update(parts[1], body); return ok({ data: p }); }
    }
  }

  // ── ACHIEVEMENTS ───────────────────────────────────────────
  if (parts[0] === 'achievements') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.achievements.getAll() });
      if (method === 'POST') { const a = db.achievements.create(body); return ok({ data: a }); }
    }
    if (parts[1]) {
      if (method === 'PUT' || method === 'PATCH') { const a = db.achievements.update(parts[1], body); return ok({ data: a }); }
      if (method === 'DELETE') { db.achievements.remove(parts[1]); return ok({ message: 'Deleted' }); }
    }
  }

  // ── NOTIFICATIONS ──────────────────────────────────────────
  if (parts[0] === 'notifications') {
    const user = getCurrentUser();
    const userId = user?._id || user?.id || '';
    if (!parts[1]) {
      if (method === 'GET') { const n = db.notifications.forUser(userId); return ok({ data: n, notifications: n, unreadCount: n.filter(x=>!x.read).length }); }
    }
    if (parts[1] === 'read-all') { db.notifications.markAllRead(userId); return ok({ message: 'All marked read' }); }
    if (parts[1] && parts[2] === 'read') { db.notifications.markRead(parts[1]); return ok({ message: 'Marked read' }); }
    if (parts[1] && method === 'DELETE') { return ok({ message: 'Deleted' }); }
  }

  // ── REQUESTS ───────────────────────────────────────────────
  if (parts[0] === 'requests') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.requests.getAll() });
      if (method === 'POST') { const r = db.requests.create(body); return ok({ data: r }); }
    }
    if (parts[1]) {
      if (method === 'PUT' || method === 'PATCH') { const r = db.requests.update(parts[1], body); return ok({ data: r }); }
      if (method === 'DELETE') { db.requests.remove(parts[1]); return ok({ message: 'Deleted' }); }
    }
  }

  // ── BOOKINGS ───────────────────────────────────────────────
  if (parts[0] === 'bookings') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.bookings.getAll() });
      if (method === 'POST') { const b = db.bookings.create(body); return ok({ data: b }); }
    }
    if (parts[1]) {
      if (method === 'PUT' || method === 'PATCH') { const b = db.bookings.update(parts[1], body); return ok({ data: b }); }
      if (method === 'DELETE') { db.bookings.remove(parts[1]); return ok({ message: 'Deleted' }); }
    }
  }

  // ── ANNOUNCEMENTS ──────────────────────────────────────────
  if (parts[0] === 'announcements') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.announcements.getAll() });
      if (method === 'POST') { const a = db.announcements.create(body); return ok({ data: a }); }
    }
    if (parts[1]) {
      if (method === 'PUT' || method === 'PATCH') { const a = db.announcements.update(parts[1], body); return ok({ data: a }); }
      if (method === 'DELETE') { db.announcements.remove(parts[1]); return ok({ message: 'Deleted' }); }
    }
  }

  // ── POLICIES / GOVERNANCE ──────────────────────────────────
  if (parts[0] === 'policies' || parts[0] === 'governance') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.policies.getAll() });
      if (method === 'POST') { const p = db.policies.create(body); return ok({ data: p }); }
    }
    if (parts[1]) {
      if (method === 'GET') { const p = db.policies.findById(parts[1]); return ok({ data: p }); }
      if (method === 'PUT' || method === 'PATCH') { const p = db.policies.update(parts[1], body); return ok({ data: p }); }
      if (method === 'DELETE') { db.policies.remove(parts[1]); return ok({ message: 'Deleted' }); }
    }
  }

  // ── NOTES ─────────────────────────────────────────────────
  if (parts[0] === 'notes') {
    const user = getCurrentUser();
    const userId = user?._id || user?.id || '';
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.notes.forUser(userId) });
      if (method === 'POST') { const n = db.notes.create({ ...body, userId }); return ok({ data: n }); }
    }
    if (parts[1]) {
      if (method === 'PUT' || method === 'PATCH') { const n = db.notes.update(parts[1], body); return ok({ data: n }); }
      if (method === 'DELETE') { db.notes.remove(parts[1]); return ok({ message: 'Deleted' }); }
    }
  }

  // ── PARTNERS ───────────────────────────────────────────────
  if (parts[0] === 'partners' || parts[0] === 'business-partners') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.partners.getAll() });
      if (method === 'POST') { const p = db.partners.create(body); return ok({ data: p }); }
    }
    if (parts[1]) {
      if (method === 'GET') { const p = db.partners.findById(parts[1]); return ok({ data: p }); }
      if (method === 'PUT' || method === 'PATCH') { const p = db.partners.update(parts[1], body); return ok({ data: p }); }
      if (method === 'DELETE') { db.partners.remove(parts[1]); return ok({ message: 'Deleted' }); }
    }
  }

  // ── SUBSCRIPTIONS ──────────────────────────────────────────
  if (parts[0] === 'subscriptions') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.subscriptions.getAll() });
      if (method === 'POST') { const s = db.subscriptions.create(body); return ok({ data: s }); }
    }
    if (parts[1]) {
      if (method === 'PUT' || method === 'PATCH') { const s = db.subscriptions.update(parts[1], body); return ok({ data: s }); }
      if (method === 'DELETE') { db.subscriptions.remove(parts[1]); return ok({ message: 'Deleted' }); }
    }
  }

  // ── INTERACTIONS ───────────────────────────────────────────
  if (parts[0] === 'interactions') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.interactions.getAll() });
      if (method === 'POST') { const i = db.interactions.create(body); return ok({ data: i }); }
    }
    if (parts[1]) {
      if (method === 'PUT' || method === 'PATCH') { const i = db.interactions.update(parts[1], body); return ok({ data: i }); }
      if (method === 'DELETE') { db.interactions.remove(parts[1]); return ok({ message: 'Deleted' }); }
    }
  }

  // ── ACTIVITIES ─────────────────────────────────────────────
  if (parts[0] === 'activities') {
    if (parts[1] === 'heartbeat' && method === 'POST') return ok({ message: 'ok' });
    if (method === 'GET') {
      const date = query.date || new Date().toISOString().slice(0, 10);
      return ok({ data: db.activities.forDate(date), activities: db.activities.forDate(date) });
    }
    if (method === 'POST') { const a = db.activities.create(body); return ok({ data: a }); }
  }

  // ── GOOGLE EVENTS (stub) ───────────────────────────────────
  if (parts[0] === 'google-events') {
    return ok({ events: [], connected: false });
  }

  // ── PROFILE ────────────────────────────────────────────────
  if (parts[0] === 'profile') {
    const user = getCurrentUser();
    if (!user) fail('Not authenticated');
    const role = (user.role || '').toLowerCase();

    if (method === 'GET') {
      let profileData = { ...user, password: undefined, googleConnected: false };

      if (role === 'employee' || role === 'teamlead' || role === 'intern' || role === 'projecthead' || role === 'hr') {
        const emp = db.employees.findByUserId(user._id || user.id);
        if (emp) profileData = { ...profileData, ...emp };
      } else if (role === 'client') {
        const cl = db.clients.findByUserId(user._id || user.id);
        if (cl) profileData = { ...profileData, ...cl };
      } else if (role === 'partner') {
        const pt = db.partners.findByUserId(user._id || user.id);
        if (pt) profileData = { ...profileData, ...pt };
      }

      return ok({ profile: profileData, data: profileData });
    }

    if (method === 'PUT' || method === 'PATCH') {
      db.users.update(user._id || user.id, body);
      // Also update employee/client record if exists
      if (role === 'employee' || role === 'teamlead' || role === 'intern' || role === 'projecthead' || role === 'hr') {
        const emp = db.employees.findByUserId(user._id || user.id);
        if (emp) db.employees.update(emp._id, body);
      } else if (role === 'client') {
        const cl = db.clients.findByUserId(user._id || user.id);
        if (cl) db.clients.update(cl._id, body);
      }
      // Update sessionStorage
      const stored = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      sessionStorage.setItem('currentUser', JSON.stringify({ ...stored, ...body }));
      return ok({ message: 'Profile updated', data: { ...user, ...body } });
    }
  }

  // ── HR ROUTES ──────────────────────────────────────────────
  if (parts[0] === 'hr') {
    if (parts[1] === 'config' && parts[2] === 'working_days') {
      if (method === 'GET') return ok({ data: { value: db.workingDays.get() } });
      if (method === 'PUT' || method === 'POST') { db.workingDays.set(body); return ok({ data: body }); }
    }
    if (parts[1] === 'reports' && parts[2] === 'scoring') {
      const month = query.month || '';
      return ok({ data: db.scoring.get(month) });
    }
    if (parts[1] === 'employees') {
      if (method === 'GET') return ok({ data: db.employees.getAll() });
    }
    if (parts[1] === 'attendance') {
      if (method === 'GET') return ok({ data: db.attendance.getAll() });
    }
    if (parts[1] === 'payroll') {
      if (method === 'GET') return ok({ data: db.payroll.getAll() });
    }
    if (parts[1] === 'documents') {
      if (method === 'GET') return ok({ data: db.hrDocs.getAll() });
      if (method === 'POST') { const d = db.hrDocs.create(body); return ok({ data: d }); }
    }
    if (parts[1] === 'reports' && !parts[2]) {
      if (method === 'GET') return ok({ data: db.reports.getAll(), reports: db.reports.getAll() });
    }
  }

  // ── SOCIAL ANALYTICS (stub) ────────────────────────────────
  if (parts[0] === 'social-analytics' || parts[0] === 'analytics') {
    return ok({ data: { followers: 12500, engagement: 4.2, reach: 45000, posts: 128 } });
  }

  // ── HIERARCHY ──────────────────────────────────────────────
  if (parts[0] === 'hierarchy') {
    return ok({ data: db.employees.getAll() });
  }

  // ── FINANCE ────────────────────────────────────────────────
  if (parts[0] === 'finance') {
    if (parts[1] === 'income') {
      if (method === 'GET') return ok({ data: db.finance.income.getAll() });
      if (method === 'POST') { const i = db.finance.income.create(body); return ok({ data: i }); }
      if (parts[2] && (method === 'PUT' || method === 'PATCH')) { const i = db.finance.income.update(parts[2], body); return ok({ data: i }); }
      if (parts[2] && method === 'DELETE') { db.finance.income.remove(parts[2]); return ok({ message: 'Deleted' }); }
    }
    if (parts[1] === 'expense' || parts[1] === 'expenses') {
      if (method === 'GET') return ok({ data: db.finance.expense.getAll() });
      if (method === 'POST') { const e = db.finance.expense.create(body); return ok({ data: e }); }
      if (parts[2] && (method === 'PUT' || method === 'PATCH')) { const e = db.finance.expense.update(parts[2], body); return ok({ data: e }); }
      if (parts[2] && method === 'DELETE') { db.finance.expense.remove(parts[2]); return ok({ message: 'Deleted' }); }
    }
    if (parts[1] === 'accounts') {
      if (method === 'GET') return ok({ data: db.finance.accounts.getAll() });
      if (method === 'POST') { const a = db.finance.accounts.create(body); return ok({ data: a }); }
      if (parts[2] && (method === 'PUT' || method === 'PATCH')) { const a = db.finance.accounts.update(parts[2], body); return ok({ data: a }); }
      if (parts[2] && method === 'DELETE') { db.finance.accounts.remove(parts[2]); return ok({ message: 'Deleted' }); }
    }
    if (parts[1] === 'payroll') {
      if (method === 'GET') return ok({ data: db.finance.payroll.getAll() });
      if (method === 'POST') { const p = db.finance.payroll.create(body); return ok({ data: p }); }
      if (parts[2] && (method === 'PUT' || method === 'PATCH')) { const p = db.finance.payroll.update(parts[2], body); return ok({ data: p }); }
    }
    if (parts[1] === 'dashboard' || parts[1] === 'summary') {
      const income = db.finance.income.getAll().reduce((s, i) => s + (i.amount || 0), 0);
      const expense = db.finance.expense.getAll().reduce((s, e) => s + (e.amount || 0), 0);
      return ok({ data: { totalIncome: income, totalExpense: expense, netProfit: income - expense, cashBalance: 850000, pendingPayables: 120000, pendingReceivables: 85000 } });
    }
  }

  // ── INCOME / EXPENSE top-level (legacy) ────────────────────
  if (parts[0] === 'income') {
    if (method === 'GET') return ok({ data: db.finance.income.getAll() });
    if (method === 'POST') { const i = db.finance.income.create(body); return ok({ data: i }); }
    if (parts[1] && method === 'DELETE') { db.finance.income.remove(parts[1]); return ok({ message: 'Deleted' }); }
    if (parts[1] && (method === 'PUT' || method === 'PATCH')) { const i = db.finance.income.update(parts[1], body); return ok({ data: i }); }
  }
  if (parts[0] === 'expenses') {
    if (method === 'GET') return ok({ data: db.finance.expense.getAll() });
    if (method === 'POST') { const e = db.finance.expense.create(body); return ok({ data: e }); }
    if (parts[1] && method === 'DELETE') { db.finance.expense.remove(parts[1]); return ok({ message: 'Deleted' }); }
    if (parts[1] && (method === 'PUT' || method === 'PATCH')) { const e = db.finance.expense.update(parts[1], body); return ok({ data: e }); }
  }

  // ── ACCEPT POLICY ──────────────────────────────────────────
  if (parts[0] === 'accept-policy' || (parts[0] === 'auth' && parts[1] === 'accept-policy')) {
    const user = getCurrentUser();
    if (user) {
      db.users.update(user._id || user.id, { policyAccepted: true, policyAcceptedAt: new Date().toISOString() });
      const stored = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      sessionStorage.setItem('currentUser', JSON.stringify({ ...stored, policyAccepted: true, policyAcceptedAt: new Date().toISOString() }));
    }
    return ok({ message: 'Policy accepted' });
  }

  // ── UPLOAD (stub - returns placeholder) ────────────────────
  if (parts[0] === 'upload') {
    return ok({ url: '', message: 'File upload not available in demo mode' });
  }

  // ── PARTNER PROJECTS ───────────────────────────────────────
  if (parts[0] === 'partner') {
    if (parts[1] === 'projects') {
      const user = getCurrentUser();
      const partner = db.partners.findByUserId(user?._id || user?.id);
      if (!partner) return ok({ data: [] });
      const projs = partner.projects?.map(pid => db.projects.findById(pid)).filter(Boolean) || [];
      return ok({ data: projs });
    }
    if (parts[1] === 'requests') {
      return ok({ data: db.requests.getAll() });
    }
  }

  // ── CLIENT PROJECTS ────────────────────────────────────────
  if (parts[0] === 'client') {
    const user = getCurrentUser();
    const cl = db.clients.findByUserId(user?._id || user?.id);
    if (parts[1] === 'projects') return ok({ data: cl ? db.projects.forClient(cl._id) : [] });
    if (parts[1] === 'requests') return ok({ data: cl ? db.requests.getAll() : [] });
  }

  // ── SEARCH ─────────────────────────────────────────────────
  if (parts[0] === 'search') {
    const q = (query.q || '').toLowerCase();
    if (!q) return ok({ data: [] });
    const empResults = db.employees.getAll()
      .filter(e => e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q))
      .map(e => ({ id: e._id, name: e.name, type: 'employee', subtitle: e.position }));
    const projResults = db.projects.getAll()
      .filter(p => p.title?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q))
      .map(p => ({ id: p._id, name: p.title || p.name, type: 'project', subtitle: p.status }));
    const clientResults = db.clients.getAll()
      .filter(c => c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q))
      .map(c => ({ id: c._id, name: c.name, type: 'client', subtitle: c.company }));
    return ok({ data: [...empResults, ...projResults, ...clientResults] });
  }

  // ── PETTY CASH / REPLENISH (stub) ──────────────────────────
  if (parts[0] === 'petty-cash' || parts[0] === 'replenish') {
    return ok({ data: { balance: 50000 }, message: 'ok' });
  }

  // ── PAYABLE / RECEIVABLE ───────────────────────────────────
  if (parts[0] === 'payable' || parts[0] === 'accounts-payable') {
    if (method === 'GET') return ok({ data: db.finance.accounts.getAll().filter(a => a.type === 'payable') });
    if (method === 'POST') { const a = db.finance.accounts.create({ ...body, type: 'payable' }); return ok({ data: a }); }
  }
  if (parts[0] === 'receivable' || parts[0] === 'accounts-receivable') {
    if (method === 'GET') return ok({ data: db.finance.accounts.getAll().filter(a => a.type === 'receivable') });
    if (method === 'POST') { const a = db.finance.accounts.create({ ...body, type: 'receivable' }); return ok({ data: a }); }
  }

  // ── BALANCE SHEET / LEDGER / STATEMENT ────────────────────
  if (parts[0] === 'balance-sheet' || parts[0] === 'ledger' || parts[0] === 'statement') {
    const income = db.finance.income.getAll().reduce((s,i) => s + (Number(i.amount)||0), 0);
    const expense = db.finance.expense.getAll().reduce((s,e) => s + (Number(e.amount)||0), 0);
    return ok({ data: { totalIncome: income, totalExpense: expense, netProfit: income - expense, assets: 1200000, liabilities: 350000, equity: 850000 } });
  }

  // ── CHATS ──────────────────────────────────────────────────
  if (parts[0] === 'chats') {
    if (!parts[1]) {
      if (method === 'GET') return ok({ data: db.chats.getAll() });
    }
    if (parts[1] === 'general') {
      return ok({ data: db.chats.getGeneral() });
    }
    if (parts[1] === 'project' && parts[2]) {
      return ok({ data: db.chats.getProject(parts[2]) });
    }
    if (parts[1] === 'unread' && parts[2] === 'count') {
      return ok({ count: 0, breakdown: {} });
    }
    if (parts[1] && parts[2] === 'messages') {
      const chatId = parts[1];
      if (method === 'GET') {
        return ok({ data: db.messages.forChat(chatId) });
      }
      if (method === 'POST') {
        const user = getCurrentUser() || { _id: 'u_admin', name: 'Admin', role: 'admin' };
        const newMsg = db.messages.create({
          chatId,
          content: body.content,
          sender: {
            _id: user._id || user.id,
            name: user.name || user.username || 'User',
            role: user.role || 'user',
            avatar: user.avatar || ''
          },
          readBy: [user._id || user.id],
          createdAt: new Date().toISOString()
        });
        // Trigger live in-app socket delivery
        socket.trigger('new_message', newMsg);
        return ok({ data: newMsg, message: 'Message sent' });
      }
    }
    if (parts[1] && parts[2] === 'read') {
      const user = getCurrentUser();
      if (user) db.messages.markChatRead(parts[1], user._id || user.id);
      return ok({ message: 'Marked read' });
    }
  }

  // ── RELATED NOTIFICATIONS READ ─────────────────────────────
  if (parts[0] === 'notifications' && parts[1] === 'related' && parts[3] === 'read') {
    return ok({ message: 'Marked read' });
  }

  // ── ADMIN AI CHAT QUERY ────────────────────────────────────
  if (parts[0] === 'admin' && parts[1] === 'ai-chat' && parts[2] === 'query') {
    const q = (body.query || '').toLowerCase();
    let reply = "I am analyzing your company's records. Everything looks organized and on schedule!";
    let actionExecuted = null;
    let matchedEmployee = null;

    if (q.includes("warning") && (q.includes("send") || q.includes("issue") || q.includes("bhej"))) {
      actionExecuted = "WARNING_LETTER_ISSUED";
      reply = `**Warning Letter Issued Successfully**\n* The official warning record has been generated and filed.\n* Reason: Missing reports / attendance non-compliance.\n* Notification sent to employee's dashboard.`;
    } else if (q.includes("warning") && (q.includes("remove") || q.includes("revoke") || q.includes("delete"))) {
      actionExecuted = "WARNING_LETTER_REMOVED";
      reply = `**Warning Revoked**\n* The previous warning letter has been cleared from the records.\n* Employee status restored to good standing.`;
    } else if (q.includes("report") || q.includes("daily")) {
      const reports = db.reports.getAll();
      reply = `**Daily Reports Summary**\n* Total reports submitted this month: **${reports.length}**\n* Active team members reporting: **John Employee**, **Jane Smith**, **Ahmad SEO**\n* Average completion rating: **94%**`;
    } else if (q.includes("attendance") || q.includes("late")) {
      reply = `**Attendance Overview**\n* Average team punctuality: **92%**\n* Most punctual employee this month: **John Employee** (18/18 on time)\n* Zero unexplained absences recorded.`;
    } else {
      reply = `**HAT-TECH ERP Assistant**\n* **Active Employees:** ${db.employees.getAll().filter(e=>e.status==='active').length}\n* **Active Projects:** ${db.projects.getAll().filter(p=>p.status!=='Completed').length}\n* **System Status:** 100% Operational (Local Demo Mode)`;
    }

    return ok({ reply, actionExecuted, matchedEmployee });
  }

  // ── CATCH-ALL: return empty success ────────────────────────
  console.warn(`[MockAPI] Unhandled: ${method} ${url}`);
  return ok({ data: [], message: 'ok' });
}

// ─── Get current logged-in user from sessionStorage ──────────
function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem('currentUser')); } catch { return null; }
}

// ─── Mock API Object (same interface as axios) ────────────────
const api = {
  get: (url) => handle('GET', url),
  post: (url, data = {}) => handle('POST', url, data),
  put: (url, data = {}) => handle('PUT', url, data),
  patch: (url, data = {}) => handle('PATCH', url, data),
  delete: (url) => handle('DELETE', url),
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
  defaults: { headers: { common: {} } },
};

export default api;
