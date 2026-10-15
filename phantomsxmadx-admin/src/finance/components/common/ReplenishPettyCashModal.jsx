import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { X, ChevronDown, Wallet, ArrowRight, Banknote } from 'lucide-react';

export const ReplenishPettyCashModal = ({ isOpen, onClose }) => {
  const { selectedCurrency, accountsList, transferFunds, showToast } = useFinance();

  // Non-petty bank accounts (e.g. Meezan Bank, HBL)
  const bankAccounts = accountsList.filter((a) => a.id !== 'ACC-PETTY' && !a.isPettyCash);
  const pettyAccount = accountsList.find((a) => a.id === 'ACC-PETTY' || a.isPettyCash) || {
    id: 'ACC-PETTY',
    bankName: 'Petty Cash Drawer',
    balance: 0,
  };

  // Transfer Direction: 'BANK_TO_PETTY' (Bank -> Petty Cash) | 'PETTY_TO_BANK' (Petty Cash -> Bank)
  const [transferDirection, setTransferDirection] = useState('BANK_TO_PETTY');
  const [targetBankId, setTargetBankId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Auto initialize targetBankId whenever modal opens or accounts list updates
  useEffect(() => {
    if (isOpen && bankAccounts.length > 0) {
      if (!targetBankId || !bankAccounts.some((a) => a.id === targetBankId)) {
        setTargetBankId(bankAccounts[0].id);
      }
    }
  }, [isOpen, bankAccounts, targetBankId]);

  if (!isOpen) return null;

  const activeBankId = targetBankId || bankAccounts[0]?.id || '';
  const selectedBank = accountsList.find((a) => a.id === activeBankId) || bankAccounts[0];

  const handleQuickPreset = (val) => {
    setTransferAmount(val.toString());
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!activeBankId) {
      showToast('Please record at least one Bank Account first to perform cash transfers.', 'error');
      return;
    }

    const amt = Number(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid transfer amount.', 'error');
      return;
    }

    let success = false;
    if (transferDirection === 'BANK_TO_PETTY') {
      // Bank -> Petty Cash Drawer
      success = transferFunds(activeBankId, 'ACC-PETTY', amt);
    } else {
      // Petty Cash Drawer -> Bank Account
      success = transferFunds('ACC-PETTY', activeBankId, amt);
    }

    if (success) {
      onClose(); // Automatically close popup modal immediately after transfer
    }
  };

  const isBankToPetty = transferDirection === 'BANK_TO_PETTY';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center select-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl z-10 p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">PETTY CASH TRANSFER</h2>
              <p className="text-xs text-slate-500 font-medium">Transfer funds between Bank Account & Office Daily Cash Box</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Both-Way Direction Toggle Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setTransferDirection('BANK_TO_PETTY')}
            className={`flex-1 py-2.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isBankToPetty ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🏦 Bank ➔ Petty Cash</span>
          </button>

          <button
            type="button"
            onClick={() => setTransferDirection('PETTY_TO_BANK')}
            className={`flex-1 py-2.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !isBankToPetty ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>💵 Petty Cash ➔ Bank</span>
          </button>
        </div>

        {/* Transfer Visual Direction Flow */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
          {/* Source Box */}
          <div className="flex-1 text-center min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">FROM (SOURCE)</span>
            <span className="font-extrabold text-slate-900 block truncate">
              {isBankToPetty ? selectedBank?.bankName || 'Select Bank' : 'Petty Cash Drawer'}
            </span>
            <span className="text-[10px] font-bold text-emerald-600">
              Bal: {formatCurrency(isBankToPetty ? selectedBank?.balance || 0 : pettyAccount.balance || 0, selectedCurrency)}
            </span>
          </div>

          {/* Direction Arrow */}
          <div className="p-2 bg-amber-100 text-amber-700 rounded-full shrink-0 shadow-2xs">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Destination Box */}
          <div className="flex-1 text-center min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">TO (DESTINATION)</span>
            <span className="font-extrabold text-slate-900 block truncate">
              {isBankToPetty ? 'Petty Cash Drawer' : selectedBank?.bankName || 'Select Bank'}
            </span>
            <span className="text-[10px] font-bold text-amber-600">
              Bal: {formatCurrency(isBankToPetty ? pettyAccount.balance || 0 : selectedBank?.balance || 0, selectedCurrency)}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. SELECT BANK ACCOUNT */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isBankToPetty ? 'SOURCE BANK ACCOUNT' : 'DESTINATION BANK ACCOUNT'}
            </label>
            <div className="relative">
              <select
                value={activeBankId}
                onChange={(e) => setTargetBankId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {bankAccounts.length === 0 ? (
                  <option value="">No bank accounts available</option>
                ) : (
                  bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - Bal: {formatCurrency(acc.balance, selectedCurrency)}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* 2. TRANSFER AMOUNT */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              TRANSFER AMOUNT ({selectedCurrency})
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              placeholder="e.g. 10000"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </div>

          {/* QUICK PRESET BUTTONS */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              QUICK AMOUNT PRESETS:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {[2000, 5000, 10000, 20000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    Number(transferAmount) === preset
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  +{formatCurrency(preset, selectedCurrency)}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
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
              className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                isBankToPetty ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>{isBankToPetty ? 'Transfer to Petty Cash' : 'Deposit Back to Bank'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
