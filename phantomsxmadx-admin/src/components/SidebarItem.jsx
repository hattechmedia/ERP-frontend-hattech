import { NavLink } from "react-router-dom";

export default function SidebarItem({ to, icon, label, onClick, small }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition
         ${small ? 'py-1.5 text-sm' : 'py-2'}
         ${
           isActive
             ? "bg-primary/20 text-primary"
             : "text-theme-secondary hover:bg-primary/10"
         }`
      }
    >
      <span className={small ? 'text-lg' : 'text-2xl'}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}