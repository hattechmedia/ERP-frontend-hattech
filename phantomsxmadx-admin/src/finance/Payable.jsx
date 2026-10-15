import { useState, useEffect } from "react";
import api from "../services/api";
import { FiSearch, FiClock, FiCheckCircle, FiArrowDownRight, FiCalendar, FiDollarSign, FiFilter, FiTrash2, FiEdit3, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";

export default function FinancePayable() {
    const [payables, setPayables] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editForm, setEditForm] = useState({ item: "", recipient: "", amount: "", category: "Business Expense" });

    const fetchPayables = async () => {
        setLoading(true);
        try {
            const res = await api.get('/finance/expense');
            if (res.data && res.data.data) {
                const unpaid = res.data.data.filter(e => e.status === 'Unpaid' || e.status === 'Pending');
                setPayables(unpaid);
            }
        } catch (err) {
            toast.error("Failed to fetch payable accounts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayables();
        const handleUpdate = () => fetchPayables();
        window.addEventListener('financeRecordUpdated', handleUpdate);
        return () => window.removeEventListener('financeRecordUpdated', handleUpdate);
    }, []);

    const markAsPaid = async (id) => {
        try {
            await api.put(`/finance/expense/${id}`, { status: 'Paid' });
            toast.success("Payable settled successfully");
            fetchPayables();
            window.dispatchEvent(new Event('financeRecordUpdated'));
        } catch (err) {
            toast.error("Failed to settle payable");
        }
    };

    const deletePayable = async (id) => {
        if (!window.confirm("Are you sure you want to delete this Payable bill?")) return;
        try {
            await api.delete(`/finance/expense/${id}`);
            toast.success("Payable bill deleted");
            fetchPayables();
            window.dispatchEvent(new Event('financeRecordUpdated'));
        } catch (err) {
            toast.error("Failed to delete payable");
        }
    };

    const openEdit = (p) => {
        setEditItem(p);
        setEditForm({
            item: p.item || "",
            recipient: p.recipient || p.debtorName || "",
            amount: p.amount || "",
            category: p.category || "Business Expense"
        });
        setShowEditModal(true);
    };

    const handleUpdatePayable = async (e) => {
        e.preventDefault();
        if (!editItem) return;
        try {
            await api.put(`/finance/expense/${editItem._id}`, {
                item: editForm.item,
                recipient: editForm.recipient,
                debtorName: editForm.recipient,
                amount: parseFloat(editForm.amount) || 0,
                category: editForm.category
            });
            toast.success("Payable bill updated");
            setShowEditModal(false);
            fetchPayables();
            window.dispatchEvent(new Event('financeRecordUpdated'));
        } catch (err) {
            toast.error("Failed to update payable bill");
        }
    };

    const filtered = payables.filter(p => 
        (p.item || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.recipient || p.debtorName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPayableAmount = filtered.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return (
        <div className="space-y-8 pb-12">
            {/* Header section */}
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 rounded-l-[40px]" />
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Accounts Payable (AP)</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-60">Outstanding Liabilities & Vendor Bills</p>
                </div>

                <div className="text-right border-l border-[var(--bg-inner)] pl-6">
                    <p className="text-[10px] font-black uppercase text-[var(--text-secondary)] opacity-50 tracking-[0.2em] mb-1">Total Outstanding Payable</p>
                    <p className="text-3xl font-black text-rose-500 leading-none tracking-tighter font-mono">PKR {totalPayableAmount.toLocaleString()}</p>
                </div>
            </div>

            {/* SEARCH */}
            <div className="bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--bg-inner)]">
                <div className="relative max-w-md">
                    <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search payable bills or vendors..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--bg-inner)] pl-16 pr-6 py-4 rounded-2xl outline-none font-black text-xs text-[var(--text-primary)] transition-all shadow-inner uppercase" 
                    />
                </div>
            </div>

            {/* PAYABLE LIST TABLE */}
            {loading ? (
                <div className="py-24 flex justify-center"><LoadingSpinner /></div>
            ) : filtered.length > 0 ? (
                <div className="bg-[var(--bg-card)] rounded-[40px] border border-[var(--bg-inner)] overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[var(--bg-inner)]/50">
                                <th className="px-8 py-5 text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest">Bill / Item</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest">Category</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest">Recipient / Vendor</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest">Date</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest text-right">Amount (PKR)</th>
                                <th className="px-8 py-5 text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--bg-inner)]">
                            {filtered.map(item => (
                                <tr key={item._id} className="hover:bg-[var(--bg-inner)]/30 transition-all">
                                    <td className="px-8 py-5 font-black text-xs text-[var(--text-primary)] uppercase">{item.item}</td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-500/20">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 font-bold text-xs text-gray-400 uppercase">{item.recipient || item.debtorName || 'Direct Vendor'}</td>
                                    <td className="px-8 py-5 text-[10px] font-bold text-[var(--text-secondary)]">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="px-8 py-5 text-right font-black text-rose-500 font-mono text-sm">- {item.amount.toLocaleString()}</td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => markAsPaid(item._id)}
                                                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
                                            >
                                                SETTLE BILL
                                            </button>
                                            <button 
                                                onClick={() => openEdit(item)}
                                                title="Edit Payable Bill" 
                                                className="p-2 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition-all"
                                            >
                                                <FiEdit3 size={15} />
                                            </button>
                                            <button 
                                                onClick={() => deletePayable(item._id)}
                                                title="Delete Payable Bill" 
                                                className="p-2 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all"
                                            >
                                                <FiTrash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-20 text-center bg-[var(--bg-card)] rounded-[40px] border border-[var(--bg-inner)]">
                    <p className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-xs opacity-50">No Outstanding Accounts Payable</p>
                </div>
            )}

            {/* EDIT PAYABLE MODAL */}
            <AnimatePresence>
                {showEditModal && editItem && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowEditModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-[var(--bg-card)] p-8 rounded-[36px] w-full max-w-lg border border-[var(--bg-inner)] shadow-2xl relative">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)]">Edit Accounts Payable (AP)</h3>
                                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl text-gray-400 hover:text-red-500 bg-[var(--bg-inner)]"><FiX size={18} /></button>
                            </div>
                            <form onSubmit={handleUpdatePayable} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Bill / Entry Title</label>
                                    <input required value={editForm.item} onChange={e => setEditForm({ ...editForm, item: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] outline-none text-xs font-bold uppercase text-[var(--text-primary)] mt-1" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Recipient / Vendor Name (Paid To)</label>
                                    <input value={editForm.recipient} onChange={e => setEditForm({ ...editForm, recipient: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] outline-none text-xs font-bold uppercase text-[var(--text-primary)] mt-1" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Amount (PKR)</label>
                                    <input required type="number" step="0.01" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] outline-none text-xs font-bold text-rose-500 mt-1" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Category</label>
                                    <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-inner)] outline-none text-xs font-bold uppercase text-[var(--text-primary)] mt-1">
                                        <option value="Business Expense">BUSINESS EXPENSE</option>
                                        <option value="Rent">RENT</option>
                                        <option value="Bill">BILL</option>
                                        <option value="Hardware">HARDWARE</option>
                                        <option value="Software">SOFTWARE</option>
                                        <option value="Salary Expense">SALARY EXPENSE</option>
                                        <option value="Equity Distribution">EQUITY DISTRIBUTION</option>
                                        <option value="Other">OTHER</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-4 bg-[#004AAD] text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg mt-4">
                                    Update Payable Bill
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
