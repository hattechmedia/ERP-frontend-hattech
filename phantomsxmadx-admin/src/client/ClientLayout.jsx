import { Outlet } from "react-router-dom";
import ClientSidebar from "./ClientSidebar";
import Topbar from "../components/Topbar";

export default function ClientLayout() {
    return (
        <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-primary overflow-hidden transition-colors duration-300 relative">
            <ClientSidebar />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Topbar />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-[var(--bg-dark)] scroll-smooth relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
