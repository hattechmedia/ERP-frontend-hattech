import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiGrid, FiCheckCircle } from "react-icons/fi";
import api from "../services/api";

export default function ClientDashboard() {
    const [projects, setProjects] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLight, setIsLight] = useState(false);
    const [loading, setLoading] = useState(true);
 
    const fetchMyProjects = async () => {
        try {
            setLoading(true);
            const res = await api.get('/projects');
            if (res.data.success) {
                // Backend returns: _id, title, description, progress, status, deadline
                const mapped = res.data.data.map(p => ({
                    id: p._id,
                    project: p.title,
                    start: new Date(p.createdAt).toLocaleDateString(),
                    progress: p.progress || 0,
                    milestones: p.milestones || [
                        { name: "Project Initialized", status: "Completed", date: p.createdAt },
                        { name: "In Progress", status: "In Progress", date: p.updatedAt }
                    ]
                }));
                setProjects(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch client projects", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profiles');
            if (res.data.success) {
                setCurrentUser(res.data.user);
            }
        } catch (error) {
            console.error("Failed to fetch client profile", error);
        }
    };

    useEffect(() => {
        const checkTheme = () => setIsLight(document.body.classList.contains('light'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        fetchProfile();
        fetchMyProjects();

        return () => observer.disconnect();
    }, []);

    const cardClass = isLight ? "bg-white border-gray-200 hover:shadow-xl shadow-sm" : "bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[#004AAD] shadow-lg";
    const textMain = isLight ? "text-gray-900" : "text-white";
    const textSec = isLight ? "text-gray-600" : "text-gray-400";

    return (
        <div className="space-y-8 pt-14 md:pt-0 animate-in fade-in duration-500">
            <div>
                <h1 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${isLight ? 'from-[#004AAD] to-blue-600' : 'from-[#004AAD] to-blue-400'}`}>
                    Welcome Back, {currentUser?.name || "Client"}
                </h1>
                <p className={textSec}>Track your project progress and milestones here.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && projects.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-theme-secondary">Loading your projects...</div>
                ) : (
                    projects.length === 0 ? (
                        <div className={`col-span-full text-center py-20 border border-dashed rounded-xl ${isLight ? 'border-gray-300 text-gray-500' : 'border-gray-700 text-gray-400'}`}>
                            No active projects found.
                        </div>
                    ) : (
                        projects.map((p, i) => (
                            <Link to={`/client/projects`} key={i} className={`p-6 rounded-xl border transition group relative overflow-hidden flex flex-col ${cardClass}`}>
                                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition">
                                    <FiGrid size={80} />
                                </div>

                                <div className="mb-4">
                                    <h3 className={`text-xl font-bold mb-1 ${textMain}`}>{p.project}</h3>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className={textSec}>Started: {p.start}</span>
                                        <span className="text-green-500 font-bold">{p.progress}% Complete</span>
                                    </div>
                                </div>

                                {/* PROGRESS BAR */}
                                <div className={`w-full h-2 rounded-full overflow-hidden mb-6 ${isLight ? 'bg-gray-100' : 'bg-gray-800'}`}>
                                    <div className="bg-[#004AAD] h-full transition-all duration-1000" style={{ width: `${p.progress}%` }}></div>
                                </div>

                                {/* MILESTONES PREVIEW */}
                                <div className="flex-1 space-y-3">
                                    <p className={`text-xs font-bold uppercase tracking-wider ${textSec}`}>Recent Milestones</p>
                                    {p.milestones.slice(0, 3).map((m, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm">
                                            {m.status === "Completed" ? (
                                                <FiCheckCircle className="text-green-500 shrink-0" />
                                            ) : m.status === "In Progress" ? (
                                                <div className="w-4 h-4 rounded-full border-2 border-yellow-500 flex items-center justify-center shrink-0">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                                                </div>
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-gray-400 shrink-0"></div>
                                            )}
                                            <span className={`${m.status === 'Completed' ? (isLight ? 'text-gray-500' : 'text-gray-400 line-through') : textMain}`}>
                                                {m.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Link>
                        ))
                    )
                )}
            </div>
        </div>
    );
}
