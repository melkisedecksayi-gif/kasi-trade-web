import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const Profile = ({ lang = 'sw', supabase, isDarkMode = false, onBack, onProfileUpdate }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    gender: '',
    address: '',
    business_name: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (user) {
          setUser(user);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }
          
          if (profileData) {
            setProfile(profileData);
            setEditForm({
              full_name: profileData.full_name || '',
              phone: profileData.phone || '',
              gender: profileData.gender || '',
              address: profileData.address || '',
              business_name: profileData.business_name || ''
            });
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        triggerToast(lang === 'sw' ? 'Hitilafu: ' + err.message : 'Error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [supabase, lang]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      triggerToast(lang === 'sw' ? 'Hakuna picha iliyochaguliwa' : 'No file selected');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      triggerToast(lang === 'sw' ? 'Picha ni kubwa sana! Max 2MB' : 'Photo too large! Max 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      triggerToast(lang === 'sw' ? 'Tafadhali chagua picha tu' : 'Please select an image only');
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result;
          
          const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: base64 })
            .eq('id', user.id);

          if (error) throw error;
          
          setProfile({ ...profile, avatar_url: base64 });
          
          if (onProfileUpdate) {
            await onProfileUpdate();
          }
          
          triggerToast(lang === 'sw' ? '✅ Picha imebadilishwa!' : '✅ Photo updated!');
        } catch (err) {
          console.error('Error:', err);
          triggerToast(lang === 'sw' ? 'Hitilafu: ' + err.message : 'Error: ' + err.message);
        } finally {
          setUploadingPhoto(false);
        }
      };
      
      reader.onerror = () => {
        triggerToast(lang === 'sw' ? 'Hitilafu ya kusoma faili' : 'Error reading file');
        setUploadingPhoto(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      triggerToast(lang === 'sw' ? 'Hitilafu: ' + err.message : 'Error: ' + err.message);
      setUploadingPhoto(false);
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile({ ...profile, ...editForm });
      setShowEditModal(false);
      if (onProfileUpdate) await onProfileUpdate();
      triggerToast(lang === 'sw' ? '✅ Taarifa zimesasishwa!' : '✅ Profile updated!');
    } catch (err) {
      triggerToast(lang === 'sw' ? 'Hitilafu: ' + err.message : 'Error: ' + err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      triggerToast(lang === 'sw' ? '❌ Nenosiri hazifanani!' : '❌ Passwords do not match!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      triggerToast(lang === 'sw' ? '❌ Nenosiri iwe na herufi 6+' : '❌ Password must be 6+ characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;
      
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      triggerToast(lang === 'sw' ? '✅ Nenosiri limebadilishwa!' : '✅ Password changed!');
    } catch (err) {
      triggerToast(lang === 'sw' ? '❌ Hitilafu: ' + err.message : '❌ Error: ' + err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return date.toLocaleDateString('sw-TZ', { year: 'numeric', month: '2-digit', day: '2-digit' }) + 
           ' ' + date.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' });
  };

  const inputStyle = {
    width: '100%', padding: '12px',
    border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
    borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: isDarkMode ? '#334155' : '#fff', color: isDarkMode ? '#f1f5f9' : '#0f172a'
  };

  const cardStyle = {
    background: isDarkMode ? '#1e293b' : '#fff',
    padding: '32px',
    borderRadius: '16px',
    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
        <Icons.User size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
        <p>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#6366f1',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 0'
          }}
        >
          <Icons.ArrowLeft size={16} /> {lang === 'sw' ? 'Rudi' : 'Back'}
        </button>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: `4px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ color: '#fff', fontSize: '64px', fontWeight: '700' }}>
                  {(profile?.full_name || profile?.business_name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <label 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: uploadingPhoto ? '#94a3b8' : '#6366f1',
                color: '#fff',
                borderRadius: '10px',
                cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: uploadingPhoto ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <Icons.Camera size={16} />
              {uploadingPhoto 
                ? (lang === 'sw' ? '⏳ Inapakiwa...' : '⏳ Uploading...') 
                : (lang === 'sw' ? '📷 Chagua Picha' : '📷 Select Picture')}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
                disabled={uploadingPhoto}
              />
            </label>
          </div>

          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
              {profile?.full_name || profile?.business_name || 'User'}
            </h2>
            <p style={{ margin: '0 0 24px', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '14px' }}>
              ({profile?.business_name || '---'})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: lang === 'sw' ? 'Barua pepe' : 'Email', value: user?.email || '---', icon: Icons.Mail },
                { label: lang === 'sw' ? 'Namba ya Simu' : 'Phone number', value: profile?.phone || '---', icon: Icons.Phone },
                { label: lang === 'sw' ? 'Jinsia' : 'Gender', value: profile?.gender || '---', icon: Icons.User },
                { label: lang === 'sw' ? 'Anwani' : 'Address', value: profile?.address || '---', icon: Icons.Home },
                { label: lang === 'sw' ? 'Kampuni' : 'Company', value: profile?.business_name || '---', icon: Icons.Building },
                { label: lang === 'sw' ? 'Tarehe ya kujiunga' : 'Created date', value: formatDate(user?.created_at), icon: Icons.Calendar },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '120px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: isDarkMode ? '#cbd5e1' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Icon size={16} /> {item.label}
                    </div>
                    <div style={{ color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: '14px' }}>:</div>
                    <div style={{ 
                      flex: 1, 
                      fontSize: '14px', 
                      color: isDarkMode ? '#f1f5f9' : '#0f172a',
                      fontWeight: '500'
                    }}>
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowEditModal(true)}
                style={{
                  padding: '12px 24px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Icons.Edit size={16} /> {lang === 'sw' ? 'Hariri' : 'Edit'}
              </button>
              <button 
                onClick={() => setShowPasswordModal(true)}
                style={{
                  padding: '12px 24px',
                  background: isDarkMode ? '#334155' : '#64748b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Icons.Lock size={16} /> {lang === 'sw' ? 'Badilisha Nenosiri' : 'Change password'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                {lang === 'sw' ? 'Hariri Wasifu' : 'Edit Profile'}
              </h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                <Icons.X size={16} />
              </button>
            </div>
            <form onSubmit={handleEditProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                  {lang === 'sw' ? 'Jina Kamili' : 'Full Name'}
                </label>
                <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                  {lang === 'sw' ? 'Namba ya Simu' : 'Phone'}
                </label>
                <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                  {lang === 'sw' ? 'Jinsia' : 'Gender'}
                </label>
                <select value={editForm.gender} onChange={(e) => setEditForm({...editForm, gender: e.target.value})} style={inputStyle}>
                  <option value="">{lang === 'sw' ? 'Chagua...' : 'Select...'}</option>
                  <option value="male">{lang === 'sw' ? 'Mwanaume' : 'Male'}</option>
                  <option value="female">{lang === 'sw' ? 'Mwanamke' : 'Female'}</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                  {lang === 'sw' ? 'Anwani' : 'Address'}
                </label>
                <input type="text" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                  {lang === 'sw' ? 'Jina la Biashara' : 'Business Name'}
                </label>
                <input type="text" value={editForm.business_name} onChange={(e) => setEditForm({...editForm, business_name: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '12px', background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: isDarkMode ? '#f1f5f9' : '#475569' }}>
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

      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                {lang === 'sw' ? 'Badilisha Nenosiri' : 'Change Password'}
              </h2>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                <Icons.X size={16} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                  {lang === 'sw' ? 'Nenosiri Jipya' : 'New Password'}
                </label>
                <input type="password" required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                  {lang === 'sw' ? 'Thibitisha Nenosiri' : 'Confirm Password'}
                </label>
                <input type="password" required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} style={{ flex: 1, padding: '12px', background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: isDarkMode ? '#f1f5f9' : '#475569' }}>
                  {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                  {lang === 'sw' ? 'Badilisha' : 'Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showToast && (
        <div style={{ 
          position: 'fixed', 
          top: '30px', 
          right: '30px', 
          background: toastMessage.includes('❌') || toastMessage.includes('Error') || toastMessage.includes('Hitilafu') ? '#ef4444' : '#10b981', 
          color: '#fff', 
          padding: '14px 24px', 
          borderRadius: '12px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
          zIndex: 2000, 
          fontWeight: '600', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Profile;