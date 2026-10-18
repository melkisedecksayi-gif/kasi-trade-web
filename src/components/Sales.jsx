import React, { useState, useEffect } from 'react';
import { THEME, getThemeColors } from '../theme';

const Sales = ({ supabase, lang, shopId, theme, showToast }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [recentSales, setRecentSales] = useState([]);

  const colors = getThemeColors(theme === 'dark');

  useEffect(() => {
    fetchProducts();
    fetchRecentSales();
  }, [shopId]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .gt('stock_quantity', 0);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast(lang === 'sw' ? 'Kikapu ni tupu!' : 'Cart is empty!', 'warning');
      return;
    }

    try {
      const totalAmount = calculateTotal();
      const receiptNumber = `RCP-${Date.now()}`;

      // Pre-check stock availability before creating the sale
      for (const item of cart) {
        const { data: fresh, error: checkError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.id)
          .single();

        if (checkError) throw checkError;
        if (fresh.stock_quantity < item.quantity) {
          showToast(
            lang === 'sw'
              ? `Hisa ya "${item.name}" imeisha! Ina ${fresh.stock_quantity} tu.`
              : `Insufficient stock for "${item.name}"! Only ${fresh.stock_quantity} left.`,
            'error'
          );
          return;
        }
      }

      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          shop_id: shopId,
          total_amount: totalAmount,
          receipt_number: receiptNumber,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
          }))
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Decrement stock with oversell protection:
      // re-read fresh stock, then update only if still sufficient (gte guard)
      const stockUpdates = [];
      for (const item of cart) {
        const { data: current } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.id)
          .single();

        const currentStock = current?.stock_quantity ?? 0;
        if (currentStock < item.quantity) {
          // Someone sold this between our pre-check and now — roll back the sale
          await supabase.from('sales').delete().eq('id', saleData.id);
          showToast(
            lang === 'sw'
              ? `"${item.name}" imeuzwa na mtu mwingine. Mauzo yamefutwa.`
              : `"${item.name}" was just sold by someone else. Sale rolled back.`,
            'error'
          );
          return;
        }

        stockUpdates.push({
          id: item.id,
          newStock: currentStock - item.quantity
        });
      }

      // All stock verified — apply decrements with gte guard as final safety net
      for (const update of stockUpdates) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: update.newStock })
          .eq('id', update.id)
          .gte('stock_quantity', cart.find(c => c.id === update.id).quantity);

        if (stockError) throw stockError;
      }

      showToast(
        lang === 'sw' ? `Mauzo yamekamilika! Risiti: ${receiptNumber}` : `Sale completed! Receipt: ${receiptNumber}`,
        'success'
      );
      setCart([]);
      setShowSalesForm(false);
      fetchProducts();
      fetchRecentSales();
    } catch (error) {
      console.error('Error completing sale:', error);
      showToast(lang === 'sw' ? 'Hitilafu ya kumalizia mauzo' : 'Error completing sale', 'error');
    }
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
          {lang === 'sw' ? 'Mauzo' : 'Sales'}
        </h2>
        <button
          onClick={() => setShowSalesForm(!showSalesForm)}
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
          {showSalesForm ? (lang === 'sw' ? 'Funga' : 'Close') : (lang === 'sw' ? '+ Mauzo Mapya' : '+ New Sale')}
        </button>
      </div>

      {showSalesForm && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Products List */}
          <div style={{
            background: colors.surface,
            padding: '20px',
            borderRadius: THEME.radius?.lg || '12px',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ margin: '0 0 16px', color: colors.text }}>
              {lang === 'sw' ? 'Bidhaa Zinazopatikana' : 'Available Products'}
            </h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {products.map(product => (
                <div
                  key={product.id}
                  style={{
                    padding: '12px',
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ color: colors.text, fontWeight: '600' }}>{product.name}</div>
                    <div style={{ color: colors.textSec, fontSize: '13px' }}>
                      {parseFloat(product.price).toLocaleString()} TSh | Stock: {product.stock_quantity}
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    style={{
                      padding: '6px 12px',
                      background: THEME.colors?.success || '#22c55e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    + {lang === 'sw' ? 'Ongeza' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div style={{
            background: colors.surface,
            padding: '20px',
            borderRadius: THEME.radius?.lg || '12px',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ margin: '0 0 16px', color: colors.text }}>
              {lang === 'sw' ? 'Kikapu' : 'Cart'} ({cart.length})
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: colors.textSec }}>
                  {lang === 'sw' ? 'Kikapu ni tupu' : 'Cart is empty'}
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      borderBottom: `1px solid ${colors.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ color: colors.text, fontWeight: '600' }}>{item.name}</div>
                      <div style={{ color: colors.textSec, fontSize: '13px' }}>
                        {parseFloat(item.price).toLocaleString()} TSh
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        -
                      </button>
                      <span style={{ color: colors.text, minWidth: '30px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          padding: '6px 10px',
                          background: THEME.colors?.error || '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginLeft: '8px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{
              padding: '16px',
              background: colors.bg,
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: colors.text }}>
                <span>{lang === 'sw' ? 'Jumla:' : 'Total:'}</span>
                <span>{calculateTotal().toLocaleString()} TSh</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              style={{
                width: '100%',
                padding: '14px',
                background: cart.length === 0 ? '#94a3b8' : THEME.colors?.success || '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: THEME.radius?.md || '8px',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '16px'
              }}
            >
              {lang === 'sw' ? 'Malizia Mauzo' : 'Complete Sale'}
            </button>
          </div>
        </div>
      )}

      {/* Recent Sales */}
      <div style={{
        background: colors.surface,
        borderRadius: THEME.radius?.lg || '12px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden'
      }}>
        <h3 style={{ margin: 0, padding: '20px', color: colors.text, borderBottom: `1px solid ${colors.border}` }}>
          {lang === 'sw' ? 'Mauzo ya Hivi Karibuni' : 'Recent Sales'}
        </h3>
        {recentSales.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: colors.textSec }}>
            {lang === 'sw' ? 'Hakuna mauzo bado' : 'No sales yet'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Risiti' : 'Receipt'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Tarehe' : 'Date'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Bidhaa' : 'Items'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Jumla' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(sale => (
                  <tr key={sale.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px', color: colors.text, fontFamily: 'monospace' }}>
                      #{sale.receipt_number}
                    </td>
                    <td style={{ padding: '12px', color: colors.text }}>
                      {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', color: colors.text }}>
                      {sale.items?.length || 0} {lang === 'sw' ? 'bidhaa' : 'items'}
                    </td>
                    <td style={{ padding: '12px', color: THEME.colors?.success || '#22c55e', fontWeight: 'bold', textAlign: 'right' }}>
                      {parseFloat(sale.total_amount).toLocaleString()} TSh
                    </td>
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

export default Sales;