import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { translations } from '../translations';

const Products = ({ supabase, lang = 'sw', t }) => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', barcode: '', cost_price: '', selling_price: '', stock_quantity: '' });
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching products:', error);
    else setProducts(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { 
    fetchProducts(); 
  }, [fetchProducts]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.barcode) {
      alert(lang === 'sw' ? '❌ Jina na Barcode lazima!' : '❌ Name and Barcode required!');
      return;
    }
    
    const { error } = await supabase.from('products').insert([{
      name: form.name,
      barcode: form.barcode,
      cost_price: parseFloat(form.cost_price) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      stock_quantity: parseInt(form.stock_quantity) || 0
    }]);

    if (error) {
      alert(lang === 'sw' ? '❌ ' + error.message : '❌ ' + error.message);
    } else {
      alert(lang === 'sw' ? '✅ Bidhaa imeongezwa!' : '✅ Product added!');
      setForm({ name: '', barcode: '', cost_price: '', selling_price: '', stock_quantity: '' });
      fetchProducts();
    }
  };

  if (loading) {
    return <div style={{padding:'20px', textAlign:'center'}}>{lang === 'sw' ? '🔄 Inapakua...' : '🔄 Loading...'}</div>;
  }

  return (
    <div style={styles.container}>
      <h2>{t.addProduct || 'Add Product'}</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <input name="barcode" placeholder={t.barcode || 'Barcode'} value={form.barcode} onChange={handleChange} style={styles.input} autoFocus required />
        <input name="name" placeholder={t.productName || 'Product Name'} value={form.name} onChange={handleChange} style={styles.input} required />
        <div style={styles.row}>
          <input name="cost_price" type="number" placeholder={t.costPrice || 'Cost Price (TZS)'} value={form.cost_price} onChange={handleChange} style={styles.input} required />
          <input name="selling_price" type="number" placeholder={t.sellingPrice || 'Selling Price (TZS)'} value={form.selling_price} onChange={handleChange} style={styles.input} required />
        </div>
        <div style={styles.row}>
          <input name="stock_quantity" type="number" placeholder={t.stock || 'Stock Quantity'} value={form.stock_quantity} onChange={handleChange} style={styles.input} required />
          <button type="submit" style={styles.btn}>{t.addProduct || 'Add Product'}</button>
        </div>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>{t.barcode || 'Barcode'}</th>
            <th>{t.productName || 'Product Name'}</th>
            <th>{t.costPrice || 'Cost Price'}</th>
            <th>{t.sellingPrice || 'Selling Price'}</th>
            <th>{t.stock || 'Stock'}</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr><td colSpan="5" style={{textAlign:'center', color:'#666', padding:'20px'}}>{lang === 'sw' ? 'Hakuna bidhaa bado.' : 'No products yet.'}</td></tr>
          ) : (
            products.map(p => (
              <tr key={p.id}>
                <td style={{fontFamily:'monospace', background:'#f8f9fa'}}>{p.barcode || '-'}</td>
                <td>{p.name}</td>
                <td>{p.cost_price?.toLocaleString()}</td>
                <td>{p.selling_price?.toLocaleString()}</td>
                <td style={{color: p.stock_quantity <= 5 ? 'red' : 'green', fontWeight:'bold'}}>{p.stock_quantity}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  container: { padding: '20px', fontFamily: 'system-ui, sans-serif' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px', background: '#f8f9fa', padding: '16px', borderRadius: '10px' },
  row: { display: 'flex', gap: '12px' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '8px', flex: 1, fontSize: '14px' },
  btn: { padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }
};

export default Products;