import React, { useState, useEffect, useRef } from 'react';
import CI from './ColoredIcons';
import { Icons } from './Icons';
import { getCategoryIcon } from '../data/categoryIcons';
import { playSaleBeep } from '../utils/sound';
import { printReceipt } from '../utils/print';
import { sendSMS } from '../services/smsService';
import { sendReceiptEmail } from '../services/emailService';
import getStyles from '../stylePresets';
import logger from '../utils/logger';

const CATEGORIES = [
  { key: 'all', labelSw: 'Zote', labelEn: 'All', color: '#6366f1' },
  { key: 'food', labelSw: 'Vyakula', labelEn: 'Food', color: '#ef4444' },
  { key: 'drinks', labelSw: 'Vinywaji', labelEn: 'Drinks', color: '#3b82f6' },
  { key: 'clothing', labelSw: 'Mavazi', labelEn: 'Clothing', color: '#8b5cf6' },
  { key: 'electronics', labelSw: 'Elektroniki', labelEn: 'Electronics', color: '#06b6d4' },
  { key: 'home', labelSw: 'Nyumbani', labelEn: 'Home', color: '#f59e0b' },
  { key: 'beauty', labelSw: 'Uzuri', labelEn: 'Beauty', color: '#d946ef' },
  { key: 'other', labelSw: 'Nyingine', labelEn: 'Other', color: '#64748b' },
];

const POS = ({ lang, supabase, currentShop, isDarkMode, theme }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notify, setNotify] = useState(null);
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState('');
  const [emailSettings, setEmailSettings] = useState({});
  const [processing, setProcessing] = useState(false);
  const searchRef = useRef(null);
  const checkoutRef = useRef(null);
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
      if (e.key === 'Enter' && showCheckout && cart.length > 0) checkoutRef.current?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showCheckout, notify, cart.length]);

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (showCheckout || notify) return;
      if (e.key === 'F1' && cart.length > 0) { e.preventDefault(); setShowCheckout(true); }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [showCheckout, notify, cart.length]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products').select('*').eq('shop_id', currentShop.id).order('created_at', { ascending: false });
      if (!error && data) setProducts(data);
    } catch (err) { logger.error('POS', 'Error:', err); }
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
  const clearCart = () => setCart([]);
  const getTotal = () => cart.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);

  const getDiscountAmount = () => {
    const val = parseFloat(discountValue) || 0;
    if (val <= 0 || discountType === 'none') return 0;
    if (discountType === 'percentage') return Math.round(getTotal() * (val / 100));
    return val;
  };

  const getFinalTotal = () => Math.max(0, getTotal() - getDiscountAmount());

  const handleCheckout = async () => {
    if (cart.length === 0 || processing) return;
    setProcessing(true);
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
    finally { setProcessing(false); }
  };
  checkoutRef.current = handleCheckout;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase()?.includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory || (!p.category && activeCategory === 'other');
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = {};
  products.forEach(p => {
    const cat = p.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount || 0);

  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ background: th.bg || '#0f172a', minHeight: 'calc(100vh - 80px)', animation: 'fadeIn 0.3s ease' }}>
      <style>{`
        .pos-layout { display: grid; grid-template-columns: 1fr 380px; gap: 20px; align-items: start; }
        @media (max-width: 1024px) {
          .pos-layout { grid-template-columns: 1fr 340px; gap: 16px; }
        }
        @media (max-width: 768px) {
          .pos-layout { grid-template-columns: 1fr; gap: 0; }
          .pos-cart-fixed { position: fixed !important; bottom: 0; left: 0; right: 0; z-index: 100; border-radius: 20px 20px 0 0 !important; max-height: 55vh !important; }
          .pos-cart-collapsed { max-height: 64px !important; }
          .pos-cart-toggle { display: flex !important; }
        }
        .cat-pill {
          padding: 7px 14px; border-radius: 20px; border: none; cursor: pointer;
          font-size: 12px; font-weight: 600; white-space: nowrap;
          transition: all 0.2s ease; font-family: 'Inter', sans-serif;
        }
        .product-card {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 14px; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid transparent;
        }
        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .product-card-disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
        .product-card-disabled:hover { transform: none; box-shadow: none; }
        .stock-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .checkout-payment-option {
          display: flex; align-items: center; gap: 14px; padding: 14px 16px;
          border-radius: 14px; cursor: pointer; border: 2px solid transparent;
          transition: all 0.2s ease; text-align: left; width: 100%;
          background: transparent;
        }
        .checkout-payment-option:hover { border-color: rgba(99,102,241,0.3); }
        .checkout-payment-option.selected { border-color: #6366f1; background: rgba(99,102,241,0.06); }
      `}</style>

      <div className="pos-layout">
        {/* Products Section */}
        <div>
          {/* Search Bar */}
          <div className="input-group" style={{ marginBottom: '14px' }}>
            <span className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input ref={searchRef} type="text" className="input" style={{ paddingLeft: '44px', fontSize: '14px' }}
              placeholder={isSw ? '🔍 Tafuta bidhaa... (au soma barcode)' : '🔍 Search products... (or scan barcode)'}
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus />
          </div>

          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.key;
              return (
                <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className="cat-pill" style={{
                  background: active ? cat.color : (isDarkMode ? 'rgba(51,65,85,0.4)' : 'rgba(226,232,240,0.5)'),
                  color: active ? '#fff' : 'var(--text-secondary)',
                  boxShadow: active ? `0 2px 8px ${cat.color}44` : 'none',
                }}>
                  {cat.key === 'all' ? (isSw ? cat.labelSw : cat.labelEn) : (isSw ? cat.labelSw : cat.labelEn)}
                  {cat.key === 'all' ? ` (${products.length})` : categoryCounts[cat.key] ? ` (${categoryCounts[cat.key]})` : ''}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '64px', borderRadius: '14px' }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingBottom: '8px' }}>
              {filteredProducts.length === 0 ? (
                <div className="empty-state" style={{ padding: '60px 20px' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', marginBottom: '16px',
                    background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <CI.Package size={36} />
                  </div>
                  <p className="empty-state-title">{isSw ? 'Hakuna bidhaa' : 'No products found'}</p>
                  <p className="empty-state-text" style={{ margin: 0 }}>
                    {searchQuery
                      ? (isSw ? `Hakuna matokeo kwa "${searchQuery}"` : `No results for "${searchQuery}"`)
                      : (isSw ? 'Bonyeza "Ongeza Bidhaa" kuongeza bidhaa mpya' : 'Click "Add Product" to add new products')}
                  </p>
                </div>
              ) : (
                filteredProducts.map((product, idx) => {
                  const catIcon = getCategoryIcon(product.category || 'other', 20);
                  const isLowStock = product.stock > 0 && product.stock < 10;
                  const isOutOfStock = product.stock <= 0;
                  const inCart = cart.find(c => c.id === product.id);
                  return (
                    <div key={product.id}
                      className={`product-card ${isOutOfStock ? 'product-card-disabled' : ''}`}
                      style={{
                        background: isDarkMode ? (inCart ? 'rgba(99,102,241,0.08)' : 'rgba(30,41,59,0.5)') : (inCart ? 'rgba(99,102,241,0.04)' : '#fff'),
                        borderColor: inCart ? 'rgba(99,102,241,0.3)' : 'var(--border)',
                        animation: `fadeInUp 0.3s ease ${idx * 0.02}s both`
                      }}
                      onClick={() => addToCart(product)}
                    >
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: catIcon.color + '15', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        border: `1px solid ${catIcon.color}20`
                      }}>
                        {catIcon.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: th.text || '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {product.name}
                          </span>
                          {inCart && (
                            <span style={{
                              background: '#6366f1', color: '#fff', fontSize: '10px', fontWeight: 700,
                              padding: '2px 7px', borderRadius: '10px', flexShrink: 0
                            }}>
                              {inCart.quantity}x
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                          <div className={`stock-dot ${isOutOfStock ? '' : isLowStock ? '' : ''}`} style={{
                            background: isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : '#10b981',
                            boxShadow: `0 0 6px ${isOutOfStock ? '#ef444466' : isLowStock ? '#f59e0b66' : '#10b98166'}`
                          }} />
                          <span style={{ fontSize: '11px', color: isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                            {isOutOfStock ? (isSw ? 'Imekwisha' : 'Out of stock') : isLowStock ? `${isSw ? 'Chache:' : 'Low:'} ${product.stock}` : `${isSw ? 'Hisa:' : 'Stock:'} ${product.stock}`}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, color: '#6366f1', fontSize: '14px', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                          TSh {product.sell_price?.toLocaleString()}
                        </span>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '12px' }}
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          disabled={product.stock <= 0}
                        >
                          {isSw ? 'Ongeza' : 'Add'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Cart Panel */}
        <div className="pos-cart" style={{
          borderRadius: '20px', overflow: 'hidden', position: 'sticky', top: '20px',
          height: 'fit-content', maxHeight: 'calc(100vh - 120px)', display: 'flex',
          flexDirection: 'column', background: th.surface || '#1e293b',
          border: `1px solid ${th.border || '#334155'}`,
          boxShadow: th.shadow?.lg || '0 8px 24px rgba(0,0,0,0.12)',
          transition: 'all 0.3s ease'
        }}>
          {cart.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', flex: 1 }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed rgba(99,102,241,0.15)'
              }}>
                <Icons.ShoppingCart size={36} color="var(--text-tertiary)" />
              </div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: th.text || '#f1f5f9', margin: '0 0 6px' }}>
                {isSw ? 'Kikapu ni tupu' : 'Cart is empty'}
              </p>
              <p style={{ fontSize: '12px', color: th.textSecondary || '#64748b', margin: 0, lineHeight: 1.6 }}>
                {isSw ? 'Bonyeza bidhaa kuongeza' : 'Tap a product to add it'}
                <br />{isSw ? 'kwenye kikapu chako' : 'to your cart'}
              </p>
              <div style={{ marginTop: '16px' }}>
                <kbd style={{
                  padding: '4px 10px', borderRadius: '6px', background: 'rgba(148,163,184,0.1)',
                  fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)',
                  border: '1px solid var(--border-muted)'
                }}>
                  {isSw ? 'Bofya bidhaa kuongeza' : 'Click product to add'}
                </kbd>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Header */}
              <div style={{
                padding: '16px 18px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))',
                borderBottom: `1px solid ${th.border || '#334155'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
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
                    <p style={{ margin: '1px 0 0', fontSize: '11px', color: th.textSecondary || '#64748b' }}>
                      {cartItemCount} {isSw ? 'vipengee' : 'items'} · {cart.length} {isSw ? 'bidhaa' : 'products'}
                    </p>
                  </div>
                </div>
                <button onClick={clearCart} style={{
                  background: 'transparent', border: 'none', color: '#ef4444', fontSize: '11px',
                  fontWeight: 600, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Icons.Trash size={14} color="#ef4444" />
                  {isSw ? 'Futa' : 'Clear'}
                </button>
              </div>

              {/* Cart Items */}
              <div style={{ padding: '6px 12px', flex: 1, overflowY: 'auto', maxHeight: '340px' }}>
                {cart.map((item, idx) => {
                  const catIcon = getCategoryIcon(item.category || 'other', 14);
                  return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 8px', borderBottom: idx < cart.length - 1 ? `1px solid ${th.border || 'rgba(148,163,184,0.08)'}` : 'none',
                    animation: `fadeInRight 0.25s ease ${idx * 0.05}s both`
                  }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: catIcon.color + '15', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      border: `1px solid ${catIcon.color}20`
                    }}>
                      {catIcon.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: th.text || '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: th.textSecondary || '#64748b', fontFamily: "'Inter', sans-serif", marginTop: '2px' }}>
                        TSh {item.sell_price?.toLocaleString()} &times; {item.quantity}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: isDarkMode ? 'rgba(15,23,42,0.5)' : 'rgba(241,245,249,0.8)', borderRadius: '10px', padding: '2px' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{
                        width: '32px', height: '32px', border: 'none', borderRadius: '8px',
                        background: 'transparent', color: th.textSecondary || '#64748b',
                        cursor: 'pointer', fontSize: '16px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}>−</button>
                      <span style={{ width: '26px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: th.text || '#f1f5f9' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{
                        width: '32px', height: '32px', border: 'none', borderRadius: '8px',
                        background: 'transparent', color: '#6366f1',
                        cursor: 'pointer', fontSize: '16px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}>+</button>
                    </div>

                    <div style={{ width: '70px', textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: th.text || '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
                        {(item.sell_price * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    <button onClick={() => removeFromCart(item.id)} style={{
                      width: '26px', height: '26px', borderRadius: '6px', border: 'none',
                      background: 'transparent', color: th.textSecondary || '#64748b',
                      cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = th.textSecondary || '#64748b'; }}>
                      &times;
                    </button>
                  </div>
                )})}
              </div>

              {/* Summary & Checkout */}
              <div style={{
                padding: '14px 16px',
                background: isDarkMode ? 'rgba(15,23,42,0.5)' : 'rgba(248,250,252,0.8)',
                borderTop: `2px solid ${th.border || '#334155'}`
              }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: th.textSecondary || '#64748b' }}>{isSw ? 'Jumla Ndogo' : 'Subtotal'}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: th.text || '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
                    TSh {getTotal().toLocaleString()}
                  </span>
                </div>

                {/* Discount Row */}
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['none', 'percentage', 'amount']).map(type => (
                      <button key={type} onClick={() => setDiscountType(type)} style={{
                        padding: '4px 10px', borderRadius: '8px',
                        border: discountType === type ? '1.5px solid #6366f1' : `1px solid ${th.border || '#334155'}`,
                        background: discountType === type ? 'rgba(99,102,241,0.1)' : 'transparent',
                        color: discountType === type ? '#6366f1' : (th.textSecondary || '#64748b'),
                        fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease'
                      }}>
                        {type === 'none' ? (isSw ? 'Bila' : 'No disc') : type === 'percentage' ? '%' : 'TSh'}
                      </button>
                    ))}
                    {discountType !== 'none' && (
                      <input type="number" min="0" value={discountValue}
                        onChange={e => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percentage' ? '%' : '0'}
                        style={{
                          width: '72px', padding: '4px 8px', borderRadius: '8px',
                          border: `1px solid ${th.border || '#334155'}`,
                          background: isDarkMode ? '#1e293b' : '#fff',
                          color: th.text || '#f1f5f9', fontSize: '12px', textAlign: 'center'
                        }} />
                    )}
                  </div>
                </div>

                {getDiscountAmount() > 0 && (
                  <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#ef4444' }}>{isSw ? 'Punguzo' : 'Discount'}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', fontFamily: "'Inter', sans-serif" }}>-TSh {getDiscountAmount().toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center" style={{ marginBottom: '14px', paddingTop: '8px', borderTop: `1px solid ${th.border || '#334155'}` }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: th.text || '#f1f5f9' }}>{isSw ? 'JUMLA' : 'TOTAL'}</span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.5px', fontFamily: "'Inter', sans-serif" }}>
                    TSh {getFinalTotal().toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowCheckout(true)} disabled={processing} style={{
                    flex: 1, padding: '14px', border: 'none', borderRadius: '14px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontWeight: 700, fontSize: '15px', cursor: processing ? 'wait' : 'pointer',
                    boxShadow: '0 6px 20px rgba(16,185,129,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    letterSpacing: '0.2px', transition: 'all 0.2s ease',
                    fontFamily: "'Inter', sans-serif", opacity: processing ? 0.7 : 1
                  }}
                  onMouseEnter={e => { if (!processing) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { if (!processing) e.currentTarget.style.transform = 'translateY(0)'; }}>
                    {processing ? (
                      <div className="spinner" style={{ width: '18px', height: '18px', borderColor: '#fff', borderTopColor: 'transparent' }} />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {processing ? (isSw ? 'Inachakata...' : 'Processing...') : `${isSw ? 'Lipa' : 'Pay'} TSh ${getFinalTotal().toLocaleString()}`}
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <kbd style={{
                    padding: '2px 8px', borderRadius: '4px', background: 'rgba(148,163,184,0.08)',
                    fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)'
                  }}>
                    F1
                  </kbd>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                    = {isSw ? 'Malipo' : 'Checkout'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '440px' }}>
            <div className="modal-header" style={{ marginBottom: '18px' }}>
              <div>
                <h3 className="modal-title" style={{ fontSize: '18px' }}>{isSw ? 'Malipo' : 'Checkout'}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {isSw ? `${cartItemCount} vipengee · Chagua njia ya malipo` : `${cartItemCount} items · Choose payment method`}
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowCheckout(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Payment Methods */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'cash', icon: <CI.Money size={22} />, label: isSw ? 'Fedha Taslimu' : 'Cash', desc: isSw ? 'Malipo ya mkono' : 'Physical payment' },
                { key: 'mobile', icon: <CI.Mobile size={22} />, label: isSw ? 'Simu ya Mkononi' : 'Mobile Money', desc: 'M-Pesa, Tigo Pesa, Airtel' },
                { key: 'card', icon: <CI.CreditCard size={22} />, label: isSw ? 'Kadi ya Benki' : 'Bank Card', desc: 'Visa, Mastercard' },
              ].map(method => (
                <button key={method.key}
                  onClick={() => setPaymentMethod(method.key)}
                  className={`checkout-payment-option ${paymentMethod === method.key ? 'selected' : ''}`}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: paymentMethod === method.key ? 'rgba(99,102,241,0.12)' : 'rgba(148,163,184,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {method.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{method.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{method.desc}</div>
                  </div>
                  {paymentMethod === method.key && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Order Summary */}
            <div style={{
              marginTop: '16px', padding: '14px 16px', borderRadius: '14px',
              background: isDarkMode ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)',
              border: `1px solid ${th.border || '#334155'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: th.textSecondary || '#64748b' }}>{isSw ? 'Jumla Ndogo' : 'Subtotal'}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>TSh {getTotal().toLocaleString()}</span>
              </div>
              {getDiscountAmount() > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#ef4444' }}>{isSw ? 'Punguzo' : 'Discount'}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>-TSh {getDiscountAmount().toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${th.border || '#334155'}` }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{isSw ? 'JUMLA' : 'TOTAL'}</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#6366f1' }}>TSh {getFinalTotal().toLocaleString()}</span>
              </div>

              {cart.length > 0 && (
                <div style={{ marginTop: '8px', maxHeight: '100px', overflowY: 'auto', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.quantity}x {item.name}</span>
                      <span style={{ marginLeft: '8px', whiteSpace: 'nowrap' }}>TSh {(item.sell_price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isSw ? '📱 Namba ya Simu (si lazima)' : '📱 Phone Number (optional)'}
                </label>
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  className="input" placeholder="255XXXXXXXXX" style={{ fontSize: '13px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isSw ? '📧 Barua Pepe (si lazima)' : '📧 Email (optional)'}
                </label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                  className="input" placeholder="customer@example.com" style={{ fontSize: '13px' }} />
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '18px' }}>
              <button className="btn btn-secondary" onClick={() => setShowCheckout(false)}>
                {isSw ? 'Ghairi' : 'Cancel'}
              </button>
              <button className="btn btn-success" onClick={handleCheckout} disabled={processing} style={{ opacity: processing ? 0.7 : 1 }}>
                {processing ? (isSw ? 'Inachakata...' : 'Processing...') : (isSw ? 'Thibitisha Malipo' : 'Confirm Payment')}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <kbd style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(148,163,184,0.1)', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)' }}>Enter</kbd>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>= {isSw ? 'Thibitisha' : 'Confirm'}</span>
              <span style={{ margin: '0 6px', color: 'var(--text-tertiary)' }}>·</span>
              <kbd style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(148,163,184,0.1)', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)' }}>Esc</kbd>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>= {isSw ? 'Ghairi' : 'Cancel'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notify && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setNotify(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: isDarkMode ? '#1e293b' : '#fff', borderRadius: '24px', padding: '32px 40px 24px',
            textAlign: 'center', maxWidth: '400px', width: '90%', overflow: 'hidden',
            border: `1px solid ${notify.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'fadeInScale 0.35s ease'
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 16px',
              background: notify.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${notify.type === 'success' ? '#10b981' : '#ef4444'}`
            }}>
              {notify.type === 'success' ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{notify.msg}</h2>
            {notify.total > 0 && (
              <p style={{ margin: '0 0 16px', fontSize: '32px', fontWeight: '800', color: notify.type === 'success' ? '#10b981' : '#ef4444', letterSpacing: '-1px' }}>
                {formatCurrency(notify.total)}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => setNotify(null)} style={{
                padding: '12px 36px', borderRadius: '12px',
                background: notify.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', minWidth: '100px'
              }}>OK</button>
              {notify.receipt && (
                <button className="btn" onClick={() => {
                  printReceipt({
                    items: notify.receipt.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.sell_price * i.quantity })),
                    total: notify.receipt.total, date: notify.receipt.date,
                    shopName: currentShop?.shop_name || 'KasiTRADE'
                  });
                }} style={{
                  padding: '12px 36px', borderRadius: '12px',
                  background: 'transparent', border: '2px solid #10b981', color: '#10b981',
                  fontWeight: 700, fontSize: '14px', minWidth: '100px'
                }}>
                  {lang === 'sw' ? 'Chapisha Risiti' : 'Print Receipt'}
                </button>
              )}
            </div>
            <div style={{
              width: '100%', height: '3px', background: 'var(--border)', borderRadius: '3px',
              marginTop: '20px', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', background: notify.type === 'success' ? '#10b981' : '#ef4444',
                borderRadius: '3px', animation: 'shrinkBar 3s linear forwards'
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
