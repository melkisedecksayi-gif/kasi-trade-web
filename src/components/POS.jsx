import React, { useState, useEffect } from 'react';
import CI from './ColoredIcons';
import { Icons } from './Icons';
import { getCategoryIcon } from '../data/categoryIcons';
import { playSaleBeep } from '../utils/sound';
import { printReceipt } from '../utils/print';
import { sendSMS } from '../services/smsService';
import { sendReceiptEmail } from '../services/emailService';
import getStyles from '../stylePresets';

const POS = ({ lang, supabase, currentShop, isDarkMode, theme }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notify, setNotify] = useState(null);
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState('');
  const [emailSettings, setEmailSettings] = useState({});
  const isSw = lang === 'sw';
  const th = getStyles(isDarkMode).t;

  useEffect(() => {
    if (currentShop?.id) fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentShop]);

  useEffect(() => {
    if (currentShop?.id) {
      supabase.from('email_settings').select('receipt_template_id, service_id, public_key').eq('shop_id', currentShop.id).maybeSingle().then(({ data }) => {
        setEmailSettings(data || {});
      }).catch(() => {});
    }
  }, [currentShop?.id, supabase]);

  useEffect(() => {
    if (!showCheckout && !notify) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showCheckout) setShowCheckout(false);
        if (notify) setNotify(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showCheckout, notify]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products').select('*').eq('shop_id', currentShop.id).order('created_at', { ascending: false });
      if (!error && data) setProducts(data);
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        if (newQuantity > item.stock) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item !== null));
  };

  const removeFromCart = (productId) => setCart(cart.filter(item => item.id !== productId));
  const getTotal = () => cart.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);

  const getDiscountAmount = () => {
    const val = parseFloat(discountValue) || 0;
    if (val <= 0 || discountType === 'none') return 0;
    if (discountType === 'percentage') return Math.round(getTotal() * (val / 100));
    return val;
  };

  const getFinalTotal = () => Math.max(0, getTotal() - getDiscountAmount());

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const phone = customerPhone.trim();
    const discount = getDiscountAmount();
    const finalTotal = getFinalTotal();
    try {
      const total = finalTotal;
      const subtotal = getTotal();
      const profit = cart.reduce((sum, item) => sum + ((item.sell_price - item.buy_price) * item.quantity), 0) - discount;
      const { error: transactionError } = await supabase.from('transactions').insert([{
        shop_id: currentShop.id, total_amount: total, profit: profit, discount: discount,
        payment_method: paymentMethod, items_count: cart.reduce((sum, item) => sum + item.quantity, 0)
      }]).select().single();
      if (transactionError) throw transactionError;
      playSaleBeep();
      for (const item of cart) {
        await supabase.from('products').update({ stock: item.stock - item.quantity }).eq('id', item.id);
      }
      const receiptData = { items: [...cart], total: finalTotal, subtotal: subtotal, discount: discount, discountType: discountType, date: new Date().toISOString() };
      setNotify({ msg: lang === 'sw' ? 'Mauzo Yamefanikiwa!' : 'Sale Completed!', type: 'success', total: finalTotal, receipt: receiptData });

      const soldItems = [...cart];
      const soldTotal = total;
      setCart([]); setShowCheckout(false); setCustomerPhone(''); setCustomerEmail(''); setDiscountType('none'); setDiscountValue(''); fetchProducts();

      if (phone) {
        const itemsList = soldItems.map(i => `${i.quantity}x ${i.name} TSh ${(i.sell_price * i.quantity).toLocaleString()}`).join(', ');
        const smsMsg = `${isSw ? 'Asante kwa ununuzi wako!' : 'Thank you for your purchase!'}\n${currentShop?.shop_name || 'KasiTRADE'}\n${itemsList}\n${isSw ? 'Jumla' : 'Total'}: TSh ${soldTotal.toLocaleString()}\n${isSw ? 'Karibu tena!' : 'Welcome again!'}`;
        sendSMS({ to: phone, message: smsMsg }).catch(() => {});
      }

      const custEmail = customerEmail.trim();
      if (custEmail && emailSettings?.receipt_template_id) {
        sendReceiptEmail({
          email: custEmail,
          transaction: { items: soldItems, total_amount: soldTotal, payment_method: paymentMethod, created_at: new Date().toISOString() },
          shopName: currentShop?.shop_name || 'KasiTRADE',
          lang,
          publicKey: emailSettings.public_key,
          serviceId: emailSettings.service_id,
          templateId: emailSettings.receipt_template_id,
        }).catch(() => {});
      }
    } catch (err) {
      setNotify({ msg: err.message || (lang === 'sw' ? 'Hitilafu imetokea' : 'Error occurred'), type: 'error', total: 0 });
      if (phone) {
        const failMsg = `${isSw ? 'Samahani, malipo yameshindikana.' : 'Sorry, payment failed.'}\n${currentShop?.shop_name || 'KasiTRADE'}\n${isSw ? 'Tafadhali wasiliana nasi.' : 'Please contact us.'}`;
        sendSMS({ to: phone, message: failMsg }).catch(() => {});
      }
    }
  };

  const filteredProducts = products.filter(p => p.name?.toLowerCase()?.includes(searchQuery.toLowerCase()));

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount || 0);

  return (
    <div style={{ background: th.bg || '#0f172a', minHeight: 'calc(100vh - 80px)' }}>
      <style>{`
        .pos-layout { display: grid; grid-template-columns: 1fr 380px; gap: 20px; }
        @media (max-width: 768px) {
          .pos-layout { grid-template-columns: 1fr; }
          .pos-cart { max-height: 45vh; border-radius: 16px 16px 0 0; position: sticky; bottom: 0; }
        }
        @media (max-width: 480px) {
          .pos-cart { max-height: 40vh; box-shadow: 0 -4px 20px rgba(0,0,0,0.3); }
        }
      `}</style>

      <div className="pos-layout">
        {/* Products Section */}
        <div>
          <div className="input-group mb-lg">
            <span className="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="text" className="input" style={{ paddingLeft: '42px' }}
              placeholder={isSw ? 'Tafuta bidhaa...' : 'Search products...'}
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex flex-col gap-md">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '12px' }} />)}
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: '6px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {filteredProducts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><CI.Package size={32} /></div>
                  <p className="empty-state-title">{isSw ? 'Hakuna bidhaa' : 'No products'}</p>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div key={product.id} className="card card-interactive" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '12px', gap: '12px',
                    opacity: product.stock > 0 ? 1 : 0.5, cursor: product.stock > 0 ? 'pointer' : 'not-allowed'
                  }} onClick={() => addToCart(product)}>
                    <div className="flex items-center" style={{ gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: getCategoryIcon(product.category || 'other').color + '18',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {getCategoryIcon(product.category || 'other', 20).icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="text-small" style={{ fontWeight: 600, color: th.text || '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.name}
                        </div>
                        <div className="flex items-center" style={{ gap: '8px', marginTop: '2px' }}>
                          <span className="text-micro" style={{ color: product.stock < 10 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                            {isSw ? 'Hisa:' : 'Stock:'} {product.stock}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center" style={{ gap: '12px', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, color: '#6366f1', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        TSh {product.sell_price?.toLocaleString()}
                      </span>
                      <button className="btn btn-primary btn-sm" style={{ padding: '6px 14px', borderRadius: '8px' }}
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        disabled={product.stock <= 0}>
                        {isSw ? 'Ongeza' : 'Add'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Cart Panel — Figma Premium */}
        <div className="pos-cart" style={{
          borderRadius: '20px', overflow: 'hidden', position: 'sticky', top: '20px',
          height: 'fit-content', maxHeight: 'calc(100vh - 120px)', display: 'flex',
          flexDirection: 'column', background: th.surface || '#1e293b',
          border: `1px solid ${th.border || '#334155'}`,
          boxShadow: th.shadow?.lg || '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          {/* Cart Header */}
          <div style={{
            padding: '18px 20px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))',
            borderBottom: `1px solid ${th.border || '#334155'}`
          }}>
            <div className="flex items-center" style={{ gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
              }}>
                <Icons.ShoppingCart size={18} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: th.text || '#f1f5f9', letterSpacing: '-0.2px' }}>
                  {isSw ? 'Kikapu' : 'Cart'}
                </h3>
                {cart.length > 0 && (
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: th.textSecondary || '#475569' }}>
                    {cart.reduce((s, i) => s + i.quantity, 0)} {isSw ? 'vipengee' : 'items'}
                  </p>
                )}
              </div>
            </div>
            {cart.length > 0 && (
              <span className="badge" style={{
                background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                padding: '4px 10px', fontSize: '11px', fontWeight: 700
              }}>
                {cart.length}
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            /* Empty State */
            <div style={{ padding: '56px 24px', textAlign: 'center', flex: 1 }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(99,102,241,0.06)', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <Icons.ShoppingCart size={32} color={th.textSecondary || '#64748b'} />
              </div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: th.text || '#f1f5f9', margin: '0 0 4px' }}>
                {isSw ? 'Kikapu ni tupu' : 'Cart is empty'}
              </p>
              <p style={{ fontSize: '12px', color: th.textSecondary || '#64748b', margin: 0, lineHeight: 1.5 }}>
                {isSw ? 'Bonyeza bidhaa upande wa kushoto' : 'Tap products on the left'}
                <br />{isSw ? 'kuongeza kwenye kikapu' : 'to add to your cart'}
              </p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div style={{ padding: '8px 14px', flex: 1, overflowY: 'auto', maxHeight: '320px' }}>
                {cart.map((item, idx) => {
                  const catIcon = getCategoryIcon(item.category || 'other', 14);
                  return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 8px', borderBottom: idx < cart.length - 1 ? `1px solid ${th.borderMuted || 'rgba(148,163,184,0.08)'}` : 'none'
                  }}>
                    {/* Category Mini Icon */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: catIcon.color + '15', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {catIcon.icon}
                    </div>

                    {/* Item Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: th.text || '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: th.textSecondary || '#64748b', fontFamily: "'Inter', sans-serif", marginTop: '1px' }}>
                        TSh {item.sell_price?.toLocaleString()}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '1px',
                      background: th.surfaceHover || '#f1f5f9', borderRadius: '8px', padding: '2px'
                    }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{
                        width: '34px', height: '34px', border: 'none', borderRadius: '8px',
                        background: 'transparent', color: th.textSecondary || '#64748b',
                        cursor: 'pointer', fontSize: '18px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>−</button>
                      <span style={{
                        width: '28px', textAlign: 'center', fontSize: '13px',
                        fontWeight: 700, color: th.text || '#f1f5f9'
                      }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{
                        width: '34px', height: '34px', border: 'none', borderRadius: '8px',
                        background: 'transparent', color: '#6366f1',
                        cursor: 'pointer', fontSize: '18px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>+</button>
                    </div>

                    {/* Line Total */}
                    <div style={{ width: '70px', textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: th.text || '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
                        {(item.sell_price * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    {/* Remove */}
                    <button onClick={() => removeFromCart(item.id)} style={{
                      width: '24px', height: '24px', borderRadius: '6px', border: 'none',
                      background: 'transparent', color: th.textTertiary || '#64748b',
                      cursor: 'pointer', fontSize: '14px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                       onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = th.textTertiary || '#64748b'; }}>
                      &times;
                    </button>
                  </div>
                )})}
              </div>

              {/* Summary & Checkout */}
              <div style={{
                padding: '16px 18px',
                background: isDarkMode ? 'rgba(15,23,42,0.5)' : 'rgba(248,250,252,0.8)',
                borderTop: `2px solid ${th.border || '#334155'}`
              }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: th.textSecondary || '#64748b' }}>
                    {isSw ? 'Jumla Ndogo' : 'Subtotal'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: th.text || '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
                    TSh {getTotal().toLocaleString()}
                  </span>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    <button onClick={() => setDiscountType('none')} style={{
                      padding: '3px 8px', borderRadius: '6px', border: discountType === 'none' ? '1px solid #6366f1' : `1px solid ${th.border || '#334155'}`,
                      background: discountType === 'none' ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: discountType === 'none' ? '#6366f1' : (th.textSecondary || '#64748b'),
                      fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                    }}>{isSw ? 'Hakuna' : 'None'}</button>
                    <button onClick={() => setDiscountType('percentage')} style={{
                      padding: '3px 8px', borderRadius: '6px', border: discountType === 'percentage' ? '1px solid #6366f1' : `1px solid ${th.border || '#334155'}`,
                      background: discountType === 'percentage' ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: discountType === 'percentage' ? '#6366f1' : (th.textSecondary || '#64748b'),
                      fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                    }}>%</button>
                    <button onClick={() => setDiscountType('amount')} style={{
                      padding: '3px 8px', borderRadius: '6px', border: discountType === 'amount' ? '1px solid #6366f1' : `1px solid ${th.border || '#334155'}`,
                      background: discountType === 'amount' ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: discountType === 'amount' ? '#6366f1' : (th.textSecondary || '#64748b'),
                      fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                    }}>TSh</button>
                    {discountType !== 'none' && (
                      <input type="number" min="0" value={discountValue}
                        onChange={e => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percentage' ? '%' : '0'}
                        style={{
                          width: '70px', padding: '3px 6px', borderRadius: '6px', border: `1px solid ${th.border || '#334155'}`,
                          background: isDarkMode ? '#1e293b' : '#fff', color: th.text || '#f1f5f9', fontSize: '12px', textAlign: 'center'
                        }} />
                    )}
                  </div>
                </div>

                {getDiscountAmount() > 0 && (
                  <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#ef4444' }}>
                      {isSw ? 'Punguzo' : 'Discount'}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', fontFamily: "'Inter', sans-serif" }}>
                      -TSh {getDiscountAmount().toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center" style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: th.text || '#f1f5f9' }}>
                    {isSw ? 'JUMLA' : 'TOTAL'}
                  </span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.5px', fontFamily: "'Inter', sans-serif" }}>
                    TSh {getFinalTotal().toLocaleString()}
                  </span>
                </div>
                <button onClick={() => setShowCheckout(true)} style={{
                  width: '100%', padding: '14px', border: 'none', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(16,185,129,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  letterSpacing: '0.2px',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Inter', sans-serif"
                }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {isSw ? 'Lipa Sasa' : 'Checkout'} — TSh {getFinalTotal().toLocaleString()}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{lang === 'sw' ? 'Chagua Njia ya Malipo' : 'Select Payment Method'}</h3>
              <button className="modal-close" onClick={() => setShowCheckout(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="payment-methods" style={{ flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'cash', icon: <CI.Money size={20} />, label: isSw ? 'Fedha Taslimu' : 'Cash' },
                { key: 'mobile', icon: <CI.Mobile size={20} />, label: isSw ? 'Simu ya Mkononi' : 'Mobile Money' },
                { key: 'card', icon: <CI.CreditCard size={20} />, label: isSw ? 'Kadi ya Benki' : 'Bank Card' },
              ].map(method => (
                <button key={method.key}
                  onClick={() => setPaymentMethod(method.key)}
                  className={`payment-method ${paymentMethod === method.key ? 'selected' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '14px 16px' }}>
                  {method.icon}
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{method.label}</span>
                </button>
              ))}
            </div>

            <div style={{
              marginTop: '16px', padding: '14px', borderRadius: '12px',
              background: isDarkMode ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)',
              border: `1px solid ${th.border || '#334155'}`
            }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: th.textSecondary || '#64748b' }}>{isSw ? 'Jumla Ndogo' : 'Subtotal'}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: th.text || '#f1f5f9' }}>TSh {getTotal().toLocaleString()}</span>
              </div>
              {getDiscountAmount() > 0 && (
                <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#ef4444' }}>{isSw ? 'Punguzo' : 'Discount'}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>-TSh {getDiscountAmount().toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center" style={{ marginTop: '6px', paddingTop: '8px', borderTop: `1px solid ${th.border || '#334155'}` }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: th.text || '#f1f5f9' }}>{isSw ? 'JUMLA' : 'TOTAL'}</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#6366f1' }}>TSh {getFinalTotal().toLocaleString()}</span>
              </div>
              <div style={{ marginTop: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                {cart.map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11px', color: th.textSecondary || '#64748b' }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.quantity}x {item.name}</span>
                    <span style={{ marginLeft: '8px', whiteSpace: 'nowrap' }}>TSh {(item.sell_price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col" style={{ gap: '4px', marginTop: '12px' }}>
              <label className="text-small" style={{ fontWeight: 600, color: th.text || '#f1f5f9' }}>
                {isSw ? 'Namba ya Mteja (si lazima)' : 'Customer Phone (optional)'}
              </label>
              <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                className="input" placeholder="255XXXXXXXXX" />
            </div>
            <div className="flex flex-col" style={{ gap: '4px', marginTop: '8px' }}>
              <label className="text-small" style={{ fontWeight: 600, color: th.text || '#f1f5f9' }}>
                {isSw ? 'Email ya Mteja (si lazima)' : 'Customer Email (optional)'}
              </label>
              <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                className="input" placeholder="customer@example.com" />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCheckout(false)}>
                {lang === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>
              <button className="btn btn-success" onClick={handleCheckout}>
                {lang === 'sw' ? 'Thibitisha Malipo' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Notification */}
      {notify && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setNotify(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#1e293b', borderRadius: '24px', padding: '36px 44px 24px',
            textAlign: 'center', maxWidth: '380px', width: '90%', overflow: 'hidden',
            border: `1px solid ${notify.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'fadeInScale 0.35s ease'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
              background: notify.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${notify.type === 'success' ? '#10b981' : '#ef4444'}`
            }}>
              {notify.type === 'success' ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '800', color: '#f1f5f9' }}>{notify.msg}</h2>
            {notify.total > 0 && (
              <p style={{ margin: '0 0 16px', fontSize: '28px', fontWeight: '800', color: '#10b981' }}>
                {formatCurrency(notify.total)}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn" onClick={() => setNotify(null)} style={{
                padding: '10px 32px', borderRadius: '12px', background: notify.type === 'success' ? '#10b981' : '#ef4444',
                color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none'
              }}>OK</button>
              {notify.receipt && (
                <button className="btn" onClick={() => {
                  printReceipt({
                    items: notify.receipt.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.sell_price * i.quantity })),
                    total: notify.receipt.total, date: notify.receipt.date,
                    shopName: currentShop?.shop_name || 'KasiTRADE'
                  });
                }} style={{
                  padding: '10px 32px', borderRadius: '12px', background: 'transparent',
                  border: '2px solid #10b981', color: '#10b981', fontWeight: 700, fontSize: '14px'
                }}>
                  {lang === 'sw' ? 'Chapisha Risiti' : 'Print Receipt'}
                </button>
              )}
            </div>
            <div style={{
              width: '100%', height: '4px', background: '#334155', borderRadius: '2px',
              marginTop: '20px', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', background: notify.type === 'success' ? '#10b981' : '#ef4444',
                borderRadius: '2px', animation: 'shrinkBar 3s linear forwards'
              }} />
            </div>
            <style>{`
              @keyframes shrinkBar { from { width: 100%; } to { width: 0%; } }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
