import React, { useState, useEffect } from 'react';

const Products = ({ lang, supabase, currentShop }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: 'Vyakula', buyPrice: '', sellPrice: '', stock: '', emoji: '📦' });

  // ✅ FETCH REAL DATA FROM SUPABASE
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ name: product.name, category: product.category, buyPrice: product.buy_price, sellPrice: product.sell_price, stock: product.stock, emoji: product.emoji || '📦' });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: 'Vyakula', buyPrice: '', sellPrice: '', stock: '', emoji: '📦' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); };

  // ✅ SAVE TO SUPABASE
  const handleSave = async (e) => {
    e.preventDefault();
    const productData = {
      shop_id: currentShop.id,
      name: formData.name,
      category: formData.category,
      buy_price: Number(formData.buyPrice),
      sell_price: Number(formData.sellPrice),
      stock: Number(formData.stock),
      emoji: formData.emoji
    };

    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id);
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
    } else {
      const { data, error } = await supabase.from('products').insert([productData]).select().single();
      if (!error && data) setProducts([data, ...products]);
    }
    closeModal();
  };

  // ✅ DELETE FROM SUPABASE
  const handleDelete = async (id) => {
    if (window.confirm(lang === 'sw' ? 'Una uhakika unataka kufuta bidhaa hii?' : 'Are you sure?')) {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);
  const inputStyle = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{lang === 'sw' ? 'Orodha ya Bidhaa' : 'Products Inventory'}</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{products.length} {lang === 'sw' ? 'bidhaa zilizosajiliwa' : 'registered products'}</p>
        </div>
        <button onClick={() => openModal()} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>➕</span> {lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Product'}
        </button>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#94a3b8' }}>🔍</span>
        <input type="text" placeholder={lang === 'sw' ? 'Tafuta bidhaa...' : 'Search products...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '14px 14px 14px 48px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', boxSizing: 'border-box' }} />
      </div>

      <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Inapakia bidhaa...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>{lang === 'sw' ? 'Bidhaa' : 'Product'}</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>{lang === 'sw' ? 'Aina' : 'Category'}</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>{lang === 'sw' ? 'Bei ya Kununua' : 'Buy Price'}</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>{lang === 'sw' ? 'Bei ya Kuuza' : 'Sell Price'}</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Stock</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', color: '#64748b' }}>{lang === 'sw' ? 'Vitendo' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{product.emoji}</div>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{product.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>{product.category}</td>
                  <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>{formatCurrency(product.buy_price)}</td>
                  <td style={{ padding: '16px', fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{formatCurrency(product.sell_price)}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: product.stock < 10 ? '#fee2e2' : '#dcfce7', color: product.stock < 10 ? '#dc2626' : '#16a34a' }}>
                      {product.stock} pcs
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => openModal(product)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', marginRight: '8px', color: '#667eea' }}>✏️</button>
                    <button onClick={() => handleDelete(product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#ef4444' }}>️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
            <p>{lang === 'sw' ? 'Hakuna bidhaa bado. Bofya "Ongeza Bidhaa" kuanza.' : 'No products yet. Click "Add Product" to start.'}</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>{editingProduct ? (lang === 'sw' ? 'Hariri Bidhaa' : 'Edit Product') : (lang === 'sw' ? 'Ongeza Bidhaa Mpya' : 'Add New Product')}</h2>
              <button onClick={closeModal} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>{lang === 'sw' ? 'Jina la Bidhaa' : 'Product Name'}</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>{lang === 'sw' ? 'Aina' : 'Category'}</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={inputStyle}>
                    <option>Vyakula</option><option>Vinywaji</option><option>Vipodozi</option><option>Nyumbani</option><option>Elektroniki</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Icon/Emoji</label>
                  <input type="text" value={formData.emoji} onChange={(e) => setFormData({...formData, emoji: e.target.value})} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>{lang === 'sw' ? 'Bei ya Kununua' : 'Buy Price'}</label>
                  <input type="number" required value={formData.buyPrice} onChange={(e) => setFormData({...formData, buyPrice: Number(e.target.value)})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>{lang === 'sw' ? 'Bei ya Kuuza' : 'Sell Price'}</label>
                  <input type="number" required value={formData.sellPrice} onChange={(e) => setFormData({...formData, sellPrice: Number(e.target.value)})} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Stock</label>
                <input type="number" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', color: '#64748b' }}>{lang === 'sw' ? 'Ghairi' : 'Cancel'}</button>
                <button type="submit" style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>{editingProduct ? (lang === 'sw' ? 'Hifadhi' : 'Save') : (lang === 'sw' ? 'Ongeza' : 'Add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;