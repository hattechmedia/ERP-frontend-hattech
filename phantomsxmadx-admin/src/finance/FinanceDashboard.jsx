import React, { useState, useEffect, useRef } from 'react';
import { 
  FiTrendingUp, FiTrendingDown, FiDollarSign, 
  FiActivity, FiPieChart, FiArrowUpRight, FiArrowDownRight, 
  FiArrowRight, FiDownload, FiFileText, FiSearch, FiUser,
  FiPlus, FiCalendar, FiCheckCircle, FiClock, FiTag, FiX,
  FiChevronDown
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCurrency } from '../contexts/CurrencyContext';
import XLSX from 'xlsx-js-style';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const FinanceDashboard = () => {
    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedYear, setSelectedYear] = useState(() => {
        const saved = localStorage.getItem('finance_dashboard_year');
        return (saved !== null && !isNaN(parseInt(saved))) ? parseInt(saved) : new Date().getFullYear();
    });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('finance_dashboard_tab') || "balanceSheet";
    });
    const [ledgerSearch, setLedgerSearch] = useState("");
    const [ledgerFilter, setLedgerFilter] = useState("All");
    const [saving, setSaving] = useState(false);
    
    // Custom Dropdown States
    const [isMonthOpen, setIsMonthOpen] = useState(false);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(() => localStorage.getItem('finance_dashboard_startDate') || '');
    const [customEndDate, setCustomEndDate] = useState(() => localStorage.getItem('finance_dashboard_endDate') || '');

    const [quickCurrency, setQuickCurrency] = useState("PKR");
    const [usdRate, setUsdRate] = useState(278);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.period-dropdown-container')) {
                setIsMonthOpen(false);
                setIsYearOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        const cached = sessionStorage.getItem('cached_usd_rate');
        if (cached) {
            setUsdRate(parseFloat(cached));
        } else {
            fetch('https://open.er-api.com/v6/latest/USD')
                .then(res => res.json())
                .then(data => {
                    if (data && data.rates && data.rates.PKR) {
                        sessionStorage.setItem('cached_usd_rate', data.rates.PKR);
                        setUsdRate(data.rates.PKR);
                    }
                })
                .catch(err => console.error("Failed to fetch USD rate", err));
        }
    }, []);
    
    // Quick Entry Form Data
    const [quickFormData, setQuickFormData] = useState({
        type: 'Income', // Income or Expense
        status: 'Received', // Received, Pending, Paid, Unpaid
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Onetime Service',
        source: '', // source for income, item for expense
        entity: '', // payerName for income, recipient for expense
        description: '',
        clientEmail: '',
        monthlyDate: ''
    });

    const incomeCategories = ['Onetime Service', 'Monthly digital Subscription', 'SAAS Subscription', 'Maintainence Support Payment', 'Project Sale'];
    const expenseCategories = ['Charity', 'Other', 'Reserve', 'Business Expense', 'Rent', 'Bill', 'Hardware', 'Software', 'Snacks', 'Travel', 'Marketing', 'Tea', 'Loan'];

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = [2024, 2025, 2026];

    const componentRef = useRef();

    const handleExcelExport = () => {
        if (!stats?.detailed) return toast.error("No data available to export");
        const wb = XLSX.utils.book_new();
        
        // Prepare professional Audit Report rows
        const reportData = [
            ["HAT TECH MEDIA - OFFICIAL FINANCIAL AUDIT"],
            [`PERIOD: ${months[selectedMonth].toUpperCase()} ${selectedYear}`],
            [`GENERATED ON: ${new Date().toLocaleString().toUpperCase()}`],
            [],
            ["I. EXECUTIVE FINANCIAL SUMMARY"],
            ["TOTAL INCOME", "TOTAL EXPENSES", "LABOR (PAYROLL)", "NET PROFIT/LOSS"],
            [stats.totalIncome, stats.totalExpense, stats.totalPayroll, stats.netProfit],
            [],
            ["II. TRANSACTION LEDGER DETAILS"],
            ["DATE", "DESCRIPTION", "CATEGORY", "ENTITY/CLIENT", "IN (PKR)", "OUT (PKR)", "TYPE"]
        ];

        // Add detailed rows
        const transactions = [
            ...stats.detailed.income.map(i => [
                new Date(i.date).toLocaleDateString(), 
                i.source.toUpperCase(), 
                i.category.toUpperCase(), 
                (i.payerName || 'Direct').toUpperCase(), 
                i.amount, 
                0, 
                "REVENUE"
            ]),
            ...stats.detailed.expenses.map(e => [
                new Date(e.date).toLocaleDateString(), 
                e.item.toUpperCase(), 
                e.category.toUpperCase(), 
                (e.performedBy || e.debtorName || 'Direct').toUpperCase(), 
                0, 
                e.amount, 
                "EXPENSE"
            ]),
            ...stats.detailed.payroll.map(p => [
                new Date(p.paymentDate || p.createdAt).toLocaleDateString(), 
                `PAYROLL: ${p.employee?.name || 'STAFF'}`.toUpperCase(), 
                "PAYROLL", 
                (p.employee?.name || 'STAFF').toUpperCase(), 
                0, 
                p.paidAmount || p.netSalary, 
                "LABOR"
            ])
        ].sort((a,b) => new Date(b[0]) - new Date(a[0]));

        const combinedData = [
            ...reportData, 
            ...transactions,
            [],
            ["III. END OF AUDIT REPORT"],
            ["Total Transaction Count:", transactions.length, "", "", "", "", ""],
            ["Final Settlement Value:", stats.netProfit, "", "", "", "", ""]
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(combinedData);

        // --- MERGE CELLS FOR HEADER ---
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title merge A1:G1
            { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Period merge A2:G2
            { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }  // Timestamp merge A3:G3
        ];

        // --- APPLY STYLES ---
        
        // Main Title Box (A1:G1 area)
        const headerStyle = {
            fill: { fgColor: { rgb: "004AAD" } },
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 16 },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "medium", color: { rgb: "000000" } },
                bottom: { style: "medium", color: { rgb: "000000" } },
                left: { style: "medium", color: { rgb: "000000" } },
                right: { style: "medium", color: { rgb: "000000" } }
            }
        };

        // Apply style to the lead cell of merges (SheetJS convention)
        ws['A1'].s = headerStyle;
        ws['A2'].s = { ...headerStyle, sz: 11, fill: { fgColor: { rgb: "1e293b" } } };
        ws['A3'].s = { ...headerStyle, sz: 9, fill: { fgColor: { rgb: "334155" } } };

        // Section Headers (I, II, III)
        const sectionStyle = {
            font: { bold: true, sz: 11, color: { rgb: "004AAD" } },
            fill: { fgColor: { rgb: "E2E8F0" } },
            border: { bottom: { style: "thin", color: { rgb: "004AAD" } } }
        };

        ["A5", "A9", "A" + (reportData.length + transactions.length + 2)].forEach(cell => {
            if (ws[cell]) ws[cell].s = sectionStyle;
        });

        // Summary Table Headers (Row 6)
        const summaryHeadStyle = {
            fill: { fgColor: { rgb: "004AAD" } },
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 10 },
            alignment: { horizontal: "center" },
            border: { all: { style: "thin", color: { rgb: "FFFFFF" } } }
        };
        ["A6", "B6", "C6", "D6"].forEach(cell => {
            if (ws[cell]) ws[cell].s = summaryHeadStyle;
        });

        // Transaction Table Headers (Row 10)
        const tableHeadStyle = {
            fill: { fgColor: { rgb: "334155" } },
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 9 },
            alignment: { horizontal: "center" },
            border: { all: { style: "thin", color: { rgb: "475569" } } }
        };
        ["A10", "B10", "C10", "D10", "E10", "F10", "G10"].forEach(cell => {
            if (ws[cell]) ws[cell].s = tableHeadStyle;
        });

        // Column Widths
        ws['!cols'] = [
            {wch: 15}, {wch: 45}, {wch: 22}, {wch: 32}, {wch: 18}, {wch: 18}, {wch: 18}
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Financial Audit");
        XLSX.writeFile(wb, `Audit_Report_${months[selectedMonth]}_${selectedYear}.xlsx`);
    };

    useEffect(() => {
        localStorage.setItem('finance_dashboard_month', selectedMonth);
        localStorage.setItem('finance_dashboard_year', selectedYear);
        localStorage.setItem('finance_dashboard_tab', activeTab);
        localStorage.setItem('finance_dashboard_startDate', customStartDate);
        localStorage.setItem('finance_dashboard_endDate', customEndDate);
    }, [selectedMonth, selectedYear, activeTab, customStartDate, customEndDate]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            let url = `/finance/stats?month=${selectedMonth}&year=${selectedYear}`;
            if (customStartDate && customEndDate) {
                url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
            }
            const res = await api.get(url);
            setStats(res.data.stats);
        } catch (err) {
            console.error("Finance Dashboard Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setHasMounted(true);
        // Only refetch when both custom dates are set, or both are empty
        const bothDatesSet = customStartDate && customEndDate;
        const bothDatesEmpty = !customStartDate && !customEndDate;
        if (bothDatesSet || bothDatesEmpty) {
            fetchStats();
        }

        const handleUpdate = () => fetchStats();
        window.addEventListener('financeRecordUpdated', handleUpdate);
        return () => window.removeEventListener('financeRecordUpdated', handleUpdate);
    }, [selectedMonth, selectedYear, customStartDate, customEndDate]);

    const formatAmount = (amount) => {
        return `PKR ${amount.toLocaleString()}`;
    };

    const handleQuickSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const isIncome = quickFormData.type === 'Income';
            const endpoint = isIncome ? '/finance/income' : '/finance/expense';
            
            const enteredAmt = parseFloat(quickFormData.amount);
            const finalAmount = quickCurrency === 'USD' ? enteredAmt * usdRate : enteredAmt;
            const finalDesc = quickCurrency === 'USD'
                ? `${quickFormData.description || ""}\n[Converted from $${quickFormData.amount} USD at rate ${usdRate} PKR/USD]`.trim()
                : quickFormData.description;

            // Map generic form to specific model fields
            const payload = isIncome ? {
                source: quickFormData.source,
                amount: finalAmount,
                date: quickFormData.date,
                category: quickFormData.category,
                status: quickFormData.status,
                payerName: quickFormData.entity,
                description: finalDesc,
                paymentMethod: 'Transfer', // Default
                clientEmail: quickFormData.clientEmail,
                monthlyDate: quickFormData.monthlyDate
            } : {
                item: quickFormData.source,
                amount: finalAmount,
                date: quickFormData.date,
                category: quickFormData.category,
                status: quickFormData.status,
                recipient: quickFormData.entity,
                description: finalDesc,
                paymentMethod: 'Cash' // Default
            };

            const res = await api.post(endpoint, payload);
            if (res.data.success) {
                const entryDate = new Date(quickFormData.date);
                const isCorrectMonth = entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;

                toast.success(`${quickFormData.type} recorded successfully`);
                
                if (!isCorrectMonth) {
                    toast.info(`Note: You are viewing ${months[selectedMonth]}, but this record was added to ${months[entryDate.getMonth()]}.`, { duration: 6000 });
                }

                setQuickFormData({
                    type: isIncome ? 'Income' : 'Expense',
                    status: isIncome ? 'Received' : 'Paid',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    category: isIncome ? 'Onetime Service' : 'Other',
                    source: '',
                    entity: '',
                    description: '',
                    clientEmail: '',
                    monthlyDate: ''
                });
                setQuickCurrency('PKR');
                fetchStats(); // Refresh dashboard
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to record transaction");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;

    const remainingPayroll = Math.max(0, (stats?.totalPayroll || 0) - (stats?.paidPayroll || 0));

    const summaryCards = [
        { 
            title: 'Income', 
            val: formatAmount(stats?.totalIncome || 0), 
            icon: <FiTrendingUp />, 
            color: '#004AAD', 
            gradient: 'from-blue-600 to-[#004AAD]',
            trend: '+12.5%', 
            isUp: true,
            path: '/finance/cashflow'
        },
        { 
            title: 'Payrolls', 
            val: formatAmount(remainingPayroll), 
            icon: <FiActivity />, 
            color: '#3b82f6', 
            gradient: 'from-sky-400 to-blue-500',
            trend: '-0.8%', 
            isUp: true,
            path: '/finance/payroll'
        },
        { 
            title: 'Accounts Receivable (AR)', 
            val: formatAmount(stats?.totalReceivable || stats?.pendingIncome || 0), 
            icon: <FiArrowUpRight />, 
            color: '#F59E0B', 
            gradient: 'from-amber-500 to-orange-600',
            trend: '+8.1%', 
            isUp: true,
            path: '/finance/cashflow'
        },
        { 
            title: 'Accounts Payable (AP)', 
            val: formatAmount(stats?.totalPayable || stats?.unpaidExpense || 0), 
            icon: <FiArrowDownRight />, 
            color: '#ef4444', 
            gradient: 'from-rose-500 to-red-600',
            trend: '-2.4%', 
            isUp: false,
            path: '/finance/cashflow'
        },
        { 
            title: 'Net Profit', 
            val: formatAmount(stats?.netProfit || 0), 
            icon: <FiDollarSign />, 
            color: '#004AAD', 
            gradient: 'from-[#004AAD] to-indigo-700',
            trend: '+18.1%', 
            isUp: true,
            path: '/finance/statement'
        },
    ];

    return (
        <div className="space-y-8 pb-20">
             {/* HEADER */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#004AAD] rounded-l-[40px]" />
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter leading-none">HATTECH FINANCE</h2>
                </div>
                
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex bg-[#15102a] hover:bg-[#1f1a3a] text-white p-1.5 rounded-2xl border border-white/10 h-14 items-center gap-2 shadow-xl transition-all period-dropdown-container force-text-white">
                        <FiCalendar className="ml-3 text-white force-text-white" size={18} />
                        <div className="relative w-36">
                            <button 
                                type="button"
                                onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }}
                                className="bg-transparent text-[11px] font-black uppercase text-white px-3 py-2 outline-none cursor-pointer w-full flex items-center justify-between gap-1 select-none force-text-white"
                            >
                                {selectedMonth === 'all' ? 'GENERAL (ALL)' : months[selectedMonth]}
                                <FiChevronDown size={16} className={`transition-transform duration-200 ${isMonthOpen ? 'rotate-180' : ''} force-text-white`} />
                            </button>
                            {isMonthOpen && (
                                <div className="absolute top-full left-0 mt-3 py-2 w-full bg-[#15102a] border border-white/10 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedMonth('all');
                                            setIsMonthOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-[11px] font-black uppercase transition-colors duration-150 ${
                                            selectedMonth === 'all' ? "bg-[#004AAD] force-text-white" : "force-text-gray hover:bg-[#004AAD] hover:force-text-white"
                                        }`}
                                    >
                                        GENERAL (ALL)
                                    </button>
                                    {months.map((m, i) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => {
                                                setSelectedMonth(i);
                                                setIsMonthOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-[11px] font-black uppercase transition-colors duration-150 ${
                                                selectedMonth === i ? "bg-[#004AAD] force-text-white" : "force-text-gray hover:bg-[#004AAD] hover:force-text-white"
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="h-6 w-px bg-white/20" />
                        <div className="relative w-24">
                            <button 
                                type="button"
                                onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }}
                                className="bg-transparent text-[11px] font-black uppercase text-white px-3 py-2 outline-none cursor-pointer w-full flex items-center justify-between gap-1 select-none force-text-white"
                            >
                                {selectedYear}
                                <FiChevronDown size={16} className={`transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''} force-text-white`} />
                            </button>
                            {isYearOpen && (
                                <div className="absolute top-full left-0 mt-3 py-2 w-full bg-[#15102a] border border-white/10 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                                    {years.map(y => (
                                        <button
                                            key={y}
                                            type="button"
                                            onClick={() => {
                                                setSelectedYear(y);
                                                setIsYearOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-[11px] font-black uppercase transition-colors duration-150 ${
                                                selectedYear === y ? "bg-[#004AAD] force-text-white" : "force-text-gray hover:bg-[#004AAD] hover:force-text-white"
                                            }`}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CUSTOM DATE RANGE FILTER */}
                    <div className="flex items-center gap-2 bg-[#15102a] hover:bg-[#1f1a3a] px-4 h-14 rounded-2xl border border-white/10 text-xs font-bold text-white shadow-xl">
                        <FiCalendar size={16} className="text-[#004AAD] shrink-0" />
                        <span className="text-[10px] uppercase font-black text-white/70 whitespace-nowrap">Custom:</span>
                        <input 
                            type="date" 
                            value={customStartDate} 
                            onChange={e => setCustomStartDate(e.target.value)} 
                            className="bg-transparent outline-none text-[11px] uppercase font-bold text-white cursor-pointer border-none"
                            style={{ colorScheme: 'dark' }}
                        />
                        <span className="opacity-40">-</span>
                        <input 
                            type="date" 
                            value={customEndDate} 
                            onChange={e => setCustomEndDate(e.target.value)} 
                            className="bg-transparent outline-none text-[11px] uppercase font-bold text-white cursor-pointer border-none"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
 
                    <button 
                        onClick={handleExcelExport}
                        className="h-14 bg-[#15102a] hover:bg-[#1f1a3a] text-white px-6 rounded-2xl font-black text-[12px] uppercase tracking-widest border border-white/10 shadow-xl transition-all flex items-center gap-2 active:scale-95 force-text-white whitespace-nowrap"
                    >
                        <FiDownload className="force-text-white" /> Export
                    </button>
                </div>
            </div>

            {/* STAT CARDS - All 5 in a Single Horizontal Line */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {summaryCards.map((card, index) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
                        key={card.title}
                        onClick={() => navigate(card.path)}
                        className="relative bg-[var(--bg-card)] p-5 rounded-[24px] border border-[var(--bg-inner)] overflow-hidden group hover:border-[#004AAD] transition-all shadow-xl hover:shadow-[#004AAD]/20 flex flex-col justify-between cursor-pointer active:scale-95"
                    >
                        {/* Decorative Gradient Background Pattern */}
                        <div className={`absolute -right-10 -top-10 w-28 h-28 bg-gradient-to-br ${card.gradient} opacity-[0.03] group-hover:opacity-[0.08] rounded-full transition-all duration-500 transform group-hover:scale-150`} />

                        <div className="flex items-center justify-between mb-4 relative">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg transition-transform group-hover:scale-110 duration-500 text-lg`}>
                                {card.icon}
                            </div>
                            <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full ${card.isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} backdrop-blur-sm`}>
                                {card.isUp ? <FiArrowUpRight size={12} /> : <FiArrowDownRight size={12} />}
                                {card.trend}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[var(--text-secondary)] text-[9px] uppercase font-black tracking-[0.15em] mb-1 truncate">{card.title}</h4>
                            <p className="text-xl font-black text-[var(--text-primary)] tracking-tight truncate">{card.val}</p>
                            <p className="text-[8px] font-bold text-[#004AAD] uppercase mt-1">Click to view details →</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* AGENCY PERCENTAGE DISTRIBUTION SUMMARY */}
            <div className="bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight uppercase flex items-center gap-2">
                            Agency Distribution (Revenue Split)
                        </h3>
                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-1 opacity-60">Auto-Calculated Percentage Allocation</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                        Automatic Allocation
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#004AAD]/10 p-6 rounded-3xl border border-[#004AAD]/20 text-center">
                        <p className="text-4xl font-black text-[#004AAD] tracking-tight">35%</p>
                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mt-2 tracking-widest">Business Expenses</p>
                        <p className="text-xs font-bold text-[var(--text-primary)] mt-1">
                            PKR {((stats?.totalIncome || 0) * 0.35).toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20 text-center">
                        <p className="text-4xl font-black text-amber-500 tracking-tight">15%</p>
                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mt-2 tracking-widest">Company Reserve</p>
                        <p className="text-xs font-bold text-[var(--text-primary)] mt-1">
                            PKR {((stats?.totalIncome || 0) * 0.15).toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-pink-500/10 p-6 rounded-3xl border border-pink-500/20 text-center">
                        <p className="text-4xl font-black text-pink-500 tracking-tight">4%</p>
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase mt-2 tracking-widest">Charity Pool Remaining</p>
                        <p className="text-xs font-bold text-[var(--text-primary)] mt-1">
                            PKR {(stats?.charityPoolRemaining ?? ((stats?.totalIncome || 0) * 0.04)).toLocaleString()}
                        </p>
                        <p className="text-[8px] font-bold text-pink-400 mt-0.5">
                            (Allocated: PKR {((stats?.totalIncome || 0) * 0.04).toLocaleString()})
                        </p>
                    </div>
                </div>
            </div>

            {/* CHARTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CASHFLOW PULSE GRAPH */}
                <div className="bg-[var(--bg-card)] p-10 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl relative overflow-hidden flex flex-col min-h-[500px] lg:col-span-2">
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight uppercase">Cashflow Pulse</h3>
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] mt-1">Interconnected Performance Dynamics</p>
                        </div>
                    </div>
                    <div className="h-[360px] min-h-[360px] relative z-10 w-full">
                        {hasMounted && (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={1}>
                                <BarChart data={stats?.chartData || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--bg-inner)" opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 900}} dy={15} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 900}} />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ 
                                            backgroundColor: 'var(--bg-card)', 
                                            borderRadius: '24px', 
                                            border: '1px solid var(--bg-inner)', 
                                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
                                            padding: '20px',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                        itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}
                                    />
                                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', tracking: '0.1em' }} wrapperClassName="period-dropdown-container" />
                                    <Bar dataKey="revenue" fill="#004AAD" radius={[6, 6, 0, 0]} name="INCOME" />
                                    <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} name="EXPENSE" />
                                    <Bar dataKey="profit" fill="#10b981" radius={[6, 6, 0, 0]} name="PROFIT" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* PIE ALLOCATION */}
                <div className="bg-[var(--bg-card)] p-10 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden lg:col-span-1 min-h-[500px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#004AAD]/50 to-transparent opacity-20" />
                    <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase mb-2">Cost Distribution</h3>
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-6 opacity-60">Operational Breakdown</p>
                    
                    <div className="relative w-full h-[220px] min-h-[220px] flex items-center justify-center">
                        <div className="absolute flex flex-col items-center justify-center z-10">
                            <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-80">Net Profit</span>
                            <span className="text-sm font-black text-[var(--text-primary)] mt-1 tracking-tight">{formatAmount(stats?.netProfit || 0)}</span>
                        </div>
                        {hasMounted && (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={1}>
                            <PieChart>
                                <Pie
                                    data={stats?.financialBreakdown || [{ name: 'No Data', value: 1 }]}
                                    innerRadius={72}
                                    outerRadius={88}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats?.financialBreakdown?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'var(--bg-card)', 
                                        borderRadius: '16px', 
                                        border: '1px solid var(--bg-inner)',
                                        fontSize: '11px',
                                        fontWeight: 900
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2.5 mt-6 w-full px-4">
                        {stats?.financialBreakdown?.map((item) => (
                            <div key={item.name} className="flex items-center justify-between gap-3 border-b border-[var(--bg-inner)]/40 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
                                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase truncate tracking-widest">{item.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-[var(--text-primary)]">PKR {item.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default FinanceDashboard;
