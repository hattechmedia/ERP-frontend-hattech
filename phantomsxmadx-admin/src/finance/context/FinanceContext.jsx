import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { exchangeRates, currencyPrefixes, formatCurrency } from '../utils/formatters';

const FinanceContext = createContext(null);

// Map income categories to backend Mongoose schema enum:
// ['Project', 'Subscription', 'Service', 'Client', 'Project Sale', 'P2P', 'Other', 'Onetime Service', 'Monthly digital Subscription', 'SAAS Subscription', 'Maintainence Support Payment', 'Milestone Payment']
export const mapToBackendIncomeCategory = (cat) => {
  if (!cat) return 'Onetime Service';
  const c = String(cat).toLowerCase();
  if (c.includes('saas') || c.includes('software licensing')) return 'SAAS Subscription';
  if (c.includes('monthly') || c.includes('retainer') || c.includes('subscription')) return 'Monthly digital Subscription';
  if (c.includes('milestone')) return 'Milestone Payment';
  if (c.includes('maintenance') || c.includes('sla')) return 'Maintainence Support Payment';
  if (c.includes('project sale')) return 'Project Sale';
  if (c.includes('project') || c.includes('development')) return 'Project';
  if (c.includes('service') || c.includes('design') || c.includes('marketing') || c.includes('consulting')) return 'Service';
  if (c.includes('client') || c.includes('receivable') || c.includes('freelance')) return 'Client';
  if (c.includes('p2p') || c.includes('loan') || c.includes('recovery')) return 'P2P';
  if (c.includes('onetime') || c.includes('one-time')) return 'Onetime Service';
  return 'Other';
};

// Map expense categories to backend Mongoose schema enum:
// ['Rent', 'Bill', 'Hardware', 'Software', 'Snacks', 'Travel', 'Marketing', 'Charity', 'Tea', 'Reserve', 'Loan', 'Petty Cash', 'Business Expense', 'Equity Distribution', 'Salary Expense', 'Other']
export const mapToBackendExpenseCategory = (cat) => {
  if (!cat) return 'Other';
  const c = String(cat).toLowerCase();
  if (c.includes('rent') || c.includes('lease')) return 'Rent';
  if (c.includes('utilit') || c.includes('bill') || c.includes('electricity') || c.includes('water') || c.includes('internet')) return 'Bill';
  if (c.includes('hardware') || c.includes('equipment') || c.includes('laptop')) return 'Hardware';
  if (c.includes('software') || c.includes('saas') || c.includes('cloud') || c.includes('hosting') || c.includes('domain') || c.includes('license')) return 'Software';
  if (c.includes('tea') || c.includes('coffee') || c.includes('refreshment')) return 'Tea';
  if (c.includes('snack') || c.includes('stationery') || c.includes('supplies')) return 'Snacks';
  if (c.includes('travel') || c.includes('vehicle') || c.includes('fuel') || c.includes('flight') || c.includes('hotel') || c.includes('logistics') || c.includes('courier')) return 'Travel';
  if (c.includes('marketing') || c.includes('ad') || c.includes('event') || c.includes('commission') || c.includes('sales')) return 'Marketing';
  if (c.includes('charity') || c.includes('csr') || c.includes('zakat') || c.includes('donation')) return 'Charity';
  if (c.includes('reserve')) return 'Reserve';
  if (c.includes('loan') || c.includes('debt')) return 'Loan';
  if (c.includes('petty')) return 'Petty Cash';
  if (c.includes('salar') || c.includes('payroll') || c.includes('bonus') || c.includes('freelancer') || c.includes('training')) return 'Salary Expense';
  if (c.includes('equity') || c.includes('distribution') || c.includes('dividend')) return 'Equity Distribution';
  if (c.includes('tax') || c.includes('legal') || c.includes('audit') || c.includes('fee') || c.includes('operational')) return 'Business Expense';
  return 'Other';
};

export const FinanceProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Global Currency Selection (EUR default, supports USD, EUR, GBP, CHF)
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');

  // Backend sync status
  const [backendLoading, setBackendLoading] = useState(false);

  // Active View State ('dashboard', 'cashflow', 'payroll', 'accounts', 'statement', 'profile')
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\/finance\/?/, '').split('/')[0];
      const validTabs = ['dashboard', 'cashflow', 'payroll', 'accounts', 'statement', 'profile'];
      if (path && validTabs.includes(path)) return path;
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && validTabs.includes(hash)) return hash;
      const saved = localStorage.getItem('hattech_active_tab');
      if (saved && validTabs.includes(saved)) return saved;
    }
    return 'dashboard';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hattech_active_tab', tab);
      const targetPath = tab === 'dashboard' ? '/finance' : `/finance/${tab}`;
      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    }
  };

  useEffect(() => {
    const path = location.pathname.replace(/^\/finance\/?/, '').split('/')[0];
    const validTabs = ['dashboard', 'cashflow', 'payroll', 'accounts', 'statement', 'profile'];
    if (path && validTabs.includes(path)) {
      setActiveTabState(path);
    } else if (location.pathname === '/finance' || location.pathname === '/finance/') {
      setActiveTabState('dashboard');
    }
  }, [location.pathname]);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      const sessionUser = sessionStorage.getItem('currentUser');
      const sessionToken = sessionStorage.getItem('token');
      if (sessionUser || sessionToken) return true;
      const saved = localStorage.getItem('hattech_auth_session');
      return saved === 'active';
    }
    return false;
  });

  // User Profile
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const sessionUserStr = sessionStorage.getItem('currentUser');
      if (sessionUserStr) {
        try {
          const u = JSON.parse(sessionUserStr);
          return {
            name: u.name || 'Finance Manager',
            email: u.email || 'finance@hattech.com',
            role: u.designation || u.role || 'Head of Finance & Operations',
            phone: u.phone || '+92 300 1234567',
            avatar: u.name ? u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'FM',
            department: u.department || 'Finance Department',
          };
        } catch (e) {
          // ignore
        }
      }
      const saved = localStorage.getItem('hattech_admin_profile');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return {
      name: 'Finance Manager',
      email: 'finance@hattech.com',
      role: 'Head of Finance & Operations',
      phone: '+92 300 1234567',
      avatar: 'FM',
      department: 'Finance Department',
    };
  });

  // Admin Credentials
  const [adminCredentials, setAdminCredentials] = useState(() => {
    const saved = localStorage.getItem('hattech_admin_credentials');
    return saved
      ? JSON.parse(saved)
      : {
          email: 'finance@hattech.com',
          password: 'admin',
        };
  });

  // Agency Revenue Distribution Splits (%)
  const [distributionSplits, setDistributionSplits] = useState(() => {
    const saved = localStorage.getItem('hattech_distribution_splits');
    return saved
      ? JSON.parse(saved)
      : {
          businessExpenses: 35,
          companyReserve: 15,
          charityPool: 4,
        };
  });

  const updateDistributionSplits = (newSplits) => {
    const updated = {
      businessExpenses: Number(newSplits.businessExpenses || 0),
      companyReserve: Number(newSplits.companyReserve || 0),
      charityPool: Number(newSplits.charityPool || 0),
    };
    setDistributionSplits(updated);
    localStorage.setItem('hattech_distribution_splits', JSON.stringify(updated));
    showToast('Distribution percentage splits updated successfully!', 'success');
  };

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Actions
  const login = (inputEmail, inputPassword) => {
    const cleanInputEmail = inputEmail.trim().toLowerCase();
    const cleanInputPass = inputPassword.trim();
    const cleanAdminEmail = (adminCredentials?.email || 'admin@hattech.com').trim().toLowerCase();
    const cleanAdminPass = (adminCredentials?.password || 'admin123').trim();

    const matchesActive = cleanInputEmail === cleanAdminEmail && cleanInputPass === cleanAdminPass;
    const matchesDefault = (cleanInputEmail === 'admin@hattech.com' || cleanInputEmail === 'finance@hattech.com') && (cleanInputPass === 'admin123' || cleanInputPass === 'admin');

    if (matchesActive || matchesDefault) {
      setIsAuthenticated(true);
      localStorage.setItem('hattech_auth_session', 'active');
      showToast(`Welcome back, ${currentUser.name || 'Finance User'}!`, 'success');
      return true;
    } else {
      showToast('Invalid email address or password. Access Denied.', 'error');
      return false;
    }
  };

  const logout = () => {
    sessionStorage.clear();
    localStorage.setItem('hattech_auth_session', 'logged_out');
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  };

  const updateAdminProfile = (newProfile) => {
    const updatedUser = {
      ...currentUser,
      ...newProfile,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('hattech_admin_profile', JSON.stringify(updatedUser));

    if (newProfile.email) {
      const updatedCreds = { ...adminCredentials, email: newProfile.email.trim().toLowerCase() };
      setAdminCredentials(updatedCreds);
      localStorage.setItem('hattech_admin_credentials', JSON.stringify(updatedCreds));
    }
    showToast('Profile updated successfully!', 'success');
  };

  const changeAdminPassword = (currentPass, newPass) => {
    if (currentPass !== adminCredentials.password) {
      showToast('Current password does not match existing record.', 'error');
      return false;
    }

    const updatedCreds = { ...adminCredentials, password: newPass };
    setAdminCredentials(updatedCreds);
    localStorage.setItem('hattech_admin_credentials', JSON.stringify(updatedCreds));
    showToast('Password changed successfully!', 'success');
    return true;
  };

  // Datasets
  const [incomeList, setIncomeList] = useState(() => {
    const saved = localStorage.getItem('hattech_income_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenseList, setExpenseList] = useState(() => {
    const saved = localStorage.getItem('hattech_expense_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [payrollList, setPayrollList] = useState(() => {
    const saved = localStorage.getItem('hattech_payroll_list');
    return saved ? JSON.parse(saved) : [];
  });

  const defaultPettyCashAccount = {
    id: 'ACC-PETTY',
    bankName: 'Petty Cash Drawer',
    accountTitle: 'Office Daily Cash Box',
    accountNumber: 'CASH-DRAWER-01',
    balance: 0,
    status: 'Active',
    isPettyCash: true,
  };

  const [accountsList, setAccountsList] = useState(() => {
    const saved = localStorage.getItem('hattech_accounts_list');
    let list = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (e) {
        list = [];
      }
    }
    const hasPetty = list.some((a) => a.id === 'ACC-PETTY' || a.isPettyCash);
    if (!hasPetty) {
      return [defaultPettyCashAccount, ...list];
    }
    return list;
  });

  useEffect(() => {
    if (!accountsList.some((a) => a.id === 'ACC-PETTY' || a.isPettyCash)) {
      setAccountsList((prev) => [defaultPettyCashAccount, ...prev]);
    }
  }, [accountsList]);

  // Persistent Accounts Receivable (AR) & Accounts Payable (AP) Lists
  const [arList, setArList] = useState(() => {
    const saved = localStorage.getItem('hattech_ar_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [apList, setApList] = useState(() => {
    const saved = localStorage.getItem('hattech_ap_list');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hattech_income_list', JSON.stringify(incomeList));
  }, [incomeList]);

  useEffect(() => {
    localStorage.setItem('hattech_expense_list', JSON.stringify(expenseList));
  }, [expenseList]);

  useEffect(() => {
    localStorage.setItem('hattech_payroll_list', JSON.stringify(payrollList));
  }, [payrollList]);

  useEffect(() => {
    localStorage.setItem('hattech_accounts_list', JSON.stringify(accountsList));
  }, [accountsList]);

  useEffect(() => {
    localStorage.setItem('hattech_ar_list', JSON.stringify(arList));
  }, [arList]);

  useEffect(() => {
    localStorage.setItem('hattech_ap_list', JSON.stringify(apList));
  }, [apList]);

  // Convert input amount to EUR
  const convertToBaseEUR = (amountInCurrency, currencyCode = selectedCurrency) => {
    const rate = exchangeRates[currencyCode] || 1.0;
    return Number(amountInCurrency) / rate;
  };

  // --- LIVE BACKEND DATA FETCHING ---
  const fetchBackendData = useCallback(async () => {
    setBackendLoading(true);
    try {
      const [incRes, expRes, empRes] = await Promise.allSettled([
        api.get('/finance/income'),
        api.get('/finance/expense'),
        api.get('/employees'),
      ]);

      // 1. Process Income from Backend
      if (incRes.status === 'fulfilled' && incRes.value?.data?.success) {
        const liveIncomes = incRes.value.data.data || [];
        const formattedIncomes = liveIncomes.map((inc) => ({
          id: inc._id,
          _id: inc._id,
          date: inc.date ? inc.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
          amount: Number(inc.amount || 0),
          source: inc.source || inc.payerName || 'Direct Client',
          clearingEntity: inc.payerName || inc.source || 'Direct Client',
          category: inc.category || 'Onetime Service',
          projectPayment: inc.description || inc.category || 'Revenue',
          clientName: inc.payerName || inc.source || '',
          clientEmail: inc.clientEmail || '',
          paymentMethod: inc.paymentMethod || 'Transfer',
          status: inc.status || 'Received',
          notes: inc.description || '',
        }));

        const receivedIncomes = formattedIncomes.filter((i) => i.status !== 'Pending');
        const pendingIncomes = formattedIncomes.filter((i) => i.status === 'Pending').map((i) => ({
          ...i,
          invoiceNo: i.notes?.startsWith('INV-') ? i.notes.split(' ')[0] : `INV-${i.id.slice(-4)}`,
        }));

        setIncomeList(receivedIncomes);
        setArList(pendingIncomes);
      }

      // 2. Process Expenses from Backend
      if (expRes.status === 'fulfilled' && expRes.value?.data?.success) {
        const liveExpenses = expRes.value.data.data || [];
        const formattedExpenses = liveExpenses.map((exp) => ({
          id: exp._id,
          _id: exp._id,
          date: exp.date ? exp.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
          amount: Number(exp.amount || 0),
          vendor: exp.recipient || exp.item || 'General Vendor',
          category: exp.category || 'Other',
          notes: exp.description || exp.item || '',
          item: exp.item || 'Operational Expense',
          status: exp.status || 'Paid',
          paidAmount: Number(exp.paidAmount || 0),
          paymentMethod: exp.paymentMethod || 'Cash',
          isLoan: exp.category === 'Loan',
          debtorName: exp.debtorName || '',
        }));

        const paidExpenses = formattedExpenses.filter((e) => e.status !== 'Unpaid');
        const unpaidExpenses = formattedExpenses.filter((e) => e.status === 'Unpaid').map((e) => ({
          ...e,
          vendorName: e.vendor,
          reason: e.notes || e.item,
          billNo: e.notes?.startsWith('BILL-') ? e.notes.split(' ')[0] : `BILL-${e.id.slice(-4)}`,
        }));

        setExpenseList(paidExpenses);
        setApList(unpaidExpenses);
      }

      // 3. Process Employees for Staff Payroll List
      if (empRes.status === 'fulfilled') {
        const allEmps = empRes.value.data?.employees || empRes.value.data?.data || [];
        const cleanEmps = allEmps.filter((e) => {
          const role = (e.role || e.userId?.role || '').toLowerCase();
          const dept = (e.department || '').toLowerCase();
          return role !== 'it_support' && !dept.includes('it support') && !dept.includes('it-support') && e.status !== 'inactive';
        });

        const formattedStaff = cleanEmps.map((emp) => ({
          id: emp._id,
          _id: emp._id,
          name: emp.name?.replace(/ User$/i, '') || 'Employee',
          role: emp.position || emp.designation || 'Staff',
          department: emp.department || 'Operations',
          basicSalary: Number(emp.salary || 0),
          bankName: emp.bankDetails?.bankName || 'Not Set',
          accountNumber: emp.bankDetails?.accountNumber || 'Not Set',
          accountHolder: emp.bankDetails?.accountHolder || emp.name || '',
          status: 'Active',
          date: new Date().toISOString().slice(0, 10),
        }));

        if (formattedStaff.length > 0) {
          setPayrollList(formattedStaff);
        }
      }
    } catch (err) {
      console.error('Failed to sync backend finance data:', err);
    } finally {
      setBackendLoading(false);
    }
  }, []);

  // Fetch live backend data on initial load
  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  // Base Auto Calculations (in EUR)
  const totalIncome = incomeList.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  const totalPayroll = payrollList.reduce((acc, p) => acc + Number(p.basicSalary || 0), 0);
  const totalExpenses = expenseList.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const totalAR = arList.filter((a) => a.status !== 'Collected').reduce((acc, a) => acc + Number(a.amount || 0), 0);
  const totalAP = apList.filter((a) => a.status !== 'Paid').reduce((acc, a) => acc + Number(a.amount || 0), 0);

  // Agency Revenue Distribution Splits (in EUR)
  const businessExpensesAllocation = totalIncome * (distributionSplits.businessExpenses / 100);
  const companyReserveAllocation = totalIncome * (distributionSplits.companyReserve / 100);
  const charityPoolAllocation = totalIncome * (distributionSplits.charityPool / 100);
  const totalDistributionDeductions = businessExpensesAllocation + companyReserveAllocation + charityPoolAllocation;
  const netIncomeAfterDistributions = totalIncome - totalDistributionDeductions;
  const netProfit = totalIncome - totalDistributionDeductions - totalPayroll - totalExpenses;

  // --- CRUD: INCOME (Connected to Backend) ---
  const addIncome = async (incomeData) => {
    const inputCurrency = incomeData.currency || selectedCurrency;
    const amountInEUR = convertToBaseEUR(incomeData.amount, inputCurrency);
    const id = `INC-${Date.now().toString().slice(-4)}`;

    const backendPayload = {
      source: incomeData.clearingEntity || incomeData.clientName || incomeData.source || 'Direct Client',
      amount: amountInEUR,
      date: incomeData.settlementDate || incomeData.date || new Date().toISOString(),
      category: mapToBackendIncomeCategory(incomeData.projectPayment || incomeData.category),
      payerName: incomeData.clearingEntity || incomeData.clientName || '',
      paymentMethod: incomeData.paymentMethod || 'Transfer',
      status: incomeData.status || 'Received',
      description: incomeData.notes || incomeData.projectPayment || '',
      clientEmail: incomeData.clientEmail || '',
    };

    try {
      const res = await api.post('/finance/income', backendPayload);
      const savedItem = res.data.data;
      const newInc = {
        id: savedItem._id || id,
        _id: savedItem._id || id,
        date: savedItem.date ? savedItem.date.slice(0, 10) : backendPayload.date.slice(0, 10),
        amount: amountInEUR,
        source: backendPayload.source,
        clearingEntity: backendPayload.payerName || backendPayload.source,
        category: backendPayload.category,
        projectPayment: backendPayload.description || backendPayload.category,
        clientName: backendPayload.payerName,
        clientEmail: backendPayload.clientEmail,
        status: backendPayload.status,
        notes: backendPayload.description,
      };

      setIncomeList((prev) => [newInc, ...prev]);

      if (incomeData.bankAccountId) {
        setAccountsList((prev) =>
          prev.map((acc) =>
            acc.id === incomeData.bankAccountId
              ? { ...acc, balance: acc.balance + amountInEUR }
              : acc
          )
        );
      }

      const currencyPrefix = currencyPrefixes[inputCurrency] || '€';
      showToast(`Recorded Income: ${backendPayload.source} (${currencyPrefix}${incomeData.amount})`, 'success');
      return newInc;
    } catch (err) {
      console.warn('Backend income post failed, saving locally:', err.message);
      const localInc = {
        id,
        date: backendPayload.date.slice(0, 10),
        ...incomeData,
        amount: amountInEUR,
        source: backendPayload.source,
        category: backendPayload.category,
      };
      setIncomeList((prev) => [localInc, ...prev]);
      showToast(`Income saved locally: ${backendPayload.source}`, 'info');
      return localInc;
    }
  };

  const updateIncome = async (id, updatedData) => {
    const inputCurrency = updatedData.currency || selectedCurrency;
    const amountInEUR = convertToBaseEUR(updatedData.amount, inputCurrency);

    const backendPayload = {
      source: updatedData.clearingEntity || updatedData.source || 'Direct Client',
      amount: amountInEUR,
      date: updatedData.settlementDate || updatedData.date || new Date().toISOString(),
      category: mapToBackendIncomeCategory(updatedData.projectPayment || updatedData.category),
      payerName: updatedData.clearingEntity || updatedData.clientName || '',
      description: updatedData.notes || updatedData.projectPayment || '',
      clientEmail: updatedData.clientEmail || '',
      status: updatedData.status || 'Received',
    };

    try {
      if (id && !id.startsWith('INC-')) {
        await api.put(`/finance/income/${id}`, backendPayload);
      }
    } catch (err) {
      console.warn('Backend income update error:', err.message);
    }

    setIncomeList((prev) =>
      prev.map((item) =>
        item.id === id || item._id === id
          ? {
              ...item,
              ...updatedData,
              amount: amountInEUR,
              source: backendPayload.source,
              clearingEntity: backendPayload.payerName || backendPayload.source,
              category: backendPayload.category,
              date: backendPayload.date.slice(0, 10),
            }
          : item
      )
    );
    showToast('Income entry updated successfully!', 'info');
  };

  const deleteIncome = async (id) => {
    try {
      if (id && !id.startsWith('INC-')) {
        await api.delete(`/finance/income/${id}`);
      }
    } catch (err) {
      console.warn('Backend income delete error:', err.message);
    }
    setIncomeList((prev) => prev.filter((i) => i.id !== id && i._id !== id));
    showToast('Income transaction deleted!', 'error');
  };

  // --- CRUD: EXPENSES (Connected to Backend) ---
  const addExpense = async (expenseData) => {
    const inputCurrency = expenseData.currency || selectedCurrency;
    const amountInEUR = convertToBaseEUR(expenseData.amount, inputCurrency);
    const id = `EXP-${Date.now().toString().slice(-4)}`;

    const backendPayload = {
      item: expenseData.expenseReason || expenseData.notes || expenseData.vendor || 'Operational Expense',
      amount: amountInEUR,
      date: expenseData.paymentDate || expenseData.settlementDate || expenseData.date || new Date().toISOString(),
      category: mapToBackendExpenseCategory(expenseData.expenseCategory || expenseData.category),
      paymentMethod: expenseData.paymentMethod || 'Cash',
      status: expenseData.status || 'Paid',
      paidAmount: (expenseData.status || 'Paid') === 'Paid' ? amountInEUR : 0,
      recipient: expenseData.vendor || '',
      description: expenseData.notes || expenseData.expenseReason || '',
    };

    try {
      const res = await api.post('/finance/expense', backendPayload);
      const savedItem = res.data.data;
      const newExp = {
        id: savedItem._id || id,
        _id: savedItem._id || id,
        date: savedItem.date ? savedItem.date.slice(0, 10) : backendPayload.date.slice(0, 10),
        amount: amountInEUR,
        vendor: backendPayload.recipient || backendPayload.item,
        category: backendPayload.category,
        notes: backendPayload.description || backendPayload.item,
        status: backendPayload.status,
        paidAmount: backendPayload.paidAmount,
      };

      setExpenseList((prev) => [newExp, ...prev]);

      if (expenseData.bankAccountId) {
        setAccountsList((prev) =>
          prev.map((acc) =>
            acc.id === expenseData.bankAccountId
              ? { ...acc, balance: Math.max(0, acc.balance - amountInEUR) }
              : acc
          )
        );
      }

      const currencyPrefix = currencyPrefixes[inputCurrency] || '€';
      showToast(`Recorded Expense: ${backendPayload.category} (${currencyPrefix}${expenseData.amount})`, 'success');
      return newExp;
    } catch (err) {
      console.warn('Backend expense post failed, saving locally:', err.message);
      const localExp = {
        id,
        date: backendPayload.date.slice(0, 10),
        ...expenseData,
        amount: amountInEUR,
        vendor: backendPayload.recipient || 'General Vendor',
      };
      setExpenseList((prev) => [localExp, ...prev]);
      showToast(`Expense saved locally: ${backendPayload.item}`, 'info');
      return localExp;
    }
  };

  const updateExpense = async (id, updatedData) => {
    const inputCurrency = updatedData.currency || selectedCurrency;
    const amountInEUR = convertToBaseEUR(updatedData.amount, inputCurrency);

    const backendPayload = {
      item: updatedData.expenseReason || updatedData.notes || updatedData.vendor || 'Operational Expense',
      amount: amountInEUR,
      date: updatedData.paymentDate || updatedData.settlementDate || updatedData.date || new Date().toISOString(),
      category: mapToBackendExpenseCategory(updatedData.expenseCategory || updatedData.category),
      recipient: updatedData.vendor || '',
      description: updatedData.notes || updatedData.expenseReason || '',
      status: updatedData.status || 'Paid',
    };

    try {
      if (id && !id.startsWith('EXP-')) {
        await api.put(`/finance/expense/${id}`, backendPayload);
      }
    } catch (err) {
      console.warn('Backend expense update error:', err.message);
    }

    setExpenseList((prev) =>
      prev.map((item) =>
        item.id === id || item._id === id
          ? {
              ...item,
              ...updatedData,
              amount: amountInEUR,
              date: backendPayload.date.slice(0, 10),
              vendor: backendPayload.recipient || item.vendor,
              category: backendPayload.category,
            }
          : item
      )
    );
    showToast('Expense entry updated successfully!', 'info');
  };

  const deleteExpense = async (id) => {
    try {
      if (id && !id.startsWith('EXP-')) {
        await api.delete(`/finance/expense/${id}`);
      }
    } catch (err) {
      console.warn('Backend expense delete error:', err.message);
    }
    setExpenseList((prev) => prev.filter((e) => e.id !== id && e._id !== id));
    showToast('Expense transaction deleted!', 'error');
  };

  // --- CRUD: PAYROLL (Staff Employee records) ---
  const addPayroll = async (payrollData) => {
    const id = `EMP-${Date.now().toString().slice(-4)}`;
    const inputCurrency = payrollData.currency || selectedCurrency;
    const salaryInEUR = convertToBaseEUR(payrollData.basicSalary, inputCurrency);

    const newPay = {
      id,
      date: payrollData.date || new Date().toISOString().slice(0, 10),
      status: 'Paid',
      ...payrollData,
      basicSalary: salaryInEUR,
    };
    setPayrollList((prev) => [newPay, ...prev]);
    showToast(`Staff member ${payrollData.name} added to roster!`, 'success');
  };

  const updatePayroll = async (id, updatedData) => {
    const inputCurrency = updatedData.currency || selectedCurrency;
    const salaryInEUR = convertToBaseEUR(updatedData.basicSalary, inputCurrency);

    // If it's a real employee mongo ID, update backend employee
    if (id && id.length === 24) {
      try {
        await api.put(`/employees/${id}`, {
          salary: salaryInEUR,
          bankDetails: {
            bankName: updatedData.bankName || '',
            accountNumber: updatedData.accountNumber || '',
            accountHolder: updatedData.accountHolder || updatedData.name || '',
          },
        });
      } catch (err) {
        console.warn('Failed to sync employee salary update to backend:', err.message);
      }
    }

    setPayrollList((prev) =>
      prev.map((item) =>
        item.id === id || item._id === id
          ? {
              ...item,
              ...updatedData,
              basicSalary: salaryInEUR,
            }
          : item
      )
    );
    showToast(`Employee settings updated successfully!`, 'info');
  };

  const deletePayroll = (id) => {
    setPayrollList((prev) => prev.filter((p) => p.id !== id && p._id !== id));
    showToast(`Employee removed from roster!`, 'error');
  };

  // --- CRUD: BANK ACCOUNTS ---
  const addAccount = (accountData) => {
    const id = `ACC-${Date.now().toString().slice(-4)}`;
    const inputCurrency = accountData.currency || selectedCurrency;
    const balanceInEUR = convertToBaseEUR(accountData.balance || 0, inputCurrency);

    const newAcc = {
      id,
      status: 'Active',
      ...accountData,
      balance: balanceInEUR,
    };
    setAccountsList((prev) => [...prev, newAcc]);
    showToast(`Account ${accountData.bankName} added successfully!`, 'success');
  };

  const updateAccount = (id, updatedData) => {
    const inputCurrency = updatedData.currency || selectedCurrency;
    const balanceInEUR = convertToBaseEUR(updatedData.balance || 0, inputCurrency);

    setAccountsList((prev) =>
      prev.map((acc) =>
        acc.id === id
          ? {
              ...acc,
              ...updatedData,
              balance: balanceInEUR,
            }
          : acc
      )
    );
    showToast('Bank account updated successfully!', 'info');
  };

  const deleteAccount = (id) => {
    setAccountsList((prev) => prev.filter((acc) => acc.id !== id));
    showToast('Bank account deleted successfully!', 'error');
  };

  const transferFunds = (fromAccountId, toAccountId, amount) => {
    const amountVal = Number(amount);
    if (!amountVal || amountVal <= 0) return false;

    const fromAcc = accountsList.find((a) => a.id === fromAccountId);
    const toAcc = accountsList.find((a) => a.id === toAccountId);

    if (!fromAcc || fromAcc.balance < amountVal) {
      showToast(`Insufficient balance in ${fromAcc?.bankName || 'source account'}!`, 'error');
      return false;
    }

    setAccountsList((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccountId) {
          return { ...acc, balance: Math.max(0, acc.balance - amountVal) };
        }
        if (acc.id === toAccountId) {
          return { ...acc, balance: acc.balance + amountVal };
        }
        return acc;
      })
    );

    const fromName = fromAcc?.bankName || 'Bank Account';
    const toName = toAcc?.bankName || 'Petty Cash Drawer';

    showToast(
      `Successfully transferred ${formatCurrency(amountVal, selectedCurrency)} from ${fromName} to ${toName}!`,
      'success'
    );
    return true;
  };

  // --- CRUD: ACCOUNTS RECEIVABLE (AR) ---
  const addAR = async (arData) => {
    const inputCurrency = arData.currency || selectedCurrency;
    const amountInEUR = convertToBaseEUR(arData.amount, inputCurrency);
    const id = `AR-${Date.now().toString().slice(-4)}`;

    const backendPayload = {
      source: arData.clientName || 'Client Invoice',
      amount: amountInEUR,
      date: arData.date || new Date().toISOString(),
      category: 'Client',
      status: arData.status || 'Pending',
      payerName: arData.clientName || '',
      description: `${arData.invoiceNo || 'INV'} - ${arData.notes || ''}`.trim(),
    };

    try {
      const res = await api.post('/finance/income', backendPayload);
      const saved = res.data.data;
      const newAr = {
        id: saved._id || id,
        _id: saved._id || id,
        date: saved.date ? saved.date.slice(0, 10) : arData.date,
        dueDate: arData.dueDate || new Date().toISOString().slice(0, 10),
        status: arData.status || 'Pending',
        clientName: arData.clientName,
        invoiceNo: arData.invoiceNo || `INV-${(saved._id || id).slice(-4)}`,
        notes: arData.notes,
        amount: amountInEUR,
        originalAmount: arData.amount,
        currency: inputCurrency,
      };

      setArList((prev) => [newAr, ...prev]);

      if (newAr.status === 'Collected') {
        setIncomeList((prev) => [{ ...newAr, source: newAr.clientName, clearingEntity: newAr.clientName }, ...prev]);
        showToast(`AR ${newAr.invoiceNo} marked as collected & added to income!`, 'success');
      } else {
        showToast(`Accounts Receivable recorded for ${arData.clientName}!`, 'success');
      }
    } catch (err) {
      console.warn('Backend AR creation failed, saving locally:', err.message);
      const localAr = {
        id,
        date: arData.date || new Date().toISOString().slice(0, 10),
        dueDate: arData.dueDate || new Date().toISOString().slice(0, 10),
        status: arData.status || 'Pending',
        ...arData,
        amount: amountInEUR,
        originalAmount: arData.amount,
      };
      setArList((prev) => [localAr, ...prev]);
      showToast(`Accounts Receivable saved locally for ${arData.clientName}!`, 'info');
    }
  };

  const updateAR = async (id, updatedData) => {
    const inputCurrency = updatedData.currency || selectedCurrency;
    const rawNum = updatedData.originalAmount !== undefined ? updatedData.originalAmount : updatedData.amount;
    const amountInEUR = convertToBaseEUR(rawNum, inputCurrency);
    const origAmountVal = rawNum;
    const newStatus = updatedData.status;

    try {
      if (id && !id.startsWith('AR-')) {
        await api.put(`/finance/income/${id}`, {
          status: newStatus === 'Collected' ? 'Received' : 'Pending',
          amount: amountInEUR,
          source: updatedData.clientName,
          payerName: updatedData.clientName,
        });
      }
    } catch (err) {
      console.warn('Backend AR update failed:', err.message);
    }

    setArList((prev) =>
      prev.map((item) =>
        item.id === id || item._id === id
          ? {
              ...item,
              ...updatedData,
              amount: amountInEUR,
              originalAmount: origAmountVal,
            }
          : item
      )
    );

    if (newStatus === 'Collected') {
      showToast(`AR marked as collected! Reflected in Income & Net Profit.`, 'success');
    } else {
      showToast(`Accounts Receivable updated!`, 'info');
    }
  };

  const deleteAR = async (id) => {
    try {
      if (id && !id.startsWith('AR-')) {
        await api.delete(`/finance/income/${id}`);
      }
    } catch (err) {
      console.warn('Backend AR delete failed:', err.message);
    }
    setArList((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    setIncomeList((prev) => prev.filter((inc) => inc.id !== id && inc._id !== id));
    showToast(`Accounts Receivable deleted!`, 'error');
  };

  // --- CRUD: ACCOUNTS PAYABLE (AP) ---
  const addAP = async (apData) => {
    const inputCurrency = apData.currency || selectedCurrency;
    const amountInEUR = convertToBaseEUR(apData.amount, inputCurrency);
    const id = `AP-${Date.now().toString().slice(-4)}`;

    const backendPayload = {
      item: apData.vendorName || apData.reason || 'Payable Debt',
      amount: amountInEUR,
      date: apData.date || new Date().toISOString(),
      category: mapToBackendExpenseCategory(apData.reason),
      status: apData.status || 'Unpaid',
      recipient: apData.vendorName || '',
      description: `${apData.billNo || 'BILL'} - ${apData.notes || ''}`.trim(),
    };

    try {
      const res = await api.post('/finance/expense', backendPayload);
      const saved = res.data.data;
      const newAp = {
        id: saved._id || id,
        _id: saved._id || id,
        date: saved.date ? saved.date.slice(0, 10) : apData.date,
        dueDate: apData.dueDate || new Date().toISOString().slice(0, 10),
        status: apData.status || 'Unpaid',
        vendorName: apData.vendorName,
        reason: apData.reason,
        billNo: apData.billNo || `BILL-${(saved._id || id).slice(-4)}`,
        notes: apData.notes,
        amount: amountInEUR,
        originalAmount: apData.amount,
        currency: inputCurrency,
      };

      setApList((prev) => [newAp, ...prev]);

      if (newAp.status === 'Paid') {
        setExpenseList((prev) => [{ ...newAp, vendor: newAp.vendorName }, ...prev]);
        showToast(`AP ${newAp.billNo} marked as paid & added to expenses!`, 'success');
      } else {
        showToast(`Accounts Payable recorded for ${apData.vendorName}!`, 'success');
      }
    } catch (err) {
      console.warn('Backend AP creation failed, saving locally:', err.message);
      const localAp = {
        id,
        date: apData.date || new Date().toISOString().slice(0, 10),
        dueDate: apData.dueDate || new Date().toISOString().slice(0, 10),
        status: apData.status || 'Unpaid',
        ...apData,
        amount: amountInEUR,
        originalAmount: apData.amount,
      };
      setApList((prev) => [localAp, ...prev]);
      showToast(`Accounts Payable saved locally for ${apData.vendorName}!`, 'info');
    }
  };

  const updateAP = async (id, updatedData) => {
    const inputCurrency = updatedData.currency || selectedCurrency;
    const rawNum = updatedData.originalAmount !== undefined ? updatedData.originalAmount : updatedData.amount;
    const amountInEUR = convertToBaseEUR(rawNum, inputCurrency);
    const origAmountVal = rawNum;
    const newStatus = updatedData.status;

    try {
      if (id && !id.startsWith('AP-')) {
        await api.put(`/finance/expense/${id}`, {
          status: newStatus === 'Paid' ? 'Paid' : 'Unpaid',
          paidAmount: newStatus === 'Paid' ? amountInEUR : 0,
          amount: amountInEUR,
          item: updatedData.vendorName || updatedData.reason,
          recipient: updatedData.vendorName,
        });
      }
    } catch (err) {
      console.warn('Backend AP update failed:', err.message);
    }

    setApList((prev) =>
      prev.map((item) =>
        item.id === id || item._id === id
          ? {
              ...item,
              ...updatedData,
              amount: amountInEUR,
              originalAmount: origAmountVal,
            }
          : item
      )
    );

    if (newStatus === 'Paid') {
      showToast(`AP bill marked as paid! Deducted from Net Profit.`, 'success');
    } else {
      showToast(`Accounts Payable updated!`, 'info');
    }
  };

  const deleteAP = async (id) => {
    try {
      if (id && !id.startsWith('AP-')) {
        await api.delete(`/finance/expense/${id}`);
      }
    } catch (err) {
      console.warn('Backend AP delete failed:', err.message);
    }
    setApList((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    setExpenseList((prev) => prev.filter((exp) => exp.id !== id && exp._id !== id));
    showToast(`Accounts Payable deleted!`, 'error');
  };

  const resetAllDataToZero = () => {
    setIncomeList([]);
    setExpenseList([]);
    setPayrollList([]);
    setAccountsList([defaultPettyCashAccount]);
    setArList([]);
    setApList([]);
    localStorage.removeItem('hattech_income_list');
    localStorage.removeItem('hattech_expense_list');
    localStorage.removeItem('hattech_payroll_list');
    localStorage.removeItem('hattech_accounts_list');
    localStorage.removeItem('hattech_ar_list');
    localStorage.removeItem('hattech_ap_list');
    localStorage.removeItem('hattech_payroll_history');
    showToast('All local cache cleared! Synced with live backend.', 'info');
    fetchBackendData();
  };

  return (
    <FinanceContext.Provider
      value={{
        selectedCurrency,
        setSelectedCurrency,
        activeTab,
        setActiveTab,
        isAuthenticated,
        currentUser,
        adminCredentials,
        distributionSplits,
        updateDistributionSplits,
        login,
        logout,
        updateAdminProfile,
        changeAdminPassword,
        resetAllDataToZero,
        toasts,
        showToast,
        removeToast,
        incomeList,
        expenseList,
        payrollList,
        accountsList,
        arList,
        apList,
        backendLoading,
        fetchBackendData,
        metrics: {
          totalIncome,
          totalPayroll,
          totalExpenses,
          totalAR,
          totalAP,
          netProfit,
          businessExpensesAllocation,
          companyReserveAllocation,
          charityPoolAllocation,
          totalDistributionDeductions,
          netIncomeAfterDistributions,
        },
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        addPayroll,
        updatePayroll,
        deletePayroll,
        addAccount,
        updateAccount,
        deleteAccount,
        transferFunds,
        addAR,
        updateAR,
        deleteAR,
        addAP,
        updateAP,
        deleteAP,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
