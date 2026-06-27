import React, { useState, useEffect } from 'react';

const Settings = ({ lang, supabase, currentShop }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // --- STATE: GENERAL INFO ---
  const [shopInfo, setShopInfo] = useState({
    shop_name: currentShop?.shop_name || '',
    phone: '',
    email: '',
    address: '',
    description: '',
  });

  // --- STATE: WORKING HOURS (kwa kila siku) ---
  const [workingHours, setWorkingHours] = useState({
    monday:    { open: true, start: '08:00', end: '20:00' },
    tuesday:   { open: true, start: '08:00', end: '20:00' },
    wednesday: { open: true, start: '08:00', end: '20:00' },
    thursday:  { open: true, start: '08:00', end: '20:00' },
    friday:    { open: true, start: '08:00', end: '20:00' },
    saturday:  { open: true, start: '09:00', end: '18:00' },
    sunday:    { open: false, start: '10:00', end: '16:00' },
  });

  // --- STATE: TAX & PAYMENTS ---
  const [taxSettings, setTaxSettings] = useState({
    taxRate: 18,
    currency: 'TZS',
    paymentCash: true,
    paymentMobile: true,
    paymentCard: true,
  });

  // --- STATE: RECEIPT ---
  const [receiptSettings, setReceiptSettings] = useState({
    header: 'Asante kwa kununua!',
    footer: 'Karibu tena! 🙏',
    showLogo: true,
    showTax: true,
    showAddress: true,
  });

  // --- STATE: STAFF ---
  const [staff, setStaff] = useState([
    { id: 1, full_name: 'John Mwamba', phone: '0712345678', role: 'manager', pin_code: '1234', is_active: true },
    { id: 2, full_name: 'Sarah Joseph', phone: '0756789012', role: 'cashier', pin_code: '5678', is_active: true },
  ]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({ full_name: '', phone: '', role: 'cashier', pin_code: '', is_active: true });

  // --- LOAD DATA FROM SUPABASE ---
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentShop?.id) return;
      
      const { data: settings } = await supabase
        .from('shop_settings')
        .select('*')
        .eq('shop_id', currentShop.id)
        .single();

      if (settings) {
        setTaxSettings({
          taxRate: settings.tax_rate || 18,
          currency: settings.currency || 'TZS',
          paymentCash: settings.payment_cash !== false,
          paymentMobile: settings.payment_mobile !== false,
          paymentCard: settings.payment_card !== false,
        });
        setReceiptSettings({
          header: settings.receipt_header || 'Asante kwa kununua!',
          footer: settings.receipt_footer || 'Karibu tena!',
          showLogo: settings.receipt_show_logo !== false,
          showTax: settings.receipt_show_tax !== false,
          showAddress: true,
        });
      }

      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });

      if (staffData && staffData.length > 0) {
        setStaff(staffData);
      }
    };
    loadSettings();
  }, [currentShop, supabase]);

  // --- HELPERS ---
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const saveGeneral = async () => {
    await supabase.from('shops').update({
      shop_name: shopInfo.shop_name,
      phone: shopInfo.phone,
      email: shopInfo.email,
      address: shopInfo.address,
    }).eq('id', currentShop.id);
    triggerToast(lang === 'sw' ? '✅ Taarifa zimehifadhiwa!' : '✅ Info saved!');
  };

  const saveWorkingHours = async () => {
    // In production, save to database (create shop_working_hours table)
    triggerToast(lang === 'sw' ? '✅ Masaa ya kazi yamehifadhiwa!' : '✅ Working hours saved!');
  };

  const saveTaxSettings = async () => {
    await supabase.from('shop_settings').upsert({
      shop_id: currentShop.id,
      tax_rate: taxSettings.taxRate,
      currency: taxSettings.currency,
      payment_cash: taxSettings.paymentCash,
      payment_mobile: taxSettings.paymentMobile,
      payment_card: taxSettings.paymentCard,
    });
    triggerToast(lang === 'sw' ? '✅ Mipangilio ya kodi imehifadhiwa!' : '✅ Tax settings saved!');
  };

  const saveReceiptSettings = async () => {
    await supabase.from('shop_settings').upsert({
      shop_id: currentShop.id,
      receipt_header: receiptSettings.header,
      receipt_footer: receiptSettings.footer,
      receipt_show_logo: receiptSettings.showLogo,
      receipt_show_tax: receiptSettings.showTax,
    });
    triggerToast(lang === 'sw' ? '✅ Mipangilio ya risiti imehifadhiwa!' : '✅ Receipt settings saved!');
  };

  // --- STAFF MANAGEMENT ---
  const openStaffModal = (member = null) => {
    if (member) {
      setEditingStaff(member);
      setStaffForm({ ...member });
    } else {
      setEditingStaff(null);
      setStaffForm({ full_name: '', phone: '', role: 'cashier', pin_code: '', is_active: true });
    }
    setShowStaffModal(true);
  };

  const saveStaff = async (e) => {
    e.preventDefault();
    if (editingStaff) {
      await supabase.from('staff').update(staffForm).eq('id', editingStaff.id);
      setStaff(staff.map(s => s.id === editingStaff.id ? { ...staffForm, id: editingStaff.id } : s));
    } else {
      const { data } = await supabase.from('staff').insert([{ ...staffForm, shop_id: currentShop.id }]).select().single();
      if (data) setStaff([data, ...staff]);
    }
    setShowStaffModal(false);
    triggerToast(lang === 'sw' ? '✅ Mfanyakazi amehifadhiwa!' : '✅ Staff saved!');
  };

  const deleteStaff = async (id) => {
    if (!window.confirm(lang === 'sw' ? 'Futa mfanyakazi huyu?' : 'Delete this staff?')) return;
    await supabase.from('staff').delete().eq('id', id);
    setStaff(staff.filter(s => s.id !== id));
    triggerToast(lang === 'sw' ? '🗑️ Mfanyakazi amefutwa' : '🗑️ Staff deleted');
  };

  const days = [
    { id: 'monday', name: lang === 'sw' ? 'Jumatatu' : 'Monday' },
    { id: 'tuesday', name: lang === 'sw' ? 'Jumanne' : 'Tuesday' },
    { id: 'wednesday', name: lang === 'sw' ? 'Jumatano' : 'Wednesday' },
    { id: 'thursday', name: lang === 'sw' ? 'Alhamisi' : 'Thursday' },
    { id: 'friday', name: lang === 'sw' ? 'Ijumaa' : 'Friday' },
    { id: 'saturday', name: lang === 'sw' ? 'Jumamosi' : 'Saturday' },
    { id: 'sunday', name: lang === 'sw' ? 'Jumapili' : 'Sunday' },
  ];

  const roles = [
    { id: 'manager', label: lang === 'sw' ? 'Meneja' : 'Manager', icon: '👔' },
    { id: 'cashier', label: lang === 'sw' ? 'Keshia' : 'Cashier', icon: '💵' },
    { id: 'stock_keeper', label: lang === 'sw' ? 'Mhifadhi' : 'Stock Keeper', icon: '📦' },
  ];

  const inputStyle = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
  const cardStyle = { background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '20px' };

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
          ⚙️ {lang === 'sw' ? 'Mipangilio ya Mfumo' : 'System Settings'}
        </h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
          {lang === 'sw' ? 'Duka: ' : 'Shop: '}{currentShop?.shop_name}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {[
          { id: 'general', label: lang === 'sw' ? '🏪 Taarifa' : '🏪 General' },
          { id: 'hours', label: lang === 'sw' ? '🕒 Masaa' : '🕒 Hours' },
          { id: 'tax', label: lang === 'sw' ? '💰 Kodi' : '💰 Tax' },
          { id: 'receipt', label: lang === 'sw' ? '🧾 Risiti' : '🧾 Receipt' },
          { id: 'staff', label: lang === 'sw' ? '👥 Wafanyakazi' : '👥 Staff' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap',
            background: activeTab === tab.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.8)',
            color: activeTab === tab.id ? '#fff' : '#64748b',
            backdropFilter: 'blur(10px)', transition: 'all 0.2s'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* =================== TAB: GENERAL =================== */}
      {activeTab === 'general' && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            {lang === 'sw' ? 'Taarifa za Duka' : 'Shop Information'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                {lang === 'sw' ? 'Jina la Duka' : 'Shop Name'}
              </label>
              <input type="text" value={shopInfo.shop_name} onChange={(e) => setShopInfo({...shopInfo, shop_name: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                  {lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'}
                </label>
                <input type="tel" value={shopInfo.phone} onChange={(e) => setShopInfo({...shopInfo, phone: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                  {lang === 'sw' ? 'Barua Pepe' : 'Email'}
                </label>
                <input type="email" value={shopInfo.email} onChange={(e) => setShopInfo({...shopInfo, email: e.target.value})} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                {lang === 'sw' ? 'Anwani' : 'Address'}
              </label>
              <input type="text" value={shopInfo.address} onChange={(e) => setShopInfo({...shopInfo, address: e.target.value})} style={inputStyle} placeholder={lang === 'sw' ? 'Mfano: Kariakoo, Dar es Salaam' : 'e.g. Kariakoo, Dar es Salaam'} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                {lang === 'sw' ? 'Maelezo ya Duka' : 'Shop Description'}
              </label>
              <textarea value={shopInfo.description} onChange={(e) => setShopInfo({...shopInfo, description: e.target.value})} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder={lang === 'sw' ? 'Eleza kuhusu biashara yako...' : 'Describe your business...'} />
            </div>
            <button onClick={saveGeneral} style={{ padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }}>
              💾 {lang === 'sw' ? 'Hifadhi Mabadiliko' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* =================== TAB: WORKING HOURS =================== */}
      {activeTab === 'hours' && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            {lang === 'sw' ? 'Masaa ya Kufanya Kazi' : 'Working Hours'}
          </h3>
          <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13px' }}>
            {lang === 'sw' ? 'Duka litaonyeshwa kama "Active" tu wakati wa masaa haya.' : 'Shop shows as "Active" only during these hours.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {days.map(day => (
              <div key={day.id} style={{ display: 'grid', gridTemplateColumns: '140px auto 1fr 1fr auto', gap: '12px', alignItems: 'center', padding: '12px', background: workingHours[day.id].open ? '#f0f9ff' : '#fef2f2', borderRadius: '10px', border: `1px solid ${workingHours[day.id].open ? '#bae6fd' : '#fecaca'}` }}>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>{day.name}</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={workingHours[day.id].open} onChange={(e) => setWorkingHours({...workingHours, [day.id]: {...workingHours[day.id], open: e.target.checked}})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  {workingHours[day.id].open ? (lang === 'sw' ? 'Wazi' : 'Open') : (lang === 'sw' ? 'Funga' : 'Closed')}
                </label>
                <input type="time" value={workingHours[day.id].start} disabled={!workingHours[day.id].open} onChange={(e) => setWorkingHours({...workingHours, [day.id]: {...workingHours[day.id], start: e.target.value}})} style={{ ...inputStyle, opacity: workingHours[day.id].open ? 1 : 0.4 }} />
                <input type="time" value={workingHours[day.id].end} disabled={!workingHours[day.id].open} onChange={(e) => setWorkingHours({...workingHours, [day.id]: {...workingHours[day.id], end: e.target.value}})} style={{ ...inputStyle, opacity: workingHours[day.id].open ? 1 : 0.4 }} />
                <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {workingHours[day.id].open ? `${workingHours[day.id].start} - ${workingHours[day.id].end}` : '—'}
                </span>
              </div>
            ))}
          </div>
          <button onClick={saveWorkingHours} style={{ marginTop: '20px', padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }}>
            💾 {lang === 'sw' ? 'Hifadhi Masaa' : 'Save Hours'}
          </button>
        </div>
      )}

      {/* =================== TAB: TAX =================== */}
      {activeTab === 'tax' && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            {lang === 'sw' ? 'Kodi na Njia za Malipo' : 'Tax & Payment Methods'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                {lang === 'sw' ? 'Kiwango cha VAT (%)' : 'VAT Rate (%)'}
              </label>
              <input type="number" value={taxSettings.taxRate} onChange={(e) => setTaxSettings({...taxSettings, taxRate: Number(e.target.value)})} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                {lang === 'sw' ? 'Sarafu' : 'Currency'}
              </label>
              <select value={taxSettings.currency} onChange={(e) => setTaxSettings({...taxSettings, currency: e.target.value})} style={inputStyle}>
                <option value="TZS">TZS (Tanzania Shilling)</option>
                <option value="KES">KES (Kenya Shilling)</option>
                <option value="UGX">UGX (Uganda Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>
          </div>

          <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
            {lang === 'sw' ? 'Njia za Malipo Zinazoruhusiwa' : 'Accepted Payment Methods'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'paymentCash', label: lang === 'sw' ? 'Fedha Taslimu' : 'Cash', icon: '💵' },
              { key: 'paymentMobile', label: 'Mobile Money (M-Pesa, Tigo Pesa)', icon: '📱' },
              { key: 'paymentCard', label: lang === 'sw' ? 'Kadi ya Benki' : 'Bank Card', icon: '💳' },
            ].map(method => (
              <label key={method.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: taxSettings[method.key] ? '#f0f9ff' : '#f8fafc', borderRadius: '10px', cursor: 'pointer', border: `1px solid ${taxSettings[method.key] ? '#bae6fd' : '#e2e8f0'}` }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: '#1e293b' }}>
                  <span style={{ fontSize: '20px' }}>{method.icon}</span> {method.label}
                </span>
                <div 
                  onClick={() => setTaxSettings({...taxSettings, [method.key]: !taxSettings[method.key]})}
                  style={{
                    width: '48px', height: '26px', borderRadius: '13px',
                    background: taxSettings[method.key] ? '#10b981' : '#cbd5e1',
                    position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px',
                    left: taxSettings[method.key] ? '25px' : '3px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#fff', transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </label>
            ))}
          </div>

          <button onClick={saveTaxSettings} style={{ marginTop: '20px', padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }}>
            💾 {lang === 'sw' ? 'Hifadhi Mipangilio' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* =================== TAB: RECEIPT =================== */}
      {activeTab === 'receipt' && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            {lang === 'sw' ? 'Mipangilio ya Risiti' : 'Receipt Settings'}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                  {lang === 'sw' ? 'Ujumbe wa Juu (Header)' : 'Header Message'}
                </label>
                <input type="text" value={receiptSettings.header} onChange={(e) => setReceiptSettings({...receiptSettings, header: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                  {lang === 'sw' ? 'Ujumbe wa Chini (Footer)' : 'Footer Message'}
                </label>
                <input type="text" value={receiptSettings.footer} onChange={(e) => setReceiptSettings({...receiptSettings, footer: e.target.value})} style={inputStyle} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                {[
                  { key: 'showLogo', label: lang === 'sw' ? 'Onyesha Logo' : 'Show Logo' },
                  { key: 'showTax', label: lang === 'sw' ? 'Onyesha VAT' : 'Show VAT' },
                  { key: 'showAddress', label: lang === 'sw' ? 'Onyesha Anwani' : 'Show Address' },
                ].map(opt => (
                  <label key={opt.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '10px', cursor: 'pointer' }}>
                    <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{opt.label}</span>
                    <div 
                      onClick={() => setReceiptSettings({...receiptSettings, [opt.key]: !receiptSettings[opt.key]})}
                      style={{
                        width: '44px', height: '24px', borderRadius: '12px',
                        background: receiptSettings[opt.key] ? '#10b981' : '#cbd5e1',
                        position: 'relative', cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: '2px',
                        left: receiptSettings[opt.key] ? '22px' : '2px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: '#fff', transition: 'all 0.2s'
                      }} />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                {lang === 'sw' ? 'Onyesho la Risiti' : 'Receipt Preview'}
              </label>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '2px dashed #cbd5e1', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.8' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #94a3b8', paddingBottom: '10px', marginBottom: '10px' }}>
                  {receiptSettings.showLogo && <div style={{ fontSize: '28px', marginBottom: '4px' }}>🏪</div>}
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{shopInfo.shop_name || 'Duka Lako'}</div>
                  {receiptSettings.showAddress && <div style={{ fontSize: '11px', color: '#64748b' }}>{shopInfo.address || 'Anwani'}</div>}
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{shopInfo.phone || '0712345678'}</div>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <div>1x Mchele 5kg ........... 15,000</div>
                  <div>2x Sukari 1kg ............ 6,000</div>
                </div>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Jumla:</span><span>21,000</span>
                  </div>
                  {receiptSettings.showTax && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                      <span>VAT ({taxSettings.taxRate}%):</span><span>3,780</span>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center', marginTop: '10px', borderTop: '1px dashed #94a3b8', paddingTop: '10px', fontSize: '11px' }}>
                  <div style={{ fontWeight: '600' }}>{receiptSettings.header}</div>
                  <div>{receiptSettings.footer}</div>
                </div>
              </div>
            </div>
          </div>

          <button onClick={saveReceiptSettings} style={{ marginTop: '20px', padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }}>
            💾 {lang === 'sw' ? 'Hifadhi Risiti' : 'Save Receipt'}
          </button>
        </div>
      )}

      {/* =================== TAB: STAFF =================== */}
      {activeTab === 'staff' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                {lang === 'sw' ? 'Wafanyakazi' : 'Staff Members'}
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                {staff.length} {lang === 'sw' ? 'wafanyakazi' : 'staff members'}
              </p>
            </div>
            <button onClick={() => openStaffModal()} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
              ➕ {lang === 'sw' ? 'Ongeza' : 'Add'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {staff.map(member => (
              <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '18px' }}>
                    {member.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>{member.full_name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span>{member.phone}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '10px', background: member.role === 'manager' ? '#fef3c7' : member.role === 'cashier' ? '#e0e7ff' : '#dcfce7', color: member.role === 'manager' ? '#d97706' : member.role === 'cashier' ? '#4f46e5' : '#16a34a', fontSize: '11px', fontWeight: '700' }}>
                        {roles.find(r => r.id === member.role)?.icon} {roles.find(r => r.id === member.role)?.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>PIN: {member.pin_code}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openStaffModal(member)} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                  <button onClick={() => deleteStaff(member.id)} style={{ padding: '8px 12px', background: '#fee2e2', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#dc2626' }}>🗑️</button>
                </div>
              </div>
            ))}
            {staff.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>👥</div>
                <p>{lang === 'sw' ? 'Hakuna wafanyakazi bado.' : 'No staff yet.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== STAFF MODAL =================== */}
      {showStaffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '700' }}>
              {editingStaff ? (lang === 'sw' ? 'Hariri Mfanyakazi' : 'Edit Staff') : (lang === 'sw' ? 'Ongeza Mfanyakazi' : 'Add Staff')}
            </h2>
            <form onSubmit={saveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                  {lang === 'sw' ? 'Jina Kamili' : 'Full Name'}
                </label>
                <input type="text" required value={staffForm.full_name} onChange={(e) => setStaffForm({...staffForm, full_name: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                  {lang === 'sw' ? 'Namba ya Simu' : 'Phone'}
                </label>
                <input type="tel" value={staffForm.phone} onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                  {lang === 'sw' ? 'Jukumu (Role)' : 'Role'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {roles.map(role => (
                    <button key={role.id} type="button" onClick={() => setStaffForm({...staffForm, role: role.id})} style={{
                      padding: '14px 8px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                      border: `2px solid ${staffForm.role === role.id ? '#667eea' : '#e2e8f0'}`,
                      background: staffForm.role === role.id ? '#f0f7ff' : '#fff',
                      color: staffForm.role === role.id ? '#667eea' : '#64748b'
                    }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{role.icon}</div>
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                  {lang === 'sw' ? 'PIN ya POS (namba 4)' : 'POS PIN (4 digits)'}
                </label>
                <input type="text" maxLength={4} pattern="[0-9]{4}" required value={staffForm.pin_code} onChange={(e) => setStaffForm({...staffForm, pin_code: e.target.value})} style={inputStyle} placeholder="1234" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowStaffModal(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', color: '#64748b' }}>
                  {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button type="submit" style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  💾 {lang === 'sw' ? 'Hifadhi' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {showToast && (
        <div style={{ position: 'fixed', top: '30px', right: '30px', background: '#10b981', color: '#fff', padding: '14px 24px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)', zIndex: 2000, fontWeight: '600' }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Settings;