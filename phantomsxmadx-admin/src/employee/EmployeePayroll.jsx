import { useState, useEffect } from "react";
import api from "../services/api";
import { FiDownload, FiPrinter } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";

export default function EmployeePayroll() {
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [user, setUser] = useState(null);
    const [historyModal, setHistoryModal] = useState({ show: false, record: null });

    const handleViewHistory = (record) => {
        setHistoryModal({ show: true, record });
    };

    useEffect(() => {
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (user?.id || user?._id || user?.userId) {
            const userId = user.id || user._id || user.userId;
            fetchHistory(userId);
            const interval = setInterval(() => fetchHistory(userId), 15000); // Poll every 15s
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchHistory = async (userId) => {
        setLoading(true);
        try {
            const res = await api.get(`/hr/payroll/history/${userId}`);
            if (res.data.success) {
                setRecords(res.data.data);
            }
        } catch (err) {
            toast.error("Failed to fetch payroll history");
        } finally {
            setLoading(false);
        }
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
                    <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${user?.name?.replace(/ User$/i, '') || 'Employee'}</p>
                </div>
                <div>
                    <p style="margin: 0 0 5px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Status</p>
                    <span style="display: inline-block; background: ${record.status === 'Paid' ? '#dcfce7' : record.status === 'Partial' ? '#fef9c3' : '#fee2e2'}; color: ${record.status === 'Paid' ? '#166534' : record.status === 'Partial' ? '#854d0e' : '#991b1b'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">${record.status.toUpperCase()}</span>
                </div>
                <div>
                    <p style="margin: 0 0 5px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Payment Date</p>
                    <p style="margin: 0; font-size: 15px; font-weight: 500; color: #334155;">${record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : 'N/A'}</p>
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
                    <title>Payslip - ${record.month}</title>
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
                                filename: 'Payslip_${record.month}.pdf',
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

    return (
        <div className="space-y-6 pt-14 md:pt-0 animate-in fade-in duration-500 pb-10">
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Salary & Payslips
                </h1>
                <p className="text-sm text-gray-500">View your payment history and download payslips.</p>
            </div>

            {/* CONTENT */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden min-h-[300px]">
                {loading ? <LoadingSpinner /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Month</th>
                                    <th className="px-6 py-4">Basic</th>
                                    <th className="px-6 py-4">Net Salary</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {records.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No salary history found.</td></tr>
                                ) : records.map(record => (
                                    <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium dark:text-white">{record.month}</td>
                                        <td className="px-6 py-4 dark:text-gray-300">PKR {record.basicSalary.toLocaleString()}</td>
                                        <td className="px-6 py-4 font-bold dark:text-white">PKR {record.netSalary.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                record.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                                    record.status === 'Advance' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>{record.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center flex justify-center gap-2">
                                            <button
                                                onClick={() => handleViewHistory(record)}
                                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors shadow-sm"
                                                title="View Details"
                                            >
                                                <FiDownload />
                                            </button>
                                            <button
                                                onClick={() => handlePrint(record)}
                                                className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors shadow-sm"
                                                title="Print Slip"
                                            >
                                                <FiPrinter />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* PAYROLL HISTORY DETAILS MODAL */}
            <AnimatePresence>
                {historyModal.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setHistoryModal({ show: false, record: null })}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setHistoryModal({ show: false, record: null })}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>

                            {historyModal.record && (
                                <>
                                    <div className="text-center mb-6">
                                        <h2 className="text-xl font-bold dark:text-white">Payslip Details</h2>
                                        <p className="text-gray-500 text-sm">{historyModal.record.month}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Basic Salary</p>
                                                <p className="font-bold text-gray-900 dark:text-white">PKR {historyModal.record.basicSalary.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Net Salary</p>
                                                <p className="font-bold text-blue-600 dark:text-blue-400">PKR {historyModal.record.netSalary.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Status</p>
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${historyModal.record.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                    historyModal.record.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {historyModal.record.status}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Paid Date</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {historyModal.record.paymentDate ? new Date(historyModal.record.paymentDate).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
                                            {historyModal.record.bonus > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500">Bonus / Incentives {historyModal.record.bonusReason ? `(${historyModal.record.bonusReason})` : ''}</span>
                                                    <span className="text-green-600 font-medium">+ {historyModal.record.bonus.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {(historyModal.record.absentDeduction > 0 || (historyModal.record.absentDays > 0 && !historyModal.record.absentDeduction)) && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500">Absent & Late Deduction ({historyModal.record.absentDays || 0} days)</span>
                                                    <span className="text-red-500 font-medium">- {(historyModal.record.absentDeduction || Math.round((historyModal.record.absentDays || 0) * ((historyModal.record.basicSalary || 0)/30))).toLocaleString()}</span>
                                                </div>
                                            )}
                                            {(historyModal.record.missingReports > 0 || historyModal.record.missingReportDeduction > 0) && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-amber-600 dark:text-amber-400">Missing Daily Reports Penalty ({historyModal.record.missingReports || 0} missing @ PKR 200)</span>
                                                    <span className="text-amber-600 dark:text-amber-400 font-medium">- {(historyModal.record.missingReportDeduction !== undefined ? historyModal.record.missingReportDeduction : (historyModal.record.missingReports * 200)).toLocaleString()}</span>
                                                </div>
                                            )}
                                            {(historyModal.record.deductions > 0 && !historyModal.record.absentDeduction && !historyModal.record.missingReportDeduction && !historyModal.record.missingReports) && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500">Deductions {historyModal.record.deductionReason ? `(${historyModal.record.deductionReason})` : ''}</span>
                                                    <span className="text-red-500 font-medium">- {historyModal.record.deductions.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {historyModal.record.paidAmount > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500">Amount Paid</span>
                                                    <span className="text-gray-900 dark:text-white font-medium">{historyModal.record.paidAmount.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-8">
                                        <button
                                            onClick={() => handlePrint(historyModal.record)}
                                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FiPrinter /> Print / Download PDF
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
