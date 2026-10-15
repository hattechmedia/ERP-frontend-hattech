import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import PartnerSidebar from "./PartnerSidebar";
import Topbar from "../components/Topbar";
import { IoIosChatboxes } from "react-icons/io";
import api from "../services/api";

export default function PartnerLayout() {
  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-primary overflow-hidden transition-colors duration-300 relative">
      <PartnerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-[var(--bg-dark)] scroll-smooth relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
