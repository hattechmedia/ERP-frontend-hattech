import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiAward, FiCalendar } from "react-icons/fi";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function EmployeeAchievements() {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");

    useEffect(() => {
        const fetchMyAchievements = async () => {
            const userId = user.id || user._id || user.userId;
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await api.get(`/achievements?userId=${userId}`);
                if (res.data.success) {
                    setAchievements(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch achievements", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyAchievements();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 pt-14 md:pt-0 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-theme-primary flex items-center gap-3">
                    <FiAward className="text-yellow-500" /> My Achievements
                </h1>
                <p className="text-sm text-theme-secondary">Your recognitions and milestones</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.length === 0 ? (
                    <div className="col-span-full py-20 text-center space-y-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                        <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                            <FiAward size={40} className="text-gray-400" />
                        </div>
                        <p className="text-theme-secondary text-lg">No achievements recorded yet. Keep up the great work!</p>
                    </div>
                ) : (
                    achievements.map((ach) => (
                        <motion.div
                            key={ach._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-xl relative group overflow-hidden border-l-4 border-l-yellow-500 hover:scale-[1.02] transition-all"
                        >
                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-black uppercase tracking-widest">
                                    <FiAward /> {ach.awardType}
                                </div>
                            </div>

                            <div className="space-y-3 relative z-10">
                                <h4 className="text-lg font-bold text-theme-primary shrink-0 leading-tight">{ach.title}</h4>
                                <p className="text-sm text-theme-secondary leading-relaxed">
                                    {ach.description || "No description provided."}
                                </p>
                                
                                <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-medium text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <FiCalendar /> {new Date(ach.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-1 italic">
                                        Issued by: {ach.issuedBy?.name || "Admin"}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
