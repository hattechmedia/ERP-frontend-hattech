import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Search, Download, FileText, PieChart, Landmark } from 'lucide-react';

export const StatementPage = () => {
  const {
    selectedCurrency,
    incomeList,
    expenseList,
    payrollList,
    accountsList,
    metrics,
    distributionSplits,
    showToast,
  } = useFinance();

  // Navigation Sub-tab: 'ledger' (GENERAL LEDGER) | 'pnl' (INCOME STATEMENT P&L) | 'balance' (BALANCE SHEET)
  const [activeReportTab, setActiveReportTab] = useState('ledger');

  // Category Filter on Left Panel
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Search Query
  const [search, setSearch] = useState('');

  // Synthesize complete general ledger rows (NO FAKE DEDUCTION AUTO-SPLITS)
  const rawLedgerRows = [
    // 1. Direct Income Revenue Records (Credit)
    ...incomeList.map((i) => ({
      date: i.date,
      desc: i.notes || i.clearingEntity || i.source || 'CLIENT REVENUE INFLOW',
      category: 'INCOME',
      entity: i.clientName || i.source || 'DIRECT PAYMENT',
      debit: 0,
      credit: i.amount,
      ref: i.id,
    })),
    // 2. Operational Expenses (Debit)
    ...expenseList.map((e) => ({
      date: e.date,
      desc: e.notes || e.category || 'OPERATIONAL EXPENSE',
      category: (e.category || 'OPERATIONAL').toUpperCase(),
      entity: e.vendor || 'DIRECT PAYMENT',
      debit: e.amount,
      credit: 0,
      ref: e.id,
    })),
    // 3. Payroll Outflows (Debit)
    ...payrollList.map((p) => ({
      date: p.date,
      desc: `STAFF PAYROLL DISBURSEMENT (${p.name.toUpperCase()})`,
      category: 'PAYROLL',
      entity: p.bankName || 'MEEZAN BANK',
      debit: p.basicSalary,
      credit: 0,
      ref: p.id,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Available Category Filter Options
  const categoriesList = [
    'ALL',
    'INCOME',
    'PAYROLL',
    'OFFICE RENT',
    'OFFICE UTILITIES',
    'SOFTWARE & SAAS',
    'CLOUD & HOSTING',
    'HARDWARE & IT',
    'MARKETING & ADVERTISING',
    'TRAVEL & ACCOMMODATION',
    'TAX & GOVERNMENT',
    'CHARITY',
  ];

  // Filter Ledger Rows
  const filteredLedger = rawLedgerRows.filter((row) => {
    const matchesCat =
      selectedCategory === 'ALL' ||
      row.category.toUpperCase().includes(selectedCategory);

    const matchesSearch =
      row.desc.toLowerCase().includes(search.toLowerCase()) ||
      row.category.toLowerCase().includes(search.toLowerCase()) ||
      row.entity.toLowerCase().includes(search.toLowerCase()) ||
      row.ref.toLowerCase().includes(search.toLowerCase());

    return matchesCat && matchesSearch;
  });

  // Calculate Ledger Net Position (Credits - Debits)
  const totalCredits = filteredLedger.reduce((acc, r) => acc + r.credit, 0);
  const totalDebits = filteredLedger.reduce((acc, r) => acc + r.debit, 0);
  const ledgerNetPosition = totalCredits - totalDebits;

  // CSV Export for Ledger
  const handleExportLedgerCSV = () => {
    let csvContent = `data:text/csv;charset=utf-8,`;
    csvContent += `HATTECH FINANCE - OFFICIAL GENERAL LEDGER AUDIT\n`;
    csvContent += `Report Type,${activeReportTab.toUpperCase()}\n`;
    csvContent += `Currency Base,${selectedCurrency}\n\n`;

    csvContent += `DATE,DESCRIPTION,CATEGORY,CONTACT / ENTITY,DEBIT (${selectedCurrency}),CREDIT (${selectedCurrency})\n`;

    filteredLedger.forEach((r) => {
      csvContent += `${r.date},"${r.desc}","${r.category}","${r.entity}","${r.debit ? formatCurrency(r.debit, selectedCurrency) : '-'}","${r.credit ? formatCurrency(r.credit, selectedCurrency) : '-'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HATTECH_GENERAL_LEDGER_REPORT.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Official accounting general ledger exported!', 'success');
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner Header matching screenshot (`ACCOUNTING & REPORTS HUB`) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
            ACCOUNTING & REPORTS HUB
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-wider uppercase mt-0.5">
            OFFICIAL ACCOUNTANT STATEMENTS & LEDGER AUDIT
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sub-tab Navigation Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveReportTab('ledger')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeReportTab === 'ledger'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              General Ledger
            </button>
            <button
              onClick={() => setActiveReportTab('pnl')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeReportTab === 'pnl'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income Statement (P&L)
            </button>
            <button
              onClick={() => setActiveReportTab('balance')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeReportTab === 'balance'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Balance Sheet
            </button>
          </div>

          {/* Export Report CSV Button */}
          <button
            onClick={handleExportLedgerCSV}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl px-4 py-2 text-xs transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT AUDIT</span>
          </button>
        </div>
      </div>

      {/* Main Content Area depending on active sub-tab */}
      {activeReportTab === 'ledger' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Category Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 h-fit">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">FILTER BY CATEGORY</h3>
            <div className="space-y-1">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCategory === cat
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">NET LEDGER POSITION</span>
              <h4 className={`text-lg font-black ${ledgerNetPosition < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(ledgerNetPosition, selectedCurrency)}
              </h4>
            </div>
          </div>

          {/* Right Column: General Ledger Table */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                GENERAL LEDGER TRANSACTIONS ({filteredLedger.length})
              </h3>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">DATE</th>
                    <th className="px-4 py-3.5">DESCRIPTION</th>
                    <th className="px-4 py-3.5">CATEGORY</th>
                    <th className="px-4 py-3.5">CONTACT / ENTITY</th>
                    <th className="px-4 py-3.5 text-right text-rose-600">DEBIT ({selectedCurrency})</th>
                    <th className="px-4 py-3.5 text-right text-emerald-600">CREDIT ({selectedCurrency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400">
                        No general ledger records found.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-slate-500 font-bold whitespace-nowrap">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">{row.desc}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {row.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 uppercase font-semibold">{row.entity}</td>
                        <td className="px-4 py-3.5 text-right font-black text-rose-600">
                          {row.debit > 0 ? formatCurrency(row.debit, selectedCurrency) : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-emerald-600">
                          {row.credit > 0 ? formatCurrency(row.credit, selectedCurrency) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-black text-xs text-slate-900 border-t border-slate-200">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-right uppercase">Total Summary:</td>
                    <td className="px-4 py-3 text-right text-rose-600">
                      {formatCurrency(totalDebits, selectedCurrency)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {formatCurrency(totalCredits, selectedCurrency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Income Statement (P&L) Tab */}
      {activeReportTab === 'pnl' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900 uppercase">PROFIT & LOSS STATEMENT (P&L)</h2>
            <p className="text-xs text-slate-500">Comprehensive summary of revenue, expenses, and net profit</p>
          </div>

          <div className="space-y-4 max-w-3xl">
            {/* Revenue */}
            <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <span className="font-bold text-slate-900 text-sm uppercase">Total Operating Revenue (Gross Income)</span>
              <span className="font-black text-emerald-600 text-lg">{formatCurrency(metrics.totalIncome, selectedCurrency)}</span>
            </div>

            {/* Agency Distribution Cuts */}
            <div className="space-y-2 pl-4 border-l-2 border-amber-300">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                Agency Revenue Distributions (Deductions Cut From Revenue)
              </span>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="font-semibold text-slate-600">Business Expenses ({distributionSplits?.businessExpenses ?? 35}%)</span>
                <span className="font-bold text-amber-600">-{formatCurrency(metrics.businessExpensesAllocation, selectedCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="font-semibold text-slate-600">Company Reserve ({distributionSplits?.companyReserve ?? 15}%)</span>
                <span className="font-bold text-amber-600">-{formatCurrency(metrics.companyReserveAllocation, selectedCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="font-semibold text-slate-600">Charity Pool ({distributionSplits?.charityPool ?? 4}%)</span>
                <span className="font-bold text-amber-600">-{formatCurrency(metrics.charityPoolAllocation, selectedCurrency)}</span>
              </div>
            </div>

            {/* Outflows */}
            <div className="space-y-2 pl-4 border-l-2 border-rose-200">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
                Operating Outflows & Payroll
              </span>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="font-semibold text-slate-600">Total Payroll Outflows</span>
                <span className="font-bold text-rose-600">-{formatCurrency(metrics.totalPayroll, selectedCurrency)}</span>
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <span className="font-semibold text-slate-600">Total Operating Expenses</span>
                <span className="font-bold text-rose-600">-{formatCurrency(metrics.totalExpenses, selectedCurrency)}</span>
              </div>
            </div>

            {/* Net Operating Income */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl shadow-xs">
              <span className="font-black text-sm uppercase">NET OPERATING PROFIT</span>
              <span className={`font-black text-xl ${metrics.netProfit < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrency(metrics.netProfit, selectedCurrency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet Tab */}
      {activeReportTab === 'balance' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900 uppercase">CORPORATE BALANCE SHEET</h2>
            <p className="text-xs text-slate-500">Statement of financial position: Assets, Liabilities, and Equity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ASSETS */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-blue-600 uppercase border-b border-blue-200 pb-2">TOTAL ASSETS</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Liquid Bank Capital Reserves</span>
                  <span className="font-bold">{formatCurrency(metrics.totalIncome - metrics.totalExpenses - metrics.totalPayroll, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Accounts Receivable (AR)</span>
                  <span className="font-bold">{formatCurrency(metrics.totalAR, selectedCurrency)}</span>
                </div>
              </div>
            </div>

            {/* LIABILITIES */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-rose-600 uppercase border-b border-rose-200 pb-2">TOTAL LIABILITIES</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Accounts Payable (AP)</span>
                  <span className="font-bold">{formatCurrency(metrics.totalAP, selectedCurrency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatementPage;
