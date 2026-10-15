import React from 'react';
import { FiPrinter, FiDownload, FiCheckCircle } from 'react-icons/fi';

const FinanceSlip = React.forwardRef(({ data, type = 'Income' }, ref) => {
    if (!data) return null;

    const isExpense = type === 'Expense';
    const accentColor = isExpense ? '#f43f5e' : '#004AAD';

    return (
        <div ref={ref} className="bg-white text-slate-900 p-4 sm:p-8 md:p-12 lg:p-16 max-w-5xl mx-auto shadow-2xl rounded-3xl border border-slate-100 font-sans print:shadow-none print:border-none print:p-4 print:max-w-none print:w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-4 border-slate-900 pb-8 mb-8">
                <div>
                    <img src="/logo.png" alt="HATTECH MEDIA" className="h-20 w-auto mb-4 object-contain" />
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Financial Terminal</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Official Transaction Certificate</p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                    <div className="inline-block px-4 py-2 rounded-xl text-white font-black uppercase tracking-widest text-xs mb-4" style={{ backgroundColor: accentColor }}>
                        {type} Slip
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Serial # {data._id?.slice(-8).toUpperCase()}</p>
                    <p className="text-sm font-black mt-1">{new Date(data.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Transaction Entity</p>
                            <p className="text-xl font-black uppercase leading-tight">{isExpense ? data.item : data.source}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{data.category}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Payment Methodology</p>
                            <p className="text-sm font-black uppercase">{data.paymentMethod || 'Transfer'}</p>
                        </div>
                    </div>
                    <div className="text-left md:text-right space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Net Settlement Amount</p>
                            <p className="text-4xl font-black tracking-tighter" style={{ color: accentColor }}>PKR {data.amount.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-[0.2em]">Currency: Pakistan Rupee</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Verification Status</p>
                            <div className="flex items-center justify-start md:justify-end gap-2 text-emerald-600">
                                <FiCheckCircle size={14} />
                                <span className="text-xs font-black uppercase tracking-widest">{data.status === 'Received' || data.status === 'Paid' ? 'Authenticated' : data.status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description - MOVED UP */}
                {data.description && (
                    <div className="border-t border-b border-slate-100 py-6">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Transaction Narrative</p>
                        <p className="text-sm text-slate-600 leading-relaxed font-black italic">"{data.description}"</p>
                    </div>
                )}

                {/* Account Details for Income */}
                {!isExpense && (data.payerAccTitle || data.receiverAccTitle) && (
                    <div className="bg-slate-50 p-4 sm:p-8 rounded-2xl border border-slate-100 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                            <div>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">Origin (Payer)</p>
                                <p className="text-xs font-black uppercase truncate">{data.payerName || 'N/A'}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Title: {data.payerAccTitle || '-'}</p>
                                <p className="text-[10px] font-mono text-slate-500 mt-0.5">#{data.payerAccNo || '-'}</p>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">Destination (Receiver)</p>
                                <p className="text-xs font-black uppercase truncate">Hat-Tech Media Official</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{data.receiverAccTitle || '-'}</p>
                                <p className="text-[10px] font-mono text-slate-500 mt-0.5">#{data.receiverAccNo || '-'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loan Particulars for Expense */}
                {isExpense && data.category === 'Loan' && (
                    <div className="bg-rose-50 p-4 sm:p-8 rounded-2xl border border-rose-100">
                        <p className="text-[9px] font-black uppercase text-rose-400 tracking-widest mb-3 text-center">Loan Disbursement Details</p>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Debtor Entity</p>
                                <p className="text-sm font-black uppercase">{data.debtorName || 'N/A'}</p>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Settlement Date</p>
                                <p className="text-sm font-black uppercase">{new Date(data.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Performed By / Contact Person Section */}
                {isExpense && data.performedBy && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Performed By / Contact</p>
                        <p className="text-sm font-black uppercase text-[#004AAD]">{data.performedBy}</p>
                    </div>
                )}



                {/* Footer Signature */}
                <div className="pt-8 md:pt-16 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-20">
                    <div className="text-center">
                        <div className="border-b border-slate-300 h-10 mb-2"></div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Authorized Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-slate-300 h-10 mb-2 flex items-center justify-center">
                             <div className="w-16 h-16 border-2 border-slate-200 rounded-full flex items-center justify-center opacity-20 transform -rotate-12">
                                <span className="text-[8px] font-black text-center">CERTIFIED</span>
                             </div>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Official Audit Stamp</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Computer Generated Document - Secure Cloud Hash: {data._id}</p>
            </div>
        </div>
    );
});

export default FinanceSlip;
