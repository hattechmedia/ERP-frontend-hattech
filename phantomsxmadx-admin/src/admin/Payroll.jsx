import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { FiDollarSign, FiDownload, FiCheckCircle, FiSave, FiSearch, FiPrinter, FiUser, FiCreditCard, FiFileText, FiClock, FiTrash2, FiCopy } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";

export default function Payroll() {
    useEffect(() => {
        // IT Support should have access to Payroll
    }, []);

    const { confirm } = useModal();
    const [activeTab, setActiveTab] = useState("accounts"); // 'accounts', 'salary', 'completed'
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Data States
    const [employees, setEmployees] = useState([]);
    const [payrolls, setPayrolls] = useState([]);

    // Settings / Edit States
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeeSettings, setEmployeeSettings] = useState({ salary: 0, bankName: "", accountNumber: "", accountHolder: "" });

    const [manageModal, setManageModal] = useState({ show: false, record: null });
    const [manageValues, setManageValues] = useState({
        bonus: 0, bonusDate: "",
        deductions: 0, deductionDate: "",
        otherDeductions: 0,
        status: "Pending", paidAmount: 0
    });
    const [isSaving, setIsSaving] = useState(false);

    const hasGeneratedRef = useRef(false);

    // --- DATA FETCHING ---
    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [empRes, pyRes] = await Promise.all([
                api.get('/employees'),
                api.get(`/hr/payroll?month=${month}`)
            ]);

            const allEmps = empRes.data.employees || empRes.data.data || [];
            const cleanEmps = allEmps.filter(e => {
                const role = (e.role || e.userId?.role || "").toLowerCase();
                const dept = (e.department || "").toLowerCase();
                return role !== 'it_support' && !dept.includes('it support') && !dept.includes('it-support') && e.status !== 'inactive';
            });
            setEmployees(cleanEmps);

            if (pyRes.data.success) {
                const sorted = (pyRes.data.data || [])
                    .filter(p => {
                        if (!p.employee) return false;
                        if (p.employee.status === 'inactive') return false;
                        const role = (p.employee.role || p.employee.userId?.role || "").toLowerCase();
                        const dept = (p.employee.department || "").toLowerCase();
                        return role !== 'it_support' && !dept.includes('it support') && !dept.includes('it-support');
                    })
                    .sort((a, b) => (a.employee?.name || "").localeCompare(b.employee?.name || ""));

                if (sorted.length === 0 && cleanEmps.length > 0 && !hasGeneratedRef.current) {
                    hasGeneratedRef.current = true;
                    console.log("No payroll records found, generating automatically...");
                    await api.post('/hr/payroll', { month });
                    const newPyRes = await api.get(`/hr/payroll?month=${month}`);
                    if (newPyRes.data.success) {
                        const newSorted = (newPyRes.data.data || [])
                            .filter(p => {
                                if (!p.employee) return false;
                                if (p.employee.status === 'inactive') return false;
                                const role = (p.employee.role || p.employee.userId?.role || "").toLowerCase();
                                const dept = (p.employee.department || "").toLowerCase();
                                return role !== 'it_support' && !dept.includes('it support') && !dept.includes('it-support');
                            })
                            .sort((a, b) => (a.employee?.name || "").localeCompare(b.employee?.name || ""));
                        setPayrolls(newSorted);
                    }
                } else {
                    setPayrolls(sorted);
                }
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        hasGeneratedRef.current = false;
        fetchData();
    }, [month]);

    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const handleOpenSettings = (emp) => {
        setSelectedEmployee(emp);
        setEmployeeSettings({
            salary: emp.salary || 0,
            bankName: emp.bankDetails?.bankName || "",
            accountNumber: emp.bankDetails?.accountNumber || "",
            accountHolder: emp.bankDetails?.accountHolder || ""
        });
        setShowSettingsModal(true);
    };

    const handleSaveSettings = async () => {
        if (!selectedEmployee) return;
        setIsSavingSettings(true);
        try {
            const newSal = Number(employeeSettings.salary);
            const payload = {
                salary: newSal,
                bankDetails: {
                    bankName: employeeSettings.bankName,
                    accountNumber: employeeSettings.accountNumber,
                    accountHolder: employeeSettings.accountHolder
                }
            };
            const res = await api.put(`/employees/${selectedEmployee._id}`, payload);
            if (res.data.success) {
                toast.success("Settings saved successfully!");
                setShowSettingsModal(false);

                // Optimistically update local employee and payroll state for instant UI update
                setEmployees(prev => (prev || []).map(emp => emp._id === selectedEmployee._id ? { ...emp, salary: newSal, bankDetails: payload.bankDetails } : emp));
                setPayrolls(prev => (prev || []).map(item => (item.employee?._id === selectedEmployee._id || item.employee === selectedEmployee._id) ? { ...item, basicSalary: newSal } : item));

                // Silent background sync without triggering page re-render
                api.post('/hr/payroll', { month }).catch(() => {});
            }
        } catch (err) { 
            toast.error("Failed to save settings: " + (err.response?.data?.message || err.message)); 
        } finally {
            setIsSavingSettings(false);
        }
    };

    // --- HANDLERS (Salary) ---
    const handleGenerate = async () => {
        const isConfirmed = await confirm({
            title: 'Generate Payroll',
            message: `Are you sure you want to generate payroll for ${month}? This will sync all employee salaries and bank details for this period.`,
            type: 'primary',
            confirmText: 'Generate Now',
            cancelText: 'Cancel'
        });
        if (!isConfirmed) return;
        try {
            const res = await api.post('/hr/payroll', { month });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchData();
            }
        } catch (err) { toast.error("Generation failed: " + (err.response?.data?.message || err.message)); }
    };

    const handleOpenManage = (record) => {
        const baseSal = record.basicSalary || record.employee?.salary || 0;
        const absDays = record.absentDays || 0;
        const absDeduct = Math.round(absDays * (baseSal / 30));
        const missingRep = record.missingReports || 0;
        const missingRepDeduct = record.missingReportDeduction !== undefined ? record.missingReportDeduction : (missingRep * 200);
        const totalDeduct = record.deductions || 0;
        const otherD = Math.max(0, totalDeduct - (record.absentDeduction || absDeduct) - (record.missingReportDeduction || missingRepDeduct));

        setManageModal({ show: true, record });
        setManageValues({
            bonus: record.bonus || 0,
            bonusDate: record.bonusDate ? record.bonusDate.split('T')[0] : "",
            bonusReason: record.bonusReason || "",
            deductions: totalDeduct,
            otherDeductions: otherD,
            deductionDate: record.deductionDate ? record.deductionDate.split('T')[0] : "",
            deductionReason: record.deductionReason || "",
            status: "Paid",
            paidAmount: record.paidAmount || 0,
            basicSalary: baseSal
        });
    };

    const handleSaveManage = async () => {
        if (!manageModal.record) return;
        setIsSaving(true);
        try {
            const currentBonus = Number(manageValues.bonus) || 0;
            const basic = Number(manageValues.basicSalary) || 0;
            const absDeduct = Math.round((manageModal.record.absentDays || 0) * (basic / 30));
            const missingRep = Number(manageModal.record.missingReports) || 0;
            const missingRepDeduct = manageModal.record.missingReportDeduction !== undefined ? Number(manageModal.record.missingReportDeduction) : (missingRep * 200);
            const currentOtherDeductions = Number(manageValues.otherDeductions) || 0;
            const totalDeductions = absDeduct + missingRepDeduct + currentOtherDeductions;
            const newNet = Math.max(0, basic + currentBonus - totalDeductions);

            const payload = { 
                ...manageValues, 
                status: "Paid",
                absentDeduction: absDeduct,
                missingReports: missingRep,
                missingReportDeduction: missingRepDeduct,
                deductions: totalDeductions,
                deductionReason: manageValues.deductionReason || "",
                bonusReason: manageValues.bonusReason || "",
                basicSalary: basic, 
                netSalary: newNet,
                paidAmount: newNet
            };

            const res = await api.put(`/hr/payroll/${manageModal.record._id}`, payload);
            if (res.data.success) {
                toast.success("Payroll processed successfully!");
                setManageModal({ show: false, record: null });
                fetchData();
            }
        } catch (err) { toast.error("Failed to save payroll changes"); }
        finally { setIsSaving(false); }
    };

    const handleDeleteRecord = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Payroll Record',
            message: 'Are you sure you want to delete this specific payroll entry? This is usually only done for corrupted/deleted employee records.',
            type: 'danger',
            confirmText: 'Delete Record',
            cancelText: 'Keep'
        });
        if (!isConfirmed) return;
        try {
            const res = await api.delete(`/hr/payroll/${id}`);
            if (res.data.success) {
                toast.success("Record removed");
                fetchData();
            }
        } catch (err) { toast.error("Failed to delete record"); }
    };

    const handlePrint = (record) => {
        const logo = window.location.origin + "/logo.png";
        const balance = record.netSalary - (record.paidAmount || 0);

        const content = `
        <div id="payslip-content" style="font-family: 'Segoe UI', sans-serif; padding: 40px; border: 2px solid #eee; max-width: 700px; margin: 0 auto; border-radius: 12px; background: white;">
            
            <!-- HEADER -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${logo}" alt="Company Logo" style="height: 60px; width: auto; background: white; padding: 5px; border-radius: 8px;" />
                    <div>
                        <h1 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">HAT TECH MEDIA</h1>
                        <p style="color: #64748b; margin: 2px 0 0; font-size: 12px; font-weight: 500;">Software & Marketing Solutions</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <h2 style="margin: 0; color: #94a3b8; font-size: 20px; font-weight: 600;">PAYSLIP</h2>
                    <p style="margin: 5px 0 0; color: #334155; font-size: 14px;"><strong>${record.month}</strong></p>
                </div>
            </div>
            
            <!-- EMPLOYEE DETAILS -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 8px;">
                <div>
                    <p style="margin: 0 0 5px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Employee Name</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${record.employee?.name?.replace(/ User$/i, '')}</p>
                </div>
                <div>
                    <p style="margin: 0 0 5px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Department</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #334155;">${record.employee?.department || 'N/A'}</p>
                </div>
                <div>
                    <p style="margin: 0 0 5px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Payment Date</p>
                    <p style="margin: 0; font-size: 15px; font-weight: 500; color: #334155;">${record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                    <p style="margin: 0 0 5px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Status</p>
                    <span style="display: inline-block; background: ${record.status === 'Paid' ? '#dcfce7' : record.status === 'Partial' ? '#fef9c3' : '#fee2e2'}; color: ${record.status === 'Paid' ? '#166534' : record.status === 'Partial' ? '#854d0e' : '#991b1b'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">${record.status.toUpperCase()}</span>
                </div>
            </div>

            <!-- PAYMENT TABLE -->
            <div style="border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 15px 20px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
                        <th style="padding: 15px 20px; text-align: right; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Amount (PKR)</th>
                    </tr>
                    <tr>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #334155;">Basic Salary</td>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #334155;">${(record.basicSalary || 0).toLocaleString()}</td>
                    </tr>
                    ${(record.bonus > 0) ? `
                    <tr>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #16a34a;">
                            Bonus / Incentives ${record.bonusReason ? `(${record.bonusReason})` : ''}
                            ${record.bonusDate ? `<div style='font-size:10px; color:#64748b'>On ${new Date(record.bonusDate).toLocaleDateString()}</div>` : ''}
                        </td>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #16a34a;">+ ${record.bonus.toLocaleString()}</td>
                    </tr>` : ''}
                    ${(record.absentDeduction > 0 || (record.absentDays > 0 && !record.absentDeduction)) ? `
                    <tr>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #dc2626;">
                            Absent & Late Deduction (${record.absentDays || 0} days)
                        </td>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #dc2626;">- ${(record.absentDeduction || Math.round((record.absentDays || 0) * ((record.basicSalary || 0)/30))).toLocaleString()}</td>
                    </tr>` : ''}
                    ${(record.missingReports > 0 || record.missingReportDeduction > 0) ? `
                    <tr>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #dc2626;">
                            Missing Daily Reports Penalty (${record.missingReports || 0} missing @ PKR 200)
                        </td>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #dc2626;">- ${(record.missingReportDeduction !== undefined ? record.missingReportDeduction : (record.missingReports * 200)).toLocaleString()}</td>
                    </tr>` : ''}
                    ${(record.deductions > 0 && !record.absentDeduction && !record.missingReportDeduction && !record.missingReports) ? `
                    <tr>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #dc2626;">
                            Deductions ${record.deductionReason ? `(${record.deductionReason})` : ''}
                            ${record.deductionDate ? `<div style='font-size:10px; color:#64748b'>On ${new Date(record.deductionDate).toLocaleDateString()}</div>` : ''}
                        </td>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #dc2626;">- ${record.deductions.toLocaleString()}</td>
                    </tr>` : ''}
                    ${record.paidAmount > 0 ? `
                    <tr>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #334155;">Amount Paid</td>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #334155;">${record.paidAmount.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #334155;">Balance Due</td>
                        <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #dc2626;">${balance.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                    <tr style="background: #eff6ff;">
                        <td style="padding: 20px; font-weight: 700; font-size: 16px; color: #1e3a8a;">NET PAYABLE</td>
                        <td style="padding: 20px; text-align: right; font-weight: 800; font-size: 24px; color: #2563eb;">PKR ${record.netSalary.toLocaleString()}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-top: 50px; text-align: center; color: #cbd5e1; font-size: 11px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <p style="margin-bottom: 5px;">This is a system-generated payslip from HAT TECH MEDIA Portal.</p>
                <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
        </div>
        `;

        const win = window.open('', '', 'height=800, width=800');
        win.document.write(`
            <html>
                <head>
                    <title>Payslip - ${record.employee?.name?.replace(/ User$/i, '')}</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                    <style>
                        body { padding: 20px; background: #f8fafc; font-family: 'Segoe UI', sans-serif; }
                        #controls { text-align: center; margin-bottom: 20px; }
                        button { padding: 10px 20px; font-size: 14px; cursor: pointer; border: none; border-radius: 6px; margin: 0 5px; font-weight: 600; transition: all 0.2s; }
                        .btn-print { background: #3b82f6; color: white; }
                        .btn-print:hover { background: #2563eb; }
                        .btn-download { background: #10b981; color: white; }
                        .btn-download:hover { background: #059669; }
                    </style>
                </head>
                <body>
                    <div id="controls">
                        <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
                        <button class="btn-download" onclick="downloadPDF()">Download PDF</button>
                    </div>
                    ${content}
                    <script>
                        function downloadPDF() {
                            const element = document.getElementById('payslip-content');
                            const opt = {
                                margin: 0.5,
                                filename: 'Payslip_${record.employee?.name?.replace(/ /g, '_')}_${record.month}.pdf',
                                image: { type: 'jpeg', quality: 0.98 },
                                html2canvas: { scale: 2 },
                                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                            };
                            html2pdf().set(opt).from(element).save();
                        }
                    </script>
                </body>
            </html>
        `);
        win.document.close();
    }

    // --- FILTERS ---
    const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredPayroll = payrolls.filter(p =>
        ((p.employee?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())) &&
        (activeTab === "salary" ? p.status !== "Paid" : p.status === "Paid")
    );

    // --- HISTORY MODAL ---
    const [historyModal, setHistoryModal] = useState({ show: false, employeeId: null, employeeName: '', records: [] });
    const [payslipModal, setPayslipModal] = useState({ show: false, record: null });
    const [loadingHistory, setLoadingHistory] = useState(false);

    const handleViewHistory = async (empId, empName) => {
        setHistoryModal({ show: true, employeeId: empId, employeeName: empName, records: [] });
        setLoadingHistory(true);
        try {
            const res = await api.get(`/hr/payroll/history/${empId}`);
            if (res.data.success) {
                setHistoryModal(prev => ({ ...prev, records: res.data.data }));
            }
        } catch (err) {
            toast.error("Failed to fetch history");
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSendEmail = async (recordId) => {
        const isConfirmed = await confirm({
            title: 'Send Payslip',
            message: 'Are you sure you want to send this payslip via email to the employee?',
            type: 'primary',
            confirmText: 'Send Email',
            cancelText: 'Cancel'
        });
        if (!isConfirmed) return;
        const toastId = toast.loading("Sending email...");
        try {
            const res = await api.post(`/hr/payroll/${recordId}/email`);
            if (res.data.success) {
                toast.success("Email sent successfully", { id: toastId });
            }
        } catch (err) {
            toast.error("Failed to send email: " + (err.response?.data?.message || err.message), { id: toastId });
        }
    };

    return (
        <div className="space-y-6 pt-14 md:pt-0 animate-in fade-in duration-500 pb-10">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Payroll Management
                    </h1>
                    <p className="text-sm text-gray-500">Manage salaries, process payments, and view history.</p>
                </div>
                {activeTab !== 'accounts' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="text-[10px] font-black uppercase text-[#004AAE] bg-[#004AAE]/10 px-3 py-1.5 rounded-xl border border-[#004AAE]/20 shadow-sm">
                            Pay Period: {(() => {
                                if (!month) return "";
                                const [y, m] = month.split('-').map(Number);
                                const prevDate = new Date(y, m - 2, 1);
                                return prevDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                            })()} Performance
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                            <input 
                                type="month" 
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="bg-transparent border-none outline-none font-medium text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* TABS */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                <button
                    onClick={() => setActiveTab("accounts")}
                    style={{ color: activeTab === "accounts" ? '#ffffff' : '#4b5563' }}
                    className={`flex items-center gap-2 px-6 py-2.5 font-medium text-sm transition-all whitespace-nowrap rounded-xl ${activeTab === "accounts" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                >
                    <FiUser /> Accounts & Salary
                </button>
                <button
                    onClick={() => setActiveTab("salary")}
                    style={{ color: activeTab === "salary" ? '#ffffff' : '#4b5563' }}
                    className={`flex items-center gap-2 px-6 py-2.5 font-medium text-sm transition-all whitespace-nowrap rounded-xl ${activeTab === "salary" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                >
                    <FiDollarSign /> Process Payroll
                </button>
                <button
                    onClick={() => setActiveTab("completed")}
                    style={{ color: activeTab === "completed" ? '#ffffff' : '#4b5563' }}
                    className={`flex items-center gap-2 px-6 py-2.5 font-medium text-sm transition-all whitespace-nowrap rounded-xl ${activeTab === "completed" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                >
                    <FiCheckCircle /> Completed / History
                </button>
            </div>

            {/* SEARCH & ACTIONS */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-full md:w-72 group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        style={{ paddingLeft: '3.5rem' }}
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-none outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                </div>
                {activeTab === "salary" && (
                    <button
                        onClick={handleGenerate}
                        style={{ color: '#ffffff' }}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 !text-white rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                    >
                        <FiClock style={{ color: '#ffffff' }} /> Generate for {month}
                    </button>
                )}
            </div>

            {/* CONTENT */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden min-h-[300px]">
                {loading ? <LoadingSpinner /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 uppercase">
                                {activeTab === "accounts" ? (
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Position</th>
                                        <th className="px-6 py-4">Monthly Salary</th>
                                        <th className="px-6 py-4">Bank Details</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Basic</th>
                                        <th className="px-6 py-4">Bonus / Deductions</th>
                                        <th className="px-6 py-4">Net Salary</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="">

                                {/* --- ACCOUNTS TAB --- */}
                                {activeTab === "accounts" && (
                                    filteredEmployees.map(emp => (
                                        <tr key={emp._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white cursor-pointer hover:underline" onClick={() => handleViewHistory(emp._id, emp.name)}>
                                                {emp.name.replace(/ User$/i, '')}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{emp.position}</td>
                                            <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">PKR {(emp.salary || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {emp.bankDetails?.bankName ? (
                                                    <>{emp.bankDetails.bankName}<br />{emp.bankDetails.accountNumber}</>
                                                ) : <span className="text-red-400">Not Set</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => handleOpenSettings(emp)} style={{ color: '#ffffff' }} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Edit</button>
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {/* --- SALARY (Pending) & COMPLETED TAB --- */}
                                {activeTab !== "accounts" && (
                                    filteredPayroll.length === 0 ? (
                                        <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No records found.</td></tr>
                                    ) : filteredPayroll.map(record => (
                                        <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white cursor-pointer hover:underline" onClick={() => record.employee && handleViewHistory(record.employee?._id, record.employee?.name)}>
                                                {record.employee?.name ? record.employee.name.replace(/ User$/i, '') : <span className="text-red-500 italic font-bold">Deleted Employee ({record.employee?._id || 'Record ID: ' + record._id})</span>}
                                                <div className="text-xs text-gray-400">{record.employee?.department || 'Orphaned Entry'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">PKR {record.basicSalary.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1 text-xs">
                                                    {record.bonus > 0 && <div className="text-green-600">+{record.bonus} {record.bonusDate && `(${new Date(record.bonusDate).toLocaleDateString().slice(0, 5)})`}</div>}
                                                    {record.deductions > 0 && <div className="text-red-500">-{record.deductions} {record.deductionDate && `(${new Date(record.deductionDate).toLocaleDateString().slice(0, 5)})`}</div>}
                                                    {record.missingReports > 0 && (
                                                        <div className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                                                            {record.missingReports} missed rpt (-PKR {record.missingReportDeduction !== undefined ? record.missingReportDeduction : (record.missingReports * 200)})
                                                        </div>
                                                    )}
                                                    {record.bonus === 0 && record.deductions === 0 && (!record.missingReports || record.missingReports === 0) && <span className="text-gray-400">-</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">PKR {record.netSalary.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                    record.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                                        record.status === 'Advance' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>{record.status}</span>
                                                {record.paidAmount > 0 && (
                                                    <div className="text-[10px] text-gray-500 mt-1 font-mono">
                                                        <div>Pd: {record.paidAmount.toLocaleString()}</div>
                                                        {(record.netSalary - record.paidAmount) > 0 && (
                                                            <div className="text-red-500 font-bold">Bal: {(record.netSalary - record.paidAmount).toLocaleString()}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 flex items-center justify-center gap-2">
                                                {/* SALARY TAB ACTIONS */}
                                                {activeTab === "salary" && (
                                                    <>
                                                        <button onClick={() => handleOpenManage(record)} style={{ color: '#ffffff' }} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition-colors shadow-sm">Proceed</button>
                                                        {!record.employee && (
                                                            <button onClick={() => handleDeleteRecord(record._id)} className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition" title="Cleanup Corrupted Record"><FiTrash2 size={14} /></button>
                                                        )}
                                                        {record.employee && <button onClick={() => handlePrint(record)} style={{ color: '#ffffff' }} className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors shadow-sm" title="Print/Download Slip"><FiPrinter /></button>}
                                                    </>
                                                )}

                                                {/* COMPLETED TAB ACTIONS */}
                                                {activeTab === "completed" && (
                                                    <>
                                                        <button onClick={() => handleOpenManage(record)} style={{ color: '#ffffff' }} className="mr-2 px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs transition-colors shadow-sm">Edit</button>
                                                        <button onClick={() => handlePrint(record)} style={{ color: '#ffffff' }} className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors shadow-sm" title="Print Slip"><FiPrinter /></button>
                                                        <button onClick={() => handleSendEmail(record._id)} style={{ color: '#ffffff' }} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors shadow-sm" title="Send Email"><FiFileText /></button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MANAGE PAYROLL MODAL */}
            <AnimatePresence>
                {manageModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                            <button onClick={() => setManageModal({ show: false, record: null })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <h2 className="text-xl font-bold mb-4 dark:text-white">Process Payroll</h2>

                            {/* ATTENDANCE & SALARY BREAKDOWN SUMMARY CARD */}
                            {manageModal.record && (
                                <div className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-4 rounded-xl mb-4 text-xs space-y-2 dark:text-gray-200">
                                    <div className="flex justify-between font-semibold border-b pb-2 mb-2 dark:border-gray-700">
                                        <span className="text-blue-800 dark:text-blue-400 font-bold">{manageModal.record.employee?.name}</span>
                                        <span className="text-gray-500">{manageModal.record.employee?.position}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div><span className="font-bold text-gray-500">Base Salary:</span> PKR {(Number(manageValues.basicSalary) || 0).toLocaleString()}</div>
                                        <div><span className="font-bold text-gray-500">Daily Salary (30 Days):</span> PKR {Math.round((Number(manageValues.basicSalary) || 0) / 30).toLocaleString()}</div>
                                        <div><span className="font-bold text-gray-500">Total Absents:</span> <span className="font-bold text-red-600 dark:text-red-400">{manageModal.record.absentDays || 0} days</span></div>
                                        <div><span className="font-bold text-gray-500">Approved Leaves:</span> <span className="font-bold text-green-600 dark:text-green-400">{manageModal.record.leaveDays || 0} days (Paid)</span></div>
                                        {manageModal.record.lateDays > 0 && (
                                            <div className="col-span-2 text-amber-600 dark:text-amber-400 font-medium">
                                                ⚠️ <span className="font-bold">Late Marks:</span> {manageModal.record.lateDays} days ({Math.floor(manageModal.record.lateDays / 3)} absents added)
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t pt-2 mt-2 dark:border-gray-700 flex justify-between items-center text-[11px] font-bold">
                                        <span className="text-red-700 dark:text-red-400">Absent Deduction:</span>
                                        <span className="text-red-700 dark:text-red-400">- PKR {Math.round((manageModal.record.absentDays || 0) * ((Number(manageValues.basicSalary) || 0) / 30)).toLocaleString()}</span>
                                    </div>
                                    {((manageModal.record.missingReports > 0) || (manageModal.record.missingReportDeduction > 0)) && (
                                        <div className="border-t pt-2 mt-2 dark:border-gray-700 flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-amber-700 dark:text-amber-400">
                                                Missing Daily Reports Penalty ({manageModal.record.missingReports || 0} missing @ PKR 200):
                                            </span>
                                            <span className="text-amber-700 dark:text-amber-400">
                                                - PKR {(manageModal.record.missingReportDeduction !== undefined ? manageModal.record.missingReportDeduction : ((manageModal.record.missingReports || 0) * 200)).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {Number(manageValues.otherDeductions) > 0 && (
                                        <div className="flex justify-between items-center text-[11px] font-bold text-red-600 dark:text-red-400">
                                            <span>
                                                {manageValues.deductionReason && manageValues.deductionReason.trim()
                                                    ? manageValues.deductionReason.trim()
                                                    : (manageModal.record?.lateDays > 0 
                                                        ? `Late Marks Deduction (${manageModal.record.lateDays} Late Days)` 
                                                        : 'Deduction')}:
                                            </span>
                                            <span>- PKR {Number(manageValues.otherDeductions).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {Number(manageValues.bonus) > 0 && (
                                        <div className="flex justify-between items-center text-[11px] font-bold text-green-600 dark:text-green-400">
                                            <span>Bonus Incentive ({manageValues.bonusReason || 'Bonus'}):</span>
                                            <span>+ PKR {Number(manageValues.bonus).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-xs font-black border-t border-dashed pt-2 dark:border-gray-700 text-blue-900 dark:text-blue-300">
                                        <span>Calculated Net Pay:</span>
                                        <span>PKR {Math.max(0, (Number(manageValues.basicSalary) || 0) - Math.round((manageModal.record.absentDays || 0) * ((Number(manageValues.basicSalary) || 0) / 30)) - (manageModal.record.missingReportDeduction !== undefined ? Number(manageModal.record.missingReportDeduction) : ((Number(manageModal.record.missingReports) || 0) * 200)) + (Number(manageValues.bonus) || 0) - (Number(manageValues.otherDeductions) || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                            {/* EMPLOYEE BANK & ACCOUNT DETAILS CARD */}
                            {manageModal.record && (() => {
                                const emp = manageModal.record.employee || {};
                                const bankName = emp.bankDetails?.bankName || emp.bankName || "Not Set";
                                const accountHolder = emp.bankDetails?.accountHolder || emp.accountHolder || emp.name || "N/A";
                                const accountNumber = emp.bankDetails?.accountNumber || emp.accountNumber || "N/A";
                                const iban = emp.bankDetails?.iban || emp.iban || "";

                                return (
                                    <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-4 rounded-xl mb-4 text-xs space-y-2.5">
                                        <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800/40 pb-2">
                                            <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                                                🏦 Employee Bank Account Details
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                {bankName}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-200">
                                            <div>
                                                <span className="text-slate-400 block text-[10px] font-semibold">Account Title / Holder:</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{accountHolder}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] font-semibold">Bank Name:</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{bankName}</span>
                                            </div>
                                            <div className="col-span-2 flex items-center justify-between bg-white dark:bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
                                                <div>
                                                    <span className="text-slate-400 block text-[10px] font-semibold">Account Number / IBAN:</span>
                                                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                                                        {accountNumber !== "N/A" ? accountNumber : (iban || "No Account Added")}
                                                    </span>
                                                </div>
                                                {accountNumber !== "N/A" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(accountNumber);
                                                            toast.success("Account Number Copied!");
                                                        }}
                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                                                    >
                                                        <FiCopy size={11} /> Copy
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Bonus Amount</label>
                                    <input type="number" className="w-full p-2 rounded-lg bg-gray-50 border-none outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                                        value={manageValues.bonus} onChange={e => setManageValues({ ...manageValues, bonus: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Bonus Date</label>
                                    <input type="date" className="w-full p-2 rounded-lg bg-gray-50 border-none outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                                        value={manageValues.bonusDate} onChange={e => setManageValues({ ...manageValues, bonusDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Bonus Description / Reason</label>
                                <input type="text" placeholder="e.g. Eid Bonus / Overtime Reward" className="w-full p-2 rounded-lg bg-gray-50 border-none outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all text-xs"
                                    value={manageValues.bonusReason} onChange={e => setManageValues({ ...manageValues, bonusReason: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Deduction Amount</label>
                                    <input type="number" className="w-full p-2 rounded-lg bg-gray-50 border-none outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                                        value={manageValues.otherDeductions} onChange={e => setManageValues({ ...manageValues, deductions: e.target.value, otherDeductions: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Deduction Date</label>
                                    <input type="date" className="w-full p-2 rounded-lg bg-gray-50 border-none outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                                        value={manageValues.deductionDate} onChange={e => setManageValues({ ...manageValues, deductionDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="mb-4 border-b pb-4 dark:border-gray-700">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Deduction Description / Reason</label>
                                <input type="text" placeholder="e.g. Loan Repayment / Advance Salary / Late Fine" className="w-full p-2 rounded-lg bg-gray-50 border-none outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all text-xs"
                                    value={manageValues.deductionReason} onChange={e => setManageValues({ ...manageValues, deductionReason: e.target.value })} />
                            </div>

                            {/* Base Monthly Salary and Payment Status are hidden, defaulting to Paid on save */}

                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setManageModal({ show: false, record: null })} className="px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors font-medium">Cancel</button>
                                <button onClick={handleSaveManage} disabled={isSaving} style={{ color: '#ffffff' }} className={`px-4 py-2 bg-blue-600 text-white rounded-lg transition-all font-bold ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}>{isSaving ? 'Saving...' : '✓ Salary Paid'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* UPDATE SETTINGS MODAL */}
            <AnimatePresence>
                {showSettingsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
                        >
                            <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <h2 className="text-xl font-bold mb-4 dark:text-white">Update Employee Accounts</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Base Monthly Salary</label>
                                    <input type="number" className="w-full p-2 rounded-lg bg-gray-50 border-none outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                                        value={employeeSettings.salary} onChange={(e) => setEmployeeSettings({ ...employeeSettings, salary: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Bank Name</label>
                                    <input type="text" className="w-full p-2 rounded-lg bg-gray-50 border-none outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                                        value={employeeSettings.bankName} onChange={(e) => setEmployeeSettings({ ...employeeSettings, bankName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Account Holder</label>
                                    <input type="text" className="w-full p-2 rounded-lg bg-gray-50 border-none outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                                        value={employeeSettings.accountHolder} onChange={(e) => setEmployeeSettings({ ...employeeSettings, accountHolder: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Account Number / IBAN</label>
                                    <input type="text" className="w-full p-2 rounded-lg bg-gray-50 border-none outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                                        value={employeeSettings.accountNumber} onChange={(e) => setEmployeeSettings({ ...employeeSettings, accountNumber: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors font-medium">Cancel</button>
                                <button onClick={handleSaveSettings} disabled={isSavingSettings} style={{ color: '#ffffff' }} className={`px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all font-bold ${isSavingSettings ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}>{isSavingSettings ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* HISTORY MODAL */}
            <AnimatePresence>
                {historyModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                            <button onClick={() => setHistoryModal({ ...historyModal, show: false })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <h2 className="text-xl font-bold mb-1 dark:text-white">Payroll History</h2>
                            <p className="text-sm text-gray-500 mb-6">{historyModal.employeeName}</p>

                            {loadingHistory ? <LoadingSpinner /> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-6 py-4">Month</th>
                                                <th className="px-6 py-4">Basic</th>
                                                <th className="px-6 py-4">Net Salary</th>
                                                <th className="px-6 py-4">Paid</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {historyModal.records.length === 0 ? (
                                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No history found.</td></tr>
                                            ) : historyModal.records.map((record) => (
                                                <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 font-medium dark:text-white">{record.month}</td>
                                                    <td className="px-6 py-4 dark:text-gray-300">PKR {record.basicSalary.toLocaleString()}</td>
                                                    <td className="px-6 py-4 font-bold dark:text-white">PKR {record.netSalary.toLocaleString()}</td>
                                                    <td className="px-6 py-4 dark:text-gray-300">
                                                        PKR {(record.paidAmount || 0).toLocaleString()}
                                                        {record.paymentDate && <div className="text-xs text-gray-400">{new Date(record.paymentDate).toLocaleDateString()}</div>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                            record.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>{record.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setPayslipModal({ show: true, record })}
                                                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors shadow-sm"
                                                            title="View Details"
                                                        >
                                                            <FiDownload />
                                                        </button>
                                                        <button onClick={() => handlePrint(record)} style={{ color: '#ffffff' }} className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors shadow-sm" title="Print/Download Slip"><FiPrinter /></button>
                                                        <button onClick={() => handleSendEmail(record._id)} style={{ color: '#ffffff' }} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors shadow-sm" title="Send Email"><FiFileText /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="mt-6 flex justify-end">
                                <button onClick={() => setHistoryModal({ ...historyModal, show: false })} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PAYSLIP DETAIL MODAL (Nested) */}
            <AnimatePresence>
                {payslipModal.show && payslipModal.record && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative"
                        >
                            <button onClick={() => setPayslipModal({ show: false, record: null })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>

                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold dark:text-white">Payslip Details</h2>
                                <p className="text-gray-500 text-sm">{payslipModal.record.month}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Basic Salary</p>
                                        <p className="font-bold text-gray-900 dark:text-white">PKR {payslipModal.record.basicSalary.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Net Salary</p>
                                        <p className="font-bold text-blue-600 dark:text-blue-400">PKR {payslipModal.record.netSalary.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Status</p>
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${payslipModal.record.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                            payslipModal.record.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {payslipModal.record.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Paid Date</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {payslipModal.record.paymentDate ? new Date(payslipModal.record.paymentDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                    <div className="flex justify-between items-center text-sm mb-2">
                                        <span className="text-gray-500">Bonus</span>
                                        <span className="text-green-600 font-medium">+ {payslipModal.record.bonus.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mb-2">
                                        <span className="text-gray-500">Deductions</span>
                                        <span className="text-red-500 font-medium">- {payslipModal.record.deductions.toLocaleString()}</span>
                                    </div>
                                    {payslipModal.record.paidAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="text-gray-500">Amount Paid</span>
                                            <span className="text-gray-900 dark:text-white font-medium">{payslipModal.record.paidAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => handlePrint(payslipModal.record)}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <FiPrinter /> Print / Download PDF
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
