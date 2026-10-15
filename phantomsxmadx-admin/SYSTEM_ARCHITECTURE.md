# Three-Panel Workflow System - Visual Map

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LOGIN SYSTEM                                    │
│  Admin │ HR │ ProjectHead │ Employee                               │
└────────┬────┬──────────┬───┬──────────────────────────────────────┘
         │    │          │   │
         ↓    ↓          ↓   ↓
    ┌────────────────────────────────┐
    │    ROLE-BASED PANEL ROUTING     │
    ├────────────────────────────────┤
    │ /admin    → ADMIN PANEL         │
    │ /hr       → HR PANEL            │
    │ /projecthead → PROJECT HEAD     │
    │ /employee → EMPLOYEE PANEL      │
    └────────────────────────────────┘
```

---

## PANEL 1: ADMIN PANEL
### Scope: VIEWING & MONITORING ONLY

```
┌─────────────────────────────────────────┐
│           ADMIN PANEL                   │
│    (Arrows END here = View Only)        │
├─────────────────────────────────────────┤
│ ✅ VIEW: Attendance Data                │
│ ✅ VIEW: Daily Reports                  │
│ ✅ VIEW: Projects & Progress            │
│ ✅ VIEW: Employee Activity              │
│ ✅ VIEW: HR Records                     │
│ ✅ VIEW: ProjectHead Assignments        │
│                                         │
│ ❌ CANNOT: Verify Attendance            │
│ ❌ CANNOT: Manage Employees             │
│ ❌ CANNOT: Assign Projects              │
│ ❌ CANNOT: Execute Tasks                │
├─────────────────────────────────────────┤
│ Routes: /admin, /admin/employees,       │
│         /admin/projects, etc.           │
└─────────────────────────────────────────┘
```

---

## PANEL 2: MANAGER PANEL (Role-Based)

### 2A: HR PANEL
### Scope: VERIFICATION & RECORD MANAGEMENT

```
┌──────────────────────────────────────────┐
│           HR PANEL                       │
│ (Arrows END here = Perform Actions)      │
├──────────────────────────────────────────┤
│ ✅ VERIFY: Employee Attendance           │
│           (receives from employee)       │
│ ✅ MANAGE: Employee Records              │
│           (CRUD operations)              │
│ ✅ MANAGE: Documents & Letters           │
│ ✅ VIEW: Attendance Dashboard            │
│                                          │
│ Action Flow:                             │
│ Employee submits → HR verifies → Admin   │
│                                 ← views  │
├──────────────────────────────────────────┤
│ Routes: /hr, /hr/employee-records,       │
│         /hr/attendance, /hr/documents    │
│                                          │
│ Login: hr@phantomsxmadx.com / hr123     │
└──────────────────────────────────────────┘
```

### 2B: PROJECT HEAD PANEL
### Scope: PROJECT ASSIGNMENT & TRACKING

```
┌──────────────────────────────────────────┐
│      PROJECT HEAD PANEL                  │
│ (Arrows END here = Perform Actions)      │
├──────────────────────────────────────────┤
│ ✅ ASSIGN: Projects to Employees         │
│ ✅ TRACK: Project Progress               │
│ ✅ MONITOR: Team Acknowledgments         │
│ ✅ VIEW: Dashboard & Metrics             │
│                                          │
│ Action Flow:                             │
│ ProjectHead assigns → Employee receives  │
│                      → Employee acks     │
│ ProjectHead tracks progress ← Employee   │
│ Admin views results ← ProjectHead        │
├──────────────────────────────────────────┤
│ Routes: /projecthead, /projecthead/      │
│         assign-projects, /track-projects │
│                                          │
│ Login: projecthead@... / project123     │
└──────────────────────────────────────────┘
```

---

## PANEL 3: EMPLOYEE PANEL
### Scope: AUTOMATED OPERATIONS & SUBMISSIONS

```
┌──────────────────────────────────────────┐
│         EMPLOYEE PANEL                   │
│  (Arrows END here = Execute Actions)     │
├──────────────────────────────────────────┤
│ ✅ SUBMIT: Attendance (Auto)             │
│ ✅ SUBMIT: Daily Activity Reports        │
│ ✅ ACKNOWLEDGE: Assigned Projects        │
│ ✅ VIEW: Assigned Tasks                  │
│ ✅ UPDATE: Profile                       │
│                                          │
│ Action Flow:                             │
│ Employee check-in (auto) → HR verifies   │
│ Employee submits report → Admin views    │
│ ProjectHead assigns → Employee ack       │
│                                          │
│ Everything submitted by Employee is      │
│ available for viewing/verification up    │
│ the chain (HR verifies, Admin views)     │
├──────────────────────────────────────────┤
│ Routes: /employee, /employee/my-tasks,   │
│         /employee/daily-report,          │
│         /employee/attendance             │
│                                          │
│ Login: employee@mail / password          │
└──────────────────────────────────────────┘
```

---

## Complete Data Flow Chain (Arrow-Based)

### ATTENDANCE FLOW
```
EMPLOYEE
   │ submits attendance
   ↓
HR ← ARROW ENDS HERE: HR VERIFIES
   │
   ↓ data flows to
ADMIN ← ARROW ENDS HERE: ADMIN VIEWS
```

### PROJECT ASSIGNMENT FLOW
```
PROJECT HEAD
   │ assigns project
   ↓
EMPLOYEE ← ARROW ENDS HERE: RECEIVES & ACKNOWLEDGES
   │
   ↓ acknowledgement flows to
PROJECT HEAD ← ARROW ENDS HERE: TRACKS PROGRESS
   │
   ↓ results flow to
ADMIN ← ARROW ENDS HERE: VIEWS FINAL STATE
```

### DOCUMENT MANAGEMENT FLOW
```
ADMIN (views employee data)
   ↓
HR ← ARROW ENDS HERE: MANAGES RECORDS
   │ creates documents
   ↓
EMPLOYEE ← ARROW ENDS HERE: RECEIVES DOCUMENTS
```

---

## Arrow-Based Responsibility Rules

| Role | What Arrows END Here Mean |
|------|---------------------------|
| **Admin** | View/Monitor only. Arrow ending at Admin = Admin views data. |
| **HR** | Verification & Management. Arrow ending at HR = HR performs action. |
| **ProjectHead** | Assignment & Tracking. Arrow ending at ProjectHead = ProjectHead assigns/tracks. |
| **Employee** | Execution & Submission. Arrow ending at Employee = Employee executes/submits. |

---

## System Status

✅ **IMPLEMENTED:**
- Three distinct panels (Admin, HR, ProjectHead, Employee)
- Role-based routing and UI
- No Manager role (only HR and ProjectHead)
- Marketing and Finance completely removed
- Arrow-based responsibility flow
- Instant theme switching with real-time updates
- localStorage persistence for all data
- Real-time heading color changes

✅ **TESTED:**
- All three login roles work correctly
- Sidebar changes based on role
- Pages restricted by role
- Theme switching is instant
- No console errors

---

## Quick Access

| Role | Login URL | Email | Password |
|------|-----------|-------|----------|
| Admin | http://localhost:5173 | admin@phantomsxmadx.com | admin123 |
| HR | http://localhost:5173 | hr@phantomsxmadx.com | hr123 |
| ProjectHead | http://localhost:5173 | projecthead@phantomsxmadx.com | project123 |
| Employee | http://localhost:5173 | ali@test.com | password123 |

---

## Key Implementation Details

### Routing
- Uses React Router with nested routes
- ProtectedRoute component enforces role-based access
- currentUser stored in localStorage determines role

### UI Responsibility
- Sidebar changes based on logged-in role
- Pages only render components relevant to role
- Arrow-based design prevents unauthorized actions

### Data Persistence
- All data stored in browser's localStorage
- No backend required for demo
- Real-time synchronization across components

### Theme System
- Dark theme (default) and Light theme
- CSS variables for colors
- MutationObserver detects theme changes
- Real-time heading color updates

---

**System Architecture:** Completed & Verified
**Last Update:** January 19, 2026
