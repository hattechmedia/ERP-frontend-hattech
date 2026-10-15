import { useState, useEffect } from "react";
import api from "../services/api";
import {
    FiRefreshCcw, FiUsers, FiBarChart2, FiEdit3, FiPlus,
    FiCheckCircle, FiAlertCircle, FiArrowRight, FiCalendar,
    FiSearch, FiMonitor, FiTarget, FiTrendingUp, FiZap, FiFileText, FiTrash2
} from "react-icons/fi";
import ConfirmModal from "../components/ConfirmModal";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AddSubscriptionModal from "../components/AddSubscriptionModal";
import UpdateSubscriptionStatusModal from "../components/UpdateSubscriptionStatusModal";
import ViewSubscriptionModal from "../components/ViewSubscriptionModal";
import SubscriptionHistoryModal from "../components/SubscriptionHistoryModal";

export default function MonthlySubscriptions() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal states
    const [selectedProject, setSelectedProject] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Form states
    const [isLight, setIsLight] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

    const handleDeleteProject = async (id) => {
        try {
            const res = await api.delete(`/projects/${id}`);
            if (res.data.success) {
                toast.success("Project deleted successfully");
                fetchProjects();
            }
        } catch (error) {
            toast.error("Failed to delete project");
        }
    };

    useEffect(() => {
        const checkTheme = () => setIsLight(document.body.classList.contains('light'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await api.get("/subscriptions/projects");
            if (res.data.success) {
                setProjects(res.data.data);
            }
        } catch (err) {
            console.error("Action failed", err);
            toast.error("Failed to perform action");
        } finally {
            setLoading(false);
        }
    };

    const calculateDaysLeft = (expiryDate) => {
        if (!expiryDate) return "N/A";
        const diff = new Date(expiryDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.client?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const cardClass = isLight ? "bg-white border-gray-100 shadow-sm" : "bg-[#151235] border-[#312e81]";
    const textMain = isLight ? "text-gray-900" : "text-white";
    const textSec = isLight ? "text-gray-500" : "text-[#8b949e]";

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#004AAD] flex items-center gap-2">
                        <FiRefreshCcw /> Monthly Subscriptions
                    </h1>
                    <p className="text-gray-500">Performance tracking & recurring project management</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <div className="flex gap-2 p-1">
                        {/* Unified View: Removed Tabs */}
                    </div>

                    <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="px-6 py-2 bg-gradient-to-br from-[#004AAE] to-[#1E6BFF] !text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg transition transform hover:-translate-y-0.5"
                    >
                        <FiZap className="animate-pulse" /> Add New Subscription
                    </button>
                </div>
            </div>

            {/* SEARCH AND ACTIONS */}
            <div className={`flex p-4 rounded-2xl shadow-sm items-center gap-4 border transition-all ${isLight ? 'bg-white border-gray-100' : 'bg-[#1a1c23] border-[#2d3748]'}`}>
                <FiSearch className={isLight ? "text-gray-400" : "text-gray-500"} />
                <input
                    type="text"
                    placeholder="Search project name or client details..."
                    className={`flex-1 bg-transparent outline-none text-sm ${isLight ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-gray-600'}`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_100px] gap-4 px-6 py-2">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">Project / Client</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Category</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Days Left</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right pr-4">Actions</div>
                </div>
                {loading ? (
                    <div className="p-10 text-center animate-pulse">Loading data...</div>
                ) : filteredProjects.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">No subscription projects found</div>
                ) : filteredProjects.map(project => (
                    <div
                        key={project._id}
                        onClick={() => { setSelectedProject(project); setShowDetailsModal(true); }}
                        className={`${cardClass} p-4 md:p-6 rounded-2xl border flex flex-col md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_100px] gap-4 items-center transition-all duration-300 hover:shadow-xl hover:border-[#004AAD]/40 hover:scale-[1.01] active:scale-[0.99] cursor-pointer group`}
                    >
                        <div className="flex items-center gap-4 w-full group">
                            <div className="p-3 rounded-xl bg-[#004AAD]/10 text-[#004AAD] group-hover:bg-[#004AAD] group-hover:text-white transition-all">
                                <FiZap size={18} />
                            </div>
                            <div className="min-w-0">
                                <h3 className={`font-black text-sm md:text-base ${textMain} truncate group-hover:text-[#004AAD] transition-colors`}>{project.title}</h3>
                                <div className="flex flex-col mt-0.5">
                                    <span className="text-[10px] font-black text-[#004AAD] uppercase tracking-widest">{project.client?.contactPerson || project.client?.name || "Private Client"}</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{project.client?.companyName || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center w-full">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${isLight ? 'bg-gray-100 text-gray-500 border-gray-100' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                                {project.subscriptionCategory || 'N/A'}
                            </span>
                        </div>

                        <div className="flex flex-col items-center w-full text-center">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <span className={`text-[10px] font-black tracking-widest uppercase ${project.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                                    {project.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            {new Date(project.updatedAt).toDateString() === new Date().toDateString() && project.subscriptionSummary && (
                                <span className="mt-1 text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">
                                    Report Posted Today
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col items-center w-full">
                            <span className={`font-black text-sm ${calculateDaysLeft(project.subscriptionExpiryDate) <= 10 ? 'text-red-500 font-black' : 'text-[#004AAD]'}`}>
                                {calculateDaysLeft(project.subscriptionExpiryDate)} <span className="text-[10px] uppercase opacity-70">Days</span>
                            </span>
                        </div>

                        <div className="flex justify-end items-center gap-2 w-full pr-2" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => { setSelectedProject(project); setShowUpdateModal(true); }}
                                className="p-3 rounded-2xl bg-[#004AAD] text-white shadow-xl shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all"
                                title="Post Daily Report"
                            >
                                <FiZap size={18} />
                            </button>

                            <button
                                onClick={() => { setSelectedProject(project); setShowHistoryModal(true); }}
                                className="p-3 rounded-2xl bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 transition-all shadow-sm"
                                title="View Report History"
                            >
                                <FiFileText size={18} />
                            </button>

                            <button
                                onClick={() => setConfirmConfig({ isOpen: true, id: project._id })}
                                className="p-3 rounded-2xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all"
                                title="Delete Project"
                            >
                                <FiTrash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* CONFIRMATION MODAL */}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ isOpen: false, id: null })}
                onConfirm={() => handleDeleteProject(confirmConfig.id)}
                title="Delete Project?"
                message="Are you sure you want to delete this subscription project? All historical reports will be permanently lost."
                confirmText="Delete Now"
            />

            {/* UNIFIED CREATION MODAL */}
            <AddSubscriptionModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                isLight={isLight}
                onSave={() => fetchProjects()}
            />

            {/* STATUS UPDATE MODAL */}
            <UpdateSubscriptionStatusModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                project={selectedProject}
                isLight={isLight}
                onSave={() => fetchProjects()}
            />

            {/* SUBSCRIPTION DETAILS MODAL */}
            <ViewSubscriptionModal
                isOpen={showDetailsModal}
                onClose={() => { setShowDetailsModal(false); fetchProjects(); }}
                project={selectedProject}
                isLight={isLight}
            />

            {/* SUBSCRIPTION HISTORY MODAL */}
            <SubscriptionHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                project={selectedProject}
                isLight={isLight}
            />
        </div>
    );
}
