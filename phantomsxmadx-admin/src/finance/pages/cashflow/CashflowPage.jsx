import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { AddIncomeModal } from '../../components/common/AddIncomeModal';
import { AddExpenseModal } from '../../components/common/AddExpenseModal';
import { Plus, Search, Download, Calendar, ChevronDown, X, Pencil, Trash2 } from 'lucide-react';

export const CashflowPage = () => {
  const {
    selectedCurrency,
    incomeList,
    expenseList,
    metrics,
    deleteIncome,
    deleteExpense,
    showToast,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState('all');
  const [search, setSearch] = useState('');

  // Top Filter Controls (Matching Dashboard Filter Bar)
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('2026');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Modal States
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const monthNames = [
    { value: 'ALL', label: 'GENERAL (ALL)' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Helper to filter transactions by custom date range OR selected month & year
  const isRecordInFilter = (dateStr) => {
    if (!dateStr) return false;

    // 1. Custom Date Range check
    if (dateRange.start && dateStr < dateRange.start) {
      return false;
    }
    if (dateRange.end && dateStr > dateRange.end) {
      return false;
    }

    // 2. Year & Month filter check (only if custom date range is not specified)
    if (!dateRange.start && !dateRange.end) {
      const parts = dateStr.split('-');
      const yearPart = parts[0];
      const monthPart = parts[1];

      if (yearFilter !== 'ALL' && yearPart !== yearFilter) {
        return false;
      }
      if (selectedMonth !== 'ALL' && monthPart !== selectedMonth) {
        return false;
      }
    }

    return true;
  };

  const handleClearCustomDates = () => {
    setDateRange({ start: '', end: '' });
    showToast('Custom date range cleared', 'info');
  };

  // Filtered Transaction Lists
  const filteredIncomeList = incomeList.filter((i) => isRecordInFilter(i.date));
  const filteredExpenseList = expenseList.filter((e) => isRecordInFilter(e.date));

  const isCustomRangeActive = Boolean(dateRange.start || dateRange.end);
  const isFiltered = isCustomRangeActive || selectedMonth !== 'ALL' || yearFilter !== 'ALL';

  // Dynamic Calculated Metrics for Active Filter
  const activeIncomeTotal = filteredIncomeList.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  const activeExpensesTotal = filteredExpenseList.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const displayIncome = !isFiltered ? metrics.totalIncome : activeIncomeTotal;
  const displayExpenses = !isFiltered ? metrics.totalExpenses : activeExpensesTotal;
  const displayNetCash = displayIncome - displayExpenses;

  // Combined Records Table
  const combinedTransactions = [
    ...filteredIncomeList.map((i) => ({ ...i, type: 'Income', isCredit: true })),
    ...filteredExpenseList.map((e) => ({ ...e, type: 'Expense', isCredit: false, source: e.vendor })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const tableFiltered = combinedTransactions.filter((tx) => {
    const matchesTab =
      activeSubTab === 'all' ||
      (activeSubTab === 'income' && tx.isCredit) ||
      (activeSubTab === 'expenses' && !tx.isCredit);

    const matchesSearch =
      (tx.source || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.id || '').toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Handle Edit Action
  const handleEditClick = (tx) => {
    setEditingItem(tx);
    if (tx.isCredit) {
      setIncomeModalOpen(true);
    } else {
      setExpenseModalOpen(true);
    }
  };

  // Handle Delete Action
  const handleDeleteClick = (tx) => {
    if (window.confirm(`Are you sure you want to delete transaction ${tx.id}?`)) {
      if (tx.isCredit) {
        deleteIncome(tx.id);
      } else {
        deleteExpense(tx.id);
      }
    }
  };

  // CSV Export Functionality for Cashflow
  const handleExportCSV = () => {
    let periodLabel = 'FULL YEAR';
    if (isCustomRangeActive) {
      periodLabel = `CUSTOM RANGE (${dateRange.start || 'Start'} to ${dateRange.end || 'End'})`;
    } else if (selectedMonth !== 'ALL') {
      periodLabel = monthNames.find((m) => m.value === selectedMonth)?.label || 'MONTH';
    }

    let csvContent = `data:text/csv;charset=utf-8,`;
    csvContent += `HATTECH FINANCE - CASHFLOW STATEMENT (${yearFilter})\n`;
    csvContent += `Filtered Period,${periodLabel}\n`;
    csvContent += `Currency Base,${selectedCurrency}\n\n`;

    csvContent += `SUMMARY METRICS\n`;
    csvContent += `Metric,Amount (${selectedCurrency})\n`;
    csvContent += `Total Cash Inflow,"${formatCurrency(displayIncome, selectedCurrency)}"\n`;
    csvContent += `Total Operating Outflow,"${formatCurrency(displayExpenses, selectedCurrency)}"\n`;
    csvContent += `Net Operating Cash,"${formatCurrency(displayNetCash, selectedCurrency)}"\n\n`;

    csvContent += `CASHFLOW TRANSACTIONS\n`;
    csvContent += `Type,ID,Party/Vendor,Category,Payment Type,Date,Amount (${selectedCurrency})\n`;

    tableFiltered.forEach((tx) => {
      csvContent += `"${tx.type}",${tx.id},"${tx.source || 'General'}","${tx.category || '-'}","${tx.projectPayment || 'Standard'}",${tx.date},"${formatCurrency(tx.amount, selectedCurrency)}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HATTECH_CASHFLOW_STATEMENT_${yearFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Cashflow statement exported for ${periodLabel}!`, 'success');
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Filter Bar (Identical to Dashboard Header Controls) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">CASHFLOW MANAGEMENT</h1>
          {isCustomRangeActive ? (
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5 flex items-center gap-2">
              <span>Filtered Range: {dateRange.start ? formatDate(dateRange.start) : 'Beginning'} to {dateRange.end ? formatDate(dateRange.end) : 'Present'}</span>
              <button onClick={handleClearCustomDates} className="text-rose-500 hover:text-rose-700 underline font-semibold">Clear</button>
            </p>
          ) : selectedMonth !== 'ALL' ? (
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">
              Filtered Period: {monthNames.find((m) => m.value === selectedMonth)?.label} {yearFilter}
            </p>
          ) : (
            <p className="text-xs text-slate-500 font-medium">Real-time revenue inflows & operational expenses</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* General (All) / Month Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                const label = monthNames.find((m) => m.value === e.target.value)?.label;
                showToast(`Filter updated: ${label}`, 'info');
              }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              {monthNames.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                const label = e.target.value === 'ALL' ? 'ALL YEARS' : `Year ${e.target.value}`;
                showToast(`Filter updated: ${label}`, 'info');
              }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2027">2027</option>
              <option value="ALL">ALL YEARS</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
          </div>


          {/* Add Income & Add Expense Buttons */}
          <button
            onClick={() => {
              setEditingItem(null);
              setIncomeModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Income
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setExpenseModalOpen(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Cash Inflow</span>
          <h3 className="text-xl font-black text-emerald-600 mt-1">
            {formatCurrency(displayIncome, selectedCurrency)}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Operating Outflow</span>
          <h3 className="text-xl font-black text-rose-600 mt-1">
            {formatCurrency(displayExpenses, selectedCurrency)}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Net Operating Cash</span>
          <h3 className={`text-xl font-black mt-1 ${displayNetCash < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
            {formatCurrency(displayNetCash, selectedCurrency)}
          </h3>
        </div>
      </div>

      {/* Table Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Transactions' },
            { id: 'income', label: 'Income Only' },
            { id: 'expenses', label: 'Expenses Only' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search category, vendor, ID..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Cashflow Table with Action Buttons Column */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5">ID & Date</th>
              <th className="px-4 py-3.5">Clearing Entity / Party</th>
              <th className="px-4 py-3.5">Category / Payment Type</th>
              <th className="px-4 py-3.5">Client / Payer</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-4 py-3.5 text-right">Amount</th>
              <th className="px-4 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {tableFiltered.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">
                  No cashflow records found. Click "Add Income" or "Add Expense" to record entry.
                </td>
              </tr>
            ) : (
              tableFiltered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{tx.id}</div>
                    <div className="text-[10px] text-slate-400">{formatDate(tx.date)}</div>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">{tx.clearingEntity || tx.source || 'General'}</td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800">{tx.category}</div>
                    {tx.projectPayment && <div className="text-[10px] text-blue-600 font-bold">{tx.projectPayment}</div>}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{tx.clientName || tx.vendor || 'N/A'}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        tx.isCredit ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3.5 text-right font-black text-sm ${tx.isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.isCredit ? '+' : '-'}{formatCurrency(tx.amount, selectedCurrency)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleEditClick(tx)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Transaction"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(tx)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Transaction"
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

      {/* Rich Add/Edit Income Modal */}
      <AddIncomeModal
        isOpen={incomeModalOpen}
        onClose={() => {
          setIncomeModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
      />

      {/* Rich Add/Edit Expense Modal */}
      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
      />
    </div>
  );
};

export default CashflowPage;
