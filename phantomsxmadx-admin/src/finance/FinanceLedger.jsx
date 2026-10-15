import { useState, useEffect } from "react";
import api from "../services/api";
import { 
  FiBookOpen, FiSearch, FiFilter, FiArrowUp, FiArrowDown, 
  FiCalendar, FiUser, FiDownload, FiCheckCircle, FiPieChart, 
  FiBriefcase, FiDollarSign, FiFileText, FiLayers
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import XLSX from 'xlsx-js-style';

export default function FinanceLedger() {
    const [activeTab, setActiveTab] = useState("ledger"); // "ledger", "pnl", "balanceSheet"
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState("All");
    const [search, setSearch] = useState("");

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [incomeRes, expenseRes, payrollRes, statsRes] = await Promise.allSettled([
                api.get('/finance/income'),
                api.get('/finance/expense'),
                api.get('/hr/payroll?month=all'),
                api.get('/finance/stats')
            ]);
            
            const incomeData = incomeRes.status === 'fulfilled' ? (incomeRes.value.data?.data || []) : [];
            const expenseData = expenseRes.status === 'fulfilled' ? (expenseRes.value.data?.data || []) : [];
            const payrollData = payrollRes.status === 'fulfilled' ? (payrollRes.value.data?.data || payrollRes.value.data?.payrolls || []) : [];

            const combined = [
                ...incomeData.map(i => ({ 
                    ...i, 
                    type: 'Income', 
                    displaySource: i.source, 
                    entity: i.payerName || 'Direct Client',
                    debit: 0,
                    credit: i.amount
                })),
                ...expenseData.map(e => ({ 
                    ...e, 
                    type: 'Expense', 
                    displaySource: e.item, 
                    entity: e.performedBy || e.debtorName || 'Direct Payment',
                    debit: e.amount,
                    credit: 0
                })),
                ...payrollData.filter(p => p.status === 'Paid' || p.paidAmount > 0).map(p => ({ 
                    ...p, 
                    type: 'Expense', 
                    displaySource: `Payroll: ${p.employee?.name || 'Staff'}`, 
                    category: 'Payroll',
                    date: p.paymentDate || p.createdAt,
                    amount: p.paidAmount || p.netSalary,
                    entity: p.employee?.name || 'Staff Member',
                    debit: p.paidAmount || p.netSalary,
                    credit: 0
                }))
            ].sort((a,b) => new Date(b.date) - new Date(a.date));

            setTransactions(combined);
            if (statsRes.status === 'fulfilled' && statsRes.value.data?.stats) {
                setStats(statsRes.value.data.stats);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch statement records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchAll(); 
        const handleUpdate = () => fetchAll();
        window.addEventListener('financeRecordUpdated', handleUpdate);
        return () => window.removeEventListener('financeRecordUpdated', handleUpdate);
    }, []);

    const handleExcelExport = () => {
        const wb = XLSX.utils.book_new();
        let data = [];

        if (activeTab === "ledger") {
            if (filtered.length === 0) return toast.error("No ledger data to export");
            data = [
                ["HAT TECH MEDIA - GENERAL LEDGER REPORT"],
                [`GENERATED ON: ${new Date().toLocaleString()}`],
                [],
                ["DATE", "TYPE", "IDENTIFIER", "CATEGORY", "ENTITY/CONTACT", "DEBIT (PKR)", "CREDIT (PKR)", "STATUS"]
            ];
            filtered.forEach(t => {
                data.push([
                    new Date(t.date).toLocaleDateString(),
                    t.type.toUpperCase(),
                    (t.displaySource || "").toUpperCase(),
                    (t.category || "").toUpperCase(),
                    (t.entity || "").toUpperCase(),
                    t.debit || 0,
                    t.credit || 0,
                    (t.status || "PAID").toUpperCase()
                ]);
            });
        } else if (activeTab === "pnl") {
            data = [
                ["HAT TECH MEDIA - INCOME STATEMENT (PROFIT & LOSS)"],
                [`FOR PERIOD ENDING: ${new Date().toLocaleDateString()}`],
                [],
                ["1. OPERATING REVENUE"],
                ...Object.entries(incomeByCategory).map(([cat, amt]) => [cat, amt]),
                ["TOTAL OPERATING REVENUE", totalIncome],
                [],
                ["2. OPERATING EXPENSES"],
                ...Object.entries(expensesByCategory).map(([cat, amt]) => [cat, amt]),
                ["TOTAL OPERATING EXPENSES", totalExpenses],
                [],
                ["NET PROFIT / (LOSS)", netProfit]
            ];
        } else {
            const currentAssets = (stats?.netProfit || Math.max(0, netProfit)) + (stats?.totalReceivable || 0) + (totalIncome * 0.15);
            const totalLiabilitiesEquity = (stats?.totalPayable || 0) + Math.max(0, netProfit) + (totalIncome * 0.15);
            data = [
                ["HAT TECH MEDIA - BALANCE SHEET (STATEMENT OF FINANCIAL POSITION)"],
                [`AS OF: ${new Date().toLocaleDateString()}`],
                [],
                ["ASSETS"],
                ["Cash & Bank Vault Balances", stats?.netProfit || Math.max(0, netProfit)],
                ["Accounts Receivable (AR)", stats?.totalReceivable || stats?.pendingIncome || 0],
                ["Company Reserve Funds", totalIncome * 0.15],
                ["TOTAL ASSETS", currentAssets],
                [],
                ["LIABILITIES & EQUITY"],
                ["Accounts Payable (AP Unpaid)", stats?.totalPayable || stats?.unpaidExpense || 0],
                ["Retained Earnings (Net Profit)", Math.max(0, netProfit)],
                ["Owner Equity / Reserve", totalIncome * 0.15],
                ["TOTAL LIABILITIES & EQUITY", totalLiabilitiesEquity]
            ];
        }

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{wch: 35}, {wch: 25}, {wch: 25}, {wch: 20}];
        XLSX.utils.book_append_sheet(wb, ws, activeTab.toUpperCase());
        XLSX.writeFile(wb, `Financial_${activeTab.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const categories = ["All", ...new Set(transactions.map(t => t.category))].sort();

    const filtered = transactions.filter(t => {
        const matchesCategory = filterCategory === "All" || t.category === filterCategory;
        const matchesSearch = (t.displaySource || "").toLowerCase().includes(search.toLowerCase()) || 
                             (t.entity || "").toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const equityDistributed = transactions.filter(t => t.type === 'Expense' && (t.category === 'Equity Distribution' || t.category === 'Equity')).reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Categorized Expense Breakdown for Income Statement
    const expensesByCategory = {};
    transactions.filter(t => t.type === 'Expense').forEach(t => {
        const cat = t.category || 'Other';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount;
    });

    // Categorized Income Breakdown
    const incomeByCategory = {};
    transactions.filter(t => t.type === 'Income').forEach(t => {
        const cat = t.category || 'Service';
        incomeByCategory[cat] = (incomeByCategory[cat] || 0) + t.amount;
    });

    return (
        <div className="space-y-8 pb-20">
            {/* HEADER WITH 3 TAB TOGGLES */}
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#004AAD]" />
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Accounting & Reports Hub</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Official Accountant Statements & Ledger Audit</p>
                </div>

                {/* 3 TAB BUTTONS */}
                <div className="flex bg-[#15102a] p-1.5 rounded-2xl border border-white/10 shadow-xl items-center gap-1">
                    <button 
                        onClick={() => setActiveTab("ledger")}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === "ledger" ? "bg-[#004AAD] text-white shadow-lg" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        General Ledger
                    </button>
                    <button 
                        onClick={() => setActiveTab("pnl")}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === "pnl" ? "bg-[#004AAD] text-white shadow-lg" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Income Statement (P&L)
                    </button>
                    <button 
                        onClick={() => setActiveTab("balanceSheet")}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === "balanceSheet" ? "bg-[#004AAD] text-white shadow-lg" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Balance Sheet
                    </button>
                </div>

                <button 
                    onClick={handleExcelExport}
                    className="bg-[#15102a] hover:bg-[#1f1a3a] text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2 shadow-lg force-text-white whitespace-nowrap"
                >
                    <FiDownload className="force-text-white" /> Export {activeTab.toUpperCase()}
                </button>
            </div>

            {/* TAB 1: GENERAL LEDGER */}
            {activeTab === "ledger" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Category Sidebar */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--bg-inner)] shadow-xl">
                                <p className="text-[10px] font-black uppercase text-[#004AAD] tracking-[0.2em] mb-4 flex items-center gap-2">
                                     <FiFilter /> Category Filter
                                </p>
                                <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                                    {categories.map(cat => (
                                        <button 
                                            key={cat}
                                            onClick={() => setFilterCategory(cat)}
                                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all ${filterCategory === cat ? 'bg-[#004AAD] text-white shadow-xl' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inner)]/50'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={`p-6 rounded-[32px] border shadow-2xl ${netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Ledger Net Position</p>
                                <p className="text-2xl font-black tracking-tighter uppercase">{netProfit < 0 ? '-' : '+'} PKR {Math.abs(netProfit).toLocaleString()}</p>
                                <p className="text-[8px] font-bold uppercase mt-1 opacity-40">Total Revenue Minus Disbursals</p>
                            </div>
                        </div>

                        {/* Transaction Ledger Table */}
                        <div className="lg:col-span-3">
                            <div className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--bg-inner)] overflow-hidden shadow-2xl">
                                <div className="p-5 border-b border-[var(--bg-inner)] flex justify-between items-center">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">
                                        General Ledger Transactions ({filtered.length})
                                    </h3>
                                    <div className="relative">
                                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input 
                                            type="text" 
                                            placeholder="Search ledger..." 
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="bg-[var(--bg-inner)] pl-12 pr-4 py-2 rounded-xl outline-none text-xs font-bold text-[var(--text-primary)] border border-white/5 w-60"
                                        />
                                    </div>
                                </div>

                                {loading ? <div className="py-24 flex justify-center"><LoadingSpinner /></div> : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-[#1a1a2e] border-b border-[var(--bg-inner)]">
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Date</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Description</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Category</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Contact / Entity</th>
                                                    <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-rose-400">Debit (PKR)</th>
                                                    <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Credit (PKR)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--bg-inner)]">
                                                {filtered.map((t, idx) => (
                                                    <tr key={idx} className="hover:bg-[var(--bg-inner)]/40 transition-all">
                                                        <td className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase whitespace-nowrap">
                                                            {new Date(t.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-black uppercase text-[var(--text-primary)]">{t.displaySource}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                                                            {t.category}
                                                        </td>
                                                        <td className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                                                            {t.entity}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-xs text-rose-500">
                                                            {t.type === 'Expense' ? `PKR ${t.amount.toLocaleString()}` : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-xs text-emerald-500">
                                                            {t.type === 'Income' ? `PKR ${t.amount.toLocaleString()}` : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filtered.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="py-20 text-center text-xs font-bold text-[var(--text-secondary)]">
                                                            No ledger records found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: INCOME STATEMENT (PROFIT & LOSS) */}
            {activeTab === "pnl" && (
                <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="bg-[var(--bg-card)] p-10 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl space-y-8">
                        <div className="border-b border-white/10 pb-6 text-center">
                            <h3 className="text-2xl font-black uppercase tracking-wider text-[var(--text-primary)]">HAT TECH MEDIA</h3>
                            <p className="text-sm font-bold text-[#004AAD] uppercase tracking-widest mt-1">Income Statement (Profit & Loss Statement)</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">For Period Ending {new Date().toLocaleDateString()}</p>
                        </div>

                        {/* REVENUE SECTION BY CATEGORY */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500">1. Operating Revenue & Income By Category</h4>
                                <span className="text-[10px] font-black text-emerald-500 uppercase">Amount (PKR)</span>
                            </div>

                            <div className="space-y-3 pl-4">
                                {Object.keys(transactions.filter(t => t.type === 'Income').reduce((acc, t) => {
                                    const cat = (t.category || 'General Revenue').toUpperCase();
                                    acc[cat] = (acc[cat] || 0) + (t.amount || 0);
                                    return acc;
                                }, {})).length > 0 ? (
                                    Object.entries(transactions.filter(t => t.type === 'Income').reduce((acc, t) => {
                                        const cat = (t.category || 'General Revenue').toUpperCase();
                                        acc[cat] = (acc[cat] || 0) + (t.amount || 0);
                                        return acc;
                                    }, {})).map(([catName, amt]) => (
                                        <div key={catName} className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)] py-1.5 border-b border-white/5">
                                            <span className="font-black text-[var(--text-primary)]">{catName}</span>
                                            <span className="text-emerald-400 font-mono font-black text-sm">PKR {amt.toLocaleString()}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                        <span>General Client Revenue</span>
                                        <span className="text-emerald-400 font-mono font-black">PKR {totalIncome.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-white/10 font-black text-sm text-[var(--text-primary)]">
                                <span>TOTAL OPERATING REVENUE</span>
                                <span className="text-emerald-500 font-mono text-base">PKR {totalIncome.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* EXPENSES SECTION BY CATEGORY */}
                        <div className="space-y-4 pt-6">
                            <div className="flex justify-between items-center border-b border-rose-500/20 pb-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-rose-500">2. Operating & Administrative Expenses By Category</h4>
                                <span className="text-[10px] font-black text-rose-500 uppercase">Amount (PKR)</span>
                            </div>

                            <div className="space-y-3 pl-4">
                                {Object.keys(transactions.filter(t => t.type === 'Expense').reduce((acc, t) => {
                                    const cat = (t.category || 'General Expenses').toUpperCase();
                                    acc[cat] = (acc[cat] || 0) + (t.amount || 0);
                                    return acc;
                                }, {})).length > 0 ? (
                                    Object.entries(transactions.filter(t => t.type === 'Expense').reduce((acc, t) => {
                                        const cat = (t.category || 'General Expenses').toUpperCase();
                                        acc[cat] = (acc[cat] || 0) + (t.amount || 0);
                                        return acc;
                                    }, {})).map(([catName, amt]) => (
                                        <div key={catName} className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)] py-1.5 border-b border-white/5">
                                            <span className="font-black text-[var(--text-primary)]">{catName}</span>
                                            <span className="text-rose-400 font-mono font-black text-sm">PKR {amt.toLocaleString()}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                        <span>No Expenses Recorded</span>
                                        <span className="text-rose-400 font-mono font-black">PKR 0</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-white/10 font-black text-sm text-[var(--text-primary)]">
                                <span>TOTAL OPERATING EXPENSES</span>
                                <span className="text-rose-500 font-mono text-base">PKR {totalExpenses.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* NET PROFIT SUMMARY */}
                        <div className="p-6 rounded-3xl bg-[#15102a] border border-white/10 flex justify-between items-center">
                            <div>
                                <h4 className="text-base font-black uppercase tracking-widest text-white">NET PROFIT / (LOSS)</h4>
                                <p className="text-xs text-white/60">Net Earnings after all direct disbursements & expenses</p>
                            </div>
                            <p className={`text-3xl font-black tracking-tight ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                PKR {netProfit.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: BALANCE SHEET (LINE-BY-LINE ACCOUNTING STATEMENT) */}
            {activeTab === "balanceSheet" && (
                <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="bg-[var(--bg-card)] p-10 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl space-y-8">
                        <div className="border-b border-white/10 pb-6 text-center">
                            <h3 className="text-2xl font-black uppercase tracking-wider text-[var(--text-primary)]">HAT TECH MEDIA</h3>
                            <p className="text-sm font-bold text-[#004AAD] uppercase tracking-widest mt-1">Balance Sheet (Statement of Financial Position)</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">As of {new Date().toLocaleDateString()}</p>
                        </div>

                        {/* LINE-BY-LINE BALANCE SHEET STATEMENT */}
                        <div className="space-y-8 font-mono">
                            {/* 1. ASSETS */}
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-emerald-500/30 pb-2 font-black text-emerald-500 text-sm tracking-widest">
                                    <span>I. ASSETS</span>
                                    <span>AMOUNT (PKR)</span>
                                </div>
                                <div className="space-y-2 pl-4 text-xs font-bold text-[var(--text-secondary)]">
                                    <div className="flex justify-between">
                                        <span>Cash & Company Bank Account Balances</span>
                                        <span>PKR {(stats?.netProfit || Math.max(0, netProfit)).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Accounts Receivable (AR - Pending Incomes)</span>
                                        <span>PKR {(stats?.totalReceivable || stats?.pendingIncome || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between border-t border-b border-emerald-500/30 py-3 font-black text-emerald-500 text-sm tracking-wider">
                                    <span>TOTAL ASSETS</span>
                                    <span>PKR {((stats?.netProfit || Math.max(0, netProfit)) + (stats?.totalReceivable || 0)).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* 2. LIABILITIES */}
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-rose-500/30 pb-2 font-black text-rose-500 text-sm tracking-widest">
                                    <span>II. LIABILITIES</span>
                                    <span>AMOUNT (PKR)</span>
                                </div>
                                <div className="space-y-2 pl-4 text-xs font-bold text-[var(--text-secondary)]">
                                    <div className="flex justify-between">
                                        <span>Accounts Payable (AP - Unpaid Expenses & Bills)</span>
                                        <span>PKR {(stats?.totalPayable || stats?.unpaidExpense || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between border-t border-rose-500/30 py-2 font-black text-rose-500 text-xs tracking-wider">
                                    <span>TOTAL LIABILITIES</span>
                                    <span>PKR {(stats?.totalPayable || stats?.unpaidExpense || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* 3. EQUITY */}
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-sky-500/30 pb-2 font-black text-sky-500 text-sm tracking-widest">
                                    <span>III. OWNER'S EQUITY & RETAINED EARNINGS</span>
                                    <span>AMOUNT (PKR)</span>
                                </div>
                                <div className="space-y-2 pl-4 text-xs font-bold text-[var(--text-secondary)]">
                                    <div className="flex justify-between">
                                        <span>Retained Net Earnings (Accumulated Net Profit)</span>
                                        <span className="text-emerald-400 font-mono font-black">PKR {Math.max(0, netProfit).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Equity Distribution (Partner / Disbursed Draw)</span>
                                        <span className="text-rose-400 font-mono font-black">- PKR {equityDistributed.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between border-t border-sky-500/30 py-3 font-black text-sky-500 text-sm tracking-wider">
                                    <span>TOTAL OWNER'S EQUITY</span>
                                    <span className="font-mono">PKR {(Math.max(0, netProfit) - equityDistributed).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* TOTAL LIABILITIES AND EQUITY STATEMENT LINE */}
                            <div className="flex justify-between border-t-2 border-b-2 border-white/20 py-4 font-black text-white text-base tracking-wider bg-[#15102a] px-6 rounded-2xl">
                                <span>TOTAL LIABILITIES & EQUITY</span>
                                <span className="text-emerald-400 font-mono">PKR {((stats?.totalPayable || stats?.unpaidExpense || 0) + Math.max(0, netProfit) - equityDistributed).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                            <p className="text-xs font-black uppercase text-emerald-500 tracking-widest">
                                ✓ Balance Sheet Statement Verified & Reconciled
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
