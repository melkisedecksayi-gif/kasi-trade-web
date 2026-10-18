import React, { useState, useEffect } from 'react';
import { THEME, getThemeColors } from '../theme';

const Products = ({ supabase, lang, shopId, theme, showToast, userRole }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock_quantity: '',
    category: ''
  });

  const colors = getThemeColors(theme === 'dark');

  useEffect(() => {
    fetchProducts();
  }, [shopId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast(lang === 'sw' ? 'Hitilafu ya kupakia bidhaa' : 'Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        shop_id: shopId
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        showToast(lang === 'sw' ? 'Bidhaa imesasishwa' : 'Product updated', 'success');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
        showToast(lang === 'sw' ? 'Bidhaa imeongezwa' : 'Product added', 'success');
      }

      fetchProducts();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      showToast(lang === 'sw' ? 'Hitilafu ya kuhifadhi' : 'Error saving', 'error');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      category: product.category || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(lang === 'sw' ? 'Una uhakika unataka kufuta?' : 'Are you sure you want to delete?')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showToast(lang === 'sw' ? 'Bidhaa imefutwa' : 'Product deleted', 'success');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast(lang === 'sw' ? 'Hitilafu ya kufuta' : 'Error deleting', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', stock_quantity: '', category: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: colors.text }}>
        {lang === 'sw' ? 'Inapakia...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: colors.text }}>
          {lang === 'sw' ? 'Bidhaa' : 'Products'} ({products.length})
        </h2>
        {userRole === 'admin' && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '10px 20px',
              background: THEME.colors?.primary || '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: THEME.radius?.md || '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {showForm ? (lang === 'sw' ? 'Funga' : 'Close') : (lang === 'sw' ? '+ Ongeza Bidhaa' : '+ Add Product')}
          </button>
        )}
      </div>

      {showForm && userRole === 'admin' && (
        <div style={{
          background: colors.surface,
          padding: '24px',
          borderRadius: THEME.radius?.lg || '12px',
          marginBottom: '24px',
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ margin: '0 0 16px', color: colors.text }}>
            {editingProduct ? (lang === 'sw' ? 'Sasisha Bidhaa' : 'Edit Product') : (lang === 'sw' ? 'Ongeza Bidhaa Mpya' : 'Add New Product')}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
                {lang === 'sw' ? 'Jina la Bidhaa' : 'Product Name'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  background: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: THEME.radius?.md || '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
                  {lang === 'sw' ? 'Bei' : 'Price'}
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: THEME.radius?.md || '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
                  {lang === 'sw' ? 'Idadi' : 'Quantity'}
                </label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: THEME.radius?.md || '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: '600' }}>
                {lang === 'sw' ? 'Kategoria' : 'Category'}
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: THEME.radius?.md || '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  background: THEME.colors?.primary || '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: THEME.radius?.md || '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {editingProduct ? (lang === 'sw' ? 'Sasisha' : 'Update') : (lang === 'sw' ? 'Ongeza' : 'Add')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: THEME.radius?.md || '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {lang === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{
        background: colors.surface,
        borderRadius: THEME.radius?.lg || '12px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden'
      }}>
        {products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: colors.textSec }}>
            {lang === 'sw' ? 'Hakuna bidhaa bado' : 'No products yet'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Jina' : 'Name'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Bei' : 'Price'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Idadi' : 'Stock'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Kategoria' : 'Category'}
                  </th>
                  {userRole === 'admin' && (
                    <th style={{ padding: '12px', textAlign: 'right', color: colors.textSec, fontSize: '13px' }}>
                      {lang === 'sw' ? 'Vitendo' : 'Actions'}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px', color: colors.text }}>{product.name}</td>
                    <td style={{ padding: '12px', color: colors.text }}>
                      {parseFloat(product.price).toLocaleString()} TSh
                    </td>
                    <td style={{ padding: '12px', color: colors.text }}>{product.stock_quantity}</td>
                    <td style={{ padding: '12px', color: colors.text }}>{product.category || '-'}</td>
                    {userRole === 'admin' && (
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleEdit(product)}
                          style={{
                            padding: '6px 12px',
                            background: THEME.colors?.warning || '#f59e0b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginRight: '8px',
                            fontSize: '13px'
                          }}
                        >
                          {lang === 'sw' ? 'Sasisha' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          style={{
                            padding: '6px 12px',
                            background: THEME.colors?.error || '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          {lang === 'sw' ? 'Futa' : 'Delete'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;