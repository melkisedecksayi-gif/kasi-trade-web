import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import Toast from './Toast';
import { SkeletonList } from './Skeleton';

const STATUS_MAP = {
  Active: {
    color: '#10b981',
    bg: '#d1fae5',
    sw: 'Inafanya Kazi',
    en: 'Active'
  },
  Inactive: {
    color: '#ef4444',
    bg: '#fee2e2',
    sw: 'Haifanyi Kazi',
    en: 'Inactive'
  },
  Preferred: {
    color: '#8b5cf6',
    bg: '#ede9fe',
    sw: 'Inayopendelewa',
    en: 'Preferred'
  }
};

const INITIAL_FORM = {
  name: '',
  company: '',
  phone: '',
  email: '',
  address: '',
  products_supplied: '',
  payment_terms: '',
  status: 'Active',
  notes: ''
};

const Suppliers = ({ lang, supabase, currentShop, isDarkMode, theme }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (currentShop?.id) {
      fetchSuppliers();
    }
  }, [currentShop, supabase]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSuppliers(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM });
    setEditingSupplier(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      company: supplier.company || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      products_supplied: supplier.products_supplied || '',
      payment_terms: supplier.payment_terms || '',
      status: supplier.status || 'Active',
      notes: supplier.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      showToast(lang === 'sw' ? 'Tafadhali jaza jina la msambazaji' : 'Please enter supplier name', 'error');
      return;
    }

    const supplierData = {
      shop_id: currentShop.id,
      name: formData.name.trim(),
      company: formData.company.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      products_supplied: formData.products_supplied.trim(),
      payment_terms: formData.payment_terms.trim(),
      status: formData.status,
      notes: formData.notes.trim()
    };

    try {
      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingSupplier.id);

        if (error) throw error;
        setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...supplierData } : s));
        showToast(lang === 'sw' ? 'Msambazaji amesasishwa!' : 'Supplier updated!', 'success');
      } else {
        const { data, error } = await supabase
          .from('suppliers')
          .insert([supplierData])
          .select()
          .single();

        if (error) throw error;
        setSuppliers([data, ...suppliers]);
        showToast(lang === 'sw' ? 'Msambazaji ameongezwa!' : 'Supplier added!', 'success');
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
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuppliers(suppliers.filter(s => s.id !== id));
      setSelectedSuppliers(selectedSuppliers.filter(sid => sid !== id));
      showToast(lang === 'sw' ? 'Msambazaji amefutwa' : 'Supplier deleted', 'success');
      setShowDeleteConfirm(false);
      setSupplierToDelete(null);
    } catch (err) {
      showToast((lang === 'sw' ? 'Hitilafu: ' : 'Error: ') + err.message, 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSuppliers.length === 0) return;
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .in('id', selectedSuppliers);

      if (error) throw error;
      const count = selectedSuppliers.length;
      setSuppliers(suppliers.filter(s => !selectedSuppliers.includes(s.id)));
      setSelectedSuppliers([]);
      showToast(
        lang === 'sw' ? `Wasambazaji ${count} wamefutwa` : `${count} suppliers deleted`,
        'success'
      );
    } catch (err) {
      showToast((lang === 'sw' ? 'Hitilafu: ' : 'Error: ') + err.message, 'error');
    }
  };

  const toggleSelectSupplier = (id) => {
    setSelectedSuppliers(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSuppliers.length === filteredSuppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(filteredSuppliers.map(s => s.id));
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.products_supplied?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = suppliers.filter(s => s.status === 'Active').length;
  const productsCount = suppliers.reduce((acc, s) => {
    if (!s.products_supplied) return acc;
    return acc + s.products_supplied.split(',').filter(p => p.trim()).length;
  }, 0);

  const getStatusBadge = (status) => {
    const conf = STATUS_MAP[status] || STATUS_MAP.Active;
    return { ...conf };
  };

  const localTheme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#475569',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    hoverBg: isDarkMode ? '#334155' : '#f1f5f9'
  };
  const th = theme || localTheme;

  const statsCards = [
    {
      label: lang === 'sw' ? 'Wasambazaji Wote' : 'Total Suppliers',
      value: suppliers.length,
      icon: <Icons.Users size={24} />,
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      bg: isDarkMode ? 'rgba(99,102,241,0.15)' : '#eef2ff'
    },
    {
      label: lang === 'sw' ? 'Wanaofanya Kazi' : 'Active',
      value: activeCount,
      icon: <Icons.Check size={24} />,
      gradient: 'linear-gradient(135deg, #10b981, #34d399)',
      bg: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ecfdf5'
    },
    {
      label: lang === 'sw' ? 'Bidhaa Zinazotolewa' : 'Products Supplied',
      value: productsCount,
      icon: <Icons.Box size={24} />,
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      bg: isDarkMode ? 'rgba(245,158,11,0.15)' : '#fffbeb'
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: 0, minHeight: '100vh' }}>
        <div style={{ padding: '20px 0' }}>
          <SkeletonList count={5} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 0, minHeight: '100vh' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: th.text, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {lang === 'sw' ? 'Wasambazaji' : 'Suppliers'}
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '700' }}>
                {suppliers.length}
              </span>
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: th.textMuted }}>
              {lang === 'sw' ? 'Dhibiti wasambazaji wako wote' : 'Manage all your suppliers'}
            </p>
          </div>
          <button
            onClick={openAddModal}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
              transition: 'transform 0.15s ease',
              ':hover': { transform: 'translateY(-1px)' }
            }}
          >
            <Icons.Plus size={18} />
            {lang === 'sw' ? 'Ongeza Msambazaji' : 'Add Supplier'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {statsCards.map((card, i) => (
            <div
              key={i}
              style={{
                background: th.cardBg,
                borderRadius: '16px',
                padding: '20px 24px',
                border: `1px solid ${th.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: card.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: card.gradient.split(',')[0].replace('linear-gradient(135deg, ', '')
              }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: '13px', color: th.textMuted, fontWeight: '500', marginBottom: '2px' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: th.text }}>
                  {card.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}><Icons.Search size={18} color={th.textMuted} /></div>
            <input
              type="text"
              placeholder={lang === 'sw' ? 'Tafuta wasambazaji...' : 'Search suppliers...'}
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
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '12px 16px',
              border: `2px solid ${th.border}`,
              borderRadius: '12px',
              fontSize: '14px',
              background: th.cardBg,
              color: th.text,
              cursor: 'pointer',
              outline: 'none',
              minWidth: '160px'
            }}
          >
            <option value="all">{lang === 'sw' ? 'Hali Zote' : 'All Statuses'}</option>
            <option value="Active">{lang === 'sw' ? 'Inafanya Kazi' : 'Active'}</option>
            <option value="Inactive">{lang === 'sw' ? 'Haifanyi Kazi' : 'Inactive'}</option>
            <option value="Preferred">{lang === 'sw' ? 'Inayopendelewa' : 'Preferred'}</option>
          </select>
        </div>

        {selectedSuppliers.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            padding: '12px 20px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            color: '#fff'
          }}>
            <span style={{ fontWeight: '600' }}>
              {selectedSuppliers.length} {lang === 'sw' ? 'wamechaguliwa' : 'selected'}
            </span>
            <button
              onClick={handleBulkDelete}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <Icons.Trash size={16} />
              {lang === 'sw' ? 'Futa Waliochaguliwa' : 'Delete Selected'}
            </button>
          </div>
        )}
      </div>

      {filteredSuppliers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ opacity: 0.3, marginBottom: '20px' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={th.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: th.text }}>
            {searchQuery
              ? lang === 'sw' ? 'Hakuna matokeo' : 'No results found'
              : lang === 'sw' ? 'Hakuna wasambazaji' : 'No suppliers yet'}
          </h3>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: th.textMuted }}>
            {searchQuery
              ? lang === 'sw' ? 'Jaribu kutafuta kwa jina tofauti' : 'Try searching with a different term'
              : lang === 'sw' ? 'Bofya kitufe cha "Ongeza Msambazaji" kuanza' : 'Click "Add Supplier" to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={openAddModal}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <Icons.Plus size={18} />
              {lang === 'sw' ? 'Ongeza Msambazaji' : 'Add Supplier'}
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{
            background: th.cardBg,
            borderRadius: '14px',
            border: `1px solid ${th.border}`,
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 48px 1.5fr 1.5fr 1fr 1.2fr 1fr 100px',
              gap: '12px',
              padding: '12px 20px',
              background: isDarkMode ? 'rgba(99,102,241,0.06)' : '#f8fafc',
              borderBottom: `1px solid ${th.border}`,
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: '700',
              color: th.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedSuppliers.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                  onChange={toggleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </div>
              <div></div>
              <div>{lang === 'sw' ? 'Jina' : 'Name'}</div>
              <div>{lang === 'sw' ? 'Kampuni' : 'Company'}</div>
              <div>{lang === 'sw' ? 'Mawasiliano' : 'Contact'}</div>
              <div>{lang === 'sw' ? 'Bidhaa' : 'Products'}</div>
              <div>{lang === 'sw' ? 'Masharti ya Malipo' : 'Payment Terms'}</div>
              <div style={{ textAlign: 'center' }}>{lang === 'sw' ? 'Hali' : 'Status'}</div>
            </div>

            {filteredSuppliers.map((supplier) => {
              const statusBadge = getStatusBadge(supplier.status);
              const isSelected = selectedSuppliers.includes(supplier.id);

              return (
                <div
                  key={supplier.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 48px 1.5fr 1.5fr 1fr 1.2fr 1fr 100px',
                    gap: '12px',
                    padding: '14px 20px',
                    borderBottom: `1px solid ${th.border}`,
                    alignItems: 'center',
                    background: isSelected ? (isDarkMode ? 'rgba(99,102,241,0.1)' : '#eef2ff') : th.cardBg,
                    transition: 'background 0.15s ease',
                    cursor: 'default',
                    fontSize: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectSupplier(supplier.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${statusBadge.color}25, ${statusBadge.color}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: statusBadge.color }}>
                      {supplier.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: '700', color: th.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {supplier.name}
                    </div>
                  </div>

                  <div style={{ color: th.textMuted, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {supplier.company || '—'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {supplier.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: th.textMuted }}>
                        <Icons.Phone size={12} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: th.textMuted }}>
                        <Icons.Mail size={12} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{supplier.email}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '13px', color: th.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {supplier.products_supplied
                      ? supplier.products_supplied.split(',').slice(0, 2).join(', ') + (supplier.products_supplied.split(',').length > 2 ? '...' : '')
                      : '—'}
                  </div>

                  <div style={{ fontSize: '13px', color: th.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {supplier.payment_terms || '—'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: statusBadge.bg,
                      color: statusBadge.color,
                      whiteSpace: 'nowrap'
                    }}>
                      {lang === 'sw' ? statusBadge.sw : statusBadge.en}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => openEditModal(supplier)}
                        title={lang === 'sw' ? 'Hariri' : 'Edit'}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: th.textMuted,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#6366f120'; e.currentTarget.style.color = '#6366f1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = th.textMuted; }}
                      >
                        <Icons.Edit size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setSupplierToDelete(supplier);
                          setShowDeleteConfirm(true);
                        }}
                        title={lang === 'sw' ? 'Futa' : 'Delete'}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: th.textMuted,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#ef444420'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = th.textMuted; }}
                      >
                        <Icons.Trash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px', color: th.textMuted, marginTop: '8px' }}>
            {lang === 'sw'
              ? `Inaonyesha ${filteredSuppliers.length} kati ya ${suppliers.length} wasambazaji`
              : `Showing ${filteredSuppliers.length} of ${suppliers.length} suppliers`}
          </div>
        </>
      )}

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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => { setShowModal(false); resetForm(); }}
        >
          <div
            style={{
              background: th.cardBg,
              borderRadius: '20px',
              padding: '32px',
              animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: th.text }}>
                {editingSupplier
                  ? lang === 'sw' ? 'Hariri Msambazaji' : 'Edit Supplier'
                  : lang === 'sw' ? 'Ongeza Msambazaji' : 'Add Supplier'}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Jina la Msambazaji' : 'Supplier Name'} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={lang === 'sw' ? 'Mf. Juma Ali' : 'e.g. John Doe'}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: `2px solid ${th.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: th.bg,
                      color: th.text,
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Kampuni' : 'Company'}
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder={lang === 'sw' ? 'Mf. Jumla Co. Ltd' : 'e.g. ABC Corp Ltd'}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: `2px solid ${th.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: th.bg,
                      color: th.text,
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Namba ya Simu' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+255 712 345 678"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: `2px solid ${th.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: th.bg,
                      color: th.text,
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Barua Pepe' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="supplier@example.com"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: `2px solid ${th.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: th.bg,
                      color: th.text,
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: th.text }}>
                  {lang === 'sw' ? 'Anwani' : 'Address'}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={lang === 'sw' ? 'Mf. Mtaa wa Pili, Dar es Salaam' : 'e.g. 2nd Street, Dar es Salaam'}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    border: `2px solid ${th.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: th.bg,
                    color: th.text,
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Bidhaa Anazotoa' : 'Products Supplied'}
                  </label>
                  <input
                    type="text"
                    value={formData.products_supplied}
                    onChange={(e) => setFormData({ ...formData, products_supplied: e.target.value })}
                    placeholder={lang === 'sw' ? 'Mf. Unga, Sukari, Mchele' : 'e.g. Flour, Sugar, Rice'}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: `2px solid ${th.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: th.bg,
                      color: th.text,
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Masharti ya Malipo' : 'Payment Terms'}
                  </label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    placeholder={lang === 'sw' ? 'Mf. Siku 30, Pesa Taslimu' : 'e.g. Net 30, Cash on Delivery'}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: `2px solid ${th.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: th.bg,
                      color: th.text,
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: '600', color: th.text }}>
                  {lang === 'sw' ? 'Hali' : 'Status'}
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {Object.entries(STATUS_MAP).map(([key, conf]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: key })}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: `2px solid ${formData.status === key ? conf.color : th.border}`,
                        background: formData.status === key ? conf.bg : th.hoverBg,
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: formData.status === key ? conf.color : th.text,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {lang === 'sw' ? conf.sw : conf.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: th.text }}>
                  {lang === 'sw' ? 'Maelezo ya Ziada' : 'Notes'}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder={lang === 'sw' ? 'Maelezo ya ziada kuhusu msambazaji...' : 'Additional notes about the supplier...'}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    border: `2px solid ${th.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: th.bg,
                    color: th.text,
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    minHeight: '72px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
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
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {editingSupplier
                    ? lang === 'sw' ? 'Hifadhi Mabadiliko' : 'Save Changes'
                    : lang === 'sw' ? 'Ongeza Msambazaji' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && supplierToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '20px',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => { setShowDeleteConfirm(false); setSupplierToDelete(null); }}
        >
          <div
            style={{
              background: th.cardBg,
              borderRadius: '20px',
              padding: '32px',
              animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              width: '100%',
              maxWidth: '420px',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}
            >
              <Icons.Trash size={32} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: '700', color: th.text }}>
              {lang === 'sw' ? 'Futa Msambazaji?' : 'Delete Supplier?'}
            </h3>
            <p style={{ margin: '0 0 8px', color: th.textMuted, fontSize: '14px', lineHeight: '1.5' }}>
              {lang === 'sw'
                ? `Je, una uhakika unataka kumfuta "${supplierToDelete.name}"?`
                : `Are you sure you want to delete "${supplierToDelete.name}"?`}
            </p>
            <p style={{ margin: '0 0 24px', color: '#ef4444', fontSize: '12px', fontWeight: '600' }}>
              {lang === 'sw' ? 'Kitendo hiki hakiwezi kutenguliwa.' : 'This action cannot be undone.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setSupplierToDelete(null); }}
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
                onClick={() => handleDelete(supplierToDelete.id)}
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

export default Suppliers;
