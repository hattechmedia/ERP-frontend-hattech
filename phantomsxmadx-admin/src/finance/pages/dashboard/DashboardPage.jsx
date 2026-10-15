import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EditDistributionModal } from '../../components/common/EditDistributionModal';
import {
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Download,
  Calendar,
  ChevronDown,
  X,
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  Tag,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage = () => {
  const {
    selectedCurrency,
    metrics,
    incomeList,
    expenseList,
    payrollList,
    arList,
    distributionSplits,
    setActiveTab,
    showToast,
  } = useFinance();

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('2026');
  const [editSplitsModalOpen, setEditSplitsModalOpen] = useState(false);

  // Month & Custom Date Range Filtering Logic
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

  const filteredIncomeList = incomeList.filter((i) => isRecordInFilter(i.date));
  const filteredExpenseList = expenseList.filter((e) => isRecordInFilter(e.date));
  const filteredPayrollList = payrollList.filter((p) => isRecordInFilter(p.date));

  // Active Calculated Metrics for Selected Period or Date Range (in EUR base)
  const isCustomRangeActive = Boolean(dateRange.start || dateRange.end);
  const isFiltered = isCustomRangeActive || selectedMonth !== 'ALL' || yearFilter !== 'ALL';

  const activeIncome = filteredIncomeList.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  const activePayroll = filteredPayrollList.reduce((acc, p) => acc + Number(p.basicSalary || 0), 0);
  const activeExpenses = filteredExpenseList.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const displayIncome = !isFiltered ? metrics.totalIncome : activeIncome;
  const displayPayroll = !isFiltered ? metrics.totalPayroll : activePayroll;
  const displayExpenses = !isFiltered ? metrics.totalExpenses : activeExpenses;
  const displayAR = metrics.totalAR;
  const displayAP = metrics.totalAP;

  // Custom Agency Distribution Allocations (Dynamic percentages from state)
  const busExpPct = distributionSplits?.businessExpenses ?? 35;
  const compResPct = distributionSplits?.companyReserve ?? 15;
  const charityPct = distributionSplits?.charityPool ?? 4;

  const businessExpensesAllocation = displayIncome * (busExpPct / 100);
  const companyReserveAllocation = displayIncome * (compResPct / 100);
  const charityPoolAllocation = displayIncome * (charityPct / 100);
  const totalDistributionDeductions = businessExpensesAllocation + companyReserveAllocation + charityPoolAllocation;

  const displayNetProfit = displayIncome - totalDistributionDeductions - displayPayroll - displayExpenses;

  // Reset Custom Dates
  const handleClearCustomDates = () => {
    setDateRange({ start: '', end: '' });
    showToast('Custom date range cleared', 'info');
  };

  // CSV Sheet Export Functionality
  const handleExportCSV = () => {
    let periodLabel = 'FULL YEAR';
    if (isCustomRangeActive) {
      periodLabel = `CUSTOM RANGE (${dateRange.start || 'Start'} to ${dateRange.end || 'End'})`;
    } else if (selectedMonth !== 'ALL') {
      periodLabel = monthNames.find((m) => m.value === selectedMonth)?.label || 'MONTH';
    }

    let csvContent = `data:text/csv;charset=utf-8,`;
    csvContent += `HATTECH FINANCE - FINANCIAL REPORT (${yearFilter})\n`;
    csvContent += `Filtered Period,${periodLabel}\n`;
    csvContent += `Currency Base,${selectedCurrency}\n\n`;

    csvContent += `SUMMARY METRICS\n`;
    csvContent += `Metric,Amount (${selectedCurrency})\n`;
    csvContent += `Total Income,"${formatCurrency(displayIncome, selectedCurrency)}"\n`;
    csvContent += `Total Payrolls,"${formatCurrency(displayPayroll, selectedCurrency)}"\n`;
    csvContent += `Total Business Expenses,"${formatCurrency(displayExpenses, selectedCurrency)}"\n`;
    csvContent += `Accounts Receivable (AR),"${formatCurrency(displayAR, selectedCurrency)}"\n`;
    csvContent += `Accounts Payable (AP),"${formatCurrency(displayAP, selectedCurrency)}"\n`;
    csvContent += `Net Profit,"${formatCurrency(displayNetProfit, selectedCurrency)}"\n\n`;

    csvContent += `REVENUE SPLIT ALLOCATIONS\n`;
    csvContent += `${busExpPct}% Business Expenses Allocation,"${formatCurrency(businessExpensesAllocation, selectedCurrency)}"\n`;
    csvContent += `${compResPct}% Company Reserve Allocation,"${formatCurrency(companyReserveAllocation, selectedCurrency)}"\n`;
    csvContent += `${charityPct}% Charity Pool Allocation,"${formatCurrency(charityPoolAllocation, selectedCurrency)}"\n\n`;

    csvContent += `TRANSACTION RECORDS\n`;
    csvContent += `Type,ID,Party/Vendor,Category,Date,Amount (${selectedCurrency})\n`;

    filteredIncomeList.forEach((i) => {
      csvContent += `Income,${i.id},"${i.source || 'General'}","${i.category}",${i.date},"${formatCurrency(i.amount, selectedCurrency)}"\n`;
    });
    filteredExpenseList.forEach((e) => {
      csvContent += `Expense,${e.id},"${e.vendor || 'General'}","${e.category}",${e.date},"${formatCurrency(e.amount, selectedCurrency)}"\n`;
    });
    filteredPayrollList.forEach((p) => {
      csvContent += `Payroll,${p.id},"${p.name}","${p.designation}",${p.date},"${formatCurrency(p.basicSalary, selectedCurrency)}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HATTECH_FINANCE_SHEET_${yearFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Financial report sheet exported for ${periodLabel}!`, 'success');
  };

  // 100% REAL-TIME DYNAMIC MONTHLY DATA AGGREGATOR FOR CASHFLOW PULSE CHART
  const monthsArr = [
    { key: '01', month: 'Jan' },
    { key: '02', month: 'Feb' },
    { key: '03', month: 'Mar' },
    { key: '04', month: 'Apr' },
    { key: '05', month: 'May' },
    { key: '06', month: 'Jun' },
    { key: '07', month: 'Jul' },
    { key: '08', month: 'Aug' },
    { key: '09', month: 'Sep' },
    { key: '10', month: 'Oct' },
    { key: '11', month: 'Nov' },
    { key: '12', month: 'Dec' },
  ];

  const cashflowPulseData = monthsArr.map((m) => {
    // Income in month m.key for active yearFilter
    const incMonthTotal = incomeList
      .filter((i) => {
        if (!i.date) return false;
        const [y, mon] = i.date.split('-');
        return mon === m.key && (yearFilter === 'ALL' || y === yearFilter);
      })
      .reduce((acc, i) => acc + Number(i.amount || 0), 0);

    // Expense in month m.key for active yearFilter
    const expMonthTotal = expenseList
      .filter((e) => {
        if (!e.date) return false;
        const [y, mon] = e.date.split('-');
        return mon === m.key && (yearFilter === 'ALL' || y === yearFilter);
      })
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);

    // Payroll in month m.key for active yearFilter
    const payMonthTotal = payrollList
      .filter((p) => {
        if (!p.date) return false;
        const [y, mon] = p.date.split('-');
        return mon === m.key && (yearFilter === 'ALL' || y === yearFilter);
      })
      .reduce((acc, p) => acc + Number(p.basicSalary || 0), 0);

    const totalOutflowMonth = expMonthTotal + payMonthTotal;
    const profitMonth = incMonthTotal - totalOutflowMonth;

    return {
      month: m.month,
      Income: incMonthTotal,
      Expense: totalOutflowMonth,
      Profit: profitMonth,
    };
  });

  // Dynamic Donut Data for COST DISTRIBUTION
  const totalOutflow = displayExpenses + displayPayroll + totalDistributionDeductions;
  const hasData = displayIncome > 0 || totalOutflow > 0;

  const costDistributionData = hasData
    ? [
        { name: 'Revenue', value: displayIncome, color: '#2563eb' },
        { name: 'Distribution Cuts', value: totalDistributionDeductions, color: '#f59e0b' },
        { name: 'Expenses & Payroll', value: displayExpenses + displayPayroll, color: '#e11d48' },
        { name: 'Profit', value: Math.max(0, displayNetProfit), color: '#10b981' },
      ]
    : [{ name: 'No Records', value: 1, color: '#cbd5e1' }];

  // 1. Profit Margin & Financial Health Badge Calculations
  const profitMarginPct = displayIncome > 0 ? ((displayNetProfit / displayIncome) * 100).toFixed(1) : 0;

  let healthBadge = {
    label: 'PROFIT EXCELLENT',
    colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    dotColor: 'bg-emerald-400',
    icon: ShieldCheck,
    description: `Strong net margin of ${profitMarginPct}% retained after corporate distribution reserves.`,
  };

  if (displayIncome === 0 && displayExpenses === 0) {
    healthBadge = {
      label: 'FINANCIAL HEALTH READY',
      colorClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      dotColor: 'bg-slate-400',
      icon: Activity,
      description: 'System ready. No financial income or expense entries logged for the active period filter.',
    };
  } else if (displayNetProfit <= 0) {
    healthBadge = {
      label: 'DEFICIT WARNING',
      colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      dotColor: 'bg-rose-400',
      icon: AlertTriangle,
      description: `Operating costs & company reserve allocations exceed gross revenue for the selected period.`,
    };
  } else if (Number(profitMarginPct) < 35) {
    healthBadge = {
      label: 'PROFIT MODERATE',
      colorClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      dotColor: 'bg-sky-400',
      icon: TrendingUp,
      description: `Positive cashflow retention with ${profitMarginPct}% net profit margin.`,
    };
  }

  // 2. Pending Accounts Receivable (AR) Invoices Count & Sum
  const pendingARList = (arList || []).filter((ar) => ar.status === 'Pending');
  const pendingARCount = pendingARList.length;
  const pendingARTotal = pendingARList.reduce((acc, ar) => acc + Number(ar.amount || 0), 0);

  // 3. Top Expense Category Determination for Selected Period
  const expCategoryTotals = {};
  filteredExpenseList.forEach((exp) => {
    const cat = exp.category || 'General Expense';
    expCategoryTotals[cat] = (expCategoryTotals[cat] || 0) + Number(exp.amount || 0);
  });
  let topExpenseCategoryName = null;
  let topExpenseCategoryAmount = 0;
  Object.entries(expCategoryTotals).forEach(([catName, totalAmt]) => {
    if (totalAmt > topExpenseCategoryAmount) {
      topExpenseCategoryAmount = totalAmt;
      topExpenseCategoryName = catName;
    }
  });

  return (
    <div className="space-y-6 select-none relative pb-16">
      {/* Top Title & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">HATTECH FINANCE</h1>
          {isCustomRangeActive ? (
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5 flex items-center gap-2">
              <span>Filtered Range: {dateRange.start ? formatDate(dateRange.start) : 'Beginning'} to {dateRange.end ? formatDate(dateRange.end) : 'Present'}</span>
              <button onClick={handleClearCustomDates} className="text-rose-500 hover:text-rose-700 underline font-semibold">Clear</button>
            </p>
          ) : selectedMonth !== 'ALL' ? (
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">
              Filtered Period: {monthNames.find((m) => m.value === selectedMonth)?.label} {yearFilter}
            </p>
          ) : null}
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

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-[11px]"
              title="Start Date"
            />
            <span className="text-slate-400 text-[10px]">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-[11px]"
              title="End Date"
            />
            {isCustomRangeActive && (
              <button
                onClick={handleClearCustomDates}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                title="Clear Dates"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export CSV Sheet Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl px-4 py-2 transition-all cursor-pointer shadow-2xs"
            title="Download CSV Financial Sheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT</span>
          </button>
        </div>
      </div>

      {/* Smart Monthly Financial Health Badge & Executive Insights Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-10">
          {/* Left: Financial Health Badge */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`p-3 rounded-2xl border ${healthBadge.colorClass} flex items-center justify-center shrink-0 shadow-lg`}>
              <healthBadge.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">FINANCIAL HEALTH BADGE</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${healthBadge.colorClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${healthBadge.dotColor} animate-pulse`} />
                  {healthBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                {healthBadge.description}
              </p>
            </div>
          </div>

          {/* Right: Operational Insight Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-800">
            {/* Chip 1: Overdue Invoices Alert */}
            <div
              onClick={() => setActiveTab('accounts')}
              className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                pendingARCount > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Click to view Accounts Receivable (AR)"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${pendingARCount > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="font-bold">
                {pendingARCount > 0
                  ? `${pendingARCount} Overdue Invoice${pendingARCount > 1 ? 's' : ''} (${formatCurrency(pendingARTotal, selectedCurrency)}) Need Attention`
                  : 'All Invoices Collected'}
              </span>
            </div>

            {/* Chip 2: Top Expense Category */}
            <div
              onClick={() => setActiveTab('cashflow')}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-2 cursor-pointer transition-all"
              title="Click to view Cashflow Expenses"
            >
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold">
                {topExpenseCategoryName
                  ? `Top Expense: ${topExpenseCategoryName} (${formatCurrency(topExpenseCategoryAmount, selectedCurrency)})`
                  : 'Top Expense: None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 KPI Cards Grid (ENTIRE CARD IS CLICKABLE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: INCOME (Clickable -> Cashflow) */}
        <div
          onClick={() => setActiveTab('cashflow')}
          className="bg-white hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 p-5 rounded-2xl border border-slate-200 shadow-2xs transition-all flex flex-col justify-between h-44 cursor-pointer group"
          title="Click to view Cashflow Income details"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ↗ +12.5%
            </span>
          </div>

          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">INCOME</span>
            <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
              {formatCurrency(displayIncome, selectedCurrency)}
            </h3>
          </div>

          <div className="text-[10px] font-bold text-blue-600 group-hover:text-blue-700 uppercase tracking-wider text-left transition-colors flex items-center gap-1 mt-2">
            <span>CLICK TO VIEW DETAILS</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 2: PAYROLLS (Clickable -> Payroll) */}
        <div
          onClick={() => setActiveTab('payroll')}
          className="bg-white hover:border-sky-400 hover:shadow-md hover:-translate-y-0.5 p-5 rounded-2xl border border-slate-200 shadow-2xs transition-all flex flex-col justify-between h-44 cursor-pointer group"
          title="Click to view Payroll details"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ↗ -0.8%
            </span>
          </div>

          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PAYROLLS</span>
            <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
              {formatCurrency(displayPayroll, selectedCurrency)}
            </h3>
          </div>

          <div className="text-[10px] font-bold text-sky-600 group-hover:text-sky-700 uppercase tracking-wider text-left transition-colors flex items-center gap-1 mt-2">
            <span>CLICK TO VIEW DETAILS</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 3: ACCOUNTS RECEIVABLE (AR) (Clickable -> Accounts Page) */}
        <div
          onClick={() => setActiveTab('accounts')}
          className="bg-white hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 p-5 rounded-2xl border border-slate-200 shadow-2xs transition-all flex flex-col justify-between h-44 cursor-pointer group"
          title="Click to view Accounts & Receivables Page"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ↗ +8.1%
            </span>
          </div>

          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ACCOUNTS RECEIVABLE (AR)</span>
            <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
              {formatCurrency(displayAR, selectedCurrency)}
            </h3>
          </div>

          <div className="text-[10px] font-bold text-amber-600 group-hover:text-amber-700 uppercase tracking-wider text-left transition-colors flex items-center gap-1 mt-2">
            <span>CLICK TO VIEW DETAILS</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 4: ACCOUNTS PAYABLE (AP) (Clickable -> Accounts Page) */}
        <div
          onClick={() => setActiveTab('accounts')}
          className="bg-white hover:border-rose-400 hover:shadow-md hover:-translate-y-0.5 p-5 rounded-2xl border border-slate-200 shadow-2xs transition-all flex flex-col justify-between h-44 cursor-pointer group"
          title="Click to view Accounts & Payables Page"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/20 group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              ↘ -2.4%
            </span>
          </div>

          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ACCOUNTS PAYABLE (AP)</span>
            <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
              {formatCurrency(displayAP, selectedCurrency)}
            </h3>
          </div>

          <div className="text-[10px] font-bold text-rose-600 group-hover:text-rose-700 uppercase tracking-wider text-left transition-colors flex items-center gap-1 mt-2">
            <span>CLICK TO VIEW DETAILS</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 5: NET PROFIT (Clickable -> Statement) */}
        <div
          onClick={() => setActiveTab('statement')}
          className="bg-white hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 p-5 rounded-2xl border border-slate-200 shadow-2xs transition-all flex flex-col justify-between h-44 cursor-pointer group sm:col-span-2 lg:col-span-1"
          title="Click to view Financial Income Statement"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ↗ +18.1%
            </span>
          </div>

          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">NET PROFIT</span>
            <h3 className={`text-xl font-black mt-1 tracking-tight ${displayNetProfit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(displayNetProfit, selectedCurrency)}
            </h3>
          </div>

          <div className="text-[10px] font-bold text-indigo-600 group-hover:text-indigo-700 uppercase tracking-wider text-left transition-colors flex items-center gap-1 mt-2">
            <span>CLICK TO VIEW DETAILS</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>

      {/* AGENCY DISTRIBUTION (REVENUE SPLIT) Section with Editable Percentage Splits */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">AGENCY DISTRIBUTION (REVENUE SPLIT)</h2>
            <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-0.5">DYNAMIC PERCENTAGE ALLOCATION</p>
          </div>

          {/* Edit Splits Action Button */}
          <button
            onClick={() => setEditSplitsModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider self-start sm:self-auto"
          >
            <SlidersHorizontal className="w-4 h-4" /> Edit Split Percentages
          </button>
        </div>

        {/* 3 Allocation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Business Expenses */}
          <div className="bg-blue-50/50 p-8 rounded-2xl border border-blue-200 text-center space-y-3 shadow-2xs hover:border-blue-400 transition-colors">
            <h1 className="text-5xl font-black text-blue-600 tracking-tight">{busExpPct}%</h1>
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">BUSINESS EXPENSES</span>
            <h4 className="text-lg font-black text-slate-900">
              {formatCurrency(businessExpensesAllocation, selectedCurrency)}
            </h4>
          </div>

          {/* Card 2: Company Reserve */}
          <div className="bg-amber-50/50 p-8 rounded-2xl border border-amber-200 text-center space-y-3 shadow-2xs hover:border-amber-400 transition-colors">
            <h1 className="text-5xl font-black text-amber-600 tracking-tight">{compResPct}%</h1>
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">COMPANY RESERVE</span>
            <h4 className="text-lg font-black text-slate-900">
              {formatCurrency(companyReserveAllocation, selectedCurrency)}
            </h4>
          </div>

          {/* Card 3: Charity Pool Remaining */}
          <div className="bg-pink-50/50 p-8 rounded-2xl border border-pink-200 text-center space-y-3 shadow-2xs hover:border-pink-400 transition-colors">
            <h1 className="text-5xl font-black text-pink-600 tracking-tight">{charityPct}%</h1>
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">CHARITY POOL REMAINING</span>
            <h4 className="text-lg font-black text-slate-900">
              {formatCurrency(charityPoolAllocation, selectedCurrency)}
            </h4>
            <p className="text-[11px] font-semibold text-rose-600">
              (Allocated: {formatCurrency(0, selectedCurrency)})
            </p>
          </div>
        </div>
      </div>

      {/* CHARTS ROW: CASHFLOW PULSE & COST DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Box: CASHFLOW PULSE (Dynamic Bar Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">CASHFLOW PULSE</h2>
            <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
              REAL-TIME TRANSACTION DYNAMICS ({yearFilter})
            </p>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowPulseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => formatCurrency(val, selectedCurrency)}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '10px' }}
                />
                <Bar dataKey="Expense" fill="#e11d48" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Income" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Box: COST DISTRIBUTION (Donut Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">COST DISTRIBUTION</h2>
            <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
              OPERATIONAL BREAKDOWN
            </p>
          </div>

          {/* Donut Chart with Center Text */}
          <div className="relative h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {costDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Net Profit Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">NET PROFIT</span>
              <span className={`text-sm font-black mt-0.5 ${displayNetProfit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(displayNetProfit, selectedCurrency)}
              </span>
            </div>
          </div>

          {/* Bottom Legend Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-bold">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>REVENUE</span>
              </div>
              <span className="text-slate-900 font-black">{formatCurrency(displayIncome, selectedCurrency)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>DISTRIBUTION CUTS ({busExpPct + compResPct + charityPct}%)</span>
              </div>
              <span className="text-amber-600 font-black">-{formatCurrency(totalDistributionDeductions, selectedCurrency)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span>EXPENSES & PAYROLL</span>
              </div>
              <span className="text-slate-900 font-black">{formatCurrency(displayExpenses + displayPayroll, selectedCurrency)}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>NET PROFIT</span>
              </div>
              <span className={`font-black ${displayNetProfit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(displayNetProfit, selectedCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Distribution Percentage Splits Modal */}
      <EditDistributionModal
        isOpen={editSplitsModalOpen}
        onClose={() => setEditSplitsModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
