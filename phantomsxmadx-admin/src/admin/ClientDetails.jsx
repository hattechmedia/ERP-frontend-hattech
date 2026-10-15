import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiMail, FiPhone, FiCheckCircle, FiGrid, FiUser, FiGlobe } from "react-icons/fi";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [isLight, setIsLight] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkTheme = () => {
            setIsLight(document.body.classList.contains('light'));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const res = await api.get(`/clients/${id}`);
                if (res.data.success) {
                    setClient(res.data.data); // Adjust strictly if response structure differs
                }
            } catch (error) {
                console.error("Failed to fetch client", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
    }, [id]);

    if (loading) return <LoadingSpinner />;

    if (!client) return (
        <div className="p-10 text-center space-y-4 pt-20">
            <h2 className={`text-xl ${isLight ? 'text-gray-900' : 'text-white'}`}>Client Not Found</h2>
            <button onClick={() => navigate(-1)} className="text-[#004AAD] hover:underline">Go Back</button>
        </div>
    );

    const cardClass = isLight ? "bg-white border-gray-200 shadow-xl" : "bg-[#1e1e2d] border-gray-700 shadow-2xl";
    const textMain = isLight ? "text-gray-900" : "text-white";
    const textSec = isLight ? "text-gray-600" : "text-gray-400";
    const textMuted = isLight ? "text-gray-500" : "text-gray-500";

    return (
        <div className="max-w-6xl mx-auto space-y-8 pt-14 md:pt-0 animate-in fade-in duration-500 pb-10">
            {/* TOP NAVIGATION */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className={`p-2.5 rounded-full border transition ${isLight ? 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-gray-300 hover:bg-[var(--bg-main)]'}`}
                >
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        Client Profile
                    </h1>
                    <p className={`text-sm ${textMuted}`}>View and manage client details</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* LEFT COLUMN: IDENTITY & CONTACT (Span 4) */}
                <div className="md:col-span-4 space-y-6">
                    <div className={`rounded-3xl border overflow-hidden relative ${cardClass}`}>
                        {/* COVER BACKGROUND */}
                        <div className="h-32 bg-[#004AAE] opacity-90"></div>

                        <div className="px-6 pb-8 relative">
                            {/* AVATAR */}
                            <div className="-mt-16 mb-4 flex justify-center">
                                <div className="relative">
                                    <div className={`w-32 h-32 rounded-full ring-4 shadow-md flex items-center justify-center text-4xl font-bold text-white uppercase ${isLight ? 'ring-white bg-[#004AAE]' : 'ring-[#1e1e2d] bg-[#004AAE]'}`}>
                                        {client.name?.charAt(0) || 'C'}
                                    </div>
                                </div>
                            </div>

                            {/* NAME & ROLE */}
                            <div className="text-center mb-8">
                                <h2 className={`text-2xl font-bold mb-1 ${textMain}`}>{client.name}</h2>
                                <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${isLight ? 'bg-blue-50 text-[#004AAE] border-blue-100' : 'bg-[#004AAE]/10 text-[#004AAE] border-[#004AAE]/20'}`}>
                                    {client.company || "No Company"}
                                </p>
                            </div>

                            {/* CONTACT INFO */}
                            <div className="space-y-5">
                                <ContactItem
                                    icon={<FiMail />}
                                    label="Email Address"
                                    value={client.email}
                                    copyable
                                    isLight={isLight}
                                />
                                <ContactItem
                                    icon={<FiPhone />}
                                    label="Phone Number"
                                    value={client.phone}
                                    isLight={isLight}
                                />
                                <ContactItem
                                    icon={<FiGrid />}
                                    label="Project(s)"
                                    value={client.projects?.map(p => p.title || p.name || p).join(", ") || "No Projects"}
                                    isLight={isLight}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: DETAILS (Span 8) */}
                <div className="md:col-span-8 space-y-6">
                    {/* ACCOUNT STATUS */}
                    <div className={`p-8 rounded-3xl border shadow-lg ${cardClass}`}>
                        <SectionHeader icon={<FiCheckCircle />} title="Account Status" isLight={isLight} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${isLight ? 'bg-green-50 border-green-200' : 'bg-green-500/10 border-green-500/20'}`}>
                                <p className={`text-sm font-medium ${isLight ? 'text-green-800' : 'text-green-400'}`}>Status</p>
                                <p className={`text-lg font-bold ${isLight ? 'text-green-900' : 'text-green-300'}`}>Active</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}>
                                <p className={`text-sm font-medium ${textMuted}`}>Role</p>
                                <p className={`text-lg font-bold ${textMain} capitalize`}>{client.role || "Client"}</p>
                            </div>
                        </div>
                    </div>

                    <div className={`p-8 rounded-3xl border shadow-lg ${cardClass}`}>
                        <SectionHeader icon={<FiGrid />} title="Projects" isLight={isLight} />

                        {client.projects && client.projects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {client.projects.map((proj, idx) => (
                                    <div key={idx} className={`p-5 rounded-2xl border transition-colors group ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-[var(--bg-main)]/50 border-[var(--border-color)]'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#004AAE]/10 flex items-center justify-center text-[#004AAE]">
                                                <FiGrid size={24} />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-lg ${textMain}`}>{proj.title || proj.name || "Untitled Project"}</h3>
                                                <p className={`text-sm ${textSec}`}>Connected Project</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={`${textSec} italic`}>No active projects assigned.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Components
function ContactItem({ icon, label, value, copyable, isLink, isLight }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-4 group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isLight ? 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-[#004AAE]' : 'bg-[var(--bg-main)] text-gray-400 group-hover:text-[#004AAE] group-hover:bg-[#004AAE]/10'}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                {isLink ? (
                    <a href={`https://${value}`} target="_blank" rel="noreferrer" className={`text-sm font-medium truncate transition cursor-pointer block ${isLight ? 'text-gray-800 hover:text-[#004AAE]' : 'text-gray-200 hover:text-[#004AAE]'}`}>{value}</a>
                ) : (
                    <p className={`text-sm font-medium truncate select-all ${isLight ? 'text-gray-800' : 'text-gray-200'}`}>{value}</p>
                )}
            </div>
        </div>
    );
}

function SectionHeader({ icon, title, isLight }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLight ? 'bg-blue-50 text-[#004AAE]' : 'bg-[#004AAE]/20 text-[#004AAE]'}`}>
                {icon}
            </div>
            <h3 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{title}</h3>
        </div>
    );
}
