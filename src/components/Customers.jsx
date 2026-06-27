import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const Customers = ({ lang, supabase, currentShop }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'Regular', balance: 0 });

  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchCustomers = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('customers').select('*').eq('shop_id', currentShop.id).order('created_at', { ascending: false });
      if (!error && data) setCustomers(data);
      setLoading(false);
    };
    fetchCustomers();
  }, [currentShop, supabase]);

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery));
  const totalDebt = customers.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0);
  const vipCount = customers.filter(c => c.type === 'VIP').length;

  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({ name: customer.name, phone: customer.phone, type: customer.type, balance: customer.balance });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', type: 'Regular', balance: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingCustomer(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentShop?.id) return;
    const customerData = { shop_id: currentShop.id, ...formData, balance: Number(formData.balance) };

    if (editingCustomer) {
      await supabase.from('customers').update(customerData).eq('id', editingCustomer.id);
      const { data } = await supabase.from('customers').select('*').eq('shop_id', currentShop.id);
      if (data) setCustomers(data);
    } else {
      const { data } = await supabase.from('customers').insert([customerData]).select().single();
      if (data) setCustomers([data, ...customers]);
    }
    closeModal();
  };

  const handleDelete = async (id) => {
    if (window.confirm(lang === 'sw' ? 'Futa mteja?' : 'Delete customer?')) {
      await supabase.from('customers').delete().eq('id', id);
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);
  const inputStyle = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #6366f1' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b' }}>{lang === 'sw' ? 'Wateja Wote' : 'Total Customers'}</p>
          <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{customers.length}</h3>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b' }}>{lang === 'sw' ? 'Wateja VIP' : 'VIP Customers'}</p>
          <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{vipCount}</h3>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #ef4444' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b' }}>{lang === 'sw' ? 'Jumla ya Madeni' : 'Total Debt'}</p>
          <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>{formatCurrency(totalDebt)}</h3>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{lang === 'sw' ? 'Orodha ya Wateja' : 'Customers List'}</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{currentShop?.shop_name}</p>
        </div>
        <button onClick={() => openModal()} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
          <Icons.Plus size={18} /> {lang === 'sw' ? 'Ongeza Mteja' : 'Add Customer'}
        </button>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.Search size={18} /></span>
        <input type="text" placeholder={lang === 'sw' ? 'Tafuta mteja...' : 'Search customer...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '14px 14px 14px 48px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          onFocus={(e) => e.target.style.borderColor = '#6366f1'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}><Icons.Clock size={32} style={{marginBottom: '10px'}}/> {lang === 'sw' ? 'Inapakia...' : 'Loading...'}</div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <Icons.Users size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', fontWeight: '500' }}>{lang === 'sw' ? 'Hakuna wateja bado' : 'No customers yet'}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{lang === 'sw' ? 'Jina' : 'Name'}</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{lang === 'sw' ? 'Simu' : 'Phone'}</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{lang === 'sw' ? 'Aina' : 'Type'}</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{lang === 'sw' ? 'Salio' : 'Balance'}</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{lang === 'sw' ? 'Vitendo' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>{customer.name.charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{customer.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>{customer.phone}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: customer.type === 'VIP' ? '#fef3c7' : customer.type === 'Credit' ? '#fee2e2' : '#e0e7ff', color: customer.type === 'VIP' ? '#d97706' : customer.type === 'Credit' ? '#dc2626' : '#4f46e5' }}>{customer.type}</span>
                  </td>
                  <td style={{ padding: '16px', fontWeight: '600', fontSize: '14px', color: customer.balance < 0 ? '#ef4444' : '#10b981' }}>
                    {customer.balance < 0 ? '-' : ''}{formatCurrency(Math.abs(customer.balance))}
                    {customer.balance < 0 && <span style={{ fontSize: '11px', marginLeft: '4px', color: '#ef4444' }}>({lang === 'sw' ? 'Deni' : 'Debt'})</span>}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => openModal(customer)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px', color: '#6366f1' }}><Icons.Edit size={18} /></button>
                    <button onClick={() => handleDelete(customer.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Icons.Trash size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{editingCustomer ? (lang === 'sw' ? 'Hariri Mteja' : 'Edit Customer') : (lang === 'sw' ? 'Ongeza Mteja' : 'Add Customer')}</h2>
              <button onClick={closeModal} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.X size={16} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>{lang === 'sw' ? 'Jina' : 'Name'}</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>{lang === 'sw' ? 'Simu' : 'Phone'}</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>{lang === 'sw' ? 'Aina' : 'Type'}</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} style={inputStyle}>
                    <option value="Regular">{lang === 'sw' ? 'Kawaida' : 'Regular'}</option>
                    <option value="VIP">VIP</option>
                    <option value="Credit">{lang === 'sw' ? 'Mkopo' : 'Credit'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>{lang === 'sw' ? 'Salio' : 'Balance'}</label>
                  <input type="number" value={formData.balance} onChange={(e) => setFormData({...formData, balance: Number(e.target.value)})} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', color: '#475569' }}>{lang === 'sw' ? 'Ghairi' : 'Cancel'}</button>
                <button type="submit" style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>{editingCustomer ? (lang === 'sw' ? 'Hifadhi' : 'Save') : (lang === 'sw' ? 'Ongeza' : 'Add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;