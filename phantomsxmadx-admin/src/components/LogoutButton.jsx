import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const logout = () => {
    const time = new Date().toLocaleTimeString();
    console.log("CHECK OUT TIME:", time);

    // ✅ EXISTING
    sessionStorage.setItem("checkOut", time);
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("token");

    window.location.href = "/";
  };

  return (
    <button
      onClick={logout}
      className="text-sm text-red-400 hover:text-red-300"
    >
      Logout
    </button>
  );
}
