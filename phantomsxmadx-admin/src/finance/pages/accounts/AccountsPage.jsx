import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { AddAccountModal } from '../../components/common/AddAccountModal';
import { AddARModal } from '../../components/common/AddARModal';
import { AddAPModal } from '../../components/common/AddAPModal';
import { ReplenishPettyCashModal } from '../../components/common/ReplenishPettyCashModal';
import {
  Building,
  Plus,
  Search,
  Pencil,
  Trash2,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  Wallet,
} from 'lucide-react';

export const AccountsPage = () => {
  const {
    selectedCurrency,
    accountsList,
    arList,
    apList,
    metrics,
    deleteAccount,
    deleteAR,
    deleteAP,
    updateAR,
    updateAP,
  } = useFinance();

  // Sub-tabs: 'accounts' | 'ar' | 'ap'
  const [activeTab, setActiveTab] = useState('accounts');

  const [search, setSearch] = useState('');

  // Modal States
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [replenishModalOpen, setReplenishModalOpen] = useState(false);

  const [arModalOpen, setArModalOpen] = useState(false);
  const [editingAR, setEditingAR] = useState(null);

  const [apModalOpen, setApModalOpen] = useState(false);
  const [editingAP, setEditingAP] = useState(null);

  // Total Liquid Capital Reserves (in EUR)
  const totalLiquidReserves = accountsList.reduce((acc, a) => acc + Number(a.balance || 0), 0);

  // Filtered Bank Accounts List by Search
  const filteredAccounts = accountsList.filter(
    (acc) =>
      (acc.bankName || '').toLowerCase().includes(search.toLowerCase()) ||
      (acc.accountTitle || '').toLowerCase().includes(search.toLowerCase()) ||
      (acc.accountNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  // Filtered AR List by Search
  const filteredAR = arList.filter(
    (ar) =>
      (ar.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
      (ar.invoiceNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (ar.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  // Filtered AP List by Search
  const filteredAP = apList.filter(
    (ap) =>
      (ap.vendorName || '').toLowerCase().includes(search.toLowerCase()) ||
      (ap.reason || '').toLowerCase().includes(search.toLowerCase()) ||
      (ap.billNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (ap.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
            ACCOUNTS, RECEIVABLES & PAYABLES
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage corporate bank accounts, pending client invoices (AR) & creditor debt payables (AP)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          {/* Sub-tab Switcher Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'accounts'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Bank Accounts</span>
            </button>

            <button
              onClick={() => setActiveTab('ar')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ar'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Receivables (AR)</span>
            </button>

            <button
              onClick={() => setActiveTab('ap')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ap'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Payables (AP)</span>
            </button>
          </div>

          {/* Action Add Buttons depending on active sub-tab */}
          {activeTab === 'accounts' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setReplenishModalOpen(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Banknote className="w-4 h-4" /> Replenish Petty Cash
              </button>

              <button
                onClick={() => {
                  setEditingAccount(null);
                  setAccountModalOpen(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Bank Account
              </button>
            </div>
          )}

          {activeTab === 'ar' && (
            <button
              onClick={() => {
                setEditingAR(null);
                setArModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add AR Receivable
            </button>
          )}

          {activeTab === 'ap' && (
            <button
              onClick={() => {
                setEditingAP(null);
                setApModalOpen(true);
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add AP Payable
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('accounts')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'accounts'
              ? 'bg-blue-50/60 border-blue-300 shadow-xs'
              : 'bg-white border-slate-200 shadow-2xs hover:border-blue-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Liquid Reserves</span>
          <h3 className="text-xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalLiquidReserves, selectedCurrency)}
          </h3>
        </div>

        <div
          onClick={() => setActiveTab('ar')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'ar'
              ? 'bg-amber-50/60 border-amber-300 shadow-xs'
              : 'bg-white border-slate-200 shadow-2xs hover:border-amber-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Accounts Receivable (AR)</span>
          <h3 className="text-xl font-black text-amber-500 mt-1">
            {formatCurrency(metrics.totalAR, selectedCurrency)}
          </h3>
        </div>

        <div
          onClick={() => setActiveTab('ap')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'ap'
              ? 'bg-rose-50/60 border-rose-300 shadow-xs'
              : 'bg-white border-slate-200 shadow-2xs hover:border-rose-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Accounts Payable (AP)</span>
          <h3 className="text-xl font-black text-rose-600 mt-1">
            {formatCurrency(metrics.totalAP, selectedCurrency)}
          </h3>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search accounts, creditor, reason, invoice..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 1. BANK ACCOUNTS VIEW */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredAccounts.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
              No bank accounts found. Click "Add Bank Account" to record corporate bank account.
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isPetty = acc.id === 'ACC-PETTY' || acc.isPettyCash;
              return (
                <div
                  key={acc.id}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    isPetty
                      ? 'bg-amber-50/40 border-amber-300 shadow-sm hover:border-amber-400'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-blue-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`p-2.5 sm:p-3 rounded-xl border shrink-0 ${isPetty ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {isPetty ? <Banknote className="w-5 h-5 sm:w-6 sm:h-6" /> : <Building className="w-5 h-5 sm:w-6 sm:h-6" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug break-words">{acc.bankName}</h3>
                          {isPetty && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0 shadow-2xs">
                              CASH DRAWER
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block break-words mt-0.5">{acc.accountTitle}</span>
                      </div>
                    </div>

                    {/* Edit & Delete / Replenish Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0 self-start sm:self-auto">
                      {isPetty ? (
                        <button
                          onClick={() => setReplenishModalOpen(true)}
                          className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-200/80 hover:bg-amber-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                          title="Replenish Petty Cash Drawer"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Replenish</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingAccount(acc);
                              setAccountModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Bank Account"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete bank account ${acc.bankName}?`)) {
                                deleteAccount(acc.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Bank Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Account Numbers / IBAN */}
                  <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span className="text-slate-500 font-semibold shrink-0">{isPetty ? 'Cash Drawer ID:' : 'Account No:'}</span>
                      <span className="font-mono font-bold text-slate-800 break-all text-right">{acc.accountNumber || 'CASH-DRAWER-01'}</span>
                    </div>
                    {acc.iban && (
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-500 font-semibold shrink-0">IBAN:</span>
                        <span className="font-mono font-bold text-slate-800 break-all text-right">{acc.iban}</span>
                      </div>
                    )}
                  </div>

                  {/* Balance */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                      {isPetty ? 'AVAILABLE CASH BALANCE' : 'AVAILABLE BALANCE'}
                    </span>
                    <h4 className={`text-base sm:text-lg font-black shrink-0 ${isPetty ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {formatCurrency(acc.balance, selectedCurrency)}
                    </h4>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. ACCOUNTS RECEIVABLE (AR) TABLE VIEW */}
      {activeTab === 'ar' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Invoice # & Date</th>
                <th className="px-4 py-3.5">Client Name</th>
                <th className="px-4 py-3.5">Description / Notes</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right text-amber-600">Receivable Amount</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAR.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No accounts receivable entries found. Click "+ Add AR Receivable" to record client invoice.
                  </td>
                </tr>
              ) : (
                filteredAR.map((ar) => (
                  <tr key={ar.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{ar.invoiceNo || ar.id}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(ar.date)}</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">{ar.clientName}</td>
                    <td className="px-4 py-3.5 text-slate-600">{ar.notes || '-'}</td>
                    <td className="px-4 py-3.5 font-semibold text-rose-600">{formatDate(ar.dueDate)}</td>
                    <td className="px-4 py-3.5">
                      <select
                        value={ar.status}
                        onChange={(e) => updateAR(ar.id, { ...ar, status: e.target.value })}
                        className={`px-2 py-1 rounded text-[10px] font-black uppercase border cursor-pointer focus:outline-none ${
                          ar.status === 'Collected'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : ar.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Collected">Collected</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-sm text-amber-600">
                      {formatCurrency(ar.amount, selectedCurrency)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingAR(ar);
                            setArModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit AR"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete receivable invoice ${ar.invoiceNo}?`)) {
                              deleteAR(ar.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete AR"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. ACCOUNTS PAYABLE (AP) TABLE VIEW */}
      {activeTab === 'ap' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Bill # & Date Taken</th>
                <th className="px-4 py-3.5">Creditor Name</th>
                <th className="px-4 py-3.5">Reason & Purpose</th>
                <th className="px-4 py-3.5">Repayment Due Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right text-rose-600">Payable Amount</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAP.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No accounts payable entries found. Click "+ Add AP Payable" to record borrowing debt / vendor bill.
                  </td>
                </tr>
              ) : (
                filteredAP.map((ap) => (
                  <tr key={ap.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{ap.billNo || ap.id}</div>
                      <div className="text-[10px] text-slate-400">Taken: {formatDate(ap.date)}</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 text-sm">
                      {ap.vendorName || ap.creditorName}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{ap.reason || ap.purpose || 'General Borrowing'}</div>
                      {ap.notes && <div className="text-[10px] text-slate-400 italic mt-0.5">{ap.notes}</div>}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-rose-600">{formatDate(ap.dueDate)}</td>
                    <td className="px-4 py-3.5">
                      <select
                        value={ap.status}
                        onChange={(e) => updateAP(ap.id, { ...ap, status: e.target.value })}
                        className={`px-2 py-1 rounded text-[10px] font-black uppercase border cursor-pointer focus:outline-none ${
                          ap.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : ap.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-sm text-rose-600">
                      {formatCurrency(ap.amount, selectedCurrency)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingAP(ap);
                            setApModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit AP"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete payable bill ${ap.billNo}?`)) {
                              deleteAP(ap.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete AP"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Bank Account Modal */}
      <AddAccountModal
        isOpen={accountModalOpen}
        onClose={() => {
          setAccountModalOpen(false);
          setEditingAccount(null);
        }}
        initialData={editingAccount}
      />

      {/* Add / Edit AR Modal */}
      <AddARModal
        isOpen={arModalOpen}
        onClose={() => {
          setArModalOpen(false);
          setEditingAR(null);
        }}
        initialData={editingAR}
      />

      {/* Add / Edit AP Modal */}
      <AddAPModal
        isOpen={apModalOpen}
        onClose={() => {
          setApModalOpen(false);
          setEditingAP(null);
        }}
        initialData={editingAP}
      />

      {/* Replenish Petty Cash Modal */}
      <ReplenishPettyCashModal
        isOpen={replenishModalOpen}
        onClose={() => setReplenishModalOpen(false)}
      />
    </div>
  );
};

export default AccountsPage;
