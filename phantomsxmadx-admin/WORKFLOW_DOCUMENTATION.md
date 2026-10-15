# PhantomSXMADX Admin System - Workflow Documentation

## System Overview
Three-panel management system with role-based access and arrow-based responsibility assignment.

---

## CRITICAL RULE: Arrow-Based Responsibility
**The responsibility of an action belongs to the element where the arrow ENDS.**
- If arrow ends at **Admin** → Admin views/monitors only
- If arrow ends at **HR** → HR performs that action  
- If arrow ends at **ProjectHead** → ProjectHead performs that action
- If arrow ends at **Employee** → Employee performs that action

---

## PANEL 1: ADMIN PANEL
**Role:** Super Admin (View-Only, No Execution)

### Login Credentials
- **Email:** admin@phantomsxmadx.com
- **Password:** admin123

### Responsibilities (Where Arrow Ends at Admin)
Admin can **VIEW and MONITOR ONLY**:
- ✅ View Employee Attendance data
- ✅ View Daily Activity reports
- ✅ View Weekly Assessments
- ✅ View Projects overview
- ✅ View HR data and records
- ✅ View ProjectHead assignments and progress

### What Admin CANNOT Do (Arrow Doesn't End at Admin)
- ❌ Verify attendance (HR verifies)
- ❌ Manage employee records (HR manages)
- ❌ Assign projects (ProjectHead assigns)
- ❌ Execute operational tasks

### Pages Available
- Dashboard (view all metrics)
- Employees (view list)
- Projects (view list)
- Employee Activity (view reports)
- Bookings (view calendar)
- Profile (admin settings)
- Chat (communication only)

---

## PANEL 2: MANAGER PANEL
**Role-Based:** HR OR ProjectHead (No Standalone Manager Role)

### Panel Architecture
Manager Panel is **role-based upon login**:
- Login with HR credentials → HR Panel appears
- Login with ProjectHead credentials → ProjectHead Panel appears
- **Marketing and Finance completely removed**

---

### PANEL 2A: HR ROLE
**Login Credentials:**
- **Email:** hr@phantomsxmadx.com
- **Password:** hr123

#### Responsibilities (Where Arrow Ends at HR)
- ✅ Verify Attendance (receives attendance data from employees)
- ✅ Manage Employee Records (add, edit, delete)
- ✅ Manage Documents (joining docs, letters, etc.)
- ✅ Manage Letters and Communications

#### Arrow Flow for HR
```
Employee submits attendance → HR verifies ✓
Employee joins → HR creates documents ✓
HR manages employee database ✓
```

#### Pages Available
- HR Dashboard (metrics and statistics)
- Employee Records (full CRUD operations)
- Attendance Management (verify employee attendance)
- HR Documents (manage letters, joining docs)
- Profile (HR settings)
- Chat & Notifications

---

### PANEL 2B: PROJECT HEAD ROLE
**Login Credentials:**
- **Email:** projecthead@phantomsxmadx.com
- **Password:** project123

#### Responsibilities (Where Arrow Ends at ProjectHead)
- ✅ Assign Projects (arrow from ProjectHead to Employee)
- ✅ Track Project Progress
- ✅ Manage team assignments

#### Arrow Flow for ProjectHead
```
ProjectHead assigns project → Employee receives assignment ✓
ProjectHead tracks progress → Views employee work ✓
Employee acknowledges → ProjectHead confirms ✓
```

#### Pages Available
- ProjectHead Dashboard (projects overview)
- Assign Projects (create and assign projects to employees)
- Track Projects (monitor progress and acknowledgments)
- Profile (ProjectHead settings)
- Chat & Notifications

---

## PANEL 3: EMPLOYEE PANEL
**Role:** Employee (Operational/Execution)

### Login Credentials
- **Email:** {employee email}
- **Password:** auto-generated or password123

### Responsibilities (Where Arrow Ends at Employee)
- ✅ Automated Attendance (auto check-in/out)
- ✅ Submit Daily Activity Reports
- ✅ Acknowledge/Accept Project Assignments
- ✅ Provide Weekly Assessments
- ✅ Complete assigned tasks

#### Arrow Flow for Employee
```
Employee auto check-in → Admin views attendance ✓
Employee submits daily report → Admin views reports ✓
Employee receives assignment → Employee acknowledges ✓
Employee completes task → ProjectHead tracks progress ✓
```

#### Pages Available
- My Tasks (assigned tasks)
- Daily Report (submit activity)
- Attendance (view and auto-check-in)
- Profile (employee details)
- Chat & Notifications

---

## DATA FLOW: Arrow-Based Responsibility Chain

### Attendance Flow
```
EMPLOYEE submits attendance
         ↓
HR VERIFIES attendance
         ↓
ADMIN views verified attendance
```
**Responsibility Owner at each stage:** Employee → HR → Admin

### Project Assignment Flow
```
PROJECT HEAD assigns project
         ↓
EMPLOYEE receives assignment
         ↓
EMPLOYEE acknowledges
         ↓
PROJECT HEAD tracks progress
         ↓
ADMIN views final results
```
**Responsibility Owner at each stage:** ProjectHead → Employee → ProjectHead → Admin

### Employee Record Flow
```
ADMIN views employee data
         ↓
HR manages employee records
         ↓
HR creates documents
         ↓
EMPLOYEE receives documents
```
**Responsibility Owner at each stage:** Admin (views) → HR (manages) → Employee (receives)

---

## Key Rules Summary

✅ **IMPLEMENTED:**
1. **Three distinct panels:** Admin, Manager (role-based: HR/ProjectHead), Employee
2. **No Manager role:** Only HR and ProjectHead under Manager
3. **Arrow-based responsibility:** Each action performed by role where arrow ends
4. **Marketing/Finance removed:** Completely eliminated
5. **Role-based UI:** Sidebar and pages change based on login role
6. **Existing UI preserved:** No breaking changes to working features

✅ **ROLE ISOLATION:**
- Admin URL: `/admin/*`
- HR URL: `/hr/*`
- ProjectHead URL: `/projecthead/*`
- Employee URL: `/employee/*`
- Login determines which role panel loads

✅ **CURRENT FEATURES:**
- Login system with three active roles
- Separate layouts for each role
- Dynamic sidebars based on role
- Theme support (dark/light) with instant updates
- Real-time data persistence via localStorage

---

## Testing Checklist

- [ ] Login with each role and verify correct panel appears
- [ ] Verify Admin can only view (no edit buttons on most pages)
- [ ] Verify HR can manage employee records, attendance, documents
- [ ] Verify ProjectHead can assign and track projects
- [ ] Verify Employee can submit attendance and daily reports
- [ ] Verify theme changes apply instantly to headings
- [ ] Verify no Marketing/Finance references remain
- [ ] Test responsive design on mobile
- [ ] Verify all charts and stats display correctly

---

## Development Notes

### Files Modified/Cleaned
- `src/router/AppRoutes.jsx` - Routing configured (Marketing/Finance removed)
- `src/components/ManagerSidebar.jsx` - Cleaned (Marketing/Finance removed)
- All admin, hr, projecthead, employee pages - Implemented with correct responsibility flow

### Technology Stack
- React 18 with Hooks
- Tailwind CSS for styling
- localStorage for data persistence
- Dynamic theme system with CSS variables

---

**Last Updated:** January 19, 2026
**System Status:** ✅ Fully Implemented
