import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { currencyOptions, convertCurrency, formatCurrency } from '../../utils/formatters';
import { X, ChevronDown } from 'lucide-react';

export const AddEmployeeModal = ({ isOpen, onClose, initialData = null }) => {
  const { selectedCurrency, addPayroll, updatePayroll } = useFinance();

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    currency: selectedCurrency || 'PKR',
    basicSalary: '',
    bankName: 'Meezan Bank Ltd',
    accountTitle: '',
    accountNumber: '',
    iban: '',
  });

  useEffect(() => {
    if (initialData && isOpen) {
      const activeCurr = initialData.currency || selectedCurrency || 'PKR';
      const salaryInActiveCurr = initialData.basicSalary
        ? Math.round(convertCurrency(initialData.basicSalary, 'PKR', activeCurr))
        : '';

      setFormData({
        name: initialData.name || '',
        designation: initialData.designation || '',
        department: initialData.department || '',
        currency: activeCurr,
        basicSalary: salaryInActiveCurr,
        bankName: initialData.bankName || 'Meezan Bank Ltd',
        accountTitle: initialData.accountTitle || initialData.name || '',
        accountNumber: initialData.accountNumber || '',
        iban: initialData.iban || '',
      });
    } else if (!initialData && isOpen) {
      setFormData({
        name: '',
        designation: '',
        department: '',
        currency: selectedCurrency || 'PKR',
        basicSalary: '',
        bankName: 'Meezan Bank Ltd',
        accountTitle: '',
        accountNumber: '',
        iban: '',
      });
    }
  }, [initialData, isOpen, selectedCurrency]);

  if (!isOpen) return null;

  // Handle live currency switching with real-time conversion
  const handleCurrencyChange = (newCurrency) => {
    if (formData.basicSalary && !isNaN(formData.basicSalary)) {
      const converted = convertCurrency(formData.basicSalary, formData.currency, newCurrency);
      const formattedSalary = newCurrency === 'PKR' ? Math.round(converted) : Number(converted.toFixed(2));
      setFormData({
        ...formData,
        currency: newCurrency,
        basicSalary: formattedSalary,
      });
    } else {
      setFormData({ ...formData, currency: newCurrency });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.designation || !formData.accountNumber || !formData.basicSalary || Number(formData.basicSalary) <= 0) return;

    if (initialData) {
      updatePayroll(initialData.id, {
        name: formData.name,
        designation: formData.designation,
        department: formData.department,
        currency: formData.currency,
        basicSalary: Number(formData.basicSalary),
        bankName: formData.bankName,
        accountTitle: formData.accountTitle || formData.name,
        accountNumber: formData.accountNumber,
        iban: formData.iban,
      });
    } else {
      addPayroll({
        name: formData.name,
        designation: formData.designation,
        department: formData.department,
        currency: formData.currency,
        basicSalary: Number(formData.basicSalary),
        bankName: formData.bankName,
        accountTitle: formData.accountTitle || formData.name,
        accountNumber: formData.accountNumber,
        iban: formData.iban,
      });
    }

    onClose();
  };

  // Live Equivalent in Base PKR
  const basePkrEquivalent = formData.basicSalary && !isNaN(formData.basicSalary)
    ? convertCurrency(formData.basicSalary, formData.currency, 'PKR')
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
              {initialData ? `EDIT EMPLOYEE (${initialData.id})` : 'ADD NEW EMPLOYEE'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Record staff details, monthly salary & bank disbursement account</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. EMPLOYEE NAME & DESIGNATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                EMPLOYEE FULL NAME
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Zain Ul Abideen"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, accountTitle: formData.accountTitle || e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                POSITION / DESIGNATION
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lead Fullstack Architect"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
          </div>

          {/* 2. DEPARTMENT & MONTHLY SALARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                DEPARTMENT
              </label>
              <input
                type="text"
                placeholder="e.g. Engineering, Finance, HR..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 placeholder:font-normal"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                CURRENCY
              </label>
              <div className="relative">
                <select
                  value={formData.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-xs text-slate-900 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                MONTHLY SALARY ({formData.currency})
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="450000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
              />
              {formData.currency !== 'PKR' && formData.basicSalary > 0 && (
                <div className="text-[10px] font-bold text-sky-600 mt-1 flex items-center justify-between">
                  <span>Base:</span>
                  <span>{formatCurrency(basePkrEquivalent, 'PKR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. BANK DETAILS */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
            <span className="text-[11px] font-extrabold text-sky-600 uppercase tracking-widest block border-b border-slate-200 pb-1.5">
              DISBURSEMENT BANK DETAILS
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  BANK NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Meezan Bank Ltd"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  ACCOUNT TITLE
                </label>
                <input
                  type="text"
                  placeholder="Title on Account"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.accountTitle}
                  onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  ACCOUNT NUMBER <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 010203040506"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center justify-between">
                  <span>IBAN NUMBER</span>
                  <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. PK89MEZN0001..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
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
              className="px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {initialData ? 'Update Employee Details' : 'Save Employee Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
