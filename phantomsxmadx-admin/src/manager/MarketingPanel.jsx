import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiExternalLink, FiSearch, FiFilter, FiFolder, FiCheckCircle, FiChevronRight, FiImage } from "react-icons/fi";

export default function MarketingPanel() {
    const [completedProjects, setCompletedProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [viewProject, setViewProject] = useState(null);

    useEffect(() => {
        const allProjects = JSON.parse(localStorage.getItem("projects")) || [];
        const onboarding = JSON.parse(localStorage.getItem("onboardingProjects")) || [];

        // Combine projects and filter for completed ones (progress 100)
        const combined = [...allProjects, ...onboarding].filter(p => p.progress === 100 || p.status === "Delivered" || p.status === "Completed");

        // Remove duplicates by name
        const unique = [];
        const seen = new Set();
        combined.forEach(p => {
            if (!seen.has(p.name || p.project)) {
                unique.push(p);
                seen.add(p.name || p.project);
            }
        });

        setCompletedProjects(unique);
    }, []);

    const categories = ["All", ...new Set(completedProjects.map(p => p.type || "Development"))];

    const filtered = completedProjects.filter(p => {
        const matchesSearch = (p.name || p.project || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.client || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || (p.type || "Development") === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 pt-14 md:pt-0 animate-in fade-in duration-700">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#004AAE] to-blue-600 p-8 rounded-3xl text-white shadow-xl">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Marketing Portfolio</h1>
                    <p className="text-blue-100 mt-1 font-medium">Showcasing our completed successes and project details</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                    <p className="text-xs uppercase font-bold tracking-widest opacity-80">Total Delivered</p>
                    <p className="text-4xl font-black">{completedProjects.length}</p>
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)]">
                <div className="relative flex-1 w-full">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by project or client name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:ring-2 focus:ring-[#004AAE] outline-none transition-all placeholder:text-gray-500 font-medium"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <FiFilter className="text-[#004AAE]" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="flex-1 md:w-48 px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:ring-2 focus:ring-[#004AAE] outline-none transition-all font-bold text-sm"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.length > 0 ? filtered.map((p, i) => (
                    <div
                        key={i}
                        className="group relative bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden hover:shadow-2xl hover:shadow-[#004AAE]/10 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                        onClick={() => setViewProject(p)}
                    >
                        {/* Project Image Placeholder/Preview */}
                        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[#004AAE]/10 group-hover:bg-[#004AAE]/20 transition-colors"></div>
                            {p.image ? (
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                                <FiFolder size={48} className="text-[#004AAE]/40 group-hover:scale-110 transition-transform duration-500" />
                            )}
                            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">DELIVERED</div>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-xl text-theme-primary leading-tight group-hover:text-[#004AAE] transition-colors">{p.name || p.project}</h3>
                            </div>
                            <p className="text-sm text-theme-secondary font-medium flex items-center gap-2 mb-4">
                                <FiCheckCircle className="text-green-500" /> {p.client || "Standard Project"}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                                <span className="text-xs px-3 py-1 bg-[#004AAE]/10 text-[#004AAE] rounded-lg font-bold border border-[#004AAE]/20">{p.type || "Development"}</span>
                                <button className="flex items-center gap-1 text-sm font-bold text-[#004AAE] group-hover:translate-x-1 transition-transform">
                                    View Case Study <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center">
                        <FiFolder size={64} className="mx-auto text-gray-700 mb-4 opacity-20" />
                        <p className="text-xl font-bold text-gray-500">No completed projects found matching your criteria</p>
                    </div>
                )}
            </div>

            {/* PROJECT DETAILS MODAL */}
            {/* PROJECT DETAILS MODAL */}
            <AnimatePresence>
                {viewProject && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--bg-card)] w-full max-w-4xl max-h-[90vh] rounded-3xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col relative"
                        >
                            {/* Modal Header */}
                            <div className="relative h-64 bg-gray-900 shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent z-10"></div>
                                {viewProject.image ? (
                                    <img src={viewProject.image} alt={viewProject.name} className="w-full h-full object-cover opacity-60" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                                        <FiImage size={80} className="text-white/10" />
                                    </div>
                                )}
                                <button
                                    onClick={() => setViewProject(null)}
                                    className="absolute top-6 right-6 z-20 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-xl"
                                >
                                    <FiExternalLink />
                                </button>
                                <div className="absolute bottom-6 left-8 z-20">
                                    <span className="px-4 py-1.5 rounded-full bg-[#004AAE] text-white text-[10px] font-black uppercase tracking-widest shadow-xl">Portfolio Entry</span>
                                    <h2 className="text-4xl font-black text-white mt-2 drop-shadow-lg">{viewProject.name || viewProject.project}</h2>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 overflow-y-auto space-y-8 flex-1">
                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="md:col-span-2 space-y-6">
                                        <section>
                                            <h4 className="text-sm font-black uppercase tracking-widest text-[#004AAE] mb-3">Project Summary</h4>
                                            <p className="text-lg leading-relaxed text-theme-primary font-medium italic">
                                                "{viewProject.description || "As part of our commitment to excellence, we successfully delivered this project meeting all client requirements and quality standards. The solution focused on scalability, performance, and user experience."}"
                                            </p>
                                        </section>

                                        <section className="bg-[var(--bg-main)] p-6 rounded-3xl border border-[var(--border-color)]">
                                            <h4 className="text-sm font-black uppercase tracking-widest text-[#004AAE] mb-4">Key Achievements</h4>
                                            <ul className="space-y-3">
                                                <li className="flex items-center gap-3 text-theme-primary font-bold">
                                                    <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0"><FiCheckCircle size={14} /></div>
                                                    Full deployment to production environment
                                                </li>
                                                <li className="flex items-center gap-3 text-theme-primary font-bold">
                                                    <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0"><FiCheckCircle size={14} /></div>
                                                    100% KPI achievement for core features
                                                </li>
                                                <li className="flex items-center gap-3 text-theme-primary font-bold">
                                                    <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0"><FiCheckCircle size={14} /></div>
                                                    Optimized performance for mobile devices
                                                </li>
                                            </ul>
                                        </section>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-[#004AAE]/5 rounded-3xl border border-[#004AAE]/20 space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Client Name</p>
                                                <p className="text-lg font-bold text-theme-primary">{viewProject.client || "Confidential Client"}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Category</p>
                                                <p className="text-lg font-bold text-theme-primary">{viewProject.type || "Development"}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Delivered On</p>
                                                <p className="text-lg font-bold text-theme-primary">{viewProject.deliveredDate || viewProject.deadline || "Jan 2026"}</p>
                                            </div>
                                        </div>

                                        <button
                                            className="w-full py-4 bg-gradient-to-r from-[#004AAE] to-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all"
                                            onClick={() => setViewProject(null)}
                                        >
                                            Return to List
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
