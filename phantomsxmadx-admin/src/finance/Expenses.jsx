import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { FiPlus, FiSearch, FiCheckCircle, FiClock, FiEdit2, FiTrash2, FiX, FiFileText, FiPrinter, FiTag, FiBarChart2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";
import { useReactToPrint } from "react-to-print";
import FinanceSlip from "../components/FinanceSlip";

import { getCompanyVaultAccounts } from "./companyAccounts";

export default function FinanceExpenses() {
    const { confirm } = useModal();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [showSlipModal, setShowSlipModal] = useState(false);

    const [vaultAccounts, setVaultAccounts] = useState(getCompanyVaultAccounts());

    useEffect(() => {
        const handleVaultUpdate = () => setVaultAccounts(getCompanyVaultAccounts());
        window.addEventListener('companyAccountsUpdated', handleVaultUpdate);
        return () => window.removeEventListener('companyAccountsUpdated', handleVaultUpdate);
    }, []);

    // Categories must match backend models/Expense.js enum
    const categories = ['Charity', 'Other', 'Reserve', 'Business Expense', 'Rent', 'Bill', 'Hardware', 'Software', 'Snacks', 'Travel', 'Marketing', 'Tea', 'Loan', 'Equity Distribution', 'Salary Expense'];
    const paymentMethods = ['Cash', 'Transfer', 'Check', 'Other'];

    const [formData, setFormData] = useState({
        item: "", amount: "", date: new Date().toISOString().split('T')[0],
        category: "Other", status: "Paid", description: "",
        debtorName: "", paymentMethod: "Cash",
        performedBy: vaultAccounts[0] ? `${vaultAccounts[0].bankName} (${vaultAccounts[0].accountTitle})` : "Meezan Bank (Main)",
        recipient: ""
    });

    const slipRef = useRef();
    const handlePrint = useReactToPrint({
        contentRef: slipRef,
        documentTitle: `Expense_Slip_${selectedSlip?._id?.slice(-8)}`
    });

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/finance/expense');
            setExpenses(res.data.data);
        } catch (err) { toast.error("Failed to fetch expenses"); }
        finally { setLoading(false); }
    };

    useEffect(() => { 
        fetchExpenses(); 
        const handleUpdate = () => fetchExpenses();
        window.addEventListener('financeRecordUpdated', handleUpdate);
        return () => window.removeEventListener('financeRecordUpdated', handleUpdate);
    }, []);

    const resetForm = () => {
        setFormData({ 
            item: "", amount: "", date: new Date().toISOString().split('T')[0], 
            category: "Other", status: "Paid", description: "",
            debtorName: "", paymentMethod: "Cash", performedBy: "", recipient: ""
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/finance/expense/${editingId}`, formData);
                toast.success("Expense updated");
            } else {
                await api.post('/finance/expense', formData);
                toast.success("Expense logged");
            }
            setShowModal(false);
            setEditingId(null);
            resetForm();
            fetchExpenses();
        } catch (err) { 
            console.error(err);
            toast.error(err.response?.data?.message || "Error saving record"); 
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({ title: 'Delete Expense', message: 'Delete this record permanently?', type: 'danger' });
        if (!isConfirmed) return;
        try {
            await api.delete(`/finance/expense/${id}`);
            toast.success("Deleted");
            fetchExpenses();
        } catch (err) { toast.error("Delete failed"); }
    };

    const handleEdit = (rec) => {
        setEditingId(rec._id);
        setFormData({
            item: rec.item, amount: rec.amount,
            date: rec.date.split('T')[0], category: rec.category,
            status: rec.status, description: rec.description || "",
            debtorName: rec.debtorName || "", paymentMethod: rec.paymentMethod || "Cash",
            performedBy: rec.performedBy || "", recipient: rec.recipient || ""
        });
        setShowModal(true);
    };

    const viewSlip = (rec) => {
        setSelectedSlip(rec);
        setShowSlipModal(true);
    };

    const filtered = expenses.filter(i => 
        i.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (i.debtorName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-[var(--bg-card)] p-8 rounded-[32px] border border-[var(--bg-inner)] shadow-2xl relative overflow-hidden text-[var(--text-primary)]">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Expenditure Terminal</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-80">Operational Cost Outflow Register</p>
                </div>
                <button 
                    onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}
                    className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_20px_40px_-5px_rgba(244,63,94,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
                >
                    <FiPlus className="group-hover:rotate-90 transition-transform" /> Log New Expenditure
                </button>
            </div>

            <div className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--bg-inner)] overflow-hidden">
                <div className="p-8 border-b border-[var(--bg-inner)] bg-gradient-to-r from-rose-500/5 to-transparent">
                    <div className="relative max-w-md">
                        <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search disbursement logs..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full finance-terminal-input pr-6 py-4 rounded-2xl outline-none font-black text-sm transition-all focus:ring-4 focus:ring-rose-500/10 shadow-2xl" 
                        />
                    </div>
                </div>

                {loading ? <div className="py-24 flex justify-center"><LoadingSpinner /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-[#1a1a2e] border-b border-[var(--bg-inner)] shadow-sm">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">Entry / Payer</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">Category</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">To Whom / Recipient</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">Capital Outflow</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/90 text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/90 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--bg-inner)]">
                                {filtered.map(rec => (
                                    <tr key={rec._id} className="hover:bg-[var(--bg-inner)]/40 transition-all group">
                                        <td className="px-8 py-6">
                                            <p className="font-black text-[var(--text-primary)] uppercase leading-none">{rec.item}</p>
                                            <div className="flex flex-col gap-1 mt-1.5 ">
                                                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-tighter">
                                                    {new Date(rec.date).toDateString()} 
                                                    {rec.category === 'Loan' ? ` • To: ${rec.debtorName}` : ''}
                                                </p>
                                                {rec.performedBy && (
                                                    <p className="text-[9px] text-[#004AAD] font-black uppercase tracking-widest">
                                                        Performed By: {rec.performedBy}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 rounded-lg bg-[var(--bg-inner)] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest border border-white/5">{rec.category}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-[var(--text-primary)] uppercase text-[10px] tracking-widest">{rec.recipient || 'N/A'}</p>
                                        </td>
                                        <td className="px-8 py-6 font-black text-rose-500 text-lg">
                                            PKR {rec.amount.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${rec.status === 'Paid' ? 'bg-[#004AAD]/10 text-[#004AAD] shadow-[0_0_15px_-5px_rgba(0,74,173,0.3)]' : 'bg-rose-500/10 text-rose-500 shadow-[0_0_15px_-5px_rgba(244,63,94,0.3)]'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${rec.status === 'Paid' ? 'bg-[#004AAD]' : 'bg-rose-500'} animate-pulse`} />
                                                    {rec.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3 transition-all">
                                                <button onClick={() => viewSlip(rec)} className="p-2.5 bg-[#004AAD]/10 text-[#004AAD] hover:bg-[#004AAD] hover:text-white rounded-xl transition-all shadow-sm" title="View Slip"><FiFileText size={16} /></button>
                                                <button onClick={() => handleEdit(rec)} className="p-2.5 bg-[#004AAD]/10 text-[#004AAD] hover:bg-[#004AAD] hover:text-white rounded-xl transition-all shadow-sm"><FiEdit2 size={16} /></button>
                                                <button onClick={() => handleDelete(rec._id)} className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"><FiTrash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-16 text-center text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs opacity-50">No Expenditure Logs Found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Entry Modal */}
            <AnimatePresence>
                {showModal && (
                    <div 
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all"
                        onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false); }}
                    >
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--bg-card)] rounded-[40px] w-full max-w-2xl p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden border border-[var(--bg-inner)]">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">{editingId ? 'Modify Ledger' : 'Log Disbursement'}</h3>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-2 opacity-60">Log Official Pkr Capital Outflow</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-3 text-[var(--text-secondary)] bg-[var(--bg-inner)] hover:bg-rose-500/10 hover:text-red-500 rounded-2xl transition-all"><FiX size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Expense Identifier (Item)</label>
                                        <input required value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} type="text" placeholder="e.g. AWS Cloud Infrastructure" className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all focus:ring-4 focus:ring-rose-500/20 shadow-inner" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-1 tracking-widest">Amount (PKR)</label>
                                        <input required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} type="number" step="0.01" className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-rose-500 font-black transition-all focus:ring-4 focus:ring-rose-500/10 shadow-inner" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Settlement Date</label>
                                        <input required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} type="date" className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all shadow-inner" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Operating Category</label>
                                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner">
                                            {categories.map(c => <option key={c} value={c}>{c === 'Other' ? 'Petty Cash' : c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Payment Method</label>
                                        <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner">
                                            {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>

                                    {formData.category === 'Loan' && (
                                        <div className="space-y-2 col-span-2 animate-in slide-in-from-top-4 duration-300">
                                            <div className="p-6 bg-rose-500/5 rounded-3xl border border-rose-500/10">
                                                <label className="text-[10px] font-black text-rose-500 uppercase ml-1 tracking-widest mb-2 block">Debtor Entity Identity (Loan Recipient)</label>
                                                <input required={formData.category === 'Loan'} value={formData.debtorName} onChange={e => setFormData({...formData, debtorName: e.target.value})} type="text" placeholder="Full Name / Company" className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all focus:ring-4 focus:ring-rose-500/20 shadow-inner" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Log Status</label>
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner">
                                            {['Paid', 'Unpaid', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">To Whom Given (Recipient / Person Name)</label>
                                        <input value={formData.recipient} onChange={e => setFormData({...formData, recipient: e.target.value})} type="text" placeholder="Recipient Name / Person / Entity Identity" className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all focus:ring-4 focus:ring-rose-500/20 shadow-inner" />
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Disbursing Company Bank Account</label>
                                        <select value={formData.performedBy} onChange={e => setFormData({...formData, performedBy: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all cursor-pointer shadow-inner uppercase">
                                            {vaultAccounts.map(acc => {
                                                const label = `${acc.bankName} (${acc.accountTitle})`;
                                                return <option key={acc.id || acc._id || acc.accountNumber} value={label}>{label}</option>;
                                            })}
                                        </select>
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Payment Receipt / Screenshot (Optional)</label>
                                        <input type="file" accept="image/*" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        description: `${prev.description || ''}\n[Receipt Uploaded]`.trim()
                                                    }));
                                                    toast.success("Receipt attached");
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }} className="w-full px-5 py-3 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-xs text-[var(--text-secondary)] font-bold shadow-inner cursor-pointer" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Narrative / Description</label>
                                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Specify reason for disbursement..." className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black transition-all shadow-inner resize-none" />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="w-full py-5 bg-rose-500 text-white rounded-[24px] font-black uppercase tracking-widest shadow-[0_25px_50px_-10px_rgba(244,63,94,0.4)] hover:scale-[1.02] active:scale-95 transition-all mt-6 disabled:opacity-50"
                                >
                                    {saving ? 'LOGGING OUTFLOW...' : (editingId ? 'COMMIT LEDGER UPDATES' : 'FINALIZE DISBURSEMENT')}
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
                                <FinanceSlip ref={slipRef} data={selectedSlip} type="Expense" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
