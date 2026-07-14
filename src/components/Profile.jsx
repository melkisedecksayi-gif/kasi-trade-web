import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import Skeleton from './Skeleton';

const Profile = ({ lang, supabase, currentShop, isDarkMode, setActivePage, session, theme, avatarUrl: parentAvatarUrl, setAvatarUrl: updateParentAvatar }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({ full_name: '', phone: '', business_name: '', region: '', district: '', ward: '' });
  const isSw = lang === 'sw';
  const localTheme = { cardBg: isDarkMode ? '#1e293b' : '#ffffff', text: isDarkMode ? '#f1f5f9' : '#0f172a', textMuted: isDarkMode ? '#94a3b8' : '#475569', border: isDarkMode ? '#334155' : '#e2e8f0', hoverBg: isDarkMode ? '#334155' : '#f1f5f9' }; const th = theme || localTheme;

  const showToast = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { if (session?.user) fetchProfile(); }, [session]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (data) {
        setProfile(data);
        setAvatarUrl(data.avatar_url);
        if (data.avatar_url) updateParentAvatar(data.avatar_url);
        setForm({ full_name: data.full_name || '', phone: data.phone || '', business_name: data.business_name || '', region: data.region || '', district: data.district || '', ward: data.ward || '' });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('profiles').update(form).eq('id', session.user.id);
      if (error) throw error;
      setProfile({ ...profile, ...form });
      setEditing(false);
      showToast(isSw ? 'Wasifu umesasishwa' : 'Profile updated');
    } catch (e) { showToast(e.message, true); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2097152) { showToast(isSw ? 'Picha ni kubwa sana (max 2MB)' : 'Image too large (max 2MB)', true); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const { error: upErr } = await supabase.from('profiles').update({ avatar_url: dataUrl }).eq('id', session.user.id);
      if (upErr) throw upErr;

      setAvatarUrl(dataUrl);
      if (profile) setProfile({ ...profile, avatar_url: dataUrl });
      updateParentAvatar(dataUrl);
      showToast(isSw ? 'Picha imepakiwa' : 'Photo uploaded');
    } catch (e) { showToast(e.message || 'Upload failed', true); }
    finally { setUploading(false); }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <Skeleton width="80px" height="80px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" height="20px" />
            <Skeleton width="40%" height="14px" style={{ marginTop: '8px' }} />
          </div>
        </div>
        <Skeleton height="120px" borderRadius="12px" />
        <Skeleton height="120px" borderRadius="12px" style={{ marginTop: '14px' }} />
      </div>
    );
  }

  const initials = (profile?.full_name || session?.user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.err ? '#ef4444' : '#10b981', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontWeight: '600', fontSize: '13px' }}>{toast.msg}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setActivePage?.('dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: th.text, fontSize: '20px' }}>←</button>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: th.text, margin: 0 }}>{isSw ? 'Wasifu' : 'Profile'}</h2>
      </div>

      {/* Avatar Section */}
      <div style={{ background: th.cardBg, border: `1px solid ${th.border}`, borderRadius: '16px', padding: '28px', textAlign: 'center', marginBottom: '14px' }}>
        <input type="file" ref={fileRef} onChange={handleUpload} accept="image/*" style={{ display: 'none' }} />
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${th.border}` }} onError={() => setAvatarUrl(null)} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: '#fff' }}>
              {initials}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
            position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%',
            border: `2px solid ${th.cardBg}`, background: '#6366f1', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
          }}>
            {uploading ? '...' : <Icons.Plus size={12} color="#fff" />}
          </button>
        </div>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: th.text }}>{profile?.full_name || session?.user?.email}</h3>
        <p style={{ margin: 0, fontSize: '12px', color: th.textMuted }}>{session?.user?.email}</p>
        <div style={{ marginTop: '8px' }}>
          <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: '11px', fontWeight: '600' }}>
            {profile?.business_name || currentShop?.shop_name || 'KasiTRADE'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div style={{ background: th.cardBg, border: `1px solid ${th.border}`, borderRadius: '16px', padding: '22px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: th.text }}>{isSw ? 'Taarifa Binafsi' : 'Personal Info'}</h3>
          <button onClick={() => setEditing(!editing)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: editing ? 'rgba(239,68,68,0.1)' : '#6366f1', color: editing ? '#ef4444' : '#fff', fontSize: '11px', fontWeight: '600' }}>
            {editing ? (isSw ? 'Ghairi' : 'Cancel') : (isSw ? 'Hariri' : 'Edit')}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { k: 'full_name', label: isSw ? 'Jina Kamili' : 'Full Name', icon: <Icons.User size={14} color={th.textMuted} /> },
            { k: 'phone', label: isSw ? 'Simu' : 'Phone', icon: <Icons.Phone size={14} color={th.textMuted} /> },
            { k: 'business_name', label: isSw ? 'Jina la Biashara' : 'Business Name', icon: <Icons.Building size={14} color={th.textMuted} /> },
            { k: 'region', label: isSw ? 'Mkoa' : 'Region', icon: <Icons.Box size={14} color={th.textMuted} /> },
            { k: 'district', label: isSw ? 'Wilaya' : 'District', icon: <Icons.Box size={14} color={th.textMuted} /> },
            { k: 'ward', label: isSw ? 'Kata' : 'Ward', icon: <Icons.Box size={14} color={th.textMuted} /> },
          ].map(f => (
            <div key={f.k} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: th.hoverBg, borderRadius: '8px' }}>
              {f.icon}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: th.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</div>
                {editing ? (
                  <input value={form[f.k] || ''} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                    style={{ width: '100%', padding: '4px 0', border: 'none', background: 'transparent', color: th.text, fontSize: '13px', fontWeight: '600', outline: 'none', borderBottom: `1px solid ${th.border}` }}
                  />
                ) : (
                  <div style={{ fontSize: '13px', fontWeight: '600', color: th.text }}>{profile?.[f.k] || form[f.k] || '-'}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <button onClick={handleSave} style={{ marginTop: '14px', width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
            {isSw ? 'Hifadhi' : 'Save'}
          </button>
        )}
      </div>

      {/* Shop Info */}
      {currentShop && (
        <div style={{ background: th.cardBg, border: `1px solid ${th.border}`, borderRadius: '16px', padding: '22px', marginBottom: '14px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '700', color: th.text }}>{isSw ? 'Duka Linalotumika' : 'Active Shop'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: isSw ? 'Jina' : 'Name', value: currentShop.shop_name },
              { label: isSw ? 'Aina' : 'Type', value: currentShop.business_type },
              { label: isSw ? 'Tarehe' : 'Created', value: new Date(currentShop.created_at).toLocaleDateString() },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: th.hoverBg, borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: th.textMuted }}>{item.label}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: th.text }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Go to Settings */}
      <button onClick={() => setActivePage?.('settings')} style={{
        width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${th.border}`,
        background: th.cardBg, color: th.text, cursor: 'pointer', fontWeight: '600', fontSize: '13px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
      }}>
        <Icons.Settings size={14} color={th.textMuted} /> {isSw ? 'Mipangilio' : 'Settings'}
      </button>
    </div>
  );
};

export default Profile;
