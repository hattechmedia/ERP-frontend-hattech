import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { currencyOptions, convertCurrency, formatCurrency } from '../../utils/formatters';
import { X, ChevronDown } from 'lucide-react';

export const AddExpenseModal = ({ isOpen, onClose, initialData = null }) => {
  const { selectedCurrency, accountsList, addExpense, updateExpense } = useFinance();

  const expenseCategoryOptions = [
    { value: 'OFFICE RENT & LEASE', label: 'OFFICE RENT & LEASE (Workspace Rent)' },
    { value: 'OFFICE UTILITIES', label: 'OFFICE UTILITIES (Electricity, Water, Internet)' },
    { value: 'OFFICE SUPPLIES & STATIONERY', label: 'OFFICE SUPPLIES & STATIONERY' },
    { value: 'TEA & REFRESHMENTS', label: 'TEA & REFRESHMENTS (Kitchen & Office Snacks)' },
    { value: 'MAINTENANCE & REPAIRS', label: 'MAINTENANCE & REPAIRS (Building & Services)' },
    { value: 'SOFTWARE & SAAS SUBSCRIPTIONS', label: 'SOFTWARE & SAAS SUBSCRIPTIONS (Tools & Apps)' },
    { value: 'CLOUD & HOSTING INFRASTRUCTURE', label: 'CLOUD & HOSTING INFRASTRUCTURE (AWS/Vercel)' },
    { value: 'HARDWARE & IT EQUIPMENT', label: 'HARDWARE & IT EQUIPMENT (Laptops & Tech)' },
    { value: 'DOMAIN & SSL LICENSES', label: 'DOMAIN & SSL LICENSES (Domain & Security)' },
    { value: 'STAFF SALARIES & PAYROLL', label: 'STAFF SALARIES & PAYROLL' },
    { value: 'FREELANCER & CONTRACTOR FEES', label: 'FREELANCER & CONTRACTOR FEES (Outsourcing)' },
    { value: 'EMPLOYEE BONUSES & PERKS', label: 'EMPLOYEE BONUSES & PERKS (Health & Rewards)' },
    { value: 'TRAINING & COURSES', label: 'TRAINING & COURSES (Staff Upskilling)' },
    { value: 'MARKETING & ADVERTISING', label: 'MARKETING & ADVERTISING (Meta/Google Ads)' },
    { value: 'EVENTS & EXHIBITIONS', label: 'EVENTS & EXHIBITIONS (Sponsorships & Summits)' },
    { value: 'SALES COMMISSION', label: 'SALES COMMISSION (Payouts & Incentives)' },
    { value: 'TRAVEL & ACCOMMODATION', label: 'TRAVEL & ACCOMMODATION (Flights & Hotels)' },
    { value: 'VEHICLE & FUEL', label: 'VEHICLE & FUEL (Fuel & Transport Allowance)' },
    { value: 'COURIER & LOGISTICS', label: 'COURIER & LOGISTICS (Shipping & Mail)' },
    { value: 'TAX & GOVERNMENT FEES', label: 'TAX & GOVERNMENT FEES (FBR/SECP/Duties)' },
    { value: 'BANK FEES & TRANSACTION CHARGES', label: 'BANK FEES & TRANSACTION CHARGES (Wire/Gateway)' },
    { value: 'LEGAL & AUDIT FEES', label: 'LEGAL & AUDIT FEES (Lawyer & CA Audit)' },
    { value: 'CHARITY & CSR', label: 'CHARITY & CSR (Zakat & Donations)' },
    { value: 'OTHER OPERATIONAL EXPENSE', label: 'OTHER OPERATIONAL EXPENSE (Misc Outflow)' },
  ];

  const [formData, setFormData] = useState({
    expenseReason: '',
    currency: selectedCurrency || 'EUR',
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    expenseCategory: 'OFFICE UTILITIES',
    bankAccountId: accountsList[0]?.id || 'ACC-01',
    vendor: '',
  });

  useEffect(() => {
    if (initialData && isOpen) {
      const activeCurr = initialData.currency || selectedCurrency || 'EUR';
      const amountInActiveCurr = initialData.amount
        ? Math.round(convertCurrency(initialData.amount, 'EUR', activeCurr))
        : '';

      setFormData({
        expenseReason: initialData.notes || initialData.category || '',
        currency: activeCurr,
        amount: amountInActiveCurr,
        paymentDate: initialData.date || new Date().toISOString().slice(0, 10),
        expenseCategory: initialData.category || 'OFFICE UTILITIES',
        bankAccountId: initialData.bankAccountId || accountsList[0]?.id || 'ACC-01',
        vendor: initialData.vendor || initialData.source || '',
      });
    } else if (!initialData && isOpen) {
      setFormData({
        expenseReason: '',
        currency: selectedCurrency || 'EUR',
        amount: '',
        paymentDate: new Date().toISOString().slice(0, 10),
        expenseCategory: 'OFFICE UTILITIES',
        bankAccountId: accountsList[0]?.id || 'ACC-01',
        vendor: '',
      });
    }
  }, [initialData, isOpen, selectedCurrency]);

  if (!isOpen) return null;

  // Handle live currency switching with real-time conversion
  const handleCurrencyChange = (newCurrency) => {
    if (formData.amount && !isNaN(formData.amount)) {
      const converted = convertCurrency(formData.amount, formData.currency, newCurrency);
      const formattedAmount = newCurrency === 'EUR' ? Math.round(converted) : Number(converted.toFixed(2));
      setFormData({
        ...formData,
        currency: newCurrency,
        amount: formattedAmount,
      });
    } else {
      setFormData({ ...formData, currency: newCurrency });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.expenseReason || !formData.amount || Number(formData.amount) <= 0) return;

    if (initialData) {
      updateExpense(initialData.id, {
        notes: formData.expenseReason,
        category: formData.expenseCategory,
        currency: formData.currency,
        amount: Number(formData.amount),
        settlementDate: formData.paymentDate,
        bankAccountId: formData.bankAccountId,
        vendor: formData.vendor || 'General Vendor',
      });
    } else {
      addExpense({
        notes: formData.expenseReason,
        category: formData.expenseCategory,
        currency: formData.currency,
        amount: Number(formData.amount),
        settlementDate: formData.paymentDate,
        bankAccountId: formData.bankAccountId,
        vendor: formData.vendor || 'General Vendor',
      });
    }

    onClose();
  };

  // Live Equivalent in Base EUR
  const basePkrEquivalent = formData.amount && !isNaN(formData.amount)
    ? convertCurrency(formData.amount, formData.currency, 'EUR')
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center select-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl z-10 p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
              {initialData ? `EDIT EXPENSE (${initialData.id})` : 'RECORD OPERATIONAL EXPENSE'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Record vendor payouts, charity, utilities & debit company account</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* QUICK PETTY CASH PRESETS */}
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
            <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest block">
              ⚡ QUICK PETTY CASH EXPENSE PRESETS (OFFICE DAILY CASH BOX):
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    expenseReason: 'Daily Coffee & Tea Refreshments',
                    amount: 15,
                    expenseCategory: 'TEA & REFRESHMENTS',
                    bankAccountId: 'ACC-PETTY',
                    vendor: 'Office Petty Cash Drawer',
                  })
                }
                className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>☕ Coffee & Tea (€15)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    expenseReason: 'Daily Office Snacks & Refreshments',
                    amount: 25,
                    expenseCategory: 'TEA & REFRESHMENTS',
                    bankAccountId: 'ACC-PETTY',
                    vendor: 'Office Petty Cash Drawer',
                  })
                }
                className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>🥪 Team Snacks (€25)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    expenseReason: 'Daily Vehicle Fuel & Conveyance',
                    amount: 40,
                    expenseCategory: 'VEHICLE & FUEL',
                    bankAccountId: 'ACC-PETTY',
                    vendor: 'Office Petty Cash Drawer',
                  })
                }
                className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>⛽ Fuel / Transport (€40)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    expenseReason: 'Office Cleaning & Kitchen Supplies',
                    amount: 20,
                    expenseCategory: 'MAINTENANCE & REPAIRS',
                    bankAccountId: 'ACC-PETTY',
                    vendor: 'Office Petty Cash Drawer',
                  })
                }
                className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>🧹 Cleaning Supplies (€20)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    expenseReason: 'Stationery & Photostat Copies',
                    amount: 10,
                    expenseCategory: 'OFFICE SUPPLIES & STATIONERY',
                    bankAccountId: 'ACC-PETTY',
                    vendor: 'Office Petty Cash Drawer',
                  })
                }
                className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>📄 Stationery (€10)</span>
              </button>
            </div>
          </div>

          {/* 1. EXPENSE ITEM / REASON */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              EXPENSE ITEM / REASON
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Server Hosting Bill"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400"
              value={formData.expenseReason}
              onChange={(e) => setFormData({ ...formData, expenseReason: e.target.value })}
            />
          </div>

          {/* 2. CURRENCY & AMOUNT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                CURRENCY
              </label>
              <div className="relative">
                <select
                  value={formData.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                AMOUNT ({formData.currency})
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              {formData.currency !== 'EUR' && formData.amount > 0 && (
                <div className="text-[11px] font-bold text-rose-600 mt-1 flex items-center justify-between">
                  <span>Base Equivalent:</span>
                  <span>{formatCurrency(basePkrEquivalent, 'EUR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. PAYMENT DATE & EXPENSE CATEGORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                PAYMENT DATE
              </label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                EXPENSE CATEGORY
              </label>
              <div className="relative">
                <select
                  value={formData.expenseCategory}
                  onChange={(e) => setFormData({ ...formData, expenseCategory: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {expenseCategoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 4. DISBURSED FROM ACCOUNT & RECIPIENT DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DISBURSED FROM ACCOUNT */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-widest block border-b border-slate-200 pb-1.5">
                DISBURSED FROM ACCOUNT
              </span>

              <div>
                <label className="block text-[11px] font-bold text-rose-700 uppercase mb-1">
                  PAID FROM COMPANY BANK ACCOUNT
                </label>
                <div className="relative">
                  <select
                    value={formData.bankAccountId}
                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                    className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-xs rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    {accountsList.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} (Bal: {formatCurrency(acc.balance, selectedCurrency)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
                {(() => {
                  const selAcc = accountsList.find((a) => a.id === formData.bankAccountId);
                  if (!selAcc) return null;
                  const isPetty = selAcc.id === 'ACC-PETTY' || selAcc.isPettyCash;
                  return (
                    <div className="text-[10px] font-bold mt-1 flex items-center justify-between">
                      <span className="text-slate-500">Available Balance:</span>
                      <span className={isPetty ? 'text-amber-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                        {formatCurrency(selAcc.balance, selectedCurrency)}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* RECIPIENT DETAILS */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-widest block border-b border-slate-200 pb-1.5">
                RECIPIENT DETAILS
              </span>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  PAID TO (VENDOR / RECIPIENT)
                </label>
                <input
                  type="text"
                  placeholder="Vendor / Person / Organization"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {initialData ? 'Update Expense Entry' : 'Save Expense Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
