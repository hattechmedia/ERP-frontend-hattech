import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { FiPlus, FiSearch, FiCalendar, FiDollarSign, FiTag, FiCheckCircle, FiClock, FiEdit2, FiTrash2, FiX, FiFileText, FiPrinter, FiDownload, FiPlay, FiPause } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";
import { useReactToPrint } from "react-to-print";
import FinanceSlip from "../components/FinanceSlip";

export default function FinanceIncome() {
    const { confirm } = useModal();
    const [income, setIncome] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [showSlipModal, setShowSlipModal] = useState(false);

    const [currency, setCurrency] = useState("EUR");
    const [enteredAmount, setEnteredAmount] = useState("");
    const [usdRate, setUsdRate] = useState(278);

    useEffect(() => {
        fetch('https://open.er-api.com/v6/latest/USD')
            .then(res => res.json())
            .then(data => {
                if (data && data.rates && 1.08) {
                    setUsdRate(1.08);
                }
            })
            .catch(err => console.error("Failed to fetch USD rate", err));
            
        return () => window.removeEventListener('companyAccountsUpdated', handleVaultUpdate);
    }, []);

    // Categories must match backend models/Income.js enum
    const incomeCategories = ['Onetime Service', 'Monthly digital Subscription', 'SAAS Subscription', 'Maintainence Support Payment', 'Project Sale', 'Milestone Payment', 'Project', 'Client', 'Service', 'Other'];
    const paymentMethods = ['Transfer', 'Cash', 'Check', 'Other'];

    const [formData, setFormData] = useState({
        source: "", amount: "", date: new Date().toISOString().split('T')[0],
        category: "Onetime Service", status: "Received", description: "",
        payerName: "", payerAccTitle: "", payerAccNo: "",
        receiverAccTitle: vaultAccounts[0] ? `${vaultAccounts[0].bankName} (${vaultAccounts[0].accountTitle})` : "Meezan Bank (Main)",
        receiverAccNo: vaultAccounts[0] ? vaultAccounts[0].accountNumber : "010203040506",
        paymentMethod: "Transfer",
        clientEmail: "", monthlyDate: ""
    });

    const slipRef = useRef();
    const handlePrint = useReactToPrint({
        contentRef: slipRef,
        documentTitle: `Income_Slip_${selectedSlip?._id?.slice(-8)}`
    });

    const fetchIncome = async () => {
        try {
            const res = await api.get('/finance/income');
            setIncome(res.data.data);
        } catch (err) { toast.error("Failed to fetch income"); }
        finally { setLoading(false); }
    };

    useEffect(() => { 
        fetchIncome(); 
        const handleUpdate = () => fetchIncome();
        window.addEventListener('financeRecordUpdated', handleUpdate);
        return () => window.removeEventListener('financeRecordUpdated', handleUpdate);
    }, []);

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
        const rate = getRate(currency);
        const finalAmount = parseFloat(enteredAmount) * rate;
        const submitData = {
            ...formData,
            amount: finalAmount,
            description: currency !== "EUR"
                ? `${formData.description || ""}\n[Converted from ${enteredAmount} ${currency} at rate ${rate} EUR/${currency}]`.trim()
                : formData.description
        };
        try {
            if (editingId) {
                await api.put(`/finance/income/${editingId}`, submitData);
                toast.success("Income updated");
            } else {
                await api.post('/finance/income', submitData);
                toast.success("Income added");
            }
            setShowModal(false);
            setEditingId(null);
            resetForm();
            fetchIncome();
        } catch (err) { 
            console.error(err);
            toast.error(err.response?.data?.message || "Error saving record"); 
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({ 
            source: "", amount: "", date: new Date().toISOString().split('T')[0], 
            category: "Onetime Service", status: "Received", description: "",
            payerName: "", payerAccTitle: "", payerAccNo: "",
            receiverAccTitle: "", receiverAccNo: "", paymentMethod: "Transfer",
            clientEmail: "", monthlyDate: ""
        });
        setEnteredAmount("");
        setCurrency("EUR");
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({ title: 'Delete Income', message: 'Delete this record permanently?', type: 'danger' });
        if (!isConfirmed) return;
        try {
            await api.delete(`/finance/income/${id}`);
            toast.success("Deleted");
            fetchIncome();
        } catch (err) { toast.error("Delete failed"); }
    };

    const handleEdit = (rec) => {
        setEditingId(rec._id);
        setFormData({
            source: rec.source, amount: rec.amount,
            date: rec.date.split('T')[0], category: rec.category,
            status: rec.status, description: rec.description || "",
            payerName: rec.payerName || "", payerAccTitle: rec.payerAccTitle || "", 
            payerAccNo: rec.payerAccNo || "",
            receiverAccTitle: rec.receiverAccTitle || "", 
            receiverAccNo: rec.receiverAccNo || "", paymentMethod: rec.paymentMethod || "Transfer",
            clientEmail: rec.clientEmail || "",
            monthlyDate: rec.monthlyDate ? rec.monthlyDate.split('T')[0] : ""
        });
        setEnteredAmount(rec.amount.toString());
        setCurrency("EUR");
        setShowModal(true);
    };

    const handleToggleSubscription = async (id) => {
        try {
            await api.put(`/finance/income/${id}/toggle-subscription`);
            toast.success("Subscription status updated");
            fetchIncome();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update subscription");
        }
    };

    const viewSlip = (rec) => {
        setSelectedSlip(rec);
        setShowSlipModal(true);
    };

    const filtered = income.filter(i => 
        i.source.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (i.payerName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statsData = {
        total: income.reduce((acc, curr) => acc + curr.amount, 0),
        received: income.filter(i => i.status === 'Received').reduce((acc, curr) => acc + curr.amount, 0),
        pending: income.filter(i => i.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0)
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-[var(--bg-card)] p-8 rounded-[32px] border border-[var(--bg-inner)] shadow-2xl relative overflow-hidden text-[var(--text-primary)]">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#004AAD]" />
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Net Revenue Terminal</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-80">Manual Entry & Income Settlement</p>
                </div>
                <button 
                    onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}
                    className="bg-[#004AAD] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_20px_40px_-5px_rgba(0,74,173,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
                >
                    <FiPlus className="group-hover:rotate-90 transition-transform" /> Register New Revenue
                </button>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--bg-inner)] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-12 translate-x-12 group-hover:bg-primary/10 transition-all duration-500" />
                    <p className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 opacity-60">Total Gross Revenue</p>
                    <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">€{statsData.total.toLocaleString()}</p>
                </div>
                <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--bg-inner)] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -translate-y-12 translate-x-12 group-hover:bg-emerald-500/10 transition-all duration-500" />
                    <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2 opacity-60">Settled / Received</p>
                    <p className="text-3xl font-black text-emerald-500 tracking-tighter">€{statsData.received.toLocaleString()}</p>
                </div>
                <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--bg-inner)] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -translate-y-12 translate-x-12 group-hover:bg-amber-500/10 transition-all duration-500" />
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2 opacity-60">Pending Settlement</p>
                    <p className="text-3xl font-black text-amber-500 tracking-tighter">€{statsData.pending.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--bg-inner)] overflow-hidden">
                <div className="p-8 border-b border-[var(--bg-inner)] bg-gradient-to-r from-[var(--bg-inner)]/20 to-transparent">
                    <div className="relative max-w-md">
                        <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#004AAD]" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search active revenue streams..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full finance-terminal-input pr-6 py-4 rounded-2xl outline-none font-black text-sm transition-all focus:ring-4 focus:ring-[#004AAD]/20 shadow-2xl" 
                        />
                    </div>
                </div>

                {loading ? <div className="py-20 flex justify-center"><LoadingSpinner /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-[#1a1a2e] border-b border-[var(--bg-inner)] shadow-sm">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">Source / Payer</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">Amount</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/90 text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/90 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--bg-inner)]">
                                {filtered.map(rec => (
                                    <tr key={rec._id} className="hover:bg-[var(--bg-inner)]/40 transition-all group">
                                        <td className="px-8 py-6">
                                            <p className="font-black text-[var(--text-primary)] uppercase leading-none">{rec.source}</p>
                                            <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-1.5">{rec.payerName || 'Direct'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="px-2 py-0.5 w-fit rounded bg-[var(--bg-inner)] text-[var(--text-secondary)] text-[9px] font-black uppercase">{rec.category}</span>
                                                {rec.category === 'Monthly digital Subscription' && !rec.parentSubscriptionId && (
                                                    <span className={`px-2 py-0.5 w-fit rounded text-[9px] font-black uppercase ${rec.subscriptionStatus === 'Stopped' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                        Subscription: {rec.subscriptionStatus || 'Active'}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-[var(--text-secondary)] font-bold">{rec.paymentMethod} • {new Date(rec.date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-3xl font-black text-[var(--text-primary)] leading-none tracking-tighter">€{rec.amount.toLocaleString()}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${rec.status === 'Received' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {rec.status === 'Received' ? <FiCheckCircle /> : <FiClock />}
                                                    {rec.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3 transition-all">
                                                <button onClick={() => viewSlip(rec)} className="p-2.5 bg-[#004AAD]/10 text-[#004AAD] hover:bg-[#004AAD] hover:text-white rounded-xl transition-all shadow-sm" title="View Slip"><FiFileText size={16} /></button>
                                                {rec.category === 'Monthly digital Subscription' && !rec.parentSubscriptionId && (
                                                    <button 
                                                        onClick={() => handleToggleSubscription(rec._id)} 
                                                        className={`p-2.5 rounded-xl transition-all shadow-sm ${rec.subscriptionStatus === 'Stopped' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white'}`} 
                                                        title={rec.subscriptionStatus === 'Stopped' ? 'Resume Subscription' : 'Stop Subscription'}
                                                    >
                                                        {rec.subscriptionStatus === 'Stopped' ? <FiPlay size={16} /> : <FiPause size={16} />}
                                                    </button>
                                                )}
                                                <button onClick={() => handleEdit(rec)} className="p-2.5 bg-[#004AAD]/10 text-[#004AAD] hover:bg-[#004AAD] hover:text-white rounded-xl transition-all shadow-sm"><FiEdit2 size={16} /></button>
                                                <button onClick={() => handleDelete(rec._id)} className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"><FiTrash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-12 text-center text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs opacity-50">No Revenue Records Found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Main Entry Modal */}
            <AnimatePresence>
                {showModal && (
                    <div 
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all"
                        onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false); }}
                    >
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--bg-card)] rounded-[40px] w-full max-w-4xl p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden border border-[var(--bg-inner)]">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">{editingId ? 'Modify Record' : 'Revenue Entry'}</h3>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-2 opacity-60">Initialize Official Pkr Revenue Flow</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-3 text-[var(--text-secondary)] bg-[var(--bg-inner)] hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all"><FiX size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                                {/* Basic Info Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-[#004AAD]">
                                        <FiTag /> <span className="text-[10px] font-black uppercase tracking-widest">General Information</span>
                                        <div className="flex-1 h-[1px] bg-[var(--bg-inner)] ml-2" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">Clearing Entity (Source Name)</label>
                                            <input required value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} type="text" placeholder="e.g. Project Delivery - UI Design" className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all focus:ring-4 focus:ring-[#004AAD]/20 shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">Currency</label>
                                            <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner">
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
                                                {currency === 'EUR' ? 'Net Capital (EUR)' : `Amount in ${currency}`}
                                            </label>
                                            <input required value={enteredAmount} onChange={e => setEnteredAmount(e.target.value)} type="number" step="0.01" placeholder="0.00" className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-emerald-500 font-black transition-all focus:ring-4 focus:ring-emerald-500/10 shadow-inner" />
                                            <p className="text-[10px] text-gray-400 mt-1 font-bold">
                                                 {enteredAmount
                                                     ? (currency === 'EUR'
                                                         ? `Direct EUR Amount (No Conversion)`
                                                         : `≈ ${(parseFloat(enteredAmount) * getRate(currency)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} EUR (Rate: ${getRate(currency)})`)
                                                     : '\u00A0'}
                                             </p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">Settlement Date</label>
                                            <input required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} type="date" className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">Project Payment</label>
                                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner">
                                                {incomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">Payment Method</label>
                                            <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner">
                                                {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Subscription Settings */}
                                {formData.category === 'Monthly digital Subscription' && (
                                    <div className="space-y-6 p-6 bg-[var(--bg-inner)]/30 rounded-3xl border border-[#004AAD]/20">
                                        <div className="flex items-center gap-2 text-[#004AAD]">
                                            <FiClock /> <span className="text-[10px] font-black uppercase tracking-widest">Subscription Settings</span>
                                            <div className="flex-1 h-[1px] bg-[var(--bg-inner)] ml-2" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1">Client Email (For Reminders)</label>
                                                <input required value={formData.clientEmail} onChange={e => setFormData({...formData, clientEmail: e.target.value})} type="email" placeholder="client@example.com" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-bold text-xs shadow-inner" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1">Monthly Billing Date</label>
                                                <input required value={formData.monthlyDate} onChange={e => setFormData({...formData, monthlyDate: e.target.value})} type="date" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-bold text-xs shadow-inner" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payer/Receiver Details */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-[#004AAD]">
                                        <FiFileText /> <span className="text-[10px] font-black uppercase tracking-widest">Account Details</span>
                                        <div className="flex-1 h-[1px] bg-[var(--bg-inner)] ml-2" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-4 p-6 bg-[var(--bg-inner)]/30 rounded-3xl border border-[var(--bg-inner)]">
                                            <p className="text-[10px] font-black text-[#004AAD] uppercase tracking-widest text-center mb-2">Payer Information</p>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1">Payer Name</label>
                                                <input value={formData.payerName} onChange={e => setFormData({...formData, payerName: e.target.value})} type="text" placeholder="Full Name" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-bold text-xs shadow-inner" />
                                            </div>
                                            {formData.paymentMethod !== 'Cash' && (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1">Account Title</label>
                                                        <input value={formData.payerAccTitle} onChange={e => setFormData({...formData, payerAccTitle: e.target.value})} type="text" placeholder="Title" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-bold text-xs shadow-inner" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1">Account No</label>
                                                        <input value={formData.payerAccNo} onChange={e => setFormData({...formData, payerAccNo: e.target.value})} type="text" placeholder="Bank/Serial A/C" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-bold text-xs shadow-inner" />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="space-y-4 p-6 bg-[var(--bg-inner)]/30 rounded-3xl border border-[var(--bg-inner)]">
                                            <p className="text-[10px] font-black text-[#004AAD] uppercase tracking-widest text-center mb-2">Receiver Information</p>
                                            {formData.paymentMethod !== 'Cash' && (
                                                <>
                                                    <div className="space-y-2">
                                                         <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1 text-emerald-500">Receiver Bank Account (Company)</label>
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
                                                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1">Receiver Account No</label>
                                                        <input value={formData.receiverAccNo} onChange={e => setFormData({...formData, receiverAccNo: e.target.value})} type="text" placeholder="A/C No / IBAN" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-bold text-xs shadow-inner" />
                                                    </div>
                                                </>
                                            )}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase ml-1">Clearing Status</label>
                                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black text-xs cursor-pointer shadow-inner">
                                                    {['Received', 'Pending'].map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-[0.1em]">Transaction Narrative / Description</label>
                                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Specify project details or payment references..." className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all shadow-inner resize-none" />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="w-full py-5 bg-[#004AAD] text-white rounded-[24px] font-black uppercase tracking-widest shadow-[0_25px_50px_-10px_rgba(0,74,173,0.4)] hover:scale-[1.02] active:scale-95 transition-all mt-6 disabled:opacity-50"
                                >
                                    {saving ? 'SYNCHRONIZING...' : (editingId ? 'COMMIT UPDATES' : 'REGISTER REVENUE')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Slip Modal */}
            <AnimatePresence>
                {showSlipModal && (
                    <div 
                        className="fixed inset-0 z-[100] flex justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto py-20"
                        onClick={(e) => { if(e.target === e.currentTarget) setShowSlipModal(false); }}
                    >
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="w-full max-w-5xl relative">
                            <div className="absolute -top-12 right-0 flex gap-4">
                                <button onClick={handlePrint} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-xs shadow-2xl hover:scale-105 transition-all">
                                    <FiPrinter /> Print Slip
                                </button>
                                <button onClick={() => setShowSlipModal(false)} className="p-3 bg-red-500 text-white rounded-xl shadow-2xl hover:scale-105 transition-all">
                                    <FiX size={20} />
                                </button>
                            </div>
                            <div className="overflow-hidden rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
                                <FinanceSlip ref={slipRef} data={selectedSlip} type="Income" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
