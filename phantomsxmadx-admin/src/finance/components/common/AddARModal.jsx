import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, ArrowUpRight, DollarSign, Save } from 'lucide-react';
import { currencyPrefixes, convertCurrency } from '../../utils/formatters';

export const AddARModal = ({ isOpen, onClose, initialData = null }) => {
  const { selectedCurrency, addAR, updateAR } = useFinance();

  const [form, setForm] = useState({
    clientName: '',
    invoiceNo: '',
    amount: '',
    currency: selectedCurrency,
    date: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    notes: '',
    status: 'Pending',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        clientName: initialData.clientName || '',
        invoiceNo: initialData.invoiceNo || '',
        amount: initialData.originalAmount || initialData.amount || '',
        currency: initialData.currency || selectedCurrency,
        date: initialData.date || new Date().toISOString().slice(0, 10),
        dueDate: initialData.dueDate || new Date().toISOString().slice(0, 10),
        notes: initialData.notes || '',
        status: initialData.status || 'Pending',
      });
    } else {
      setForm({
        clientName: '',
        invoiceNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: '',
        currency: selectedCurrency,
        date: new Date().toISOString().slice(0, 10),
        dueDate: new Date().toISOString().slice(0, 10),
        notes: '',
        status: 'Pending',
      });
    }
  }, [initialData, isOpen, selectedCurrency]);

  if (!isOpen) return null;

  // Real-time live currency converter when user changes the Currency dropdown
  const handleCurrencyChange = (newCurrency) => {
    const oldCurrency = form.currency;
    if (oldCurrency === newCurrency) return;

    if (form.amount && !isNaN(form.amount) && Number(form.amount) > 0) {
      const converted = convertCurrency(form.amount, oldCurrency, newCurrency);
      const formattedAmount = newCurrency === 'PKR' ? Math.round(converted).toString() : Number(converted.toFixed(2)).toString();
      setForm({ ...form, currency: newCurrency, amount: formattedAmount });
    } else {
      setForm({ ...form, currency: newCurrency });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.clientName || !form.amount) return;

    if (initialData?.id) {
      updateAR(initialData.id, form);
    } else {
      addAR(form);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center select-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl shadow-2xl z-10 p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {initialData ? 'EDIT ACCOUNTS RECEIVABLE' : 'ADD ACCOUNTS RECEIVABLE (AR)'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Record pending invoice receivable from client</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              CLIENT / COMPANY NAME
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Tech Global"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            />
          </div>

          {/* Invoice No & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                INVOICE NUMBER
              </label>
              <input
                type="text"
                required
                placeholder="e.g. INV-1092"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={form.invoiceNo}
                onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                STATUS
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Collected">Collected</option>
              </select>
            </div>
          </div>

          {/* Currency & Amount */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                CURRENCY
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                value={form.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
              >
                <option value="PKR">PKR (Rs)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="SAR">SAR (ر.س)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                RECEIVABLE AMOUNT ({form.currency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Issue Date & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ISSUE DATE
              </label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                DUE DATE
              </label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              DESCRIPTION / NOTES
            </label>
            <input
              type="text"
              placeholder="e.g. Website development milestone payment"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <Save className="w-4 h-4" /> Save Receivable
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
