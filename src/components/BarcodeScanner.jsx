import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { THEME } from '../theme';

const BarcodeScanner = ({ onScan, onClose, products, lang }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const html5QrCodeRef = useRef(null);

  // ✅ Scan product by barcode
  const findProductByBarcode = useCallback((code) => {
    return products.find(p => 
      p.barcode && String(p.barcode).trim() === code.trim()
    );
  }, [products]);

  // ✅ Handle successful scan (wrapped in useCallback for deps)
  const handleScanSuccess = useCallback((decodedText) => {
    const product = findProductByBarcode(decodedText);
    if (product) {
      // 📳 Haptic feedback (if supported)
      if (navigator.vibrate) navigator.vibrate(50);
      onScan(product);
    } else {
      setError(lang === 'sw' ? `❌ Bidhaa ya barcode "${decodedText}" haipatikani` : `❌ Product with barcode "${decodedText}" not found`);
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }
  }, [findProductByBarcode, onScan, lang]);

  // ✅ Initialize scanner
  useEffect(() => {
    if (!scannerRef.current) return;

    const html5QrCode = new Html5Qrcode('barcode-scanner-region');
    html5QrCodeRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true
      // ✅ Removed supportedScanTypes (not needed, camera is default)
    };

    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => handleScanSuccess(decodedText),
      (errorMessage) => {
        // Ignore scan errors - they're normal during scanning
      }
    ).catch(err => {
      console.error('Scanner error:', err);
      setError(lang === 'sw' ? '❌ Imeshindwa kufungua kamera. Jaribu ruhusa au tumia namba ya mkono.' : '❌ Failed to open camera. Check permissions or use manual entry.');
    });

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [handleScanSuccess, lang]); // ✅ Added handleScanSuccess to deps

  // ✅ Manual barcode entry fallback
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanSuccess(manualCode.trim());
    setManualCode('');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: THEME.space.l
    }}>
      <div style={{
        background: '#fff', borderRadius: THEME.radius.lg, padding: THEME.space.xl,
        maxWidth: '400px', width: '100%', boxShadow: THEME.shadow.lg
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.space.l }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>📷 {lang === 'sw' ? 'Scan Barcode' : 'Scan Barcode'}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
            color: '#64748b', padding: THEME.space.xs
          }}>✕</button>
        </div>

        {/* Scanner Viewfinder */}
        <div id="barcode-scanner-region" ref={scannerRef} style={{
          width: '100%', borderRadius: THEME.radius.md, overflow: 'hidden',
          background: '#000', marginBottom: THEME.space.m
        }} />

        {/* Instructions */}
        <p style={{ 
          fontSize: '13px', color: '#64748b', textAlign: 'center', 
          margin: `0 0 ${THEME.space.m}` 
        }}>
          {lang === 'sw' 
            ? '🎯 Elekeza kamera kwenye barcode ya bidhaa' 
            : '🎯 Point camera at product barcode'}
        </p>

        {/* Error Message */}
        {error && (
          <p style={{
            background: '#fef2f2', color: '#dc2626', padding: THEME.space.m,
            borderRadius: THEME.radius.sm, fontSize: '13px', marginBottom: THEME.space.m,
            textAlign: 'center'
          }}>
            {error}
          </p>
        )}

        {/* Manual Entry Fallback */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: THEME.space.s }}>
          <input
            type="text"
            placeholder={lang === 'sw' ? 'Andika barcode...' : 'Enter barcode...'}
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            style={{
              flex: 1, padding: THEME.space.m, border: `1px solid #e2e8f0`,
              borderRadius: THEME.radius.sm, fontSize: '14px'
            }}
          />
          <button type="submit" style={{
            padding: `${THEME.space.m} ${THEME.space.l}`, background: THEME.colors.primary,
            color: '#fff', border: 'none', borderRadius: THEME.radius.sm,
            cursor: 'pointer', fontWeight: '600'
          }}>
            {lang === 'sw' ? 'Ongeza' : 'Add'}
          </button>
        </form>

        {/* Close Button */}
        <button onClick={onClose} style={{
          width: '100%', marginTop: THEME.space.m, padding: THEME.space.m,
          background: '#f1f5f9', color: '#0f172a', border: 'none',
          borderRadius: THEME.radius.sm, cursor: 'pointer', fontWeight: '600'
        }}>
          {lang === 'sw' ? 'Funga Scanner' : 'Close Scanner'}
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;