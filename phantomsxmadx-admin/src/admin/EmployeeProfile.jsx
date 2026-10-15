import { useNavigate } from "react-router-dom";

export default function EmployeeProfile() {
  const navigate = useNavigate();

  const profile = JSON.parse(
    localStorage.getItem("employeeProfile") || "{}"
  );

  return (
    <div className="space-y-6 pt-14 md:pt-0 max-w-xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-purple-400"
      >
        ← Back
      </button>

      <div className="p-6 rounded-xl bg-[var(--bg-card)] border space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={
              profile.image ||
              "https://via.placeholder.com/80"
            }
            className="w-20 h-20 rounded-full object-cover border"
          />
          <div>
            <p className="text-lg font-semibold">
              {profile.name || "Employee Name"}
            </p>
            <p className="text-sm text-gray-400">
              {profile.bio || "No bio provided"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
