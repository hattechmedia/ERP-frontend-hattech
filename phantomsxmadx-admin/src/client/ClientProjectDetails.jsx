import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
    FiArrowLeft, FiCalendar, FiCheckCircle, FiClock, 
    FiMessageSquare, FiTrendingUp, FiActivity, FiZap,
    FiGlobe, FiFacebook, FiSearch, FiX
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function ClientProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [subscriptionData, setSubscriptionData] = useState({ stats: [], summaries: [] });
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLight, setIsLight] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [pastReports, setPastReports] = useState([]);
    const [searchDate, setSearchDate] = useState("");
    const [displayReport, setDisplayReport] = useState(null);

    useEffect(() => {
        const checkTheme = () => setIsLight(document.body.classList.contains('light'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        const fetchData = async () => {
            try {
                setLoading(true);
                const projectRes = await api.get(`/projects/${id}`);
                if (projectRes.data.success) {
                    const proj = projectRes.data.data;
                    setProject(proj);

                    if (proj.isSubscription) {
                        const subRes = await api.get(`/subscriptions/project/${id}`);
                        if (subRes.data.success) {
                            setSubscriptionData(subRes.data.data);
                        }
                        const historyRes = await api.get(`/subscriptions/reports/${id}`);
                        if (historyRes.data.success) {
                            setPastReports(historyRes.data.data);
                        }
                    }
                }

                const tasksRes = await api.get(`/tasks?projectId=${id}`);
                if (tasksRes.data.success) {
                    const allTasks = tasksRes.data.tasks;
                    const ms = [];
                    allTasks.forEach(t => {
                        if (t.milestones && t.milestones.length > 0) {
                            t.milestones.forEach(m => ms.push({ ...m, taskTitle: t.title, completed: m.status === 'completed' }));
                        } else {
                            ms.push({ title: t.title, description: t.description, completed: t.status === 'completed', deadline: t.deadline });
                        }
                    });
                    setMilestones(ms);
                }
            } catch (err) {
                console.error("Failed to fetch project details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => observer.disconnect();
    }, [id]);

    const calculateDaysLeft = (expiryDate) => {
        if (!expiryDate) return 0;
        const diff = new Date(expiryDate) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-[#004AAD] font-bold">Initializing Performance Portal...</div>;
    if (!project) return <div className="p-10 text-center text-red-500 font-bold border rounded-xl m-10">404: Access denied or project not found</div>;

    const daysLeft = project.isSubscription ? calculateDaysLeft(project.subscriptionExpiryDate) : null;
    const cardClass = isLight ? "bg-white border-gray-200 shadow-sm" : "bg-[#161b22] border-[#30363d]";
    const textMain = isLight ? "text-gray-900" : "text-white";
    const textSec = isLight ? "text-gray-500" : "text-gray-400";

    const handleDateChange = (dateStr) => {
        setSearchDate(dateStr);
        if (!dateStr) {
            setDisplayReport(null);
            return;
        }
        const match = pastReports.find(r => {
            const rDate = new Date(r.reportDate || r.createdAt).toLocaleDateString('en-CA');
            return rDate === dateStr;
        });
        if (match) {
            setDisplayReport(match);
            toast.success(`Report found for ${dateStr}`);
        } else {
            setDisplayReport(null);
            toast.error("Report Not Submitted");
        }
    };

    return (
        <div className="max-w-6xl mx-auto pt-14 md:pt-4 pb-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
            
            <AnimatePresence>
                {project.isSubscription && daysLeft !== null && daysLeft <= 10 && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 p-5 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 text-red-500 shadow-xl shadow-red-500/5 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 animate-pulse">
                                <FiZap size={18} />
                            </div>
                            <span className="font-black uppercase tracking-tighter text-sm">Action Required: Your subscription expires in {daysLeft} days. Please arrange for renewal.</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8 relative">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className={`p-4 rounded-[1.5rem] border transition shadow-lg ${cardClass} hover:bg-[#004AAD]/10 active:scale-95 flex items-center justify-center`}>
                        <FiArrowLeft size={24} className={textSec} />
                    </button>
                    <div>
                        <div className="flex flex-col gap-2">
                            <h1 className={`text-4xl md:text-5xl font-black tracking-tighter ${textMain} leading-[0.9]`}>{project.title}</h1>
                            <p className="text-[13px] uppercase font-black tracking-[0.25em] text-[#004AAD] mt-6 bg-[#004AAD]/5 px-4 py-2 rounded-xl inline-block w-fit">
                                {project.subscriptionCategory || 'Development Project'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`${cardClass} px-6 py-3 rounded-[1.8rem] border flex items-center gap-4 shadow-xl shadow-[#004AAD]/5`}>
                        <div className="text-right">
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest opacity-60">Status</p>
                            <p className={`text-sm font-black uppercase tracking-tighter ${project.status === 'active' ? 'text-green-500' : 'text-blue-500'}`}>{project.status}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${project.status === 'active' ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-400'}`}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    {project.isSubscription && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className={`text-2xl font-black flex items-center gap-3 ${textMain} tracking-tighter uppercase`}>
                                    <FiZap className="text-[#004AAD]" /> {displayReport ? 'Historical Performance' : 'Latest Performance'}
                                </h2>
                                
                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-lg">
                                    <div className="flex items-center gap-2 px-3">
                                        <FiSearch className="text-gray-400" size={14} />
                                        <input 
                                            type="date" 
                                            value={searchDate}
                                            className="bg-transparent outline-none text-[10px] font-black uppercase tracking-widest text-[#004AAD] cursor-pointer"
                                            onChange={(e) => handleDateChange(e.target.value)}
                                        />
                                    </div>
                                    {searchDate && (
                                        <button 
                                            onClick={() => handleDateChange("")}
                                            className="px-3 py-1 bg-[#004AAD] text-white rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all active:scale-95"
                                        >
                                            Reset View
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={`${cardClass} overflow-hidden rounded-[3rem] border-2 transition-all duration-500 ${displayReport ? 'border-blue-500/40 bg-blue-500/5' : 'border-[#004AAD]/10'}`}>
                                {searchDate && !displayReport ? (
                                    <div className="py-24 text-center flex flex-col items-center gap-6 animate-in fade-in duration-300">
                                        <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20 animate-pulse">
                                            <FiX size={48} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-black text-red-500 uppercase tracking-tighter">REPORT NOT SUBMITTED</h3>
                                            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No analytics found for: {new Date(searchDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ) : displayReport ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-in fade-in zoom-in-95 duration-500">
                                        {displayReport.images?.length > 0 && (
                                            <div className="p-4 md:p-8 bg-black/5 border-b border-white/5">
                                                <div className={`grid gap-4 ${displayReport.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                                                    {displayReport.images.map((img, idx) => (
                                                        <div key={idx} className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 group cursor-zoom-in" onClick={() => setLightboxImage(img)}>
                                                            <img src={img} className="w-full h-full object-cover" alt="History" />
                                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/20">
                                                                <span className="text-white text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">View Detail</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-8 md:p-12 relative">
                                            <div className="absolute top-8 right-8">
                                                <div className="px-5 py-2 bg-blue-500 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Archive: {new Date(displayReport.reportDate || displayReport.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <p className={`${textMain} text-xl md:text-2xl leading-relaxed font-black italic opacity-90 whitespace-pre-wrap`}>
                                                "{displayReport.summary}"
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="animate-in fade-in duration-500">
                                        {(project.subscriptionSummaryImages?.length > 0 || project.subscriptionSummaryImage) && (
                                            <div className="p-4 md:p-8 bg-black/5 border-b border-white/5">
                                                <div className={`grid gap-4 ${((project.subscriptionSummaryImages?.length || 0) + (project.subscriptionSummaryImage ? 1 : 0)) === 1 ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                                                    {project.subscriptionSummaryImage && (
                                                        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 group cursor-zoom-in" onClick={() => setLightboxImage(project.subscriptionSummaryImage)}>
                                                            <img src={project.subscriptionSummaryImage} className="w-full h-full object-cover" alt="Latest" />
                                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/20">
                                                                <span className="text-white text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">Current View</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {project.subscriptionSummaryImages?.map((img, idx) => (
                                                        <div key={idx} className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 group cursor-zoom-in" onClick={() => setLightboxImage(img)}>
                                                            <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/20">
                                                                <span className="text-white text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">Current View</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-8 md:p-12 relative overflow-hidden">
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="px-5 py-2 bg-[#004AAD]/10 text-[#004AAD] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#004AAD]/20">
                                                    Current Performance
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">
                                                    Last Updated: {new Date(project.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className={`${textMain} text-xl md:text-2xl leading-relaxed font-black italic opacity-90 whitespace-pre-wrap relative z-10`}>
                                                "{project.subscriptionSummary || "No summary available yet. Our team is working on your results!"}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {project.isSubscription && subscriptionData.stats.length > 0 && (
                        <div className={`${cardClass} p-8 rounded-[2rem] border`}>
                            <h2 className={`text-xl font-black flex items-center gap-2 mb-8 ${textMain}`}>
                                <FiTrendingUp className="text-[#004AAD]" /> Performance Metrics
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <StatGroup icon={<FiGlobe className="text-green-500"/>} title="Google My Business" 
                                    stats={[
                                        { label: 'Views', value: subscriptionData.stats[0].gmbViews, color: 'bg-green-500' },
                                        { label: 'Calls', value: subscriptionData.stats[0].gmbCalls, color: 'bg-blue-500' },
                                        { label: 'Clicks', value: subscriptionData.stats[0].gmbWebsiteClicks, color: 'bg-purple-500' }
                                    ]} 
                                />
                                <StatGroup icon={<FiFacebook className="text-blue-500"/>} title="Facebook Ads" 
                                    stats={[
                                        { label: 'Reach', value: subscriptionData.stats[0].fbReach, color: 'bg-blue-400' },
                                        { label: 'Leads', value: subscriptionData.stats[0].fbLeads, color: 'bg-orange-500' },
                                        { label: 'Spend', value: `$${subscriptionData.stats[0].fbSpend}`, color: 'bg-red-400' }
                                    ]} 
                                />
                                <StatGroup icon={<FiZap className="text-yellow-500"/>} title="Google Ads" 
                                    stats={[
                                        { label: 'Clicks', value: subscriptionData.stats[0].googleClicks, color: 'bg-yellow-500' },
                                        { label: 'Conv.', value: subscriptionData.stats[0].googleConversions, color: 'bg-green-400' },
                                        { label: 'CPC', value: `$${subscriptionData.stats[0].googleCPC}`, color: 'bg-indigo-400' }
                                    ]} 
                                />
                            </div>
                        </div>
                    )}

                    {!project.isSubscription && (
                        <div className="space-y-4">
                            <h2 className={`text-xl font-black flex items-center gap-2 ${textMain}`}>
                                <FiCheckCircle className="text-green-500" /> Milestone Tracking
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {milestones.map((ms, i) => (
                                    <div key={i} className={`${cardClass} p-5 rounded-2xl border`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`font-bold text-sm ${textMain}`}>{ms.title}</h3>
                                            {ms.completed ? <FiCheckCircle className="text-green-500" /> : <div className="w-4 h-4 rounded-full border border-gray-600"></div>}
                                        </div>
                                        <p className={`${textSec} text-xs truncate mb-3`}>{ms.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {project.isSubscription && (
                        <div className="bg-gradient-to-br from-[#004AAD] to-blue-600 p-8 rounded-[2.5rem] !text-white shadow-xl shadow-blue-500/20">
                            <p className="text-[10px] font-black uppercase tracking-widest !text-white opacity-70 mb-6">Subscription Overview</p>
                            <div className="flex items-end gap-1 mb-4">
                                <span className="text-6xl font-black tracking-tighter !text-white leading-none">{daysLeft}</span>
                                <span className="text-sm font-bold !text-white opacity-80 mb-2">Days To Renewal</span>
                            </div>
                            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mt-6 mb-8">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (daysLeft/30)*100)}%` }}
                                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center">
                                    <p className="text-[8px] font-bold uppercase !text-white opacity-60 mb-1">Starts</p>
                                    <p className="text-[11px] font-black !text-white">{new Date(project.subscriptionStartDate).toLocaleDateString()}</p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center">
                                    <p className="text-[8px] font-bold uppercase !text-white opacity-60 mb-1">Renew</p>
                                    <p className="text-[11px] font-black !text-white">{new Date(project.subscriptionExpiryDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {lightboxImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-8 backdrop-blur-xl"
                        onClick={() => setLightboxImage(null)}
                    >
                        <button className="absolute top-8 right-8 p-3 bg-white/10 text-white rounded-full hover:bg-white/20">
                            <FiX size={32} />
                        </button>
                        <motion.img 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={lightboxImage} 
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl border border-white/10" 
                            alt="Full Preview" 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatGroup({ icon, title, stats }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{title}</span>
            </div>
            <div className="space-y-4">
                {stats.map((s, i) => (
                    <div key={i}>
                        <div className="flex justify-between text-[10px] font-bold mb-1 uppercase tracking-widest">
                            <span className="text-gray-400/60">{s.label}</span>
                            <span className="text-[#004AAD]">{s.value}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} className={`h-full ${s.color}`} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
