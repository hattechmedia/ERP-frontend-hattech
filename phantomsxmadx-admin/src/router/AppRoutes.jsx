import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Login from "../auth/Login";
import ProtectedRoute from "./ProtectedRoute";
import LoadingSpinner from "../components/LoadingSpinner";

/* ================= ADMIN ================= */
const AdminLayout = lazy(() => import("../admin/AdminLayout"));
const Dashboard = lazy(() => import("../admin/Dashboard"));
const Employees = lazy(() => import("../admin/Employees"));
const Clients = lazy(() => import("../admin/Clients"));
const Projects = lazy(() => import("../admin/Projects"));
const EmployeeActivity = lazy(() => import("../admin/EmployeeActivity"));
const Requests = lazy(() => import("../admin/Requests"));
const Bookings = lazy(() => import("../admin/Bookings"));
const Payroll = lazy(() => import("../admin/Payroll"));
const AdminProfile = lazy(() => import("../admin/Profile"));
const AddEmployee = lazy(() => import("../admin/AddEmployee"));
const ProjectDetails = lazy(() => import("../admin/ProjectDetails"));
const EmployeeDetails = lazy(() => import("../admin/EmployeeDetails"));
const ClientDetails = lazy(() => import("../admin/ClientDetails"));
const AddAdmin = lazy(() => import("../admin/AddAdmin"));
const PersonalLogs = lazy(() => import("../admin/PersonalLogs"));
const AchievementsPage = lazy(() => import("../admin/Achievements"));
const MonthlySubscriptions = lazy(() => import("../admin/MonthlySubscriptions"));
const HierarchyGraph = lazy(() => import("../admin/HierarchyGraph"));
const BusinessPartners = lazy(() => import("../admin/BusinessPartners"));
const GovernancePolicy = lazy(() => import("../admin/GovernancePolicy"));

/* ================= HR MANAGER ================= */
const HRLayout = lazy(() => import("../manager/HRLayout"));
const HRDashboard = lazy(() => import("../manager/HRDashboard"));
const HREmployeeRecords = lazy(() => import("../manager/HREmployeeRecords"));
const HREmployees = lazy(() => import("../manager/HREmployees"));
const HRAttendance = lazy(() => import("../manager/HRAttendance"));
const HRPayroll = lazy(() => import("../manager/HRPayroll"));
const HRDocuments = lazy(() => import("../manager/HRDocuments"));
const HRReports = lazy(() => import("../manager/HRReports"));
const HRProfile = lazy(() => import("../manager/HRProfile"));

/* ================= PROJECT HEAD ================= */
const ProjectHeadLayout = lazy(() => import("../manager/ProjectHeadLayout"));
const ProjectHeadDashboard = lazy(() => import("../manager/ProjectHeadDashboard"));
const ProjectHeadAssign = lazy(() => import("../manager/ProjectHeadAssign"));
const ProjectHeadTracking = lazy(() => import("../manager/ProjectHeadTracking"));
const ProjectHeadVerifyReports = lazy(() => import("../manager/ProjectHeadVerifyReports"));
const ProjectHeadAssessment = lazy(() => import("../manager/ProjectHeadAssessment"));
const ProjectHeadProfile = lazy(() => import("../manager/ProjectHeadProfile"));
const ProjectHeadDailyReport = lazy(() => import("../manager/ProjectHeadDailyReport"));
const ProjectHeadAttendance = lazy(() => import("../manager/ProjectHeadAttendance"));
const ProjectHeadPerformance = lazy(() => import("../manager/ProjectHeadPerformance"));

/* ================= EMPLOYEE ================= */
const EmployeeLayout = lazy(() => import("../employee/EmployeeLayout"));
const MyTasks = lazy(() => import("../employee/MyTasks"));
const DailyReport = lazy(() => import("../employee/DailyReport"));
const Attendance = lazy(() => import("../employee/Attendance"));
const EmployeePayroll = lazy(() => import("../employee/EmployeePayroll"));
const Profile = lazy(() => import("../employee/Profile"));
const EmployeeAchievements = lazy(() => import("../employee/EmployeeAchievements"));
const Performance = lazy(() => import("../employee/Performance"));
const Notes = lazy(() => import("../employee/Notes"));
const GeneralChat = lazy(() => import("../components/chat/GeneralChat"));
const TeamLeadPanel = lazy(() => import("../employee/TeamLeadPanel"));
const CompanyPolicy = lazy(() => import("../employee/CompanyPolicy"));

/* ================= CLIENT ================= */
const ClientLayout = lazy(() => import("../client/ClientLayout"));
const ClientProjects = lazy(() => import("../client/ClientProjects"));
const ClientRequests = lazy(() => import("../client/ClientRequests"));
const ClientProfile = lazy(() => import("../client/ClientProfile"));
const ClientProjectDetails = lazy(() => import("../client/ClientProjectDetails"));
const ClientNewProject = lazy(() => import("../client/ClientNewProject"));
const MonthlySubscription = lazy(() => import("../client/MonthlySubscription"));

const Notifications = lazy(() => import("../components/Notifications"));
const SelectMeetingTime = lazy(() => import("../auth/SelectMeetingTime"));
const GoogleCallback = lazy(() => import("../auth/GoogleCallback"));

/* ================= FINANCE PANEL ================= */
const FinanceLayout = lazy(() => import("../finance/FinanceLayout"));
const FinanceDashboard = lazy(() => import("../finance/pages/dashboard/DashboardPage"));
const FinanceCashflow = lazy(() => import("../finance/pages/cashflow/CashflowPage"));
const FinancePayroll = lazy(() => import("../finance/pages/payroll/PayrollPage"));
const FinanceAccounts = lazy(() => import("../finance/pages/accounts/AccountsPage"));
const FinanceStatement = lazy(() => import("../finance/pages/statement/StatementPage"));
const FinanceProfile = lazy(() => import("../finance/pages/profile/ProfilePage"));

/* ================= PARTNER PORTAL ================= */
const PartnerLayout = lazy(() => import("../partner/PartnerLayout"));
const PartnerProjects = lazy(() => import("../partner/PartnerProjects"));
const PartnerProjectDetails = lazy(() => import("../partner/PartnerProjectDetails"));
const PartnerRequests = lazy(() => import("../partner/PartnerRequests"));


export default function AppRoutes() {
  console.log("AppRoutes rendering");
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-white"><LoadingSpinner /></div>}>
      <Routes>
        {/* ================= LOGIN & AUTH ================= */}
        <Route path="/" element={<Login />} />
        <Route path="/select-time/:requestId" element={<SelectMeetingTime />} />
        <Route path="/google/callback" element={<GoogleCallback />} />
        <Route path="/api/google/callback" element={<GoogleCallback />} />

        {/* ================= ADMIN ================= */}
        <Route path="/admin" element={<ProtectedRoute role={["admin", "it_support"]}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="clients" element={<Clients />} />
          <Route path="add-employee" element={<AddEmployee />} />
          <Route path="projects" element={<Projects />} />
          <Route path="requests" element={<PersonalLogs defaultTab="requests" />} />
          <Route path="activity" element={<EmployeeActivity />} />
          <Route path="bookings" element={<PersonalLogs defaultTab="bookings" />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="add-admin" element={<AddAdmin />} />
          <Route path="personal-logs" element={<PersonalLogs />} />

          <Route path="employee/:id" element={<EmployeeDetails />} />
          <Route path="client/:id" element={<ClientDetails />} />
          <Route path="project/:id" element={<ProjectDetails />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="chat" element={<GeneralChat />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="monthly-subscriptions" element={<MonthlySubscriptions />} />
          <Route path="hierarchy" element={<HierarchyGraph />} />
          <Route path="business-partners" element={<BusinessPartners />} />
          <Route path="governance" element={<GovernancePolicy />} />
          <Route path="company-policy" element={<GovernancePolicy />} />
          <Route path="policy-announcements" element={<GovernancePolicy />} />
        </Route>

        {/* ================= HR MANAGER ================= */}
        <Route path="/hr" element={<ProtectedRoute role="hr"><HRLayout /></ProtectedRoute>}>
          <Route index element={<HRDashboard />} />
          <Route path="dashboard" element={<HRDashboard />} />
          <Route path="employee-records" element={<HREmployeeRecords />} />
          <Route path="add-employee" element={<HREmployees />} />
          <Route path="attendance" element={<HRAttendance />} />

          <Route path="documents" element={<HRDocuments />} />
          <Route path="reports" element={<HRReports />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="profile" element={<HRProfile />} />
          <Route path="employee/:id" element={<EmployeeDetails />} />
          <Route path="chat" element={<GeneralChat />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="monthly-subscriptions" element={<MonthlySubscriptions />} />
        </Route>

        {/* ================= PROJECT HEAD ================= */}
        <Route path="/projecthead" element={<ProtectedRoute role="projecthead"><ProjectHeadLayout /></ProtectedRoute>}>
          <Route index element={<ProjectHeadDashboard />} />
          <Route path="dashboard" element={<ProjectHeadDashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="assign-projects" element={<ProjectHeadAssign />} />
          <Route path="track-projects" element={<ProjectHeadTracking />} />
          <Route path="verify-reports" element={<ProjectHeadVerifyReports />} />
          <Route path="assessment" element={<ProjectHeadAssessment />} />
          <Route path="daily-report" element={<ProjectHeadDailyReport />} />
          <Route path="attendance" element={<ProjectHeadAttendance />} />
          <Route path="performance" element={<ProjectHeadPerformance />} />
          <Route path="profile" element={<ProjectHeadProfile />} />
          <Route path="employee/:id" element={<EmployeeDetails />} />
          <Route path="chat" element={<GeneralChat />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ================= PARTNER PORTAL ================= */}
        <Route path="/partner" element={<ProtectedRoute role="partner"><PartnerLayout /></ProtectedRoute>}>
          <Route index element={<PartnerProjects />} />
          <Route path="projects" element={<PartnerProjects />} />
          <Route path="project/:id" element={<PartnerProjectDetails />} />
          <Route path="requests" element={<PartnerRequests />} />
          <Route path="chat" element={<GeneralChat />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ================= CLIENT ================= */}
        <Route path="/client" element={<ProtectedRoute role="client"><ClientLayout /></ProtectedRoute>}>
          <Route index element={<ClientProjects />} />
          <Route path="projects" element={<ClientProjects />} />
          <Route path="new-project" element={<ClientNewProject />} />
          <Route path="requests" element={<ClientRequests />} />
          <Route path="profile" element={<ClientProfile />} />
          <Route path="project/:id" element={<ClientProjectDetails />} />
          <Route path="chat" element={<GeneralChat />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ================= FINANCE PANEL ================= */}
        <Route path="/finance" element={<ProtectedRoute role={["finance", "it_support"]}><FinanceLayout /></ProtectedRoute>}>
          <Route index element={<FinanceDashboard />} />
          <Route path="dashboard" element={<FinanceDashboard />} />
          <Route path="cashflow" element={<FinanceCashflow />} />
          <Route path="payroll" element={<FinancePayroll />} />
          <Route path="accounts" element={<FinanceAccounts />} />
          <Route path="statement" element={<FinanceStatement />} />
          <Route path="profile" element={<FinanceProfile />} />

          {/* Legacy route aliases */}
          <Route path="income" element={<FinanceCashflow />} />
          <Route path="expenses" element={<FinanceCashflow />} />
          <Route path="receivable" element={<FinanceAccounts />} />
          <Route path="payable" element={<FinanceAccounts />} />
        </Route>

        {/* ================= EMPLOYEE ================= */}
        <Route path="/employee" element={<ProtectedRoute role={["employee", "teamlead", "intern"]}><EmployeeLayout /></ProtectedRoute>}>
          <Route index element={<MyTasks />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="daily-report" element={<DailyReport />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="performance" element={<Performance />} />
          <Route path="achievements" element={<EmployeeAchievements />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notes" element={<Notes />} />
          <Route path="chat" element={<GeneralChat />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="team" element={<TeamLeadPanel />} />
          <Route path="company-policy" element={<CompanyPolicy />} />

        </Route>

        {/* ================= CATCH ALL ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
