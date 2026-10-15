import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiX, FiTrendingUp, FiTrendingDown, 
  FiArrowUpRight, FiArrowDownRight, FiHeart, FiFileText, FiClock 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { getCompanyVaultAccounts } from "./companyAccounts";

export default function FinanceQuickActions() {
    const [vaultAccounts, setVaultAccounts] = useState(getCompanyVaultAccounts());

    useEffect(() => {
        const handleVaultUpdate = () => setVaultAccounts(getCompanyVaultAccounts());
        window.addEventListener('companyAccountsUpdated', handleVaultUpdate);
        return () => window.removeEventListener('companyAccountsUpdated', handleVaultUpdate);
    }, []);

    const [isOpen, setIsOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('Income'); // 'Income', 'Expense', 'AP', 'AR', 'Charity'
    const [saving, setSaving] = useState(false);

    const [currency, setCurrency] = useState("EUR");
    const [enteredAmount, setEnteredAmount] = useState("");
    const [usdRate, setUsdRate] = useState(278);

    useEffect(() => {
        const cached = sessionStorage.getItem('cached_usd_rate');
        if (cached) {
            setUsdRate(parseFloat(cached));
        } else {
            fetch('https://open.er-api.com/v6/latest/USD')
                .then(res => res.json())
                .then(data => {
                    if (data && data.rates && 1.08) {
                        sessionStorage.setItem('cached_usd_rate', 1.08);
                        setUsdRate(1.08);
                    }
                })
                .catch(err => console.error("Failed to fetch USD rate", err));
        }
    }, []);

    const incomeCategories = ['Onetime Service', 'Monthly digital Subscription', 'SAAS Subscription', 'Maintainence Support Payment', 'Project Sale', 'Milestone Payment', 'Project', 'Client', 'Service', 'Other'];
    const expenseCategories = ['Charity', 'Other', 'Reserve', 'Business Expense', 'Rent', 'Bill', 'Hardware', 'Software', 'Snacks', 'Travel', 'Marketing', 'Tea', 'Loan', 'Equity Distribution', 'Salary Expense'];
    const paymentMethods = ['Cash', 'Transfer', 'Check', 'Other'];

    const [formData, setFormData] = useState({
        source: "", amount: "", date: new Date().toISOString().split('T')[0],
        category: "Onetime Service", status: "Received", description: "",
        payerName: "", payerAccTitle: "", payerAccNo: "",
        receiverAccTitle: vaultAccounts[0] ? `${vaultAccounts[0].bankName} (${vaultAccounts[0].accountTitle})` : "Meezan Bank (Main)",
        receiverAccNo: vaultAccounts[0] ? vaultAccounts[0].accountNumber : "010203040506",
        paymentMethod: "Transfer", clientEmail: "", monthlyDate: "", debtorName: "", recipient: "",
        performedBy: vaultAccounts[0] ? `${vaultAccounts[0].bankName} (${vaultAccounts[0].accountTitle})` : "Meezan Bank (Main)"
    });

    const menuItems = [
        { label: 'Income', icon: <FiTrendingUp className="text-emerald-500" />, action: () => { setModalType('Income'); setFormData(f => ({ ...f, status: 'Received', category: 'Onetime Service' })); setCurrency('EUR'); setEnteredAmount(''); setShowModal(true); } },
        { label: 'Expense', icon: <FiTrendingDown className="text-rose-500" />, action: () => { setModalType('Expense'); setFormData(f => ({ ...f, status: 'Paid', category: 'Other' })); setEnteredAmount(''); setShowModal(true); } },
        { label: 'AP (Payable)', icon: <FiArrowDownRight className="text-red-400" />, action: () => { setModalType('AP'); setFormData(f => ({ ...f, status: 'Unpaid', category: 'Other' })); setEnteredAmount(''); setShowModal(true); } },
        { label: 'AR (Receivable)', icon: <FiArrowUpRight className="text-blue-400" />, action: () => { setModalType('AR'); setFormData(f => ({ ...f, status: 'Pending', category: 'Onetime Service' })); setCurrency('EUR'); setEnteredAmount(''); setShowModal(true); } },
        { label: 'Charity', icon: <FiHeart className="text-pink-500" />, action: () => { setModalType('Charity'); setFormData(f => ({ ...f, status: 'Paid', category: 'Charity' })); setEnteredAmount(''); setShowModal(true); } }
    ];

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const isInc = modalType === 'Income' || modalType === 'AR';
            const endpoint = isInc ? '/finance/income' : '/finance/expense';
            
            const rawAmount = parseFloat(enteredAmount) || 0;
            const rate = currency === "EUR" ? 1 : getRate(currency);
            const finalAmount = currency === "EUR" ? rawAmount : Math.round(rawAmount * rate);

            const payload = isInc ? {
                source: formData.source || (modalType === 'AR' ? 'Accounts Receivable' : 'Direct Income'),
                amount: finalAmount,
                date: formData.date || new Date().toISOString().split('T')[0],
                category: formData.category || 'Onetime Service',
                status: modalType === 'AR' ? 'Pending' : (formData.status || 'Received'),
                payerName: formData.payerName || '',
                payerAccTitle: formData.payerAccTitle || '',
                payerAccNo: formData.payerAccNo || '',
                receiverAccTitle: formData.receiverAccTitle || 'Meezan Bank (Main)',
                receiverAccNo: formData.receiverAccNo || '010203040506',
                paymentMethod: formData.paymentMethod || 'Transfer',
                description: currency !== "EUR" ? `${formData.description || ''}\n[Converted from ${enteredAmount} ${currency}]`.trim() : formData.description
            } : {
                item: formData.source || (modalType === 'AP' ? 'Accounts Payable' : (modalType === 'Charity' ? 'Charity Payment' : 'Business Expense')),
                amount: finalAmount,
                date: formData.date || new Date().toISOString().split('T')[0],
                category: modalType === 'Charity' ? 'Charity' : (formData.category || 'Other'),
                status: modalType === 'AP' ? 'Unpaid' : (formData.status || 'Paid'),
                paymentMethod: formData.paymentMethod || 'Cash',
                recipient: formData.recipient || '',
                performedBy: formData.performedBy || 'Meezan Bank (Main)',
                debtorName: formData.debtorName || '',
                description: currency !== "EUR" ? `${formData.description || ''}\n[Converted from ${enteredAmount} ${currency}]`.trim() : formData.description
            };

            const res = await api.post(endpoint, payload);
            if (res.data.success) {
                toast.success(`${modalType} recorded successfully`);
                setShowModal(false);
                setEnteredAmount('');
                setFormData(f => ({
                    ...f,
                    source: "",
                    payerName: "",
                    recipient: "",
                    description: ""
                }));
                window.dispatchEvent(new Event('financeRecordUpdated'));
            }
        } catch (err) {
            console.error("Quick entry error:", err);
            toast.error(err.response?.data?.message || 'Failed to record entry');
        } finally {
            setSaving(false);
        }
    };

    const isIncomeType = modalType === 'Income' || modalType === 'AR';

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 bg-[var(--bg-card)] border border-[var(--bg-inner)] p-3 rounded-3xl shadow-2xl space-y-2 min-w-[220px]"
                    >
                        <div className="px-3 py-2 border-b border-white/10">
                            <p className="text-xs font-black uppercase text-[#004AAD] tracking-widest">
                                QUICK ENTRY
                            </p>
                        </div>

                        {menuItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => {
                                    setIsOpen(false);
                                    item.action();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[#004AAD]/10 text-xs font-black text-[var(--text-primary)] uppercase tracking-wider transition-all text-left group"
                            >
                                <span className="p-2 rounded-xl bg-[var(--bg-inner)] group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full bg-[#004AAD] hover:bg-[#003B8B] text-white flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'rotate-45' : ''}`}
                title="Quick Entry Drop-up"
            >
                <FiPlus size={26} />
            </button>

            {/* FULL POPUP MODAL MATCHING INCOME.JSX / EXPENSES.JSX / CASHFLOW.JSX */}
            <AnimatePresence>
                {showModal && (
                    <div 
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all overflow-y-auto"
                        onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false); }}
                    >
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--bg-card)] rounded-[40px] w-full max-w-4xl p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden border border-[var(--bg-inner)] my-10">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">
                                        {modalType === 'Income' && 'REGISTER REVENUE ENTRY (INCOME)'}
                                        {modalType === 'Expense' && 'REGISTER EXPENSE DISBURSEMENT'}
                                        {modalType === 'AR' && 'REGISTER ACCOUNT RECEIVABLE (AR)'}
                                        {modalType === 'AP' && 'REGISTER ACCOUNT PAYABLE (AP)'}
                                        {modalType === 'Charity' && 'REGISTER CHARITY DISBURSEMENT'}
                                    </h3>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-2 opacity-60">
                                        {modalType === 'Income' && 'INITIALIZE OFFICIAL EUR REVENUE FLOW'}
                                        {modalType === 'Expense' && 'RECORD OFFICIAL OUTFLOW & DISBURSEMENT'}
                                        {modalType === 'AR' && 'LOG PENDING CLIENT INVOICE TO RECEIVE IN FUTURE'}
                                        {modalType === 'AP' && 'LOG OUTSTANDING UNPAID VENDOR BILL / LIABILITY'}
                                        {modalType === 'Charity' && 'LOG OFFICIAL CHARITY & DONATION DISBURSEMENT'}
                                    </p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-3 text-[var(--text-secondary)] bg-[var(--bg-inner)] hover:bg-rose-500/10 hover:text-red-500 rounded-2xl transition-all"><FiX size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                                {modalType === 'AP' ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-rose-500">
                                            <FiFileText /> <span className="text-[10px] font-black uppercase tracking-widest">ACCOUNT PAYABLE (AP) CREDIT DETAILS</span>
                                            <div className="flex-1 h-[1px] bg-[var(--bg-inner)] ml-2" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-rose-500 ml-1 tracking-[0.1em]">
                                                    CREDITOR / GIVEN BY (VENDOR)
                                                </label>
                                                <input 
                                                    required 
                                                    value={formData.source} 
                                                    onChange={e => setFormData({...formData, source: e.target.value, item: e.target.value, payerName: e.target.value})} 
                                                    type="text" 
                                                    placeholder="e.g. Vendor / Bank / Person Name" 
                                                    className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all shadow-inner" 
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-rose-500 ml-1 tracking-[0.1em]">
                                                    DEBTOR / TAKEN BY (RECIPIENT)
                                                </label>
                                                <input 
                                                    required 
                                                    value={formData.recipient} 
                                                    onChange={e => setFormData({...formData, recipient: e.target.value, debtorName: e.target.value})} 
                                                    type="text" 
                                                    placeholder="e.g. Employee Name / Recipient" 
                                                    className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all shadow-inner" 
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">
                                                    RECORD DATE
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
                                                <label className="text-[10px] font-black uppercase text-amber-500 ml-1 tracking-[0.1em]">
                                                    SETTLEMENT DUE DATE
                                                </label>
                                                <input 
                                                    value={formData.dueDate || ''} 
                                                    onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                                                    type="date" 
                                                    className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all shadow-inner" 
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">CURRENCY</label>
                                                <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner uppercase">
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                    <option value="AUD">AUD (A$)</option>
                                                    <option value="SAR">SAR (﷼)</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2 text-rose-500">
                                                <label className="text-[10px] font-black uppercase text-rose-500 ml-1 tracking-[0.1em]">
                                                    {currency === 'EUR' ? 'AMOUNT PAYABLE (EUR)' : `AMOUNT IN ${currency}`}
                                                </label>
                                                <input required value={enteredAmount} onChange={e => setEnteredAmount(e.target.value)} type="number" step="0.01" placeholder="0.00" className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-rose-500 font-black transition-all shadow-inner" />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">EXPENSE CATEGORY</label>
                                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner uppercase">
                                                    {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-rose-500 ml-1 tracking-[0.1em]">COMPANY BANK ACCOUNT (FOR SETTLEMENT)</label>
                                                <select 
                                                    value={formData.performedBy} 
                                                    onChange={e => setFormData({ ...formData, performedBy: e.target.value })} 
                                                    className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner uppercase"
                                                >
                                                    {vaultAccounts.map(acc => {
                                                        const label = `${acc.bankName} (${acc.accountTitle})`;
                                                        return <option key={acc.id || acc._id || acc.accountNumber} value={label}>{label}</option>;
                                                    })}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* GENERAL INFORMATION */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 text-[#004AAD]">
                                                <FiFileText /> <span className="text-[10px] font-black uppercase tracking-widest">GENERAL INFORMATION</span>
                                                <div className="flex-1 h-[1px] bg-[var(--bg-inner)] ml-2" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-2 col-span-2">
                                                    <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">
                                                        {isIncomeType ? 'CLEARING ENTITY (SOURCE NAME)' : 'EXPENSE ITEM / REASON'}
                                                    </label>
                                                    <input required value={formData.source} onChange={e => setFormData({...formData, source: e.target.value, item: e.target.value})} type="text" placeholder={isIncomeType ? "e.g. Project Delivery - UI Design" : "e.g. Server Hosting Bill"} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all shadow-inner" />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">CURRENCY</label>
                                                    <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner uppercase">
                                                        <option value="EUR">EUR (€)</option>
                                                        <option value="USD">USD ($)</option>
                                                        <option value="EUR">EUR (€)</option>
                                                        <option value="GBP">GBP (£)</option>
                                                        <option value="AUD">AUD (A$)</option>
                                                        <option value="SAR">SAR (﷼)</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2 text-emerald-500">
                                                    <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">
                                                        {currency === 'EUR' ? 'AMOUNT (EUR)' : `AMOUNT IN ${currency}`}
                                                    </label>
                                                    <input required value={enteredAmount} onChange={e => setEnteredAmount(e.target.value)} type="number" step="0.01" placeholder="0.00" className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-emerald-500 font-black transition-all shadow-inner" />
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
                                                        {isIncomeType ? 'SETTLEMENT DATE' : 'PAYMENT DATE'}
                                                    </label>
                                                    <input required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} type="date" className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all shadow-inner" />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">
                                                        {isIncomeType ? 'PROJECT PAYMENT' : 'EXPENSE CATEGORY'}
                                                    </label>
                                                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner uppercase">
                                                        {(isIncomeType ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* PAYER / RECEIVER OR DISBURSEMENT DETAILS */}
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                            {isIncomeType ? (
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
                                                            <input value={formData.receiverAccNo || (vaultAccounts[0] ? vaultAccounts[0].accountNumber : '010203040506')} readOnly type="text" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-secondary)] font-bold text-xs opacity-60 shadow-inner" />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-4 p-6 bg-[var(--bg-inner)]/30 rounded-3xl border border-[var(--bg-inner)]">
                                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mb-2">
                                                            DISBURSED FROM ACCOUNT
                                                        </p>
                                                        <div className="space-y-2">
                                                             <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1 text-rose-500">
                                                                 PAID FROM COMPANY BANK ACCOUNT
                                                             </label>
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
                                                                PAID TO (VENDOR / RECIPIENT)
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
                                    </>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">TRANSACTION NARRATIVE / NOTES</label>
                                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Specify additional notes..." className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all shadow-inner resize-none" />
                                </div>

                                <button type="submit" disabled={saving} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all disabled:opacity-50 text-white shadow-xl ${isIncomeType ? 'bg-[#004AAD] hover:bg-[#003B8B]' : 'bg-rose-500 hover:bg-rose-600'}`}>
                                    {saving ? 'SYNCHRONIZING...' : `SAVE ${modalType.toUpperCase()}`}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
