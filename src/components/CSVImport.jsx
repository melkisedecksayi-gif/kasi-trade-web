import React, { useState, useRef } from 'react';

const CSVImport = ({ supabase, currentShop, lang, onComplete, type = 'products', isDarkMode }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState(0);
  const fileRef = useRef(null);

  const isSw = lang === 'sw';

  const productFields = { name: isSw ? 'Jina' : 'Name', category: isSw ? 'Kategoria' : 'Category', buy_price: isSw ? 'Bei ya Kununua' : 'Buy Price', sell_price: isSw ? 'Bei ya Kuuza' : 'Sell Price', stock: isSw ? 'Hesabu' : 'Stock' };
  const customerFields = { name: isSw ? 'Jina' : 'Name', phone: isSw ? 'Simu' : 'Phone', email: 'Email', address: isSw ? 'Anwani' : 'Address' };
  const fields = type === 'products' ? productFields : customerFields;

  const parseCSV = (text) => {
    const rows = text.split('\n').filter(r => r.trim());
    if (rows.length < 2) throw new Error(isSw ? 'Faili tupu au haina data' : 'Empty or invalid file');
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = [];
      let inQuote = false;
      let current = '';
      for (const ch of rows[i]) {
        if (ch === '"') { inQuote = !inQuote; continue; }
        if (ch === ',' && !inQuote) { cols.push(current.trim().replace(/"/g, '')); current = ''; continue; }
        current += ch;
      }
      cols.push(current.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });
      data.push(row);
    }
    return { headers, data };
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { headers, data } = parseCSV(ev.target.result);
        setHeaders(headers);
        setPreview(data.slice(0, 5));
        setStep(1);
      } catch (err) { setError(err.message); }
    };
    reader.onerror = () => setError(isSw ? 'Imeshindwa kusoma faili' : 'Failed to read file');
    reader.readAsText(f);
  };

  const handleImport = async () => {
    setImporting(true);
    setError('');
    try {
      const reader = new FileReader();
      const text = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Read failed'));
        reader.readAsText(file);
      });
      const { data } = parseCSV(text);

      if (type === 'products') {
        const products = data.map(r => ({
          shop_id: currentShop.id,
          name: r.name || r.product_name || '',
          category: r.category || '',
          buy_price: parseFloat(r.buy_price || r.buyprice || 0),
          sell_price: parseFloat(r.sell_price || r.sellprice || 0),
          stock: parseInt(r.stock || r.quantity || 0),
        })).filter(p => p.name && p.sell_price > 0);

        const chunkSize = 50;
        for (let i = 0; i < products.length; i += chunkSize) {
          const chunk = products.slice(i, i + chunkSize);
          const { error: insErr } = await supabase.from('products').insert(chunk);
          if (insErr) throw new Error(insErr.message);
        }
        onComplete?.(products.length);
      } else if (type === 'customers') {
        const customers = data.map(r => ({
          shop_id: currentShop.id,
          name: r.name || r.customer_name || '',
          phone: r.phone || r.phone_number || '',
          email: r.email || '',
          address: r.address || '',
        })).filter(c => c.name);

        const chunkSize = 50;
        for (let i = 0; i < customers.length; i += chunkSize) {
          const chunk = customers.slice(i, i + chunkSize);
          const { error: insErr } = await supabase.from('customers').insert(chunk);
          if (insErr) throw new Error(insErr.message);
        }
        onComplete?.(customers.length);
      }
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setImporting(false); }
  };

  const formatHeader = (h) => {
    for (const [key, label] of Object.entries(fields)) {
      if (h === key || h === key.replace('_', '') || h === (key === 'buy_price' ? 'buyprice' : key === 'sell_price' ? 'sellprice' : key)) return label;
    }
    return h;
  };

  return (
    <div style={{ marginTop: '14px' }}>
      <input type="file" ref={fileRef} onChange={handleFile} accept=".csv" style={{ display: 'none' }} />

      {step === 0 && (
        <div style={{
          border: `2px dashed ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px',
          padding: '28px', textAlign: 'center', cursor: 'pointer',
          background: isDarkMode ? 'rgba(30,41,59,0.5)' : 'rgba(248,250,252,0.8)',
        }} onClick={() => fileRef.current?.click()}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#94a3b8' : '#64748b'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          <p style={{ margin: '10px 0 4px', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
            {isSw ? 'Bonyeza kupakia CSV faili' : 'Click to upload CSV file'}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: isDarkMode ? '#64748b' : '#94a3b8' }}>
            {isSw ? `Safu: ${Object.values(fields).join(', ')}` : `Columns: ${Object.values(fields).join(', ')}`}
          </p>
          {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: '8px 0 0' }}>{error}</p>}
        </div>
      )}

      {step === 1 && (
        <div>
          <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '8px' }}>
            {isSw ? `Onyesho la kwanza: ${preview.length} kati ya jumla` : `Preview: first ${preview.length} rows`}
          </div>
          <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: isDarkMode ? '#334155' : '#f1f5f9' }}>
                  {headers.map((h, i) => (
                    <th key={i} style={{ padding: '8px 10px', textAlign: 'left', color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: '600' }}>
                      {formatHeader(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
                    {headers.map((h, ci) => (
                      <td key={ci} style={{ padding: '6px 10px', color: isDarkMode ? '#e2e8f0' : '#334155' }}>
                        {row[h] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setStep(0); setPreview([]); setHeaders([]); }}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: 'transparent', color: isDarkMode ? '#f1f5f9' : '#0f172a', cursor: 'pointer', fontWeight: '600' }}>
              {isSw ? 'Ghairi' : 'Cancel'}
            </button>
            <button onClick={handleImport} disabled={importing}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: '600', opacity: importing ? 0.6 : 1 }}>
              {importing ? (isSw ? 'Inapakia...' : 'Importing...') : (isSw ? 'Ingiza Data' : 'Import Data')}
            </button>
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: '8px 0 0' }}>{error}</p>}
        </div>
      )}

      {step === 2 && (
        <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p style={{ margin: '8px 0 0', color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: '600' }}>
            {isSw ? 'Imefanikiwa!' : 'Import Complete!'}
          </p>
          <button onClick={() => { setStep(0); setPreview([]); setHeaders([]); setFile(null); }}
            style={{ marginTop: '10px', padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            {isSw ? 'Ingiza Nyingine' : 'Import Another'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CSVImport;
