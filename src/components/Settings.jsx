import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const Settings = ({ lang, supabase, currentShop, isDarkMode, setActivePage, session, onLogout, setIsDarkMode, setLang, shops, setShops, onShopChange, theme }) => {
  const [toast, setToast] = useState(null);
  const [showAddShop, setShowAddShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopType, setNewShopType] = useState('duka');
  const [deletingId, setDeletingId] = useState(null);
  const [smsSettings, setSmsSettings] = useState({
    is_enabled: false,
    auto_close_enabled: false,
    auto_close_time: '22:00',
    phone: currentShop?.phone || ''
  });
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsLoaded, setSmsLoaded] = useState(false);
  const isSw = lang === 'sw';
  const th = theme || {};

  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchSmsSettings = async () => {
      try {
        const { data } = await supabase.from('sms_settings').select('*').eq('shop_id', currentShop.id).maybeSingle();
        setSmsSettings(prev => ({
          is_enabled: data?.is_enabled || false,
          auto_close_enabled: data?.auto_close_enabled || false,
          auto_close_time: data?.auto_close_time || '22:00',
          phone: currentShop?.phone || prev.phone || ''
        }));
      } catch (e) { console.warn('SMS settings fetch:', e); }
      finally { setSmsLoaded(true); }
    };
    fetchSmsSettings();
  }, [currentShop?.id, currentShop?.phone, supabase]);

  const handleSaveSmsSettings = async () => {
    if (!currentShop?.id) return;
    setSmsSaving(true);
    try {
      const saveData = {
        is_enabled: smsSettings.is_enabled,
        auto_close_enabled: smsSettings.auto_close_enabled,
        auto_close_time: smsSettings.auto_close_time
      };
      const { data: existing } = await supabase.from('sms_settings').select('id').eq('shop_id', currentShop.id).maybeSingle();
      if (existing) {
        await supabase.from('sms_settings').update(saveData).eq('shop_id', currentShop.id);
      } else {
        await supabase.from('sms_settings').insert({ shop_id: currentShop.id, ...saveData });
      }
      if (smsSettings.phone && smsSettings.phone !== currentShop?.phone) {
        const { data: updatedShop } = await supabase.from('shops').update({ phone: smsSettings.phone }).eq('id', currentShop.id).select().single();
        if (updatedShop) onShopChange(updatedShop);
      }
      showToast(isSw ? 'Mipangilio ya SMS imehifadhiwa!' : 'SMS settings saved!');
    } catch (e) { showToast(e.message); }
    finally { setSmsSaving(false); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleCreateShop = async () => {
    if (!newShopName.trim()) return showToast(isSw ? 'Ingiza jina la duka' : 'Enter shop name');
    try {
      const { data, error } = await supabase.from('shops').insert({
        owner_id: session.user.id, shop_name: newShopName, business_type: newShopType
      }).select().single();
      if (error) throw error;
      setShops([...shops, data]);
      onShopChange(data);
      setShowAddShop(false); setNewShopName('');
      showToast(isSw ? 'Duka limeongezwa!' : 'Shop added!');
    } catch (e) { showToast(e.message); }
  };

  const handleDeleteShop = async (shopId) => {
    try {
      const { error } = await supabase.from('shops').delete().eq('id', shopId);
      if (error) throw error;
      const updated = shops.filter(s => s.id !== shopId);
      setShops(updated);
      if (currentShop?.id === shopId && updated.length > 0) onShopChange(updated[0]);
      setDeletingId(null);
      showToast(isSw ? 'Duka limefutwa' : 'Shop deleted');
    } catch (e) { showToast(e.message); }
  };

  const tText = th.text || (isDarkMode ? '#f1f5f9' : '#0f172a');
  const tTextMuted = th.textSecondary || (isDarkMode ? '#94a3b8' : '#475569');
  const tBorder = th.border || (isDarkMode ? '#334155' : '#e2e8f0');
  const tHoverBg = th.surfaceHover || (isDarkMode ? '#334155' : '#f1f5f9');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#10b981', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontWeight: 600, fontSize: '13px' }}>{toast}</div>
      )}

      <h2 className="text-h2 mb-xl" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Icons.Settings size={22} color={tTextMuted} />
        {isSw ? 'Mipangilio' : 'Settings'}
      </h2>

      <div className="flex flex-col" style={{ gap: '14px' }}>
        {/* Shops Management */}
        <div className="card card-xl" style={{ padding: '22px', borderRadius: '16px' }}>
          <div className="flex justify-between items-center mb-lg">
            <h3 className="text-h4" style={{ margin: 0 }}>{isSw ? 'Maduka' : 'Shops'}</h3>
            <button onClick={() => setShowAddShop(true)} className="btn btn-primary btn-sm" style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px' }}>
              <Icons.Plus size={14} color="#fff" /> {isSw ? 'Ongeza Duka' : 'Add Shop'}
            </button>
          </div>

          <div className="flex flex-col" style={{ gap: '6px' }}>
            {shops.map(shop => {
              const isActive = currentShop?.id === shop.id;
              return (
                <div key={shop.id} className="flex items-center justify-between" style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: isActive ? (isDarkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)') : tHoverBg,
                  border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: tText }}>{shop.shop_name}</div>
                    <div className="text-micro">{shop.business_type || 'duka'}</div>
                  </div>
                  <div className="flex" style={{ gap: '6px' }}>
                    {!isActive && (
                      <button onClick={() => onShopChange(shop)} className="btn btn-primary" style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px' }}>
                        {isSw ? 'Badilisha' : 'Switch'}
                      </button>
                    )}
                    {shops.length > 1 && (
                      <button onClick={() => setDeletingId(shop.id)} className="btn" style={{
                        padding: '5px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '11px', fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Icons.Trash size={12} color="#ef4444" /> {isSw ? 'Futa' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Shop Modal */}
        {showAddShop && (
          <div className="modal-overlay" onClick={() => setShowAddShop(false)}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()} style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 className="text-h4 mb-lg">{isSw ? 'Duka Jipya' : 'New Shop'}</h3>
              <input value={newShopName} onChange={e => setNewShopName(e.target.value)} className="input mb-md"
                placeholder={isSw ? 'Jina la duka' : 'Shop name'} />
              <select value={newShopType} onChange={e => setNewShopType(e.target.value)} className="select mb-lg" style={{ width: '100%' }}>
                <option value="duka">{isSw ? 'Duka' : 'Shop'}</option>
                <option value="microfinance">Microfinance</option>
                <option value="restaurant">{isSw ? 'Mgahawa' : 'Restaurant'}</option>
                <option value="pharmacy">{isSw ? 'Duka la Dawa' : 'Pharmacy'}</option>
              </select>
              <div className="flex" style={{ gap: '8px' }}>
                <button onClick={() => setShowAddShop(false)} className="btn btn-secondary" style={{ flex: 1 }}>{isSw ? 'Ghairi' : 'Cancel'}</button>
                <button onClick={handleCreateShop} className="btn btn-primary" style={{ flex: 1 }}>{isSw ? 'Hifadhi' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deletingId && (
          <div className="modal-overlay" style={{ zIndex: 1001 }} onClick={() => setDeletingId(null)}>
            <div className="modal" style={{ maxWidth: '360px', padding: '24px', borderRadius: '16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <div style={{ marginBottom: '12px' }}><Icons.Alert size={36} color="#ef4444" /></div>
              <h3 className="text-h4 mb-sm">{isSw ? 'Futa Duka?' : 'Delete Shop?'}</h3>
              <p className="text-small mb-lg">{isSw ? 'Hakikisha unataka kufuta. Data zote za duka hili zitapotea.' : 'Are you sure? All shop data will be lost.'}</p>
              <div className="flex" style={{ gap: '8px' }}>
                <button onClick={() => setDeletingId(null)} className="btn btn-secondary" style={{ flex: 1 }}>{isSw ? 'Ghairi' : 'Cancel'}</button>
                <button onClick={() => handleDeleteShop(deletingId)} className="btn btn-danger" style={{ flex: 1 }}>{isSw ? 'Futa' : 'Delete'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Preferences */}
        <div className="card card-xl" style={{ padding: '22px', borderRadius: '16px' }}>
          <h3 className="text-h4 mb-lg">{isSw ? 'Mapendeleo' : 'Preferences'}</h3>
          <div className="flex flex-col" style={{ gap: '10px' }}>
            <div className="flex justify-between items-center" style={{ padding: '10px 14px', background: tHoverBg, borderRadius: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: tText }}>{isSw ? 'Hali ya Giza' : 'Dark Mode'}</span>
              <button onClick={() => { setIsDarkMode(!isDarkMode); localStorage.setItem('app_darkMode', String(!isDarkMode)); showToast('Done'); }} style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: isDarkMode ? '#6366f1' : '#cbd5e1', position: 'relative', transition: 'background 0.2s'
              }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: isDarkMode ? '23px' : '3px', transition: 'left 0.2s' }} />
              </button>
            </div>
            <div className="flex justify-between items-center" style={{ padding: '10px 14px', background: tHoverBg, borderRadius: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: tText }}>{isSw ? 'Lugha' : 'Language'}</span>
              <div className="flex" style={{ gap: '4px' }}>
                <button onClick={() => { if (lang !== 'sw') { setLang('sw'); localStorage.setItem('app_lang', 'sw'); showToast('Done'); } }} style={{
                  padding: '4px 8px', borderRadius: '6px', border: lang === 'sw' ? '2px solid #6366f1' : `1px solid ${tBorder}`,
                  background: lang === 'sw' ? 'rgba(99,102,241,0.1)' : 'transparent', cursor: 'pointer', fontSize: '20px', lineHeight: 1
                }}>🇹🇿</button>
                <button onClick={() => { if (lang !== 'en') { setLang('en'); localStorage.setItem('app_lang', 'en'); showToast('Done'); } }} style={{
                  padding: '4px 8px', borderRadius: '6px', border: lang === 'en' ? '2px solid #6366f1' : `1px solid ${tBorder}`,
                  background: lang === 'en' ? 'rgba(99,102,241,0.1)' : 'transparent', cursor: 'pointer', fontSize: '20px', lineHeight: 1
                }}>🇺🇸</button>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Settings */}
        <div className="card card-xl" style={{ padding: '22px', borderRadius: '16px' }}>
          <h3 className="text-h4 mb-lg">{isSw ? 'Mipangilio ya SMS (Meseji)' : 'SMS Settings (Meseji)'}</h3>
          {!smsLoaded ? (
            <div style={{ fontSize: '13px', color: tTextMuted }}>{isSw ? 'Inapakia...' : 'Loading...'}</div>
          ) : (
            <div className="flex flex-col" style={{ gap: '10px' }}>
              <div className="flex justify-between items-center" style={{ padding: '10px 14px', background: tHoverBg, borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: tText }}>{isSw ? 'Washa SMS' : 'Enable SMS'}</span>
                  <div className="text-micro" style={{ color: tTextMuted, marginTop: '2px' }}>{isSw ? 'Wezesha utumaji wa SMS' : 'Enable SMS sending'}</div>
                </div>
                <button onClick={() => setSmsSettings({ ...smsSettings, is_enabled: !smsSettings.is_enabled })} style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: smsSettings.is_enabled ? '#6366f1' : '#cbd5e1', position: 'relative', transition: 'background 0.2s'
                }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: smsSettings.is_enabled ? '23px' : '3px', transition: 'left 0.2s' }} />
                </button>
              </div>

              <div className="flex flex-col" style={{ padding: '10px 14px', background: tHoverBg, borderRadius: '10px', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: tText }}>
                  {isSw ? 'Namba ya Kupokea SMS' : 'SMS Recipient Phone'}
                </span>
                <input type="tel" value={smsSettings.phone} onChange={e => setSmsSettings({ ...smsSettings, phone: e.target.value })}
                  className="input" placeholder="255XXXXXXXXX" style={{ fontSize: '13px' }} />
                <div className="text-micro" style={{ color: tTextMuted }}>
                  {isSw ? 'Namba itakayopokea ripoti za kila siku' : 'Phone number that will receive daily reports'}
                </div>
              </div>

              <div className="flex justify-between items-center" style={{ padding: '10px 14px', background: tHoverBg, borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: tText }}>{isSw ? 'Funga Duka Kiotomatiki' : 'Auto Close Day'}</span>
                  <div className="text-micro" style={{ color: tTextMuted, marginTop: '2px' }}>{isSw ? 'Tuma ripoti kiotomatiki wakati wa kufunga' : 'Auto-send report at closing time'}</div>
                </div>
                <button onClick={() => setSmsSettings({ ...smsSettings, auto_close_enabled: !smsSettings.auto_close_enabled })} style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: smsSettings.auto_close_enabled ? '#6366f1' : '#cbd5e1', position: 'relative', transition: 'background 0.2s'
                }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: smsSettings.auto_close_enabled ? '23px' : '3px', transition: 'left 0.2s' }} />
                </button>
              </div>

              {smsSettings.auto_close_enabled && (
                <div className="flex justify-between items-center" style={{ padding: '10px 14px', background: tHoverBg, borderRadius: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: tText }}>{isSw ? 'Saa ya Kufunga' : 'Closing Time'}</span>
                  <input type="time" value={smsSettings.auto_close_time} onChange={e => setSmsSettings({ ...smsSettings, auto_close_time: e.target.value })}
                    style={{
                      padding: '6px 10px', borderRadius: '8px', border: `1px solid ${tBorder}`,
                      background: isDarkMode ? '#1e293b' : '#fff', color: tText, fontSize: '13px', width: '120px'
                    }} />
                </div>
              )}

              <button onClick={handleSaveSmsSettings} disabled={smsSaving} className="btn btn-primary" style={{
                width: '100%', padding: '10px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', marginTop: '4px'
              }}>
                {smsSaving ? (isSw ? 'Inahifadhi...' : 'Saving...') : (isSw ? 'Hifadhi Mipangilio' : 'Save Settings')}
              </button>
            </div>
          )}
        </div>

        {/* Account */}
        {session?.user && (
          <div className="card card-xl" style={{ padding: '22px', borderRadius: '16px' }}>
            <h3 className="text-h4 mb-sm">{isSw ? 'Akaunti' : 'Account'}</h3>
            <div className="text-small mb-md">{session.user.email}</div>
          </div>
        )}

        {/* Logout */}
        <button onClick={onLogout} className="btn btn-danger" style={{
          width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700, fontSize: '14px'
        }}>
          <Icons.LogOut size={16} color="#ef4444" /> {isSw ? 'Toka' : 'Logout'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
