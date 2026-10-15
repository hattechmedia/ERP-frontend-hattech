import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ role, allowedEmails, children }) {
  const { user, loading } = useAuth();

  console.log("ProtectedRoute check:", { role, user, loading, allowedEmails });

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ❌ Not logged in
  if (!user || !user.role) {
    console.log("Not logged in - Redirecting to login");
    return <Navigate to="/" replace />;
  }

  // ❌ Email mismatch (if restricted)
  if (allowedEmails && !allowedEmails.includes(user.email)) {
    console.log("Email restricted", user.email, allowedEmails);
    return <Navigate to="/" replace />;
  }

  // ❌ Role mismatch
  const allowedRoles = (Array.isArray(role) ? role : [role]).map(r => r.toLowerCase());
  const userRole = (user.role || "").toLowerCase();

  if (!allowedRoles.includes(userRole)) {
    console.log("Role mismatch", userRole, allowedRoles);
    return <Navigate to="/" replace />;
  }

  // ✅ Authorized
  return children;
}
