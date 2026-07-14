import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import Toast from './Toast';
import { SkeletonList } from './Skeleton';
import CSVImport from './CSVImport';
import { sendSMS } from '../services/smsService';

const StatCard = ({ icon, label, value, color, gradient, theme, lang }) => {
  const th = theme || {};
  return (
  <div style={{
    background: th.cardBg,
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${th.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: '1 1 200px',
    minWidth: '200px'
  }}>
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '14px',
      background: `${color}20`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div>
      <div style={{ fontSize: '13px', fontWeight: '600', color: th.textMuted, marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: th.text, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  </div>
);
};

export const formatPhone = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('255')) {
    digits = digits.slice(3);
  }
  if (digits.length === 9) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return digits;
};

const Customers = ({ lang, supabase, currentShop, isDarkMode, theme }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, thisWeek: 0 });
  const [showCSVImport, setShowCSVImport] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    region: '',
    district: '',
    notes: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (currentShop?.id) {
      fetchCustomers();
    }
  }, [currentShop, supabase]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCustomers(data);
        computeStats(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (data) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const thisMonth = data.filter(c => new Date(c.created_at) >= startOfMonth).length;
    const thisWeek = data.filter(c => new Date(c.created_at) >= startOfWeek).length;

    setStats({
      total: data.length,
      thisMonth,
      thisWeek
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      region: '',
      district: '',
      notes: ''
    });
    setEditingCustomer(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      region: customer.region || '',
      district: customer.district || '',
      notes: customer.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      showToast(lang === 'sw' ? 'Tafadhali jaza jina' : 'Please enter a name', 'error');
      return;
    }

    const customerData = {
      shop_id: currentShop.id,
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      region: formData.region.trim() || null,
      district: formData.district.trim() || null,
      notes: formData.notes.trim() || null
    };

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id);

        if (error) throw error;
        setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...customerData } : c));
        showToast(lang === 'sw' ? 'Mteja amesasishwa!' : 'Customer updated!', 'success');
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert([customerData])
          .select()
          .single();

        if (error) throw error;
        const newCustomers = [data, ...customers];
        setCustomers(newCustomers);
        computeStats(newCustomers);
        showToast(lang === 'sw' ? 'Mteja ameongezwa!' : 'Customer added!', 'success');

        if (customerData.phone) {
          const welcomeMsg = lang === 'sw'
            ? `Karibu ${customerData.name} kwenye ${currentShop?.shop_name || 'duka letu'}! Asante kwa kujisajili nasi. Tutakutumia taarifa za ofa na huduma zetu.`
            : `Welcome ${customerData.name} to ${currentShop?.shop_name || 'our shop'}! Thank you for registering with us. We will keep you updated on offers and services.`;
          sendSMS({ to: customerData.phone, message: welcomeMsg }).catch(() => {});
        }
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
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      computeStats(updated);
      setSelectedCustomers(selectedCustomers.filter(sid => sid !== id));
      showToast(lang === 'sw' ? 'Mteja amefutwa' : 'Customer deleted', 'success');
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    } catch (err) {
      showToast((lang === 'sw' ? 'Hitilafu: ' : 'Error: ') + err.message, 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .in('id', selectedCustomers);

      if (error) throw error;
      const count = selectedCustomers.length;
      const updated = customers.filter(c => !selectedCustomers.includes(c.id));
      setCustomers(updated);
      computeStats(updated);
      setSelectedCustomers([]);
      showToast(
        lang === 'sw' ? `Wateja ${count} wamefutwa` : `${count} customers deleted`,
        'success'
      );
    } catch (err) {
      showToast((lang === 'sw' ? 'Hitilafu: ' : 'Error: ') + err.message, 'error');
    }
  };

  const toggleSelectCustomer = (id) => {
    setSelectedCustomers(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.region?.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q)
    );
  });

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
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

  return (
    <div style={{ padding: 0, minHeight: '100vh' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '800', color: th.text, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icons.Users size={28} />
              {lang === 'sw' ? 'Wateja' : 'Customers'}
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '700' }}>
                {stats.total}
              </span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
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
                fontSize: '14px'
              }}
            >
              <Icons.Plus size={18} />
              {lang === 'sw' ? 'Ongeza Mteja' : 'Add Customer'}
            </button>
            <button
              onClick={() => setShowCSVImport(!showCSVImport)}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: th.text,
                border: `2px solid ${th.border}`,
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <Icons.Mail size={18} />
              {lang === 'sw' ? 'Ingiza CSV' : 'Import CSV'}
            </button>
          </div>
        </div>

        {showCSVImport && (
          <div style={{ marginBottom: '24px' }}>
            <CSVImport
              supabase={supabase} currentShop={currentShop} lang={lang}
              type="customers" isDarkMode={isDarkMode}
              onComplete={(count) => {
                showToast(lang === 'sw' ? `${count} wateja wameingizwa!` : `${count} customers imported!`);
                fetchCustomers(); setShowCSVImport(false);
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <StatCard
            icon={<Icons.Users size={24} />}
            label={lang === 'sw' ? 'Wateja Wote' : 'Total Customers'}
            value={stats.total}
            color="#6366f1"
            theme={th}
          />
          <StatCard
            icon={<Icons.Clock size={24} />}
            label={lang === 'sw' ? 'Mwezi Huu' : 'This Month'}
            value={stats.thisMonth}
            color="#10b981"
            theme={th}
          />
          <StatCard
            icon={<Icons.Check size={24} />}
            label={lang === 'sw' ? 'Wiki Hii' : 'This Week'}
            value={stats.thisWeek}
            color="#f59e0b"
            theme={th}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}><Icons.Search size={18} color={th.textMuted} /></div>
            <input
              type="text"
              placeholder={lang === 'sw' ? 'Tafuta wateja kwa jina, simu, au eneo...' : 'Search by name, phone, or location...'}
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
        </div>

        {selectedCustomers.length > 0 && (
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
              {selectedCustomers.length} {lang === 'sw' ? 'wamechaguliwa' : 'selected'}
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
                gap: '6px'
              }}
            >
              <Icons.Trash size={16} />
              {lang === 'sw' ? 'Futa Wote' : 'Delete All'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonList count={6} />
      ) : filteredCustomers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: isDarkMode ? '#1e293b' : '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Icons.Users size={56} style={{ opacity: 0.3 }} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: th.text }}>
            {searchQuery
              ? (lang === 'sw' ? 'Hakuna wateja wanaolingana' : 'No matching customers')
              : (lang === 'sw' ? 'Hakuna wateja bado' : 'No customers yet')
            }
          </h3>
          <p style={{ margin: '0 0 24px', color: th.textMuted, fontSize: '14px' }}>
            {searchQuery
              ? (lang === 'sw' ? 'Jaribu kutafuta kwa jina tofauti' : 'Try a different search term')
              : (lang === 'sw' ? 'Anza kwa kuongeza mteja wako wa kwanza' : 'Add your first customer to get started')
            }
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
                gap: '8px'
              }}
            >
              <Icons.Plus size={18} />
              {lang === 'sw' ? 'Ongeza Mteja' : 'Add Customer'}
            </button>
          )}
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            marginBottom: '8px',
            borderRadius: '10px',
            background: th.cardBg,
            border: `1px solid ${th.border}`,
            gap: '12px'
          }}>
            <input
              type="checkbox"
              checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
              onChange={toggleSelectAll}
              style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
            />
            <div style={{ flex: 1, fontSize: '12px', fontWeight: '700', color: th.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'sw' ? 'Jina' : 'Name'}
            </div>
            <div style={{ flex: 1, fontSize: '12px', fontWeight: '700', color: th.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
              {lang === 'sw' ? 'Simu' : 'Phone'}
            </div>
            <div style={{ flex: 1, fontSize: '12px', fontWeight: '700', color: th.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'none', '@media (min-width: 1024px)': { display: 'block' } }}>
              {lang === 'sw' ? 'Eneo' : 'Location'}
            </div>
            <div style={{ width: '88px', flexShrink: 0 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredCustomers.map(customer => {
              const avatarColor = getAvatarColor(customer.name);
              const isSelected = selectedCustomers.includes(customer.id);
              const locationParts = [customer.district, customer.region].filter(Boolean).join(', ');

              return (
                <div
                  key={customer.id}
                  style={{
                    background: th.cardBg,
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? '#6366f1' : th.border}`,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'border-color 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    if (e.target.type === 'checkbox') return;
                    toggleSelectCustomer(customer.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectCustomer(customer.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${avatarColor}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: '700',
                    fontSize: '15px',
                    color: avatarColor,
                    letterSpacing: '0.5px'
                  }}>
                    {getInitials(customer.name)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: th.text, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {customer.name}
                    </div>
                    {customer.phone && (
                      <div style={{ fontSize: '13px', color: th.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.Phone size={13} />
                        {formatPhone(customer.phone)}
                      </div>
                    )}
                    {customer.email && (
                      <div style={{ fontSize: '13px', color: th.textMuted, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Icons.Mail size={13} />
                        {customer.email}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: 'none' }} className="desktop-phone-col">
                    {customer.phone ? (
                      <span style={{ fontSize: '13px', color: th.text, fontWeight: '500' }}>
                        {formatPhone(customer.phone)}
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', color: th.textMuted, fontStyle: 'italic' }}>
                        {lang === 'sw' ? 'Hakuna' : 'N/A'}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: 'none' }} className="desktop-location-col">
                    {locationParts ? (
                      <span style={{ fontSize: '13px', color: th.text, fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {locationParts}
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', color: th.textMuted, fontStyle: 'italic' }}>
                        {lang === 'sw' ? 'Hakuna' : 'N/A'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(customer);
                      }}
                      title={lang === 'sw' ? 'Hariri' : 'Edit'}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: '#6366f1',
                        color: '#fff',
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomerToDelete(customer);
                        setShowDeleteConfirm(true);
                      }}
                      title={lang === 'sw' ? 'Futa' : 'Delete'}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: '#ef4444',
                        color: '#fff',
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
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-phone-col { display: block !important; }
        }
        @media (min-width: 1024px) {
          .desktop-location-col { display: block !important; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

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
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: th.text }}>
                {editingCustomer
                  ? lang === 'sw' ? 'Hariri Mteja' : 'Edit Customer'
                  : lang === 'sw' ? 'Ongeza Mteja' : 'Add Customer'}
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
                  {lang === 'sw' ? 'Jina Kamili' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
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
                  placeholder={lang === 'sw' ? 'Mf. Juma Mwinyi' : 'e.g. John Doe'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    placeholder="0712 345 678"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Barua Pepe' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    placeholder="mfano@email.com"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: th.text }}>
                  {lang === 'sw' ? 'Anwani' : 'Address'}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  placeholder={lang === 'sw' ? 'Mf. Barabara ya Mwembe' : 'e.g. Main Street 123'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Mkoa' : 'Region'}
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
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
                    placeholder={lang === 'sw' ? 'Mf. Dar es Salaam' : 'e.g. Dar es Salaam'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: th.text }}>
                    {lang === 'sw' ? 'Wilaya' : 'District'}
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
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
                    placeholder={lang === 'sw' ? 'Mf. Kinondoni' : 'e.g. Kinondoni'}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: th.text }}>
                  {lang === 'sw' ? 'Maelezo' : 'Notes'}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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
                  placeholder={lang === 'sw' ? 'Maelezo ya ziada...' : 'Additional notes...'}
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
                    cursor: 'pointer'
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
                    cursor: 'pointer'
                  }}
                >
                  {editingCustomer
                    ? lang === 'sw' ? 'Hifadhi' : 'Save'
                    : lang === 'sw' ? 'Ongeza' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && customerToDelete && (
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
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: isDarkMode ? '#7f1d1d30' : '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}
            >
              <Icons.Trash size={32} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: '700', color: th.text }}>
              {lang === 'sw' ? 'Futa Mteja?' : 'Delete Customer?'}
            </h3>
            <p style={{ margin: '0 0 24px', color: th.textMuted, fontSize: '14px' }}>
              {lang === 'sw'
                ? `Una uhakika unataka kumfuta "${customerToDelete.name}"? Hatua hii haiwezi kutenduliwa.`
                : `Are you sure you want to delete "${customerToDelete.name}"? This action cannot be undone.`}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCustomerToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: th.hoverBg,
                  color: th.text,
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {lang === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(customerToDelete.id)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
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

export default Customers;
