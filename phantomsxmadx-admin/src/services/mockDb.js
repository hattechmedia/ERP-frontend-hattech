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
  INITIALIZED: 'ht_initialized_v7',
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

// ─── Seed Data (European / German Market) ─────────────────────
const SEED_USERS = [
  { _id: 'u_admin', id: 'u_admin', username: 'admin', email: 'admin@hattech.de', password: 'admin123', role: 'admin', name: 'Lukas Weber', designation: 'Managing Director & CEO', avatar: AVATARS.lukas, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_admin2', id: 'u_admin2', username: 'admin2', email: 'c.schneider@hattech.de', password: 'admin123', role: 'admin', name: 'Claudia Schneider', designation: 'Chief Technology Officer (CTO)', avatar: AVATARS.katharina, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_hr1', id: 'u_hr1', username: 'hr1', email: 'hr@hattech.de', password: 'hr123', role: 'hr', name: 'Sarah Lindemann', avatar: AVATARS.sarah, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_ph1', id: 'u_ph1', username: 'ph1', email: 'ph@hattech.de', password: 'ph123', role: 'projecthead', name: 'Maximilian Richter', avatar: AVATARS.maximilian, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_emp1', id: 'u_emp1', username: 'emp1', email: 'emp1@hattech.de', password: 'emp123', role: 'employee', name: 'Hanna Schmidt', avatar: AVATARS.hanna, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_emp2', id: 'u_emp2', username: 'emp2', email: 'emp2@hattech.de', password: 'emp123', role: 'employee', name: 'Sophie Fischer', avatar: AVATARS.sophie, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_emp3', id: 'u_emp3', username: 'emp3', email: 'emp3@hattech.de', password: 'emp123', role: 'teamlead', name: 'Leon Becker', avatar: AVATARS.leon, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_emp4', id: 'u_emp4', username: 'emp4', email: 'emp4@hattech.de', password: 'emp123', role: 'intern', name: 'Felix Hoffmann', avatar: AVATARS.felix, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_emp5', id: 'u_emp5', username: 'emp5', email: 'emp5@hattech.de', password: 'emp123', role: 'employee', name: 'Jonas Wagner', avatar: AVATARS.jonas, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_client1', id: 'u_client1', username: 'client1', email: 'client1@bmw-mobility.de', password: 'client123', role: 'client', name: 'Dr. Christian Wolf', avatar: AVATARS.christian, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_client2', id: 'u_client2', username: 'client2', email: 'client2@siemens-mobility.de', password: 'client123', role: 'client', name: 'Elena Krause', avatar: AVATARS.elena, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_finance1', id: 'u_finance1', username: 'finance1', email: 'finance@hattech.de', password: 'finance123', role: 'finance', name: 'Markus Braun', avatar: AVATARS.markus, mustChangePassword: false, policyAccepted: true },
  { _id: 'u_partner1', id: 'u_partner1', username: 'partner1', email: 'partner@techventures.de', password: 'partner123', role: 'partner', name: 'TechVentures Berlin', avatar: AVATARS.lukas, mustChangePassword: false, policyAccepted: true },
];

const SEED_EMPLOYEES = [
  { _id: 'emp_1', id: 'emp_1', name: 'Hanna Schmidt', email: 'emp1@hattech.de', userId: { _id: 'u_emp1', role: 'employee', avatar: AVATARS.hanna }, role: 'employee', position: 'Web Developer', subcategory: 'Frontend Developer', department: 'Engineering', phone: '+49 30 5200 4110', status: 'active', joining: daysAgo(420), image: AVATARS.hanna, bio: 'Senior React & TypeScript Specialist', documents: [], projectHead: 'emp_ph1', salary: 6200 },
  { _id: 'emp_2', id: 'emp_2', name: 'Sophie Fischer', email: 'emp2@hattech.de', userId: { _id: 'u_emp2', role: 'employee', avatar: AVATARS.sophie }, role: 'employee', position: 'Graphic Designer', subcategory: 'UI/UX Designer', department: 'Design', phone: '+49 30 5200 4112', status: 'active', joining: daysAgo(340), image: AVATARS.sophie, bio: 'Lead Product & Design Systems Designer', documents: [], projectHead: 'emp_ph1', salary: 5600 },
  { _id: 'emp_3', id: 'emp_3', name: 'Leon Becker', email: 'emp3@hattech.de', userId: { _id: 'u_emp3', role: 'teamlead', avatar: AVATARS.leon }, role: 'teamlead', position: 'Web Developer', subcategory: 'Full Stack Developer', department: 'Engineering', phone: '+49 30 5200 4115', status: 'active', joining: daysAgo(600), image: AVATARS.leon, bio: 'Engineering Lead & Cloud Architect', documents: [], salary: 7800 },
  { _id: 'emp_4', id: 'emp_4', name: 'Felix Hoffmann', email: 'emp4@hattech.de', userId: { _id: 'u_emp4', role: 'intern', avatar: AVATARS.felix }, role: 'intern', position: 'Intern', subcategory: 'AI ML', department: 'AI & Data Lab', phone: '+49 30 5200 4119', status: 'active', joining: daysAgo(75), image: AVATARS.felix, bio: 'Machine Learning & NLP Intern', documents: [], salary: 2100 },
  { _id: 'emp_5', id: 'emp_5', name: 'Jonas Wagner', email: 'emp5@hattech.de', userId: { _id: 'u_emp5', role: 'employee', avatar: AVATARS.jonas }, role: 'employee', position: 'QA Engineer', subcategory: 'Automation QA', department: 'Engineering', phone: '+49 30 5200 4122', status: 'active', joining: daysAgo(290), image: AVATARS.jonas, bio: 'DevOps & Test Automation Engineer', documents: [], salary: 5400 },
  { _id: 'emp_6', id: 'emp_6', name: 'Katharina Klein', email: 'emp6@hattech.de', userId: { _id: 'u_emp6', role: 'employee', avatar: AVATARS.katharina }, role: 'employee', position: 'Content Writer', subcategory: 'Technical Writer', department: 'Marketing', phone: '+49 30 5200 4125', status: 'inactive', joining: daysAgo(700), image: AVATARS.katharina, bio: 'Technical Documentation Lead (Alumni)', documents: [], salary: 4800 },
  { _id: 'emp_ph1', id: 'emp_ph1', name: 'Maximilian Richter', email: 'ph@hattech.de', userId: { _id: 'u_ph1', role: 'projecthead', avatar: AVATARS.maximilian }, role: 'projecthead', position: 'Manager', subcategory: 'Project Head', department: 'Management', phone: '+49 30 5200 4102', status: 'active', joining: daysAgo(650), image: AVATARS.maximilian, bio: 'VP of Engineering & Delivery', documents: [], salary: 8900 },
  { _id: 'emp_hr1', id: 'emp_hr1', name: 'Sarah Lindemann', email: 'hr@hattech.de', userId: { _id: 'u_hr1', role: 'hr', avatar: AVATARS.sarah }, role: 'hr', position: 'Manager', subcategory: 'HR Manager', department: 'People & Culture', phone: '+49 30 5200 4105', status: 'active', joining: daysAgo(480), image: AVATARS.sarah, bio: 'Director of People & Operations', documents: [], salary: 7200 },
];

const SEED_CLIENTS = [
  { _id: 'cl_1', id: 'cl_1', name: 'Dr. Christian Wolf', email: 'client1@bmw-mobility.de', userId: { _id: 'u_client1' }, company: 'BMW Group Innovation Hub (Munich)', phone: '+49 89 382 0', country: 'Germany', status: 'active', image: AVATARS.christian, projects: ['proj_1'], createdAt: daysAgo(200) },
  { _id: 'cl_2', id: 'cl_2', name: 'Elena Krause', email: 'client2@siemens-mobility.de', userId: { _id: 'u_client2' }, company: 'Siemens Mobility Systems (Berlin)', phone: '+49 30 386 0', country: 'Germany', status: 'active', image: AVATARS.elena, projects: ['proj_2'], createdAt: daysAgo(150) },
  { _id: 'cl_3', id: 'cl_3', name: 'Stefan Meyer', email: 's.meyer@telekom-cloud.de', userId: null, company: 'Deutsche Telekom Digital (Frankfurt)', phone: '+49 69 2165 0', country: 'Germany', status: 'active', image: AVATARS.maximilian, projects: ['proj_3'], createdAt: daysAgo(90) },
];

const SEED_PROJECTS = [
  { _id: 'proj_1', id: 'proj_1', title: 'Autonomous EV Fleet Telematics', name: 'Autonomous EV Fleet Telematics', clientId: { _id: 'cl_1', name: 'Dr. Christian Wolf', email: 'client1@bmw-mobility.de' }, status: 'In Progress', priority: 'High', deadline: daysFromNow(45), startDate: daysAgo(60), description: 'High-throughput telemetry ingestion & monitoring for next-gen electric vehicles.', budget: 95000, currency: 'EUR', assignedEmployees: ['emp_1', 'emp_3'], technologies: ['React', 'Node.js', 'Kafka', 'Docker'], progress: 68, createdAt: daysAgo(60) },
  { _id: 'proj_2', id: 'proj_2', title: 'Smart Transit Dispatch Engine', name: 'Smart Transit Dispatch Engine', clientId: { _id: 'cl_2', name: 'Elena Krause', email: 'client2@siemens-mobility.de' }, status: 'In Progress', priority: 'High', deadline: daysFromNow(60), startDate: daysAgo(25), description: 'AI-assisted schedule dispatch & track health diagnostics for European rail corridors.', budget: 135000, currency: 'EUR', assignedEmployees: ['emp_1', 'emp_2', 'emp_5'], technologies: ['TypeScript', 'FastAPI', 'Python', 'PostgreSQL'], progress: 35, createdAt: daysAgo(25) },
  { _id: 'proj_3', id: 'proj_3', title: 'Enterprise Cloud Grid Analytics', name: 'Enterprise Cloud Grid Analytics', clientId: { _id: 'cl_3', name: 'Stefan Meyer' }, status: 'Completed', priority: 'Medium', deadline: daysAgo(10), startDate: daysAgo(90), description: 'Real-time multi-region cloud latency monitoring and carbon intensity visualization.', budget: 68000, currency: 'EUR', assignedEmployees: ['emp_3', 'emp_5'], technologies: ['Kubernetes', 'Go', 'Prometheus', 'Grafana'], progress: 100, createdAt: daysAgo(90) },
  { _id: 'proj_4', id: 'proj_4', title: 'Digital Design System 2.0', name: 'Digital Design System 2.0', clientId: { _id: 'cl_1', name: 'Dr. Christian Wolf' }, status: 'In Progress', priority: 'Medium', deadline: daysFromNow(20), startDate: daysAgo(15), description: 'Unified accessible corporate component library compliant with EU WCAG 2.1 AA.', budget: 42000, currency: 'EUR', assignedEmployees: ['emp_2'], technologies: ['Figma', 'TailwindCSS', 'Storybook'], progress: 55, createdAt: daysAgo(15) },
];

const SEED_TASKS = [
  { _id: 'task_1', id: 'task_1', title: 'Implement WebSocket Telemetry Stream', description: 'Stream vehicle sensor events with under 50ms latency', projectId: 'proj_1', assignedTo: { _id: 'emp_1', name: 'Hanna Schmidt' }, assignedBy: { _id: 'u_admin', name: 'Lukas Weber' }, status: 'In Progress', priority: 'High', deadline: daysFromNow(5), createdAt: daysAgo(8) },
  { _id: 'task_2', id: 'task_2', title: 'Design Battery Health Gauges', description: 'Interactive SVG components for battery degradation metrics', projectId: 'proj_1', assignedTo: { _id: 'emp_2', name: 'Sophie Fischer' }, assignedBy: { _id: 'u_admin', name: 'Lukas Weber' }, status: 'Completed', priority: 'Medium', deadline: daysAgo(2), createdAt: daysAgo(12) },
  { _id: 'task_3', id: 'task_3', title: 'Kafka Cluster Partitioning', description: 'Optimize partition scheme for 100k events/sec', projectId: 'proj_1', assignedTo: { _id: 'emp_3', name: 'Leon Becker' }, assignedBy: { _id: 'emp_ph1', name: 'Maximilian Richter' }, status: 'Completed', priority: 'High', deadline: daysAgo(3), createdAt: daysAgo(18) },
  { _id: 'task_4', id: 'task_4', title: 'Rail Schedule Dispatch UI', description: 'Build interactive timetable Gantt chart', projectId: 'proj_2', assignedTo: { _id: 'emp_1', name: 'Hanna Schmidt' }, assignedBy: { _id: 'emp_ph1', name: 'Maximilian Richter' }, status: 'In Progress', priority: 'High', deadline: daysFromNow(8), createdAt: daysAgo(6) },
  { _id: 'task_5', id: 'task_5', title: 'E2E Cypress Automation Suite', description: 'Cover all critical user booking and tracking flows', projectId: 'proj_2', assignedTo: { _id: 'emp_5', name: 'Jonas Wagner' }, assignedBy: { _id: 'emp_ph1', name: 'Maximilian Richter' }, status: 'Pending', priority: 'Medium', deadline: daysFromNow(12), createdAt: daysAgo(4) },
  { _id: 'task_6', id: 'task_6', title: 'Carbon Footprint Calculator Model', description: 'Train XGBoost regression for kilowatt estimation', projectId: 'proj_3', assignedTo: { _id: 'emp_4', name: 'Felix Hoffmann' }, assignedBy: { _id: 'emp_ph1', name: 'Maximilian Richter' }, status: 'Completed', priority: 'High', deadline: daysAgo(15), createdAt: daysAgo(45) },
];

const SEED_REPORTS = [
  { _id: 'rep_1', userId: { _id: 'u_emp1', name: 'Hanna Schmidt' }, date: daysAgo(1), content: 'Engineered high-frequency sensor buffer and tested live telemetry with Munich test bench. Zero packet drops observed.', tasksCompleted: ['Telemetry pipeline optimized', 'Unit tests passing 100%'], hoursWorked: 8, status: 'submitted', createdAt: daysAgo(1) },
  { _id: 'rep_2', userId: { _id: 'u_emp2', name: 'Sophie Fischer' }, date: daysAgo(1), content: 'Finalized dark mode color tokens and accessible contrast scales for the vehicle dashboard.', tasksCompleted: ['WCAG AA compliance verified', 'Figma handoff completed'], hoursWorked: 7.5, status: 'submitted', createdAt: daysAgo(1) },
  { _id: 'rep_3', userId: { _id: 'u_emp3', name: 'Leon Becker' }, date: daysAgo(1), content: 'Completed Terraform manifests for multi-zone Kubernetes deployment on AWS Frankfurt region (eu-central-1).', tasksCompleted: ['Terraform modules updated', 'Ingress certificates verified'], hoursWorked: 8.5, status: 'submitted', createdAt: daysAgo(1) },
];

const SEED_ATTENDANCE = [
  { _id: 'att_1', employeeId: 'emp_1', userId: 'u_emp1', date: daysAgo(0).slice(0,10), checkIn: '08:50', checkOut: '17:30', status: 'present', late: false },
  { _id: 'att_2', employeeId: 'emp_2', userId: 'u_emp2', date: daysAgo(0).slice(0,10), checkIn: '09:05', checkOut: '17:45', status: 'present', late: false },
  { _id: 'att_3', employeeId: 'emp_3', userId: 'u_emp3', date: daysAgo(0).slice(0,10), checkIn: '08:45', checkOut: '18:00', status: 'present', late: false },
  { _id: 'att_4', employeeId: 'emp_5', userId: 'u_emp5', date: daysAgo(0).slice(0,10), checkIn: '09:00', checkOut: '17:30', status: 'present', late: false },
];

const SEED_PAYROLL = [
  { _id: 'pay_1', employeeId: 'emp_1', employeeName: 'Hanna Schmidt', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basicSalary: 6200, bonus: 600, deductions: 200, netSalary: 6600, status: 'paid', paidOn: daysAgo(4), currency: 'EUR' },
  { _id: 'pay_2', employeeId: 'emp_2', employeeName: 'Sophie Fischer', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basicSalary: 5600, bonus: 400, deductions: 150, netSalary: 5850, status: 'paid', paidOn: daysAgo(4), currency: 'EUR' },
  { _id: 'pay_3', employeeId: 'emp_3', employeeName: 'Leon Becker', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basicSalary: 7800, bonus: 800, deductions: 300, netSalary: 8300, status: 'paid', paidOn: daysAgo(4), currency: 'EUR' },
  { _id: 'pay_4', employeeId: 'emp_5', employeeName: 'Jonas Wagner', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basicSalary: 5400, bonus: 350, deductions: 150, netSalary: 5600, status: 'paid', paidOn: daysAgo(4), currency: 'EUR' },
];

const SEED_ACHIEVEMENTS = [
  { _id: 'ach_1', user: { _id: 'u_emp1', name: 'Hanna Schmidt', department: 'Engineering', position: 'Web Developer', avatar: AVATARS.hanna }, awardType: 'Employee of the Month', title: 'Top Performer of the Month', description: 'Exceptional contributions to the BMW EV Telematics delivery.', date: daysAgo(10), score: 98, createdAt: daysAgo(10) },
  { _id: 'ach_2', user: { _id: 'u_emp3', name: 'Leon Becker', department: 'Engineering', position: 'Full Stack Developer', avatar: AVATARS.leon }, awardType: 'Employee of 6 Months', title: 'Lead Architect of 6 Months', description: 'Engineered zero-downtime infrastructure for enterprise rail corridors.', date: daysAgo(30), score: 95, createdAt: daysAgo(30) },
];

const SEED_NOTIFICATIONS = [
  { _id: 'notif_1', userId: 'u_admin', title: 'Sprint Milestone Achieved', message: 'BMW EV Telematics Sprint 3 passed all validation checks.', type: 'info', read: false, createdAt: daysAgo(1) },
  { _id: 'notif_2', userId: 'u_admin', title: 'New Enterprise Lead', message: 'Siemens Mobility requested technical review for Corridor Phase 2.', type: 'warning', read: false, createdAt: daysAgo(0) },
  { _id: 'notif_3', userId: 'u_emp1', title: 'Code Review Approved', message: 'Your PR for telemetry event buffering was approved by Leon Becker.', type: 'info', read: false, createdAt: daysAgo(1) },
];

const SEED_REQUESTS = [
  { _id: 'req_1', employeeId: 'emp_1', employeeName: 'Hanna Schmidt', type: 'Leave', reason: 'European Tech Summit Conference (Munich)', fromDate: daysFromNow(5), toDate: daysFromNow(7), status: 'approved', createdAt: daysAgo(2) },
  { _id: 'req_2', employeeId: 'emp_2', employeeName: 'Sophie Fischer', type: 'Work From Home', reason: 'Design Sprint Deep Work Day', fromDate: daysFromNow(1), toDate: daysFromNow(1), status: 'approved', createdAt: daysAgo(1) },
  { _id: 'req_3', employeeId: 'emp_5', employeeName: 'Jonas Wagner', type: 'Leave', reason: 'Personal Leave', fromDate: daysFromNow(10), toDate: daysFromNow(12), status: 'pending', createdAt: daysAgo(1) },
];

const SEED_BOOKINGS = [
  { _id: 'book_1', clientName: 'Dr. Christian Wolf', clientEmail: 'client1@bmw-mobility.de', service: 'IoT Telematics Architecture Review', date: daysFromNow(2), time: '14:00 CET', status: 'confirmed', notes: 'Quarterly review with BMW engineering directors', createdAt: daysAgo(2) },
  { _id: 'book_2', clientName: 'Elena Krause', clientEmail: 'client2@siemens-mobility.de', service: 'Transit Cloud Architecture Consultation', date: daysFromNow(4), time: '10:30 CET', status: 'pending', notes: 'Discuss Phase 2 corridor deployment', createdAt: daysAgo(1) },
];

const SEED_ANNOUNCEMENTS = [
  { _id: 'ann_1', title: 'Berlin Innovation Hub All-Hands', message: 'Quarterly all-hands presentation this Thursday at 15:00 CET. Hybrid attendance via Berlin office & stream.', postedBy: 'Lukas Weber (CEO)', type: 'event', createdAt: daysAgo(1), expiresAt: daysFromNow(7) },
  { _id: 'ann_2', title: 'German Unity Day Office Schedule', message: 'The Berlin office will observe the official national holiday on October 3. Support rotations remain active.', postedBy: 'Sarah Lindemann (HR)', type: 'holiday', createdAt: daysAgo(3), expiresAt: daysFromNow(20) },
];

const SEED_POLICIES = [
  { _id: 'pol_1', title: 'Flexible Hybrid Work Policy (Germany)', content: '## Flexible Work Guidelines\n\nAll permanent team members can work remotely up to 3 days per week with core collaboration hours between 10:00 - 15:00 CET.\n\n### Work from EU/EEA\nEmployees may work from any EU member state for up to 30 days per calendar year with prior notification.', category: 'Workplace', version: '2.1', effectiveDate: daysAgo(90), createdAt: daysAgo(90) },
  { _id: 'pol_2', title: 'Annual Leave & Wellness (Federal Holidays)', content: '## Paid Leave Provisions\n\nFull-time contracts include 30 days of paid annual vacation plus official Berlin public holidays.\n\n### Application Procedure\n- Submit requests via ERP at least 5 business days in advance.\n- Medical absence certificates (AU-Bescheinigung) required after day 3.', category: 'HR & Benefits', version: '2.0', effectiveDate: daysAgo(180), createdAt: daysAgo(180) },
  { _id: 'pol_3', title: 'GDPR & Corporate IT Security Standards', content: '## Data Protection & Security\n\nStrict compliance with EU General Data Protection Regulation (GDPR) and ISO 27001.\n\n- Zero customer telemetry stored unencrypted.\n- Multi-factor authentication (MFA) mandatory on all enterprise tools.\n- Report any potential data incident immediately to security@hattech.de.', category: 'Compliance', version: '3.0', effectiveDate: daysAgo(365), createdAt: daysAgo(365) },
];

const SEED_PARTNERS = [
  { _id: 'part_1', id: 'part_1', name: 'TechVentures Berlin GmbH', email: 'partner@techventures.de', userId: { _id: 'u_partner1' }, company: 'TechVentures Capital & Consulting', phone: '+49 30 2000 8800', country: 'Germany', status: 'active', partnerType: 'Venture & Strategy', commissionRate: 8, projects: ['proj_1', 'proj_2'], createdAt: daysAgo(180) },
  { _id: 'part_2', id: 'part_2', name: 'Munich Digital Cloud Labs', email: 'hello@munich-cloud.de', userId: null, company: 'Munich Cloud Systems UG', phone: '+49 89 4400 9900', country: 'Germany', status: 'active', partnerType: 'Cloud Infrastructure', commissionRate: 6, projects: ['proj_3'], createdAt: daysAgo(120) },
];

const SEED_FINANCE_INCOME = [
  { _id: 'inc_1', source: 'BMW Connected Mobility', amount: 47500, currency: 'EUR', date: daysAgo(4), category: 'Milestone Payment', client: 'BMW Group', description: 'Milestone 2 - Telemetry ingestion engine completion', status: 'received' },
  { _id: 'inc_2', source: 'Siemens Mobility Tech', amount: 45000, currency: 'EUR', date: daysAgo(12), category: 'Project Payment', client: 'Siemens Mobility', description: 'Initial corridor architecture delivery', status: 'received' },
  { _id: 'inc_3', source: 'Deutsche Telekom Digital', amount: 34000, currency: 'EUR', date: daysAgo(22), category: 'Project Payment', client: 'Deutsche Telekom', description: 'Final cloud analytics deployment & acceptance', status: 'received' },
  { _id: 'inc_4', source: 'BMW Connected Mobility', amount: 21000, currency: 'EUR', date: daysAgo(2), category: 'Maintainence Support Payment', client: 'BMW Group', description: 'Q3 Enterprise SLA & Dedicated Support', status: 'received' },
];

const SEED_FINANCE_EXPENSE = [
  { _id: 'exp_1', title: 'Berlin Office Lease (Leipziger Platz)', amount: 8500, currency: 'EUR', date: daysAgo(5), category: 'Rent', description: 'Monthly workspace lease - Berlin Innovation Center', status: 'paid' },
  { _id: 'exp_2', title: 'Core Engineering Payroll', amount: 33500, currency: 'EUR', date: daysAgo(5), category: 'Salary Expense', description: 'Monthly engineering, design, and management compensation', status: 'paid' },
  { _id: 'exp_3', title: 'AWS Cloud Infrastructure (Frankfurt)', amount: 3400, currency: 'EUR', date: daysAgo(2), category: 'Software', description: 'AWS eu-central-1 dedicated clusters, RDS & bandwidth', status: 'paid' },
  { _id: 'exp_4', title: 'Enterprise Software & Security Licenses', amount: 1850, currency: 'EUR', date: daysAgo(8), category: 'Software', description: 'GitHub Enterprise, Figma Org, JetBrains, Datadog', status: 'paid' },
];

const SEED_SUBSCRIPTIONS = [
  { _id: 'sub_1', clientId: 'cl_1', clientName: 'BMW Group Innovation Hub', plan: 'Enterprise SLA', amount: 7500, currency: 'EUR', billingCycle: 'monthly', startDate: daysAgo(90), nextBillingDate: daysFromNow(20), status: 'active', services: ['24/7 Priority Support', 'Dedicated DevOps Lead', 'Multi-Region Ingestion'] },
  { _id: 'sub_2', clientId: 'cl_2', clientName: 'Siemens Mobility Systems', plan: 'Professional Rail Support', amount: 4800, currency: 'EUR', billingCycle: 'monthly', startDate: daysAgo(45), nextBillingDate: daysFromNow(15), status: 'active', services: ['Automated Health Probes', 'Quarterly Security Audit'] },
];

const SEED_INTERACTIONS = [
  { _id: 'int_1', clientId: 'cl_1', clientName: 'Dr. Christian Wolf', interactionType: 'meeting', title: 'Telemetry Fleet Review (Munich / Virtual)', date: daysFromNow(2), time: '14:00 CET', notes: 'Review latency metrics under high traffic simulation', status: 'scheduled', createdAt: daysAgo(2) },
  { _id: 'int_2', clientId: 'cl_2', clientName: 'Elena Krause', interactionType: 'call', title: 'Siemens Transit Integration Sync', date: daysFromNow(3), time: '11:00 CET', notes: 'Verify telemetry endpoints on rail test corridor', status: 'scheduled', createdAt: daysAgo(1) },
];

const SEED_ACTIVITIES = [
  { _id: 'act_1', userId: { _id: 'u_emp1' }, employeeId: 'emp_1', date: new Date().toISOString().slice(0,10), checkIn: '08:50', lastHeartbeat: new Date().toISOString(), duration: 490, status: 'online' },
  { _id: 'act_2', userId: { _id: 'u_emp2' }, employeeId: 'emp_2', date: new Date().toISOString().slice(0,10), checkIn: '09:05', lastHeartbeat: new Date().toISOString(), duration: 460, status: 'online' },
  { _id: 'act_3', userId: { _id: 'u_emp3' }, employeeId: 'emp_3', date: new Date().toISOString().slice(0,10), checkIn: '08:45', lastHeartbeat: new Date().toISOString(), duration: 510, status: 'online' },
  { _id: 'act_4', userId: { _id: 'u_emp5' }, employeeId: 'emp_5', date: new Date().toISOString().slice(0,10), checkIn: '09:00', lastHeartbeat: new Date(Date.now() - 3600000).toISOString(), duration: 420, status: 'offline' },
];

const SEED_WORKING_DAYS = {
  sunday: false, monday: true, tuesday: true, wednesday: true,
  thursday: true, friday: true, saturday: false,
  nonWorkingDates: [], holidayDescriptions: {}
};

const SEED_HR_DOCS = [
  { _id: 'doc_1', title: 'Employee Handbook (German Labor Compliant)', description: 'Comprehensive guide covering German employment standards, benefits, and workplace norms.', category: 'Policy', fileUrl: '', uploadedBy: 'Sarah Lindemann', uploadedAt: daysAgo(30) },
  { _id: 'doc_2', title: 'Corporate Compensation & Bonus Guidelines', description: 'Transparent salary bands, bonus matrix, and equity participation framework.', category: 'Finance', fileUrl: '', uploadedBy: 'Sarah Lindemann', uploadedAt: daysAgo(60) },
  { _id: 'doc_3', title: 'Annual Leave Application Form (EU)', description: 'Standard form for requesting vacation or educational leaves.', category: 'Forms', fileUrl: '', uploadedBy: 'Sarah Lindemann', uploadedAt: daysAgo(90) },
];

const SEED_CHATS = [
  { _id: 'chat_general', id: 'chat_general', type: 'general', name: 'General Hub (Berlin)', members: ['u_admin', 'u_emp1', 'u_emp2', 'u_emp3', 'u_hr1'] },
  { _id: 'proj_1', id: 'proj_1', type: 'project', name: 'BMW Fleet Telematics', members: ['u_admin', 'u_emp1', 'u_emp3'] },
  { _id: 'proj_2', id: 'proj_2', type: 'project', name: 'Siemens Smart Transit', members: ['u_admin', 'u_emp1', 'u_emp2', 'u_emp5'] },
];

const SEED_MESSAGES = [
  { _id: 'msg_1', chatId: 'chat_general', sender: { _id: 'u_admin', name: 'Lukas Weber', role: 'admin', avatar: AVATARS.lukas }, content: 'Welcome to the Hattech Engineering Hub! All project updates, sprint milestones, and queries can be posted here.', readBy: ['u_admin'], createdAt: daysAgo(2) },
  { _id: 'msg_2', chatId: 'chat_general', sender: { _id: 'u_emp1', name: 'Hanna Schmidt', role: 'employee', avatar: AVATARS.hanna }, content: 'Telemetry pipeline for BMW fleet just passed performance benchmarking. Super smooth run today!', readBy: ['u_admin', 'u_emp1'], createdAt: daysAgo(1) },
  { _id: 'msg_3', chatId: 'proj_1', sender: { _id: 'u_admin', name: 'Lukas Weber', role: 'admin', avatar: AVATARS.lukas }, content: 'Next sprint review with BMW mobility directors is set for Wednesday 14:00 CET.', readBy: ['u_admin'], createdAt: daysAgo(1) },
];

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
  const usersExist = localStorage.getItem(KEYS.USERS);
  if (!force && localStorage.getItem(KEYS.INITIALIZED) && usersExist) {
    try {
      const parsedUsers = JSON.parse(usersExist);
      if (Array.isArray(parsedUsers) && parsedUsers.length > 0) return;
    } catch (e) {}
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
  if (!localStorage.getItem(KEYS.NOTES)) localStorage.setItem(KEYS.NOTES, JSON.stringify([]));
  localStorage.setItem(KEYS.PARTNERS, JSON.stringify(SEED_PARTNERS));
  localStorage.setItem(KEYS.FINANCE_INCOME, JSON.stringify(SEED_FINANCE_INCOME));
  localStorage.setItem(KEYS.FINANCE_EXPENSE, JSON.stringify(SEED_FINANCE_EXPENSE));
  if (!localStorage.getItem(KEYS.FINANCE_ACCOUNTS)) localStorage.setItem(KEYS.FINANCE_ACCOUNTS, JSON.stringify([]));
  localStorage.setItem(KEYS.FINANCE_PAYROLL, JSON.stringify(SEED_PAYROLL));
  localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(SEED_SUBSCRIPTIONS));
  localStorage.setItem(KEYS.INTERACTIONS, JSON.stringify(SEED_INTERACTIONS));
  localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
  localStorage.setItem(KEYS.WORKING_DAYS, JSON.stringify(SEED_WORKING_DAYS));
  localStorage.setItem(KEYS.HR_DOCS, JSON.stringify(SEED_HR_DOCS));
  localStorage.setItem(KEYS.CHATS, JSON.stringify(SEED_CHATS));
  localStorage.setItem(KEYS.MESSAGES, JSON.stringify(SEED_MESSAGES));
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
