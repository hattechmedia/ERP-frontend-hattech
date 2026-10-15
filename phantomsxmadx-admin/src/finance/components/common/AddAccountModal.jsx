import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { currencyOptions, convertCurrency, formatCurrency } from '../../utils/formatters';
import { X, ChevronDown } from 'lucide-react';

export const AddAccountModal = ({ isOpen, onClose, initialData = null }) => {
  const { selectedCurrency, addAccount, updateAccount } = useFinance();

  const [formData, setFormData] = useState({
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    currency: selectedCurrency || 'PKR',
    balance: '',
  });

  useEffect(() => {
    if (initialData && isOpen) {
      const activeCurr = initialData.currency || selectedCurrency || 'PKR';
      const balanceInActiveCurr = initialData.balance
        ? Math.round(convertCurrency(initialData.balance, 'PKR', activeCurr))
        : '';

      setFormData({
        bankName: initialData.bankName || '',
        accountTitle: initialData.accountTitle || '',
        accountNumber: initialData.accountNumber || '',
        iban: initialData.iban || '',
        currency: activeCurr,
        balance: balanceInActiveCurr,
      });
    } else if (!initialData && isOpen) {
      setFormData({
        bankName: '',
        accountTitle: '',
        accountNumber: '',
        iban: '',
        currency: selectedCurrency || 'PKR',
        balance: '',
      });
    }
  }, [initialData, isOpen, selectedCurrency]);

  if (!isOpen) return null;

  // Handle live currency switching with real-time conversion
  const handleCurrencyChange = (newCurrency) => {
    if (formData.balance && !isNaN(formData.balance)) {
      const converted = convertCurrency(formData.balance, formData.currency, newCurrency);
      const formattedBalance = newCurrency === 'PKR' ? Math.round(converted) : Number(converted.toFixed(2));
      setFormData({
        ...formData,
        currency: newCurrency,
        balance: formattedBalance,
      });
    } else {
      setFormData({ ...formData, currency: newCurrency });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.bankName || !formData.accountTitle) return;

    if (initialData) {
      updateAccount(initialData.id, {
        bankName: formData.bankName,
        accountTitle: formData.accountTitle,
        accountNumber: formData.accountNumber,
        iban: formData.iban,
        currency: formData.currency,
        balance: Number(formData.balance || 0),
      });
    } else {
      addAccount({
        bankName: formData.bankName,
        accountTitle: formData.accountTitle,
        accountNumber: formData.accountNumber,
        iban: formData.iban,
        currency: formData.currency,
        balance: Number(formData.balance || 0),
      });
    }

    onClose();
  };

  // Live Equivalent in Base PKR
  const basePkrEquivalent = formData.balance && !isNaN(formData.balance)
    ? convertCurrency(formData.balance, formData.currency, 'PKR')
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center select-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl z-10 p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
              {initialData ? `EDIT BANK ACCOUNT (${initialData.id})` : 'ADD NEW BANK ACCOUNT'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Record corporate bank details, IBAN & liquid opening balance</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. BANK NAME */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              BANK NAME / ENTITY
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MEEZAN BANK (HAT TECH MEDIA (MAIN))"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            />
          </div>

          {/* 2. ACCOUNT TITLE */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ACCOUNT TITLE / OWNER
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HattTech Media Operating"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400"
              value={formData.accountTitle}
              onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
            />
          </div>

          {/* 3. ACCOUNT NUMBER & IBAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ACCOUNT NUMBER
              </label>
              <input
                type="text"
                placeholder="e.g. 010203040506"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                IBAN NUMBER
              </label>
              <input
                type="text"
                placeholder="e.g. PK89MEZN00010203040506"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              />
            </div>
          </div>

          {/* 4. CURRENCY & OPENING BALANCE */}
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
                CURRENT BALANCE ({formData.currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="2850000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              />
              {formData.currency !== 'PKR' && formData.balance > 0 && (
                <div className="text-[11px] font-bold text-blue-600 mt-1 flex items-center justify-between">
                  <span>Base Equivalent:</span>
                  <span>{formatCurrency(basePkrEquivalent, 'PKR')}</span>
                </div>
              )}
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
              {initialData ? 'Update Bank Account' : 'Save Bank Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
