// ============================================================
// HATTECH ERP — MOCK DATABASE (localStorage-based)
// All data lives in localStorage. Zero network calls.
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
  CHATS: 'ht_chats',
  MESSAGES: 'ht_messages',
  INITIALIZED: 'ht_initialized_v4',
};

// ─── Helpers ────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const now = () => new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString();

// ─── Seed Data ───────────────────────────────────────────────
const SEED_USERS = [
  { _id: 'u_admin', id: 'u_admin', username: 'admin', email: 'admin@hattech.com', password: 'admin123', role: 'admin', name: 'Admin User', avatar: '', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_hr1', id: 'u_hr1', username: 'hr1', email: 'hr@hattech.com', password: 'hr123', role: 'hr', name: 'Sarah HR', avatar: '', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_ph1', id: 'u_ph1', username: 'ph1', email: 'ph@hattech.com', password: 'ph123', role: 'projecthead', name: 'Ali ProjectHead', avatar: '', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_emp1', id: 'u_emp1', username: 'emp1', email: 'emp1@hattech.com', password: 'emp123', role: 'employee', name: 'John Employee', avatar: '', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_emp2', id: 'u_emp2', username: 'emp2', email: 'emp2@hattech.com', password: 'emp123', role: 'employee', name: 'Jane Smith', avatar: '', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_emp3', id: 'u_emp3', username: 'emp3', email: 'emp3@hattech.com', password: 'emp123', role: 'teamlead', name: 'Mike TeamLead', avatar: '', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_emp4', id: 'u_emp4', username: 'emp4', email: 'emp4@hattech.com', password: 'emp123', role: 'intern', name: 'Sara Intern', avatar: '', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_client1', id: 'u_client1', username: 'client1', email: 'client1@example.com', password: 'client123', role: 'client', name: 'David Client', avatar: '', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_client2', id: 'u_client2', username: 'client2', email: 'client2@example.com', password: 'client123', role: 'client', name: 'Emily Client', avatar: '', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_finance1', id: 'u_finance1', username: 'finance1', email: 'finance@hattech.com', password: 'finance123', role: 'finance', name: 'Finance Manager', avatar: '', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_partner1', id: 'u_partner1', username: 'partner1', email: 'partner@example.com', password: 'partner123', role: 'partner', name: 'Partner Co.', avatar: '', mustChangePassword: false, policyAccepted: true },
  { _id: 'u_it1', id: 'u_it1', username: 'it1', email: 'it@hattech.com', password: 'it123', role: 'it_support', name: 'IT Support', avatar: '', mustChangePassword: false, policyAccepted: true },
];

const SEED_EMPLOYEES = [
  { _id: 'emp_1', id: 'emp_1', name: 'John Employee', email: 'emp1@hattech.com', userId: { _id: 'u_emp1', role: 'employee' }, role: 'employee', position: 'Web Developer', subcategory: 'MERN Stack Developer', department: 'Engineering', phone: '+92-300-1111111', status: 'active', joining: daysAgo(365), image: '', bio: 'Web Developer in Engineering', documents: [], projectHead: 'emp_ph1', salary: 80000 },
  { _id: 'emp_2', id: 'emp_2', name: 'Jane Smith', email: 'emp2@hattech.com', userId: { _id: 'u_emp2', role: 'employee' }, role: 'employee', position: 'Graphic Designer', subcategory: 'UI/UX Designer', department: 'Design', phone: '+92-300-2222222', status: 'active', joining: daysAgo(300), image: '', bio: 'Graphic Designer in Design', documents: [], projectHead: 'emp_ph1', salary: 70000 },
  { _id: 'emp_3', id: 'emp_3', name: 'Mike TeamLead', email: 'emp3@hattech.com', userId: { _id: 'u_emp3', role: 'teamlead' }, role: 'teamlead', position: 'Web Developer', subcategory: 'Full Stack Developer', department: 'Engineering', phone: '+92-300-3333333', status: 'active', joining: daysAgo(500), image: '', bio: 'Team Lead in Engineering', documents: [], salary: 100000 },
  { _id: 'emp_4', id: 'emp_4', name: 'Sara Intern', email: 'emp4@hattech.com', userId: { _id: 'u_emp4', role: 'intern' }, role: 'intern', position: 'Intern', subcategory: 'Web Developer', department: 'Engineering', phone: '+92-300-4444444', status: 'active', joining: daysAgo(60), image: '', bio: 'Intern in Engineering', documents: [], salary: 25000 },
  { _id: 'emp_5', id: 'emp_5', name: 'Ahmad SEO', email: 'seo@hattech.com', userId: { _id: 'u_seo1', role: 'employee' }, role: 'employee', position: 'SEO Specialist', subcategory: 'On-Page SEO', department: 'Marketing', phone: '+92-300-5555555', status: 'active', joining: daysAgo(200), image: '', bio: 'SEO Specialist in Marketing', documents: [], salary: 65000 },
  { _id: 'emp_6', id: 'emp_6', name: 'Zara Ex-Employee', email: 'ex@hattech.com', userId: { _id: 'u_ex1', role: 'employee' }, role: 'employee', position: 'Content Writer', subcategory: 'Blog Writer', department: 'Content', phone: '+92-300-6666666', status: 'inactive', joining: daysAgo(700), image: '', bio: 'Former Content Writer', documents: [], salary: 55000 },
  { _id: 'emp_ph1', id: 'emp_ph1', name: 'Ali ProjectHead', email: 'ph@hattech.com', userId: { _id: 'u_ph1', role: 'projecthead' }, role: 'projecthead', position: 'Manager', subcategory: 'Project Head', department: 'Management', phone: '+92-300-7777777', status: 'active', joining: daysAgo(600), image: '', bio: 'Project Head in Management', documents: [], salary: 120000 },
  { _id: 'emp_hr1', id: 'emp_hr1', name: 'Sarah HR', email: 'hr@hattech.com', userId: { _id: 'u_hr1', role: 'hr' }, role: 'hr', position: 'Manager', subcategory: 'HR Manager', department: 'HR', phone: '+92-300-8888888', status: 'active', joining: daysAgo(400), image: '', bio: 'HR Manager', documents: [], salary: 90000 },
];

const SEED_CLIENTS = [
  { _id: 'cl_1', id: 'cl_1', name: 'David Client', email: 'client1@example.com', userId: { _id: 'u_client1' }, company: 'Acme Corp', phone: '+1-555-0001', country: 'USA', status: 'active', image: '', projects: ['proj_1'], createdAt: daysAgo(200) },
  { _id: 'cl_2', id: 'cl_2', name: 'Emily Client', email: 'client2@example.com', userId: { _id: 'u_client2' }, company: 'TechStart Inc', phone: '+1-555-0002', country: 'UK', status: 'active', image: '', projects: ['proj_2'], createdAt: daysAgo(150) },
  { _id: 'cl_3', id: 'cl_3', name: 'Global Ventures', email: 'global@example.com', userId: null, company: 'Global Ventures Ltd', phone: '+44-20-0001', country: 'UAE', status: 'active', image: '', projects: [], createdAt: daysAgo(90) },
];

const SEED_PROJECTS = [
  { _id: 'proj_1', id: 'proj_1', title: 'E-Commerce Platform', name: 'E-Commerce Platform', clientId: { _id: 'cl_1', name: 'David Client', email: 'client1@example.com' }, status: 'In Progress', priority: 'High', deadline: daysFromNow(30), startDate: daysAgo(60), description: 'Full stack e-commerce solution with payment integration.', budget: 5000, currency: 'USD', assignedEmployees: ['emp_1', 'emp_2'], technologies: ['React', 'Node.js', 'MongoDB'], progress: 65, createdAt: daysAgo(60) },
  { _id: 'proj_2', id: 'proj_2', title: 'Mobile App Development', name: 'Mobile App Development', clientId: { _id: 'cl_2', name: 'Emily Client', email: 'client2@example.com' }, status: 'Planning', priority: 'Medium', deadline: daysFromNow(60), startDate: daysAgo(10), description: 'Cross-platform mobile app using Flutter.', budget: 8000, currency: 'USD', assignedEmployees: ['emp_1', 'emp_3'], technologies: ['Flutter', 'Firebase'], progress: 20, createdAt: daysAgo(10) },
  { _id: 'proj_3', id: 'proj_3', title: 'SEO Campaign Q4', name: 'SEO Campaign Q4', clientId: { _id: 'cl_3', name: 'Global Ventures' }, status: 'Completed', priority: 'Low', deadline: daysAgo(10), startDate: daysAgo(90), description: 'SEO optimization and link building campaign.', budget: 2000, currency: 'USD', assignedEmployees: ['emp_5'], technologies: ['SEO', 'Analytics'], progress: 100, createdAt: daysAgo(90) },
  { _id: 'proj_4', id: 'proj_4', title: 'Brand Identity Design', name: 'Brand Identity Design', clientId: { _id: 'cl_1', name: 'David Client' }, status: 'In Progress', priority: 'High', deadline: daysFromNow(15), startDate: daysAgo(20), description: 'Complete brand identity including logo and guidelines.', budget: 3000, currency: 'USD', assignedEmployees: ['emp_2'], technologies: ['Photoshop', 'Illustrator'], progress: 45, createdAt: daysAgo(20) },
];

const SEED_TASKS = [
  { _id: 'task_1', id: 'task_1', title: 'Build Login Page', description: 'Create responsive login page with validation', projectId: 'proj_1', assignedTo: { _id: 'emp_1', name: 'John Employee' }, assignedBy: { _id: 'u_admin', name: 'Admin' }, status: 'In Progress', priority: 'High', deadline: daysFromNow(5), createdAt: daysAgo(10) },
  { _id: 'task_2', id: 'task_2', title: 'Design Homepage UI', description: 'Create mockups for the homepage', projectId: 'proj_1', assignedTo: { _id: 'emp_2', name: 'Jane Smith' }, assignedBy: { _id: 'u_admin', name: 'Admin' }, status: 'Completed', priority: 'Medium', deadline: daysAgo(2), createdAt: daysAgo(15) },
  { _id: 'task_3', id: 'task_3', title: 'Setup Flutter Project', description: 'Initialize Flutter project with proper structure', projectId: 'proj_2', assignedTo: { _id: 'emp_1', name: 'John Employee' }, assignedBy: { _id: 'emp_ph1', name: 'Ali ProjectHead' }, status: 'Pending', priority: 'High', deadline: daysFromNow(3), createdAt: daysAgo(5) },
  { _id: 'task_4', id: 'task_4', title: 'Keyword Research', description: 'Research top 50 keywords for the campaign', projectId: 'proj_3', assignedTo: { _id: 'emp_5', name: 'Ahmad SEO' }, assignedBy: { _id: 'emp_ph1', name: 'Ali ProjectHead' }, status: 'Completed', priority: 'Medium', deadline: daysAgo(30), createdAt: daysAgo(60) },
  { _id: 'task_5', id: 'task_5', title: 'Logo Design Draft', description: 'Create 3 logo variations for client review', projectId: 'proj_4', assignedTo: { _id: 'emp_2', name: 'Jane Smith' }, assignedBy: { _id: 'u_admin', name: 'Admin' }, status: 'In Progress', priority: 'High', deadline: daysFromNow(7), createdAt: daysAgo(7) },
  { _id: 'task_6', id: 'task_6', title: 'Database Schema Design', description: 'Design MongoDB schema for e-commerce', projectId: 'proj_1', assignedTo: { _id: 'emp_3', name: 'Mike TeamLead' }, assignedBy: { _id: 'emp_ph1', name: 'Ali ProjectHead' }, status: 'Completed', priority: 'High', deadline: daysAgo(5), createdAt: daysAgo(20) },
];

const SEED_REPORTS = [
  { _id: 'rep_1', userId: { _id: 'u_emp1', name: 'John Employee' }, date: daysAgo(1), content: 'Worked on login page component, completed 80% of the UI.', tasksCompleted: ['Built form validation', 'Added responsive design'], hoursWorked: 8, status: 'submitted', createdAt: daysAgo(1) },
  { _id: 'rep_2', userId: { _id: 'u_emp2', name: 'Jane Smith' }, date: daysAgo(1), content: 'Completed homepage mockup and shared with team for review.', tasksCompleted: ['Homepage mockup done', 'Color scheme finalized'], hoursWorked: 7, status: 'submitted', createdAt: daysAgo(1) },
  { _id: 'rep_3', userId: { _id: 'u_emp1', name: 'John Employee' }, date: daysAgo(2), content: 'Started Flutter project setup and configured dependencies.', tasksCompleted: ['Project initialized', 'Dependencies configured'], hoursWorked: 8, status: 'submitted', createdAt: daysAgo(2) },
];

const SEED_ATTENDANCE = [
  { _id: 'att_1', employeeId: 'emp_1', userId: 'u_emp1', date: daysAgo(0).slice(0,10), checkIn: '09:00', checkOut: '18:00', status: 'present', late: false },
  { _id: 'att_2', employeeId: 'emp_1', userId: 'u_emp1', date: daysAgo(1).slice(0,10), checkIn: '09:15', checkOut: '18:00', status: 'present', late: true },
  { _id: 'att_3', employeeId: 'emp_2', userId: 'u_emp2', date: daysAgo(0).slice(0,10), checkIn: '09:05', checkOut: '18:00', status: 'present', late: false },
  { _id: 'att_4', employeeId: 'emp_3', userId: 'u_emp3', date: daysAgo(0).slice(0,10), checkIn: '08:55', checkOut: '18:00', status: 'present', late: false },
];

const SEED_PAYROLL = [
  { _id: 'pay_1', employeeId: 'emp_1', employeeName: 'John Employee', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basicSalary: 80000, bonus: 8000, deductions: 5000, netSalary: 83000, status: 'paid', paidOn: daysAgo(5), currency: 'PKR' },
  { _id: 'pay_2', employeeId: 'emp_2', employeeName: 'Jane Smith', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basicSalary: 70000, bonus: 5000, deductions: 3000, netSalary: 72000, status: 'paid', paidOn: daysAgo(5), currency: 'PKR' },
  { _id: 'pay_3', employeeId: 'emp_3', employeeName: 'Mike TeamLead', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basicSalary: 100000, bonus: 10000, deductions: 8000, netSalary: 102000, status: 'pending', currency: 'PKR' },
  { _id: 'pay_4', employeeId: 'emp_5', employeeName: 'Ahmad SEO', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basicSalary: 65000, bonus: 3000, deductions: 2000, netSalary: 66000, status: 'paid', paidOn: daysAgo(5), currency: 'PKR' },
];

const SEED_ACHIEVEMENTS = [
  { _id: 'ach_1', user: { _id: 'u_emp1', name: 'John Employee', department: 'Engineering', position: 'Web Developer' }, awardType: 'Employee of the Month', title: 'Best Employee of the Month', description: 'Outstanding performance in project delivery.', date: daysAgo(15), score: 95, createdAt: daysAgo(15) },
  { _id: 'ach_2', user: { _id: 'u_emp2', name: 'Jane Smith', department: 'Design', position: 'Graphic Designer' }, awardType: 'Employee of 6 Months', title: 'Best Employee of 6 Months', description: 'Consistent high quality design work over 6 months.', date: daysAgo(30), score: 92, createdAt: daysAgo(30) },
];

const SEED_NOTIFICATIONS = [
  { _id: 'notif_1', userId: 'u_admin', title: 'New Employee Added', message: 'John Employee has been added to Engineering team.', type: 'info', read: false, createdAt: daysAgo(1) },
  { _id: 'notif_2', userId: 'u_admin', title: 'Project Deadline Alert', message: 'Brand Identity Design deadline in 15 days.', type: 'warning', read: false, createdAt: daysAgo(0) },
  { _id: 'notif_3', userId: 'u_emp1', title: 'Task Assigned', message: 'You have been assigned "Build Login Page".', type: 'info', read: false, createdAt: daysAgo(2) },
];

const SEED_REQUESTS = [
  { _id: 'req_1', employeeId: 'emp_1', employeeName: 'John Employee', type: 'Leave', reason: 'Medical appointment', fromDate: daysFromNow(3), toDate: daysFromNow(3), status: 'pending', createdAt: daysAgo(1) },
  { _id: 'req_2', employeeId: 'emp_2', employeeName: 'Jane Smith', type: 'Work From Home', reason: 'Internet issues at office', fromDate: daysFromNow(1), toDate: daysFromNow(1), status: 'approved', createdAt: daysAgo(2) },
  { _id: 'req_3', employeeId: 'emp_5', employeeName: 'Ahmad SEO', type: 'Leave', reason: 'Family event', fromDate: daysFromNow(7), toDate: daysFromNow(8), status: 'pending', createdAt: daysAgo(1) },
];

const SEED_BOOKINGS = [
  { _id: 'book_1', clientName: 'David Client', clientEmail: 'client1@example.com', service: 'Web Development Consultation', date: daysFromNow(2), time: '14:00', status: 'confirmed', notes: 'Discuss project requirements', createdAt: daysAgo(3) },
  { _id: 'book_2', clientName: 'Emily Client', clientEmail: 'client2@example.com', service: 'Mobile App Strategy', date: daysFromNow(5), time: '10:00', status: 'pending', notes: 'Initial meeting', createdAt: daysAgo(1) },
];

const SEED_ANNOUNCEMENTS = [
  { _id: 'ann_1', title: 'Office Holiday - October 25', message: 'The office will be closed on October 25 for a national holiday. Enjoy the day off!', postedBy: 'Admin', type: 'holiday', createdAt: daysAgo(2), expiresAt: daysFromNow(15) },
  { _id: 'ann_2', title: 'Team Lunch This Friday', message: 'All hands team lunch this Friday at 1 PM in the conference room. Please RSVP.', postedBy: 'HR Manager', type: 'event', createdAt: daysAgo(1), expiresAt: daysFromNow(5) },
];

const SEED_POLICIES = [
  { _id: 'pol_1', title: 'Remote Work Policy', content: '## Remote Work Policy\n\nEmployees may work remotely up to 2 days per week with prior approval from their project head.\n\n### Guidelines\n- Maintain core hours 10 AM - 4 PM PKT\n- Must be reachable on Slack/Teams\n- Submit daily report as usual\n- Home internet is employee responsibility', category: 'Work', version: '1.2', effectiveDate: daysAgo(90), createdAt: daysAgo(90) },
  { _id: 'pol_2', title: 'Leave Policy', content: '## Leave Policy\n\n### Annual Leave\nAll employees are entitled to 12 days of annual leave per year.\n\n### Sick Leave\n6 days of sick leave per year.\n\n### Process\n- Apply at least 3 days in advance\n- Medical certificate required for sick leave > 2 days', category: 'HR', version: '2.0', effectiveDate: daysAgo(180), createdAt: daysAgo(180) },
  { _id: 'pol_3', title: 'Code of Conduct', content: '## Code of Conduct\n\nAll team members are expected to maintain professional standards at all times.\n\n### Key Points\n- Respect all colleagues\n- Maintain confidentiality\n- No harassment or discrimination\n- Report violations to HR', category: 'General', version: '1.0', effectiveDate: daysAgo(365), createdAt: daysAgo(365) },
];

const SEED_PARTNERS = [
  { _id: 'part_1', id: 'part_1', name: 'Partner Co.', email: 'partner@example.com', userId: { _id: 'u_partner1' }, company: 'Partner Consulting LLC', phone: '+1-555-9001', country: 'USA', status: 'active', partnerType: 'Technology', commissionRate: 10, projects: ['proj_1'], createdAt: daysAgo(120) },
  { _id: 'part_2', id: 'part_2', name: 'Design Studio', email: 'studio@example.com', userId: null, company: 'Creative Design Studio', phone: '+44-20-9002', country: 'UK', status: 'active', partnerType: 'Design', commissionRate: 8, projects: [], createdAt: daysAgo(60) },
];

const SEED_FINANCE_INCOME = [
  { _id: 'inc_1', source: 'E-Commerce Platform', amount: 2500, currency: 'USD', date: daysAgo(5), category: 'Project Payment', client: 'David Client', description: '50% milestone payment', status: 'received' },
  { _id: 'inc_2', source: 'Mobile App Development', amount: 4000, currency: 'USD', date: daysAgo(10), category: 'Project Payment', client: 'Emily Client', description: 'Initial payment', status: 'received' },
  { _id: 'inc_3', source: 'SEO Campaign Q4', amount: 2000, currency: 'USD', date: daysAgo(20), category: 'Project Payment', client: 'Global Ventures', description: 'Final payment', status: 'received' },
  { _id: 'inc_4', source: 'Brand Identity Design', amount: 1500, currency: 'USD', date: daysAgo(3), category: 'Project Payment', client: 'David Client', description: '50% advance', status: 'received' },
];

const SEED_FINANCE_EXPENSE = [
  { _id: 'exp_1', title: 'Office Rent', amount: 150000, currency: 'PKR', date: daysAgo(5), category: 'Rent', description: 'Monthly office rent - October', status: 'paid' },
  { _id: 'exp_2', title: 'Team Salaries', amount: 485000, currency: 'PKR', date: daysAgo(5), category: 'Salaries', description: 'October payroll', status: 'paid' },
  { _id: 'exp_3', title: 'AWS Hosting', amount: 35000, currency: 'PKR', date: daysAgo(1), category: 'Software', description: 'Monthly AWS bill', status: 'paid' },
  { _id: 'exp_4', title: 'Office Supplies', amount: 12000, currency: 'PKR', date: daysAgo(7), category: 'Supplies', description: 'Stationery and supplies', status: 'paid' },
];

const SEED_SUBSCRIPTIONS = [
  { _id: 'sub_1', clientId: 'cl_1', clientName: 'David Client', plan: 'Professional', amount: 500, currency: 'USD', billingCycle: 'monthly', startDate: daysAgo(60), nextBillingDate: daysFromNow(30), status: 'active', services: ['SEO Monitoring', 'Monthly Reports', 'Priority Support'] },
  { _id: 'sub_2', clientId: 'cl_2', clientName: 'Emily Client', plan: 'Basic', amount: 200, currency: 'USD', billingCycle: 'monthly', startDate: daysAgo(30), nextBillingDate: daysFromNow(1), status: 'active', services: ['Monthly Reports', 'Email Support'] },
];

const SEED_INTERACTIONS = [
  { _id: 'int_1', clientId: 'cl_1', clientName: 'David Client', interactionType: 'meeting', title: 'Project Review Meeting', date: daysFromNow(2), time: '14:00', notes: 'Quarterly project progress review', status: 'scheduled', createdAt: daysAgo(3) },
  { _id: 'int_2', clientId: 'cl_2', clientName: 'Emily Client', interactionType: 'call', title: 'Requirements Gathering Call', date: daysFromNow(1), time: '10:00', notes: 'Initial call to gather mobile app requirements', status: 'scheduled', createdAt: daysAgo(1) },
];

const SEED_ACTIVITIES = [
  { _id: 'act_1', userId: { _id: 'u_emp1' }, employeeId: 'emp_1', date: new Date().toISOString().slice(0,10), checkIn: '09:00', lastHeartbeat: new Date().toISOString(), duration: 480, status: 'online' },
  { _id: 'act_2', userId: { _id: 'u_emp2' }, employeeId: 'emp_2', date: new Date().toISOString().slice(0,10), checkIn: '09:05', lastHeartbeat: new Date(Date.now() - 600000).toISOString(), duration: 420, status: 'offline' },
];

const SEED_WORKING_DAYS = {
  sunday: false, monday: true, tuesday: true, wednesday: true,
  thursday: true, friday: true, saturday: true,
  nonWorkingDates: [], holidayDescriptions: {}
};

const SEED_HR_DOCS = [
  { _id: 'doc_1', title: 'Employee Handbook 2024', description: 'Complete guide for new and existing employees', category: 'Policy', fileUrl: '', uploadedBy: 'Admin', uploadedAt: daysAgo(30) },
  { _id: 'doc_2', title: 'Payroll Guide', description: 'How payroll is calculated and disbursed', category: 'Finance', fileUrl: '', uploadedBy: 'HR Manager', uploadedAt: daysAgo(60) },
  { _id: 'doc_3', title: 'Leave Application Form', description: 'Template for leave requests', category: 'Forms', fileUrl: '', uploadedBy: 'HR Manager', uploadedAt: daysAgo(90) },
];

const SEED_CHATS = [
  { _id: 'chat_general', id: 'chat_general', type: 'general', name: 'General Hub', members: ['u_admin', 'u_emp1', 'u_emp2', 'u_hr1'] },
  { _id: 'proj_1', id: 'proj_1', type: 'project', name: 'E-Commerce Platform', members: ['u_admin', 'u_emp1', 'u_emp2'] },
  { _id: 'proj_2', id: 'proj_2', type: 'project', name: 'Mobile App Development', members: ['u_admin', 'u_emp1', 'u_emp3'] },
];

const SEED_MESSAGES = [
  { _id: 'msg_1', chatId: 'chat_general', sender: { _id: 'u_admin', name: 'Admin User', role: 'admin' }, content: 'Welcome to the Hattech ERP team hub! All announcements and queries can be posted here.', readBy: ['u_admin'], createdAt: daysAgo(2) },
  { _id: 'msg_2', chatId: 'chat_general', sender: { _id: 'u_emp1', name: 'John Employee', role: 'employee' }, content: 'Hello everyone! Excited to work on the upcoming releases.', readBy: ['u_admin', 'u_emp1'], createdAt: daysAgo(1) },
  { _id: 'msg_3', chatId: 'proj_1', sender: { _id: 'u_admin', name: 'Admin User', role: 'admin' }, content: 'Sprint 1 tasks have been assigned. Please check the Tasks tab.', readBy: ['u_admin'], createdAt: daysAgo(2) },
];

// ─── Scoring data helper ─────────────────────────────────────
const generateScoringData = (employees) => {
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  const mStr = String(month + 1).padStart(2,'0');
  const monthQuery = `${year}-${mStr}`;
  
  return employees
    .filter(e => e.status === 'active' && !['admin','hr','hr_hattech'].includes(e.role))
    .map((emp, i) => ({
      employeeId: emp._id,
      id: emp._id,
      name: emp.name,
      department: emp.department,
      avatar: emp.image || null,
      month: monthQuery,
      presentDays: 18 - i,
      totalWorkingDays: 22,
      lateDays: i,
      reportsSubmitted: 17 - i,
      isEmployeeOfTheMonth: i === 0,
      isEmployeeOf6Months: i === 1,
      bonusPercentage: i === 0 ? 5 : i === 1 ? 10 : 0,
      scores: {
        attendance: Math.max(40, 70 - i * 5),
        reports: Math.max(20, 40 - i * 3),
        milestones: 25,
        punctuality: Math.max(10, 20 - i * 2),
        total: Math.max(80, 155 - i * 10),
      }
    }));
};

// ─── Initialize ──────────────────────────────────────────────
export const initDb = () => {
  if (localStorage.getItem(KEYS.INITIALIZED)) return;
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
  localStorage.setItem(KEYS.INITIALIZED, 'true');
};

// ─── CRUD helpers ────────────────────────────────────────────
const getAll = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
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
    findByUsername: (u) => getAll(KEYS.USERS).find(x => x.username === u || x.email === u),
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
  // Activities
  activities: {
    getAll: () => getAll(KEYS.ACTIVITIES),
    forDate: (date) => getAll(KEYS.ACTIVITIES).filter(a => a.date === date),
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
  // Scoring
  scoring: {
    get: (month) => {
      const emps = getAll(KEYS.EMPLOYEES);
      return generateScoringData(emps);
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
    getGeneral: () => findById(KEYS.CHATS, 'chat_general') || { _id: 'chat_general', id: 'chat_general', name: 'General Hub' },
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
