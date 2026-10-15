import { useState, useEffect } from "react";
import api from "../services/api";
import { FiSearch, FiClock, FiCheckCircle, FiPlus, FiArrowUpRight, FiTrash2, FiMessageSquare, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";

export default function FinanceReceivable() {
    const { confirm } = useModal();
    const [receivables, setReceivables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        clientName: "", projectName: "", amount: "",
        dueDate: new Date().toISOString().split('T')[0],
        status: "Pending", description: ""
    });

    const fetchData = async () => {
        try {
            const res = await api.get('/finance/receivables');
            setReceivables(res.data.data);
        } catch (err) { toast.error("Failed to fetch"); }
        finally { setLoading(false); }
    };

    useEffect(() => { 
        fetchData(); 
        const handleUpdate = () => fetchData();
        window.addEventListener('financeRecordUpdated', handleUpdate);
        return () => window.removeEventListener('financeRecordUpdated', handleUpdate);
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/finance/income', {
                source: formData.clientName + " - " + formData.projectName,
                amount: formData.amount,
                date: formData.dueDate,
                status: 'Pending',
                category: 'Project',
                description: formData.description
            });
            toast.success("Receivable registered");
            setShowAddModal(false);
            setFormData({ clientName: "", projectName: "", amount: "", dueDate: new Date().toISOString().split('T')[0], status: "Pending", description: "" });
            fetchData();
        } catch (err) { toast.error("Failed to add"); }
        finally { setSaving(false); }
    };

    const markAsReceived = async (id, isLoan = false) => {
        const title = isLoan ? 'Confirm Repayment' : 'Confirm Payment';
        const message = isLoan ? 'Has this loan been repaid in full?' : 'Has this payment been received in full?';
        const isConfirmed = await confirm({ title, message, type: 'primary' });
        if (!isConfirmed) return;
        setSaving(true);
        try {
            const endpoint = isLoan ? `/finance/expense/${id}` : `/finance/income/${id}`;
            const status = isLoan ? 'Paid' : 'Received';
            await api.put(endpoint, { status });
            toast.success("Updated");
            fetchData();
        } catch (err) { toast.error("Update failed"); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id, isLoan = false) => {
        const isConfirmed = await confirm({ title: 'Delete Entry', message: 'Delete this entry safely?', type: 'danger' });
        if (!isConfirmed) return;
        try {
            const endpoint = isLoan ? `/finance/expense/${id}` : `/finance/income/${id}`;
            await api.delete(endpoint);
            toast.success("Deleted");
            fetchData();
        } catch (err) { toast.error("Delete failed"); }
    };

    const filtered = receivables.filter(r => 
        (r.source || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (r.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.debtorName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--bg-inner)] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden text-[var(--text-primary)]">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#004AAD] shadow-[0_0_20px_rgba(0,74,173,0.5)]" />
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Accounts Receivable Terminal</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Expected Revenue & Asset Management</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#004AAD] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_20px_40px_-5px_rgba(0,74,173,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
                >
                    <FiPlus className="group-hover:rotate-90 transition-transform" /> Register New Asset
                </button>
            </div>

            <div className="bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--bg-inner)] shadow-2xl">
                <div className="relative max-w-md">
                    <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#004AAD]" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search active project contracts..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full finance-terminal-input pl-20 pr-6 py-4 rounded-2xl outline-none font-black text-sm transition-all focus:ring-4 focus:ring-[#004AAD]/10 shadow-2xl" 
                    />
                </div>
            </div>

            {loading ? <div className="py-24 flex justify-center"><LoadingSpinner /></div> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <AnimatePresence>
                        {filtered.map(rec => (
                            <motion.div 
                                layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                key={rec._id} 
                                className="bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--bg-inner)] hover:shadow-2xl transition-all group overflow-hidden relative border-b-4 border-b-transparent hover:border-b-[#004AAD]/50"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-[#004AAD]/10 text-[#004AAD] rounded-[20px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <FiArrowUpRight size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-[var(--text-primary)] uppercase leading-none mb-2 truncate max-w-[200px]">{rec.source || rec.clientName}</h4>
                                            <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.1em] opacity-60">{rec.isLoan ? 'LOAN RECIPIENT' : 'CONTRACT ENTITY'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-[var(--text-primary)] leading-none tracking-tighter">€{rec.amount.toLocaleString()}</p>
                                        <p className={`text-[10px] font-black uppercase mt-2 tracking-[0.2em] flex items-center justify-end gap-1.5 ${rec.status === 'Received' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${rec.status === 'Received' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                                            {rec.status}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-[var(--bg-inner)]/50 p-4 rounded-2xl border border-[var(--bg-inner)]">
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase mb-1.5 opacity-60">Settlement Target</p>
                                        <div className="flex items-center gap-2 text-[var(--text-primary)] font-black text-xs uppercase">
                                            <FiClock className="text-[#004AAD]" /> {new Date(rec.date || rec.dueDate).toDateString()}
                                        </div>
                                    </div>
                                    <div className="bg-[var(--bg-inner)]/50 p-4 rounded-2xl border border-[var(--bg-inner)] cursor-help truncate" title={rec.description}>
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase mb-1.5 opacity-60">{rec.isLoan ? 'LOAN NOTES' : 'CONTRACT NOTES'}</p>
                                        <div className="flex items-center gap-2 text-[var(--text-primary)] font-black text-xs uppercase truncate">
                                            <FiMessageSquare className="text-[#004AAD]" /> {rec.description || 'No specific terms'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        disabled={saving || (rec.status === 'Received' && !rec.isLoan)}
                                        onClick={() => markAsReceived(rec._id, rec.isLoan)}
                                        className="flex items-center justify-center gap-2 bg-[#004AAD] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#004AAD]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <FiCheckCircle /> {saving ? 'Processing...' : (rec.isLoan ? 'Mark Repaid' : 'Confirm Clearing')}
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(rec._id, rec.isLoan)}
                                        className="flex items-center justify-center gap-2 bg-[var(--bg-inner)] text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all border border-red-500/10 shadow-inner"
                                    >
                                        <FiTrash2 /> Discard Asset
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {showAddModal && (
                    <div 
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all"
                        onClick={(e) => { if(e.target === e.currentTarget) setShowAddModal(false); }}
                    >
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--bg-card)] rounded-[48px] w-full max-w-2xl p-12 shadow-[0_50px_100px_-25px_rgba(0,0,0,0.6)] relative border border-[var(--bg-inner)] overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#004AAD] to-transparent opacity-50" />
                            <div className="flex justify-between items-center mb-12 text-[var(--text-primary)]">
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Register Asset</h3>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-2 opacity-60">Initialize Official Pkr Contractual Clearing Flow</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-3 text-[var(--text-secondary)] bg-[var(--bg-inner)] rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-sm"><FiX size={20} /></button>
                            </div>
                            <form onSubmit={handleAdd} className="space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-1 tracking-widest">Client Identity</label>
                                        <input required value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} type="text" placeholder="e.g. Global Tech Inc" className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black focus:ring-4 focus:ring-[#004AAD]/10 transition-all shadow-inner" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-1 tracking-widest">Project Reference</label>
                                        <input required value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} type="text" placeholder="e.g. Platform Migration" className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black focus:ring-4 focus:ring-[#004AAD]/10 transition-all shadow-inner" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-1 tracking-widest">Expected Capital (EUR)</label>
                                        <input required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} type="number" step="0.01" className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[#004AAD] font-black focus:ring-4 focus:ring-[#004AAD]/10 transition-all shadow-inner" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-1 tracking-widest">Clearing Deadline</label>
                                        <input required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} type="date" className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black focus:ring-4 focus:ring-[#004AAD]/10 transition-all shadow-inner" />
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-1 tracking-widest">Contractual Terms / Notes</label>
                                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Specify billing milestones or net-30 terms..." className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-inner)] border-none outline-none text-[var(--text-primary)] font-black focus:ring-4 focus:ring-[#004AAD]/10 transition-all shadow-inner resize-none" />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="w-full py-5 bg-[#004AAD] text-white rounded-[28px] font-black uppercase tracking-widest shadow-[0_25px_50px_-10px_rgba(0,74,173,0.4)] hover:scale-[1.02] active:scale-95 transition-all mt-6 disabled:opacity-50"
                                >
                                    {saving ? 'INITIALIZING...' : 'INITIALIZE CLEARANCE ENTRY'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
