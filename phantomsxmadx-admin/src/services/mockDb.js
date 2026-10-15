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
  INITIALIZED: 'ht_initialized_v11_real_team',
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
  {
    "_id": "u_admin",
    "id": "u_admin",
    "username": "admin",
    "email": "admin@hattechmedia.com",
    "password": "admin123",
    "role": "admin",
    "name": "Lukas Weber",
    "designation": "Managing Director & CEO",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    "mustChangePassword": false,
    "policyAccepted": true
  },
  {
    "_id": "u_hr1",
    "id": "u_hr1",
    "username": "hr1",
    "email": "hr@hattechmedia.com",
    "password": "hr123",
    "role": "hr",
    "name": "Sarah Lindemann",
    "designation": "Director of People & Operations",
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    "mustChangePassword": false,
    "policyAccepted": true
  },
  {
    "_id": "u_salman",
    "id": "u_salman",
    "username": "salman",
    "email": "sh0523759@gmail.com",
    "password": "emp123",
    "role": "teamlead",
    "name": "Muhammad Salman",
    "designation": "MERN & PHP Stack Lead",
    "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg",
    "mustChangePassword": false,
    "policyAccepted": true
  },
  {
    "_id": "u_huzaifa",
    "id": "u_huzaifa",
    "username": "huzaifa",
    "email": "huzaifa102477@gmail.com",
    "password": "emp123",
    "role": "employee",
    "name": "Muhammad Huzaifa",
    "designation": "Senior MERN Stack Developer",
    "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg",
    "mustChangePassword": false,
    "policyAccepted": true
  },
  {
    "_id": "u_musa",
    "id": "u_musa",
    "username": "musa",
    "email": "m4musa592@gmail.com",
    "password": "ph123",
    "role": "projecthead",
    "name": "Ali musa",
    "designation": "AI / ML Systems Engineer",
    "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg",
    "mustChangePassword": false,
    "policyAccepted": true
  },
  {
    "_id": "u_aliraza",
    "id": "u_aliraza",
    "username": "aliraza",
    "email": "alirazabaloch4173@gmail.com",
    "password": "emp123",
    "role": "intern",
    "name": "Ali Raza",
    "designation": "Frontend Engineering Intern",
    "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1783316608/Hattechmedia/v22kyts7tjktszaxicwe.jpg",
    "mustChangePassword": false,
    "policyAccepted": true
  },
  {
    "_id": "u_finance1",
    "id": "u_finance1",
    "username": "finance1",
    "email": "finance@hattechmedia.com",
    "password": "finance123",
    "role": "finance",
    "name": "Markus Braun",
    "designation": "Chief Financial Officer",
    "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80",
    "mustChangePassword": false,
    "policyAccepted": true
  },
  {
    "_id": "u_client1",
    "id": "u_client1",
    "username": "client1",
    "email": "contact@novarch.de",
    "password": "client123",
    "role": "client",
    "name": "Dr. Christian Wolf",
    "designation": "Novarch Tech Enterprise",
    "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
    "mustChangePassword": false,
    "policyAccepted": true
  },
  {
    "_id": "u_partner1",
    "id": "u_partner1",
    "username": "partner1",
    "email": "partner@techventures.de",
    "password": "partner123",
    "role": "partner",
    "name": "TechVentures Munich",
    "designation": "Strategic Partner",
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    "mustChangePassword": false,
    "policyAccepted": true
  }
];

const SEED_EMPLOYEES = [
  {
    "_id": "emp_salman",
    "id": "emp_salman",
    "userId": {
      "_id": "u_salman",
      "role": "teamlead",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "name": "Muhammad Salman",
    "email": "sh0523759@gmail.com",
    "phone": "03106922202",
    "department": "Web Development",
    "position": "MERN & PHP Stack Web Developer",
    "subcategory": "Engineering Team Lead",
    "role": "teamlead",
    "status": "active",
    "joining": "2025-12-15T00:00:00.000Z",
    "image": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg",
    "bio": "Team Lead & Senior Full-Stack Engineer directing web portal security, payment integrations, and frontend infrastructure.",
    "skills": [
      "MERN STACK DEVELOPMENT",
      "PHP",
      "Node.js",
      "System Architecture",
      "Stripe Integration",
      "Cybersecurity"
    ],
    "salary": 6200,
    "documents": [],
    "bankDetails": {
      "bankName": "UBL BANK",
      "accountNumber": "0346399134221",
      "accountHolder": "Muhammad Salman"
    }
  },
  {
    "_id": "emp_huzaifa",
    "id": "emp_huzaifa",
    "userId": {
      "_id": "u_huzaifa",
      "role": "employee",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "name": "Muhammad Huzaifa",
    "email": "huzaifa102477@gmail.com",
    "phone": "0314 0407955",
    "department": "Web Development",
    "position": "Senior MERN Stack Developer",
    "subcategory": "Full Stack Web Developer",
    "role": "employee",
    "status": "active",
    "joining": "2026-02-09T00:00:00.000Z",
    "image": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg",
    "bio": "Senior MERN & Full Stack Developer leading key digital platform architecture and cloud deployments.",
    "skills": [
      "MERN Stack",
      "Next.js",
      "Nest.js",
      "PHP",
      "Laravel",
      "Tailwind CSS"
    ],
    "salary": 5800,
    "documents": [],
    "teamLead": "emp_salman",
    "bankDetails": {
      "bankName": "UBL Bank",
      "accountNumber": "0639319123829",
      "accountHolder": "Muhammad Huzaifa"
    }
  },
  {
    "_id": "emp_musa",
    "id": "emp_musa",
    "userId": {
      "_id": "u_musa",
      "role": "projecthead",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "name": "Ali musa",
    "email": "M4musa592@gmail.com",
    "phone": "0310 4220217",
    "department": "Projects & Development",
    "position": "AI / ML engineer",
    "subcategory": "Machine Learning & AI",
    "role": "projecthead",
    "status": "active",
    "joining": "2026-02-09T00:00:00.000Z",
    "image": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg",
    "bio": "Lead AI / ML Systems Engineer specializing in automated pipeline architecture, LLM agent workflows, and data intelligence.",
    "skills": [
      "Python",
      "n8n automation",
      "streamlit",
      "ngrok",
      "gradio",
      "data preprocessing",
      "model building",
      "SQL"
    ],
    "salary": 6500,
    "documents": [],
    "bankDetails": {
      "bankName": "Jazz Cash / Standard Chartered",
      "accountNumber": "03364121249",
      "accountHolder": "Ali Musa"
    }
  },
  {
    "_id": "emp_aliraza",
    "id": "emp_aliraza",
    "userId": {
      "_id": "u_aliraza",
      "role": "intern",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1783316608/Hattechmedia/v22kyts7tjktszaxicwe.jpg"
    },
    "name": "Ali Raza",
    "email": "alirazabaloch4173@gmail.com",
    "phone": "03089181414",
    "department": "Web Development",
    "position": "Web Development Intern",
    "subcategory": "Frontend Development",
    "role": "intern",
    "status": "active",
    "joining": "2026-07-01T00:00:00.000Z",
    "image": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1783316608/Hattechmedia/v22kyts7tjktszaxicwe.jpg",
    "bio": "Web Engineering Intern focusing on interactive UI components, state management, and responsive layouts.",
    "skills": [
      "React.js",
      "JavaScript",
      "HTML5",
      "CSS3",
      "Tailwind CSS"
    ],
    "salary": 2200,
    "documents": [],
    "teamLead": "emp_salman",
    "bankDetails": {
      "bankName": "Allied Bank",
      "accountNumber": "08230193184",
      "accountHolder": "Ali Raza"
    }
  }
];
const SEED_CLIENTS = [
  {
    "_id": "cl_1",
    "id": "cl_1",
    "name": "Dr. Christian Wolf",
    "email": "contact@novarch.de",
    "company": "Novarch Tech Systems (Munich)",
    "phone": "+49 89 2100 450",
    "country": "Germany",
    "status": "active",
    "image": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
    "projects": [
      "proj_1",
      "proj_2",
      "proj_3",
      "proj_4"
    ],
    "createdAt": "2026-06-01T09:00:00.000Z"
  }
];
const SEED_PROJECTS = [
  {
    "_id": "proj_1",
    "id": "proj_1",
    "title": "HAT TECH ERP Platform",
    "name": "HAT TECH ERP Platform",
    "clientId": {
      "_id": "cl_1",
      "name": "Novarch Tech Enterprise",
      "email": "contact@novarch.de"
    },
    "status": "In Progress",
    "priority": "High",
    "deadline": "2026-11-30",
    "startDate": "2026-08-01",
    "description": "Enterprise Resource Planning system featuring multi-branch payroll, AI reporting, and live financial cashflow ledger.",
    "budget": 85000,
    "currency": "EUR",
    "assignedEmployees": [
      "emp_salman",
      "emp_huzaifa"
    ],
    "technologies": [
      "React",
      "Node.js",
      "MongoDB",
      "TailwindCSS"
    ],
    "progress": 82,
    "createdAt": "2026-08-01T09:00:00.000Z"
  },
  {
    "_id": "proj_2",
    "id": "proj_2",
    "title": "Fixture King E-Commerce Suite",
    "name": "Fixture King E-Commerce Suite",
    "clientId": {
      "_id": "cl_1",
      "name": "Novarch Tech Enterprise",
      "email": "contact@novarch.de"
    },
    "status": "In Progress",
    "priority": "High",
    "deadline": "2026-11-15",
    "startDate": "2026-08-15",
    "description": "High-volume hardware fixture and retail digital catalog with automated cataloging, media transcoding, and stock sync.",
    "budget": 64000,
    "currency": "EUR",
    "assignedEmployees": [
      "emp_huzaifa",
      "emp_musa"
    ],
    "technologies": [
      "MERN Stack",
      "Python Automation",
      "Docker",
      "PostgreSQL"
    ],
    "progress": 65,
    "createdAt": "2026-08-15T09:00:00.000Z"
  },
  {
    "_id": "proj_3",
    "id": "proj_3",
    "title": "Novarch Automated Intelligence Agent",
    "name": "Novarch Automated Intelligence Agent",
    "clientId": {
      "_id": "cl_1",
      "name": "Novarch Tech Enterprise"
    },
    "status": "In Progress",
    "priority": "High",
    "deadline": "2026-12-10",
    "startDate": "2026-09-01",
    "description": "Autonomous n8n automation and search indexing model powering marketing intelligence and catalog discovery.",
    "budget": 78000,
    "currency": "EUR",
    "assignedEmployees": [
      "emp_musa"
    ],
    "technologies": [
      "Python",
      "Streamlit",
      "n8n",
      "LLM APIs",
      "FastAPI"
    ],
    "progress": 70,
    "createdAt": "2026-09-01T09:00:00.000Z"
  },
  {
    "_id": "proj_4",
    "id": "proj_4",
    "title": "MissNuos Portal & Stripe Gateway",
    "name": "MissNuos Portal & Stripe Gateway",
    "clientId": {
      "_id": "cl_1",
      "name": "Novarch Tech Enterprise"
    },
    "status": "In Progress",
    "priority": "Medium",
    "deadline": "2026-10-31",
    "startDate": "2026-09-10",
    "description": "Full customer checkout, subscription billing, and administrative security hardening.",
    "budget": 45000,
    "currency": "EUR",
    "assignedEmployees": [
      "emp_salman",
      "emp_aliraza"
    ],
    "technologies": [
      "React",
      "PHP",
      "Stripe API",
      "Cybersecurity Audit"
    ],
    "progress": 88,
    "createdAt": "2026-09-10T09:00:00.000Z"
  }
];
const SEED_TASKS = [
  {
    "_id": "task_1",
    "id": "task_1",
    "title": "Novarch Stripe Payment Integration & Admin Hardening",
    "description": "Integrate Stripe webhooks, optimize security headers, and resolve checkout exception flows.",
    "projectId": "proj_4",
    "assignedTo": {
      "_id": "emp_salman",
      "name": "Muhammad Salman"
    },
    "assignedBy": {
      "_id": "u_admin",
      "name": "Lukas Weber"
    },
    "status": "In Progress",
    "priority": "High",
    "deadline": "2026-10-20",
    "createdAt": "2026-10-12T09:00:00.000Z"
  },
  {
    "_id": "task_2",
    "id": "task_2",
    "title": "Cattle Farm ERP Deployment & SAAS Module Updates",
    "description": "Deploy bug fixes and verified releases to Hattech Media GitHub and Vercel production edge.",
    "projectId": "proj_1",
    "assignedTo": {
      "_id": "emp_huzaifa",
      "name": "Muhammad Huzaifa"
    },
    "assignedBy": {
      "_id": "emp_salman",
      "name": "Muhammad Salman"
    },
    "status": "Completed",
    "priority": "High",
    "deadline": "2026-10-14",
    "createdAt": "2026-10-10T09:00:00.000Z"
  },
  {
    "_id": "task_3",
    "id": "task_3",
    "title": "Fixture King Categories & Product Upload Pipeline",
    "description": "Configure category hierarchies and align product upload schemas with web dev team.",
    "projectId": "proj_2",
    "assignedTo": {
      "_id": "emp_huzaifa",
      "name": "Muhammad Huzaifa"
    },
    "assignedBy": {
      "_id": "emp_musa",
      "name": "Ali musa"
    },
    "status": "In Progress",
    "priority": "Medium",
    "deadline": "2026-10-22",
    "createdAt": "2026-10-13T09:00:00.000Z"
  },
  {
    "_id": "task_4",
    "id": "task_4",
    "title": "Automated SEO Indexing Pipeline & n8n Workflows",
    "description": "Align Pinterest configuration for article publishing and provide indexing technique to SEO team.",
    "projectId": "proj_3",
    "assignedTo": {
      "_id": "emp_musa",
      "name": "Ali musa"
    },
    "assignedBy": {
      "_id": "u_admin",
      "name": "Lukas Weber"
    },
    "status": "Completed",
    "priority": "High",
    "deadline": "2026-10-15",
    "createdAt": "2026-10-11T09:00:00.000Z"
  },
  {
    "_id": "task_5",
    "id": "task_5",
    "title": "Responsive UI Section Alignment & Mobile Navigation",
    "description": "Test interactive UI components, fix flexbox alignment, and verify cross-browser performance.",
    "projectId": "proj_1",
    "assignedTo": {
      "_id": "emp_aliraza",
      "name": "Ali Raza"
    },
    "assignedBy": {
      "_id": "emp_salman",
      "name": "Muhammad Salman"
    },
    "status": "In Progress",
    "priority": "Medium",
    "deadline": "2026-10-25",
    "createdAt": "2026-10-13T09:00:00.000Z"
  }
];
const SEED_REPORTS = [
  {
    "_id": "rep_1",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-14",
    "content": "Task :\nI worked on fixture king website categories and product upload with huzaifa and did posting on fixture king and did meeting with farooq bhai regarding ategories alignment and dealed with novarch",
    "tasksCompleted": [
      "Task :",
      "I worked on fixture king website categories and product upload with huzaifa and did posting on fixture king and did meeting with farooq bhai regarding ategories alignment and dealed with novarch"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-14T15:10:39.562Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_2",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-14",
    "content": "Today\u2019s Working Report\n- Optimized Admin Panel performance and fixed checkout errors and  work on cyber security in website.\n- Improved storefront UI and layout.\n- Fixed SEO files, added canonical tags, and updated branding.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "- Optimized Admin Panel performance and fixed checkout errors and  work on cyber security in website.",
      "- Improved storefront UI and layout."
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-14T15:14:28.542Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_3",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-10-14",
    "content": "today working report\n.......................................\ndate: 14-10-2026\n.......................................\n\nTask:\ntoday i work on cattle farm project and SAAS erp project on sir hamza instructions... there was some error in both projects i fix them all and deploy on hattech media git and vercel and i work on fixture king website i add some new products and add category in website and check malaika work...",
    "tasksCompleted": [
      "today working report",
      "date: 14-10-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-14T15:15:28.372Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_4",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-13",
    "content": "Task :\nI worked on expo markertresearch and researched about competitors and aligned plan for it and discussed things with awais Bhai and dealed with novarch and created it's poster for expo and did postings on fixture king",
    "tasksCompleted": [
      "Task :",
      "I worked on expo markertresearch and researched about competitors and aligned plan for it and discussed things with awais Bhai and dealed with novarch and created it's poster for expo and did postings on fixture king"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-13T14:41:57.845Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_5",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-13",
    "content": "Today\u2019s Working Report\nWorked on the MissNuos website, implemented changes provided by Talha, configured the login and signup pages and admin panel, integrated Stripe payment functionality, and assisted Huzaifa with the Cattle Farm project deployment.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Worked on the MissNuos website, implemented changes provided by Talha, configured the login and signup pages and admin panel, integrated Stripe payment functionality, and assisted Huzaifa with the Cattle Farm project deployment."
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-13T15:16:27.501Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_6",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-10-13",
    "content": "today working report\n.......................................\ndate: 13-10-2026\n.......................................\n\nTask:\ntoday i work on hattech media website i remove unnecessary software projects and add new projects and send code file to malaika and i work on cattle farm erp and project deploy on hattech media github and vercel...",
    "tasksCompleted": [
      "today working report",
      "date: 13-10-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-13T15:39:46.655Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_7",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-12",
    "content": "Task :\nI worked on trinutra video shoot and editing and dealed with novarch and made poster for it and made fixture king post and did postings",
    "tasksCompleted": [
      "Task :",
      "I worked on trinutra video shoot and editing and dealed with novarch and made poster for it and made fixture king post and did postings"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-12T15:29:21.832Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_8",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-12",
    "content": "Today\u2019s Working Report\n- Pushed the latest code updates for MissNuos.\n- Aligned and prepared the work for the meeting.\n- Attend weekly meeting.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "- Pushed the latest code updates for MissNuos.",
      "- Aligned and prepared the work for the meeting."
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-13T07:45:09.729Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_9",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-10-12",
    "content": "today working report\n.......................................\ndate: 12-10-2026\n.......................................\n\nTask:\nToday i work on hattech media website and remove unnecessary projects and add new projects and work on driveflex mobile app with malaika and discuss with sir hamza\u2026",
    "tasksCompleted": [
      "today working report",
      "date: 12-10-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-12T14:58:35.780Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_10",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-10",
    "content": "Task :\nI worked on aws research for partner certification and made fixture king post and uploaded the post and aligned things with team",
    "tasksCompleted": [
      "Task :",
      "I worked on aws research for partner certification and made fixture king post and uploaded the post and aligned things with team"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-10T15:31:16.338Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_11",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-10",
    "content": "Today\u2019s Working Report\n- Resolved code push errors in NOVARCH and Optimizer.\n- Created the sitemap and implemented canonical tags for MissNuos.\n- Coordinated with the team regarding ongoing tasks and project updates.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "- Resolved code push errors in NOVARCH and Optimizer.",
      "- Created the sitemap and implemented canonical tags for MissNuos."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-10T15:31:22.835Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_12",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-10-09",
    "content": "today working report\n.......................................\ndate: 09-10-2026\n.......................................\n\nTask:\ntoday i work on fixture king website i made some changes in home page on SEO Team instructions and all the changes commit and push on hattech media git and vercel and i work on driveflex mobile app and made some changes...",
    "tasksCompleted": [
      "today working report",
      "date: 09-10-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-09T13:58:17.694Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_13",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-09",
    "content": "Task :\nI worked on leads scrapper tool and aligned with dilshad regarding fixture king and did postings on fixture king and dealed with talha and ahmad",
    "tasksCompleted": [
      "Task :",
      "I worked on leads scrapper tool and aligned with dilshad regarding fixture king and did postings on fixture king and dealed with talha and ahmad"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-09T14:41:43.984Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_14",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-09",
    "content": "Today\u2019s Working Report\n- Worked on the Doomsday (ZeroHour) website backend and admin panel, implementing functionality for checkout and related features.\n- Coordinated with Emaad regarding ongoing NOVARCH project tasks.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "- Worked on the Doomsday (ZeroHour) website backend and admin panel, implementing functionality for checkout and related features.",
      "- Coordinated with Emaad regarding ongoing NOVARCH project tasks."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-09T14:51:27.895Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_15",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-10-08",
    "content": "today working report\n.......................................\ndate: 08-10-2026\n.......................................\n\nTask:\ntoday i work on driveflex mobile app with malaika and made many changes and add new pages in app and make it functional. and we tried to download the APK in mobile and and after a lot of hard work and effort we finally managed to download the APK file successfully and discuss with sir hamza about this project...and work on fixture king website to make it responsive...",
    "tasksCompleted": [
      "today working report",
      "date: 08-10-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-08T14:10:41.265Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_16",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-08",
    "content": "Task :\nI worked on leads scraper and added gmb to it and fetched leads and deployed to vercel and worked on trinutra scripts and dealed with novarch and dealed with dilshad regarding fixture king post and did postings  on fixture king",
    "tasksCompleted": [
      "Task :",
      "I worked on leads scraper and added gmb to it and fetched leads and deployed to vercel and worked on trinutra scripts and dealed with novarch and dealed with dilshad regarding fixture king post and did postings  on fixture king"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-08T16:49:45.872Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_17",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-08",
    "content": "Today\u2019s Working Report\n- Fixed the 404 reload error on MissNuos and improved mobile responsiveness.\n- Worked on NOVARCH with Emaad and provided the necessary guidance.\n- Coordinated with the team regarding ongoing tasks and project updates.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "- Fixed the 404 reload error on MissNuos and improved mobile responsiveness.",
      "- Worked on NOVARCH with Emaad and provided the necessary guidance."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-09T07:48:10.112Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_18",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-10-07",
    "content": "today working report\n.......................................\ndate: 07-10-2026\n.......................................\n\nTask:\ntoday i work on driveflex website admin panel and delete unnecessary pages and i work on driveflex mobile app with malaika and try to make APK file...",
    "tasksCompleted": [
      "today working report",
      "date: 07-10-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-07T14:28:08.890Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_19",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-07",
    "content": "Task :\nI worked on leads generations with linkdein and reddit ui fix and made fixture king post and did postings on fixture king and arranged content for trinutra",
    "tasksCompleted": [
      "Task :",
      "I worked on leads generations with linkdein and reddit ui fix and made fixture king post and did postings on fixture king and arranged content for trinutra"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-07T15:05:30.972Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_20",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-07",
    "content": "Today\u2019s Working Report\nWorked on the Doomsday (ZeroHour) website, including user signup functionality, user panel, and shop page.\nGuided Emaad regarding the LMS in PIGROTECH.Guided Abdullah on his assigned work and project tasks.\nCoordinated with the team regarding ongoing work and project progress.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Worked on the Doomsday (ZeroHour) website, including user signup functionality, user panel, and shop page.",
      "Guided Emaad regarding the LMS in PIGROTECH.Guided Abdullah on his assigned work and project tasks."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-07T14:43:17.349Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_21",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-10-06",
    "content": "today working report\n.......................................\ndate: 06-10-2026\n.......................................\n\nTask:\ntoday i work on drive flex mobile app with malaika and i work on drive flex website backend and admin panel and make it responsive and functional and discuss with sir hamza and i interviewed a guy today...",
    "tasksCompleted": [
      "today working report",
      "date: 06-10-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-06T14:45:17.753Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_22",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-06",
    "content": "Task :\nI worked on linkdein and reddit leads tool and optimized it's ui and made it working and dealed  with fixture king posts and also dealed with salman regarding erp chat bot",
    "tasksCompleted": [
      "Task :",
      "I worked on linkdein and reddit leads tool and optimized it's ui and made it working and dealed  with fixture king posts and also dealed with salman regarding erp chat bot"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-06T15:36:01.990Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_23",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-06",
    "content": "Today\u2019s Working Report\n- Fixed the Optimizer endpoint and resolved related errors.\n- Worked on the Doomsday and ZeroHour websites.\n- Coordinated with the team regarding ongoing tasks and project updates.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "- Fixed the Optimizer endpoint and resolved related errors.",
      "- Worked on the Doomsday and ZeroHour websites."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-06T15:17:34.297Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_24",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-10-05",
    "content": "today working report\n.......................................\ndate: 05-10-2026\n.......................................\n\nTask:\ntoday i work on driveflex mobile app with malaika and made several changes and make it functional....",
    "tasksCompleted": [
      "today working report",
      "date: 05-10-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-05T15:05:32.451Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_25",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-05",
    "content": "Task :\nI worked on leads research for linkdein and reddit leads and first tried to make it with coding but then i shifted to n8n and achieved linkdein leads trying to optimizeit then i will move to reddit leads and dealed with novarch and skillzen",
    "tasksCompleted": [
      "Task :",
      "I worked on leads research for linkdein and reddit leads and first tried to make it with coding but then i shifted to n8n and achieved linkdein leads trying to optimizeit then i will move to reddit leads and dealed with novarch and skillzen"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-05T15:17:10.139Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_26",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-05",
    "content": "Today\u2019s Working Report\n- Made the required changes to sections in the PIGROTECH project and pushed the updated code.\n- Coordinated with the team regarding ongoing tasks and project progress.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "- Made the required changes to sections in the PIGROTECH project and pushed the updated code.",
      "- Coordinated with the team regarding ongoing tasks and project progress."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-05T15:01:51.762Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_27",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-10-03",
    "content": "today working report\n.......................................\ndate: 03-10-2026\n.......................................\n\nTask:\nToday i work on driveflex app with malaika. We made many changes and add new pages in app and make it functional\u2026",
    "tasksCompleted": [
      "today working report",
      "date: 03-10-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-03T16:23:15.325Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_28",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-03",
    "content": "Task :\nI worked on drive flex platform research and aligned the investor questions  as discussed with sir hamza and  worked on pilot launch and discovery phase and completed the ppt on sir hamza's concept",
    "tasksCompleted": [
      "Task :",
      "I worked on drive flex platform research and aligned the investor questions  as discussed with sir hamza and  worked on pilot launch and discovery phase and completed the ppt on sir hamza's concept"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-03T14:18:57.210Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_29",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-03",
    "content": "Today\u2019s Working Report\n- Managed attendance records and updates in the ERP system.\n- Attached and configured the domain for Optimizer.\n- Discussed PIGROTECH project updates and requirements with Emaad.\n- Coordinated with the team and discussed ongoing tasks and project progress.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "- Managed attendance records and updates in the ERP system.",
      "- Attached and configured the domain for Optimizer."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-03T15:01:59.832Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_30",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-10-02",
    "content": "today working report\n.......................................\ndate: 02-10-2026\n.......................................\n\nTask:\ntoday i work on fixture king website i add new home content given py SEO team and i work on drive flex app with malaika...",
    "tasksCompleted": [
      "today working report",
      "date: 02-10-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-02T15:08:50.770Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_31",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-02",
    "content": "Task :\nI worked on drive flex platform research and analyze various competitors and researched about the business model , locations to taget entry strategies and related terms and conditions and the architecture",
    "tasksCompleted": [
      "Task :",
      "I worked on drive flex platform research and analyze various competitors and researched about the business model , locations to taget entry strategies and related terms and conditions and the architecture"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-02T14:40:42.578Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_32",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-02",
    "content": "Today\u2019s Working Report\nReviewed Emaad\u2019s work and provided the necessary guidance. Discussed task progress and project updates with Huzaifa and Malaika, and coordinated with the team to align ongoing tasks and ensure smooth workflow.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Reviewed Emaad\u2019s work and provided the necessary guidance. Discussed task progress and project updates with Huzaifa and Malaika, and coordinated with the team to align ongoing tasks and ensure smooth workflow."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-02T15:42:36.084Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_33",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-10-01",
    "content": "today working report\n.......................................\ndate: 01-10-2026\n.......................................\n\nTask:\nToday i made some changes in driveflex website and work on driveflex app with malaika and discuss this project with sir hamza\u2026",
    "tasksCompleted": [
      "today working report",
      "date: 01-10-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-01T15:45:20.679Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_34",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-10-01",
    "content": "Task :\nI worked on drive flex research and researched about competitors and did meeting with mern team explaining the product and dealed with umer regarding trinutra video",
    "tasksCompleted": [
      "Task :",
      "I worked on drive flex research and researched about competitors and did meeting with mern team explaining the product and dealed with umer regarding trinutra video"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-10-01T14:15:44.004Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_35",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-10-01",
    "content": "Today\u2019s Working Report\nDiscussed the Rent a Car project with Huzaifa and Malaika. Guided Malaika on the MissNuos pages, worked on PrigroTech with Emaad, and coordinated with the team regarding ongoing tasks and project progress.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Discussed the Rent a Car project with Huzaifa and Malaika. Guided Malaika on the MissNuos pages, worked on PrigroTech with Emaad, and coordinated with the team regarding ongoing tasks and project progress."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-10-01T15:45:49.957Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_36",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-09-30",
    "content": "today working report\n.......................................\ndate: 30-09-2026\n.......................................\n\nTask:\ntoday i work on drive flex website",
    "tasksCompleted": [
      "today working report",
      "date: 30-09-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-30T15:29:22.374Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_37",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-09-30",
    "content": "Task :\nI worked on trinutra video shoot and made video clips for this and made script for omega 3 product with Faizan dealed with dilshad and discussed about drive flex app with sir hamza and discussed things with sir awais",
    "tasksCompleted": [
      "Task :",
      "I worked on trinutra video shoot and made video clips for this and made script for omega 3 product with Faizan dealed with dilshad and discussed about drive flex app with sir hamza and discussed things with sir awais"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-09-30T15:18:41.276Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_38",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-09-30",
    "content": "Today\u2019s Working Report\nDiscussed and prepared the Rent a Car project workflow, aligned the requirements, and assigned tasks to the team. Assisted Musa with recording the Trinutra video and coordinated with the team regarding ongoing work. Also discussed PrigroTech project requirements and updates with Emaad.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Discussed and prepared the Rent a Car project workflow, aligned the requirements, and assigned tasks to the team. Assisted Musa with recording the Trinutra video and coordinated with the team regarding ongoing work. Also discussed PrigroTech project requirements and updates with Emaad."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-30T14:55:19.244Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_39",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-09-29",
    "content": "today working report\n.......................................\ndate: 29-09-2026\n.......................................\n\nTask:\ntoday i check all the changes in cattle farm project given to malaika and work on driveflex website and app and discuss this car rental project with sir hamza and today internet nhi chal rha tha......",
    "tasksCompleted": [
      "today working report",
      "date: 29-09-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-29T14:13:03.079Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_40",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-09-29",
    "content": "Task :\nI worked on video generation with dilshad and aligned things with them regarding the sample video and dealed with umer and worked on trinutra shoot and dealed with urwa regarding articles piblishing and made client testimonials script for fixture king and trinutra",
    "tasksCompleted": [
      "Task :",
      "I worked on video generation with dilshad and aligned things with them regarding the sample video and dealed with umer and worked on trinutra shoot and dealed with urwa regarding articles piblishing and made client testimonials script for fixture king and trinutra"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-09-29T15:16:35.038Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_41",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-09-29",
    "content": "Today\u2019s Working Report\nWorked with Emaad on the NOVARCH Community Page and pushed the latest code. Assigned Talha as Team Lead, configured his team, and set up the required hierarchy in ERP . Also coordinated with Huzaifa and Malaika regarding their ongoing work.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Worked with Emaad on the NOVARCH Community Page and pushed the latest code. Assigned Talha as Team Lead, configured his team, and set up the required hierarchy in ERP . Also coordinated with Huzaifa and Malaika regarding their ongoing work."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-29T14:59:33.917Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_42",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-09-28",
    "content": "today working report\n.......................................\ndate: 28-09-2026\n.......................................\n\nTask:\ntoday i check the changes in cattle farm project given to malaika and test the cattle farm software and make sure everything is fully in working and with malaika help i work on driveflex car rental app.",
    "tasksCompleted": [
      "today working report",
      "date: 28-09-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-28T15:02:37.609Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_43",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-09-28",
    "content": "Task :\nI worked on ai video generation with dilshad for chick peas and dealed accordingly and also works on trinutra product scripts  and researched on client testimonials and did meeting with sir meesam regarding novarch web. Deployment on novarch s vercel and for akilis proceedings",
    "tasksCompleted": [
      "Task :",
      "I worked on ai video generation with dilshad for chick peas and dealed accordingly and also works on trinutra product scripts  and researched on client testimonials and did meeting with sir meesam regarding novarch web. Deployment on novarch s vercel and for akilis proceedings"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-09-28T14:11:24.408Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_44",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-09-28",
    "content": "Today\u2019s Working Report\nUpdated the MissNuos favicon and pushed the changes to the live website. Worked with Emaad on the NOVARCH project and coordinated with the team regarding ongoing tasks and project work.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Updated the MissNuos favicon and pushed the changes to the live website. Worked with Emaad on the NOVARCH project and coordinated with the team regarding ongoing tasks and project work."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-28T14:30:06.489Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_45",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-09-26",
    "content": "Work on driveflex app with malaika help and check the cattle farm project changes given to malaika",
    "tasksCompleted": [
      "Work on driveflex app with malaika help and check the cattle farm project changes given to malaika"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-26T13:45:20.120Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_46",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-09-26",
    "content": "TASK :\nI worked on ai video generation for fuel her gains channel and added fixes to it and generated video and refined scripts for trinutra products",
    "tasksCompleted": [
      "TASK :",
      "I worked on ai video generation for fuel her gains channel and added fixes to it and generated video and refined scripts for trinutra products"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-09-26T15:05:42.411Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_47",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-09-26",
    "content": "Today\u2019s Working Report\n\nUpdated the weekly attendance records of all employees in the ERP, updated the MissNuos logo, and redesigned the navbar style. Also coordinated with the team regarding their ongoing work and requirements.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Updated the weekly attendance records of all employees in the ERP, updated the MissNuos logo, and redesigned the navbar style. Also coordinated with the team regarding their ongoing work and requirements."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-26T14:15:45.340Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_48",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-09-25",
    "content": "today working report\n.......................................\ndate: 25-09-2026\n.......................................\n\nTask:\ntoday I asked Malaika to fix some issues in the cattle farm project because some pages were missing. I also gave her a few more changes to make. I also read the Quran today.",
    "tasksCompleted": [
      "today working report",
      "date: 25-09-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-25T13:38:42.467Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_49",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-09-25",
    "content": "Task :\nI worked on ai video script for chia seeds and mango lassi video completion and worked on trinutra products video script for reels",
    "tasksCompleted": [
      "Task :",
      "I worked on ai video script for chia seeds and mango lassi video completion and worked on trinutra products video script for reels"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-09-25T13:45:08.739Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_50",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-09-24",
    "content": "Today\u2019s Working Report\n\nWorked on the PrigroTech Tax Service Page, converted it into a Tax Service Course page, and added a dedicated section for Doreen Valme\u2019s profile. Also coordinated with the PrigroTech team regarding ongoing project work and requirements.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Worked on the PrigroTech Tax Service Page, converted it into a Tax Service Course page, and added a dedicated section for Doreen Valme\u2019s profile. Also coordinated with the PrigroTech team regarding ongoing project work and requirements."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-24T14:54:08.111Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_51",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-09-24",
    "content": "today working report\n.......................................\ndate: 24-09-2026\n.......................................\n\nTask:\ntoday (all credits go to malaika)    with malaika help i worked on the car rental app and It is currently in the testing phase  and there are still several changes and bugs that we will work on tomorrow and i also connected the cattle farm project with the ERP plans so the features are now linked according to the selected plan........",
    "tasksCompleted": [
      "today working report",
      "date: 24-09-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-24T14:15:41.685Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_52",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-09-24",
    "content": "Task :\nI worked on ai video generation and generated mango lassi complete video for YouTube and worked on article gen bot still facing vercel issues and made trinutra product script",
    "tasksCompleted": [
      "Task :",
      "I worked on ai video generation and generated mango lassi complete video for YouTube and worked on article gen bot still facing vercel issues and made trinutra product script"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-09-24T14:58:38.432Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_53",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-09-23",
    "content": "Today\u2019s Working Report\n\nWorked on the PrigroTech Tax Service Page and created the page based on the provided details. Coordinated with Malaika regarding ongoing work and collaborated with Emaad and Abdullah on their respective tasks.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Worked on the PrigroTech Tax Service Page and created the page based on the provided details. Coordinated with Malaika regarding ongoing work and collaborated with Emaad and Abdullah on their respective tasks."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-23T14:41:36.896Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_54",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-09-23",
    "content": "today working report\n.......................................\ndate: 23-09-2026\n.......................................\n\nTask:\ntoday i checked all the changes i had given to malaika for the Cattle Farm Management project in detail Malaika also shared the code files with me for final testing and Sir Hamza had also assigned the Car Rental project and the web team is currently working on it Abdullah shared the website files with me for review...",
    "tasksCompleted": [
      "today working report",
      "date: 23-09-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-23T14:48:22.792Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_55",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-09-23",
    "content": "Task :\nI worked on article gen bot fixes asked by urwa for pinterest sorting and worked on generating script for trinutra product and dealed with huzaifa regarding fixture king email bug",
    "tasksCompleted": [
      "Task :",
      "I worked on article gen bot fixes asked by urwa for pinterest sorting and worked on generating script for trinutra product and dealed with huzaifa regarding fixture king email bug"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-09-23T14:03:52.452Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_56",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-09-22",
    "content": "Today\u2019s Working Report\nWorked on the Rent a Car project, aligned the tasks and assigned responsibilities to the team. Worked on the PrigroTech Service Page, guided Emaad and Abdullah regarding the Car Rental project, and coordinated with the team on ongoing work.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Worked on the Rent a Car project, aligned the tasks and assigned responsibilities to the team. Worked on the PrigroTech Service Page, guided Emaad and Abdullah regarding the Car Rental project, and coordinated with the team on ongoing work."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-22T13:40:15.000Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_57",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-09-22",
    "content": "today working report\n.......................................\ndate: 22-09-2026\n.......................................\n\nTask:\ntoday i resolved an issue on the Fixture King website where emails were not being received by the admin and i also had a team meeting with Team Leader Salman and assigned car rental project to the team  and explained the project requirements and workflow to them and i reviewed the changes that i assigned to Malaika for the Cattle Farm Management project...",
    "tasksCompleted": [
      "today working report",
      "date: 22-09-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-22T13:51:47.482Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_58",
    "userId": {
      "_id": "u_musa",
      "name": "Ali musa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772695191/Hattechmedia/cupuq5katyy8dhbgy3qc.jpg"
    },
    "date": "2026-09-22",
    "content": "Task :\nI worked on ai video completion with dilshad and dealed with umer and dealed with emaad regarding the meeting notes functionality to the lead tool and made script for trinutra product and dealed with huzaifa regarding fixture king email bounce",
    "tasksCompleted": [
      "Task :",
      "I worked on ai video completion with dilshad and dealed with umer and dealed with emaad regarding the meeting notes functionality to the lead tool and made script for trinutra product and dealed with huzaifa regarding fixture king email bounce"
    ],
    "hoursWorked": 8.0,
    "status": "submitted",
    "createdAt": "2026-09-22T14:05:50.423Z",
    "verifiedBy": "u_salman"
  },
  {
    "_id": "rep_59",
    "userId": {
      "_id": "u_salman",
      "name": "Muhammad Salman",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772780468/Hattechmedia/gb9mluzkdlsiwmpupn5f.jpg"
    },
    "date": "2026-09-21",
    "content": "Today\u2019s Working Report\n\nWorked on the PrigroTech website and made it fully responsive across devices. Fixed several ERP email-related issues and coordinated with the team to discuss the Rent a Car project and its requirements.",
    "tasksCompleted": [
      "Today\u2019s Working Report",
      "Worked on the PrigroTech website and made it fully responsive across devices. Fixed several ERP email-related issues and coordinated with the team to discuss the Rent a Car project and its requirements."
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-21T14:33:12.492Z",
    "verifiedBy": "u_admin"
  },
  {
    "_id": "rep_60",
    "userId": {
      "_id": "u_huzaifa",
      "name": "Muhammad Huzaifa",
      "avatar": "https://res.cloudinary.com/dhxn3ur9a/image/upload/v1772786664/Hattechmedia/at8n0lorb9rlqhdkdipf.jpg"
    },
    "date": "2026-09-21",
    "content": "today working report\n.......................................\ndate: 21-09-2026\n.......................................\n\nTask:\nToday  I explained all the changes that needed to be made to Malaika in the complete Cattle Farm Management project. I explain every part of the project in detail and Tomorrow I will share the file with her so she can implement the required changes and I also discussed the Car Rental project with the team and asked them to conduct research on it  as per our team lead Salman\u2019s instructions......\n                thankyou......u r most welcome.....my pleasure.....",
    "tasksCompleted": [
      "today working report",
      "date: 21-09-2026",
      "Task:"
    ],
    "hoursWorked": 8.0,
    "status": "verified",
    "createdAt": "2026-09-21T14:52:55.939Z",
    "verifiedBy": "u_salman"
  }
];
const SEED_ATTENDANCE = [
  {
    "_id": "att_1",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-10-10",
    "checkIn": "07:22",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_2",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-10-10",
    "checkIn": "11:37",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_3",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-10-10",
    "checkIn": null,
    "checkOut": null,
    "status": "leave",
    "late": false
  },
  {
    "_id": "att_4",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-10-09",
    "checkIn": "12:00",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_5",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-10-09",
    "checkIn": "07:10",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_6",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-10-09",
    "checkIn": "07:38",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_7",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-10-08",
    "checkIn": "09:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_8",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-10-08",
    "checkIn": "07:07",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_9",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-10-08",
    "checkIn": "07:20",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_10",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-10-07",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_11",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-10-07",
    "checkIn": "09:30",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_12",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-10-07",
    "checkIn": "07:22",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_13",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-10-06",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_14",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-10-06",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_15",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-10-06",
    "checkIn": "07:00",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_16",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-10-05",
    "checkIn": "07:24",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_17",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-10-05",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_18",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-10-05",
    "checkIn": "11:00",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_19",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-10-03",
    "checkIn": "06:45",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_20",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-10-03",
    "checkIn": "11:37",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_21",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-10-03",
    "checkIn": "07:06",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_22",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-10-02",
    "checkIn": "07:18",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_23",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-10-02",
    "checkIn": "07:20",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_24",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-10-02",
    "checkIn": "07:20",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_25",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-10-01",
    "checkIn": "07:25",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_26",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-10-01",
    "checkIn": "07:25",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_27",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-10-01",
    "checkIn": "07:10",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_28",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-30",
    "checkIn": "07:14",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_29",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-30",
    "checkIn": "07:14",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_30",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-30",
    "checkIn": "07:07",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_31",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-29",
    "checkIn": "07:10",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_32",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-29",
    "checkIn": "10:11",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_33",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-29",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_34",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-28",
    "checkIn": "07:27",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_35",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-28",
    "checkIn": "07:10",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_36",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-28",
    "checkIn": "09:33",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_37",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-26",
    "checkIn": "07:10",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_38",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-26",
    "checkIn": "11:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_39",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-26",
    "checkIn": "07:00",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_40",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-25",
    "checkIn": "06:45",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_41",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-25",
    "checkIn": "08:58",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_42",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-25",
    "checkIn": null,
    "checkOut": null,
    "status": "leave",
    "late": false
  },
  {
    "_id": "att_43",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-24",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_44",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-24",
    "checkIn": "07:05",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_45",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-24",
    "checkIn": "09:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_46",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-23",
    "checkIn": "07:27",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_47",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-23",
    "checkIn": "07:27",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_48",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-23",
    "checkIn": "07:00",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_49",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-22",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_50",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-22",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_51",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-22",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_52",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-21",
    "checkIn": "06:30",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_53",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-21",
    "checkIn": "09:14",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_54",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-21",
    "checkIn": "09:14",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_55",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-19",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_56",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-19",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_57",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-19",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_58",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-18",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_59",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-18",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_60",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-18",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_61",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-17",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_62",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-17",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_63",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-17",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_64",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-16",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_65",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-16",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_66",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-16",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_67",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-15",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_68",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-15",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_69",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-15",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_70",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-14",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_71",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-14",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_72",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-14",
    "checkIn": "08:50",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_73",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-12",
    "checkIn": "07:22",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_74",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-12",
    "checkIn": "06:30",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_75",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-12",
    "checkIn": "07:22",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_76",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-11",
    "checkIn": "07:40",
    "checkOut": "17:30",
    "status": "late",
    "late": false
  },
  {
    "_id": "att_77",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-11",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_78",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-11",
    "checkIn": "07:40",
    "checkOut": "17:30",
    "status": "late",
    "late": false
  },
  {
    "_id": "att_79",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-10",
    "checkIn": "07:39",
    "checkOut": "17:30",
    "status": "late",
    "late": false
  },
  {
    "_id": "att_80",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-10",
    "checkIn": "07:27",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_81",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-10",
    "checkIn": "07:29",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_82",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-09",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_83",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-09",
    "checkIn": "07:24",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_84",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-09",
    "checkIn": "07:24",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_85",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-08",
    "checkIn": "07:25",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_86",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-08",
    "checkIn": "07:22",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_87",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-08",
    "checkIn": "07:25",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_88",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-07",
    "checkIn": "07:30",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_89",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-07",
    "checkIn": "07:25",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_90",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-07",
    "checkIn": "07:25",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_91",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-05",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_92",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-05",
    "checkIn": "07:25",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_93",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-05",
    "checkIn": "07:25",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_94",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-04",
    "checkIn": "07:23",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_95",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-04",
    "checkIn": "07:27",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_96",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-04",
    "checkIn": "07:27",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_97",
    "employeeId": "emp_huzaifa",
    "userId": "u_huzaifa",
    "date": "2026-09-03",
    "checkIn": "07:18",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_98",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-03",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_99",
    "employeeId": "emp_salman",
    "userId": "u_salman",
    "date": "2026-09-03",
    "checkIn": "07:15",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  },
  {
    "_id": "att_100",
    "employeeId": "emp_musa",
    "userId": "u_musa",
    "date": "2026-09-02",
    "checkIn": "07:10",
    "checkOut": "17:30",
    "status": "present",
    "late": false
  }
];
const SEED_PAYROLL = [
  {
    "_id": "pay_salman_1",
    "employeeId": "emp_salman",
    "employeeName": "Muhammad Salman",
    "month": 10,
    "year": 2026,
    "basicSalary": 6200,
    "bonus": 500,
    "deductions": 0,
    "netSalary": 6700,
    "status": "paid",
    "paidOn": "2026-10-05T10:00:00.000Z",
    "currency": "EUR"
  },
  {
    "_id": "pay_huzaifa_1",
    "employeeId": "emp_huzaifa",
    "employeeName": "Muhammad Huzaifa",
    "month": 10,
    "year": 2026,
    "basicSalary": 5800,
    "bonus": 450,
    "deductions": 0,
    "netSalary": 6250,
    "status": "paid",
    "paidOn": "2026-10-05T10:00:00.000Z",
    "currency": "EUR"
  },
  {
    "_id": "pay_musa_1",
    "employeeId": "emp_musa",
    "employeeName": "Ali musa",
    "month": 10,
    "year": 2026,
    "basicSalary": 6500,
    "bonus": 600,
    "deductions": 0,
    "netSalary": 7100,
    "status": "paid",
    "paidOn": "2026-10-05T10:00:00.000Z",
    "currency": "EUR"
  },
  {
    "_id": "pay_aliraza_1",
    "employeeId": "emp_aliraza",
    "employeeName": "Ali Raza",
    "month": 10,
    "year": 2026,
    "basicSalary": 2200,
    "bonus": 150,
    "deductions": 0,
    "netSalary": 2350,
    "status": "paid",
    "paidOn": "2026-10-05T10:00:00.000Z",
    "currency": "EUR"
  }
];
const SEED_ACHIEVEMENTS = [
  {
    "_id": "ach_1",
    "employeeId": "emp_huzaifa",
    "employeeName": "Muhammad Huzaifa",
    "title": "Cloud Deployment Champion",
    "description": "Successfully completed zero-downtime deployment for the Cattle Farm ERP & SAAS platforms.",
    "date": "2026-10-14",
    "badge": "rocket"
  },
  {
    "_id": "ach_2",
    "employeeId": "emp_salman",
    "employeeName": "Muhammad Salman",
    "title": "Security & Architecture Excellence",
    "description": "Spearheaded cyber-security fortification and Stripe payment gateway integration.",
    "date": "2026-10-13",
    "badge": "shield"
  },
  {
    "_id": "ach_3",
    "employeeId": "emp_musa",
    "employeeName": "Ali musa",
    "title": "AI Innovation Milestone",
    "description": "Engineered automated data preprocessing and high-throughput search indexing pipelines.",
    "date": "2026-10-11",
    "badge": "zap"
  }
];
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
