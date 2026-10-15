import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiCreditCard, FiDollarSign, FiTrendingUp, FiTrendingDown, 
  FiCalendar, FiFilter, FiSearch, FiChevronDown, FiX, FiCheckCircle, FiEdit2, FiTrash2 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function FinanceAccounts() {
    const [accounts, setAccounts] = useState(() => {
        const saved = localStorage.getItem('company_accounts_vault');
        return saved ? JSON.parse(saved) : [
            { id: '1', bankName: 'Meezan Bank', accountTitle: 'HAT TECH MEDIA (MAIN)', accountNumber: '010203040506', iban: 'PK36MEZN00010203040506', initialBalance: 150000 },
            { id: '2', bankName: 'HBL Bank', accountTitle: 'HAT TECH MEDIA (OPERATING)', accountNumber: '998877665544', iban: 'PK99HABB00998877665544', initialBalance: 250000 },
            { id: '3', bankName: 'Faysal Bank', accountTitle: 'HAT TECH (PETTY CASH)', accountNumber: '112233445566', iban: 'PK11FAYS00112233445566', initialBalance: 50000 }
        ];
    });

    useEffect(() => {
        localStorage.setItem('company_accounts_vault', JSON.stringify(accounts));
        window.dispatchEvent(new Event('companyAccountsUpdated'));
    }, [accounts]);

    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingAcc, setEditingAcc] = useState(null);
    const [loading, setLoading] = useState(true);

    const [incomeList, setIncomeList] = useState([]);
    const [expenseList, setExpenseList] = useState([]);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const [accForm, setAccForm] = useState({
        bankName: '',
        accountTitle: '',
        accountNumber: '',
        iban: '',
        initialBalance: ''
    });

    const fetchRealData = async () => {
        setLoading(true);
        try {
            const [incRes, expRes] = await Promise.allSettled([
                api.get('/finance/income'),
                api.get('/finance/expense')
            ]);
            if (incRes.status === 'fulfilled') setIncomeList(incRes.value.data?.data || []);
            if (expRes.status === 'fulfilled') setExpenseList(expRes.value.data?.data || []);
        } catch (err) {
            toast.error("Failed to load live ledger data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRealData();
        const handleUpdate = () => fetchRealData();
        window.addEventListener('financeRecordUpdated', handleUpdate);
        return () => window.removeEventListener('financeRecordUpdated', handleUpdate);
    }, []);

    const handleSaveAccount = (e) => {
        e.preventDefault();
        if (editingAcc) {
            setAccounts(prev => prev.map(a => a.id === editingAcc.id ? {
                ...a,
                bankName: accForm.bankName,
                accountTitle: accForm.accountTitle,
                accountNumber: accForm.accountNumber,
                iban: accForm.iban || 'N/A',
                initialBalance: parseFloat(accForm.initialBalance) || 0
            } : a));
            toast.success("Account Details Updated");
        } else {
            const accObj = {
                id: Date.now().toString(),
                bankName: accForm.bankName,
                accountTitle: accForm.accountTitle,
                accountNumber: accForm.accountNumber,
                iban: accForm.iban || 'N/A',
                initialBalance: parseFloat(accForm.initialBalance) || 0
            };
            setAccounts(prev => [...prev, accObj]);
            toast.success("Company Account Created");
        }
        setShowModal(false);
        setEditingAcc(null);
        setAccForm({ bankName: '', accountTitle: '', accountNumber: '', iban: '', initialBalance: '' });
    };

    const handleEditClick = (acc, e) => {
        e.stopPropagation();
        setEditingAcc(acc);
        setAccForm({
            bankName: acc.bankName,
            accountTitle: acc.accountTitle,
            accountNumber: acc.accountNumber,
            iban: acc.iban,
            initialBalance: acc.initialBalance
        });
        setShowModal(true);
    };

    const handleDeleteClick = (id, e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this company account?")) {
            setAccounts(prev => prev.filter(a => a.id !== id));
            toast.success("Account Removed");
        }
    };

    const computeAccountStats = (acc) => {
        let filteredInc = incomeList.filter(i => {
            const incDate = new Date(i.date);
            if (customStartDate && customEndDate) {
                return incDate >= new Date(customStartDate) && incDate <= new Date(customEndDate);
            }
            return incDate.getMonth() === selectedMonth && incDate.getFullYear() === selectedYear;
        });

        let filteredExp = expenseList.filter(e => {
            const expDate = new Date(e.date);
            if (customStartDate && customEndDate) {
                return expDate >= new Date(customStartDate) && expDate <= new Date(customEndDate);
            }
            return expDate.getMonth() === selectedMonth && expDate.getFullYear() === selectedYear;
        });

        const isThisAccount = (val) => !val || val.includes(acc.bankName) || val.includes(acc.accountTitle) || val.includes(acc.accountNumber);

        const totalInc = filteredInc.filter(i => isThisAccount(i.receiverAccTitle)).reduce((a, b) => a + (b.amount || 0), 0);
        const apInflow = filteredExp.filter(e => (e.status === 'Unpaid' || e.status === 'Pending') && isThisAccount(e.performedBy)).reduce((a, b) => a + (b.amount || 0), 0);
        const totalExp = filteredExp.filter(e => e.status === 'Paid' && isThisAccount(e.performedBy)).reduce((a, b) => a + (b.amount || 0), 0);

        const netBal = acc.initialBalance + totalInc + apInflow - totalExp;

        return { totalInc, totalExp, apInflow, netBal };
    };

    return (
        <div className="space-y-8 pb-20">
            {/* HEADER */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#004AAD] rounded-l-[40px]" />
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Company Accounts Vault</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-60">Live Bank Account Sync & Balance Ledgers</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* MONTH & YEAR FILTER */}
                    <div className="flex bg-[var(--bg-inner)] p-1.5 rounded-2xl border border-white/10 h-12 items-center gap-2">
                        <FiCalendar className="ml-3 text-[var(--text-secondary)]" size={16} />
                        <select 
                            value={selectedMonth} 
                            onChange={e => setSelectedMonth(Number(e.target.value))}
                            className="bg-transparent text-[11px] font-black uppercase text-[var(--text-primary)] px-2 outline-none cursor-pointer"
                        >
                            {months.map((m, i) => <option key={m} value={i} className="bg-slate-900 text-white">{m}</option>)}
                        </select>
                        <select 
                            value={selectedYear} 
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent text-[11px] font-black uppercase text-[var(--text-primary)] px-2 outline-none cursor-pointer"
                        >
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
                        </select>
                    </div>

                    {/* CUSTOM DATE RANGE FILTER */}
                    <div className="flex items-center gap-2 bg-[var(--bg-inner)] px-3 py-1.5 rounded-2xl border border-white/10 text-xs font-bold text-[var(--text-primary)]">
                        <span className="text-[9px] uppercase font-black opacity-60">Custom Range:</span>
                        <input 
                            type="date" 
                            value={customStartDate} 
                            onChange={e => setCustomStartDate(e.target.value)} 
                            className="bg-transparent outline-none text-[10px] uppercase font-bold text-[var(--text-primary)]"
                        />
                        <span className="opacity-40">-</span>
                        <input 
                            type="date" 
                            value={customEndDate} 
                            onChange={e => setCustomEndDate(e.target.value)} 
                            className="bg-transparent outline-none text-[10px] uppercase font-bold text-[var(--text-primary)]"
                        />
                    </div>

                    <button 
                        onClick={() => { setEditingAcc(null); setAccForm({ bankName: '', accountTitle: '', accountNumber: '', iban: '', initialBalance: '' }); setShowModal(true); }}
                        className="px-6 h-12 bg-[#004AAD] hover:bg-[#003B8B] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
                    >
                        <FiPlus size={18} /> Add Account
                    </button>
                </div>
            </div>

            {/* ACCOUNTS CARDS GRID */}
            {loading ? <div className="py-24 flex justify-center"><LoadingSpinner /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {accounts.map(acc => {
                        const { totalInc, totalExp, netBal } = computeAccountStats(acc);
                        return (
                            <motion.div 
                                key={acc.id}
                                onClick={() => setSelectedAccount(acc)}
                                className={`bg-[var(--bg-card)] p-8 rounded-[36px] border ${selectedAccount?.id === acc.id ? 'border-[#004AAD] shadow-2xl ring-2 ring-[#004AAD]/30' : 'border-[var(--bg-inner)]'} cursor-pointer hover:border-[#004AAD]/50 transition-all relative overflow-hidden group`}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <div className="p-3 bg-[#004AAD]/10 text-[#004AAD] rounded-2xl border border-[#004AAD]/20">
                                        <FiCreditCard size={24} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => handleEditClick(acc, e)} 
                                            className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all"
                                            title="Edit Account"
                                        >
                                            <FiEdit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteClick(acc.id, e)} 
                                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                                            title="Delete Account"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">{acc.bankName}</h3>
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1 opacity-60">{acc.accountTitle}</p>
                                <p className="text-[10px] font-mono text-gray-400 mt-1 uppercase">A/C: {acc.accountNumber}</p>

                                <div className="mt-6 pt-6 border-t border-[var(--bg-inner)] space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase opacity-60">Period Income:</span>
                                        <span className="font-mono font-bold text-emerald-400">+ €{totalInc.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase opacity-60">Period Expenses:</span>
                                        <span className="font-mono font-bold text-rose-500">- €{totalExp.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs pt-2 border-t border-white/5">
                                        <span className="text-[9px] font-black text-[#004AAD] uppercase tracking-widest">Net Available Balance:</span>
                                        <span className="font-black text-[#004AAD] font-mono">€{netBal.toLocaleString()}</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ADD / EDIT ACCOUNT MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[var(--bg-card)] border border-[var(--bg-inner)] p-8 rounded-[36px] max-w-lg w-full shadow-2xl relative"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black uppercase text-[var(--text-primary)] tracking-tight">
                                    {editingAcc ? 'Edit Bank Account' : 'Add Bank Account'}
                                </h3>
                                <p className="text-[10px] font-bold uppercase text-[var(--text-secondary)] opacity-60">Real-time Account Configuration</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-2">
                                <FiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAccount} className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] block mb-1">Bank Name</label>
                                <input 
                                    required 
                                    value={accForm.bankName} 
                                    onChange={e => setAccForm({ ...accForm, bankName: e.target.value })} 
                                    placeholder="e.g. Meezan Bank" 
                                    className="w-full h-12 px-4 rounded-xl bg-[var(--bg-inner)] border border-white/10 outline-none text-xs font-bold text-[var(--text-primary)] uppercase" 
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] block mb-1">Account Title</label>
                                <input 
                                    required 
                                    value={accForm.accountTitle} 
                                    onChange={e => setAccForm({ ...accForm, accountTitle: e.target.value })} 
                                    placeholder="e.g. HAT TECH MEDIA (PVT) LTD" 
                                    className="w-full h-12 px-4 rounded-xl bg-[var(--bg-inner)] border border-white/10 outline-none text-xs font-bold text-[var(--text-primary)] uppercase" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] block mb-1">Account Number</label>
                                    <input 
                                        required 
                                        value={accForm.accountNumber} 
                                        onChange={e => setAccForm({ ...accForm, accountNumber: e.target.value })} 
                                        placeholder="Account Number" 
                                        className="w-full h-12 px-4 rounded-xl bg-[var(--bg-inner)] border border-white/10 outline-none text-xs font-bold text-[var(--text-primary)] font-mono uppercase" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] block mb-1">Opening Balance (EUR)</label>
                                    <input 
                                        required 
                                        type="number"
                                        value={accForm.initialBalance} 
                                        onChange={e => setAccForm({ ...accForm, initialBalance: e.target.value })} 
                                        placeholder="0.00" 
                                        className="w-full h-12 px-4 rounded-xl bg-[var(--bg-inner)] border border-white/10 outline-none text-xs font-bold text-emerald-400 font-mono" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] block mb-1">IBAN / Branch Code (Optional)</label>
                                <input 
                                    value={accForm.iban} 
                                    onChange={e => setAccForm({ ...accForm, iban: e.target.value })} 
                                    placeholder="PKXX..." 
                                    className="w-full h-12 px-4 rounded-xl bg-[var(--bg-inner)] border border-white/10 outline-none text-xs font-bold text-[var(--text-primary)] font-mono uppercase" 
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="w-full h-12 rounded-xl bg-[#004AAD] hover:bg-[#003B8B] text-white font-black uppercase text-xs tracking-widest transition-all"
                            >
                                {editingAcc ? 'UPDATE ACCOUNT DETAILS' : 'SAVE COMPANY ACCOUNT'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
