import { useState, useEffect } from "react";
import { FiSave, FiStar, FiCalendar } from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";

export default function ProjectHeadAssessment() {
    const [employees, setEmployees] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState("");
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Work Overview State
    const [empTasks, setEmpTasks] = useState([]);
    const [empReports, setEmpReports] = useState([]);

    // Form State
    const [rating, setRating] = useState(0);
    const [summary, setSummary] = useState("");
    const [improvements, setImprovements] = useState("");
    const [weekRange, setWeekRange] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [empRes, assessRes] = await Promise.all([
                api.get('/employees?t=' + Date.now()),
                api.get('/performance?t=' + Date.now())
            ]);

            if (empRes.data.success) {
                const empData = empRes.data.data || empRes.data.employees || [];
                // Relax filter to show all non-admin, non-projecthead users
                const filtered = empData.filter(e => {
                    const role = (e.role || e.userId?.role || '').toLowerCase();
                    return role !== 'admin' && role !== 'projecthead';
                });
                setEmployees(filtered);
            }
            if (assessRes.data.success) setAssessments(assessRes.data.data || assessRes.data.performance || []);
        } catch (err) {
            console.error("Failed to fetch assessment data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Default week calculated from today
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Monday
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 7)); // Sunday
        setWeekRange(`${startOfWeek.toISOString().split('T')[0]} to ${endOfWeek.toISOString().split('T')[0]}`);
    }, []);

    useEffect(() => {
        const fetchEmployeeWork = async () => {
            if (selectedEmp) {
                const emp = employees.find(e => e._id === selectedEmp || e.userId?._id === selectedEmp);
                const userId = emp?.userId?._id || emp?.userId || selectedEmp;

                try {
                    const [taskRes, reportRes] = await Promise.all([
                        api.get(`/tasks?assignedTo=${userId}`),
                        api.get(`/reports?userId=${userId}`)
                    ]);

                    if (taskRes.data.success) setEmpTasks(taskRes.data.tasks);
                    if (reportRes.data.success) setEmpReports(reportRes.data.reports);
                } catch (err) {
                    console.error("Failed to fetch employee work", err);
                }
            } else {
                setEmpTasks([]);
                setEmpReports([]);
            }
        };

        fetchEmployeeWork();
    }, [selectedEmp, employees]);

    const handleSubmit = async () => {
        if (!selectedEmp || rating === 0 || !summary) {
            toast.error("Please select an employee, give a rating, and provide a summary.");
            return;
        }

        const emp = employees.find(e => e._id === selectedEmp || e.userId?._id === selectedEmp);
        const userId = emp?.userId?._id || emp?.userId || selectedEmp;

        try {
            const res = await api.post('/performance', {
                employeeId: userId,
                weekRange,
                rating,
                summary,
                improvements
            });

            if (res.data.success) {
                toast.success("Assessment Submitted Successfully!");
                fetchData();
                // Reset Form
                setRating(0);
                setSummary("");
                setImprovements("");
                setSelectedEmp("");
            }
        } catch (err) {
            console.error("Failed to submit assessment", err);
            toast.error("Failed to submit assessment");
        }
    };

    if (loading && employees.length === 0) return <div className="p-8 text-center text-theme-secondary">Loading assessments...</div>;

    return (
        <div className="space-y-6 pt-14 md:pt-0 pb-10">
            <h1 className="text-2xl font-bold text-theme-primary transition-colors">Weekly Assessment</h1>
            <p className="text-theme-secondary transition-colors">Evaluate employee performance for the week.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ASSESSMENT FORM */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-color)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-theme-primary">Select Employee</label>
                            <select
                                value={selectedEmp}
                                onChange={(e) => setSelectedEmp(e.target.value)}
                                className="w-full p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-theme-primary focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            >
                                <option value="">-- Choose Employee --</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp.userId?._id || emp.userId}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-theme-primary">Week Range</label>
                            <input
                                type="text"
                                value={weekRange}
                                onChange={(e) => setWeekRange(e.target.value)}
                                className="w-full p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-theme-primary focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-theme-primary">Performance Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`p-2 rounded-full transition hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-theme-secondary opacity-50'}`}
                                >
                                    <FiStar size={32} fill={rating >= star ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-theme-primary">Work Summary / Achievements</label>
                            <textarea
                                rows="3"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="What did they do well this week?"
                                className="w-full p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-theme-primary focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-theme-primary">Areas for Improvement</label>
                            <textarea
                                rows="3"
                                value={improvements}
                                onChange={(e) => setImprovements(e.target.value)}
                                placeholder="What should they focus on improving?"
                                className="w-full p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-theme-primary focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-colors"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full py-3 bg-[#004AAE] hover:bg-[#003882] !text-white font-bold rounded-lg transition shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2"
                    >
                        <FiSave /> Submit Assessment
                    </button>
                </div>

                {/* EMPLOYEE WORK HISTORY SIDEBAR */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)] h-[600px] overflow-y-auto no-scrollbar transition-colors">
                        <h3 className="text-lg font-bold mb-4 sticky top-0 bg-[var(--bg-card)] pb-2 border-b border-[var(--border-color)] flex items-center justify-between text-theme-primary transition-colors">
                            <span>Work History</span>
                        </h3>

                        {!selectedEmp ? (
                            <p className="text-theme-secondary text-center py-10">Select an employee to view their work.</p>
                        ) : (
                            <div className="space-y-6">
                                {/* TASKS SECTION */}
                                <div>
                                    <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">Assigned Tasks</h4>
                                    {empTasks.length === 0 ? (
                                        <p className="text-xs text-theme-muted italic">No tasks assigned.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {empTasks.map((task, i) => (
                                                <div key={i} className="bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)] text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="font-semibold text-theme-primary">{task.title}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* REPORTS SECTION */}
                                <div>
                                    <h4 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-2">Daily Reports</h4>
                                    {empReports.length === 0 ? (
                                        <p className="text-xs text-theme-muted italic">No reports submitted.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {empReports.map((report, i) => (
                                                <div key={i} className="bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)] transition-colors">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-theme-primary">{new Date(report.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs text-theme-secondary line-clamp-3">
                                                        {report.report}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RECENT ASSESSMENTS LIST */}
            <h2 className="text-xl font-bold mt-10 mb-4 text-theme-primary">Assessment History</h2>
            <div className="space-y-4">
                {assessments.length === 0 ? (
                    <p className="text-theme-secondary">No assessments recorded yet.</p>
                ) : (
                    assessments.map(assess => (
                        <div key={assess._id} className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)]">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-lg font-bold text-theme-primary">{assess.employeeId?.name || "Employee"}</h3>
                                    <p className="text-xs text-blue-600">{assess.weekRange}</p>
                                </div>
                                <div className="flex text-yellow-400">
                                    {Array.from({ length: assess.rating }).map((_, i) => <FiStar key={i} fill="currentColor" size={16} />)}
                                </div>
                            </div>
                            <p className="text-sm text-theme-primary mt-2"><strong>Summary:</strong> {assess.summary}</p>
                            {assess.improvements && <p className="text-sm text-theme-secondary mt-1"><strong>Improvements:</strong> {assess.improvements}</p>}
                            <p className="text-xs text-theme-muted mt-3 text-right">Submitted on {new Date(assess.date).toLocaleDateString()}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
