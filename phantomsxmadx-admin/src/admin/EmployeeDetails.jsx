import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiMail, FiPhone, FiBriefcase, FiAward, FiClock, FiMapPin, FiUser, FiLinkedin, FiFileText, FiCalendar, FiArrowRight, FiActivity, FiPrinter, FiEdit, FiCheck, FiX, FiRotateCcw, FiSave, FiDollarSign, FiTrash2 } from "react-icons/fi";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLight, setIsLight] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [projectHeads, setProjectHeads] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);
    const [selectedProjectHead, setSelectedProjectHead] = useState("");
    const [selectedTeamLead, setSelectedTeamLead] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [saving, setSaving] = useState(false);
    const [activities, setActivities] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [assignedProjects, setAssignedProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [achievements, setAchievements] = useState([]);
    const [achievementsLoading, setAchievementsLoading] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [monthStats, setMonthStats] = useState({ workingDays: 0, present: 0, absent: 0, leave: 0, verifiedReports: 0 });
    const [performanceScore, setPerformanceScore] = useState(0);
    const [workingDaysConfig, setWorkingDaysConfig] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [scoreBreakdown, setScoreBreakdown] = useState({ att: 0, punc: 0, rep: 0 });
    const [showCertificate, setShowCertificate] = useState(false);
    const certificateRef = useRef();

    // Warning Letters State
    const [warningLetters, setWarningLetters] = useState([]);
    const [selectedWarning, setSelectedWarning] = useState(null);
    const [showWarningModal, setShowWarningModal] = useState(false);

    // Flexible Performance Date Range Filter State ("monthly" | "custom" | "untilNow")
    const [filterMode, setFilterMode] = useState("monthly");
    const [customStartDate, setCustomStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Admin Full Edit Employee Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        salary: "",
        joinDate: "",
        projectHead: "",
        teamLead: "",
        role: ""
    });

    // Certificate Customization State
    const [showCertEditor, setShowCertEditor] = useState(false);
    const [certData, setCertData] = useState({
        title: "Certificate of Experience",
        certifyText: "This is to certify that",
        name: "",
        position: "",
        company: "Hat Tech Media",
        startDate: "",
        endDate: "",
        bodyText: "",
        ceoName: "MUHAMMAD HAMZA ALI",
        ceoTitle: "CEO",
        ceoSubtitle: "HAT TECH MEDIA (PVT LTD)",
        hrName: "RAMSHA HAMZA",
        hrTitle: "HR DIRECTOR",
        hrSubtitle: "HAT TECH MEDIA (PVT LTD)",
        showStamp: true,
        footerLine1: "www.hattechmedia.com | contact@hattechmedia.com",
        footerLine2: `© ${new Date().getFullYear()} Hat Tech Media. All Rights Reserved.`
    });

    const resetCertDefaults = () => {
        if (!employee) return;
        const start = employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "December 15, 2025";
        const end = employee.status === 'inactive' && employee.updatedAt ? new Date(employee.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const pos = employee.jobTitle || employee.position || "Developer";

        setCertData({
            title: "Certificate of Experience",
            certifyText: "This is to certify that",
            name: employee.name || "",
            position: pos,
            company: "Hat Tech Media",
            startDate: start,
            endDate: end,
            bodyText: `has successfully completed their tenure as a ${pos} at Hat Tech Media. During their period of employment from ${start} to ${end}, we found them to be extremely hard-working, professional, and a valuable asset to our organization.`,
            ceoName: "MUHAMMAD HAMZA ALI",
            ceoTitle: "CEO",
            ceoSubtitle: "HAT TECH MEDIA (PVT LTD)",
            hrName: "RAMSHA HAMZA",
            hrTitle: "HR DIRECTOR",
            hrSubtitle: "HAT TECH MEDIA (PVT LTD)",
            showStamp: true,
            footerLine1: "www.hattechmedia.com | contact@hattechmedia.com",
            footerLine2: `© ${new Date().getFullYear()} Hat Tech Media. All Rights Reserved.`
        });
    };

    useEffect(() => {
        if (employee) {
            resetCertDefaults();
        }
    }, [employee]);

    const openEditModal = () => {
        if (!employee) return;
        setEditForm({
            name: employee.name || "",
            email: employee.email || employee.userId?.email || "",
            phone: employee.phone || "",
            department: employee.department || "",
            position: employee.jobTitle || employee.position || "",
            joinDate: employee.joinDate ? employee.joinDate.split('T')[0] : "",
            projectHead: selectedProjectHead || "",
            teamLead: selectedTeamLead || "",
            role: selectedRole || "employee"
        });
        setShowEditModal(true);
    };

    const handleSaveEmployeeEdit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const targetId = employee?._id || id;
            const normalizedRole = (editForm.role || "employee").toLowerCase().replace(/\s+/g, '');
            const res = await api.put(`/employees/${targetId}`, {
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone,
                department: editForm.department,
                position: editForm.position,
                jobTitle: editForm.position,
                joinDate: editForm.joinDate,
                projectHead: editForm.projectHead || null,
                teamLead: editForm.teamLead || null,
                role: normalizedRole
            });

            if (res.data.success) {
                toast.success("Employee details updated successfully!");
                const updated = res.data.employee || res.data.data || { ...employee, ...editForm };
                setEmployee({ ...employee, ...updated, position: editForm.position, jobTitle: editForm.position });
                setSelectedProjectHead(editForm.projectHead);
                setSelectedTeamLead(editForm.teamLead);
                setSelectedRole(editForm.role);
                setShowEditModal(false);
            }
        } catch (error) {
            console.error("Failed to update employee details", error);
            toast.error(error.response?.data?.message || "Failed to update employee details");
        } finally {
            setSaving(false);
        }
    };

    const cleanName = (name) => {
        if (!name || typeof name !== 'string') return name || "Unknown";
        return name.replace(/\d+$/, '').replace(/\s*User$/i, '').trim();
    };

    const formatDateSafe = (d) => {
        if (!d) return null;
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
            return d.split('T')[0];
        }
        const date = new Date(d);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        const checkTheme = () => {
            setIsLight(document.body.classList.contains('light'));
        };
        checkTheme();
        window.addEventListener('storage', checkTheme); // Try to listen for changes
        // Also listen for custom event if app uses one, but standard fallback:
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => {
            window.removeEventListener('storage', checkTheme);
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const [phRes, tlRes, configRes] = await Promise.all([
                    api.get('/auth/project-heads'),
                    api.get('/auth/team-leads'),
                    api.get('/hr/config/working_days')
                ]);
                if (phRes.data.success) {
                    setProjectHeads(phRes.data.data || []);
                }
                if (tlRes.data.success) {
                    setTeamLeads(tlRes.data.data || []);
                }
                if (configRes.data.success && configRes.data.data?.value) {
                    setWorkingDaysConfig(configRes.data.data.value);
                }
            } catch (error) {
                console.error("Failed to fetch managers/config", error);
            }
        };
        fetchManagers();
    }, []);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const res = await api.get(`/employees/${id}`);
                if (res.data.success && (res.data.employee || res.data.data)) {
                    let found = res.data.employee || res.data.data;
                    setEmployee(found);
                    setSelectedProjectHead(found.projectHead?._id || found.projectHead || "");
                    setSelectedTeamLead(found.teamLead?._id || found.teamLead || "");
                    setSelectedRole(found.userId?.role || found.role || "employee");
                    return;
                } else {
                    throw new Error(res.data.message || "Employee not found");
                }
            } catch (error) {
                // 1. Try finding in all employees by userId, id, or lead slug
                try {
                    const allRes = await api.get('/employees');
                    const allEmps = allRes.data?.employees || allRes.data?.data || [];
                    const matched = allEmps.find(e => 
                        String(e._id) === String(id) || 
                        String(e.id) === String(id) || 
                        String(e.userId?._id) === String(id) || 
                        String(e.userId) === String(id) ||
                        (typeof id === 'string' && id.startsWith('lead-') && (e.name || '').toLowerCase().replace(/\s+/g, '-').includes(id.replace('lead-', '')))
                    );
                    if (matched) {
                        setEmployee(matched);
                        setSelectedProjectHead(matched.projectHead?._id || matched.projectHead || "");
                        setSelectedTeamLead(matched.teamLead?._id || matched.teamLead || "");
                        setSelectedRole(matched.userId?.role || matched.role || "employee");
                        return;
                    }
                } catch (e1) {}

                // 2. Try finding in /auth/admins if an admin was clicked
                try {
                    const adminRes = await api.get('/auth/admins');
                    const admins = adminRes.data?.admins || [];
                    const matchedAdmin = admins.find(a => 
                        String(a._id) === String(id) || 
                        String(a.id) === String(id) ||
                        (typeof id === 'string' && id.startsWith('admin-') && (a.name || '').toLowerCase().replace(/\s+/g, '-').includes(id.replace('admin-', '')))
                    );
                    if (matchedAdmin) {
                        let customRoles = {};
                        try {
                            customRoles = JSON.parse(localStorage.getItem('admin_custom_roles') || '{}');
                        } catch (e) {}
                        const customTitle = customRoles[matchedAdmin._id] || customRoles[matchedAdmin.id] || customRoles[matchedAdmin.email?.toLowerCase()] || customRoles[matchedAdmin.name?.toLowerCase()] || 'Admin';
                        
                        setEmployee({
                            _id: matchedAdmin._id,
                            name: matchedAdmin.name,
                            email: matchedAdmin.email,
                            role: 'admin',
                            position: customTitle,
                            jobTitle: customTitle,
                            department: 'Executive Administration',
                            image: matchedAdmin.avatar,
                            profileImage: matchedAdmin.avatar,
                            userId: matchedAdmin
                        });
                        setSelectedRole('admin');
                        return;
                    }
                } catch (e2) {}

                // 3. Fallback to local cache
                const employees = JSON.parse(localStorage.getItem("employees")) || [];
                let fallbackFound = employees.find(e => String(e.id) === String(id) || String(e._id) === String(id));
                if (fallbackFound) setEmployee(fallbackFound);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, [id]);

    const calculateTenure = (joinDate) => {
        if (!joinDate) return "Recently Joined";
        const start = new Date(joinDate);
        if (isNaN(start.getTime())) return "Recently Joined";
        const now = new Date();
        
        let years = now.getFullYear() - start.getFullYear();
        let months = now.getMonth() - start.getMonth();
        
        if (months < 0) {
            years--;
            months += 12;
        }
        
        if (years === 0) {
            return `${months} Month${months !== 1 ? 's' : ''} Experience`;
        }
        return `${years} Year${years !== 1 ? 's' : ''} ${months > 0 ? `& ${months} Month${months !== 1 ? 's' : ''}` : ''} Experience`;
    };

    useEffect(() => {
        const fetchWarningLetters = async () => {
            if (!employee) return;
            const targetUserId = employee.userId?._id || employee.userId;
            if (!targetUserId) return;
            try {
                const res = await api.get(`/hr/documents?userId=${targetUserId}`);
                if (res.data.success) {
                    const docs = res.data.data || [];
                    const userWarnings = docs.filter(d => {
                        const uId = String(d.user?._id || d.user);
                        return uId === String(targetUserId) && (d.type === 'warning' || (d.title && d.title.toLowerCase().includes('warning')));
                    });
                    setWarningLetters(userWarnings);
                }
            } catch (err) {
                console.error("Failed to fetch warning letters", err);
            }
        };
        fetchWarningLetters();
    }, [employee]);

    useEffect(() => {
        const fetchActivity = async () => {
            if (!employee) return;
            const targetUserId = employee.userId?._id || employee.userId;
            if (!targetUserId) return;

            try {
                setActivityLoading(true);
                setStatsLoading(true);

                let startStr = "";
                let endStr = "";
                const today = new Date();

                if (filterMode === "monthly") {
                    const sm = selectedMonth;
                    const sy = selectedYear;
                    const startOfMonth = new Date(sy, sm, 1);
                    const lastDay = new Date(sy, sm + 1, 0);
                    startStr = startOfMonth.toISOString().split('T')[0];
                    endStr = lastDay.toISOString().split('T')[0];
                } else if (filterMode === "custom") {
                    startStr = customStartDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                    endStr = customEndDate || today.toISOString().split('T')[0];
                } else if (filterMode === "untilNow") {
                    startStr = employee.joinDate ? employee.joinDate.split('T')[0] : '2024-01-01';
                    endStr = today.toISOString().split('T')[0];
                }

                const [attRes, repRes] = await Promise.all([
                    api.get(`/hr/attendance?userId=${targetUserId}&startDate=${startStr}&endDate=${endStr}`),
                    api.get(`/reports?userId=${targetUserId}&startDate=${startStr}&endDate=${endStr}`)
                ]);

                if (attRes.data.success && repRes.data.success) {
                    const allAtt = attRes.data.data || [];
                    const allRep = repRes.data.reports || repRes.data.data || [];

                    const combinedMap = new Map();

                    allAtt.forEach(att => {
                        const dateKey = formatDateSafe(att.date);
                        if (!dateKey) return;
                        combinedMap.set(dateKey, {
                            date: dateKey,
                            checkIn: att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                            checkOut: att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
                            status: att.status || 'Pending',
                            isVerified: att.isVerified || false,
                            report: "No report submitted"
                        });
                    });

                    allRep.forEach(rep => {
                        const dateKey = formatDateSafe(rep.date);
                        if (!dateKey) return;
                        const existing = combinedMap.get(dateKey);
                        if (existing) {
                            combinedMap.set(dateKey, {
                                ...existing,
                                reportId: rep._id,
                                report: rep.content || rep.report || "Viewed Report",
                                reportStatus: rep.status,
                                images: rep.images || []
                            });
                        } else {
                            combinedMap.set(dateKey, {
                                date: dateKey,
                                checkIn: '--:--',
                                checkOut: null,
                                status: 'Report Only',
                                reportId: rep._id,
                                report: rep.content || rep.report || "Viewed Report",
                                reportStatus: rep.status,
                                images: rep.images || []
                            });
                        }
                    });

                    const fullRangeActivities = Array.from(combinedMap.values());
                    
                    // Calculate Range Stats
                    const stats = { workingDays: 0, present: 0, absent: 0, leave: 0, verifiedReports: 0, onTime: 0, reportCount: 0 };
                    
                    fullRangeActivities.forEach(act => {
                        const d = new Date(act.date);
                        const isSunday = d.getDay() === 0;
                        if (isSunday) return;

                        const hasReportSubmitted = act.reportId || (act.report && act.report !== "No report submitted");
                        const isVerified = String(act.reportStatus || '').toLowerCase() === 'verified' || act.isVerified;
                        const statusLower = (act.status || '').toLowerCase();

                        const isPresentStatus = [
                            'present', 'late', 'verified', 'pending', 
                            'wfh', 'work from home', 'half day', 'official duty', 'work_from_home'
                        ].includes(statusLower) || hasReportSubmitted || (act.checkIn && act.checkIn !== '--:--');

                        const isLate = statusLower === 'late';

                        if (isPresentStatus) {
                            stats.present++;
                            if (!isLate) {
                                stats.onTime++;
                            }
                        } else if (statusLower === 'absent') {
                            stats.absent++;
                        } else if (statusLower === 'leave' || statusLower === 'short leave') {
                            stats.leave++;
                        }
                        
                        if (hasReportSubmitted) {
                            stats.reportCount++;
                        }
                        
                        if (isVerified) {
                            stats.verifiedReports++;
                        }
                        
                        if (isPresentStatus || (act.checkIn && act.checkIn !== '--:--')) {
                            stats.workingDays++;
                        }
                    });

                    // Ensure present days includes days with submitted reports or check-ins
                    stats.present = Math.max(stats.present, stats.workingDays, stats.reportCount);
                    
                    // Submitted reports must not exceed actual working days present
                    stats.reportCount = Math.min(stats.reportCount, stats.present);
                    
                    // Calculate total company working days in range
                    const sDate = new Date(startStr);
                    const eDate = new Date(endStr);
                    let totalCompanyDays = 0;
                    let cur = new Date(sDate);
                    while (cur <= eDate) {
                        if (cur.getDay() !== 0) totalCompanyDays++;
                        cur.setDate(cur.getDate() + 1);
                    }
                    totalCompanyDays = Math.max(totalCompanyDays, stats.present, stats.workingDays);
                    if (totalCompanyDays === 0) totalCompanyDays = 1;

                    setMonthStats({ ...stats, totalCompanyWorkingDays: totalCompanyDays, workingDaysTodayCount: totalCompanyDays });

                    // Dynamic Performance Score Calculation
                    const attRatio = Math.min(40, (stats.present / totalCompanyDays) * 40);
                    const puncRatio = stats.present > 0 ? Math.min(30, (stats.onTime / stats.present) * 30) : 30;
                    const repRatio = stats.present > 0 ? Math.min(30, (stats.reportCount / stats.present) * 30) : 30;
                    const totalScore = Math.round((attRatio + puncRatio + repRatio) * 10) / 10;

                    setPerformanceScore(totalScore);
                    setScoreBreakdown({
                        att: Math.round(attRatio * 10) / 10,
                        punc: Math.round(puncRatio * 10) / 10,
                        rep: Math.round(repRatio * 10) / 10
                    });

                    setActivities(fullRangeActivities
                        .filter(act => new Date(act.date).getDay() !== 0)
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 10)
                    );
                }
            } catch (error) {
                console.error("Failed to fetch activity data", error);
            } finally {
                setActivityLoading(false);
                setStatsLoading(false);
            }
        };
        fetchActivity();
    }, [employee, selectedMonth, selectedYear, filterMode, customStartDate, customEndDate]);

    useEffect(() => {
        const fetchOfficialScore = async () => {
            if (!employee) return;
            const targetUserId = employee.userId?._id || employee.userId;
            if (!targetUserId) return;

            try {
                const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
                const res = await api.get(`/hr/reports/scoring?month=${monthStr}`);
                if (res.data.success) {
                    const allScores = res.data.data || [];
                    const currentEmpId = String(employee?._id || employee?.id || "");
                    const targetUserIdStr = String(targetUserId);
                    const empName = (employee?.name || "").trim().toLowerCase();
                    
                    const myScore = allScores.find(s => {
                        const sEmpId = String(s.employeeId || s.id || "");
                        return sEmpId === currentEmpId;
                    }) || allScores.find(s => {
                        return String(s.userId || "") === targetUserIdStr;
                    }) || allScores.find(s => (s.name || "").trim().toLowerCase() === empName);
                    
                    if (myScore && myScore.scores) {
                        setPerformanceScore(Math.round(myScore.scores.total));
                        setScoreBreakdown({
                            att: Math.round(myScore.scores.attendance * 10) / 10,
                            punc: Math.round(myScore.scores.punctuality * 10) / 10,
                            rep: Math.round(myScore.scores.reports * 10) / 10,
                            mls: Math.round((myScore.scores.milestones || 25) * 10) / 10,
                            bonus: myScore.bonusPercentage || myScore.scores.bonus || 0,
                            isEmployeeOfTheMonth: myScore.isEmployeeOfTheMonth,
                            isEmployeeOf6Months: myScore.isEmployeeOf6Months
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch specific official score", error);
            }
        };
        fetchOfficialScore();
    }, [employee, selectedMonth, selectedYear]);

    useEffect(() => {
        const fetchAssignedProjects = async () => {
            if (!employee) return;
            const targetUserId = employee.userId?._id || employee.userId;
            if (!targetUserId) return;

            try {
                setProjectsLoading(true);
                const [projRes, taskRes] = await Promise.all([
                    api.get('/projects'),
                    api.get('/tasks')
                ]);

                if (projRes.data.success && taskRes.data.success) {
                    const allProjects = projRes.data.data || [];
                    const allTasks = taskRes.data.tasks || taskRes.data.data || [];
                    const employeeTasks = allTasks.filter(t => (t.assignedTo?._id || t.assignedTo) === targetUserId);
                    const projectMap = new Map();
                    employeeTasks.forEach(task => {
                        const projData = task.project;
                        const projId = projData?._id || projData;
                        if (projId && !projectMap.has(projId)) {
                            const fullProj = allProjects.find(p => p._id === projId);
                            if (fullProj) {
                                projectMap.set(projId, {
                                    ...fullProj,
                                    employeeTasks: employeeTasks.filter(t => (t.project?._id || t.project) === projId)
                                });
                            }
                        }
                    });
                    const formatted = Array.from(projectMap.values()).map(p => {
                        let progress = p.progress || 0;
                        if (p.employeeTasks.length > 0) {
                            const completed = p.employeeTasks.filter(t => (t.status || '').toLowerCase() === 'completed').length;
                            progress = Math.round((completed / p.employeeTasks.length) * 100);
                        }
                        return { ...p, calculatedProgress: progress };
                    });
                    setAssignedProjects(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch assigned projects", error);
            } finally {
                setProjectsLoading(false);
            }
        };
        fetchAssignedProjects();
    }, [employee]);

    useEffect(() => {
        const fetchAchievements = async () => {
            if (!employee) return;
            const targetUserId = employee.userId?._id || employee.userId;
            if (!targetUserId) return;

            try {
                setAchievementsLoading(true);
                const res = await api.get(`/achievements?userId=${targetUserId}`);
                if (res.data.success) {
                    setAchievements(res.data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch achievements", error);
            } finally {
                setAchievementsLoading(false);
            }
        };
        fetchAchievements();
    }, [employee]);

    const handleUpdateProjectHead = async () => {
        try {
            setSaving(true);
            const res = await api.put(`/employees/${id}`, {
                projectHead: selectedProjectHead || null,
                teamLead: selectedTeamLead || null,
                role: selectedRole
            });
            if (res.data.success) {
                toast.success("Employee updated successfully");
                setEmployee({ ...employee, projectHead: selectedProjectHead, teamLead: selectedTeamLead, role: selectedRole });
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Failed to update employee", error);
            toast.error("Failed to update project head");
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: certificateRef,
    });

    if (loading) return <LoadingSpinner />;

    if (!employee) return (
        <div className="p-10 text-center space-y-4">
            <h2 className={`text-xl ${isLight ? 'text-gray-900' : 'text-white'}`}>Employee Not Found</h2>
            <button onClick={() => navigate(-1)} className="text-purple-400 hover:text-purple-300">Go Back</button>
        </div>
    );

    const cardClass = isLight ? "bg-white border-gray-200 shadow-xl" : "bg-[#1e1e2d] border-gray-700 shadow-2xl";
    const textMain = isLight ? "text-gray-900" : "text-white";
    const textSec = isLight ? "text-gray-600" : "text-gray-400";
    const textMuted = isLight ? "text-gray-500" : "text-gray-500";

    return (
        <div className="max-w-6xl mx-auto space-y-8 pt-14 md:pt-0 animate-in fade-in duration-500">
            {/* TOP MANAGEMENT CONTROLS */}
            <div className={`p-6 rounded-3xl border shadow-lg ${cardClass}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2.5 rounded-full border transition ${isLight ? 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50' : 'bg-[var(--bg-main)] border-gray-700 text-gray-300 hover:bg-gray-800'}`}
                        >
                            <FiArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className={`text-xl font-bold ${textMain}`}>Employee Management</h1>
                            <p className="text-xs text-gray-500 font-medium">Promote roles or assign managers</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex flex-col">
                            <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>Assign Project Head</label>
                            <select
                                className={`px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium min-w-[200px] ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                value={selectedProjectHead}
                                onChange={(e) => setSelectedProjectHead(e.target.value)}
                            >
                                <option value="">No Project Head Assigned</option>
                                {projectHeads.map(ph => (
                                    <option key={ph._id} value={ph._id}>{ph.name || ph.username}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>Assign Team Lead</label>
                            <select
                                className={`px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium min-w-[200px] ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                value={selectedTeamLead}
                                onChange={(e) => setSelectedTeamLead(e.target.value)}
                            >
                                <option value="">No Team Lead Assigned</option>
                                {teamLeads.map(tl => (
                                    <option key={tl._id} value={tl._id}>{tl.name || tl.username}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>Role (Promotion)</label>
                            <select
                                className={`px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium min-w-[150px] ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                <option value="employee">Employee</option>
                                <option value="teamlead">Team Lead</option>
                                <option value="hr">HR</option>
                                <option value="projecthead">Project Head</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleUpdateProjectHead}
                                disabled={saving}
                                className={`px-6 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${saving ? 'bg-gray-400' : 'bg-[#004AAE] hover:bg-[#003882] text-white shadow-blue-900/20'
                                    }`}
                            >
                                {saving ? "Saving..." : "Quick Save"}
                            </button>
                            <button
                                onClick={openEditModal}
                                className="px-6 py-2 rounded-xl font-bold transition-all bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow-lg shadow-purple-900/20 active:scale-95"
                            >
                                <FiEdit size={16} /> Edit Full Profile
                            </button>
                        </div>
                    </div>
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
                                    <img
                                        src={
                                            (employee.image && (employee.image.startsWith('data:') || employee.image.startsWith('http')))
                                                ? employee.image
                                                : (employee.profileImage && (employee.profileImage.startsWith('data:') || employee.profileImage.startsWith('http')))
                                                    ? employee.profileImage
                                                    : (employee.userId?.avatar && (employee.userId.avatar.startsWith('data:') || employee.userId.avatar.startsWith('http')))
                                                        ? employee.userId.avatar
                                                        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employee.name)}&backgroundColor=004AAE&textColor=ffffff`
                                        }
                                        alt={employee.name}
                                        className={`w-32 h-32 rounded-full object-cover ring-4 shadow-md bg-zinc-800 ${isLight ? 'ring-white' : 'ring-[#1e1e2d]'}`}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employee.name)}&backgroundColor=gray`;
                                        }}
                                    />
                                    <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 border-4 ${isLight ? 'border-white' : 'border-[#1e1e2d]'}`} title="Online"></div>
                                </div>
                            </div>

                            {/* NAME & ROLE */}
                            <div className="text-center mb-8">
                                <h2 className={`text-2xl font-bold mb-1 ${textMain}`}>{employee.name}</h2>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${isLight ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                    {employee.department || "Team Member"}
                                </span>
                            </div>

                            {/* CONTACT INFO WITH LABELS */}
                            <div className="space-y-5">
                                <ContactItem
                                    icon={<FiMail />}
                                    label="Email Address"
                                    value={employee.email}
                                    copyable
                                    isLight={isLight}
                                />
                                <ContactItem
                                    icon={<FiPhone />}
                                    label="Phone Number"
                                    value={employee.phone}
                                    isLight={isLight}
                                />
                                <ContactItem
                                    icon={<FiMapPin />}
                                    label="Location"
                                    value={employee.location}
                                    isLight={isLight}
                                />
                                <ContactItem
                                    icon={<FiLinkedin />}
                                    label="LinkedIn Profile"
                                    value={employee.linkedIn || employee.linkedin}
                                    isLink
                                    isLight={isLight}
                                />

                                <div className={`mt-6 pt-6 border-t ${isLight ? 'border-gray-100' : 'border-gray-700'} space-y-3`}>
                                    {/* Join Date */}
                                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isLight ? 'bg-green-50/50 border-green-100' : 'bg-green-500/5 border-green-500/20'}`}>
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                            <FiCalendar size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-semibold ${textMain}`}>
                                                {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set'}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-medium">Join Date</span>
                                        </div>
                                    </div>

                                    {employee && (employee.role === 'hr' || employee.role === 'projecthead') ? null : (
                                        <>
                                            {/* Project Head */}
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-1">Project Head</p>
                                            <div className={`flex items-center gap-3 p-3 rounded-xl border ${isLight ? 'bg-blue-50/50 border-blue-100' : 'bg-blue-500/5 border-blue-500/20'}`}>
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                                    <FiUser size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-semibold ${textMain}`}>
                                                        {(() => {
                                                            const ph = projectHeads.find(p => p._id === (employee?.projectHead?._id || employee?.projectHead));
                                                            return ph ? (ph.name || ph.username) : "Unassigned";
                                                        })()}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium">Assigned Manager</span>
                                                </div>
                                            </div>

                                            {/* Team Lead */}
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-1">Team Lead</p>
                                            <div className={`flex items-center gap-3 p-3 rounded-xl border ${isLight ? 'bg-purple-50/50 border-purple-100' : 'bg-purple-500/5 border-purple-500/20'}`}>
                                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                                    <FiUser size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-semibold ${textMain}`}>
                                                        {(() => {
                                                            const tl = teamLeads.find(t => t._id === (employee?.teamLead?._id || employee?.teamLead));
                                                            return tl ? (tl.name || tl.username) : "Unassigned";
                                                        })()}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium">Assigned Team Lead</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>


                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: DETAILS (Span 8) */}
                <div className="md:col-span-8 space-y-6">

                    {/* ABOUT SECTION */}
                    <div className={`p-8 rounded-3xl border shadow-lg ${cardClass}`}>
                        <SectionHeader icon={<FiUser />} title="About Me" isLight={isLight} />
                        <p className={`leading-relaxed text-lg mb-8 ${textSec}`}>
                            {employee.bio}
                        </p>

                        <div className={`border-t pt-8 ${isLight ? 'border-gray-100' : 'border-gray-700'}`}>
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Core Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(employee.skills)
                                    ? employee.skills
                                    : (typeof employee.skills === 'string' ? employee.skills.split(',') : [])
                                ).map((skill, i) => (
                                    <span key={i} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-default ${isLight ? 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' : 'bg-[var(--bg-main)] text-gray-200 border-[var(--border-color)] hover:bg-[var(--bg-main)]/80'}`}>
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* WARNING LETTERS SECTION */}
                    <div className={`p-8 rounded-3xl border shadow-lg ${cardClass} relative overflow-hidden group`}>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <SectionHeader icon={<FiFileText className="text-red-500" />} title="Warning Letters & Compliance Notices" isLight={isLight} noMargin />
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${warningLetters.length > 0 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                    {warningLetters.length > 0 ? `${warningLetters.length} Warning${warningLetters.length > 1 ? 's' : ''} Issued` : 'Good Standing'}
                                </span>
                            </div>

                            {warningLetters.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {warningLetters.map((warn, idx) => (
                                        <div 
                                            key={warn._id || idx}
                                            onClick={() => { setSelectedWarning(warn); setShowWarningModal(true); }}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md flex flex-col justify-between ${isLight ? 'bg-red-50/50 border-red-200/80 hover:bg-red-50' : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15'}`}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                                                        !
                                                    </div>
                                                    <div>
                                                        <h5 className={`text-sm font-black ${isLight ? 'text-red-900' : 'text-red-400'}`}>{warn.title || 'Warning Letter'}</h5>
                                                        <p className="text-[10px] font-bold text-red-500/80 uppercase tracking-tight">
                                                            Issued: {warn.createdAt ? formatDateSafe(warn.createdAt) : (warn.date ? formatDateSafe(warn.date) : 'N/A')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={async () => {
                                                            const isConfirmed = await confirm({
                                                                title: 'Revoke Warning Letter',
                                                                message: `Are you sure you want to revoke/withdraw this warning letter for ${employee?.name}?`,
                                                                type: 'danger',
                                                                confirmText: 'Revoke Warning',
                                                                cancelText: 'Cancel'
                                                            });
                                                            if (!isConfirmed) return;
                                                            try {
                                                                const warnId = warn._id || warn.id;
                                                                const res = await api.delete(`/hr/documents/${warnId}`);
                                                                if (res.data.success || res.status === 200) {
                                                                    setWarningLetters(prev => prev.filter(w => (w._id || w.id) !== warnId));
                                                                    toast.success("Warning letter revoked successfully");
                                                                }
                                                            } catch (err) {
                                                                console.error("Failed to revoke warning", err);
                                                                toast.error("Failed to revoke warning");
                                                            }
                                                        }}
                                                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                                                        title="Revoke Warning Letter"
                                                    >
                                                        <FiTrash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className={`text-xs line-clamp-2 mt-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                                                {warn.content || warn.description || warn.details || "Click to inspect warning documentation."}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`p-4 rounded-2xl border ${isLight ? 'bg-green-50/50 border-green-100' : 'bg-green-500/5 border-green-500/10'} flex items-center gap-3`}>
                                    <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center font-bold text-lg shrink-0">
                                        ✓
                                    </div>
                                    <div>
                                        <h5 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-green-800' : 'text-green-400'}`}>Clean Record</h5>
                                        <p className={`text-[10px] font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>No disciplinary warnings or compliance notices have been issued to this employee.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PERFORMANCE SCORE & FLEXIBLE DATE RANGE SUMMARY SECTION */}
                    <div className={`p-8 rounded-3xl border shadow-lg ${cardClass} relative overflow-hidden group`}>
                        <div className="relative z-10 space-y-6">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
                                <SectionHeader icon={<FiActivity className="text-[#004AAE]" />} title="System Performance Score" isLight={isLight} noMargin />
                                
                                {/* Performance Filter Mode Tabs & Controls */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className={`flex p-1 rounded-2xl border ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-[#151235] border-[#312e81]'}`}>
                                        <button
                                            onClick={() => setFilterMode("monthly")}
                                            className={`px-3 py-1 rounded-xl text-xs font-black uppercase transition-all ${filterMode === 'monthly' ? 'bg-[#004AAE] text-white shadow-md' : `${textSec} hover:text-white`}`}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            onClick={() => setFilterMode("custom")}
                                            className={`px-3 py-1 rounded-xl text-xs font-black uppercase transition-all ${filterMode === 'custom' ? 'bg-[#004AAE] text-white shadow-md' : `${textSec} hover:text-white`}`}
                                        >
                                            Custom Range
                                        </button>
                                        <button
                                            onClick={() => setFilterMode("untilNow")}
                                            className={`px-3 py-1 rounded-xl text-xs font-black uppercase transition-all ${filterMode === 'untilNow' ? 'bg-[#004AAE] text-white shadow-md' : `${textSec} hover:text-white`}`}
                                        >
                                            Performance Until Now
                                        </button>
                                    </div>

                                    {/* Monthly Mode Controls */}
                                    {filterMode === "monthly" && (
                                        <div className="flex gap-2">
                                            <select 
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                                className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                            >
                                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                                                    <option key={i} value={i}>{m}</option>
                                                ))}
                                            </select>
                                            <select 
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                            >
                                                {[2024, 2025, 2026, 2027].map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Custom Range Controls */}
                                    {filterMode === "custom" && (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className={`px-2.5 py-1 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                            />
                                            <span className="text-xs font-black text-gray-400">TO</span>
                                            <input 
                                                type="date"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className={`px-2.5 py-1 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                            />
                                        </div>
                                    )}

                                    {/* Until Now Badge */}
                                    {filterMode === "untilNow" && (
                                        <div className="px-3 py-1.5 bg-[#004AAE]/10 border border-[#004AAE]/30 text-[#004AAE] rounded-xl text-xs font-black uppercase tracking-wider">
                                            Joined: {employee.joinDate ? formatDateSafe(employee.joinDate) : "Start"} → Today
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mt-4">
                                {/* Score Circle */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className={`${isLight ? 'text-gray-100' : 'text-gray-800'}`} />
                                            <motion.circle 
                                                cx="64" cy="64" r="58" stroke="#004AAE" strokeWidth="8" fill="transparent" strokeDasharray={364.4}
                                                initial={{ strokeDashoffset: 364.4 }}
                                                animate={{ strokeDashoffset: 364.4 - (364.4 * performanceScore) / 100 }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className={`text-3xl font-black ${textMain}`}>{performanceScore}%</span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${textSec} opacity-50`}>Total Score</span>
                                        </div>
                                    </div>
                                    <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${performanceScore >= 90 ? 'bg-green-500/10 text-green-500' : performanceScore >= 75 ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        {performanceScore >= 90 ? 'Elite Performance' : performanceScore >= 75 ? 'Core Performer' : 'Ongoing growth'}
                                    </div>
                                </div>

                                {/* Score Breakdown */}
                                <div className="md:col-span-2 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <ScoreBar label="Attendance (A:25)" score={scoreBreakdown.att} total={25} color="bg-green-500" isLight={isLight} />
                                        <ScoreBar label="Punctuality (P:25)" score={scoreBreakdown.punc} total={25} color="bg-blue-500" isLight={isLight} />
                                        <ScoreBar label="Daily Reports (R:25)" score={scoreBreakdown.rep} total={25} color="bg-purple-500" isLight={isLight} />
                                        <ScoreBar label="Milestones / Tasks (M:25)" score={scoreBreakdown.mls} total={25} color="bg-amber-500" isLight={isLight} />
                                    </div>
                                    {scoreBreakdown.bonus > 0 && (
                                        <div>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-400 border border-amber-400/40 animate-pulse">
                                                +{scoreBreakdown.bonus}% Leaderboard Achievement Bonus Included
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Integrated Performance Summary */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                                <p className="text-xs font-black uppercase text-[#004AAE] tracking-widest flex items-center gap-2">
                                    <FiActivity size={14} /> {filterMode === 'monthly' ? 'Monthly' : filterMode === 'custom' ? 'Custom Range' : 'Lifetime'} Performance Summary
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className={`p-4 rounded-2xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-[var(--bg-main)]/30 border-gray-700/50'} flex flex-col items-center justify-center text-center`}>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-2xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>{monthStats.present || monthStats.workingDays}</span>
                                            <span className="text-xs text-gray-400">/ {monthStats.totalCompanyWorkingDays}</span>
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 leading-tight">Total Working Days</span>
                                    </div>
                                    <StatBox label="Submitted Reports" value={monthStats.reportCount || 0} color="text-blue-500" bg="bg-blue-500/10" isLight={isLight} />
                                    <StatBox label="Punctuality Precision" value={monthStats.onTime || 0} color="text-emerald-500" bg="bg-emerald-500/10" isLight={isLight} />
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                                <p className={`text-[10px] font-medium leading-relaxed ${textSec} opacity-60 italic uppercase tracking-tighter`}>
                                    * {filterMode === 'monthly' ? `Synchronized with ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} ${selectedYear} records.` : filterMode === 'custom' ? `Synchronized with custom range ${customStartDate} to ${customEndDate}.` : `Synchronized with joined date (${employee.joinDate ? formatDateSafe(employee.joinDate) : 'start'}) to present.`}
                                </p>
                                <div className="bg-[#004AAE]/10 px-3 py-1 rounded-lg">
                                    <span className="text-[10px] font-black text-[#004AAE] uppercase tracking-widest">Efficiency: {performanceScore}%</span>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#004AAE]/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-[#004AAE]/10 transition-all duration-700"></div>
                    </div>

                    {/* EXPERIENCE SECTION */}
                    <div className={`p-8 rounded-3xl border shadow-lg ${cardClass}`}>
                        <SectionHeader icon={<FiBriefcase />} title="Professional Experience" isLight={isLight} />

                        <div className={`flex items-start gap-5 p-5 rounded-2xl border transition-colors group ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-[var(--bg-main)]/50 border-[var(--border-color)] hover:border-purple-500/30'}`}>
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-500 group-hover:text-purple-600 transition-all">
                                <FiAward size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className={`text-xl font-bold mb-1 ${textMain}`}>{employee.jobTitle || employee.position}</h3>
                                        <p className={`mb-2 ${textSec}`}>{calculateTenure(employee.joinDate)}</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowCertificate(true)}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
                                    >
                                        <FiAward /> Certificate
                                    </button>
                                </div>
                                <p className={`text-sm ${textSec}`}>
                                    Responsible for leading development initiatives, mentoring junior developers, and ensuring code quality across all projects.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ASSIGNED PROJECTS SECTION */}
                    <div className={`p-8 rounded-3xl border shadow-lg ${cardClass}`}>
                        <SectionHeader icon={<FiBriefcase />} title="Assigned Projects" isLight={isLight} />
                        
                        {projectsLoading ? (
                            <div className="py-10 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                            </div>
                        ) : assignedProjects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {assignedProjects.map((project, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => navigate(`/admin/project/${project._id}`)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-[var(--bg-main)]/50 border-[var(--border-color)]'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className={`font-bold text-sm truncate pr-2 ${textMain}`}>{project.title}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                                                project.status === 'completed' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                                            }`}>
                                                {project.status || 'Active'}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-gray-500 italic font-medium">
                                                {project.employeeTasks.length} task(s) assigned
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No direct project assignments found.</p>
                        )}
                    </div>

                    {/* ACHIEVEMENTS SECTION */}
                    <div className={`p-8 rounded-3xl border shadow-lg ${cardClass}`}>
                        <SectionHeader icon={<FiAward className="text-yellow-500" />} title="Employee Achievements" isLight={isLight} />
                        
                        {achievementsLoading ? (
                            <div className="py-10 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-500 border-t-transparent"></div>
                            </div>
                        ) : achievements.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {achievements.map((ach, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] relative overflow-hidden group ${isLight ? 'bg-yellow-50/30 border-yellow-100' : 'bg-yellow-500/5 border-yellow-500/10'}`}
                                    >
                                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-yellow-400/10 rounded-full blur-xl group-hover:bg-yellow-400/20 transition-all"></div>
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <h4 className={`font-bold text-base ${textMain}`}>{ach.title}</h4>
                                            <FiAward className="text-yellow-500 shrink-0" size={20} />
                                        </div>
                                        <p className={`text-xs mb-3 line-clamp-2 ${textSec}`}>{ach.description}</p>
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500 relative z-10">
                                            <span>{ach.awardType}</span>
                                            <span>{new Date(ach.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No achievements recorded yet.</p>
                        )}
                    </div>

                    {/* ACTIVITY TIMELINE SECTION */}
                    <div className={`p-8 rounded-3xl border shadow-lg ${cardClass}`}>
                        <div className="flex justify-between items-center mb-6">
                            <SectionHeader icon={<FiClock />} title="Recent Activity" isLight={isLight} />
                            {activities.length > 1 && (
                                <button 
                                    onClick={() => navigate(`/admin/activity?userId=${employee.userId?._id || employee.userId}`)}
                                    className="flex items-center gap-2 text-xs font-bold text-[#004AAE] hover:underline bg-[#004AAE]/5 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    View More <FiArrowRight />
                                </button>
                            )}
                        </div>
                        
                        {activityLoading ? (
                            <div className="py-20 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#004AAE] border-t-transparent"></div>
                            </div>
                        ) : activities.length > 0 ? (
                            <div className="relative pl-8 border-l-2 border-[#004AAE]/30 space-y-10 py-2">
                                {activities.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="relative">
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full border-4 ${isLight ? 'border-white bg-[#004AAE]' : 'border-[#1e1e2d] bg-[#004AAE]'} shadow-md z-10`}></div>

                                        {/* Date Header */}
                                        <div className="mb-4">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isLight ? 'bg-blue-50 text-[#004AAE]' : 'bg-blue-900/20 text-blue-400'}`}>
                                                {new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Attendance Info */}
                                            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-[var(--bg-main)]/30 border-[var(--border-color)]'}`}>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2 flex items-center gap-1">
                                                    <FiCalendar /> Attendance
                                                </h4>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 uppercase font-bold">In Time</p>
                                                        <p className={`text-sm font-bold ${textMain}`}>{item.checkIn}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] text-gray-500 uppercase font-bold">Out Time</p>
                                                        <p className={`text-sm font-bold ${textMain}`}>{item.checkOut || '--:--'}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded 
                                                        ${item.status === 'Absent' ? 'bg-red-100 text-red-700' : 
                                                          item.status === 'Leave' ? 'bg-orange-100 text-orange-700' : 
                                                          item.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {(() => {
                                                            if (item.status === 'Absent') return 'Absent';
                                                            if (item.status === 'Leave') return 'Leave';
                                                            return `${item.isVerified ? 'Verified' : 'Pending'} (${item.status})`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Daily Report Info */}
                                            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-[var(--bg-main)]/30 border-[var(--border-color)]'}`}>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 flex items-center gap-1">
                                                    <FiFileText /> Daily Report
                                                </h4>
                                                {item.report && item.report !== 'No report submitted' ? (
                                                    <>
                                                        <p className={`text-xs leading-relaxed mb-3 ${textMain}`}>{item.report}</p>
                                                        {item.images && item.images.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {item.images.map((img, i) => {
                                                                    const isPdf = img.toLowerCase().endsWith('.pdf') || img.startsWith('data:application/pdf');
                                                                    return (
                                                                        <div 
                                                                            key={i} 
                                                                            onClick={() => {
                                                                                if (isPdf) {
                                                                                    window.open(img, '_blank');
                                                                                } else {
                                                                                    setPreviewFile(img);
                                                                                    setShowPreview(true);
                                                                                }
                                                                            }}
                                                                            className="relative cursor-pointer group"
                                                                        >
                                                                            {isPdf ? (
                                                                                <div className="w-10 h-10 rounded border border-red-200 bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                                                                                    <FiFileText size={20} />
                                                                                    <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded font-bold">PDF</span>
                                                                                </div>
                                                                            ) : (
                                                                                <img 
                                                                                    src={img} 
                                                                                    alt="attachment" 
                                                                                    className="w-10 h-10 rounded border border-gray-200 object-cover group-hover:opacity-80 transition-opacity" 
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.reportStatus?.toLowerCase() === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                Report: {item.reportStatus || 'Pending'}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-xs text-gray-400 italic">No report submitted.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <p className="text-gray-500 italic">No activity history found for this employee.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPreview(false)}
                        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
                        >
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                            >
                                <FiArrowLeft className="rotate-90 inline mr-1" /> Close
                            </button>
                            <img 
                                src={previewFile} 
                                alt="Preview" 
                                className="max-w-full max-h-[80vh] rounded-xl shadow-2xl border border-white/10 object-contain"
                            />
                            <div className="mt-4 flex gap-4">
                                <a 
                                    href={previewFile} 
                                    download 
                                    className="bg-[#004AAE] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#003882] transition-all"
                                >
                                    Download Image
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showCertificate && (
                    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-2 md:p-6 overflow-hidden">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.9 }} 
                            className="bg-white dark:bg-[#1e1e2d] rounded-[2rem] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-3xl overflow-hidden relative border border-gray-200 dark:border-gray-700 my-auto"
                        >
                            <div className="p-4 border-b flex flex-wrap justify-between items-center bg-gray-50 dark:bg-gray-800 gap-2 shrink-0">
                                <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                                    <FiAward className="text-[#004AAE]" /> Experience Certificate Preview
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setShowCertEditor(!showCertEditor)}
                                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${showCertEditor ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300'}`}
                                    >
                                        <FiEdit size={14} /> {showCertEditor ? "Close Editor" : "Edit Text Content"}
                                    </button>
                                    <button 
                                        onClick={() => handlePrint()}
                                        className="px-6 py-2 bg-[#004AAE] text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-[#003882] transition-all shadow-md active:scale-95"
                                    >
                                        <FiPrinter size={14} /> Print / Save PDF
                                    </button>
                                    <button 
                                        onClick={() => setShowCertificate(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-all"
                                    >
                                        <FiActivity className="rotate-45" size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* COLLAPSIBLE CERTIFICATE TEXT EDITOR */}
                            {showCertEditor && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="p-4 md:p-6 bg-slate-50 dark:bg-[#151235] border-b border-gray-200 dark:border-gray-700 space-y-3 max-h-[300px] overflow-y-auto shrink-0"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="text-xs font-bold text-[#004AAE] dark:text-purple-400 uppercase tracking-wider">Customize Certificate Text & Signatures</h4>
                                        <button 
                                            onClick={resetCertDefaults}
                                            className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center gap-1 font-semibold underline"
                                        >
                                            <FiRotateCcw size={12} /> Reset to Defaults
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                                        <div>
                                            <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">Certificate Header Title</label>
                                            <input 
                                                type="text" 
                                                value={certData.title}
                                                onChange={(e) => setCertData({ ...certData, title: e.target.value })}
                                                className="w-full px-3 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">Employee Name</label>
                                            <input 
                                                type="text" 
                                                value={certData.name}
                                                onChange={(e) => setCertData({ ...certData, name: e.target.value })}
                                                className="w-full px-3 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">Designation / Role</label>
                                            <input 
                                                type="text" 
                                                value={certData.position}
                                                onChange={(e) => {
                                                    const pos = e.target.value;
                                                    setCertData({ 
                                                        ...certData, 
                                                        position: pos,
                                                        bodyText: `has successfully completed their tenure as a ${pos} at ${certData.company}. During their period of employment from ${certData.startDate} to ${certData.endDate}, we found them to be extremely hard-working, professional, and a valuable asset to our organization.`
                                                    });
                                                }}
                                                className="w-full px-3 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">Company Name</label>
                                            <input 
                                                type="text" 
                                                value={certData.company}
                                                onChange={(e) => setCertData({ ...certData, company: e.target.value })}
                                                className="w-full px-3 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">Start Date Text</label>
                                            <input 
                                                type="text" 
                                                value={certData.startDate}
                                                onChange={(e) => setCertData({ ...certData, startDate: e.target.value })}
                                                className="w-full px-3 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">End Date Text</label>
                                            <input 
                                                type="text" 
                                                value={certData.endDate}
                                                onChange={(e) => setCertData({ ...certData, endDate: e.target.value })}
                                                className="w-full px-3 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">CEO Name</label>
                                            <input 
                                                type="text" 
                                                value={certData.ceoName}
                                                onChange={(e) => setCertData({ ...certData, ceoName: e.target.value })}
                                                className="w-full px-3 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">HR Director Name</label>
                                            <input 
                                                type="text" 
                                                value={certData.hrName}
                                                onChange={(e) => setCertData({ ...certData, hrName: e.target.value })}
                                                className="w-full px-3 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">CEO Designation & Org</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={certData.ceoTitle}
                                                    onChange={(e) => setCertData({ ...certData, ceoTitle: e.target.value })}
                                                    className="w-1/2 px-2 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={certData.ceoSubtitle}
                                                    onChange={(e) => setCertData({ ...certData, ceoSubtitle: e.target.value })}
                                                    className="w-1/2 px-2 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 dark:text-gray-400 font-bold mb-1">HR Designation & Org</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={certData.hrTitle}
                                                    onChange={(e) => setCertData({ ...certData, hrTitle: e.target.value })}
                                                    className="w-1/2 px-2 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={certData.hrSubtitle}
                                                    onChange={(e) => setCertData({ ...certData, hrSubtitle: e.target.value })}
                                                    className="w-1/2 px-2 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-600 dark:text-gray-400 font-bold text-xs mb-1">Paragraph Narrative Text</label>
                                        <textarea 
                                            rows={2}
                                            value={certData.bodyText}
                                            onChange={(e) => setCertData({ ...certData, bodyText: e.target.value })}
                                            className="w-full px-3 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            <style>{`
                              @import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;700;800&display=swap');
                              .font-cert-cursive {
                                  font-family: 'Pinyon Script', cursive;
                              }
                              .font-cert-serif {
                                  font-family: 'Cinzel', serif;
                              }
                              .font-cert-sans {
                                  font-family: 'Montserrat', sans-serif;
                              }
                              @media print {
                                  body {
                                      -webkit-print-color-adjust: exact !important;
                                      print-color-adjust: exact !important;
                                  }
                                  @page {
                                      size: A4 landscape;
                                      margin: 0;
                                  }
                                  .print-cert-container {
                                      width: 297mm !important;
                                      height: 210mm !important;
                                      border: none !important;
                                      margin: 0 !important;
                                      box-shadow: none !important;
                                      transform: none !important;
                                      background-color: #fdfdfd !important;
                                  }
                              }
                            `}</style>

                            <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-100 dark:bg-gray-900 flex justify-center">
                                <div 
                                    ref={certificateRef} 
                                    className="print-cert-container w-[1123px] h-[794px] shadow-2xl relative p-12 flex flex-col items-center justify-between text-center select-none overflow-hidden border border-gray-200"
                                    style={{
                                        backgroundImage: "url('/certificate.png')",
                                        backgroundSize: '100% 100%',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundColor: '#fdfdfd'
                                    }}
                                >
                                    {/* Background Watermark Logo */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                        <img 
                                            src="/logo-light.png" 
                                            alt="Watermark Logo" 
                                            className="w-[480px] h-auto object-contain opacity-[0.08] select-none" 
                                        />
                                    </div>

                                    {/* Content Container */}
                                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-6 px-10">
                                        {/* Header */}
                                        <div className="flex flex-col items-center mt-3 w-full">
                                            <h2 className="font-cert-serif text-5xl text-[#004AAE] font-bold tracking-[0.2em] leading-none uppercase">{certData.title ? certData.title.split(' ')[0] : "Certificate"}</h2>
                                            
                                            <div className="flex items-center gap-4 w-full max-w-xl justify-center mt-3">
                                                <div className="h-[1.5px] bg-[#004AAE] flex-grow"></div>
                                                <h3 className="font-cert-sans text-sm text-slate-800 font-extrabold tracking-[0.35em] uppercase whitespace-nowrap">
                                                    {certData.title && certData.title.split(' ').slice(1).join(' ') ? certData.title.split(' ').slice(1).join(' ') : "OF EXPERIENCE"}
                                                </h3>
                                                <div className="h-[1.5px] bg-[#004AAE] flex-grow"></div>
                                            </div>
                                            
                                            <div className="w-2.5 h-2.5 bg-[#004AAE] transform rotate-45 mt-3.5"></div>
                                        </div>

                                        {/* Certification Statement */}
                                        <div className="flex flex-col items-center my-1 w-full">
                                            <p className="text-slate-500 font-serif text-lg italic tracking-wide mt-1">{certData.certifyText || "This is to certify that"}</p>
                                            <h1 className="font-cert-cursive text-7xl text-[#004AAE] font-normal my-0.5 tracking-normal leading-normal whitespace-nowrap">
                                                {certData.name || employee.name}
                                            </h1>
                                            <div className="w-2 h-2 bg-[#004AAE] transform rotate-45 my-2"></div>
                                        </div>

                                        {/* Body Text */}
                                        <p className="font-cert-sans text-sm text-slate-600 leading-relaxed max-w-[850px] mx-auto">
                                            {certData.bodyText}
                                        </p>

                                        {/* Signatures & Large Transparent Stamp */}
                                        <div className="grid grid-cols-3 items-start w-full mt-8 px-6">
                                            {/* Left Signature - CEO */}
                                            <div className="flex flex-col items-center min-w-[200px]">
                                                <div className="w-44 h-[2px] bg-slate-800 relative">
                                                    <div className="absolute right-0 -top-[1.5px] w-6 h-[5px] bg-[#004AAE] transform -skew-x-[30deg]"></div>
                                                </div>
                                                <p className="font-cert-sans font-bold text-xs text-[#004AAE] tracking-widest uppercase mt-2">{certData.ceoTitle || "CEO"}</p>
                                                <p className="font-cert-sans text-[11px] text-slate-800 font-extrabold uppercase mt-0.5">{certData.ceoName || "MUHAMMAD HAMZA ALI"}</p>
                                                <p className="font-cert-sans text-[10px] text-gray-400 italic mt-0.5">{certData.ceoSubtitle || "HAT TECH MEDIA (PVT LTD)"}</p>
                                            </div>

                                            {/* Center Official Stamp (Midpoint Aligned with Signature Lines) */}
                                            <div className="flex justify-center items-center -mt-16">
                                                <img src="/official-stamp.png" alt="Official Seal" className="h-36 w-36 object-contain drop-shadow-md -rotate-6" />
                                            </div>

                                            {/* Right Signature - HR Director */}
                                            <div className="flex flex-col items-center min-w-[200px]">
                                                <div className="w-44 h-[2px] bg-slate-800 relative">
                                                    <div className="absolute left-0 -top-[1.5px] w-6 h-[5px] bg-[#004AAE] transform -skew-x-[30deg]"></div>
                                                </div>
                                                <p className="font-cert-sans font-bold text-xs text-[#004AAE] tracking-widest uppercase mt-2">{certData.hrTitle || "HR DIRECTOR"}</p>
                                                <p className="font-cert-sans text-[11px] text-slate-800 font-extrabold uppercase mt-0.5">{certData.hrName || "RAMSHA HAMZA"}</p>
                                                <p className="font-cert-sans text-[10px] text-gray-400 italic mt-0.5">{certData.hrSubtitle || "HAT TECH MEDIA (PVT LTD)"}</p>
                                            </div>
                                        </div>

                                        {/* Footer Website & Copyright */}
                                        <div className="font-cert-sans text-[9px] text-slate-400 tracking-wider mt-4">
                                            <p>{certData.footerLine1 || "www.hattechmedia.com | contact@hattechmedia.com"}</p>
                                            <p>{certData.footerLine2 || `© ${new Date().getFullYear()} Hat Tech Media. All Rights Reserved.`}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ADMIN FULL EMPLOYEE EDIT MODAL */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`w-full max-w-2xl rounded-3xl p-6 shadow-2xl overflow-hidden relative border ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#1e1e2d] border-gray-700 text-white'}`}
                        >
                            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <FiEdit className="text-purple-500" /> Edit Employee Details
                                    </h3>
                                    <p className="text-xs text-gray-500">Update personal, organizational, and role parameters for {employee.name}</p>
                                </div>
                                <button 
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEmployeeEdit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">Full Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">Email Address</label>
                                        <input 
                                            type="email" 
                                            required
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">Phone Number</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">Department</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={editForm.department}
                                            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">Designation / Position</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={editForm.position}
                                            onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                                            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">Joining Date</label>
                                        <input 
                                            type="date" 
                                            value={editForm.joinDate}
                                            onChange={(e) => setEditForm({ ...editForm, joinDate: e.target.value })}
                                            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">System Role</label>
                                        <select
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="teamlead">Team Lead</option>
                                            <option value="hr">HR</option>
                                            <option value="projecthead">Project Head</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">Assign Project Head</label>
                                        <select
                                            value={editForm.projectHead}
                                            onChange={(e) => setEditForm({ ...editForm, projectHead: e.target.value })}
                                            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                        >
                                            <option value="">No Project Head Assigned</option>
                                            {projectHeads.map(ph => (
                                                <option key={ph._id} value={ph._id}>{ph.name || ph.username}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">Assign Team Lead</label>
                                        <select
                                            value={editForm.teamLead}
                                            onChange={(e) => setEditForm({ ...editForm, teamLead: e.target.value })}
                                            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'}`}
                                        >
                                            <option value="">No Team Lead Assigned</option>
                                            {teamLeads.map(tl => (
                                                <option key={tl._id} value={tl._id}>{tl.name || tl.username}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button 
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-2 shadow-lg active:scale-95"
                                    >
                                        <FiSave size={14} /> {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            {/* WARNING DETAILS MODAL */}
            <AnimatePresence>
                {showWarningModal && selectedWarning && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowWarningModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-5 relative ${isLight ? 'bg-white border-red-200' : 'bg-[#151235] border-red-500/30'}`}
                        >
                            <div className="flex items-start justify-between border-b border-red-500/20 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center font-black text-lg shadow-lg">
                                        !
                                    </div>
                                    <div>
                                        <h3 className={`text-base font-black ${isLight ? 'text-red-900' : 'text-red-400'}`}>
                                            {selectedWarning.title || 'Official Warning Letter'}
                                        </h3>
                                        <p className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest">
                                            Issued: {selectedWarning.createdAt ? formatDateSafe(selectedWarning.createdAt) : (selectedWarning.date ? formatDateSafe(selectedWarning.date) : 'N/A')}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowWarningModal(false)}
                                    className={`p-2 rounded-xl transition-all ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                                >
                                    <FiX size={18} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-red-500/80 block mb-1">Target Employee</label>
                                    <p className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{employee?.name || "Employee"}</p>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-red-500/80 block mb-1">Notice Description & Details</label>
                                    <div className={`p-4 rounded-2xl border text-xs leading-relaxed font-medium whitespace-pre-wrap ${isLight ? 'bg-red-50/40 border-red-100 text-gray-800' : 'bg-red-500/5 border-red-500/10 text-gray-200'}`}>
                                        {selectedWarning.content || selectedWarning.description || selectedWarning.details || "No detailed description provided."}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const isConfirmed = await confirm({
                                                title: 'Revoke Warning Letter',
                                                message: `Are you sure you want to revoke/withdraw this warning letter for ${employee?.name}?`,
                                                type: 'danger',
                                                confirmText: 'Revoke Warning',
                                                cancelText: 'Cancel'
                                            });

                                            if (!isConfirmed) return;

                                            try {
                                                const warnId = selectedWarning._id || selectedWarning.id;
                                                const res = await api.delete(`/hr/documents/${warnId}`);
                                                if (res.data.success || res.status === 200) {
                                                    setWarningLetters(prev => prev.filter(w => (w._id || w.id) !== warnId));
                                                    setShowWarningModal(false);
                                                    toast.success("Warning letter revoked successfully");
                                                }
                                            } catch (err) {
                                                console.error("Failed to revoke warning", err);
                                                toast.error("Failed to revoke warning");
                                            }
                                        }}
                                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                                    >
                                        <FiTrash2 size={14} /> Revoke Warning
                                    </button>
                                    <button
                                        onClick={() => setShowWarningModal(false)}
                                        className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gray-500 hover:bg-gray-600 text-white transition active:scale-95 cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            </AnimatePresence>
        </div>
    );
}

function ScoreBar({ label, score, total, color, isLight }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
                <span className={`text-xs font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>{score} <span className="opacity-40 text-[10px]">/ {total} pts</span></span>
            </div>
            <div className={`h-2 w-full rounded-full ${isLight ? 'bg-gray-100' : 'bg-gray-800'} overflow-hidden shadow-inner`}>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(score / total) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color} shadow-lg`}
                />
            </div>
        </div>
    );
}

// Helper Components for Clarity

function ContactItem({ icon, label, value, copyable, isLink, isLight }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-4 group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isLight ? 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600' : 'bg-[var(--bg-main)] text-gray-400 group-hover:text-purple-400 group-hover:bg-purple-400/10'}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                {isLink ? (
                    <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" className={`text-sm font-medium truncate transition cursor-pointer block ${isLight ? 'text-gray-800 hover:text-purple-600' : 'text-gray-200 hover:text-purple-400'}`}>{value}</a>
                ) : (
                    <p className={`text-sm font-medium truncate select-all ${isLight ? 'text-gray-800' : 'text-gray-200'}`}>{value}</p>
                )}
            </div>
        </div>
    );
}

function SectionHeader({ icon, title, isLight, noMargin }) {
    return (
        <div className={`flex items-center gap-3 ${noMargin ? '' : 'mb-6'}`}>
            <div className={`p-2 rounded-xl ${isLight ? 'bg-gray-100 text-[#004AAE]' : 'bg-[#004AAE]/10 text-[#004AAE]'}`}>
                {icon}
            </div>
            <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isLight ? 'text-gray-900' : 'text-white'}`}>{title}</h3>
        </div>
    );
}

function StatBox({ label, value, color, bg, isLight }) {
    return (
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-[var(--bg-main)]/30 border-gray-700/50'} flex flex-col items-center justify-center text-center`}>
            <span className={`text-2xl font-black mb-1 ${color}`}>{value}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 leading-tight">{label}</span>
        </div>
    );
}
