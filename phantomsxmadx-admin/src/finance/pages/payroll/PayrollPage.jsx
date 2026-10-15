import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import {
  FiDollarSign,
  FiDownload,
  FiCheckCircle,
  FiSave,
  FiSearch,
  FiPrinter,
  FiUser,
  FiCreditCard,
  FiFileText,
  FiClock,
  FiTrash2,
  FiCopy,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { useModal } from "../../../contexts/ModalContext";

export const PayrollPage = () => {
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
  const [employeeSettings, setEmployeeSettings] = useState({
    salary: 0,
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });

  const [manageModal, setManageModal] = useState({ show: false, record: null });
  const [manageValues, setManageValues] = useState({
    bonus: 0,
    bonusDate: "",
    bonusReason: "",
    deductions: 0,
    deductionDate: "",
    deductionReason: "",
    otherDeductions: 0,
    status: "Paid",
    paidAmount: 0,
    basicSalary: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // History & Payslip Modals
  const [historyModal, setHistoryModal] = useState({
    show: false,
    employeeId: null,
    employeeName: "",
    records: [],
  });
  const [payslipModal, setPayslipModal] = useState({ show: false, record: null });
  const [loadingHistory, setLoadingHistory] = useState(false);

  const hasGeneratedRef = useRef(false);

  // --- DATA FETCHING ---
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [empRes, pyRes] = await Promise.all([
        api.get("/employees"),
        api.get(`/hr/payroll?month=${month}`),
      ]);

      const allEmps = empRes.data.employees || empRes.data.data || [];
      const cleanEmps = allEmps.filter((e) => {
        const role = (e.role || e.userId?.role || "").toLowerCase();
        const dept = (e.department || "").toLowerCase();
        return (
          role !== "it_support" &&
          !dept.includes("it support") &&
          !dept.includes("it-support") &&
          e.status !== "inactive"
        );
      });
      setEmployees(cleanEmps);

      if (pyRes.data.success) {
        const sorted = (pyRes.data.data || [])
          .filter((p) => {
            if (!p.employee) return false;
            if (p.employee.status === "inactive") return false;
            const role = (p.employee.role || p.employee.userId?.role || "").toLowerCase();
            const dept = (p.employee.department || "").toLowerCase();
            return (
              role !== "it_support" &&
              !dept.includes("it support") &&
              !dept.includes("it-support")
            );
          })
          .sort((a, b) => (a.employee?.name || "").localeCompare(b.employee?.name || ""));

        if (sorted.length === 0 && cleanEmps.length > 0 && !hasGeneratedRef.current) {
          hasGeneratedRef.current = true;
          await api.post("/hr/payroll", { month });
          const newPyRes = await api.get(`/hr/payroll?month=${month}`);
          if (newPyRes.data.success) {
            const newSorted = (newPyRes.data.data || [])
              .filter((p) => {
                if (!p.employee) return false;
                if (p.employee.status === "inactive") return false;
                const role = (p.employee.role || p.employee.userId?.role || "").toLowerCase();
                const dept = (p.employee.department || "").toLowerCase();
                return (
                  role !== "it_support" &&
                  !dept.includes("it support") &&
                  !dept.includes("it-support")
                );
              })
              .sort((a, b) => (a.employee?.name || "").localeCompare(b.employee?.name || ""));
            setPayrolls(newSorted);
          }
        } else {
          setPayrolls(sorted);
        }
      }
    } catch (err) {
      console.error("Failed to fetch payroll data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hasGeneratedRef.current = false;
    fetchData();
  }, [month]);

  // --- HANDLERS (Accounts & Settings) ---
  const handleOpenSettings = (emp) => {
    setSelectedEmployee(emp);
    setEmployeeSettings({
      salary: emp.salary || 0,
      bankName: emp.bankDetails?.bankName || "",
      accountNumber: emp.bankDetails?.accountNumber || "",
      accountHolder: emp.bankDetails?.accountHolder || emp.name || "",
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
          accountHolder: employeeSettings.accountHolder,
        },
      };
      const res = await api.put(`/employees/${selectedEmployee._id}`, payload);
      if (res.data.success) {
        toast.success("Employee salary & bank settings saved!");
        setShowSettingsModal(false);

        // Optimistically update local state
        setEmployees((prev) =>
          (prev || []).map((emp) =>
            emp._id === selectedEmployee._id
              ? { ...emp, salary: newSal, bankDetails: payload.bankDetails }
              : emp
          )
        );
        setPayrolls((prev) =>
          (prev || []).map((item) =>
            item.employee?._id === selectedEmployee._id || item.employee === selectedEmployee._id
              ? { ...item, basicSalary: newSal }
              : item
          )
        );

        // Background sync
        api.post("/hr/payroll", { month }).catch(() => {});
      }
    } catch (err) {
      toast.error("Failed to save settings: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSavingSettings(false);
    }
  };

  // --- HANDLERS (Salary & Generation) ---
  const handleGenerate = async () => {
    let isConfirmed = true;
    if (confirm) {
      isConfirmed = await confirm({
        title: "Generate Payroll",
        message: `Are you sure you want to generate payroll for ${month}? This will sync all employee salaries and bank details for this period.`,
        type: "primary",
        confirmText: "Generate Now",
        cancelText: "Cancel",
      });
    } else {
      isConfirmed = window.confirm(`Generate payroll for ${month}?`);
    }

    if (!isConfirmed) return;
    try {
      const res = await api.post("/hr/payroll", { month });
      if (res.data.success) {
        toast.success(res.data.message || "Payroll generated successfully!");
        fetchData();
      }
    } catch (err) {
      toast.error("Generation failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenManage = (record) => {
    const baseSal = record.basicSalary || record.employee?.salary || 0;
    const absDays = record.absentDays || 0;
    const absDeduct = Math.round(absDays * (baseSal / 30));
    const missingRep = record.missingReports || 0;
    const missingRepDeduct =
      record.missingReportDeduction !== undefined
        ? record.missingReportDeduction
        : missingRep * 200;
    const totalDeduct = record.deductions || 0;
    const otherD = Math.max(
      0,
      totalDeduct -
        (record.absentDeduction || absDeduct) -
        (record.missingReportDeduction || missingRepDeduct)
    );

    setManageModal({ show: true, record });
    setManageValues({
      bonus: record.bonus || 0,
      bonusDate: record.bonusDate ? record.bonusDate.split("T")[0] : "",
      bonusReason: record.bonusReason || "",
      deductions: totalDeduct,
      otherDeductions: otherD,
      deductionDate: record.deductionDate ? record.deductionDate.split("T")[0] : "",
      deductionReason: record.deductionReason || "",
      status: "Paid",
      paidAmount: record.paidAmount || 0,
      basicSalary: baseSal,
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
      const missingRepDeduct =
        manageModal.record.missingReportDeduction !== undefined
          ? Number(manageModal.record.missingReportDeduction)
          : missingRep * 200;
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
        paidAmount: newNet,
      };

      const res = await api.put(`/hr/payroll/${manageModal.record._id}`, payload);
      if (res.data.success) {
        toast.success("Payroll processed and marked as Paid!");
        setManageModal({ show: false, record: null });
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to save payroll changes: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    let isConfirmed = true;
    if (confirm) {
      isConfirmed = await confirm({
        title: "Delete Payroll Record",
        message: "Are you sure you want to delete this specific payroll entry? This is usually only done for corrupted/deleted employee records.",
        type: "danger",
        confirmText: "Delete Record",
        cancelText: "Keep",
      });
    } else {
      isConfirmed = window.confirm("Delete this payroll entry?");
    }

    if (!isConfirmed) return;
    try {
      const res = await api.delete(`/hr/payroll/${id}`);
      if (res.data.success) {
        toast.success("Record removed");
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to delete record: " + (err.response?.data?.message || err.message));
    }
  };

  const handleViewHistory = async (empId, empName) => {
    setHistoryModal({ show: true, employeeId: empId, employeeName: empName, records: [] });
    setLoadingHistory(true);
    try {
      const res = await api.get(`/hr/payroll/history/${empId}`);
      if (res.data.success) {
        setHistoryModal((prev) => ({ ...prev, records: res.data.data }));
      }
    } catch (err) {
      toast.error("Failed to fetch history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendEmail = async (recordId) => {
    let isConfirmed = true;
    if (confirm) {
      isConfirmed = await confirm({
        title: "Send Payslip",
        message: "Are you sure you want to send this payslip via email to the employee?",
        type: "primary",
        confirmText: "Send Email",
        cancelText: "Cancel",
      });
    } else {
      isConfirmed = window.confirm("Send this payslip email to employee?");
    }

    if (!isConfirmed) return;
    const toastId = toast.loading("Sending email...");
    try {
      const res = await api.post(`/hr/payroll/${recordId}/email`);
      if (res.data.success) {
        toast.success("Email sent successfully", { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to send email: " + (err.response?.data?.message || err.message), {
        id: toastId,
      });
    }
  };

  const handlePrint = (record) => {
    const logo = window.location.origin + "/logo.jpg";
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
                  <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${record.employee?.name?.replace(/ User$/i, "")}</p>
              </div>
              <div>
                  <p style="margin: 0 0 5px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Department</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #334155;">${record.employee?.department || "N/A"}</p>
              </div>
              <div>
                  <p style="margin: 0 0 5px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Payment Date</p>
                  <p style="margin: 0; font-size: 15px; font-weight: 500; color: #334155;">${record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : "N/A"}</p>
              </div>
              <div>
                  <p style="margin: 0 0 5px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Status</p>
                  <span style="display: inline-block; background: ${record.status === "Paid" ? "#dcfce7" : record.status === "Partial" ? "#fef9c3" : "#fee2e2"}; color: ${record.status === "Paid" ? "#166534" : record.status === "Partial" ? "#854d0e" : "#991b1b"}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">${(record.status || "PENDING").toUpperCase()}</span>
              </div>
          </div>

          <!-- PAYMENT TABLE -->
          <div style="border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                  <tr style="background: #f1f5f9;">
                      <th style="padding: 15px 20px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
                      <th style="padding: 15px 20px; text-align: right; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Amount (EUR)</th>
                  </tr>
                  <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #334155;">Basic Salary</td>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #334155;">${(record.basicSalary || 0).toLocaleString()}</td>
                  </tr>
                  ${
                    record.bonus > 0
                      ? `
                  <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #16a34a;">
                          Bonus / Incentives ${record.bonusReason ? `(${record.bonusReason})` : ""}
                          ${record.bonusDate ? `<div style='font-size:10px; color:#64748b'>On ${new Date(record.bonusDate).toLocaleDateString()}</div>` : ""}
                      </td>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #16a34a;">+ ${record.bonus.toLocaleString()}</td>
                  </tr>`
                      : ""
                  }
                  ${
                    record.absentDeduction > 0 || (record.absentDays > 0 && !record.absentDeduction)
                      ? `
                  <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #dc2626;">
                          Absent & Late Deduction (${record.absentDays || 0} days)
                      </td>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #dc2626;">- ${(record.absentDeduction || Math.round((record.absentDays || 0) * ((record.basicSalary || 0) / 30))).toLocaleString()}</td>
                  </tr>`
                      : ""
                  }
                  ${
                    record.missingReports > 0 || record.missingReportDeduction > 0
                      ? `
                  <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #dc2626;">
                          Missing Daily Reports Penalty (${record.missingReports || 0} missing @ €15)
                      </td>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #dc2626;">- ${(record.missingReportDeduction !== undefined ? record.missingReportDeduction : (record.missingReports || 0) * 200).toLocaleString()}</td>
                  </tr>`
                      : ""
                  }
                  ${
                    record.deductions > 0 &&
                    !record.absentDeduction &&
                    !record.missingReportDeduction &&
                    !record.missingReports
                      ? `
                  <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #dc2626;">
                          Deductions ${record.deductionReason ? `(${record.deductionReason})` : ""}
                          ${record.deductionDate ? `<div style='font-size:10px; color:#64748b'>On ${new Date(record.deductionDate).toLocaleDateString()}</div>` : ""}
                      </td>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #dc2626;">- ${record.deductions.toLocaleString()}</td>
                  </tr>`
                      : ""
                  }
                  ${
                    record.paidAmount > 0
                      ? `
                  <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #334155;">Amount Paid</td>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #334155;">${record.paidAmount.toLocaleString()}</td>
                  </tr>
                  <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; color: #334155;">Balance Due</td>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #dc2626;">${balance.toLocaleString()}</td>
                  </tr>
                  `
                      : ""
                  }
                  <tr style="background: #eff6ff;">
                      <td style="padding: 20px; font-weight: 700; font-size: 16px; color: #1e3a8a;">NET PAYABLE</td>
                      <td style="padding: 20px; text-align: right; font-weight: 800; font-size: 24px; color: #2563eb;">€${(record.netSalary || 0).toLocaleString()}</td>
                  </tr>
              </table>
          </div>

          <div style="margin-top: 50px; text-align: center; color: #cbd5e1; font-size: 11px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
              <p style="margin-bottom: 5px;">This is a system-generated payslip from HAT TECH MEDIA Portal.</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
      </div>
    `;

    const win = window.open("", "", "height=800, width=800");
    if (!win) {
      toast.error("Please allow popups to view/print payslip");
      return;
    }
    win.document.write(`
        <html>
            <head>
                <title>Payslip - ${record.employee?.name?.replace(/ User$/i, "")}</title>
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
                            filename: 'Payslip_${record.employee?.name?.replace(/ /g, "_")}_${record.month}.pdf',
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
  };

  // --- FILTERS ---
  const filteredEmployees = employees.filter((e) =>
    (e.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPayroll = payrolls.filter(
    (p) =>
      (p.employee?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) &&
      (activeTab === "salary" ? p.status !== "Paid" : p.status === "Paid")
  );

  return (
    <div className="space-y-6 pt-2 select-none animate-in fade-in duration-300 pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
            PAYROLL MANAGEMENT
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage staff salaries, process monthly disbursements, and view payslip history
          </p>
        </div>
        {activeTab !== "accounts" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
              Pay Period:{" "}
              {(() => {
                if (!month) return "";
                const [y, m] = month.split("-").map(Number);
                const prevDate = new Date(y, m - 2, 1);
                return prevDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
              })()}{" "}
              Performance
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`flex items-center gap-2 px-6 py-2.5 font-bold text-xs transition-all whitespace-nowrap rounded-xl cursor-pointer ${
            activeTab === "accounts"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <FiUser className="w-4 h-4" /> Accounts & Salary
        </button>
        <button
          onClick={() => setActiveTab("salary")}
          className={`flex items-center gap-2 px-6 py-2.5 font-bold text-xs transition-all whitespace-nowrap rounded-xl cursor-pointer ${
            activeTab === "salary"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <FiDollarSign className="w-4 h-4" /> Process Payroll
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex items-center gap-2 px-6 py-2.5 font-bold text-xs transition-all whitespace-nowrap rounded-xl cursor-pointer ${
            activeTab === "completed"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <FiCheckCircle className="w-4 h-4" /> Completed / History
        </button>
      </div>

      {/* SEARCH & ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative w-full sm:w-80 group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors w-4 h-4" />
          <input
            type="text"
            style={{ paddingLeft: "2.75rem" }}
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
          />
        </div>
        {activeTab === "salary" && (
          <button
            onClick={handleGenerate}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95"
          >
            <FiClock className="w-4 h-4" /> Generate for {month}
          </button>
        )}
      </div>

      {/* CONTENT TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
                {/* --- ACCOUNTS TAB --- */}
                {activeTab === "accounts" &&
                  (filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-slate-400 font-medium">
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-slate-50/70 transition-colors">
                        <td
                          className="px-6 py-4 font-bold text-slate-900 cursor-pointer hover:underline"
                          onClick={() => handleViewHistory(emp._id, emp.name)}
                        >
                          {typeof emp.name === 'string' ? emp.name.replace(/ User$/i, "") : "Employee"}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {typeof emp.department === 'string' ? emp.department : (emp.department?.name || "General")}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {typeof emp.position === 'string' ? emp.position : (emp.position?.title || "Staff")}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          €{(emp.salary || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-[11px] text-slate-600">
                          {emp.bankDetails?.bankName ? (
                            <>
                              <div className="font-bold text-slate-800">{String(emp.bankDetails.bankName)}</div>
                              <div className="font-mono text-slate-500 text-[10px]">{String(emp.bankDetails.accountNumber || '')}</div>
                            </>
                          ) : (
                            <span className="text-rose-500 font-semibold">Not Set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleOpenSettings(emp)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ))}

                {/* --- SALARY (Pending) & COMPLETED TABS --- */}
                {activeTab !== "accounts" &&
                  (filteredPayroll.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-slate-400 font-medium">
                        {activeTab === "salary"
                          ? `No pending payroll records for ${month}. Click "Generate for ${month}" to initialize.`
                          : `No completed payroll records found for ${month}.`}
                      </td>
                    </tr>
                  ) : (
                    filteredPayroll.map((record) => (
                      <tr key={record._id} className="hover:bg-slate-50/70 transition-colors">
                        <td
                          className="px-6 py-4 font-bold text-slate-900 cursor-pointer hover:underline"
                          onClick={() =>
                            record.employee && handleViewHistory(record.employee?._id, record.employee?.name)
                          }
                        >
                          {record.employee?.name ? (
                            record.employee.name.replace(/ User$/i, "")
                          ) : (
                            <span className="text-rose-500 italic font-bold">
                              Deleted Employee ({typeof record.employee === 'string' ? record.employee : (record.employee?._id || String(record._id || ''))})
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {typeof record.employee?.department === 'string' ? record.employee.department : (record.employee?.department?.name || "Orphaned Entry")}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">
                          €{(record.basicSalary || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5 text-[11px]">
                            {record.bonus > 0 && (
                              <div className="text-emerald-600 font-bold">
                                +{record.bonus.toLocaleString()} {record.bonusReason && `(${record.bonusReason})`}
                              </div>
                            )}
                            {record.deductions > 0 && (
                              <div className="text-rose-600 font-bold">
                                -{record.deductions.toLocaleString()}{" "}
                                {record.deductionReason && `(${record.deductionReason})`}
                              </div>
                            )}
                            {record.missingReports > 0 && (
                              <div className="text-amber-600 font-medium text-[10px]">
                                {record.missingReports} missed rpt (-€{" "}
                                {(record.missingReportDeduction !== undefined
                                  ? record.missingReportDeduction
                                  : record.missingReports * 200
                                ).toLocaleString()}
                                )
                              </div>
                            )}
                            {record.bonus === 0 &&
                              record.deductions === 0 &&
                              (!record.missingReports || record.missingReports === 0) && (
                                <span className="text-slate-400">-</span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-slate-900 text-sm">
                          €{(record.netSalary || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              record.status === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : record.status === "Partial"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {record.status}
                          </span>
                          {record.paidAmount > 0 && (
                            <div className="text-[10px] text-slate-500 mt-1 font-mono">
                              <div>Paid: {record.paidAmount.toLocaleString()}</div>
                              {record.netSalary - record.paidAmount > 0 && (
                                <div className="text-rose-600 font-bold">
                                  Bal: {(record.netSalary - record.paidAmount).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 flex items-center justify-center gap-1.5">
                          {/* SALARY TAB ACTIONS */}
                          {activeTab === "salary" && (
                            <>
                              <button
                                onClick={() => handleOpenManage(record)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              >
                                Proceed
                              </button>
                              {!record.employee && (
                                <button
                                  onClick={() => handleDeleteRecord(record._id)}
                                  className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition cursor-pointer"
                                  title="Cleanup Corrupted Record"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              )}
                              {record.employee && (
                                <button
                                  onClick={() => handlePrint(record)}
                                  className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition shadow-2xs cursor-pointer"
                                  title="Print/Download Slip"
                                >
                                  <FiPrinter size={13} />
                                </button>
                              )}
                            </>
                          )}

                          {/* COMPLETED TAB ACTIONS */}
                          {activeTab === "completed" && (
                            <>
                              <button
                                onClick={() => handleOpenManage(record)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handlePrint(record)}
                                className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition shadow-2xs cursor-pointer"
                                title="Print Slip"
                              >
                                <FiPrinter size={13} />
                              </button>
                              <button
                                onClick={() => handleSendEmail(record._id)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-2xs cursor-pointer"
                                title="Send Email"
                              >
                                <FiFileText size={13} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MANAGE PAYROLL MODAL */}
      <AnimatePresence>
        {manageModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-200"
            >
              <button
                onClick={() => setManageModal({ show: false, record: null })}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-black mb-4 text-slate-900 uppercase tracking-tight">
                Process Payroll
              </h2>

              {/* ATTENDANCE & SALARY BREAKDOWN SUMMARY CARD */}
              {manageModal.record && (
                <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl mb-4 text-xs space-y-2">
                  <div className="flex justify-between font-bold border-b border-blue-200/60 pb-2 mb-2">
                    <span className="text-blue-900 font-black">{manageModal.record.employee?.name}</span>
                    <span className="text-blue-600">{manageModal.record.employee?.position || "Staff"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-500">Base Salary:</span>{" "}
                      <span className="font-bold text-slate-800">
                        €{(Number(manageValues.basicSalary) || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Daily Salary (30d):</span>{" "}
                      <span className="font-bold text-slate-800">
                        €{Math.round((Number(manageValues.basicSalary) || 0) / 30).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Total Absents:</span>{" "}
                      <span className="font-bold text-rose-600">{manageModal.record.absentDays || 0} days</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Approved Leaves:</span>{" "}
                      <span className="font-bold text-emerald-600">{manageModal.record.leaveDays || 0} days</span>
                    </div>
                    {manageModal.record.lateDays > 0 && (
                      <div className="col-span-2 text-amber-700 font-medium">
                        ⚠️ Late Marks: {manageModal.record.lateDays} days (
                        {Math.floor(manageModal.record.lateDays / 3)} absents added)
                      </div>
                    )}
                  </div>
                  <div className="border-t border-blue-200/60 pt-2 flex justify-between items-center text-[11px] font-bold">
                    <span className="text-rose-700">Absent Deduction:</span>
                    <span className="text-rose-700">
                      - €{" "}
                      {Math.round(
                        (manageModal.record.absentDays || 0) *
                          ((Number(manageValues.basicSalary) || 0) / 30)
                      ).toLocaleString()}
                    </span>
                  </div>
                  {(manageModal.record.missingReports > 0 ||
                    manageModal.record.missingReportDeduction > 0) && (
                    <div className="border-t border-blue-200/60 pt-2 flex justify-between items-center text-[11px] font-bold">
                      <span className="text-amber-800">
                        Missing Daily Reports Penalty ({manageModal.record.missingReports || 0} @ €15):
                      </span>
                      <span className="text-amber-800">
                        - €{" "}
                        {(manageModal.record.missingReportDeduction !== undefined
                          ? manageModal.record.missingReportDeduction
                          : (manageModal.record.missingReports || 0) * 200
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {Number(manageValues.otherDeductions) > 0 && (
                    <div className="flex justify-between items-center text-[11px] font-bold text-rose-600">
                      <span>{manageValues.deductionReason || "Other Deduction"}:</span>
                      <span>- €{Number(manageValues.otherDeductions).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(manageValues.bonus) > 0 && (
                    <div className="flex justify-between items-center text-[11px] font-bold text-emerald-600">
                      <span>Bonus Incentive ({manageValues.bonusReason || "Bonus"}):</span>
                      <span>+ €{Number(manageValues.bonus).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs font-black border-t border-blue-200 pt-2 text-blue-950">
                    <span>Calculated Net Pay:</span>
                    <span>
                      €{" "}
                      {Math.max(
                        0,
                        (Number(manageValues.basicSalary) || 0) -
                          Math.round(
                            (manageModal.record.absentDays || 0) *
                              ((Number(manageValues.basicSalary) || 0) / 30)
                          ) -
                          (manageModal.record.missingReportDeduction !== undefined
                            ? Number(manageModal.record.missingReportDeduction)
                            : (Number(manageModal.record.missingReports) || 0) * 200) +
                          (Number(manageValues.bonus) || 0) -
                          (Number(manageValues.otherDeductions) || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* EMPLOYEE BANK & ACCOUNT DETAILS CARD */}
              {manageModal.record &&
                (() => {
                  const emp = manageModal.record.employee || {};
                  const bankName = emp.bankDetails?.bankName || emp.bankName || "Not Set";
                  const accountHolder =
                    emp.bankDetails?.accountHolder || emp.accountHolder || emp.name || "N/A";
                  const accountNumber = emp.bankDetails?.accountNumber || emp.accountNumber || "N/A";

                  return (
                    <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl mb-4 text-xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <span className="font-black text-emerald-900 uppercase tracking-wide text-[11px]">
                          🏦 Employee Bank Account Details
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {bankName}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                        <div>
                          <span className="text-slate-500 block text-[10px] font-semibold">Account Title:</span>
                          <span className="font-bold text-slate-900">{accountHolder}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] font-semibold">Bank Name:</span>
                          <span className="font-bold text-slate-900">{bankName}</span>
                        </div>
                        <div className="col-span-2 flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200">
                          <div>
                            <span className="text-slate-500 block text-[10px] font-semibold">Account / IBAN:</span>
                            <span className="font-mono font-bold text-emerald-800 text-xs">
                              {accountNumber}
                            </span>
                          </div>
                          {accountNumber !== "N/A" && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(accountNumber);
                                toast.success("Account Number Copied!");
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <FiCopy size={11} /> Copy
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bonus Amount</label>
                  <input
                    type="number"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    value={manageValues.bonus}
                    onChange={(e) => setManageValues({ ...manageValues, bonus: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bonus Date</label>
                  <input
                    type="date"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    value={manageValues.bonusDate}
                    onChange={(e) => setManageValues({ ...manageValues, bonusDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bonus Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Eid Bonus / Overtime Reward"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  value={manageValues.bonusReason}
                  onChange={(e) => setManageValues({ ...manageValues, bonusReason: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Deduction Amount</label>
                  <input
                    type="number"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    value={manageValues.otherDeductions}
                    onChange={(e) =>
                      setManageValues({
                        ...manageValues,
                        deductions: e.target.value,
                        otherDeductions: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Deduction Date</label>
                  <input
                    type="date"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    value={manageValues.deductionDate}
                    onChange={(e) =>
                      setManageValues({ ...manageValues, deductionDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mb-4 pb-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deduction Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Loan Repayment / Advance Salary"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  value={manageValues.deductionReason}
                  onChange={(e) =>
                    setManageValues({ ...manageValues, deductionReason: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setManageModal({ show: false, record: null })}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveManage}
                  disabled={isSaving}
                  className={`px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-500/20 cursor-pointer ${
                    isSaving ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
                  }`}
                >
                  {isSaving ? "Processing..." : "✓ Mark as Salary Paid"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPDATE EMPLOYEE SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200"
            >
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-black mb-1 text-slate-900 uppercase tracking-tight">
                Update Employee Accounts
              </h2>
              <p className="text-xs text-slate-500 mb-4">{selectedEmployee?.name}</p>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Base Monthly Salary (EUR)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    value={employeeSettings.salary}
                    onChange={(e) =>
                      setEmployeeSettings({ ...employeeSettings, salary: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Meezan Bank, HBL, UBL"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    value={employeeSettings.bankName}
                    onChange={(e) =>
                      setEmployeeSettings({ ...employeeSettings, bankName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Account Holder</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    value={employeeSettings.accountHolder}
                    onChange={(e) =>
                      setEmployeeSettings({ ...employeeSettings, accountHolder: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Account Number / IBAN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PK00MEZN0000000000000000"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    value={employeeSettings.accountNumber}
                    onChange={(e) =>
                      setEmployeeSettings({ ...employeeSettings, accountNumber: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className={`px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-500/20 cursor-pointer ${
                    isSavingSettings ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
                  }`}
                >
                  {isSavingSettings ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HISTORY MODAL */}
      <AnimatePresence>
        {historyModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-4xl rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-200"
            >
              <button
                onClick={() => setHistoryModal({ ...historyModal, show: false })}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-black mb-1 text-slate-900 uppercase tracking-tight">
                Payroll History
              </h2>
              <p className="text-xs text-slate-500 mb-6">{historyModal.employeeName}</p>

              {loadingHistory ? (
                <div className="py-12 flex justify-center items-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Month</th>
                        <th className="px-6 py-3.5">Basic</th>
                        <th className="px-6 py-3.5">Net Salary</th>
                        <th className="px-6 py-3.5">Paid</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyModal.records.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-medium">
                            No history records found.
                          </td>
                        </tr>
                      ) : (
                        historyModal.records.map((record) => (
                          <tr key={record._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-3.5 font-bold text-slate-900">{record.month}</td>
                            <td className="px-6 py-3.5 text-slate-600">
                              €{(record.basicSalary || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-3.5 font-black text-slate-900">
                              €{(record.netSalary || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-3.5 text-slate-600">
                              €{(record.paidAmount || 0).toLocaleString()}
                              {record.paymentDate && (
                                <div className="text-[10px] text-slate-400">
                                  {new Date(record.paymentDate).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  record.status === "Paid"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 flex items-center justify-center gap-2">
                              <button
                                onClick={() => setPayslipModal({ show: true, record })}
                                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-2xs cursor-pointer"
                                title="View Details"
                              >
                                <FiDownload size={13} />
                              </button>
                              <button
                                onClick={() => handlePrint(record)}
                                className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition shadow-2xs cursor-pointer"
                                title="Print Slip"
                              >
                                <FiPrinter size={13} />
                              </button>
                              <button
                                onClick={() => handleSendEmail(record._id)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-2xs cursor-pointer"
                                title="Send Email"
                              >
                                <FiFileText size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setHistoryModal({ ...historyModal, show: false })}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYSLIP DETAIL MODAL */}
      <AnimatePresence>
        {payslipModal.show && payslipModal.record && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-200"
            >
              <button
                onClick={() => setPayslipModal({ show: false, record: null })}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Payslip Details</h2>
                <p className="text-slate-500 text-xs font-medium">{payslipModal.record.month}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Basic Salary</p>
                    <p className="font-bold text-slate-900">
                      €{(payslipModal.record.basicSalary || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Net Salary</p>
                    <p className="font-black text-blue-700">
                      €{(payslipModal.record.netSalary || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Status</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        payslipModal.record.status === "Paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {payslipModal.record.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Paid Date</p>
                    <p className="font-medium text-slate-900">
                      {payslipModal.record.paymentDate
                        ? new Date(payslipModal.record.paymentDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-slate-500">Bonus</span>
                    <span className="text-emerald-600 font-bold">
                      + {(payslipModal.record.bonus || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-slate-500">Deductions</span>
                    <span className="text-rose-600 font-bold">
                      - {(payslipModal.record.deductions || 0).toLocaleString()}
                    </span>
                  </div>
                  {payslipModal.record.paidAmount > 0 && (
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-slate-500">Amount Paid</span>
                      <span className="text-slate-900 font-bold">
                        {(payslipModal.record.paidAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handlePrint(payslipModal.record)}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FiPrinter className="w-4 h-4" /> Print / Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollPage;
