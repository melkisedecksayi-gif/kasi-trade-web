import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const Products = ({ lang, supabase, currentShop, isDarkMode }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    buy_price: '',
    sell_price: '',
    stock: '',
    emoji: '📦'
  });

  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, [currentShop, supabase]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.buy_price || !newProduct.sell_price) return;

    const { data, error } = await supabase
      .from('products')
      .insert([{
        shop_id: currentShop.id,
        name: newProduct.name,
        buy_price: parseFloat(newProduct.buy_price),
        sell_price: parseFloat(newProduct.sell_price),
        stock: parseInt(newProduct.stock) || 0,
        emoji: newProduct.emoji || ''
      }])
      .select()
      .single();

    if (!error && data) {
      setProducts([data, ...products]);
      setShowAddModal(false);
      setNewProduct({ name: '', buy_price: '', sell_price: '', stock: '', emoji: '📦' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(lang === 'sw' ? 'Futa bidhaa hii?' : 'Delete this product?')) return;
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredProducts = Array.isArray(products) 
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);

  const bgColor = isDarkMode ? '#1e293b' : '#fff';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const cardBg = isDarkMode ? '#334155' : '#f8fafc';
  const subTextColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ color: textColor, margin: 0, fontSize: '24px', fontWeight: '700' }}>
          {lang === 'sw' ? 'Bidhaa' : 'Products'} ({filteredProducts.length})
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
          <Icons.Plus size={18} /> {lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Product'}
        </button>
      </div>

      <input
        type="text"
        placeholder={lang === 'sw' ? 'Tafuta bidhaa...' : 'Search products...'}
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
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: subTextColor }}>
          <Icons.Box size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>{lang === 'sw' ? 'Hakuna bidhaa' : 'No products found'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredProducts.map(product => (
            <div key={product.id} style={{ background: bgColor, padding: '20px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>{product.emoji || '📦'}</span>
                <button 
                  onClick={() => handleDelete(product.id)}
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
              <h3 style={{ color: textColor, margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>{product.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: subTextColor }}>{lang === 'sw' ? 'Bei ya kununua' : 'Buy Price'}</div>
                  <div style={{ color: textColor, fontWeight: '600' }}>{formatCurrency(product.buy_price)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: subTextColor }}>{lang === 'sw' ? 'Bei ya kuuza' : 'Sell Price'}</div>
                  <div style={{ color: '#10b981', fontWeight: '600' }}>{formatCurrency(product.sell_price)}</div>
                </div>
              </div>
              <div style={{ 
                padding: '6px 12px', 
                background: product.stock < 10 ? '#fee2e2' : '#d1fae5', 
                color: product.stock < 10 ? '#dc2626' : '#059669',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                {product.stock} {lang === 'sw' ? 'zimebaki' : 'in stock'}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: bgColor, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', border: `1px solid ${borderColor}` }}>
            <h3 style={{ color: textColor, margin: '0 0 24px', fontSize: '20px', fontWeight: '700' }}>
              {lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Product'}
            </h3>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder={lang === 'sw' ? 'Jina la bidhaa' : 'Product name'}
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                required
                style={{ padding: '12px', border: `1px solid ${borderColor}`, borderRadius: '8px', background: cardBg, color: textColor }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="number"
                  placeholder={lang === 'sw' ? 'Bei ya kununua' : 'Buy price'}
                  value={newProduct.buy_price}
                  onChange={(e) => setNewProduct({...newProduct, buy_price: e.target.value})}
                  required
                  style={{ padding: '12px', border: `1px solid ${borderColor}`, borderRadius: '8px', background: cardBg, color: textColor }}
                />
                <input
                  type="number"
                  placeholder={lang === 'sw' ? 'Bei ya kuuza' : 'Sell price'}
                  value={newProduct.sell_price}
                  onChange={(e) => setNewProduct({...newProduct, sell_price: e.target.value})}
                  required
                  style={{ padding: '12px', border: `1px solid ${borderColor}`, borderRadius: '8px', background: cardBg, color: textColor }}
                />
              </div>
              <input
                type="number"
                placeholder={lang === 'sw' ? 'Stock' : 'Stock'}
                value={newProduct.stock}
                onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                style={{ padding: '12px', border: `1px solid ${borderColor}`, borderRadius: '8px', background: cardBg, color: textColor }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', background: cardBg, color: textColor, border: `1px solid ${borderColor}`, borderRadius: '8px', cursor: 'pointer' }}>
                  {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button type="submit" style={{ flex: 2, padding: '12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
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

export default Products;