import { useState, useEffect } from "react";
import { FiClock, FiCalendar, FiArrowRight, FiCheckCircle, FiInfo } from "react-icons/fi";
import api from "../services/api";

export default function Attendance() {
    const [activities, setActivities] = useState([]);
    const [todayRecord, setTodayRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ present: 0, pending: 0, late: 0, halfDay: 0 });
    const [viewDate, setViewDate] = useState(new Date()); // Current month by default

    // Month names without "May" and restricting future months
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const availableMonths = monthNames.map((name, index) => ({ name, index }));

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const res = await api.get('/hr/attendance');
            if (res.data.success) {
                // Use the data directly without filtering out May
                const data = res.data.data || [];
                
                setActivities(data);

                // Find today's record
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                
                const record = data.find(a => a.date.split('T')[0] === todayStr);
                setTodayRecord(record);

                // Stats calculation for SELECTED month
                updateStats(data, viewDate.getMonth(), viewDate.getFullYear());
            }
        } catch (err) {
            console.error("Failed to fetch attendance", err);
        } finally {
            setLoading(false);
        }
    };

    const updateStats = (data, pMonth, pYear) => {
        const filtered = data.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === pMonth && d.getFullYear() === pYear;
        });
        const present = filtered.filter(a => ['Present', 'Verified', 'Late', 'Report not submitted'].includes(a.status) || a.isVerified).length;
        const late = filtered.filter(a => a.status === 'Late' || a.isLate).length;
        const pending = filtered.filter(a => a.status === 'Pending').length;
        setStats({ present, pending, late, halfDay: 0 });
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    useEffect(() => {
        updateStats(activities, viewDate.getMonth(), viewDate.getFullYear());
    }, [viewDate, activities]);

    const handleMonthChange = (monthIdx) => {
        const newDate = new Date(viewDate.getFullYear(), monthIdx, 1);
        setViewDate(newDate);
    };

    const handleYearChange = (year) => {
      const newDate = new Date(year, viewDate.getMonth(), 1);
      setViewDate(newDate);
    };

    if (loading) {
        return <div className="p-8 text-center text-theme-secondary">Loading attendance...</div>;
    }

    return (
        <div className="space-y-6 pt-14 md:pt-0 pb-10">
            {/* HEADER & ACTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Attendance Tracking</h1>
                    <p className="text-sm text-gray-500 font-medium tracking-tight uppercase tracking-widest text-[8px] opacity-70">Employee Log Console</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Month Picker */}
                    <div className="flex bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1 shadow-sm">
                        <select 
                            value={viewDate.getMonth()}
                            onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                            className="bg-transparent text-sm font-bold text-white px-3 py-1.5 outline-none cursor-pointer"
                        >
                            {availableMonths.map(m => (
                                <option key={m.index} value={m.index} className="bg-slate-800">{m.name}</option>
                            ))}
                        </select>
                        <select 
                            value={viewDate.getFullYear()}
                            onChange={(e) => handleYearChange(parseInt(e.target.value))}
                            className="bg-transparent text-sm font-bold text-white px-3 py-1.5 outline-none cursor-pointer border-l border-[var(--border-color)]"
                        >
                           {[2024, 2025, 2026].map(y => (
                               <option key={y} value={y} className="bg-slate-800">{y}</option>
                           ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        {todayRecord ? (
                            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border text-xs font-bold uppercase tracking-tight shadow-lg shadow-blue-500/5 ${
                                todayRecord.status === 'Late' || todayRecord.isLate
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : todayRecord.isVerified
                                    ? 'bg-green-100/10 text-green-500 border-green-500/30'
                                    : 'bg-blue-100/10 text-blue-500 border-blue-500/30'
                            }`}>
                                {todayRecord.status === 'Late' || todayRecord.isLate ? (
                                    <>
                                        <FiClock /> Late Mark {todayRecord.isVerified ? '✓' : ''}
                                    </>
                                ) : todayRecord.isVerified ? (
                                    <>
                                        <FiCheckCircle /> Verified ✓
                                    </>
                                ) : (
                                    <>
                                        <FiClock /> Pending...
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="px-4 py-2 bg-gray-500/10 text-gray-500 rounded-xl flex items-center gap-2 border border-gray-500/20 text-xs font-bold uppercase tracking-tight">
                                <FiInfo /> No session yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-4 hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-1 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                        <FiCheckCircle size={24} />
                    </div>
                    <div>
                        <span className="text-2xl font-bold">{stats.present}</span>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{availableMonths[viewDate.getMonth()].name} Present</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-4 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                        <FiClock size={24} />
                    </div>
                    <div>
                        <span className="text-2xl font-bold">{stats.late}</span>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{availableMonths[viewDate.getMonth()].name} Late</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-4 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all transform group-hover:-rotate-6">
                        <FiClock size={24} />
                    </div>
                    <div>
                        <span className="text-2xl font-bold">{stats.pending}</span>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{availableMonths[viewDate.getMonth()].name} Pending</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-4 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all transform group-hover:scale-110">
                        <FiCalendar size={24} />
                    </div>
                    <div>
                        <span className="text-2xl font-bold">{todayRecord?.workHours || "0.00"}</span>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Hours Today</p>
                    </div>
                </div>
            </div>

            {/* TODAY'S STATUS CARD */}
            {todayRecord && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-[#004AAE]/10 to-transparent border border-[#004AAE]/30 relative overflow-hidden group shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004AAE] to-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all transform group-hover:rotate-6">
                                <FiClock size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Active Session</h3>
                                <p className="text-xs text-gray-400 font-medium">
                                    Today, {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-8">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Check In</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-[#004AAE]">
                                        {['Absent', 'Leave', 'Short Leave'].includes(todayRecord.status) || !todayRecord.checkIn
                                            ? (todayRecord.status || "--:--")
                                            : new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                    {(todayRecord.status === 'Late' || todayRecord.isLate) && (
                                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                            Late Mark
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="w-10 h-0.5 bg-gradient-to-r from-[#004AAE]/50 to-transparent hidden md:block"></div>

                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Check Out</span>
                                <span className="text-lg font-black text-[#004AAE]">
                                    {['Absent', 'Leave', 'Short Leave'].includes(todayRecord.status)
                                        ? todayRecord.status
                                        : (todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "--:--")}
                                </span>
                            </div>

                            <div className="flex flex-col min-w-[100px]">
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Status</span>
                                <span className={`text-lg font-black uppercase italic ${
                                    todayRecord.status === 'Late' || todayRecord.isLate
                                        ? 'text-amber-500'
                                        : todayRecord.isVerified
                                        ? 'text-green-500'
                                        : 'text-blue-500'
                                }`}>
                                    {todayRecord.status === 'Late' || todayRecord.isLate
                                        ? 'Late Mark'
                                        : todayRecord.isVerified
                                        ? 'Verified ✓'
                                        : (todayRecord.status || 'Pending')}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Subtle aesthetic element */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 blur-3xl rounded-full"></div>
                </div>
            )}

            {/* CALENDAR VIEW */}
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-inner)]/30">
                    <h2 className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 text-white">
                        <FiCalendar className="text-yellow-500" /> {availableMonths[viewDate.getMonth()].name} {viewDate.getFullYear()} Overview
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div> Present</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div> Late</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div> Pending</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div> Absent</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div> Leave</div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-7 gap-3 text-center mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-3">
                        {(() => {
                            const year = viewDate.getFullYear();
                            const month = viewDate.getMonth();
                            const firstDay = new Date(year, month, 1).getDay();
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const days = [];

                            // Padding for start of month
                            for (let i = 0; i < firstDay; i++) {
                                days.push(<div key={`pad-${i}`} className="h-11 rounded-xl bg-gray-50/5 dark:bg-gray-800/20 opacity-20 border border-[var(--border-color)]"></div>);
                            }

                            // Days of the month
                            for (let d = 1; d <= daysInMonth; d++) {
                                const dateStrArg = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                const record = activities.find(a => a.date.split('T')[0] === dateStrArg);

                                let statusColor = "bg-[var(--bg-inner)]/50 text-gray-500 border border-[var(--border-color)]";
                                if (record) {
                                    if (record.status === 'Leave' || record.status === 'Short Leave') statusColor = "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20 border-yellow-400";
                                    else if (record.status === 'Absent') statusColor = "bg-red-500 text-white shadow-lg shadow-red-500/20 border-red-400";
                                    else if (record.status === 'Late' || record.isLate) statusColor = "bg-amber-500 text-white shadow-lg shadow-amber-500/20 border-amber-400";
                                    else if (record.isVerified || record.status === 'Present' || record.status === 'Verified') statusColor = "bg-green-500 text-white shadow-lg shadow-green-500/20 border-green-400";
                                    else if (record.status === 'Pending') statusColor = "bg-blue-500 text-white shadow-lg shadow-blue-500/20 border-blue-400";
                                }

                                const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                                days.push(
                                    <div key={d} className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all hover:scale-105 cursor-default group ${statusColor}`}>
                                        <span className={`text-[12px] font-black ${isToday ? 'scale-110' : ''}`}>{d}</span>
                                        {record?.status === 'Late' || record?.isLate ? (
                                            <span className="text-[7px] font-black uppercase tracking-tight bg-black/30 px-1 rounded mt-0.5">Late</span>
                                        ) : record?.workHours ? (
                                            <span className="text-[7px] font-bold opacity-80 mt-0.5">{record.workHours}h</span>
                                        ) : null}
                                        {isToday && (
                                            <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-white animate-ping"></div>
                                        )}
                                    </div>
                                );
                            }
                            return days;
                        })()}
                    </div>
                </div>
            </div>

            {/* HISTORY TABLE */}
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-inner)]/30">
                    <h2 className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 text-white">
                        <FiClock className="text-yellow-500" />
                        Detailed Attendance Logs
                    </h2>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#1a1c23] text-gray-500 uppercase font-black text-[9px] tracking-widest sticky top-0 z-10 border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">In Time</th>
                                <th className="px-6 py-4">Out Time</th>
                                <th className="px-6 py-4">Verification Stats</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {activities
                                .filter(item => {
                                    const d = new Date(item.date);
                                    return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
                                })
                                .sort((a,b) => new Date(b.date) - new Date(a.date))
                                .map((item) => (
                                <tr key={item._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-white group-hover:text-blue-400 transition-colors">
                                                 {(() => {
                                                    const d = item.date;
                                                    const [y, m, day] = d.split('T')[0].split('-').map(Number);
                                                    return new Date(y, m - 1, day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                                                })()}
                                            </span>
                                            <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">Physical Access</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {['Absent', 'Leave', 'Short Leave'].includes(item.status) || !item.checkIn ? (
                                            <span className="text-gray-500 font-bold italic uppercase">{item.status || 'N/A'}</span>
                                        ) : (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg font-bold">
                                                    {new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </span>
                                                {(item.status === 'Late' || item.isLate) && (
                                                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                                                        Late Mark
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {['Absent', 'Leave', 'Short Leave'].includes(item.status) ? (
                                            <span className="text-gray-500 font-bold italic uppercase">{item.status}</span>
                                        ) : item.checkOut ? (
                                            <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded-lg font-bold">
                                                 {new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </span>
                                        ) : (
                                            <span className="text-gray-600 font-black italic">ACTIVE</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {(item.status === 'Late' || item.isLate) ? (
                                            <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border shadow-sm bg-amber-500/10 text-amber-400 border-amber-500/30">
                                                <FiClock size={10}/>
                                                Late Mark {item.isVerified ? '(Verified ✓)' : ''}
                                            </span>
                                        ) : (
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border shadow-sm ${item.isVerified ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                {item.isVerified ? <FiCheckCircle size={10}/> : <FiClock size={10}/>}
                                                {item.isVerified ? 'Verified ✓' : (item.status || 'Pending')}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {activities.filter(item => {
                                const d = new Date(item.date);
                                return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
                            }).length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center text-gray-500 font-bold uppercase text-[10px] tracking-widest italic">No attendance recorded in {availableMonths[viewDate.getMonth()].name}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
