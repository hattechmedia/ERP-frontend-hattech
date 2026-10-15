import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { FiGrid, FiCheckCircle, FiClock, FiActivity, FiLayers, FiPlus, FiX, FiMessageCircle, FiArrowLeft, FiSearch, FiZap, FiFileText } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function ClientProjects() {
    const [projects, setProjects] = useState([]);
    const [isLight, setIsLight] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [projectHistory, setProjectHistory] = useState({}); // { projectId: selectedReport }
    const [dateValues, setDateValues] = useState({}); // { projectId: dateStr }

    const fetchMyProjectsData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/projects');
            if (res.data.success) {
                const mapped = res.data.data.map(p => ({
                    id: p._id,
                    project: p.title,
                    start: new Date(p.createdAt).toLocaleDateString(),
                    progress: p.progress || 0,
                    status: (p.status || (p.progress === 100 ? "Completed" : "Active")).charAt(0).toUpperCase() + (p.status || "").slice(1),
                    milestones: p.milestones || [
                        { name: "Requirement Analysis", status: "Completed", date: new Date(p.createdAt).toLocaleDateString() },
                        { name: "UI/UX Design", status: p.progress > 20 ? "Completed" : "In Progress", date: "TBD" },
                        { name: "Development", status: p.progress > 60 ? "Completed" : (p.progress > 20 ? "In Progress" : "Pending"), date: "TBD" },
                        { name: "Final Testing", status: p.progress === 100 ? "Completed" : "Pending", date: "TBD" }
                    ],
                    isSubscription: p.isSubscription,
                    category: p.subscriptionCategory,
                    summary: p.subscriptionSummary,
                    summaryImage: p.subscriptionSummaryImage,
                    subscriptionSummaryImages: p.subscriptionSummaryImages || [],
                    expiryDate: p.subscriptionExpiryDate,
                    updatedAt: p.updatedAt
                }));
                setProjects(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch projects in ClientProjects", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkTheme = () => setIsLight(document.body.classList.contains('light'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        fetchMyProjectsData();
        return () => observer.disconnect();
    }, []);

    const textMain = isLight ? "text-gray-900" : "text-white";
    const textSec = isLight ? "text-gray-600" : "text-gray-400";
    const cardBg = isLight ? "bg-white" : "bg-[#1e1e2d]";
    const cardBorder = isLight ? "border-gray-200" : "border-[#2a2a35]";

    const handleDateSearch = async (projectId, dateStr) => {
        if (!dateStr) {
            resetDateMatch(projectId);
            return;
        }

        setDateValues(prev => ({ ...prev, [projectId]: dateStr }));

        try {
            const res = await api.get(`/subscriptions/reports/${projectId}`);
            if (res.data.success) {
                const match = res.data.data.find(r => {
                    const rDate = new Date(r.reportDate || r.createdAt).toLocaleDateString('en-CA');
                    return rDate === dateStr;
                });
                if (match) {
                    setProjectHistory(prev => ({ ...prev, [projectId]: match }));
                    toast.success("Historical report found");
                } else {
                    setProjectHistory(prev => ({ ...prev, [projectId]: null }));
                    toast.error("Report Not Submitted");
                }
            }
        } catch (error) {
            toast.error("History could not be loaded");
        }
    };

    const resetDateMatch = (projectId) => {
        setProjectHistory(prev => {
            const updated = { ...prev };
            delete updated[projectId];
            return updated;
        });
        setDateValues(prev => ({ ...prev, [projectId]: "" }));
    };

    return (
        <div className="space-y-8 pt-14 md:pt-0 animate-in fade-in duration-500">
            <div className={`relative overflow-hidden rounded-3xl p-8 mb-8 ${isLight ? 'bg-[#004AAD] text-white' : 'bg-[#004AAD]/20 border border-[#004AAD]/20'}`}>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <FiLayers size={140} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">My Projects</h1>
                    <p className="text-white/80 max-w-xl text-lg opacity-90">
                        Track the real-time progress of your ongoing projects. View milestones, status updates, and delivery timelines.
                    </p>
                </div>
            </div>

            {loading && projects.length === 0 ? (
                <div className="p-20 text-center text-theme-secondary text-xl">Loading your projects...</div>
            ) : (
                projects.length === 0 ? (
                    <div className={`text-center py-20 border border-dashed rounded-xl ${isLight ? 'border-gray-300 text-gray-500' : 'border-gray-700 text-gray-400'}`}>
                        No active projects found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {projects.map((p, i) => (
                            <div key={i} className={`rounded-3xl border overflow-hidden transition-all hover:shadow-2xl group ${cardBg} ${cardBorder} ${isLight ? 'shadow-lg' : 'shadow-xl'}`}>
                                <div className={`p-6 border-b ${cardBorder} flex justify-between items-start bg-gradient-to-r ${isLight ? 'from-gray-50 to-white' : 'from-[#232333] to-[#1e1e2d]'}`}>
                                    <div className="flex flex-col">
                                        <h3 className={`text-2xl font-bold mb-1 ${textMain}`}>{p.project}</h3>
                                        <p className="text-[11px] uppercase font-black tracking-[0.15em] text-[#004AAD] mt-3 bg-[#004AAD]/5 px-3 py-1.5 rounded-lg inline-block w-fit">
                                            {p.category || 'Development Project'}
                                        </p>
                                        <div className="flex items-center gap-3 text-sm mt-2">
                                            <span className={`px-2.5 py-0.5 rounded-full font-bold border ${p.status === "Completed" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                                                {p.status}
                                            </span>
                                            <span className={textSec}>Started: {p.start}</span>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-400'}`}>
                                        <FiActivity size={24} />
                                    </div>
                                </div>

                                <div className="p-6 space-y-8">
                                    {p.isSubscription ? (
                                        <div className="space-y-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                                        <FiZap size={16} />
                                                    </div>
                                                    <span className={`text-xs font-black uppercase tracking-[0.15em] ${textMain}`}>
                                                        {projectHistory[p.id] ? "Historical Performance" : "Latest Performance Summary"}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-xl border border-white/5">
                                                        <FiSearch className="text-gray-500" size={12} />
                                                        <input 
                                                            type="date" 
                                                            value={dateValues[p.id] || ""}
                                                            className="bg-transparent outline-none text-[9px] font-black uppercase tracking-tighter text-blue-500 cursor-pointer"
                                                            onChange={(e) => handleDateSearch(p.id, e.target.value)}
                                                        />
                                                    </div>
                                                    {(projectHistory[p.id] !== undefined || dateValues[p.id]) && (
                                                        <button 
                                                            onClick={() => resetDateMatch(p.id)}
                                                            className="text-[9px] font-black uppercase text-gray-500 hover:text-blue-500 transition-colors"
                                                        >
                                                            Reset
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`p-6 rounded-[2rem] border-2 transition-all duration-500 ${projectHistory[p.id] ? 'border-blue-500/40 bg-blue-500/5' : isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/5 border-white/10'}`}>
                                                {projectHistory[p.id] === null ? (
                                                    <div className="py-12 text-center flex flex-col items-center gap-4 animate-in fade-in duration-500">
                                                        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20 animate-pulse">
                                                            <FiX size={32} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h3 className="text-xl font-black text-red-500 uppercase tracking-tighter">REPORT NOT SUBMITTED</h3>
                                                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">No data available for this date</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => resetDateMatch(p.id)}
                                                            className="mt-2 px-4 py-1.5 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                                        >
                                                            Clear Date
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        <p className={`${textMain} text-sm leading-relaxed italic font-medium opacity-90`}>
                                                            "{projectHistory[p.id] ? projectHistory[p.id].summary : (p.summary || "Team is preparing your latest performance summary...")}"
                                                        </p>
                                                        
                                                        {((projectHistory[p.id]?.images?.length > 0) || (p.subscriptionSummaryImages?.length > 0 || p.summaryImage)) && (
                                                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                                                {(projectHistory[p.id] ? projectHistory[p.id].images : (p.subscriptionSummaryImages?.length > 0 ? p.subscriptionSummaryImages : [p.summaryImage])).map((img, idx) => (
                                                                    <div 
                                                                        key={idx} 
                                                                        className="w-full aspect-square rounded-xl overflow-hidden border border-white/5 shadow-md transition-all hover:scale-110 active:scale-95 duration-300 cursor-zoom-in relative group"
                                                                        onClick={() => setLightboxImage(img)}
                                                                    >
                                                                        <img src={img} className="w-full h-full object-cover" alt={`Performance Preview ${idx + 1}`} />
                                                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                            <FiSearch className="text-white" size={16} />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center border-t border-white/5 mt-6 pt-4">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Renewal Date</span>
                                                    <span className="text-xs font-black text-blue-500">{new Date(p.expiryDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex justify-between items-end mb-3">
                                                <span className={`text-sm font-bold uppercase tracking-wider ${textSec}`}>Overall Completion</span>
                                                <span className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                                                    {p.progress}%
                                                </span>
                                            </div>
                                            <div className={`w-full h-6 md:h-8 rounded-full overflow-hidden ${isLight ? 'bg-gray-100' : 'bg-gray-800'}`}>
                                                <div
                                                    className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 h-full rounded-full transition-all duration-1000 ease-out relative"
                                                    style={{ width: `${p.progress}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!p.isSubscription && (
                                        <div>
                                            <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${textSec}`}>
                                                <FiClock /> Project Milestones
                                            </h4>
                                            <div className="relative pl-4 space-y-0">
                                                <div className={`absolute left-[19px] top-2 bottom-4 w-0.5 ${isLight ? 'bg-gray-200' : 'bg-gray-700'}`}></div>
                                                {p.milestones.map((m, idx) => (
                                                    <div key={idx} className="relative flex items-start gap-4 pb-6 last:pb-0 group/item">
                                                        <div className={`relative z-10 w-3 h-3 mt-1.5 rounded-full border-2 shrink-0 transition-all duration-300 ${m.status === "Completed" ? "bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
                                                            m.status === "In Progress" ? "bg-yellow-500 border-yellow-500 animate-pulse" :
                                                                "bg-transparent border-gray-400"
                                                            }`}></div>
                                                        <div className={`flex-1 p-4 rounded-xl border transition-all duration-300 ${m.status === "In Progress" ? (isLight ? "bg-purple-50 border-purple-200 shadow-md transform scale-[1.02]" : "bg-purple-500/10 border-purple-500/30 shadow-lg transform scale-[1.02]") :
                                                            (isLight ? "bg-gray-50 border-gray-100 hover:border-gray-200" : "bg-[#1a1a24] border-[#2a2a35] hover:border-gray-700")
                                                            }`}>
                                                            <div className={`flex justify-between items-start mb-1`}>
                                                                <span className={`font-bold text-base ${m.status === "Completed" ? (isLight ? "text-gray-900" : "text-white") :
                                                                    m.status === "In Progress" ? "text-[#004AAD]" :
                                                                        textSec
                                                                    }`}>{m.name}</span>
                                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${m.status === "Completed" ? "bg-green-500/10 text-green-500" :
                                                                    m.status === "In Progress" ? "bg-yellow-500/10 text-yellow-500" :
                                                                        "bg-gray-500/10 text-gray-500"
                                                                    }`}>
                                                                    {m.status}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className={`text-xs ${textSec}`}>Expected: {m.date}</span>
                                                                {m.status === "Completed" && <FiCheckCircle className="text-green-500" size={14} />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={`p-4 border-t ${cardBorder} flex justify-end gap-3 ${isLight ? 'bg-gray-50' : 'bg-[#232333]'}`}>
                                    <Link to="/client/requests" className="px-4 py-2 rounded-lg bg-gray-500/10 text-gray-500 text-sm font-bold hover:bg-gray-500/20 transition-all border border-gray-500/20">
                                        Request History
                                    </Link>
                                    <Link 
                                        to={`/client/project/${p.id}`} 
                                        className="px-6 py-2 rounded-lg bg-[#004AAD] text-white text-sm font-black hover:bg-[#003882] shadow-lg shadow-[#004AAD]/20 transition-all border border-blue-500/20"
                                    >
                                        View Full Dashboard
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            <AnimatePresence>
                {lightboxImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-8 backdrop-blur-xl"
                        onClick={() => setLightboxImage(null)}
                    >
                        <button className="absolute top-8 right-8 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-95 shadow-2xl">
                            <FiX size={32} />
                        </button>
                        <motion.img 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={lightboxImage} 
                            className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl border border-white/10" 
                            alt="Full Performance Preview" 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
