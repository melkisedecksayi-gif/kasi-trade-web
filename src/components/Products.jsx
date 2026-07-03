import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import Toast from './Toast';

// Categories data
const Categories = {
  food: {
    name: { sw: 'Vyakula', en: 'Food' },
    color: '#ef4444',
    bg: '#fee2e2',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 11h.01M11 15h.01M16 16a5 5 0 0 0-8 0" />
        <path d="M17 11a5 5 0 0 0-10 0" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
      </svg>
    )
  },
  drinks: {
    name: { sw: 'Vinywaji', en: 'Drinks' },
    color: '#3b82f6',
    bg: '#dbeafe',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      </svg>
    )
  },
  clothing: {
    name: { sw: 'Mavazi', en: 'Clothing' },
    color: '#8b5cf6',
    bg: '#ede9fe',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    )
  },
  electronics: {
    name: { sw: 'Elektroniki', en: 'Electronics' },
    color: '#06b6d4',
    bg: '#cffafe',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
        <path d="M12 18h.01" />
      </svg>
    )
  },
  home: {
    name: { sw: 'Nyumbani', en: 'Home' },
    color: '#f59e0b',
    bg: '#fef3c7',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  medicine: {
    name: { sw: 'Dawa', en: 'Medicine' },
    color: '#10b981',
    bg: '#d1fae5',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    )
  },
  gift: {
    name: { sw: 'Zawadi', en: 'Gift' },
    color: '#ec4899',
    bg: '#fce7f3',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13" />
        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      </svg>
    )
  },
  shopping: {
    name: { sw: 'Ununuzi', en: 'Shopping' },
    color: '#6366f1',
    bg: '#e0e7ff',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    )
  },
  beauty: {
    name: { sw: 'Uzuri', en: 'Beauty' },
    color: '#d946ef',
    bg: '#fae8ff',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      </svg>
    )
  },
  other: {
    name: { sw: 'Mengineyo', en: 'Other' },
    color: '#64748b',
    bg: '#f1f5f9',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      </svg>
    )
  }
};

const Products = ({ lang, supabase, currentShop, isDarkMode }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    buy_price: '',
    sell_price: '',
    stock: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (currentShop?.id) {
      fetchProducts();
    }
  }, [currentShop, supabase]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      buy_price: '',
      sell_price: '',
      stock: ''
    });
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || '',
      buy_price: product.buy_price?.toString() || '',
      sell_price: product.sell_price?.toString() || '',
      stock: product.stock?.toString() || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.buy_price || !formData.sell_price) {
      showToast(lang === 'sw' ? 'Tafadhali jaza taarifa zote' : 'Please fill all fields', 'error');
      return;
    }

    const productData = {
      shop_id: currentShop.id,
      name: formData.name,
      category: formData.category,
      buy_price: parseFloat(formData.buy_price),
      sell_price: parseFloat(formData.sell_price),
      stock: parseInt(formData.stock) || 0
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
        showToast(lang === 'sw' ? 'Bidhaa imesasishwa!' : 'Product updated!', 'success');
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) throw error;
        setProducts([data, ...products]);
        showToast(lang === 'sw' ? 'Bidhaa imeongezwa!' : 'Product added!', 'success');
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
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      showToast(lang === 'sw' ? 'Bidhaa imefutwa' : 'Product deleted', 'success');
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (err) {
      showToast((lang === 'sw' ? 'Hitilafu: ' : 'Error: ') + err.message, 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (error) throw error;
      const count = selectedProducts.length;
      setProducts(products.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      showToast(
        lang === 'sw' ? `Bidhaa ${count} zimefutwa` : `${count} products deleted`,
        'success'
      );
    } catch (err) {
      showToast((lang === 'sw' ? 'Hitilafu: ' : 'Error: ') + err.message, 'error');
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = filterStock === 'all' ||
      (filterStock === 'low' && p.stock < 10) ||
      (filterStock === 'out' && p.stock === 0) ||
      (filterStock === 'available' && p.stock > 0);
    return matchesSearch && matchesStock;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { label: lang === 'sw' ? 'Imeisha' : 'Out of Stock', color: '#ef4444', bg: '#fee2e2' };
    }
    if (stock < 10) {
      return { label: lang === 'sw' ? 'Stock Ndogo' : 'Low Stock', color: '#f59e0b', bg: '#fef3c7' };
    }
    return { label: lang === 'sw' ? 'Inapatikana' : 'In Stock', color: '#10b981', bg: '#d1fae5' };
  };

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    hoverBg: isDarkMode ? '#334155' : '#f1f5f9'
  };

  return (
    <div style={{ padding: 0, minHeight: '100vh' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '800', color: theme.text, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icons.Box size={28} />
              {lang === 'sw' ? 'Bidhaa' : 'Products'}
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '700' }}>
                {products.length}
              </span>
            </h2>
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
              fontSize: '14px'
            }}
          >
            <Icons.Plus size={18} />
            {lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Product'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <Icons.Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
            <input
              type="text"
              placeholder={lang === 'sw' ? 'Tafuta bidhaa...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: `2px solid ${theme.border}`,
                borderRadius: '12px',
                fontSize: '14px',
                background: theme.cardBg,
                color: theme.text,
                boxSizing: 'border-box'
              }}
            />
          </div>
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            style={{
              padding: '12px 16px',
              border: `2px solid ${theme.border}`,
              borderRadius: '12px',
              fontSize: '14px',
              background: theme.cardBg,
              color: theme.text,
              cursor: 'pointer'
            }}
          >
            <option value="all">{lang === 'sw' ? 'Stock Zote' : 'All'}</option>
            <option value="available">{lang === 'sw' ? 'Zinapatikana' : 'Available'}</option>
            <option value="low">{lang === 'sw' ? 'Stock Ndogo' : 'Low'}</option>
            <option value="out">{lang === 'sw' ? 'Zimeisha' : 'Out'}</option>
          </select>
        </div>

        {selectedProducts.length > 0 && (
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
              {selectedProducts.length} {lang === 'sw' ? 'zimechaguliwa' : 'selected'}
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
              {lang === 'sw' ? 'Futa Zote' : 'Delete All'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: theme.textMuted }}>
          <p>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Icons.Box size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: theme.text }}>
            {lang === 'sw' ? 'Hakuna bidhaa' : 'No products'}
          </h3>
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
              {lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Product'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredProducts.map(product => {
            const stockStatus = getStockStatus(product.stock);
            const categoryInfo = Categories[product.category?.toLowerCase()] || Categories.other;

            return (
              <div
                key={product.id}
                style={{
                  background: theme.cardBg,
                  borderRadius: '12px',
                  border: `2px solid ${selectedProducts.includes(product.id) ? '#6366f1' : theme.border}`,
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => toggleSelectProduct(product.id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />

                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: categoryInfo.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: `2px solid ${categoryInfo.color}30`
                  }}
                >
                  {categoryInfo.svg}
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: theme.text }}>
                    {product.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: categoryInfo.color, fontWeight: '600' }}>
                    {categoryInfo.name[lang]}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: theme.textMuted }}>
                      {lang === 'sw' ? 'Kununua' : 'Buy'}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>
                      {formatCurrency(product.buy_price)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: theme.textMuted }}>
                      {lang === 'sw' ? 'Kuuza' : 'Sell'}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
                      {formatCurrency(product.sell_price)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '6px 12px',
                    background: stockStatus.bg,
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: stockStatus.color
                  }}
                >
                  {product.stock} {lang === 'sw' ? 'imebaki' : 'left'}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openEditModal(product)}
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
                    onClick={() => {
                      setProductToDelete(product);
                      setShowDeleteConfirm(true);
                    }}
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
      )}

      {/* Add/Edit Modal */}
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
            padding: '20px'
          }}
        >
          <div
            style={{
              background: theme.cardBg,
              borderRadius: '20px',
              padding: '32px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: theme.text }}>
                {editingProduct
                  ? lang === 'sw' ? 'Hariri Bidhaa' : 'Edit Product'
                  : lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Product'}
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
                  background: theme.hoverBg,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.text
                }}
              >
                <Icons.X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: theme.text }}>
                  {lang === 'sw' ? 'Kategoria' : 'Category'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                  {Object.entries(Categories).map(([key, cat]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: key })}
                      style={{
                        padding: '14px 8px',
                        borderRadius: '12px',
                        border: `2px solid ${formData.category === key ? cat.color : theme.border}`,
                        background: formData.category === key ? cat.bg : theme.hoverBg,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: formData.category === key ? '#fff' : cat.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {cat.svg}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: formData.category === key ? cat.color : theme.text }}>
                        {cat.name[lang]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: theme.text }}>
                  {lang === 'sw' ? 'Jina la Bidhaa' : 'Product Name'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: theme.bg,
                    color: theme.text,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: theme.text }}>
                    {lang === 'sw' ? 'Bei Kununua' : 'Buy Price'} *
                  </label>
                  <input
                    type="number"
                    value={formData.buy_price}
                    onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${theme.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: theme.bg,
                      color: theme.text,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: theme.text }}>
                    {lang === 'sw' ? 'Bei Kuuza' : 'Sell Price'} *
                  </label>
                  <input
                    type="number"
                    value={formData.sell_price}
                    onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${theme.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: theme.bg,
                      color: theme.text,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: theme.text }}>
                  Stock
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: theme.bg,
                    color: theme.text,
                    boxSizing: 'border-box'
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
                    background: theme.hoverBg,
                    color: theme.text,
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
                  {editingProduct
                    ? lang === 'sw' ? 'Hifadhi' : 'Save'
                    : lang === 'sw' ? 'Ongeza' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && productToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: theme.cardBg,
              borderRadius: '20px',
              padding: '32px',
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
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}
            >
              <Icons.Trash size={32} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: '700', color: theme.text }}>
              {lang === 'sw' ? 'Futa Bidhaa?' : 'Delete?'}
            </h3>
            <p style={{ margin: '0 0 24px', color: theme.textMuted, fontSize: '14px' }}>
              {lang === 'sw'
                ? `Futa "${productToDelete.name}"?`
                : `Delete "${productToDelete.name}"?`}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: theme.hoverBg,
                  color: theme.text,
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {lang === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(productToDelete.id)}
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

export default Products;