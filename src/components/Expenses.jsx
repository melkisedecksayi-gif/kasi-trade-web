import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import Toast from './Toast';
import CI from './ColoredIcons';
import { SkeletonList } from './Skeleton';

const EXPENSE_CATEGORIES = {
  rent: {
    label: { sw: 'Kodi', en: 'Rent' },
    color: '#ef4444',
    bg: '#fee2e2'
  },
  utilities: {
    label: { sw: 'Huduma', en: 'Utilities' },
    color: '#3b82f6',
    bg: '#dbeafe'
  },
  salaries: {
    label: { sw: 'Mishahara', en: 'Salaries' },
    color: '#8b5cf6',
    bg: '#ede9fe'
  },
  stock_purchase: {
    label: { sw: 'Ununuzi wa Bidhaa', en: 'Stock Purchase' },
    color: '#10b981',
    bg: '#d1fae5'
  },
  transport: {
    label: { sw: 'Usafiri', en: 'Transport' },
    color: '#f59e0b',
    bg: '#fef3c7'
  },
  marketing: {
    label: { sw: 'Masoko', en: 'Marketing' },
    color: '#ec4899',
    bg: '#fce7f3'
  },
  maintenance: {
    label: { sw: 'Matengenezo', en: 'Maintenance' },
    color: '#06b6d4',
    bg: '#cffafe'
  },
  other: {
    label: { sw: 'Mengineyo', en: 'Other' },
    color: '#64748b',
    bg: '#f1f5f9'
  }
};

const Expenses = ({ lang, supabase, currentShop, isDarkMode, theme }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const localTheme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#475569',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    hoverBg: isDarkMode ? '#334155' : '#f1f5f9'
  };
  const th = theme || localTheme;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (currentShop?.id) {
      fetchExpenses();
    }
  }, [currentShop, supabase]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('expense_date', { ascending: false });

      if (!error && data) {
        setExpenses(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: '',
      expense_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingExpense(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description || '',
      amount: expense.amount?.toString() || '',
      category: expense.category || '',
      expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.category) {
      showToast(lang === 'sw' ? 'Tafadhali jaza taarifa zote muhimu' : 'Please fill all required fields', 'error');
      return;
    }

    const expenseData = {
      shop_id: currentShop.id,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      expense_date: formData.expense_date,
      notes: formData.notes
    };

    try {
      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        setExpenses(expenses.map(e => e.id === editingExpense.id ? { ...e, ...expenseData } : e));
        showToast(lang === 'sw' ? 'Gharama imesasishwa!' : 'Expense updated!', 'success');
      } else {
        const { data, error } = await supabase
          .from('expenses')
          .insert([expenseData])
          .select()
          .single();

        if (error) throw error;
        setExpenses([data, ...expenses]);
        showToast(lang === 'sw' ? 'Gharama imeongezwa!' : 'Expense added!', 'success');
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      showToast((lang === 'sw' ? 'Hitilafu: ' : 'Error: ') + err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExpenses(expenses.filter(e => e.id !== id));
      showToast(lang === 'sw' ? 'Gharama imefutwa' : 'Expense deleted', 'success');
      setShowDeleteConfirm(false);
      setExpenseToDelete(null);
    } catch (err) {
      showToast((lang === 'sw' ? 'Hitilafu: ' : 'Error: ') + err.message, 'error');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('sw-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
      const matchesDateFrom = !dateRange.from || e.expense_date >= dateRange.from;
      const matchesDateTo = !dateRange.to || e.expense_date <= dateRange.to;
      return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
    });
  }, [expenses, searchQuery, filterCategory, dateRange]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const thisMonthExpenses = expenses.filter(e => e.expense_date >= monthStart && e.expense_date <= monthEnd);
    const totalMonth = thisMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const today = now.getDate();
    const dailyAverage = today > 0 ? totalMonth / today : 0;

    let largestExpense = null;
    if (expenses.length > 0) {
      largestExpense = expenses.reduce((max, e) => {
        return parseFloat(e.amount || 0) > parseFloat(max.amount || 0) ? e : max;
      }, expenses[0]);
    }

    const byCategory = {};
    thisMonthExpenses.forEach(e => {
      const cat = e.category || 'other';
      if (!byCategory[cat]) {
        byCategory[cat] = 0;
      }
      byCategory[cat] += parseFloat(e.amount || 0);
    });

    const sortedCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        info: EXPENSE_CATEGORIES[cat] || EXPENSE_CATEGORIES.other
      }));

    return {
      totalMonth,
      dailyAverage,
      largestExpense,
      byCategory: sortedCategories,
      thisMonthCount: thisMonthExpenses.length
    };
  }, [expenses]);

  const exportCSV = () => {
    const headers = ['Description', 'Amount', 'Category', 'Date', 'Notes'];
    const rows = filteredExpenses.map(e => [
      e.description || '',
      e.amount || 0,
      (EXPENSE_CATEGORIES[e.category]?.label[lang] || e.category || ''),
      e.expense_date || '',
      e.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(lang === 'sw' ? 'Imepakuliwa kwa CSV!' : 'Exported to CSV!', 'success');
  };

  return (
    <div style={{ padding: 0, minHeight: '100vh' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{
              margin: '0 0 8px',
              fontSize: '28px',
              fontWeight: '800',
              color: th.text,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CI.Money size={28} />
              {lang === 'sw' ? 'Gharama' : 'Expenses'}
              <span style={{
                background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '700'
              }}>
                {expenses.length}
              </span>
            </h2>
            <p style={{ margin: 0, color: th.textMuted, fontSize: '14px' }}>
              {lang === 'sw' ? 'Fuatilia gharama zote za biashara yako' : 'Track all your business expenses'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={exportCSV}
              disabled={filteredExpenses.length === 0}
              style={{
                padding: '12px 20px',
                background: th.cardBg,
                color: th.text,
                border: `2px solid ${th.border}`,
                borderRadius: '12px',
                fontWeight: '600',
                cursor: filteredExpenses.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                opacity: filteredExpenses.length === 0 ? 0.5 : 1
              }}
            >
              <Icons.Edit size={16} />
              {lang === 'sw' ? 'Hamisha CSV' : 'Export CSV'}
            </button>
            <button
              onClick={openAddModal}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <Icons.Plus size={18} />
              {lang === 'sw' ? 'Ongeza Gharama' : 'Add Expense'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '20px 0' }}>
            <SkeletonList count={5} />
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '28px'
            }}>
              <div style={{
                background: th.cardBg,
                padding: '20px',
                borderRadius: '16px',
                border: `1px solid ${th.border}`
              }}>
                <div style={{ fontSize: '13px', color: th.textMuted, fontWeight: '500', marginBottom: '8px' }}>
                  {lang === 'sw' ? 'Jumla ya Gharama (Mwezi Huu)' : 'Total Expenses (This Month)'}
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#ef4444', marginBottom: '4px' }}>
                  {formatCurrency(stats.totalMonth)}
                </div>
                <div style={{ fontSize: '12px', color: th.textMuted }}>
                  {stats.thisMonthCount} {lang === 'sw' ? 'gharama mwezi huu' : 'expenses this month'}
                </div>
              </div>

              <div style={{
                background: th.cardBg,
                padding: '20px',
                borderRadius: '16px',
                border: `1px solid ${th.border}`
              }}>
                <div style={{ fontSize: '13px', color: th.textMuted, fontWeight: '500', marginBottom: '8px' }}>
                  {lang === 'sw' ? 'Wastani wa Kila Siku' : 'Daily Average'}
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#3b82f6', marginBottom: '4px' }}>
                  {formatCurrency(stats.dailyAverage)}
                </div>
                <div style={{ fontSize: '12px', color: th.textMuted }}>
                  {lang === 'sw' ? 'kwa siku mwezi huu' : 'per day this month'}
                </div>
              </div>

              <div style={{
                background: th.cardBg,
                padding: '20px',
                borderRadius: '16px',
                border: `1px solid ${th.border}`
              }}>
                <div style={{ fontSize: '13px', color: th.textMuted, fontWeight: '500', marginBottom: '8px' }}>
                  {lang === 'sw' ? 'Gharama Kubwa Zaidi' : 'Largest Expense'}
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#f59e0b', marginBottom: '4px' }}>
                  {stats.largestExpense ? formatCurrency(stats.largestExpense.amount) : formatCurrency(0)}
                </div>
                <div style={{ fontSize: '12px', color: th.textMuted, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {stats.largestExpense ? stats.largestExpense.description : (lang === 'sw' ? 'Hakuna gharama' : 'No expenses')}
                </div>
              </div>

              <div style={{
                background: th.cardBg,
                padding: '20px',
                borderRadius: '16px',
                border: `1px solid ${th.border}`
              }}>
                <div style={{ fontSize: '13px', color: th.textMuted, fontWeight: '500', marginBottom: '8px' }}>
                  {lang === 'sw' ? 'Kategoria Kuu' : 'Top Category'}
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: stats.byCategory[0]?.info?.color || '#64748b', marginBottom: '4px' }}>
                  {stats.byCategory[0] ? formatCurrency(stats.byCategory[0].amount) : formatCurrency(0)}
                </div>
                <div style={{ fontSize: '12px', color: th.textMuted }}>
                  {stats.byCategory[0]
                    ? stats.byCategory[0].info.label[lang]
                    : (lang === 'sw' ? 'Hakuna data' : 'No data')}
                </div>
              </div>
            </div>

            {stats.byCategory.length > 0 && (
              <div style={{
                background: th.cardBg,
                padding: '20px 24px',
                borderRadius: '16px',
                border: `1px solid ${th.border}`,
                marginBottom: '28px'
              }}>
                <h4 style={{
                  margin: '0 0 16px',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: th.text
                }}>
                  {lang === 'sw' ? 'Mgawanyiko wa Kategoria (Mwezi Huu)' : 'Category Breakdown (This Month)'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.byCategory.map((cat) => {
                    const maxAmount = stats.byCategory[0]?.amount || 1;
                    const barWidth = (cat.amount / maxAmount) * 100;
                    return (
                      <div key={cat.category}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: cat.info.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '3px',
                              background: cat.info.color,
                              display: 'inline-block'
                            }} />
                            {cat.info.label[lang]}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: th.text }}>
                            {formatCurrency(cat.amount)}
                          </span>
                        </div>
                        <div style={{
                          height: '8px',
                          borderRadius: '4px',
                          background: th.hoverBg,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${barWidth}%`,
                            background: cat.info.color,
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '20px',
              alignItems: 'flex-end'
            }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}><Icons.Search size={18} color={th.textMuted} /></div>
                <input
                  type="text"
                  placeholder={lang === 'sw' ? 'Tafuta gharama...' : 'Search expenses...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 44px',
                    border: `2px solid ${th.border}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    background: th.cardBg,
                    color: th.text,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: `2px solid ${th.border}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  background: th.cardBg,
                  color: th.text,
                  cursor: 'pointer',
                  minWidth: '160px'
                }}
              >
                <option value="all">{lang === 'sw' ? 'Kategoria Zote' : 'All Categories'}</option>
                {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label[lang]}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  style={{
                    padding: '12px 12px',
                    border: `2px solid ${th.border}`,
                    borderRadius: '12px',
                    fontSize: '13px',
                    background: th.cardBg,
                    color: th.text
                  }}
                />
                <span style={{ color: th.textMuted, fontSize: '13px' }}>
                  {lang === 'sw' ? 'mpaka' : 'to'}
                </span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  style={{
                    padding: '12px 12px',
                    border: `2px solid ${th.border}`,
                    borderRadius: '12px',
                    fontSize: '13px',
                    background: th.cardBg,
                    color: th.text
                  }}
                />
                {(dateRange.from || dateRange.to) && (
                  <button
                    onClick={() => setDateRange({ from: '', to: '' })}
                    style={{
                      padding: '12px 14px',
                      background: th.hoverBg,
                      color: th.text,
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    <Icons.X size={16} />
                  </button>
                )}
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                background: th.cardBg,
                borderRadius: '16px',
                border: `1px solid ${th.border}`
              }}>
                <CI.Money size={64} />
                <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: th.text }}>
                  {lang === 'sw' ? 'Hakuna gharama' : 'No expenses found'}
                </h3>
                <p style={{ margin: '0 0 20px', color: th.textMuted, fontSize: '14px' }}>
                  {searchQuery || filterCategory !== 'all' || dateRange.from || dateRange.to
                    ? (lang === 'sw' ? 'Jaribu kubadilisha vichujio' : 'Try adjusting your filters')
                    : (lang === 'sw' ? 'Anza kwa kuongeza gharama yako ya kwanza' : 'Start by adding your first expense')}
                </p>
                {!searchQuery && filterCategory === 'all' && !dateRange.from && !dateRange.to && (
                  <button
                    onClick={openAddModal}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Icons.Plus size={18} />
                    {lang === 'sw' ? 'Ongeza Gharama' : 'Add Expense'}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredExpenses.map(expense => {
                  const catInfo = EXPENSE_CATEGORIES[expense.category] || EXPENSE_CATEGORIES.other;

                  return (
                    <div
                      key={expense.id}
                      style={{
                        background: th.cardBg,
                        borderRadius: '12px',
                        border: `2px solid ${th.border}`,
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        flexWrap: 'wrap',
                        borderLeft: `4px solid ${catInfo.color}`
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: catInfo.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: '20px'
                        }}
                      >
                        <CI.Money size={20} />
                      </div>

                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: th.text }}>
                          {expense.description}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: catInfo.color,
                            background: catInfo.bg,
                            padding: '2px 10px',
                            borderRadius: '6px'
                          }}>
                            {catInfo.label[lang]}
                          </span>
                          <span style={{ fontSize: '12px', color: th.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Icons.Clock size={12} />
                            {formatDate(expense.expense_date)}
                          </span>
                        </div>
                        {expense.notes && (
                          <p style={{ margin: '6px 0 0', fontSize: '12px', color: th.textMuted, lineHeight: '1.4' }}>
                            {expense.notes}
                          </p>
                        )}
                      </div>

                      <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#ef4444',
                        whiteSpace: 'nowrap',
                        minWidth: '100px',
                        textAlign: 'right'
                      }}>
                        {formatCurrency(expense.amount)}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(expense)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: th.hoverBg,
                            color: '#3b82f6',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Icons.Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setExpenseToDelete(expense);
                            setShowDeleteConfirm(true);
                          }}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#fee2e2',
                            color: '#ef4444',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Icons.Trash size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: th.cardBg,
              borderRadius: '20px',
              padding: '32px',
              animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: th.text }}>
                {editingExpense
                  ? (lang === 'sw' ? 'Hariri Gharama' : 'Edit Expense')
                  : (lang === 'sw' ? 'Ongeza Gharama' : 'Add Expense')}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: th.hoverBg,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: th.text
                }}
              >
                <Icons.X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: th.text }}>
                  {lang === 'sw' ? 'Maelezo' : 'Description'} *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder={lang === 'sw' ? 'mf. Umeme wa mwezi' : 'e.g. Monthly electricity'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${th.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: th.bg,
                    color: th.text,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Kiasi' : 'Amount'} *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${th.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: th.bg,
                      color: th.text,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Tarehe' : 'Date'} *
                  </label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${th.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: th.bg,
                      color: th.text,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: th.text }}>
                  {lang === 'sw' ? 'Kategoria' : 'Category'} *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '8px'
                }}>
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: key })}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '10px',
                        border: `2px solid ${formData.category === key ? cat.color : th.border}`,
                        background: formData.category === key ? cat.bg : th.hoverBg,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '3px',
                        background: cat.color,
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: formData.category === key ? cat.color : th.text
                      }}>
                        {cat.label[lang]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: th.text }}>
                  {lang === 'sw' ? 'Maelezo Zaidi' : 'Notes'}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder={lang === 'sw' ? 'maelezo ya ziada...' : 'additional notes...'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${th.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: th.bg,
                    color: th.text,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: th.hoverBg,
                    color: th.text,
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {editingExpense
                    ? (lang === 'sw' ? 'Hifadhi' : 'Save')
                    : (lang === 'sw' ? 'Ongeza' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && expenseToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '20px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            style={{
              background: th.cardBg,
              borderRadius: '20px',
              padding: '32px',
              animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              width: '100%',
              maxWidth: '400px',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Icons.Trash size={32} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: '700', color: th.text }}>
              {lang === 'sw' ? 'Futa Gharama?' : 'Delete Expense?'}
            </h3>
            <p style={{ margin: '0 0 24px', color: th.textMuted, fontSize: '14px' }}>
              {lang === 'sw'
                ? `Una uhakika unataka kufuta "${expenseToDelete.description}"? Kitendo hiki hakiwezi kutenduliwa.`
                : `Are you sure you want to delete "${expenseToDelete.description}"? This action cannot be undone.`}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setExpenseToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: th.hoverBg,
                  color: th.text,
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {lang === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(expenseToDelete.id)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {lang === 'sw' ? 'Futa' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
