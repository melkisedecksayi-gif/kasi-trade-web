import React, { useState } from 'react';
import { Icons } from './Icons';

const Settings = ({ lang, setLang, supabase, currentShop, shops, setShops, isDarkMode, setIsDarkMode, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [newShopForm, setNewShopForm] = useState({ shop_name: '', shop_type: 'duka', region: '' });
  const [helpSearch, setHelpSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
    triggerToast(newLang === 'sw' ? 'Lugha imebadilishwa' : 'Language changed');
  };

  const handleDarkModeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('dark_mode', newMode.toString());
    triggerToast(newMode ? (lang === 'sw' ? 'Dark mode imewashwa' : 'Dark mode enabled') : (lang === 'sw' ? 'Dark mode imezimwa' : 'Dark mode disabled'));
  };

  const handleAddShop = async (e) => {
    e.preventDefault();
    if (!newShopForm.shop_name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('shops').insert([{ user_id: user.id, ...newShopForm }]).select().single();
    if (data && !error) {
      setShops([...shops, data]);
      setShowAddShopModal(false);
      setNewShopForm({ shop_name: '', shop_type: 'duka', region: '' });
      triggerToast(lang === 'sw' ? 'Duka jipya limeongezwa!' : 'New shop added!');
    }
  };

  const tabs = [
    { id: 'general', label: lang === 'sw' ? 'Jumla' : 'General', icon: Icons.Settings },
    { id: 'hours', label: lang === 'sw' ? 'Masaa' : 'Hours', icon: Icons.Clock },
    { id: 'tax', label: lang === 'sw' ? 'Kodi' : 'Tax', icon: Icons.Cash },
    { id: 'receipt', label: lang === 'sw' ? 'Risiti' : 'Receipt', icon: Icons.Printer },
    { id: 'staff', label: lang === 'sw' ? 'Wafanyakazi' : 'Staff', icon: Icons.Users },
    { id: 'help', label: lang === 'sw' ? 'Msaada' : 'Help', icon: Icons.Help },
  ];

  const faqs = [
    {
      q: lang === 'sw' ? 'Jinsi ya kuongeza bidhaa mpya?' : 'How to add new products?',
      a: lang === 'sw' ? 'Nenda kwenye "Bidhaa" kwenye sidebar, bofya "Ongeza Bidhaa", jaza taarifa zote na uhifadhi.' : 'Go to "Products" in the sidebar, click "Add Product", fill in all details and save.'
    },
    {
      q: lang === 'sw' ? 'Ninawezaje kuuza bidhaa?' : 'How can I sell products?',
      a: lang === 'sw' ? 'Nenda kwenye "Mauzo (POS)", chagua bidhaa kwa kubofya, ongeza kwenye kikapu, kisha bofya "Lipa Sasa".' : 'Go to "Sales (POS)", select products by clicking, add to cart, then click "Pay Now".'
    },
    {
      q: lang === 'sw' ? 'Jinsi ya kuongeza duka jipya?' : 'How to add a new shop?',
      a: lang === 'sw' ? 'Nenda kwenye "Mipangilio" > "Jumla" > bofya "Ongeza Duka". Unaweza kuwa na maduka mengi.' : 'Go to "Settings" > "General" > click "Add Shop". You can have multiple shops.'
    },
    {
      q: lang === 'sw' ? 'Ninawezaje kuona ripoti za mauzo?' : 'How can I view sales reports?',
      a: lang === 'sw' ? 'Nenda kwenye "Ripoti" kwenye sidebar. Unaweza kuchagua kipindi: Leo, Wiki Hii, au Mwezi Huu.' : 'Go to "Reports" in the sidebar. You can select period: Today, This Week, or This Month.'
    },
    {
      q: lang === 'sw' ? 'Jinsi ya kubadilisha lugha?' : 'How to change language?',
      a: lang === 'sw' ? 'Nenda kwenye "Mipangilio" > "Jumla" > chagua lugha (Kiswahili au English).' : 'Go to "Settings" > "General" > select language (Kiswahili or English).'
    },
    {
      q: lang === 'sw' ? 'Ninawezaje kuweka masaa ya kazi?' : 'How to set working hours?',
      a: lang === 'sw' ? 'Nenda kwenye "Mipangilio" > "Masaa". Weka muda wa kufungua na kufunga kwa kila siku.' : 'Go to "Settings" > "Hours". Set opening and closing times for each day.'
    },
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(helpSearch.toLowerCase()) || 
    f.a.toLowerCase().includes(helpSearch.toLowerCase())
  );

  const shortcuts = [
    { icon: Icons.ShoppingCart, label: lang === 'sw' ? 'Anza Kuuza' : 'Start Selling', action: 'pos', color: '#10b981' },
    { icon: Icons.Box, label: lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Product', action: 'products', color: '#6366f1' },
    { icon: Icons.Users, label: lang === 'sw' ? 'Ongeza Mteja' : 'Add Customer', action: 'customers', color: '#ec4899' },
    { icon: Icons.BarChart, label: lang === 'sw' ? 'Tazama Ripoti' : 'View Reports', action: 'reports', color: '#f59e0b' },
  ];

  const inputStyle = { 
    width: '100%', padding: '12px', 
    border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: isDarkMode ? '#334155' : '#fff', color: isDarkMode ? '#f1f5f9' : '#0f172a'
  };

  const cardStyle = { 
    background: isDarkMode ? '#1e293b' : '#fff', padding: '24px', borderRadius: '16px', 
    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '20px'
  };

  return (
    <div style={{ position: 'relative', zIndex: 10, paddingBottom: '40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Settings size={24} /> {lang === 'sw' ? 'Mipangilio ya Mfumo' : 'System Settings'}
        </h2>
        <p style={{ margin: '4px 0 0', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '14px' }}>
          {lang === 'sw' ? 'Duka: ' : 'Shop: '}{currentShop?.shop_name}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : (isDarkMode ? '#334155' : '#f1f5f9'),
              color: activeTab === tab.id ? '#fff' : (isDarkMode ? '#cbd5e1' : '#64748b'),
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
            }}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Globe size={20} /> {lang === 'sw' ? 'Lugha' : 'Language'}
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => handleLanguageChange('sw')} style={{
                flex: 1, padding: '16px', border: `2px solid ${lang === 'sw' ? '#6366f1' : (isDarkMode ? '#475569' : '#e2e8f0')}`, borderRadius: '12px',
                background: lang === 'sw' ? '#f0f7ff' : (isDarkMode ? '#334155' : '#fff'), cursor: 'pointer', fontWeight: '600',
                color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px'
              }}>🇹 Kiswahili</button>
              <button onClick={() => handleLanguageChange('en')} style={{
                flex: 1, padding: '16px', border: `2px solid ${lang === 'en' ? '#6366f1' : (isDarkMode ? '#475569' : '#e2e8f0')}`, borderRadius: '12px',
                background: lang === 'en' ? '#f0f7ff' : (isDarkMode ? '#334155' : '#fff'), cursor: 'pointer', fontWeight: '600',
                color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px'
              }}>🇬🇧 English</button>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isDarkMode ? <Icons.Moon size={20} /> : <Icons.Sun size={20} />}
                  {lang === 'sw' ? 'Dark Mode' : 'Dark Mode'}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  {lang === 'sw' ? 'Badilisha muonekano wa mfumo' : 'Change system appearance'}
                </p>
              </div>
              <button onClick={handleDarkModeToggle} style={{
                width: '56px', height: '28px', borderRadius: '14px', border: 'none',
                background: isDarkMode ? '#6366f1' : '#cbd5e1', cursor: 'pointer', position: 'relative', transition: 'background 0.3s'
              }}>
                <div style={{
                  position: 'absolute', top: '3px', left: isDarkMode ? '31px' : '3px', width: '22px', height: '22px',
                  borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.ShoppingBag size={20} /> {lang === 'sw' ? 'Maduka Yangu' : 'My Shops'}
              </h3>
              <button onClick={() => setShowAddShopModal(true)} style={{
                padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '10px',
                fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <Icons.Plus size={16} /> {lang === 'sw' ? 'Ongeza Duka' : 'Add Shop'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {shops.map(shop => (
                <div key={shop.id} style={{
                  padding: '16px', background: isDarkMode ? '#334155' : '#f8fafc', borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a', fontSize: '15px' }}>{shop.shop_name}</div>
                    <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginTop: '4px' }}>{shop.shop_type} • {shop.region || '---'}</div>
                  </div>
                  <div style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    background: shop.id === currentShop?.id ? '#d1fae5' : (isDarkMode ? '#475569' : '#e2e8f0'),
                    color: shop.id === currentShop?.id ? '#059669' : (isDarkMode ? '#cbd5e1' : '#64748b')
                  }}>
                    {shop.id === currentShop?.id ? (lang === 'sw' ? 'Inatumika' : 'Active') : (lang === 'sw' ? 'Tumia' : 'Switch')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'help' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Zap size={20} /> {lang === 'sw' ? 'Hatua za Haraka' : 'Quick Actions'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {shortcuts.map((sc, i) => {
                const Icon = sc.icon;
                return (
                  <button key={i} onClick={() => onNavigate && onNavigate(sc.action)} style={{
                    padding: '16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: `${sc.color}15`, color: sc.color,
                    display: 'flex', alignItems: 'center', gap: '12px',
                    fontWeight: '600', fontSize: '14px', transition: 'all 0.2s'
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 16px ${sc.color}30`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <Icon size={20} /> {sc.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Search size={20} /> {lang === 'sw' ? 'Tafuta Msaada' : 'Search Help'}
            </h3>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                <Icons.Search size={18} />
              </span>
              <input type="text" placeholder={lang === 'sw' ? 'Andika swali lako...' : 'Type your question...'} value={helpSearch} onChange={(e) => setHelpSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '44px' }} />
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Help size={20} /> {lang === 'sw' ? 'Maswali Yanayoulizwa Mara Kwa Mara' : 'Frequently Asked Questions'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredFaqs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  <Icons.Search size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p>{lang === 'sw' ? 'Hakuna matokeo' : 'No results found'}</p>
                </div>
              ) : (
                filteredFaqs.map((faq, i) => (
                  <div key={i} style={{
                    background: isDarkMode ? '#334155' : '#f8fafc', borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, overflow: 'hidden', transition: 'all 0.2s'
                  }}>
                    <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} style={{
                      width: '100%', padding: '16px', background: 'none', border: 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', textAlign: 'left', color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: '600', fontSize: '14px'
                    }}>
                      <span>{faq.q}</span>
                      <Icons.ChevronDown size={18} style={{ transform: expandedFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                    </button>
                    {expandedFaq === i && (
                      <div style={{
                        padding: '0 16px 16px', color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: '14px', lineHeight: '1.6',
                        borderTop: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, paddingTop: '12px'
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '16px', padding: '32px', color: '#fff', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Help size={22} /> {lang === 'sw' ? 'Unahitaji msaada zaidi?' : 'Need more help?'}
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '14px', opacity: 0.95 }}>
                {lang === 'sw' ? 'Timu yetu ya msaada iko tayari kukusaidia saa 24/7.' : 'Our support team is ready to help you 24/7.'}
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a href="mailto:support@kasitrade.co.tz" style={{ padding: '10px 20px', background: '#fff', color: '#6366f1', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.Mail size={16} /> {lang === 'sw' ? 'Tuma Email' : 'Send Email'}
                </a>
                <a href="tel:+255123456789" style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.Phone size={16} /> {lang === 'sw' ? 'Piga Simu' : 'Call Us'}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {['hours', 'tax', 'receipt', 'staff'].includes(activeTab) && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>⚙️</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
            {lang === 'sw' ? 'Inaendelea Kujengwa...' : 'Under Construction...'}
          </h3>
          <p style={{ margin: 0, color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '14px' }}>
            {lang === 'sw' ? `Tab ya ${activeTab} itakuja hivi karibuni` : `${activeTab} tab coming soon`}
          </p>
        </div>
      )}

      {showAddShopModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>+ {lang === 'sw' ? 'Duka Jipya' : 'New Shop'}</h2>
              <button onClick={() => setShowAddShopModal(false)} style={{ background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}><Icons.X size={16} /></button>
            </div>
            <form onSubmit={handleAddShop} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" placeholder={lang === 'sw' ? 'Jina la Duka' : 'Shop Name'} required value={newShopForm.shop_name} onChange={(e) => setNewShopForm({...newShopForm, shop_name: e.target.value})} style={inputStyle} />
              <select value={newShopForm.shop_type} onChange={(e) => setNewShopForm({...newShopForm, shop_type: e.target.value})} style={inputStyle}>
                <option value="duka">🛒 {lang === 'sw' ? 'Duka' : 'Retail Shop'}</option>
                <option value="microfinance">💰 Microfinance</option>
                <option value="restaurant">🍽️ {lang === 'sw' ? 'Hotel/Restaurant' : 'Hotel/Restaurant'}</option>
              </select>
              <input type="text" placeholder={lang === 'sw' ? 'Mkoa' : 'Region'} value={newShopForm.region} onChange={(e) => setNewShopForm({...newShopForm, region: e.target.value})} style={inputStyle} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddShopModal(false)} style={{ flex: 1, padding: '12px', background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: isDarkMode ? '#f1f5f9' : '#475569' }}>{lang === 'sw' ? 'Ghairi' : 'Cancel'}</button>
                <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>{lang === 'sw' ? 'Hifadhi' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showToast && (
        <div style={{ position: 'fixed', top: '30px', right: '30px', background: '#10b981', color: '#fff', padding: '14px 24px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)', zIndex: 2000, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.CheckCircle size={20} /> {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Settings;