import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Users, Building } from 'lucide-react';
import { AddIncomeModal } from './AddIncomeModal';
import { AddExpenseModal } from './AddExpenseModal';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AddAccountModal } from './AddAccountModal';

export const QuickActionFab = () => {
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  return (
    <>
      {/* Floating Action Speed Dial Button Container */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-2.5 select-none no-print">
        {fabMenuOpen && (
          <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-4 duration-200">
            {/* 1. Add Income */}
            <button
              onClick={() => {
                setIncomeModalOpen(true);
                setFabMenuOpen(false);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-blue-500/30">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span>Add Income</span>
            </button>

            {/* 2. Add Expense */}
            <button
              onClick={() => {
                setExpenseModalOpen(true);
                setFabMenuOpen(false);
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-rose-500/30">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
              <span>Add Expense</span>
            </button>

            {/* 3. Add Employee */}
            <button
              onClick={() => {
                setEmployeeModalOpen(true);
                setFabMenuOpen(false);
              }}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-sky-500/30">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span>Add Employee</span>
            </button>

            {/* 4. Add Bank Account */}
            <button
              onClick={() => {
                setAccountModalOpen(true);
                setFabMenuOpen(false);
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-slate-700">
                <Building className="w-3.5 h-3.5" />
              </div>
              <span>Add Bank Account</span>
            </button>
          </div>
        )}

        {/* Main Floating '+' FAB Button */}
        <button
          onClick={() => setFabMenuOpen(!fabMenuOpen)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-600/35 hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white/20"
          title="Quick Action"
        >
          <Plus className={`w-7 h-7 transition-transform duration-200 ${fabMenuOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Modals rendered globally */}
      <AddIncomeModal isOpen={incomeModalOpen} onClose={() => setIncomeModalOpen(false)} />
      <AddExpenseModal isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} />
      <AddEmployeeModal isOpen={employeeModalOpen} onClose={() => setEmployeeModalOpen(false)} />
      <AddAccountModal isOpen={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
    </>
  );
};
