import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Percent, SlidersHorizontal, Save } from 'lucide-react';

export const EditDistributionModal = ({ isOpen, onClose }) => {
  const { distributionSplits, updateDistributionSplits } = useFinance();

  const [form, setForm] = useState({
    businessExpenses: 35,
    companyReserve: 15,
    charityPool: 4,
  });

  useEffect(() => {
    if (distributionSplits) {
      setForm({
        businessExpenses: distributionSplits.businessExpenses ?? 35,
        companyReserve: distributionSplits.companyReserve ?? 15,
        charityPool: distributionSplits.charityPool ?? 4,
      });
    }
  }, [distributionSplits, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    updateDistributionSplits(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center select-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl shadow-2xl z-10 p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">EDIT AGENCY SPLIT PERCENTAGES</h2>
            <p className="text-xs text-slate-500 font-medium">Customize revenue distribution allocation percentages</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Expenses Percentage */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              BUSINESS EXPENSES ALLOCATION (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.businessExpenses}
                onChange={(e) => setForm({ ...form, businessExpenses: e.target.value })}
              />
              <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Calculated as % of Total Income</p>
          </div>

          {/* Company Reserve Percentage */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              COMPANY RESERVE ALLOCATION (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={form.companyReserve}
                onChange={(e) => setForm({ ...form, companyReserve: e.target.value })}
              />
              <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Calculated as % of Total Income</p>
          </div>

          {/* Charity Pool Percentage */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              CHARITY POOL ALLOCATION (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={form.charityPool}
                onChange={(e) => setForm({ ...form, charityPool: e.target.value })}
              />
              <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Calculated as % of Total Income</p>
          </div>

          {/* Submit & Cancel Buttons */}
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <Save className="w-4 h-4" /> Save Distribution Splits
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
