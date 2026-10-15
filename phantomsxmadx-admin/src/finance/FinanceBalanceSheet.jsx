import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { FiFileText, FiPrinter, FiDownload, FiCalendar, FiArrowUp, FiArrowDown, FiActivity } from "react-icons/fi";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

export default function FinanceBalanceSheet() {
    const [data, setData] = useState({ income: [], expenses: [], payroll: [] });
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Balance_Sheet_${startDate}_to_${endDate}`
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/finance/balance-sheet?startDate=${startDate}&endDate=${endDate}`);
            setData(res.data.data);
        } catch (err) {
            toast.error("Failed to fetch balance sheet data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const totalIncome = data.income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPayroll = data.payroll.reduce((sum, p) => sum + (p.paidAmount || p.netSalary), 0);
    const netProfit = totalIncome - totalExpenses - totalPayroll;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#004AAD]" />
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Financial Audit Station</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Aggregate Balance Sheet & P&L Statement</p>
                </div>
                
                <div className="flex items-center gap-4 bg-[var(--bg-inner)] p-2 rounded-2xl shadow-inner">
                    <div className="flex items-center gap-2 px-4">
                        <FiCalendar className="text-[#004AAD]" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none outline-none text-[var(--text-primary)] font-black text-xs uppercase" />
                    </div>
                    <div className="text-[var(--text-secondary)] font-black text-xs">TO</div>
                    <div className="flex items-center gap-2 px-4 border-l border-white/5">
                        <FiCalendar className="text-[#004AAD]" />
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none outline-none text-[var(--text-primary)] font-black text-xs uppercase" />
                    </div>
                </div>

                <button onClick={handlePrint} className="bg-[#1e293b] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group border border-white/5">
                    <FiPrinter className="group-hover:rotate-12 transition-transform" /> Export Audit
                </button>
            </div>

            {loading ? <div className="py-24 flex justify-center"><LoadingSpinner /></div> : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <SummaryCard title="Total Revenue" amount={totalIncome} color="emerald" icon={<FiArrowUp />} />
                        <SummaryCard title="Ops Expenses" amount={totalExpenses} color="rose" icon={<FiArrowDown />} />
                        <SummaryCard title="Payroll Cost" amount={totalPayroll} color="amber" icon={<FiActivity />} />
                        <SummaryCard title="Net Settlement" amount={netProfit} color={netProfit >= 0 ? "blue" : "red"} icon={<FiFileText />} isTotal />
                    </div>

                    {/* Printable Sheet */}
                    <div ref={componentRef} className="bg-white text-slate-900 p-12 rounded-[48px] shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-8 font-sans">
                        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-12">
                            <div>
                                <img src="/logo.png" alt="HATTECH" className="h-24 w-auto mb-4 object-contain" />
                                <h1 className="text-4xl font-black uppercase tracking-tighter">Business Balance Sheet</h1>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Statement of Financial Position</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Fiscal Period</p>
                                <p className="text-xl font-black">{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Income Section */}
                        <div className="mb-12">
                            <h3 className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.25em] mb-6 inline-block">Section 01 : Operating Revenue</h3>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-slate-200">
                                        <th className="py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Entry Item</th>
                                        <th className="py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest px-8">Category</th>
                                        <th className="py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount (EUR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.income.map(i => (
                                        <tr key={i._id} className="border-b border-slate-100">
                                            <td className="py-4 font-bold text-sm uppercase">{i.source}</td>
                                            <td className="py-4 px-8 text-xs font-medium text-slate-500 uppercase">{i.category}</td>
                                            <td className="py-4 text-right font-black text-emerald-600">+{i.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-emerald-50 bg-opacity-50">
                                        <td colSpan={2} className="py-5 px-6 font-black uppercase text-sm">Total Revenue Capital</td>
                                        <td className="py-5 px-6 text-right font-black text-xl text-emerald-700 underline decoration-double decoration-2 underline-offset-8">€{totalIncome.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Expenses Section */}
                        <div className="mb-12">
                            <h3 className="bg-rose-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.25em] mb-6 inline-block">Section 02 : Operational Expenditure</h3>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-slate-200">
                                        <th className="py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Expense Identifier</th>
                                        <th className="py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest px-8">Category</th>
                                        <th className="py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount (EUR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.expenses.map(e => (
                                        <tr key={e._id} className="border-b border-slate-100">
                                            <td className="py-4 font-bold text-sm uppercase">{e.item}</td>
                                            <td className="py-4 px-8 text-xs font-medium text-slate-500 uppercase">{e.category}</td>
                                            <td className="py-4 text-right font-black text-rose-500">-{e.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {data.payroll.map(p => (
                                        <tr key={p._id} className="border-b border-slate-100">
                                            <td className="py-4 font-bold text-sm uppercase">Payroll: {p.employeeName}</td>
                                            <td className="py-4 px-8 text-xs font-medium text-slate-500 uppercase">Salaries</td>
                                            <td className="py-4 text-right font-black text-rose-500">-{(p.paidAmount || p.netSalary).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-rose-50 bg-opacity-50">
                                        <td colSpan={2} className="py-5 px-6 font-black uppercase text-sm">Total Expenditure Flow</td>
                                        <td className="py-5 px-6 text-right font-black text-xl text-rose-700 underline decoration-double decoration-2 underline-offset-8">€{(totalExpenses + totalPayroll).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Net Summary */}
                        <div className="pt-12 border-t-8 border-slate-900 flex justify-between items-center">
                            <div>
                                <p className="text-3xl font-black uppercase tracking-tighter">Net Settlement Position</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Final audit summary for the selected period</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Net Balance</p>
                                <p className={`text-6xl font-black tracking-tighter ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>€{netProfit.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="mt-24 grid grid-cols-2 gap-20">
                            <div className="text-center pt-8 border-t border-slate-200">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Finance Executive</p>
                            </div>
                            <div className="text-center pt-8 border-t border-slate-200">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Chief Auditor</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function SummaryCard({ title, amount, color, icon, isTotal }) {
    const colors = {
        emerald: "from-emerald-500/10 text-emerald-500 border-emerald-500/20",
        rose: "from-rose-500/10 text-rose-500 border-rose-500/20",
        amber: "from-amber-500/10 text-amber-500 border-amber-500/20",
        blue: "from-[#004AAD]/10 text-[#004AAD] border-[#004AAD]/20",
        red: "from-red-500/10 text-red-500 border-red-500/20",
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} p-8 rounded-[32px] border shadow-xl relative overflow-hidden group`}>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700 transform rotate-12">
                {React.cloneElement(icon, { size: 120 })}
            </div>
            <div className="flex justify-between items-center mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{title}</p>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    {icon}
                </div>
            </div>
            <p className={`text-2xl font-black tracking-tighter ${isTotal ? 'text-3xl' : ''}`}>€{amount.toLocaleString()}</p>
        </div>
    );
}
