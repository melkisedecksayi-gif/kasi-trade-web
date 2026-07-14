import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './design.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    if (window.confirm('KasiTRADE imeboreshwa! Bonyeza OK kupata toleo jipya.')) {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  },
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(() => {
    const installBar = document.createElement('div');
    installBar.id = 'pwa-install-bar';
    installBar.innerHTML = `
      <div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;
        background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 20px;
        border-radius:12px;display:flex;align-items:center;gap:12px;
        font-family:Inter,sans-serif;font-size:13px;font-weight:600;box-shadow:0 8px 30px rgba(99,102,241,0.4);cursor:pointer;
        animation:fadeInUp 0.4s ease;max-width:90vw;">
        <span>📲 Pakua App ya KasiTRADE</span>
        <span style="background:rgba(255,255,255,0.2);border-radius:6px;padding:4px 10px;font-size:11px;">Install</span>
      </div>`;
    installBar.onclick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') console.log('PWA installed');
        deferredPrompt = null;
      }
      installBar.remove();
    };
    document.body.appendChild(installBar);
  }, 3000);
});

document.addEventListener('focusin', () => {
  setTimeout(() => {
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 350);
});

if (window.visualViewport) {
  const vv = window.visualViewport;
  const fixLayout = () => {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      const rect = activeEl.getBoundingClientRect();
      const keyboardHeight = window.innerHeight - vv.height;
      if (keyboardHeight > 100 && rect.bottom > vv.height - 10) {
        window.scrollBy(0, rect.bottom - vv.height + 20);
      }
    }
    if (vv.height === window.innerHeight) {
      document.body.style.minHeight = '';
    }
  };
  vv.addEventListener('resize', fixLayout);
  vv.addEventListener('scroll', fixLayout);
}

