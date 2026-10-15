import { useState, useEffect } from "react";
import { FiStar, FiCalendar, FiTrendingUp, FiCheckCircle, FiXCircle, FiFileText, FiClock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ProjectHeadPerformance() {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [stats, setStats] = useState({
        workingDaysToday: 0,
        totalCompanyWorkingDays: 0,
        present: 0,
        absent: 0,
        leave: 0,
        submittedReports: 0,
        verifiedReports: 0
    });
    const [averageRating, setAverageRating] = useState(0);
    const [performanceScore, setPerformanceScore] = useState(0);
    const [scoreBreakdown, setScoreBreakdown] = useState({ att: 0, punc: 0, rep: 0, mls: 25, bonus: 0 });
    const [loading, setLoading] = useState(true);

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const statsMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
            const [perfRes, statsRes, scoringRes] = await Promise.all([
                api.get('/performance'),
                api.get(`/hr/employee-stats?month=${selectedMonth}&year=${selectedYear}`),
                api.get(`/hr/reports/my-scoring?month=${statsMonth}`)
            ]);

            if (perfRes.data.success) {
                const data = perfRes.data.data;
                setAssessments(data);
                if (data.length > 0) {
                    const total = data.reduce((acc, curr) => acc + curr.rating, 0);
                    setAverageRating((total / data.length).toFixed(1));
                }
            }

            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }

            if (scoringRes.data.success) {
                const s = scoringRes.data;
                setPerformanceScore(Math.round(s.scores.total));
                setScoreBreakdown({
                    att: s.scores.attendance,
                    punc: s.scores.punctuality,
                    rep: s.scores.reports,
                    mls: s.scores.milestones || 25,
                    bonus: s.scores.bonus || s.bonusPercentage || 0,
                    isEmployeeOfTheMonth: s.isEmployeeOfTheMonth,
                    isEmployeeOf6Months: s.isEmployeeOf6Months
                });
            }
        } catch (err) {
            console.error("Failed to fetch performance", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformance();
    }, [selectedMonth, selectedYear]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004AAD]"></div>
        </div>
    );

    return (
        <div className="space-y-6 pt-14 md:pt-0 pb-10">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-[#004AAE]">My Performance Hub</h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest opacity-60">Personal working stats & administrative assessments</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* MONTH/YEAR SELECTORS */}
                    <div className="flex gap-2 bg-[var(--bg-card)] border border-[var(--bg-inner)] p-1 rounded-xl shadow-xl">
                        <select 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="bg-transparent text-[10px] font-black p-1 outline-none text-theme-primary uppercase tracking-widest"
                        >
                            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                                <option key={i} value={i + 1} className="bg-[var(--bg-card)] font-black">{m}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-transparent text-[10px] font-black p-1 outline-none text-theme-primary uppercase tracking-widest"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y} className="bg-[var(--bg-card)] font-black">{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {/* Month Working Days */}
                <div className="bg-[var(--bg-card)] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col justify-center min-h-[90px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#004AAE] mb-2">Month Working Days</span>
                    <p className="text-3xl font-black text-[#004AAE]">{stats.totalCompanyWorkingDays || 0}</p>
                </div>

                {/* Working Days Today (Highlighted) */}
                <div className="bg-[#004AAE] p-4 rounded-2xl shadow-xl shadow-[#004AAE]/30 flex flex-col justify-center min-h-[90px] transform hover:scale-105 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white mb-2">Working Days Till Now</span>
                    <p className="text-3xl font-black text-white">{stats.workingDaysToday || 0}</p>
                </div>

                {/* Employee Working Days */}
                <div className="bg-[var(--bg-card)] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col justify-center min-h-[90px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#004AAE] mb-2">My Working Days</span>
                    <p className="text-3xl font-black text-[#004AAE]">{(stats.present || 0) + (stats.leave || 0)}</p>
                </div>

                {/* Absent */}
                <div className="bg-[var(--bg-card)] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col justify-center min-h-[90px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Absent</span>
                    <p className="text-3xl font-black text-red-500">{stats.absent || 0}</p>
                </div>

                {/* Leaves */}
                <div className="bg-[var(--bg-card)] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col justify-center min-h-[90px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Leaves</span>
                    <p className="text-3xl font-black text-orange-500">{stats.leave || 0}</p>
                </div>

                {/* Total Reports (Submitted) */}
                <div className="bg-[var(--bg-card)] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col justify-center min-h-[90px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Submitted Reports</span>
                    <p className="text-3xl font-black text-indigo-500">{stats.submittedReports || 0}</p>
                </div>

                {/* Verify Reports */}
                <div className="bg-[var(--bg-card)] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col justify-center min-h-[90px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2">Verify Reports</span>
                    <p className="text-3xl font-black text-green-500">{stats.verifiedReports || 0}</p>
                </div>
            </div>

            {/* PERFORMANCE SCORE CARD (PREMIUM) */}
            <div className="bg-[var(--bg-card)] border border-[var(--bg-inner)] p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                    {/* Score Circle */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                                <circle 
                                    cx="80" cy="80" r="74" stroke="#004AAE" strokeWidth="10" fill="transparent" strokeDasharray={464.7}
                                    strokeDashoffset={464.7 - (464.7 * performanceScore) / 100}
                                    className="transition-all duration-1000 ease-out"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-black text-theme-primary tracking-tighter">{performanceScore}%</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-theme-secondary opacity-50">Global Score</span>
                            </div>
                        </div>
                        <div className={`mt-6 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${performanceScore >= 90 ? 'bg-green-500/10 text-green-500' : performanceScore >= 75 ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                            {performanceScore >= 90 ? 'Elite Performance' : performanceScore >= 75 ? 'Core Performer' : 'Ongoing Growth'}
                        </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <ScoreBar label="Attendance (A:25)" score={scoreBreakdown.att} total={25} color="bg-green-500" />
                            <ScoreBar label="Punctuality (P:25)" score={scoreBreakdown.punc} total={25} color="bg-blue-500" />
                            <ScoreBar label="Daily Reports (R:25)" score={scoreBreakdown.rep} total={25} color="bg-purple-500" />
                            <ScoreBar label="Milestones / Tasks (M:25)" score={scoreBreakdown.mls} total={25} color="bg-amber-500" />
                        </div>
                        {scoreBreakdown.bonus > 0 && (
                            <div className="pt-2">
                                <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-400/20 text-amber-400 border border-amber-400/40 inline-flex items-center gap-1.5 animate-pulse">
                                    +{scoreBreakdown.bonus}% Leaderboard Achievement Bonus Included
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#004AAE]/5 blur-[100px] rounded-full translate-x-20 -translate-y-20 group-hover:bg-[#004AAE]/10 transition-all duration-700"></div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {assessments.length === 0 ? (
                    <div className="text-center py-24 bg-[var(--bg-card)] rounded-[40px] border border-[var(--bg-inner)]">
                        <div className="inline-block p-6 bg-[var(--bg-inner)] rounded-3xl mb-6">
                            <FiCalendar size={48} className="text-[#004AAE] opacity-40" />
                        </div>
                        <h3 className="text-xl font-black text-theme-primary uppercase tracking-tighter">No Performance Reviews</h3>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto mt-2 opacity-60">
                            PH assessments from the administrator panel will appear here.
                        </p>
                    </div>
                ) : (
                    assessments.map((assess) => (
                        <div key={assess._id} className="bg-[var(--bg-card)] border border-[var(--bg-inner)] rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                            {/* HEADER */}
                            <div className="p-8 flex flex-wrap justify-between items-center gap-4 bg-[var(--bg-inner)]/50 border-b border-[var(--bg-inner)]">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-[#004AAE]/10 text-[#004AAE] rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        <FiCalendar size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-theme-primary uppercase tracking-tighter">{assess.weekRange}</h3>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest opacity-60 italic">Assessed by Administrator</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-yellow-500/10 px-6 py-3 rounded-2xl text-yellow-600 border border-yellow-500/20">
                                    <span className="font-black text-2xl">{assess.rating}</span>
                                    <FiStar fill="currentColor" size={20} />
                                </div>
                            </div>

                            {/* CONTENT */}
                            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-theme-primary uppercase tracking-[0.2em] block opacity-40">
                                        Achievements & Administrative Summary
                                    </label>
                                    <div className="text-sm font-medium text-theme-secondary leading-relaxed bg-[var(--bg-inner)] p-6 rounded-3xl border border-white/5">
                                        {assess.summary}
                                    </div>
                                </div>

                                {assess.improvements && (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] block opacity-60">
                                            Growth Areas & Strategy
                                        </label>
                                        <div className="text-sm font-medium text-theme-secondary leading-relaxed bg-orange-500/5 p-6 rounded-3xl border border-orange-500/10">
                                            {assess.improvements}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-[var(--bg-inner)]/30 px-10 py-5 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest border-t border-[var(--bg-inner)] italic">
                                Timestamped on {new Date(assess.date).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ScoreBar({ label, score, total, color }) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary opacity-60">{label}</span>
                <span className="text-sm font-black text-theme-primary">{score} <span className="opacity-30 text-[10px]">/ {total} pts</span></span>
            </div>
            <div className="h-4 w-full rounded-full bg-gray-100 dark:bg-gray-800/50 overflow-hidden shadow-inner flex p-1">
                <div 
                    style={{ width: `${(score / total) * 100}%` }}
                    className={`h-full ${color} rounded-full shadow-lg transition-all duration-1000 ease-out`}
                />
            </div>
        </div>
    );
}
