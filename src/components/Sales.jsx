import React, { useState, useRef, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { translations } from '../translations';

const Sales = ({ supabase, lang = 'sw', t }) => {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { 
    if (inputRef.current) inputRef.current.focus(); 
  }, [cart.length, showReceipt]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcodeInput.trim())
      .single();

    if (error || !data) {
      alert(lang === 'sw' ? '❌ Bidhaa haipatikani!' : '❌ Product not found!');
      setBarcodeInput('');
      setLoading(false);
      return;
    }

    if (data.stock_quantity <= 0) {
      alert(lang === 'sw' ? '⚠️ Stock imeisha!' : '⚠️ Out of stock!');
      setBarcodeInput('');
      setLoading(false);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.barcode === data.barcode);
      if (existing) {
        return prev.map(item => 
          item.barcode === data.barcode 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...data, quantity: 1 }];
    });

    setBarcodeInput('');
    setLoading(false);
  };

  const removeFromCart = (barcode) => {
    setCart(prev => prev.filter(item => item.barcode !== barcode));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const totalAmount = cart.reduce((sum, item) => 
      sum + (item.selling_price * item.quantity), 0
    );

    const confirmMsg = lang === 'sw' 
      ? `✅ Thibitisha malipo? Jumla: TZS ${totalAmount.toLocaleString()}` 
      : `✅ Confirm payment? Total: TZS ${totalAmount.toLocaleString()}`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    const totalCost = cart.reduce((sum, item) => 
      sum + (item.cost_price * item.quantity), 0
    );
    const profit = totalAmount - totalCost;
    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'Admin';

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          total_amount: totalAmount,
          total_cost: totalCost,
          payment_method: 'cash',
          receipt_number: receiptNo
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock_quantity: item.stock_quantity - item.quantity })
          .eq('id', item.id);

        await supabase
          .from('sale_items')
          .insert([{
            sale_id: sale.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.selling_price,
            cost_price: item.cost_price,
            subtotal: item.selling_price * item.quantity
          }]);
      }

      setLastSale({ 
        ...sale, 
        items: cart, 
        date: new Date().toLocaleString(lang === 'sw' ? 'sw-TZ' : 'en-US'),
        user_email: userEmail,
        profit: profit
      });

      setShowReceipt(true);
      setCart([]);

    } catch (err) {
      alert(lang === 'sw' ? '❌ Hitilafu: ' + err.message : '❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-box, #receipt-box * { visibility: visible; }
          #receipt-box { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 80mm; 
            padding: 5mm; 
            font-size: 12px; 
            font-family: monospace;
            background: #fff;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <h2 className="no-print">🛒 POS - {t.sales || 'Sales'}</h2>

      <form 
        onSubmit={handleScan} 
        style={{ display: 'flex', gap: '10px', marginBottom: '20px' }} 
        className="no-print"
      >
        <input 
          ref={inputRef} 
          type="text" 
          value={barcodeInput} 
          onChange={(e) => setBarcodeInput(e.target.value)} 
          placeholder={t.scanBarcode || 'Scan barcode or type here...'} 
          style={{ 
            flex: 1, 
            padding: '14px', 
            fontSize: '16px', 
            border: '2px solid #007bff', 
            borderRadius: '8px', 
            fontFamily: 'monospace' 
          }} 
          autoFocus 
        />
        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            padding: '14px 24px', 
            background: '#007bff', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 'bold' 
          }}
        >
          {loading ? (lang === 'sw' ? 'Inatafuta...' : 'Searching...') : (t.addToCart || '➕ Add')}
        </button>
      </form>

      <div 
        style={{ 
          background: '#fff', 
          padding: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
        }} 
        className="no-print"
      >
        <h3>🧾 {t.cart || 'Cart'} ({cart.length} {t.items || 'items'})</h3>

        {cart.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            {t.emptyCart || 'Cart is empty. Scan barcode to start...'}
          </p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{padding:'8px 0'}}>{t.productName || 'Product'}</th>
                  <th style={{textAlign:'right'}}>{t.sellingPrice || 'Price'}</th>
                  <th style={{textAlign:'center'}}>Qty</th>
                  <th style={{textAlign:'right'}}>{lang === 'sw' ? 'Jumla' : 'Subtotal'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.barcode} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{padding:'8px 0'}}>{item.name}</td>
                    <td style={{textAlign:'right'}}>{item.selling_price?.toLocaleString()}</td>
                    <td style={{textAlign:'center'}}>{item.quantity}</td>
                    <td style={{textAlign:'right'}}>{(item.selling_price * item.quantity)?.toLocaleString()}</td>
                    <td>
                      <button 
                        onClick={() => removeFromCart(item.barcode)} 
                        style={{ 
                          background: '#ef4444', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: '4px', 
                          padding: '4px 8px', 
                          cursor: 'pointer' 
                        }}
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', borderTop: '2px solid #eee', paddingTop: '15px' }}>
              <h3 style={{margin:'0 0 15px'}}>
                {t.total || 'Grand Total'}: TZS {cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0)?.toLocaleString()}
              </h3>
              <button 
                onClick={handleCheckout} 
                disabled={loading} 
                style={{ 
                  padding: '14px 30px', 
                  background: '#22c55e', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '16px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold' 
                }}
              >
                {loading ? (lang === 'sw' ? 'Inachakata...' : 'Processing...') : (t.checkout || '✅ Checkout')}
              </button>
            </div>
          </>
        )}
      </div>

      {showReceipt && lastSale && (
        <div 
          id="receipt-box" 
          style={{ 
            background: '#fff', 
            padding: '15px', 
            maxWidth: '300px', 
            margin: '20px auto', 
            fontFamily: 'monospace', 
            fontSize: '13px', 
            lineHeight: '1.5', 
            border: '1px dashed #ccc', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
          }}
        >
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
            <h3 style={{ margin: '0 0 5px', fontSize: '16px' }}>🏪 KasiTRADE Web</h3>
            <p style={{ margin: '0', fontSize: '11px' }}>POS: 01 | Cashier: {lastSale.user_email || 'Admin'}</p>
            <p style={{ margin: '5px 0 0', fontSize: '11px' }}>{lastSale.date}</p>
            <p style={{ margin: '2px 0', fontWeight: 'bold', fontSize: '14px' }}>#{lastSale.receipt_number}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '12px' }}>
            <tbody>
              {lastSale.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'left', paddingRight: '5px', verticalAlign: 'top' }}>
                    {item.name}
                    <div style={{fontSize:'10px', color:'#666'}}>
                      {item.quantity} x {item.selling_price.toLocaleString()}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                    {(item.quantity * item.selling_price).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', textAlign: 'right' }}>
            <p style={{ margin: '2px 0', fontSize: '14px' }}>
              {lang === 'sw' ? 'Jumla:' : 'Total:'} 
              <b style={{marginLeft:'5px'}}>TZS {lastSale.total_amount.toLocaleString()}</b>
            </p>
            <p style={{ margin: '2px 0', fontSize: '11px', color: '#22c55e' }}>
              {lang === 'sw' ? 'Faida:' : 'Profit:'} TZS {(lastSale.profit || 0).toLocaleString()}
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '15px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
            <p style={{ margin: '0', fontSize: '12px' }}>
              🙏 {lang === 'sw' ? 'Asante kwa kununua!' : 'Thank you for shopping!'}
            </p>
            <p style={{ margin: '5px 0 0', fontSize: '10px', color: '#666' }}>--- KasiTRADE POS ---</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '15px', display: 'flex', gap: '8px', justifyContent: 'center' }} className="no-print">
            <button 
              onClick={handlePrint} 
              style={{ 
                padding: '10px 16px', 
                background: '#3b82f6', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                flex: 1 
              }}
            >
              🖨️ Print / PDF
            </button>
            <button 
              onClick={() => { setShowReceipt(false); setLastSale(null); }} 
              style={{ 
                padding: '10px 16px', 
                background: '#6b7280', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                flex: 1 
              }}
            >
              ✕ Funga
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;