import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { currencyOptions, convertCurrency, formatCurrency } from '../../utils/formatters';
import { X, ChevronDown } from 'lucide-react';

export const AddIncomeModal = ({ isOpen, onClose, initialData = null }) => {
  const { selectedCurrency, accountsList, addIncome, updateIncome, distributionSplits } = useFinance();

  const incomeCategoryOptions = [
    { value: 'ONETIME SERVICE', label: 'ONETIME SERVICE (Project Delivery / One-time Invoice)' },
    { value: 'MONTHLY RETAINER', label: 'MONTHLY RETAINER (Ongoing Monthly Client Retainer)' },
    { value: 'MILESTONE PAYMENT', label: 'MILESTONE PAYMENT (Phased Project Milestone)' },
    { value: 'HOURLY BILLING', label: 'HOURLY BILLING (Time & Material Payout)' },
    { value: 'WEB & APP DEVELOPMENT', label: 'WEB & APP DEVELOPMENT (Software / Mobile App Project)' },
    { value: 'UI/UX & DESIGN SERVICES', label: 'UI/UX & DESIGN SERVICES (Branding & Design)' },
    { value: 'DIGITAL MARKETING & SEO', label: 'DIGITAL MARKETING & SEO (Ad Campaign & SEO Services)' },
    { value: 'AGENCY COMMISSION & REVENUE SHARE', label: 'AGENCY COMMISSION (Revenue Share & Commission)' },
    { value: 'CONSULTING & ADVISORY', label: 'CONSULTING & ADVISORY (Tech & Business Advisory)' },
    { value: 'MAINTENANCE & SLA CONTRACT', label: 'MAINTENANCE & SLA CONTRACT (Annual Support Contract)' },
    { value: 'SOFTWARE LICENSING & SAAS', label: 'SOFTWARE LICENSING & SAAS (Subscriptions & Licenses)' },
    { value: 'E-COMMERCE SALES', label: 'E-COMMERCE SALES (Digital Downloads & Product Sales)' },
    { value: 'FREELANCE PLATFORMS', label: 'FREELANCE PLATFORMS (Upwork / Fiverr / Toptal / Deel)' },
    { value: 'AFFILIATE & PARTNER REVENUE', label: 'AFFILIATE & PARTNER REVENUE (Referral & Partner Payouts)' },
    { value: 'ACCOUNTS RECEIVABLE COLLECTED', label: 'ACCOUNTS RECEIVABLE COLLECTED (Invoice Payment)' },
    { value: 'LOAN RECOVERY & DEBT REPAYMENT', label: 'LOAN RECOVERY (Money Received Back / Debt Recovered)' },
    { value: 'INVESTMENT & CAPITAL INFLOW', label: 'INVESTMENT & CAPITAL (Equity / Investor Funds / Director Inflow)' },
    { value: 'BANK INTEREST & YIELD', label: 'BANK INTEREST & YIELD (Profit on Deposit)' },
    { value: 'REFUND & REIMBURSEMENT', label: 'REFUND & REIMBURSEMENT (Vendor Credit / Tax Rebate)' },
    { value: 'OTHER CORPORATE REVENUE', label: 'OTHER CORPORATE REVENUE (Misc Inflow)' },
  ];

  const [formData, setFormData] = useState({
    clearingEntity: '',
    currency: selectedCurrency || 'EUR',
    amount: '',
    settlementDate: new Date().toISOString().slice(0, 10),
    projectPayment: 'ONETIME SERVICE',
    clientName: '',
    clientEmail: '',
    bankAccountId: accountsList[0]?.id || 'ACC-01',
    notes: '',
  });

  useEffect(() => {
    if (initialData && isOpen) {
      const activeCurr = initialData.currency || selectedCurrency || 'EUR';
      const amountInActiveCurr = initialData.amount
        ? Math.round(convertCurrency(initialData.amount, 'EUR', activeCurr))
        : '';

      setFormData({
        clearingEntity: initialData.clearingEntity || initialData.source || '',
        currency: activeCurr,
        amount: amountInActiveCurr,
        settlementDate: initialData.date || new Date().toISOString().slice(0, 10),
        projectPayment: initialData.projectPayment || initialData.category || 'ONETIME SERVICE',
        clientName: initialData.clientName || '',
        clientEmail: initialData.clientEmail || '',
        bankAccountId: initialData.bankAccountId || accountsList[0]?.id || 'ACC-01',
        notes: initialData.notes || '',
      });
    } else if (!initialData && isOpen) {
      setFormData({
        clearingEntity: '',
        currency: selectedCurrency || 'EUR',
        amount: '',
        settlementDate: new Date().toISOString().slice(0, 10),
        projectPayment: 'ONETIME SERVICE',
        clientName: '',
        clientEmail: '',
        bankAccountId: accountsList[0]?.id || 'ACC-01',
        notes: '',
      });
    }
  }, [initialData, isOpen, selectedCurrency]);

  if (!isOpen) return null;

  const selectedBank = accountsList.find((a) => a.id === formData.bankAccountId) || accountsList[0];

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
    if (!formData.clearingEntity || !formData.amount || Number(formData.amount) <= 0) return;

    if (initialData) {
      updateIncome(initialData.id, {
        clearingEntity: formData.clearingEntity,
        currency: formData.currency,
        amount: Number(formData.amount),
        settlementDate: formData.settlementDate,
        projectPayment: formData.projectPayment,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        bankAccountId: formData.bankAccountId,
        notes: formData.notes,
      });
    } else {
      addIncome({
        clearingEntity: formData.clearingEntity,
        currency: formData.currency,
        amount: Number(formData.amount),
        settlementDate: formData.settlementDate,
        projectPayment: formData.projectPayment,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        bankAccountId: formData.bankAccountId,
        notes: formData.notes,
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
              {initialData ? `EDIT INCOME (${initialData.id})` : 'RECORD INCOME INFLOW'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Record revenue settlement, live currency conversion & receiver bank</p>
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
          {/* 1. CLEARING ENTITY (SOURCE NAME) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              CLEARING ENTITY (SOURCE NAME)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Project Delivery - UI Design"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400"
              value={formData.clearingEntity}
              onChange={(e) => setFormData({ ...formData, clearingEntity: e.target.value })}
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
                <div className="text-[11px] font-bold text-blue-600 mt-1 flex items-center justify-between">
                  <span>Base Equivalent:</span>
                  <span>{formatCurrency(basePkrEquivalent, 'EUR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* LIVE AGENCY DISTRIBUTION DEDUCTION PREVIEW */}
          {formData.amount > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>AGENCY DEDUCTIONS (CUT FROM THIS INFLOW):</span>
                <span className="text-[10px] text-amber-600 font-extrabold">
                  {(distributionSplits?.businessExpenses ?? 35) + (distributionSplits?.companyReserve ?? 15) + (distributionSplits?.charityPool ?? 4)}% TOTAL DEDUCTED
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-medium pt-1">
                <div className="bg-blue-50/80 p-2 rounded-lg border border-blue-200 text-blue-900">
                  <span className="block text-[10px] font-bold text-blue-700">BUS. EXPENSE ({distributionSplits?.businessExpenses ?? 35}%)</span>
                  <span className="font-extrabold">{formatCurrency((basePkrEquivalent || formData.amount) * ((distributionSplits?.businessExpenses ?? 35) / 100), 'EUR')}</span>
                </div>
                <div className="bg-amber-50/80 p-2 rounded-lg border border-amber-200 text-amber-900">
                  <span className="block text-[10px] font-bold text-amber-700">RESERVE ({distributionSplits?.companyReserve ?? 15}%)</span>
                  <span className="font-extrabold">{formatCurrency((basePkrEquivalent || formData.amount) * ((distributionSplits?.companyReserve ?? 15) / 100), 'EUR')}</span>
                </div>
                <div className="bg-pink-50/80 p-2 rounded-lg border border-pink-200 text-pink-900">
                  <span className="block text-[10px] font-bold text-pink-700">CHARITY ({distributionSplits?.charityPool ?? 4}%)</span>
                  <span className="font-extrabold">{formatCurrency((basePkrEquivalent || formData.amount) * ((distributionSplits?.charityPool ?? 4) / 100), 'EUR')}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-emerald-700 pt-1 border-t border-slate-200">
                <span>NET REMAINING INFLOW AFTER CUTS:</span>
                <span>{formatCurrency((basePkrEquivalent || formData.amount) * (1 - ((distributionSplits?.businessExpenses ?? 35) + (distributionSplits?.companyReserve ?? 15) + (distributionSplits?.charityPool ?? 4)) / 100), 'EUR')}</span>
              </div>
            </div>
          )}

          {/* 3. SETTLEMENT DATE & PROJECT PAYMENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                SETTLEMENT DATE
              </label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={formData.settlementDate}
                onChange={(e) => setFormData({ ...formData, settlementDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                PROJECT PAYMENT / INCOME CHANNEL
              </label>
              <div className="relative">
                <select
                  value={formData.projectPayment}
                  onChange={(e) => setFormData({ ...formData, projectPayment: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {incomeCategoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 4. PAYER INFORMATION & RECEIVER BANK ACCOUNT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PAYER INFORMATION */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest block border-b border-slate-200 pb-1.5">
                PAYER INFORMATION
              </span>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  PAYER NAME (CLIENT)
                </label>
                <input
                  type="text"
                  placeholder="Full Name / Client"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  CLIENT EMAIL / CONTACT
                </label>
                <input
                  type="email"
                  placeholder="client@company.com"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
              </div>
            </div>

            {/* RECEIVER BANK ACCOUNT */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest block border-b border-slate-200 pb-1.5">
                RECEIVER BANK ACCOUNT
              </span>

              <div>
                <label className="block text-[11px] font-bold text-emerald-700 uppercase mb-1">
                  RECEIVER BANK ACCOUNT (COMPANY)
                </label>
                <div className="relative">
                  <select
                    value={formData.bankAccountId}
                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                    className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-xs rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {accountsList.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  ACCOUNT / IBAN NUMBER
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono font-bold cursor-not-allowed"
                  value={selectedBank?.accountNumber || selectedBank?.iban || '010203040506'}
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
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {initialData ? 'Update Income Entry' : 'Save Income Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
