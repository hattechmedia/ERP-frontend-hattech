import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { FiPlus, FiXCircle, FiLayers, FiInfo, FiClock } from "react-icons/fi";

export default function ClientNewProject() {
    const [requests, setRequests] = useState([]);
    const [isLight, setIsLight] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        projectName: "",
        projectType: "Web Development",
        description: "",
        budget: ""
    });

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/clients/requests');
            if (res.data.success) {
                const myRequests = res.data.data.filter(r => r.type === "New Project");
                setRequests(myRequests);
            }
        } catch (err) {
            console.error("Failed to fetch project requests", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkTheme = () => setIsLight(document.body.classList.contains('light'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        fetchRequests();

        return () => observer.disconnect();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/clients/requests', {
                type: "New Project",
                subject: `New Project: ${formData.projectName}`,
                message: formData.description,
                projectDetails: { ...formData }
            });

            if (res.data.success) {
                toast.success("Project request submitted for approval!");
                setShowForm(false);
                setFormData({
                    projectName: "",
                    projectType: "Web Development",
                    description: "",
                    budget: ""
                });
                fetchRequests();
            }
        } catch (err) {
            console.error("Failed to submit project request", err);
            toast.error("Failed to submit project request");
        }
    };

    const textMain = isLight ? "text-gray-900" : "text-white";
    const textSec = isLight ? "text-gray-600" : "text-gray-400";
    const cardBg = isLight ? "bg-white" : "bg-[#1e1e2d]";
    const cardBorder = isLight ? "border-gray-200" : "border-gray-800";

    return (
        <div className="space-y-8 pt-14 md:pt-0 animate-in fade-in duration-500">
            {/* HER0 SECTION */}
            <div className={`relative overflow-hidden rounded-3xl p-8 mb-8 ${isLight ? 'bg-[#004AAD] text-white' : 'bg-[#004AAD]/20 border border-[#004AAD]/20'}`}>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <FiLayers size={140} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Request New Project</h1>
                    <p className="text-white/80 max-w-xl text-lg mb-6">
                        Submit your project requirements and track the approval status. Our team will review and get back to you shortly.
                    </p>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`flex items-center gap-2 px-6 py-3 font-bold rounded-2xl transition-all shadow-xl ${showForm ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-[#004AAD] hover:bg-white/90'}`}
                    >
                        {showForm ? <FiXCircle /> : <FiPlus />} {showForm ? "Cancel Request" : "Add New Project"}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className={`rounded-3xl border p-8 animate-in slide-in-from-top-4 duration-300 ${cardBg} ${cardBorder}`}>
                    <h2 className={`text-2xl font-bold mb-6 ${textMain}`}>Project Details</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-500 mb-2 px-1">Project Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.projectName}
                                    onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                                    className={`w-full rounded-2xl px-5 py-4 border focus:outline-none focus:ring-2 focus:ring-[#004AAD] transition-all ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800/50 border-gray-700 text-white'}`}
                                    placeholder="e.g. E-commerce Website, Mobile App Redesign..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2 px-1">Project Type</label>
                                <select
                                    value={formData.projectType}
                                    onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                                    className={`w-full rounded-2xl px-5 py-4 border focus:outline-none focus:ring-2 focus:ring-[#004AAD] transition-all ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800/50 border-gray-700 text-white'}`}
                                >
                                    <option>Web Development</option>
                                    <option>Mobile App</option>
                                    <option>Graphics Design</option>
                                    <option>UI/UX Design</option>
                                    <option>Marketing</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2 px-1">Estimated Budget</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.budget}
                                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                    className={`w-full rounded-2xl px-5 py-4 border focus:outline-none focus:ring-2 focus:ring-[#004AAD] transition-all ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800/50 border-gray-700 text-white'}`}
                                    placeholder="e.g. $1000 - $5000"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-bold text-gray-500 mb-2 px-1">Description</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className={`w-full rounded-2xl px-5 py-4 border focus:outline-none focus:ring-2 focus:ring-[#004AAD] transition-all resize-none ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800/50 border-gray-700 text-white'}`}
                                    placeholder="Tell us about the project goals and requirements..."
                                ></textarea>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full md:w-auto px-10 py-4 bg-[#004AAD] text-white font-bold rounded-2xl shadow-xl shadow-[#004AAD]/20 hover:bg-[#003882] transition-all transform active:scale-95"
                        >
                            Submit Project Request
                        </button>
                    </form>
                </div>
            )}

            {/* REQUEST HISTORY */}
            <div className="space-y-4">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${textMain}`}>
                    <FiClock className="text-[#004AAD]" /> Request History
                </h3>

                {loading && requests.length === 0 ? (
                    <div className="p-8 text-center text-theme-secondary">Loading requests...</div>
                ) : (
                    requests.length === 0 ? (
                        <div className={`text-center py-16 border-2 border-dashed rounded-3xl ${isLight ? 'border-gray-200 text-gray-400' : 'border-gray-800 text-gray-500'}`}>
                            <FiInfo size={40} className="mx-auto mb-3 opacity-20" />
                            <p>No project requests found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {requests.map((r) => (
                                <div key={r._id} className={`p-6 rounded-3xl border transition-all hover:shadow-lg ${cardBg} ${cardBorder}`}>
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className={`text-lg font-bold ${textMain}`}>{r.projectDetails?.projectName || r.subject}</h4>
                                                    <p className="text-sm font-bold text-blue-500 uppercase tracking-wider">{r.projectDetails?.projectType}</p>
                                                </div>
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${r.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
                                                    r.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                    }`}>
                                                    {r.status}
                                                </span>
                                            </div>

                                            <p className={`text-sm leading-relaxed ${textSec}`}>{r.message}</p>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                                                <div className="p-3 rounded-2xl bg-gray-500/5 border border-gray-500/10">
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Budget</span>
                                                    <span className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-green-400'}`}>{r.projectDetails?.budget || "N/A"}</span>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-gray-500/5 border border-gray-500/10">
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Requested On</span>
                                                    <span className={`text-sm font-bold ${textMain}`}>{new Date(r.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {r.adminComment && (
                                                <div className={`mt-4 p-4 rounded-2xl border ${isLight ? 'bg-blue-50 border-blue-100' : 'bg-blue-500/5 border-blue-500/20'}`}>
                                                    <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Admin Feedback</p>
                                                    <p className={`text-sm italic ${textMain}`}>"{r.adminComment}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
