import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { 
  FiCheckCircle, FiClock, FiSearch, FiDollarSign, FiArrowRight, 
  FiShield, FiHeart, FiBriefcase, FiActivity, FiLayers, FiCalendar, 
  FiChevronDown, FiPlus, FiTrendingUp, FiTrendingDown, FiX, FiPieChart, 
  FiArrowUpRight, FiArrowDownRight, FiFileText, FiTrash2, FiPrinter, FiFilter, FiTag, FiEdit3
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";
import { useReactToPrint } from "react-to-print";
import { useNavigate } from "react-router-dom";

import { getCompanyVaultAccounts } from "./companyAccounts";

export default function FinanceCashflow() {
    const navigate = useNavigate();
    const { confirm } = useModal();

    const [vaultAccounts, setVaultAccounts] = useState(getCompanyVaultAccounts());

    useEffect(() => {
        const handleVaultUpdate = () => setVaultAccounts(getCompanyVaultAccounts());
        window.addEventListener('companyAccountsUpdated', handleVaultUpdate);
        return () => window.removeEventListener('companyAccountsUpdated', handleVaultUpdate);
    }, []);

    // Data States
    const [selectedCardFilter, setSelectedCardFilter] = useState('all');
    const [data, setData] = useState([]);
    const [stats, setStats] = useState(null);
    const [incomesList, setIncomesList] = useState([]);
    const [expensesList, setExpensesList] = useState([]);
    const [receivablesList, setReceivablesList] = useState([]);
    const [payablesList, setPayablesList] = useState([]);
    const [payrollsList, setPayrollsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal & Slip States
    const [showQuickModal, setShowQuickModal] = useState(false);
    const [quickModalType, setQuickModalType] = useState('Income');
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [showSlipModal, setShowSlipModal] = useState(false);

    // Edit Transaction Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editType, setEditType] = useState('expense');
    const [editForm, setEditForm] = useState({ title: '', entity: '', amount: '', category: 'Business Expense', date: '', bankAccount: '' });

    const openEditModal = (item, type = 'expense') => {
        setEditItem(item);
        setEditType(type);
        setEditForm({
            title: item.source || item.item || '',
            entity: item.recipient || item.payerName || item.performedBy || item.debtorName || '',
            amount: item.amount || '',
            category: item.category || (type === 'income' ? 'Onetime Service' : 'Business Expense'),
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            bankAccount: item.receiverAccTitle || item.performedBy || (vaultAccounts[0] ? `${vaultAccounts[0].bankName} (${vaultAccounts[0].accountTitle})` : '')
        });
        setShowEditModal(true);
    };
    const slipRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: slipRef,
        documentTitle: `Finance_Slip_${selectedSlip?._id?.slice(-8)}`
    });

    const [currency, setCurrency] = useState("EUR");
    const [enteredAmount, setEnteredAmount] = useState("");
    const [usdRate, setUsdRate] = useState(278.50);

    const [formData, setFormData] = useState({
        source: "", amount: "", date: new Date().toISOString().split('T')[0],
        category: "Onetime Service", status: "Received", description: "",
        payerName: "", payerAccTitle: "", payerAccNo: "",
        receiverAccTitle: vaultAccounts[0] ? `${vaultAccounts[0].bankName} (${vaultAccounts[0].accountTitle})` : "Meezan Bank (Main)",
        receiverAccNo: vaultAccounts[0] ? vaultAccounts[0].accountNumber : "010203040506",
        paymentMethod: "Transfer", item: "", recipient: "",
        performedBy: vaultAccounts[0] ? `${vaultAccounts[0].bankName} (${vaultAccounts[0].accountTitle})` : "Meezan Bank (Main)",
        debtorName: ""
    });

    const incomeCategories = ['Onetime Service', 'Monthly digital Subscription', 'SAAS Subscription', 'Maintainence Support Payment', 'Project Sale', 'Milestone Payment', 'Project', 'Client', 'Service', 'Other'];
    const expenseCategories = ['Charity', 'Other', 'Reserve', 'Business Expense', 'Rent', 'Bill', 'Hardware', 'Software', 'Snacks', 'Travel', 'Marketing', 'Tea', 'Loan', 'Equity Distribution', 'Salary Expense'];

    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedYear, setSelectedYear] = useState(() => {
        const saved = localStorage.getItem('finance_cashflow_year');
        return (saved !== null && !isNaN(parseInt(saved))) ? parseInt(saved) : new Date().getFullYear();
    });
    const [isMonthOpen, setIsMonthOpen] = useState(false);
    const [isYearOpen, setIsYearOpen] = useState(false);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = [2024, 2025, 2026];

    useEffect(() => {
        fetch('https://open.er-api.com/v6/latest/USD')
            .then(res => res.json())
            .then(data => {
                if (data && data.rates && 1.08) setUsdRate(1.08);
            })
            .catch(err => console.error("Failed to fetch USD rate", err));
    }, []);

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
        localStorage.setItem('finance_cashflow_month', selectedMonth);
        localStorage.setItem('finance_cashflow_year', selectedYear);
    }, [selectedMonth, selectedYear]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [cashflowRes, incomeRes, expenseRes, receivableRes, payrollRes, statsRes] = await Promise.allSettled([
                api.get(`/finance/cashflow?month=${selectedMonth}&year=${selectedYear}`),
                api.get('/finance/income'),
                api.get('/finance/expense'),
                api.get('/finance/receivables'),
                api.get('/hr/payroll?month=all'),
                api.get(`/finance/stats?month=${selectedMonth}&year=${selectedYear}`)
            ]);

            if (cashflowRes.status === 'fulfilled' && cashflowRes.value.data) {
                setData(cashflowRes.value.data.data || []);
                if (cashflowRes.value.data.stats) setStats(cashflowRes.value.data.stats);
            }
            if (statsRes.status === 'fulfilled' && statsRes.value.data?.stats) {
                setStats(prev => ({ ...prev, ...statsRes.value.data.stats }));
            }
            if (incomeRes.status === 'fulfilled' && incomeRes.value.data?.data) {
                setIncomesList(incomeRes.value.data.data);
            }
            if (expenseRes.status === 'fulfilled' && expenseRes.value.data?.data) {
                const exps = expenseRes.value.data.data;
                setExpensesList(exps);
                setPayablesList(exps.filter(e => e.status === 'Unpaid' || e.status === 'Pending'));
            }
            if (receivableRes.status === 'fulfilled' && receivableRes.value.data?.data) {
                setReceivablesList(receivableRes.value.data.data);
            }
            if (payrollRes.status === 'fulfilled') {
                const pList = payrollRes.value.data?.data || payrollRes.value.data?.payrolls || (Array.isArray(payrollRes.value.data) ? payrollRes.value.data : []);
                setPayrollsList(pList);
            }
        } catch (err) {
            console.error("Fatal fetch error in Cashflow:", err);
            toast.error("Failed to load finance data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
        const handleUpdate = () => fetchAllData();
        window.addEventListener('financeRecordUpdated', handleUpdate);
        return () => window.removeEventListener('financeRecordUpdated', handleUpdate);
    }, [selectedMonth, selectedYear]);

    const getRate = (code) => {
        switch (code) {
            case 'USD': return usdRate || 278.50;
            case 'SAR': return 74.20;
            case 'EUR': return 303.50;
            case 'GBP': return 355.20;
            case 'AUD': return 183.40;
            default: return 1;
        }
    };

    const handleQuickSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const isInc = quickModalType === 'Income' || quickModalType === 'AR';
            const endpoint = isInc ? '/finance/income' : '/finance/expense';

            const rawAmount = parseFloat(enteredAmount) || 0;
            const rate = currency === "EUR" ? 1 : getRate(currency);
            const finalAmount = currency === "EUR" ? rawAmount : Math.round(rawAmount * rate);

            const payload = isInc ? {
                source: formData.source || (quickModalType === 'AR' ? 'Accounts Receivable' : 'Direct Income'),
                amount: finalAmount,
                date: formData.date || new Date().toISOString().split('T')[0],
                category: formData.category || 'Onetime Service',
                status: quickModalType === 'AR' ? 'Pending' : (formData.status || 'Received'),
                payerName: formData.payerName || '',
                payerAccTitle: formData.payerAccTitle || '',
                payerAccNo: formData.payerAccNo || '',
                receiverAccTitle: formData.receiverAccTitle || 'Meezan Bank (Main)',
                receiverAccNo: formData.receiverAccNo || '010203040506',
                paymentMethod: formData.paymentMethod || 'Transfer',
                description: currency !== "EUR" ? `${formData.description || ''}\n[Converted from ${enteredAmount} ${currency}]`.trim() : formData.description
            } : {
                item: formData.source || formData.item || (quickModalType === 'AP' ? 'Accounts Payable' : (quickModalType === 'Charity' ? 'Charity Payment' : 'Business Expense')),
                amount: finalAmount,
                date: formData.date || new Date().toISOString().split('T')[0],
                category: quickModalType === 'Charity' ? 'Charity' : (formData.category || 'Other'),
                status: quickModalType === 'AP' ? 'Unpaid' : (formData.status || 'Paid'),
                paymentMethod: formData.paymentMethod || 'Cash',
                recipient: formData.recipient || '',
                performedBy: formData.performedBy || 'Meezan Bank (Main)',
                debtorName: formData.debtorName || '',
                description: currency !== "EUR" ? `${formData.description || ''}\n[Converted from ${enteredAmount} ${currency}]`.trim() : formData.description
            };

            const res = await api.post(endpoint, payload);
            if (res.data.success) {
                toast.success(`${quickModalType} entry recorded!`);
                setShowQuickModal(false);
                setEnteredAmount('');
                setFormData(f => ({ ...f, source: "", item: "", payerName: "", recipient: "", description: "" }));
                window.dispatchEvent(new Event('financeRecordUpdated'));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to record entry");
        } finally {
            setSaving(false);
        }
    };

    const markPaidExpense = async (id) => {
        const isConfirmed = await confirm({ title: 'Confirm Payment', message: 'Mark this bill/expense as settled?', type: 'primary' });
        if (!isConfirmed) return;
        setSaving(true);
        try {
            await api.put(`/finance/expense/${id}`, { status: 'Paid' });
            toast.success("Settled successfully");
            window.dispatchEvent(new Event('financeRecordUpdated'));
        } catch (err) { toast.error("Update failed"); }
        finally { setSaving(false); }
    };

    const markReceivedIncome = async (id, isLoan = false) => {
        const isConfirmed = await confirm({ title: 'Confirm Receipt', message: 'Mark this receivable as fully received?', type: 'primary' });
        if (!isConfirmed) return;
        setSaving(true);
        try {
            const endpoint = isLoan ? `/finance/expense/${id}` : `/finance/income/${id}`;
            const status = isLoan ? 'Paid' : 'Received';
            await api.put(endpoint, { status });
            toast.success("Received successfully");
            window.dispatchEvent(new Event('financeRecordUpdated'));
        } catch (err) { toast.error("Update failed"); }
        finally { setSaving(false); }
    };

    const deleteEntry = async (id, type = 'income') => {
        const isConfirmed = await confirm({ title: 'Delete Entry', message: 'Are you sure you want to delete this transaction?', type: 'danger' });
        if (!isConfirmed) return;
        try {
            await api.delete(`/finance/${type}/${id}`);
            toast.success("Deleted successfully");
            window.dispatchEvent(new Event('financeRecordUpdated'));
        } catch (err) { toast.error("Delete failed"); }
    };

    const handleUpdateEntry = async (e) => {
        e.preventDefault();
        if (!editItem) return;
        setSaving(true);
        try {
            const payload = editType === 'income' ? {
                source: editForm.title,
                payerName: editForm.entity,
                amount: parseFloat(editForm.amount) || 0,
                category: editForm.category,
                date: editForm.date,
                receiverAccTitle: editForm.bankAccount
            } : {
                item: editForm.title,
                recipient: editForm.entity,
                performedBy: editForm.bankAccount,
                debtorName: editForm.entity,
                amount: parseFloat(editForm.amount) || 0,
                category: editForm.category,
                date: editForm.date
            };

            await api.put(`/finance/${editType}/${editItem._id}`, payload);
            toast.success("Transaction updated successfully");
            setShowEditModal(false);
            fetchData();
            window.dispatchEvent(new Event('financeRecordUpdated'));
        } catch (err) {
            toast.error("Failed to update transaction");
        } finally {
            setSaving(false);
        }
    };

    // Filtered by selected month and year
    const isAllTime = selectedMonth === 'all';

    const monthlyIncomes = isAllTime ? incomesList : incomesList.filter(i => {
        if (!i.date) return false;
        const d = new Date(i.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const monthlyExpenses = isAllTime ? expensesList : expensesList.filter(e => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const monthlyReceivables = isAllTime ? receivablesList : receivablesList.filter(r => {
        const rDate = r.date || r.dueDate;
        if (!rDate) return true;
        const d = new Date(rDate);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const monthlyPayrolls = isAllTime ? payrollsList : payrollsList.filter(p => {
        if (!p.month) return false;
        const mStr = String(p.month).trim();
        const targetMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        if (mStr === targetMonthStr) return true;
        if (mStr.toLowerCase().includes(months[selectedMonth]?.toLowerCase()) && mStr.includes(String(selectedYear))) return true;
        const parts = mStr.split('-');
        if (parts.length >= 2) {
            const pYear = parseInt(parts[0]);
            const pMonth = parseInt(parts[1]) - 1;
            return pMonth === selectedMonth && pYear === selectedYear;
        }
        return false;
    });

    const calculatedPayroll = monthlyPayrolls.reduce((sum, p) => {
        const amount = (p.paidAmount && p.paidAmount > 0) ? p.paidAmount : (p.netSalary || p.basicSalary || (p.employee?.salary) || 0);
        return sum + (amount || 0);
    }, 0);

    const totalPaidPayroll = calculatedPayroll > 0 ? calculatedPayroll : (stats?.totalPayroll || 0);

    // Computations strictly filtered by selected month and year (or All-Time General)
    const totalReceivedIncome = monthlyIncomes.filter(i => i.status === 'Received').reduce((a, b) => a + (b.amount || 0), 0);
    const rawPaidExpenses = monthlyExpenses.filter(e => e.status === 'Paid').reduce((a, b) => a + (b.amount || 0), 0);
    const totalPaidExpenses = rawPaidExpenses + totalPaidPayroll;
    const totalUnpaidPayables = monthlyExpenses.filter(e => e.status === 'Unpaid' || e.status === 'Pending').reduce((a, b) => a + (b.amount || 0), 0);
    const totalPendingReceivables = monthlyReceivables.reduce((a, b) => a + (b.amount || 0), 0);

    // Selected Month & Year Revenue for Cash Distribution Split (Matching Dashboard 100%)
    const periodGrossRevenue = totalReceivedIncome;
    const periodPaidExpenses = totalPaidExpenses;
    const periodCharityPaid = monthlyExpenses.filter(e => e.category === 'Charity' && e.status === 'Paid').reduce((a, b) => a + (b.amount || 0), 0);
    const periodCharityAllocated = periodGrossRevenue * 0.04;
    const periodCharityRemaining = Math.max(0, periodCharityAllocated - periodCharityPaid);

    // Dynamic Cash in Hand calculation based strictly on active accounts in company_accounts_vault
    const savedAccountsVault = localStorage.getItem('company_accounts_vault');
    const activeAccounts = savedAccountsVault ? JSON.parse(savedAccountsVault) : [];
    const totalInitialVault = activeAccounts.reduce((sum, a) => sum + (parseFloat(a.initialBalance) || 0), 0);
    const cashInHandTotal = totalInitialVault + periodGrossRevenue + totalUnpaidPayables - periodPaidExpenses;

    return (
        <div className="space-y-8 pb-20">
            {/* MAIN HEADER WITH PERIOD SELECTOR & QUICK ADD BUTTONS */}
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#004AAD]/5 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none text-[var(--text-primary)]">HAT TECH FINANCE CASHFLOW</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-60">Real-Time Revenue, Outflow & Liability Management</p>
                </div>
                
                {/* Period Selector & Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <div className="flex bg-[#15102a] text-white px-4 h-12 rounded-2xl border border-white/10 items-center gap-3">
                        <FiCalendar className="text-emerald-400" size={16} />
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => {
                                const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                                setSelectedMonth(val);
                                localStorage.setItem('finance_cashflow_month', val);
                            }}
                            className="bg-transparent text-white font-black text-xs uppercase outline-none cursor-pointer pr-1"
                        >
                            <option value="all" className="bg-[#15102a] text-white font-bold">GENERAL (ALL TIME TOTALS)</option>
                            {months.map((m, idx) => (
                                <option key={m} value={idx} className="bg-[#15102a] text-white font-bold">{m}</option>
                            ))}
                        </select>
                        <div className="h-4 w-px bg-white/20" />
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-transparent text-white font-black text-xs uppercase outline-none cursor-pointer"
                        >
                            {years.map(y => (
                                <option key={y} value={y} className="bg-[#15102a] text-white font-bold">{y}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={() => { setQuickModalType('Income'); setEnteredAmount(''); setShowQuickModal(true); }} className="px-6 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg">
                        <FiPlus size={16} /> Add Income
                    </button>
                    <button onClick={() => { setQuickModalType('Expense'); setEnteredAmount(''); setShowQuickModal(true); }} className="px-6 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg">
                        <FiPlus size={16} /> Add Expense
                    </button>
                </div>
            </div>

            {/* 4 CORE CLICKABLE STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {/* 1. Cash In Hand -> Redirects to Accounts Page */}
                <div 
                    onClick={() => navigate('/finance/accounts')}
                    className="p-6 rounded-[28px] border bg-[var(--bg-card)] border-[var(--bg-inner)] hover:border-[#004AAD] transition-all cursor-pointer shadow-xl flex flex-col justify-between group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform"><FiDollarSign size={20} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Liquid Cash</span>
                    </div>
                    <div>
                        <h4 className="text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-[0.15em] mb-1">Cash in Hand (Bank Vaults)</h4>
                        <p className="text-2xl font-black text-[var(--text-primary)]">€{cashInHandTotal.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-emerald-500 uppercase mt-1 flex items-center gap-1">
                            Click to view bank transactions →
                        </p>
                    </div>
                </div>

                {/* 2. Account Payable */}
                <div 
                    onClick={() => {
                        const newFilter = selectedCardFilter === 'payable' ? 'all' : 'payable';
                        setSelectedCardFilter(newFilter);
                        document.getElementById('cashflow-details-table')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`p-6 rounded-[28px] border transition-all cursor-pointer shadow-xl flex flex-col justify-between ${
                        selectedCardFilter === 'payable' ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500' : 'bg-[var(--bg-card)] border-[var(--bg-inner)] hover:border-rose-500/40'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500"><FiArrowDownRight size={20} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">AP Unpaid</span>
                    </div>
                    <div>
                        <h4 className="text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-[0.15em] mb-1">Account Payable (Unpaid)</h4>
                        <p className="text-2xl font-black text-rose-500">€{totalUnpaidPayables.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-rose-400 uppercase mt-1 flex items-center gap-1">
                            Click to view unpaid bills ↓
                        </p>
                    </div>
                </div>

                {/* 3. Account Receivable */}
                <div 
                    onClick={() => {
                        const newFilter = selectedCardFilter === 'receivable' ? 'all' : 'receivable';
                        setSelectedCardFilter(newFilter);
                        document.getElementById('cashflow-details-table')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`p-6 rounded-[28px] border transition-all cursor-pointer shadow-xl flex flex-col justify-between ${
                        selectedCardFilter === 'receivable' ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500' : 'bg-[var(--bg-card)] border-[var(--bg-inner)] hover:border-amber-500/40'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500"><FiArrowUpRight size={20} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">AR Pending</span>
                    </div>
                    <div>
                        <h4 className="text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-[0.15em] mb-1">Account Receivable (Pending)</h4>
                        <p className="text-2xl font-black text-amber-500">€{totalPendingReceivables.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-amber-400 uppercase mt-1 flex items-center gap-1">
                            Click to view pending payments ↓
                        </p>
                    </div>
                </div>

                {/* 4. Total Paid Expenses */}
                <div 
                    onClick={() => {
                        const newFilter = selectedCardFilter === 'expense' ? 'all' : 'expense';
                        setSelectedCardFilter(newFilter);
                        document.getElementById('cashflow-details-table')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`p-6 rounded-[28px] border transition-all cursor-pointer shadow-xl flex flex-col justify-between ${
                        selectedCardFilter === 'expense' ? 'bg-sky-500/20 border-sky-500 ring-2 ring-sky-500' : 'bg-[var(--bg-card)] border-[var(--bg-inner)] hover:border-sky-500/40'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500"><FiActivity size={20} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500">Paid Outflows</span>
                    </div>
                    <div>
                        <h4 className="text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-[0.15em] mb-1">Expenses (Paid Out)</h4>
                        <p className="text-2xl font-black text-sky-400">€{totalPaidExpenses.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-sky-400 uppercase mt-1 flex items-center gap-1">
                            Click to view paid expenses ↓
                        </p>
                    </div>
                </div>
            </div>

            {/* AGENCY PERCENTAGE CASH DISTRIBUTION SPLIT */}
            <div className="bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl">
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase mb-6">Cash Distribution Split (4% Charity)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#004AAD]/10 p-6 rounded-3xl border border-[#004AAD]/20 text-center">
                        <p className="text-4xl font-black text-[#004AAD]">35%</p>
                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mt-2">Business Expenses</p>
                        <p className="text-xs font-bold text-[var(--text-primary)] mt-1">€{Math.round(periodGrossRevenue * 0.35).toLocaleString()}</p>
                    </div>
                    <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20 text-center">
                        <p className="text-4xl font-black text-amber-500">15%</p>
                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mt-2">Company Reserve</p>
                        <p className="text-xs font-bold text-[var(--text-primary)] mt-1">€{Math.round(periodGrossRevenue * 0.15).toLocaleString()}</p>
                    </div>
                    <div className="bg-pink-500/10 p-6 rounded-3xl border border-pink-500/20 text-center">
                        <p className="text-4xl font-black text-pink-500">4%</p>
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase mt-2">Charity Pool Remaining</p>
                        <p className="text-xs font-bold text-[var(--text-primary)] mt-1">
                            €{periodCharityRemaining.toLocaleString()}
                        </p>
                        <p className="text-[8px] font-bold text-pink-400 mt-0.5">
                            (Allocated: €{periodCharityAllocated.toLocaleString()})
                        </p>
                    </div>
                </div>
            </div>

            {/* DETAILS PANEL ON CARD SELECTION */}
            <div id="cashflow-details-table" className="bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--bg-inner)] pb-4">
                    <div>
                        <h3 className="text-xl font-black uppercase text-[var(--text-primary)]">
                            {selectedCardFilter === 'cashInHand' && "Cash in Hand & Bank Vault Transactions"}
                            {selectedCardFilter === 'payable' && "Accounts Payable (Unpaid Bills & Outflows)"}
                            {selectedCardFilter === 'receivable' && "Accounts Receivable (Pending Client Revenue)"}
                            {selectedCardFilter === 'expense' && "Paid Expense Disbursements"}
                            {selectedCardFilter === 'all' && "All Financial Transactions & Cashflow Activity"}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] font-bold mt-1">
                            Showing live transaction details for selected category
                        </p>
                    </div>
                    {selectedCardFilter !== 'all' && (
                        <button 
                            onClick={() => setSelectedCardFilter('all')}
                            className="px-4 py-2 bg-[var(--bg-inner)] text-[10px] font-black uppercase text-[var(--text-secondary)] rounded-xl hover:text-[var(--text-primary)] transition-all"
                        >
                            Show All Transactions
                        </button>
                    )}
                </div>

                {/* TRANSACTION LIST TABLE */}
                {loading ? <div className="py-20 flex justify-center"><LoadingSpinner /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#1a1a2e] text-white">
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/70">Date</th>
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/70">Title / Entity</th>
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/70">Category</th>
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/70 text-right">Amount (EUR)</th>
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/70 text-center">Status / Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--bg-inner)]">
                                {/* CASH IN HAND FILTER */}
                                {(selectedCardFilter === 'all' || selectedCardFilter === 'cashInHand') && monthlyIncomes.filter(i => i.status === 'Received').map((inc) => (
                                    <tr key={`inc-${inc._id}`} className="hover:bg-[var(--bg-inner)]/40 transition-all">
                                        <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{new Date(inc.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black uppercase text-[var(--text-primary)]">{inc.source}</p>
                                            <p className="text-[9px] text-[var(--text-secondary)]">{inc.payerName || 'Client Settlement'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{inc.category}</td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-emerald-500">+ €{inc.amount?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => { setSelectedSlip(inc); setShowSlipModal(true); }} className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase hover:bg-emerald-500/20 transition-all">
                                                    Receipt Slip
                                                </button>
                                                <button onClick={() => openEditModal(inc, 'income')} title="Edit Entry" className="p-1.5 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition-all">
                                                    <FiEdit3 size={14} />
                                                </button>
                                                <button onClick={() => deleteEntry(inc._id, 'income')} title="Delete Entry" className="p-1.5 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all">
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {/* PAYABLE UNPAID EXPENSES FILTER */}
                                {(selectedCardFilter === 'all' || selectedCardFilter === 'payable') && monthlyExpenses.filter(e => e.status === 'Unpaid' || e.status === 'Pending').map((exp) => (
                                    <tr key={`exp-ap-${exp._id}`} className="hover:bg-[var(--bg-inner)]/40 transition-all">
                                        <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{new Date(exp.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black uppercase text-[var(--text-primary)]">{exp.item}</p>
                                            <p className="text-[9px] text-[var(--text-secondary)]">{exp.recipient || exp.performedBy || 'Vendor Bill'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{exp.category}</td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-rose-500">- €{exp.amount?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => markPaidExpense(exp._id)} className="px-4 py-1.5 bg-[#004AAD] text-white rounded-xl text-[9px] font-bold uppercase transition-all shadow-md">
                                                    Mark Paid
                                                </button>
                                                <button onClick={() => openEditModal(exp, 'expense')} title="Edit Entry" className="p-1.5 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition-all">
                                                    <FiEdit3 size={14} />
                                                </button>
                                                <button onClick={() => deleteEntry(exp._id, 'expense')} title="Delete Entry" className="p-1.5 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all">
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {/* RECEIVABLE PENDING INCOMES FILTER */}
                                {(selectedCardFilter === 'all' || selectedCardFilter === 'receivable') && monthlyReceivables.map((rec) => (
                                    <tr key={`rec-${rec._id}`} className="hover:bg-[var(--bg-inner)]/40 transition-all">
                                        <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{new Date(rec.date || rec.dueDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black uppercase text-[var(--text-primary)]">{rec.source || rec.clientName}</p>
                                            <p className="text-[9px] text-[var(--text-secondary)]">Pending Client Income</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{rec.category || 'Receivable'}</td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-amber-500">€{(rec.amount || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => markReceivedIncome(rec._id, rec.category === 'Loan')} className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-[9px] font-bold uppercase transition-all shadow-md">
                                                    Mark Received
                                                </button>
                                                <button onClick={() => openEditModal(rec, rec.category === 'Loan' ? 'expense' : 'income')} title="Edit Entry" className="p-1.5 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition-all">
                                                    <FiEdit3 size={14} />
                                                </button>
                                                <button onClick={() => deleteEntry(rec._id, rec.category === 'Loan' ? 'expense' : 'income')} title="Delete Entry" className="p-1.5 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all">
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {/* PAID EXPENSES FILTER */}
                                {(selectedCardFilter === 'all' || selectedCardFilter === 'expense') && (
                                    <>
                                        {totalPaidPayroll > 0 && (
                                            <tr key="monthly-payroll-summary" className="bg-sky-500/10 hover:bg-sky-500/20 transition-all font-black border-l-4 border-sky-400">
                                                <td className="px-6 py-4 text-xs font-bold text-sky-400">
                                                    {selectedMonth === 'all' ? 'All Time' : `${months[selectedMonth]} ${selectedYear}`}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-black uppercase text-sky-300">CONFIRMED MONTHLY PAYROLL DISBURSEMENT</p>
                                                    <p className="text-[9px] text-sky-400/80">Aggregated Total Staff Salary Payout from Payroll Module</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-sky-400">Salary Expense</td>
                                                <td className="px-6 py-4 text-right text-xs font-black text-rose-400">- €{totalPaidPayroll.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-[9px] font-black uppercase border border-sky-400/30">
                                                        Payroll Settled
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                        {monthlyExpenses.filter(e => e.status === 'Paid').map((exp) => (
                                            <tr key={`exp-paid-${exp._id}`} className="hover:bg-[var(--bg-inner)]/40 transition-all">
                                                <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{new Date(exp.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-black uppercase text-[var(--text-primary)]">{exp.item}</p>
                                                    <p className="text-[9px] text-[var(--text-secondary)]">{exp.performedBy || 'Paid Outflow'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{exp.category}</td>
                                                <td className="px-6 py-4 text-right text-xs font-black text-sky-400">- €{exp.amount?.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-[9px] font-black uppercase">Paid</span>
                                                        <button onClick={() => openEditModal(exp, 'expense')} title="Edit Entry" className="p-1.5 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition-all">
                                                            <FiEdit3 size={14} />
                                                        </button>
                                                        <button onClick={() => deleteEntry(exp._id, 'expense')} title="Delete Entry" className="p-1.5 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all">
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* FULL REVENUE / EXPENSE ENTRY MODAL (MATCHING SCREENSHOT) */}
            <AnimatePresence>
                {showQuickModal && (
                    <div 
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all overflow-y-auto"
                        onClick={(e) => { if(e.target === e.currentTarget) setShowQuickModal(false); }}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            className="bg-[var(--bg-card)] rounded-[40px] w-full max-w-4xl p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden border border-[var(--bg-inner)] my-10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">
                                        {quickModalType === 'Income' ? 'REVENUE ENTRY' : 'EXPENSE DISBURSEMENT'}
                                    </h3>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-2 opacity-60">
                                        {quickModalType === 'Income' ? 'INITIALIZE OFFICIAL EUR REVENUE FLOW' : 'RECORD OFFICIAL OUTFLOW & DISBURSEMENT'}
                                    </p>
                                </div>
                                <button onClick={() => setShowQuickModal(false)} className="p-3 text-[var(--text-secondary)] bg-[var(--bg-inner)] hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all">
                                    <FiX size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleQuickSubmit} className="space-y-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                                {/* GENERAL INFORMATION */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-[#004AAD]">
                                        <FiTag /> <span className="text-[10px] font-black uppercase tracking-widest">GENERAL INFORMATION</span>
                                        <div className="flex-1 h-[1px] bg-[var(--bg-inner)] ml-2" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">
                                                {quickModalType === 'Income' ? 'CLEARING ENTITY (SOURCE NAME)' : 'EXPENSE ITEM / REASON'}
                                            </label>
                                            <input 
                                                required 
                                                value={formData.source} 
                                                onChange={e => setFormData({...formData, source: e.target.value, item: e.target.value})} 
                                                type="text" 
                                                placeholder={quickModalType === 'Income' ? "e.g. Project Delivery - UI Design" : "e.g. Server Hosting Bill"} 
                                                className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all focus:ring-4 focus:ring-[#004AAD]/20 shadow-inner" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">CURRENCY</label>
                                            <select 
                                                value={currency} 
                                                onChange={e => setCurrency(e.target.value)} 
                                                className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner uppercase"
                                            >
                                                <option value="EUR">EUR (€)</option>
                                                <option value="USD">USD ($)</option>
                                                <option value="GBP">GBP (£)</option>
                                                <option value="CHF">CHF (Fr)</option>
                                                <option value="AUD">AUD (A$)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2 text-emerald-500">
                                            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">
                                                {currency === 'EUR' ? 'AMOUNT (EUR)' : `AMOUNT IN ${currency}`}
                                            </label>
                                            <input 
                                                required 
                                                value={enteredAmount} 
                                                onChange={e => setEnteredAmount(e.target.value)} 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="0.00" 
                                                className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-emerald-500 font-black transition-all focus:ring-4 focus:ring-emerald-500/10 shadow-inner" 
                                            />
                                            <p className="text-[10px] text-emerald-400 mt-1 font-bold">
                                                 {enteredAmount
                                                     ? (currency === 'EUR'
                                                         ? `Direct EUR Amount`
                                                         : `≈ ${(parseFloat(enteredAmount) * getRate(currency)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} EUR (Rate: 1 ${currency} = ${getRate(currency)} EUR)`)
                                                     : '\u00A0'}
                                             </p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">
                                                {quickModalType === 'Income' ? 'SETTLEMENT DATE' : 'PAYMENT DATE'}
                                            </label>
                                            <input 
                                                required 
                                                value={formData.date} 
                                                onChange={e => setFormData({...formData, date: e.target.value})} 
                                                type="date" 
                                                className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all shadow-inner" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">
                                                {quickModalType === 'Income' ? 'PROJECT PAYMENT' : 'EXPENSE CATEGORY'}
                                            </label>
                                            <select 
                                                value={formData.category} 
                                                onChange={e => setFormData({...formData, category: e.target.value})} 
                                                className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner uppercase"
                                            >
                                                {(quickModalType === 'Income' ? incomeCategories : expenseCategories).map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* PAYER / RECEIVER OR DISBURSEMENT DETAILS */}
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                    {quickModalType === 'Income' ? (
                                        <>
                                            <div className="space-y-4 p-6 bg-[var(--bg-inner)]/30 rounded-3xl border border-[var(--bg-inner)]">
                                                <p className="text-[10px] font-black text-[#004AAD] uppercase tracking-widest text-center mb-2">PAYER INFORMATION</p>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1">PAYER NAME (CLIENT)</label>
                                                    <input 
                                                        value={formData.payerName} 
                                                        onChange={e => setFormData({...formData, payerName: e.target.value})} 
                                                        type="text" 
                                                        placeholder="Full Name / Client" 
                                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-bold text-xs shadow-inner" 
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4 p-6 bg-[var(--bg-inner)]/30 rounded-3xl border border-[var(--bg-inner)]">
                                                <p className="text-[10px] font-black text-[#004AAD] uppercase tracking-widest text-center mb-2">RECEIVER BANK ACCOUNT</p>
                                                <div className="space-y-2">
                                                     <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1 text-emerald-500">RECEIVER BANK ACCOUNT (COMPANY)</label>
                                                     <select 
                                                        value={formData.receiverAccTitle} 
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const selected = vaultAccounts.find(a => `${a.bankName} (${a.accountTitle})` === val || a.accountTitle === val);
                                                            setFormData({ 
                                                                ...formData, 
                                                                receiverAccTitle: val, 
                                                                receiverAccNo: selected ? (selected.accountNumber || selected.iban || '') : formData.receiverAccNo 
                                                            });
                                                        }} 
                                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-bold text-xs shadow-inner cursor-pointer uppercase"
                                                     >
                                                         {vaultAccounts.map(acc => {
                                                             const label = `${acc.bankName} (${acc.accountTitle})`;
                                                             return <option key={acc.id || acc._id || acc.accountNumber} value={label}>{label}</option>;
                                                         })}
                                                     </select>
                                                 </div>
                                                <div className="space-y-2">
                                                    <input 
                                                        readOnly 
                                                        value={formData.receiverAccNo || (vaultAccounts[0] ? vaultAccounts[0].accountNumber : '010203040506')} 
                                                        type="text" 
                                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-secondary)] font-bold text-xs shadow-inner" 
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-4 p-6 bg-[var(--bg-inner)]/30 rounded-3xl border border-[var(--bg-inner)]">
                                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mb-2">DISBURSED FROM ACCOUNT</p>
                                                <div className="space-y-2">
                                                     <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1 text-rose-500">PAID FROM COMPANY BANK ACCOUNT</label>
                                                     <select 
                                                        value={formData.performedBy} 
                                                        onChange={e => setFormData({ ...formData, performedBy: e.target.value })} 
                                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-bold text-xs shadow-inner cursor-pointer uppercase"
                                                     >
                                                         {vaultAccounts.map(acc => {
                                                             const label = `${acc.bankName} (${acc.accountTitle})`;
                                                             return <option key={acc.id || acc._id || acc.accountNumber} value={label}>{label}</option>;
                                                         })}
                                                     </select>
                                                 </div>
                                            </div>

                                            <div className="space-y-4 p-6 bg-[var(--bg-inner)]/30 rounded-3xl border border-[var(--bg-inner)]">
                                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mb-2">RECIPIENT DETAILS</p>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1">
                                                        {quickModalType === 'AP' ? 'VENDOR / RECIPIENT NAME' : 'PAID TO (VENDOR / RECIPIENT)'}
                                                    </label>
                                                    <input 
                                                        value={formData.recipient} 
                                                        onChange={e => setFormData({...formData, recipient: e.target.value})} 
                                                        type="text" 
                                                        placeholder="Vendor / Person / Organization" 
                                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-bold text-xs shadow-inner" 
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="w-full py-5 bg-[#004AAD] text-white rounded-[24px] font-black uppercase tracking-widest shadow-[0_25px_50px_-10px_rgba(0,74,173,0.4)] hover:scale-[1.02] active:scale-95 transition-all mt-6 disabled:opacity-50"
                                >
                                    {saving ? 'SYNCHRONIZING...' : `REGISTER ${quickModalType.toUpperCase()}`}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SLIP VIEW MODAL */}
            <AnimatePresence>
                {showSlipModal && selectedSlip && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSlipModal(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="bg-[var(--bg-card)] p-8 rounded-3xl shadow-2xl w-full max-w-md border border-[var(--border-color)] relative">
                            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 dark:bg-gray-800 rounded-full p-2" onClick={() => setShowSlipModal(false)}>
                                <FiX size={20} />
                            </button>
                            
                            <div ref={slipRef} className="space-y-6 p-4">
                                <div className="text-center border-b pb-4">
                                    <h2 className="text-2xl font-black text-[#004AAD] uppercase">HAT TECH MEDIA</h2>
                                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Official Receipt Voucher</p>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between"><span>Voucher ID:</span><span className="font-bold">{selectedSlip._id?.slice(-8).toUpperCase()}</span></div>
                                    <div className="flex justify-between"><span>Date:</span><span className="font-bold">{new Date(selectedSlip.date).toLocaleDateString()}</span></div>
                                    <div className="flex justify-between"><span>Source:</span><span className="font-bold">{selectedSlip.source || selectedSlip.item}</span></div>
                                    <div className="flex justify-between"><span>Category:</span><span className="font-bold">{selectedSlip.category}</span></div>
                                    <div className="flex justify-between text-base font-black pt-2 border-t text-emerald-500"><span>Amount:</span><span>€{selectedSlip.amount?.toLocaleString()}</span></div>
                                </div>
                            </div>

                            <button onClick={handlePrint} className="w-full py-3 bg-[#004AAD] text-white font-bold rounded-xl mt-4 flex items-center justify-center gap-2">
                                <FiPrinter size={18} /> Print Voucher
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EDIT TRANSACTION MODAL */}
            <AnimatePresence>
                {showEditModal && editItem && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowEditModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-[var(--bg-card)] rounded-[48px] w-full max-w-2xl p-10 shadow-2xl relative border border-[var(--bg-inner)] overflow-hidden">
                            <div className="flex justify-between items-center mb-8 text-[var(--text-primary)]">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">EDIT TRANSACTION ENTRY</h3>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-1 opacity-60">Update official financial ledger details</p>
                                </div>
                                <button onClick={() => setShowEditModal(false)} className="p-3 text-[var(--text-secondary)] bg-[var(--bg-inner)] rounded-2xl hover:scale-110 active:scale-90 transition-all"><FiX size={18} /></button>
                            </div>
                            <form onSubmit={handleUpdateEntry} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1">ENTRY TITLE / TRANSACTION NARRATIVE</label>
                                        <input required value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black text-xs uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1">PAYMENT DATE</label>
                                        <input required type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1">CATEGORY</label>
                                        <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black text-xs uppercase cursor-pointer">
                                            {(editType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                                                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1">
                                            {editType === 'income' ? 'PAYER NAME (CLIENT)' : 'PAID TO (VENDOR / RECIPIENT)'}
                                        </label>
                                        <input value={editForm.entity} onChange={e => setEditForm({ ...editForm, entity: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black text-xs uppercase" placeholder="Person / Vendor / Client" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-emerald-500 ml-1">AMOUNT (EUR)</label>
                                        <input required type="number" step="0.01" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-emerald-500 font-black text-xs" />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1">COMPANY BANK ACCOUNT</label>
                                        <select value={editForm.bankAccount} onChange={e => setEditForm({ ...editForm, bankAccount: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black text-xs uppercase cursor-pointer">
                                            {vaultAccounts.map(acc => {
                                                const label = `${acc.bankName} (${acc.accountTitle})`;
                                                return <option key={acc.id || acc._id || acc.accountNumber} value={label}>{label}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={saving} className="w-full py-5 bg-[#004AAD] text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg mt-4 disabled:opacity-50 hover:scale-[1.01] active:scale-95 transition-all">
                                    {saving ? 'UPDATING...' : 'UPDATE TRANSACTION ENTRY'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
