import { useState, useEffect } from "react";
import { FiStar, FiCalendar, FiTrendingUp, FiCheckCircle, FiXCircle, FiFileText, FiClock, FiUsers, FiArrowRight, FiCheck, FiEye } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Performance() {
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
    const [isTeamLead, setIsTeamLead] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamReports, setTeamReports] = useState([]);

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
            const isLead = currentUser.role === 'teamlead';
            setIsTeamLead(isLead);

            const statsMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
            const requests = [
                api.get('/performance'),
                api.get(`/hr/employee-stats?month=${selectedMonth}&year=${selectedYear}`),
                api.get(`/hr/reports/my-scoring?month=${statsMonth}`)
            ];

            if (isLead) {
                requests.push(api.get('/team/members'));
                requests.push(api.get('/team/reports'));
            }

            const results = await Promise.all(requests);
            const [perfRes, statsRes, scoringRes, teamMemRes, teamRepRes] = results;

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

            if (isLead && teamMemRes?.data.success) {
                setTeamMembers(teamMemRes.data.data);
            }
            if (isLead && teamRepRes?.data.success) {
                setTeamReports(teamRepRes.data.reports);
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

    if (loading) return <div className="p-8 text-center text-theme-secondary">Loading performance metrics...</div>;

    return (
        <div className="space-y-6 pt-14 md:pt-0 pb-10">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#004AAE]">Dashboard</h1>
                    <p className="text-gray-400">Personal performance metrics and weekly assessments.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* MONTH/YEAR SELECTORS */}
                    <div className="flex gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] p-1 rounded-lg">
                        <select 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="bg-transparent text-sm font-bold p-1 outline-none text-theme-primary"
                        >
                            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                                <option key={i} value={i + 1} className="bg-[var(--bg-card)]">{m}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-transparent text-sm font-bold p-1 outline-none text-theme-primary"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y} className="bg-[var(--bg-card)]">{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {/* Month Working Days */}
                <div className="bg-[var(--bg-card)] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col justify-center min-h-[90px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Month Working Days</span>
                    <p className="text-3xl font-black text-blue-500">{stats.totalCompanyWorkingDays || 0}</p>
                </div>

                {/* Working Days Today (Highlighted) */}
                <div className="bg-[#004AAE] p-4 rounded-2xl shadow-xl shadow-[#004AAE]/30 flex flex-col justify-center min-h-[90px] transform hover:scale-105 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest !text-white mb-2">Working Days Till Now</span>
                    <p className="text-3xl font-black !text-white">{stats.workingDaysToday || 0}</p>
                </div>

                {/* Employee Working Days */}
                <div className="bg-[var(--bg-card)] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col justify-center min-h-[90px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Employee Working Days</span>
                    <p className="text-3xl font-black text-blue-500">{(stats.workingDaysToday || 0) - (stats.absent || 0)}</p>
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
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-3xl shadow-xl relative overflow-hidden group">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {/* Score Circle */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                                <circle 
                                    cx="64" cy="64" r="58" stroke="#004AAE" strokeWidth="8" fill="transparent" strokeDasharray={364.4}
                                    strokeDashoffset={364.4 - (364.4 * performanceScore) / 100}
                                    className="transition-all duration-1000 ease-out"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-black text-theme-primary">{performanceScore}%</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-theme-secondary opacity-50">Monthly Score</span>
                            </div>
                        </div>
                        <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${performanceScore >= 90 ? 'bg-green-500/10 text-green-500' : performanceScore >= 75 ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                            {performanceScore >= 90 ? 'Elite Performance' : performanceScore >= 75 ? 'Core Performer' : 'Ongoing Growth'}
                        </div>
                    </div>

                    {/* Score Breakdown (Matching Admin Leaderboard Standards) */}
                    <div className="md:col-span-2 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ScoreBar label="Attendance (A:25)" score={scoreBreakdown.att} total={25} color="bg-green-500" />
                            <ScoreBar label="Punctuality (P:25)" score={scoreBreakdown.punc} total={25} color="bg-blue-500" />
                            <ScoreBar label="Daily Reports (R:25)" score={scoreBreakdown.rep} total={25} color="bg-purple-500" />
                            <ScoreBar label="Milestones / Tasks (M:25)" score={scoreBreakdown.mls} total={25} color="bg-amber-500" />
                        </div>
                        
                        <div className="pt-4 border-t border-[var(--border-color)] flex justify-between items-center flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-medium leading-relaxed text-theme-secondary opacity-60 italic uppercase tracking-tighter">
                                    * Evaluated using company leaderboard standards (A:25 | P:25 | R:25 | M:25).
                                </p>
                                {scoreBreakdown.bonus > 0 && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-400 border border-amber-400/40 animate-pulse">
                                        +{scoreBreakdown.bonus}% Bonus Included
                                    </span>
                                )}
                            </div>
                            <div className="bg-[#004AAE]/10 px-3 py-1 rounded-lg">
                                <span className="text-[10px] font-black text-[#004AAE] uppercase tracking-widest">Efficiency: {performanceScore}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#004AAE]/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-[#004AAE]/10 transition-all duration-700"></div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {assessments.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                        <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                            <FiCalendar size={32} className="text-gray-500 dark:text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">No Assessments Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2">
                            Your weekly assessments will appear here once submitted by your Project Head.
                        </p>
                    </div>
                ) : (
                    assessments.map((assess) => (
                        <div key={assess._id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                            {/* HEADER */}
                            <div className="p-4 flex flex-wrap justify-between items-center gap-4 border-b border-[var(--border-color)]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                        <FiCalendar size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{assess.weekRange}</h3>
                                        <p className="text-sm text-gray-500">Assessed by {assess.projectHeadId?.name || "Project Head"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1 rounded-full text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30">
                                    <span className="font-bold text-lg">{assess.rating}</span>
                                    <FiStar fill="currentColor" />
                                </div>
                            </div>

                            {/* CONTENT */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--bg-card)]">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                        Achievements & Summary
                                    </label>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-[var(--bg-main)] p-4 rounded-lg border border-gray-100 dark:border-white/5">
                                        {assess.summary}
                                    </p>
                                </div>

                                {assess.improvements && (
                                    <div>
                                        <label className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mb-2 block">
                                            Areas for Improvement
                                        </label>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-500/10">
                                            {assess.improvements}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 dark:bg-[var(--bg-main)] px-6 py-3 text-right text-xs text-gray-500 border-t border-[var(--border-color)]">
                                Submitted on {new Date(assess.date).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* TEAM LEAD SECTION (CONDITIONAL) */}
            {isTeamLead && (
                <div className="mt-12 pt-12 border-t border-[var(--border-color)] space-y-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-[#004AAE] flex items-center gap-2">
                                <FiUsers /> My Team Overview
                            </h2>
                            <p className="text-sm text-gray-500">Quick view of your assigned team members and their latest activity.</p>
                        </div>
                        <button 
                            onClick={() => navigate("/employee/team")}
                            className="text-xs font-black uppercase tracking-widest text-[#004AAE] hover:underline flex items-center gap-1"
                        >
                            Manage Full Team <FiArrowRight />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teamMembers.slice(0, 3).map(member => (
                            <div key={member._id} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg flex items-center gap-4">
                                <img 
                                    src={member.userId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.userId?.name)}`} 
                                    className="w-12 h-12 rounded-xl border border-primary/20 object-cover"
                                    alt=""
                                />
                                <div>
                                    <h3 className="font-bold text-sm text-theme-primary">{member.userId?.name}</h3>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest opacity-70">{member.position}</p>
                                </div>
                            </div>
                        ))}
                        {teamMembers.length === 0 && (
                            <p className="text-xs text-gray-500 italic">No team members assigned.</p>
                        )}
                    </div>

                    {/* LATEST TEAM REPORTS */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-theme-secondary opacity-50">Latest Team Activity</h3>
                        <div className="space-y-4">
                            {teamReports.slice(0, 3).map(report => (
                                <div key={report._id} className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex justify-between items-center gap-4 hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {report.userId?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{report.userId?.name}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(report.date).toLocaleDateString()} • {report.status === 'verified' ? 'Verified' : 'Pending Verification'}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate("/employee/team")}
                                        className="p-2 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-lg transition-all"
                                        title="View Details"
                                    >
                                        <FiEye size={16} />
                                    </button>
                                </div>
                            ))}
                            {teamReports.length === 0 && (
                                <p className="text-xs text-gray-500 italic">No recent reports from team members.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ScoreBar({ label, score, total, color }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">{label}</span>
                <span className="text-xs font-black text-theme-primary">{score} <span className="opacity-40 text-[10px]">/ {total} pts</span></span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-inner flex">
                <div 
                    style={{ width: `${(score / total) * 100}%` }}
                    className={`h-full ${color} shadow-lg transition-all duration-1000 ease-out`}
                />
            </div>
        </div>
    );
}
