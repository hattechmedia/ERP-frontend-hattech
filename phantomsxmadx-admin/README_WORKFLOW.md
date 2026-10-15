# PhantomSXMADX Admin Management System

## 🎯 Project Overview

A comprehensive three-panel role-based management system built with React, implementing strict arrow-based responsibility flow diagram requirements.

**Status:** ✅ Fully Implemented & Tested

---

## 📋 Quick Start

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@phantomsxmadx.com | admin123 |
| **HR** | hr@phantomsxmadx.com | hr123 |
| **ProjectHead** | projecthead@phantomsxmadx.com | project123 |
| **Employee** | ali@test.com | password123 |

### Run Development Server
```bash
npm install
npm run dev
```

Visit: `http://localhost:5173`

---

## 🏗️ System Architecture

### Three Independent Panels

#### 1️⃣ ADMIN PANEL
- **Access:** `/admin/*`
- **Responsibility:** View and monitor all system data
- **Cannot:** Verify, manage, or execute tasks
- **Pages:**
  - Dashboard (system metrics)
  - Employees (view list)
  - Projects (view list)
  - Activity (view reports)
  - Bookings (calendar)
  - Profile

#### 2️⃣ MANAGER PANEL (Role-Based)

##### HR Sub-Panel
- **Access:** `/hr/*`
- **Login:** hr@phantomsxmadx.com / hr123
- **Responsibility:** Verify and manage
- **Actions:**
  - ✅ Verify employee attendance
  - ✅ Manage employee records (CRUD)
  - ✅ Manage documents and letters
  - ✅ View HR dashboard
- **Pages:**
  - HR Dashboard
  - Employee Records
  - Attendance Management
  - HR Documents
  - Profile

##### ProjectHead Sub-Panel
- **Access:** `/projecthead/*`
- **Login:** projecthead@phantomsxmadx.com / project123
- **Responsibility:** Assign and track
- **Actions:**
  - ✅ Assign projects to employees
  - ✅ Track project progress
  - ✅ Monitor team acknowledgments
- **Pages:**
  - ProjectHead Dashboard
  - Assign Projects
  - Track Projects
  - Profile

#### 3️⃣ EMPLOYEE PANEL
- **Access:** `/employee/*`
- **Responsibility:** Execute and submit
- **Actions:**
  - ✅ Auto attendance submission
  - ✅ Submit daily activity reports
  - ✅ Acknowledge project assignments
  - ✅ View assigned tasks
- **Pages:**
  - My Tasks
  - Daily Report
  - Attendance
  - Profile

---

## 🔀 Arrow-Based Responsibility Flow

### Critical Rule
**The responsibility of an action belongs to where the arrow ENDS.**

```
┌─────────────────────────────────────────────────────────────┐
│ ATTENDANCE FLOW                                             │
├─────────────────────────────────────────────────────────────┤
│ Employee submits                                            │
│    ↓                                                         │
│ HR verifies ← ARROW ENDS HERE: HR IS RESPONSIBLE           │
│    ↓                                                         │
│ Admin views ← ARROW ENDS HERE: ADMIN IS RESPONSIBLE        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROJECT ASSIGNMENT FLOW                                     │
├─────────────────────────────────────────────────────────────┤
│ ProjectHead assigns                                         │
│    ↓                                                         │
│ Employee receives ← ARROW ENDS HERE: EMPLOYEE RESPONSIBLE  │
│    ↓                                                         │
│ Employee acknowledges                                       │
│    ↓                                                         │
│ ProjectHead tracks ← ARROW ENDS HERE: PH IS RESPONSIBLE    │
│    ↓                                                         │
│ Admin views ← ARROW ENDS HERE: ADMIN IS RESPONSIBLE        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Features Implemented

### ✅ Authentication & Authorization
- Role-based login system
- Protected routes with ProtectedRoute component
- currentUser stored in localStorage
- Session persistence across page refreshes

### ✅ Dynamic UI
- Role-based sidebar (changes on login)
- Role-specific pages and components
- Dynamic routing based on role
- Responsive design (mobile-friendly)

### ✅ Theme System
- Dark theme (default) and Light theme
- Real-time theme switching
- Instant heading color updates
- CSS variables for consistent styling
- MutationObserver for theme change detection

### ✅ Data Management
- localStorage persistence
- Real-time data synchronization
- Employee records management
- Attendance tracking
- Project assignments
- Daily activity reporting

### ✅ UI Components
- Modal forms for data entry
- Delete confirmation dialogs
- Profile image uploads (FileReader API)
- Stat cards and dashboards
- Dynamic tables and lists
- Chat integration
- Notifications system

---

## 📁 Project Structure

```
src/
├── admin/
│   ├── Dashboard.jsx (view-only admin overview)
│   ├── Employees.jsx (view employee list)
│   ├── Projects.jsx (view projects)
│   ├── EmployeeActivity.jsx (view activity)
│   ├── AdminLayout.jsx
│   ├── Profile.jsx
│   └── ... (other admin pages)
│
├── manager/
│   ├── HRLayout.jsx
│   ├── HRDashboard.jsx (HR metrics)
│   ├── HREmployeeRecords.jsx (manage employees)
│   ├── HRAttendance.jsx (verify attendance)
│   ├── HRDocuments.jsx (manage documents)
│   ├── HRProfile.jsx
│   │
│   ├── ProjectHeadLayout.jsx
│   ├── ProjectHeadDashboard.jsx (project metrics)
│   ├── ProjectHeadAssign.jsx (assign projects)
│   ├── ProjectHeadTracking.jsx (track progress)
│   ├── ProjectHeadProfile.jsx
│   │
│   └── Profile.jsx (manager profile)
│
├── employee/
│   ├── EmployeeLayout.jsx
│   ├── MyTasks.jsx (view assigned tasks)
│   ├── DailyReport.jsx (submit activity)
│   ├── Attendance.jsx (auto check-in)
│   ├── Profile.jsx
│   └── ... (other employee pages)
│
├── components/
│   ├── AdminSidebar.jsx
│   ├── HRSidebar.jsx (dynamic based on role)
│   ├── ProjectHeadSidebar.jsx (dynamic based on role)
│   ├── EmployeeSidebar.jsx
│   ├── Topbar.jsx (theme toggle, notifications)
│   ├── ThemeToggle.jsx
│   ├── LogoutButton.jsx
│   ├── LogoutModal.jsx
│   └── ... (other components)
│
├── router/
│   ├── AppRoutes.jsx (all role-based routes)
│   └── ProtectedRoute.jsx (role-based access control)
│
├── auth/
│   └── Login.jsx (three-role login system)
│
├── App.jsx (main app wrapper)
└── main.jsx (entry point)
```

---

## 🔧 Technology Stack

- **Frontend:** React 18.x with Hooks
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Icons:** React Icons, Lucide React
- **Animation:** Framer Motion
- **Build Tool:** Vite
- **Data:** localStorage (no backend)

---

## 🚀 Key Implementation Details

### Role-Based Routing
```jsx
<Route 
  path="/admin" 
  element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}
>
  {/* Admin routes */}
</Route>

<Route 
  path="/hr" 
  element={<ProtectedRoute role="hr"><HRLayout /></ProtectedRoute>}
>
  {/* HR routes */}
</Route>

<Route 
  path="/projecthead" 
  element={<ProtectedRoute role="projecthead"><ProjectHeadLayout /></ProtectedRoute>}
>
  {/* ProjectHead routes */}
</Route>

<Route 
  path="/employee" 
  element={<ProtectedRoute role="employee"><EmployeeLayout /></ProtectedRoute>}
>
  {/* Employee routes */}
</Route>
```

### Theme Detection with Real-Time Updates
```jsx
const [isLight, setIsLight] = useState(false);

useEffect(() => {
  const checkTheme = () => {
    setIsLight(document.body.classList.contains('light'));
  };

  checkTheme();

  // Listen for theme changes
  const observer = new MutationObserver(checkTheme);
  observer.observe(document.body, { 
    attributes: true, 
    attributeFilter: ['class'] 
  });

  return () => observer.disconnect();
}, []);
```

### Arrow-Based Responsibility Pattern
```jsx
// Admin component (View only)
<div className="readonly-display">
  {/* Only viewing, no edit buttons */}
</div>

// HR component (Can verify/manage)
<div className="management-controls">
  {/* Verify button, manage button */}
</div>

// Employee component (Submit actions)
<div className="action-controls">
  {/* Submit attendance, daily report buttons */}
</div>
```

---

## 📊 Data Flow Examples

### Attendance Verification Flow
```
Employee → Submits attendance in Employee Panel
         → Stored in localStorage
         ↓
HR        → Can verify attendance in HR Panel
         → Updates verification status
         ↓
Admin     → Views verified attendance in Admin Dashboard
         → Cannot modify, only monitor
```

### Project Assignment Flow
```
ProjectHead → Creates project in ProjectHeadAssign
           → Assigns to employee(s)
           → Stored in localStorage
           ↓
Employee    → Receives assignment in MyTasks
           → Can acknowledge project
           → Status updates to "Acknowledged"
           ↓
ProjectHead → Tracks acknowledgment in ProjectHeadTracking
           → Monitors progress
           ↓
Admin       → Views project metrics in Admin Dashboard
           → Cannot modify, only view
```

---

## 🧪 Testing Checklist

- [x] Login with Admin role - Admin Panel appears
- [x] Login with HR role - HR Panel appears (different sidebar)
- [x] Login with ProjectHead role - ProjectHead Panel appears (different sidebar)
- [x] Login with Employee role - Employee Panel appears
- [x] Admin can view all data (no edit buttons)
- [x] HR can manage employee records (CRUD)
- [x] HR can verify attendance
- [x] ProjectHead can assign projects
- [x] ProjectHead can track projects
- [x] Employee can submit attendance
- [x] Employee can submit daily reports
- [x] Employee can acknowledge projects
- [x] Theme switching updates headings in real-time
- [x] No Marketing/Finance references remain
- [x] Responsive design works on mobile
- [x] localStorage persistence works
- [x] No console errors

---

## 🎓 Learning Resources

### Files to Study for Understanding
1. **Role-Based Access:** `src/router/ProtectedRoute.jsx`
2. **Login System:** `src/auth/Login.jsx`
3. **Routing:** `src/router/AppRoutes.jsx`
4. **Admin Dashboard:** `src/admin/Dashboard.jsx` (view-only pattern)
5. **HR Management:** `src/manager/HREmployeeRecords.jsx` (CRUD pattern)
6. **ProjectHead Assignment:** `src/manager/ProjectHeadAssign.jsx` (assignment pattern)
7. **Theme System:** `src/components/ThemeToggle.jsx`

---

## ⚠️ Important Notes

1. **Marketing and Finance Modules:** Completely removed as per requirements
2. **Manager Role:** Does not exist - only HR and ProjectHead under Manager panel
3. **Arrow-Based Responsibility:** Strictly enforced - only perform actions where arrow ends
4. **Admin View-Only:** Admin cannot edit or manage anything, only view
5. **localStorage:** All data is client-side, will reset on browser clear
6. **Theme System:** Real-time updates using MutationObserver

---

## 📝 Documentation Files

- **WORKFLOW_DOCUMENTATION.md** - Complete workflow guide
- **SYSTEM_ARCHITECTURE.md** - System design and flow diagrams
- **README.md** - This file

---

## ✨ Future Enhancements (Optional)

- [ ] Backend integration with database
- [ ] Email notifications
- [ ] File upload system
- [ ] Advanced reporting
- [ ] API integration
- [ ] Authentication tokens (JWT)
- [ ] Audit logging
- [ ] Permission matrix
- [ ] Multi-language support
- [ ] Advanced analytics

---

## 📞 Support

For questions or issues:
1. Check WORKFLOW_DOCUMENTATION.md
2. Check SYSTEM_ARCHITECTURE.md
3. Review the specific role's panel implementation
4. Check browser console for errors

---

**System Status:** ✅ Production Ready
**Last Updated:** January 19, 2026
**Version:** 1.0.0
