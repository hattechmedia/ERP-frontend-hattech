import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Google OAuth is not available in demo mode.
// This page just shows a message and redirects back.
export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/admin");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0b1f] text-white p-8">
      <div className="bg-[#1a1433] border border-[#2a2255] rounded-2xl p-10 max-w-md text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-2xl font-bold text-[#004AAD]">Demo Mode</h2>
        <p className="text-gray-400">
          Google Calendar integration is not available in demo mode.
          Redirecting you back...
        </p>
      </div>
    </div>
  );
}
