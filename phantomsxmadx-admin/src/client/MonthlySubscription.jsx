import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    FiZap, 
    FiCheckCircle, 
    FiClock, 
    FiLayers, 
    FiActivity, 
    FiChevronRight,
    FiBriefcase,
    FiBarChart2,
    FiCalendar,
    FiAlertCircle,
    FiX,
    FiArrowRight
} from "react-icons/fi";
import api from "../services/api";
import toast from "react-hot-toast";

export default function MonthlySubscription() {
    const [isLight, setIsLight] = useState(false);
    const [profile, setProfile] = useState(null);
    const [subscriptionProject, setSubscriptionProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reportsCount, setReportsCount] = useState(0);
    const [showManageModal, setShowManageModal] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [buyFlow, setBuyFlow] = useState(false);
    const [buyData, setBuyData] = useState({ type: 'SEO Optimization', details: '' });
    const navigate = useNavigate();

    const fetchRequests = async () => {
        try {
            const res = await api.get('/clients/requests');
            if (res.data.success) {
                // Filter requests related to this subscription
                const subReqs = res.data.data.filter(req => 
                    req.status === 'Pending' && 
                    (req.subject.includes('Subscription') || req.type === 'Subscription Change')
                );
                setPendingRequests(subReqs);
            }
        } catch (err) {
            console.error("Failed to fetch requests", err);
        }
    };

    useEffect(() => {
        const checkTheme = () => setIsLight(document.body.classList.contains('light'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        const fetchData = async () => {
            try {
                setLoading(true);
                const [profRes, projRes] = await Promise.all([
                    api.get('/profile/client'),
                    api.get('/projects'),
                    fetchRequests()
                ]);

                if (profRes.data.success) { 
                    setProfile(profRes.data.profile);
                }

                if (projRes.data.success) {
                    const subProject = projRes.data.data.find(p => p.isSubscription);
                    setSubscriptionProject(subProject);

                    if (subProject) {
                        const reportsRes = await api.get(`/subscriptions/reports/${subProject._id}`);
                        if (reportsRes.data.success) {
                            // Count reports from current month
                            const currentMonth = new Date().getMonth();
                            const currentYear = new Date().getFullYear();
                            const monthlyReports = reportsRes.data.data.filter(r => {
                                const rDate = new Date(r.reportDate || r.createdAt);
                                return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
                            });
                            setReportsCount(monthlyReports.length);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => observer.disconnect();
    }, []);

    const cardClass = isLight 
        ? "bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" 
        : "bg-[#111827] border border-gray-800 shadow-xl";
    
    const textMain = isLight ? "text-gray-900" : "text-white";
    const textSec = isLight ? "text-gray-500" : "text-gray-400";

    const services = [
        { name: subscriptionProject?.subscriptionCategory || "SEO Optimization", desc: "Monthly Performance Tracking", status: subscriptionProject?.status === 'active' ? "Active" : "Pending", icon: <FiBarChart2 />, color: "text-blue-500" },
        { name: "Social Media Mgmt", desc: "Facebook/Instagram/LinkedIn", status: "Active", icon: <FiActivity />, color: "text-purple-500" },
        { name: "Lead Generation", desc: "Targeted PPC Campaigns", status: "Active", icon: <FiZap />, color: "text-yellow-500" },
    ];

    const handleSubscriptionAction = async (type) => {
        try {
            let subject = "";
            let message = "";
            
            if (type === 'EXTEND') {
                subject = "Subscription Extension Request";
                message = `Client requested to EXTEND their subscription for project: ${subscriptionProject.title}`;
            } else if (type === 'FINISH') {
                subject = "Subscription Termination Request";
                message = `Client requested to FINISH their subscription for project: ${subscriptionProject.title}`;
            } else if (type === 'BUY') {
                subject = "New Subscription Purchase Request";
                message = `Client wants to BUY a new [${buyData.type}] subscription.\n\nDetails: ${buyData.details}`;
            }

            const res = await api.post('/clients/requests', {
                type: 'Other',
                subject,
                message,
                priority: 'High'
            });
            if (res.data.success) {
                toast.success("Request sent successfully!");
                setShowManageModal(false);
                setBuyFlow(false);
                setBuyData({ type: 'SEO Optimization', details: '' });
                fetchRequests(); // Refresh the list
            }
        } catch (error) {
            toast.error("Failed to submit request");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[70vh] animate-pulse">
            <div className="w-12 h-12 border-4 border-[#004AAE] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Accessing Dashboard...</p>
        </div>
    );

    if (!subscriptionProject) return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 space-y-6">
            <div className="w-24 h-24 bg-blue-500/10 text-[#004AAE] rounded-full flex items-center justify-center border border-blue-500/20">
                <FiZap size={48} />
            </div>
            <div className="space-y-2">
                <h2 className={`text-2xl font-black ${textMain}`}>No Active Subscription</h2>
                <p className={`${textSec} max-w-sm`}>You haven't subscribed to an automated monthly management plan yet.</p>
            </div>
            <button 
                onClick={() => navigate('/client/requests')}
                className="px-8 py-3 bg-[#004AAE] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-[#004AAE]/40 transition-all active:scale-95"
            >
                Submit New Request
            </button>
        </div>
    );

    return (
        <div className="space-y-8 pb-10 pt-14 md:pt-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* GREETING & HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-black tracking-tight ${textMain}`}>
                        Good morning, {profile?.name?.split(' ')[0] || "Client"} 👋
                    </h1>
                    <p className={`text-sm font-medium mt-1 ${textSec}`}>Workspace Active for <span className="text-[#004AAE] font-bold">{subscriptionProject.title}</span></p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${subscriptionProject.status === 'active' ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                    <div className={`w-2 h-2 rounded-full ${subscriptionProject.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                    <span className={`text-xs font-black uppercase tracking-widest ${subscriptionProject.status === 'active' ? 'text-green-600' : 'text-orange-600'}`}>
                        {subscriptionProject.status === 'active' ? 'Subscription Active' : 'Setup in Progress'}
                    </span>
                </div>
            </div>

            {/* PENDING REQUESTS BANNER */}
            {pendingRequests.length > 0 && (
                <div className={`p-4 rounded-3xl border border-dashed flex items-center justify-between ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/10 border-blue-500/20'} animate-in fade-in slide-in-from-top-4 duration-500`}>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#004AAE] text-white flex items-center justify-center animate-pulse">
                            <FiClock />
                        </div>
                        <div>
                            <p className={`text-xs font-black uppercase tracking-widest ${isLight ? 'text-[#004AAE]' : 'text-blue-400'}`}>Request Under Review</p>
                            <p className={`text-[11px] font-medium ${textSec}`}>You have {pendingRequests.length} pending subscription request(s).</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/client/requests')}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${isLight ? 'bg-white text-[#004AAE] shadow-sm' : 'bg-gray-800 text-white'}`}
                    >
                        View Status
                    </button>
                </div>
            )}

            {/* MAIN PLAN HERO */}
            <div className={`p-8 rounded-[2rem] relative overflow-hidden group ${cardClass} border-none !bg-gradient-to-br !from-[#004AAE] !to-[#003882] shadow-2xl shadow-blue-500/20`}>
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <FiLayers size={200} />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 !text-blue-200 uppercase text-[10px] font-black tracking-[0.2em]">
                            <FiBriefcase /> Plan Category: {subscriptionProject.subscriptionCategory || "Custom Plan"}
                        </div>
                        <h2 className="text-4xl font-black !text-white tracking-tighter truncate max-w-2xl">{subscriptionProject.title}</h2>
                        <p className="!text-white/70 max-w-md text-sm leading-relaxed truncate-2-lines">
                            {subscriptionProject.description || "Active performance tracking and automated milestone updates for your ongoing project."}
                        </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-4 min-w-[200px]">
                        <div className="text-right">
                            <p className="text-blue-200/50 text-[10px] font-black uppercase tracking-widest">Renews on</p>
                            <p className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                <FiCalendar className="text-blue-300" /> {subscriptionProject.subscriptionExpiryDate ? new Date(subscriptionProject.subscriptionExpiryDate).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowManageModal(true)}
                            className="w-full md:w-auto px-8 py-3 bg-white text-[#004AAE] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95"
                        >
                            Manage Subscription
                        </button>
                    </div>
                </div>
            </div>

            {/* STATS STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { label: "Active Services", value: services.length, sub: "All running smoothly", color: "text-blue-500" },
                    { label: "Tasks This Month", value: reportsCount, sub: "Daily Reports Delivered", color: "text-[#004AAE]" },
                ].map((s, i) => (
                    <div key={i} className={`p-6 rounded-3xl ${cardClass} flex flex-col justify-between group hover:border-[#004AAE]/30 transition-all`}>
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">{s.label}</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 mt-2">{s.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LATEST SUMMARY BOX */}
                <div className={`col-span-1 lg:col-span-7 p-8 rounded-[2.5rem] ${cardClass} flex flex-col`}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className={`text-xl font-black tracking-tight ${textMain}`}>Performance Summary</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Latest Feedback from Team</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 text-[#004AAE] rounded-xl flex items-center gap-2">
                            <FiCheckCircle /> <span className="text-[10px] font-black uppercase">Verified</span>
                        </div>
                    </div>

                    <div className={`flex-1 p-6 rounded-3xl ${isLight ? 'bg-gray-50' : 'bg-gray-800/10'} border border-dashed ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
                        {subscriptionProject.subscriptionSummary ? (
                            <p className={`${textMain} text-sm leading-relaxed italic font-medium opacity-90`}>
                                "{subscriptionProject.subscriptionSummary}"
                            </p>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-4">
                                <FiAlertCircle className="text-gray-300" size={32} />
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-loose">
                                    Our team is finalizing your <br/> latest performance indicators...
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-8 flex items-center justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button 
                            onClick={() => navigate(`/client/project/${subscriptionProject._id}`)}
                            className="text-[11px] font-black uppercase tracking-widest text-[#004AAE] flex items-center gap-2 hover:gap-3 transition-all"
                        >
                            View Full Dashboard <FiChevronRight />
                        </button>
                    </div>
                </div>

                {/* SERVICES INCLUDED */}
                <div className={`col-span-1 lg:col-span-5 p-6 rounded-[2.5rem] ${cardClass}`}>
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h3 className={`text-xl font-black tracking-tight ${textMain}`}>Services Included</h3>
                    </div>

                    <div className="space-y-4">
                        {services.map((service, i) => (
                            <div key={i} className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${isLight ? 'bg-gray-50/50 border-gray-100' : 'bg-gray-800/10 border-gray-800'} hover:border-[#004AAE]/30`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${isLight ? 'bg-white shadow-md' : 'bg-gray-800'}`}>
                                        <span className={service.color}>{service.icon}</span>
                                    </div>
                                    <div>
                                        <p className={`text-[13px] font-black tracking-tight ${textMain}`}>{service.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{service.desc}</p>
                                    </div>
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${service.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    {service.status}
                                </span>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={() => navigate('/client/projects')}
                        className="w-full mt-10 py-3 bg-[#004AAE]/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#004AAE] hover:bg-[#004AAE] hover:text-white transition-all transform active:scale-95 shadow-sm shadow-blue-500/5"
                    >
                        Explore Other Projects
                    </button>
                </div>
            </div>

            {/* MANAGE SUBSCRIPTION MODAL */}
            {showManageModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={`${cardClass} w-full max-w-md rounded-[2.5rem] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300`}>
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div className="p-3 bg-blue-500/10 text-[#004AAE] rounded-2xl">
                                    <FiZap size={24} />
                                </div>
                                <button onClick={() => { setShowManageModal(false); setBuyFlow(false); }} className="p-2 text-gray-400 hover:text-gray-600 transition-all"><FiX size={24} /></button>
                            </div>

                            {!buyFlow ? (
                                <>
                                    <h3 className={`text-2xl font-black mb-2 ${textMain}`}>Manage Subscription</h3>
                                    <p className={`text-sm mb-8 ${textSec}`}>Choose an action for your current plan: <span className="text-[#004AAE] font-bold">{subscriptionProject.title}</span></p>

                                    <div className="space-y-4">
                                        <button 
                                            onClick={() => handleSubscriptionAction('EXTEND')}
                                            className="w-full p-4 rounded-3xl border-2 border-transparent bg-[#004AAE] text-white hover:bg-[#003882] transition-all flex items-center justify-between group"
                                        >
                                            <div className="text-left">
                                                <p className="font-black text-base">Extend Subscription</p>
                                                <p className="text-[10px] text-blue-100 opacity-70 font-medium tracking-tight">Add more months to your plan</p>
                                            </div>
                                            <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </button>

                                        <button 
                                            onClick={() => setBuyFlow(true)}
                                            className={`w-full p-4 rounded-3xl border-2 border-[#004AAE]/20 ${isLight ? 'bg-blue-50' : 'bg-[#004AAE]/10 text-white'} hover:bg-[#004AAE]/20 transition-all flex items-center justify-between group`}
                                        >
                                            <div className="text-left">
                                                <p className={`font-black text-base ${isLight ? 'text-[#004AAE]' : 'text-blue-300'}`}>Buy New Subscription</p>
                                                <p className="text-[10px] text-gray-400 font-medium tracking-tight">Purchase additional monthly services</p>
                                            </div>
                                            <FiZap size={18} className="text-[#004AAE]" />
                                        </button>

                                        <button 
                                            onClick={() => handleSubscriptionAction('FINISH')}
                                            className={`w-full p-4 rounded-3xl border-2 border-gray-100 ${isLight ? 'bg-gray-50' : 'bg-gray-800/10 text-white'} hover:border-red-500/30 hover:bg-red-500/5 transition-all flex items-center justify-between group`}
                                        >
                                            <div className="text-left">
                                                <p className={`font-black text-base ${isLight ? 'text-gray-900' : 'text-white'}`}>Finish Subscription</p>
                                                <p className="text-[10px] text-gray-400 font-medium tracking-tight">Stop automatic renewals</p>
                                            </div>
                                            <FiX size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className={`text-2xl font-black mb-2 ${textMain}`}>Purchase Service</h3>
                                    <p className={`text-sm mb-6 ${textSec}`}>Select the service you'd like to start.</p>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${textSec}`}>Select Service Type</label>
                                            <select 
                                                value={buyData.type}
                                                onChange={(e) => setBuyData({ ...buyData, type: e.target.value })}
                                                className={`w-full p-3 rounded-2xl border text-sm font-bold ${isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-gray-800 border-gray-700 text-white focus:border-[#004AAE]'} outline-none transition-all`}
                                            >
                                                <option>SEO Optimization</option>
                                                <option>Social Media Management</option>
                                                <option>Lead Generation (PPC)</option>
                                                <option>Content Writing</option>
                                                <option>Custom Managed Plan</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${textSec}`}>Additional Requirements</label>
                                            <textarea 
                                                value={buyData.details}
                                                onChange={(e) => setBuyData({ ...buyData, details: e.target.value })}
                                                placeholder="e.g. Budget, targeted audience, or specific goals..."
                                                className={`w-full p-4 rounded-2xl border text-sm font-medium ${isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-gray-800 border-gray-700 text-white focus:border-[#004AAE]'} outline-none transition-all resize-none h-32`}
                                            ></textarea>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button 
                                                onClick={() => setBuyFlow(false)}
                                                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isLight ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                            >
                                                Back
                                            </button>
                                            <button 
                                                onClick={() => handleSubscriptionAction('BUY')}
                                                className="flex-[2] py-3 bg-[#004AAE] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#003882] transition-all shadow-lg active:scale-95"
                                            >
                                                Send Purchase Request
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="px-8 py-4 bg-gray-50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest leading-loose">
                                Your request will be reviewed by our <br/> account management team within 24 hours.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
