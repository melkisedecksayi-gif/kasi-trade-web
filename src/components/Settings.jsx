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
  const [saving, setSaving] = useState(false);

  // Working Hours State
  const [workingHours, setWorkingHours] = useState({
    monday: { open: '08:00', close: '20:00', isClosed: false },
    tuesday: { open: '08:00', close: '20:00', isClosed: false },
    wednesday: { open: '08:00', close: '20:00', isClosed: false },
    thursday: { open: '08:00', close: '20:00', isClosed: false },
    friday: { open: '08:00', close: '20:00', isClosed: false },
    saturday: { open: '09:00', close: '18:00', isClosed: false },
    sunday: { open: '10:00', close: '16:00', isClosed: true }
  });

  // Tax State
  const [taxSettings, setTaxSettings] = useState({
    taxEnabled: true,
    taxRate: 18,
    taxName: 'VAT',
    taxNumber: '',
    priceIncludesTax: false
  });

  // Receipt State
  const [receiptSettings, setReceiptSettings] = useState({
    showHeader: true,
    headerText: 'Thank you for your purchase!',
    showFooter: true,
    footerText: 'Come again!',
    showTax: true,
    showDiscount: true,
    showBarcode: true,
    receiptTitle: currentShop?.shop_name || 'Receipt'
  });

  // Staff State
  const [staffList, setStaffList] = useState([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'cashier',
    password: ''
  });

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

  // Save Working Hours
  const handleSaveHours = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          working_hours: workingHours,
          working_hours_start: workingHours.monday.open,
          working_hours_end: workingHours.monday.close
        })
        .eq('id', currentShop.id);

      if (error) throw error;
      triggerToast(lang === 'sw' ? '✅ Masaa yamehifadhiwa!' : '✅ Hours saved!');
    } catch (err) {
      triggerToast(lang === 'sw' ? '❌ Hitilafu: ' + err.message : '❌ Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save Tax Settings
  const handleSaveTax = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          tax_enabled: taxSettings.taxEnabled,
          tax_rate: parseFloat(taxSettings.taxRate),
          tax_name: taxSettings.taxName,
          tax_number: taxSettings.taxNumber,
          price_includes_tax: taxSettings.priceIncludesTax
        })
        .eq('id', currentShop.id);

      if (error) throw error;
      triggerToast(lang === 'sw' ? '✅ Kodi imehifadhiwa!' : '✅ Tax settings saved!');
    } catch (err) {
      triggerToast(lang === 'sw' ? '❌ Hitilafu: ' + err.message : '❌ Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save Receipt Settings
  const handleSaveReceipt = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          receipt_settings: receiptSettings
        })
        .eq('id', currentShop.id);

      if (error) throw error;
      triggerToast(lang === 'sw' ? '✅ Mipangilio ya risiti imehifadhiwa!' : '✅ Receipt settings saved!');
    } catch (err) {
      triggerToast(lang === 'sw' ? '❌ Hitilafu: ' + err.message : '❌ Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add Staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert([{
          shop_id: currentShop.id,
          name: staffForm.name,
          email: staffForm.email,
          phone: staffForm.phone,
          role: staffForm.role,
          password: staffForm.password,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      setStaffList([...staffList, data]);
      setShowAddStaffModal(false);
      setStaffForm({ name: '', email: '', phone: '', role: 'cashier', password: '' });
      triggerToast(lang === 'sw' ? '✅ Mfanyakazi ameongezwa!' : '✅ Staff added!');
    } catch (err) {
      triggerToast(lang === 'sw' ? '❌ Hitilafu: ' + err.message : '❌ Error: ' + err.message);
    } finally {
      setSaving(false);
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

  const inputStyle = { 
    width: '100%', padding: '12px', 
    border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: isDarkMode ? '#334155' : '#fff', color: isDarkMode ? '#f1f5f9' : '#0f172a'
  };

  const cardStyle = { 
    background: isDarkMode ? '#1e293b' : '#fff', padding: '24px', borderRadius: '16px', 
    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '20px'
  };

  const toggleStyle = {
    width: '56px', height: '28px', borderRadius: '14px', border: 'none',
    cursor: 'pointer', position: 'relative', transition: 'background 0.3s'
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

      {/* =================== GENERAL TAB =================== */}
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
                ...toggleStyle,
                background: isDarkMode ? '#6366f1' : '#cbd5e1'
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

      {/* =================== HOURS TAB =================== */}
      {activeTab === 'hours' && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Clock size={20} /> {lang === 'sw' ? 'Masaa ya Kazi' : 'Working Hours'}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(workingHours).map(([day, hours]) => {
              const dayNames = {
                monday: lang === 'sw' ? 'Jumatatu' : 'Monday',
                tuesday: lang === 'sw' ? 'Jumanne' : 'Tuesday',
                wednesday: lang === 'sw' ? 'Jumatano' : 'Wednesday',
                thursday: lang === 'sw' ? 'Alhamisi' : 'Thursday',
                friday: lang === 'sw' ? 'Ijumaa' : 'Friday',
                saturday: lang === 'sw' ? 'Jumamosi' : 'Saturday',
                sunday: lang === 'sw' ? 'Jumapili' : 'Sunday'
              };

              return (
                <div key={day} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px', background: isDarkMode ? '#334155' : '#f8fafc',
                  borderRadius: '10px'
                }}>
                  <div style={{ width: '120px', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                    {dayNames[day]}
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!hours.isClosed}
                      onChange={(e) => setWorkingHours({
                        ...workingHours,
                        [day]: { ...hours, isClosed: !e.target.checked }
                      })}
                    />
                    <span style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: '14px' }}>
                      {lang === 'sw' ? 'Fungua' : 'Open'}
                    </span>
                  </label>

                  {!hours.isClosed && (
                    <>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => setWorkingHours({
                          ...workingHours,
                          [day]: { ...hours, open: e.target.value }
                        })}
                        style={{ ...inputStyle, width: '120px' }}
                      />
                      <span style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>-</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => setWorkingHours({
                          ...workingHours,
                          [day]: { ...hours, close: e.target.value }
                        })}
                        style={{ ...inputStyle, width: '120px' }}
                      />
                    </>
                  )}

                  {hours.isClosed && (
                    <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600' }}>
                      {lang === 'sw' ? 'Imefungwa' : 'Closed'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSaveHours}
            disabled={saving}
            style={{
              marginTop: '24px',
              width: '100%',
              padding: '14px',
              background: saving ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? (lang === 'sw' ? '⏳ Inahifadhi...' : '⏳ Saving...') : (lang === 'sw' ? 'Hifadhi Masaa' : 'Save Hours')}
          </button>
        </div>
      )}

      {/* =================== TAX TAB =================== */}
      {activeTab === 'tax' && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Cash size={20} /> {lang === 'sw' ? 'Mipangilio ya Kodi' : 'Tax Settings'}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: isDarkMode ? '#334155' : '#f8fafc', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: '4px' }}>
                  {lang === 'sw' ? 'Washa Kodi' : 'Enable Tax'}
                </div>
                <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  {lang === 'sw' ? 'Ongeza kodi kwenye mauzo' : 'Add tax to sales'}
                </div>
              </div>
              <button
                onClick={() => setTaxSettings({ ...taxSettings, taxEnabled: !taxSettings.taxEnabled })}
                style={{
                  ...toggleStyle,
                  background: taxSettings.taxEnabled ? '#10b981' : '#cbd5e1'
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px', left: taxSettings.taxEnabled ? '31px' : '3px', width: '22px', height: '22px',
                  borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>

            {taxSettings.taxEnabled && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                    {lang === 'sw' ? 'Jina la Kodi' : 'Tax Name'}
                  </label>
                  <input
                    type="text"
                    value={taxSettings.taxName}
                    onChange={(e) => setTaxSettings({ ...taxSettings, taxName: e.target.value })}
                    style={inputStyle}
                    placeholder="VAT"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                    {lang === 'sw' ? 'Kiwango cha Kodi (%)' : 'Tax Rate (%)'}
                  </label>
                  <input
                    type="number"
                    value={taxSettings.taxRate}
                    onChange={(e) => setTaxSettings({ ...taxSettings, taxRate: e.target.value })}
                    style={inputStyle}
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                    {lang === 'sw' ? 'Namba ya Kodi (TIN)' : 'Tax Number (TIN)'}
                  </label>
                  <input
                    type="text"
                    value={taxSettings.taxNumber}
                    onChange={(e) => setTaxSettings({ ...taxSettings, taxNumber: e.target.value })}
                    style={inputStyle}
                    placeholder="123-456-789"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: isDarkMode ? '#334155' : '#f8fafc', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: '4px' }}>
                      {lang === 'sw' ? 'Bei Zinaingiza Kodi' : 'Prices Include Tax'}
                    </div>
                    <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                      {lang === 'sw' ? 'Bei zilizowekwa tayari zina kodi' : 'Entered prices already include tax'}
                    </div>
                  </div>
                  <button
                    onClick={() => setTaxSettings({ ...taxSettings, priceIncludesTax: !taxSettings.priceIncludesTax })}
                    style={{
                      ...toggleStyle,
                      background: taxSettings.priceIncludesTax ? '#6366f1' : '#cbd5e1'
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px', left: taxSettings.priceIncludesTax ? '31px' : '3px', width: '22px', height: '22px',
                      borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSaveTax}
            disabled={saving}
            style={{
              marginTop: '24px',
              width: '100%',
              padding: '14px',
              background: saving ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? (lang === 'sw' ? '⏳ Inahifadhi...' : '⏳ Saving...') : (lang === 'sw' ? 'Hifadhi Kodi' : 'Save Tax Settings')}
          </button>
        </div>
      )}

      {/* =================== RECEIPT TAB =================== */}
      {activeTab === 'receipt' && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Printer size={20} /> {lang === 'sw' ? 'Mipangilio ya Risiti' : 'Receipt Settings'}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                {lang === 'sw' ? 'Kichwa cha Risiti' : 'Receipt Title'}
              </label>
              <input
                type="text"
                value={receiptSettings.receiptTitle}
                onChange={(e) => setReceiptSettings({ ...receiptSettings, receiptTitle: e.target.value })}
                style={inputStyle}
                placeholder={currentShop?.shop_name || 'Receipt'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: isDarkMode ? '#334155' : '#f8fafc', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: '4px' }}>
                  {lang === 'sw' ? 'Onyesha Kichwa' : 'Show Header'}
                </div>
                <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  {lang === 'sw' ? 'Onyesha ujumbe wa juu' : 'Show header message'}
                </div>
              </div>
              <button
                onClick={() => setReceiptSettings({ ...receiptSettings, showHeader: !receiptSettings.showHeader })}
                style={{
                  ...toggleStyle,
                  background: receiptSettings.showHeader ? '#6366f1' : '#cbd5e1'
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px', left: receiptSettings.showHeader ? '31px' : '3px', width: '22px', height: '22px',
                  borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>

            {receiptSettings.showHeader && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                  {lang === 'sw' ? 'Ujumbe wa Kichwa' : 'Header Text'}
                </label>
                <input
                  type="text"
                  value={receiptSettings.headerText}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, headerText: e.target.value })}
                  style={inputStyle}
                  placeholder="Thank you for your purchase!"
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: isDarkMode ? '#334155' : '#f8fafc', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: '4px' }}>
                  {lang === 'sw' ? 'Onyesha Kodi' : 'Show Tax'}
                </div>
                <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  {lang === 'sw' ? 'Onyesha kodi kwenye risiti' : 'Show tax on receipt'}
                </div>
              </div>
              <button
                onClick={() => setReceiptSettings({ ...receiptSettings, showTax: !receiptSettings.showTax })}
                style={{
                  ...toggleStyle,
                  background: receiptSettings.showTax ? '#6366f1' : '#cbd5e1'
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px', left: receiptSettings.showTax ? '31px' : '3px', width: '22px', height: '22px',
                  borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: isDarkMode ? '#334155' : '#f8fafc', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: '4px' }}>
                  {lang === 'sw' ? 'Onyesha Barcode' : 'Show Barcode'}
                </div>
                <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  {lang === 'sw' ? 'Onyesha barcode kwenye risiti' : 'Show barcode on receipt'}
                </div>
              </div>
              <button
                onClick={() => setReceiptSettings({ ...receiptSettings, showBarcode: !receiptSettings.showBarcode })}
                style={{
                  ...toggleStyle,
                  background: receiptSettings.showBarcode ? '#6366f1' : '#cbd5e1'
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px', left: receiptSettings.showBarcode ? '31px' : '3px', width: '22px', height: '22px',
                  borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveReceipt}
            disabled={saving}
            style={{
              marginTop: '24px',
              width: '100%',
              padding: '14px',
              background: saving ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? (lang === 'sw' ? '⏳ Inahifadhi...' : '⏳ Saving...') : (lang === 'sw' ? 'Hifadhi Risiti' : 'Save Receipt Settings')}
          </button>
        </div>
      )}

      {/* =================== STAFF TAB =================== */}
      {activeTab === 'staff' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Users size={20} /> {lang === 'sw' ? 'Wafanyakazi' : 'Staff Members'}
            </h3>
            <button
              onClick={() => setShowAddStaffModal(true)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Icons.Plus size={16} /> {lang === 'sw' ? 'Ongeza Mfanyakazi' : 'Add Staff'}
            </button>
          </div>

          {staffList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              <Icons.Users size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>{lang === 'sw' ? 'Hakuna wafanyakazi bado' : 'No staff members yet'}</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>
                {lang === 'sw' ? 'Bofya "Ongeza Mfanyakazi" kuanza' : 'Click "Add Staff" to get started'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {staffList.map(staff => (
                <div key={staff.id} style={{
                  padding: '16px',
                  background: isDarkMode ? '#334155' : '#f8fafc',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{staff.name}</div>
                    <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                      {staff.email} • {staff.role}
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: staff.is_active ? '#d1fae5' : '#fee2e2',
                    color: staff.is_active ? '#059669' : '#dc2626'
                  }}>
                    {staff.is_active ? (lang === 'sw' ? 'Active' : 'Active') : (lang === 'sw' ? 'Inactive' : 'Inactive')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================== HELP TAB =================== */}
      {activeTab === 'help' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Zap size={20} /> {lang === 'sw' ? 'Hatua za Haraka' : 'Quick Actions'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {[
                { icon: Icons.ShoppingCart, label: lang === 'sw' ? 'Anza Kuuza' : 'Start Selling', action: 'pos', color: '#10b981' },
                { icon: Icons.Box, label: lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Product', action: 'products', color: '#6366f1' },
                { icon: Icons.Users, label: lang === 'sw' ? 'Ongeza Mteja' : 'Add Customer', action: 'customers', color: '#ec4899' },
                { icon: Icons.BarChart, label: lang === 'sw' ? 'Tazama Ripoti' : 'View Reports', action: 'reports', color: '#f59e0b' },
              ].map((sc, i) => {
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
        </div>
      )}

      {/* ADD SHOP MODAL */}
      {showAddShopModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>+ {lang === 'sw' ? 'Duka Jipya' : 'New Shop'}</h2>
              <button onClick={() => setShowAddShopModal(false)} style={{ background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                <Icons.X size={16} />
              </button>
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
                <button type="button" onClick={() => setShowAddShopModal(false)} style={{ flex: 1, padding: '12px', background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: isDarkMode ? '#f1f5f9' : '#475569' }}>
                  {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                  {lang === 'sw' ? 'Hifadhi' : 'Save'}
                </button>
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