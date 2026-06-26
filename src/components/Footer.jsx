import React, { useState } from 'react';
import Toast from './Toast';

const Footer = ({ lang }) => {
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => setToast({ message, type, id: Date.now() });

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      showToast(lang === 'sw' ? '✅ Asante kwa kujiandikisha!' : '✅ Thanks for subscribing!', 'success');
      setEmail('');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0047AB 0%, #002F87 100%)', color: '#fff', overflow: 'hidden' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Animated Wave */}
      <div style={{ position: 'absolute', top: '-100px', left: 0, width: '100%', overflow: 'hidden', lineHeight: 0 }}>
        <svg style={{ position: 'relative', display: 'block', width: 'calc(100% + 1.3px)', height: '100px' }} xmlns="http://www.w3.org/2000/svg">
          <path d="M0 50 Q 50 100 100 50 T 200 50 T 300 50 T 400 50 T 500 50 T 600 50 T 700 50 T 800 50 T 900 50 T 1000 50 T 1100 50 T 1200 50 T 1300 50 T 1400 50 T 1500 50 T 1600 50 T 1700 50 T 1800 50 T 1900 50 T 2000 50 V 100 H 0 Z" fill="#fff" style={{ animation: 'wave 10s linear infinite' }} />
        </svg>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          
          {/* Brand Section */}
          <div>
            <div style={{ fontSize: '32px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '40px' }}>🏪</span>
              <span style={{ fontWeight: '700', fontSize: '28px' }}>KasiTRADE</span>
            </div>
            <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontSize: '14px' }}>
              {lang === 'sw' ? 'Mfumo wa kisasa wa POS unaokusaidia kusimamia biashara yako kwa urahisi na ufanisi.' : 'Modern POS system to help you manage your business with ease and efficiency.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['facebook', 'instagram', 'tiktok', 'whatsapp'].map((social) => (
                <button
                  key={social}
                  type="button"
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    background: 'rgba(255,255,255,0.1)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontSize: '18px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {social === 'facebook' ? '📘' : social === 'instagram' ? '📷' : social === 'tiktok' ? '🎵' : '💬'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600' }}>{lang === 'sw' ? 'Viungo vya Haraka' : 'Quick Links'}</h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {[
                { label: lang === 'sw' ? 'Dashibodi' : 'Dashboard', icon: '📊' },
                { label: lang === 'sw' ? 'Bidhaa' : 'Products', icon: '📦' },
                { label: lang === 'sw' ? 'Mauzo' : 'Sales', icon: '🛒' },
                { label: lang === 'sw' ? 'Ripoti' : 'Reports', icon: '📈' }
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: '12px' }}>
                  <button 
                    type="button"
                    style={{ 
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.8)', 
                      cursor: 'pointer',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      transition: 'all 0.3s', 
                      fontSize: '14px',
                      padding: 0
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateX(5px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600' }}>{lang === 'sw' ? 'Wasiliana Nasi' : 'Contact Us'}</h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              <li style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>📍</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.5' }}>Sinza Kumekucha, Dar es Salaam, Tanzania</span>
              </li>
              <li style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>📧</span>
                <a href="mailto:info@kasitrade.co.tz" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                >
                  info@kasitrade.co.tz
                </a>
              </li>
              <li style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>📞</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>+255 622 995 734</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600' }}>{lang === 'sw' ? 'Jiunge Nasi' : 'Subscribe'}</h4>
            <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.5' }}>
              {lang === 'sw' ? 'Pata updates na maelekezo mapya moja kwa moja kwenye email yako.' : 'Get updates and new features directly to your email.'}
            </p>
            <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="email" 
                placeholder={lang === 'sw' ? 'Email yako' : 'Your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ 
                  flex: 1, 
                  padding: '12px 16px', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button 
                type="submit"
                style={{ 
                  padding: '12px 20px', 
                  background: '#FF6B35', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FF5722'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FF6B35'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {lang === 'sw' ? 'Jiunge' : 'Join'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
            © {new Date().getFullYear()} KasiTRADE. {lang === 'sw' ? 'Haki zote zimehifadhiwa.' : 'All rights reserved.'}
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button 
              type="button"
              style={{ 
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)', 
                cursor: 'pointer',
                fontSize: '13px', 
                padding: 0,
                transition: 'color 0.3s' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
              {lang === 'sw' ? 'Sera ya Faragha' : 'Privacy Policy'}
            </button>
            <button 
              type="button"
              style={{ 
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)', 
                cursor: 'pointer',
                fontSize: '13px', 
                padding: 0,
                transition: 'color 0.3s' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
              {lang === 'sw' ? 'Masharti ya Matumizi' : 'Terms of Service'}
            </button>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button 
        type="button"
        onClick={scrollToTop}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '50px',
          height: '50px',
          background: '#FF6B35',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '20px',
          boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)',
          transition: 'all 0.3s',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.6)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)'; }}
      >
        ⬆️
      </button>

      <style>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default Footer;