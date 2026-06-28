import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const Customers = ({ lang, supabase, currentShop, isDarkMode }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchCustomers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) setCustomers(data);
      setLoading(false);
    };
    fetchCustomers();
  }, [currentShop, supabase]);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name) return;

    const { data, error } = await supabase
      .from('customers')
      .insert([{
        shop_id: currentShop.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email
      }])
      .select()
      .single();

    if (!error && data) {
      setCustomers([data, ...customers]);
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(lang === 'sw' ? 'Futa mteja huyu?' : 'Delete this customer?')) return;
    
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (!error) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const bgColor = isDarkMode ? '#1e293b' : '#fff';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const cardBg = isDarkMode ? '#334155' : '#f8fafc';
  const subTextColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ color: textColor, margin: 0, fontSize: '24px', fontWeight: '700' }}>
          {lang === 'sw' ? 'Wateja' : 'Customers'} ({filteredCustomers.length})
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          <Icons.Plus size={18} /> {lang === 'sw' ? 'Ongeza Mteja' : 'Add Customer'}
        </button>
      </div>

      <input
        type="text"
        placeholder={lang === 'sw' ? 'Tafuta mteja...' : 'Search customers...'}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: `1px solid ${borderColor}`,
          borderRadius: '10px',
          fontSize: '14px',
          marginBottom: '20px',
          background: bgColor,
          color: textColor,
          boxSizing: 'border-box'
        }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: subTextColor }}>
          <p>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: subTextColor }}>
          <Icons.Users size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>{lang === 'sw' ? 'Hakuna wateja' : 'No customers found'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredCustomers.map(customer => (
            <div key={customer.id} style={{ background: bgColor, padding: '20px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '18px' }}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <button 
                  onClick={() => handleDelete(customer.id)}
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <Icons.Trash size={14} />
                </button>
              </div>
              <h3 style={{ color: textColor, margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>{customer.name}</h3>
              {customer.phone && (
                <div style={{ color: subTextColor, fontSize: '13px', marginBottom: '4px' }}>
                   {customer.phone}
                </div>
              )}
              {customer.email && (
                <div style={{ color: subTextColor, fontSize: '13px' }}>
                  ✉️ {customer.email}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: bgColor, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', border: `1px solid ${borderColor}` }}>
            <h3 style={{ color: textColor, margin: '0 0 24px', fontSize: '20px', fontWeight: '700' }}>
              {lang === 'sw' ? 'Ongeza Mteja' : 'Add Customer'}
            </h3>
            <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder={lang === 'sw' ? 'Jina la mteja' : 'Customer name'}
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                required
                style={{ padding: '12px', border: `1px solid ${borderColor}`, borderRadius: '8px', background: cardBg, color: textColor }}
              />
              <input
                type="tel"
                placeholder={lang === 'sw' ? 'Namba ya simu' : 'Phone number'}
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                style={{ padding: '12px', border: `1px solid ${borderColor}`, borderRadius: '8px', background: cardBg, color: textColor }}
              />
              <input
                type="email"
                placeholder={lang === 'sw' ? 'Barua pepe' : 'Email'}
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                style={{ padding: '12px', border: `1px solid ${borderColor}`, borderRadius: '8px', background: cardBg, color: textColor }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', background: cardBg, color: textColor, border: `1px solid ${borderColor}`, borderRadius: '8px', cursor: 'pointer' }}>
                  {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button type="submit" style={{ flex: 2, padding: '12px', background: '#ec4899', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  {lang === 'sw' ? 'Hifadhi' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;