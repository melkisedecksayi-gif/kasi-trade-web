import React, { useState, useEffect } from 'react';
import { translations } from '../translations';

const ReceiptTemplates = ({ isOpen, onClose, receiptData, lang }) => {
  const t = translations[lang].receipt;
  const [template, setTemplate] = useState(localStorage.getItem('receiptTemplate') || 'detailed');
  const [logo, setLogo] = useState(localStorage.getItem('receiptLogo') || '');
  const [footerNote, setFooterNote] = useState(localStorage.getItem('receiptFooter') || 'Asante kwa kununua kwetu!');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) setShowPreview(true);
  }, [isOpen]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setLogo(base64);
        localStorage.setItem('receiptLogo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem('receiptTemplate', template);
    localStorage.setItem('receiptFooter', footerNote);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Template Styles
  const templates = {
    simple: {
      name: lang === 'sw' ? 'Rahisi' : 'Simple',
      style: {
        maxWidth: '400px',
        padding: '20px',
        background: '#fff',
        fontFamily: 'Arial, sans-serif'
      }
    },
    detailed: {
      name: lang === 'sw' ? 'Kina' : 'Detailed',
      style: {
        maxWidth: '500px',
        padding: '30px',
        background: '#fff',
        fontFamily: 'Georgia, serif',
        border: '2px solid #3b82f6'
      }
    },
    thermal: {
      name: lang === 'sw' ? 'Thermal (80mm)' : 'Thermal (80mm)',
      style: {
        maxWidth: '300px',
        padding: '10px',
        background: '#fff',
        fontFamily: 'Courier New, monospace',
        fontSize: '12px'
      }
    }
  };

  const currentTemplate = templates[template];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.7)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '25px',
        maxWidth: '900px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ margin: '0 0 20px', color: '#0f172a' }}>
          {lang === 'sw' ? 'Mipangilio ya Risiti' : 'Receipt Settings'}
        </h2>

        {/* Template Selection */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#64748b' }}>
            {lang === 'sw' ? 'Chagua Muundo' : 'Select Template'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            {Object.entries(templates).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setTemplate(key)}
                style={{
                  padding: '12px',
                  background: template === key ? '#3b82f6' : '#f1f5f9',
                  color: template === key ? '#fff' : '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: '0.2s'
                }}
              >
                {value.name}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Upload */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#64748b' }}>
            {lang === 'sw' ? 'Logo ya Duka' : 'Shop Logo'}
          </h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            style={{ marginBottom: '10px' }}
          />
          {logo && (
            <img src={logo} alt="Logo" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px' }} />
          )}
        </div>

        {/* Custom Footer */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#64748b' }}>
            {lang === 'sw' ? 'Maelezo ya Chini' : 'Footer Note'}
          </h3>
          <textarea
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            placeholder={lang === 'sw' ? 'Mfano: Karibu tena!' : 'Example: Thank you!'}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              minHeight: '60px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Preview */}
        {showPreview && receiptData && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#64748b' }}>
              {lang === 'sw' ? 'Hakikisha' : 'Preview'}
            </h3>
            <div style={{
              ...currentTemplate.style,
              margin: '0 auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }} id="receipt-preview">
              
              {/* Logo */}
              {logo && (
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <img src={logo} alt="Logo" style={{ maxWidth: '80px', maxHeight: '80px' }} />
                </div>
              )}

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: template === 'thermal' ? '1px dashed #000' : '2px solid #3b82f6', paddingBottom: '10px' }}>
                <h1 style={{ margin: '0 0 5px', fontSize: template === 'thermal' ? '14px' : '20px' }}>KasiTRADE Web</h1>
                <p style={{ margin: 0, fontSize: template === 'thermal' ? '10px' : '12px', color: '#64748b' }}>
                  {lang === 'sw' ? 'Mfumo wa Kisasa wa Mauzo' : 'Modern Sales System'}
                </p>
                <p style={{ margin: '5px 0 0', fontSize: template === 'thermal' ? '10px' : '12px' }}>📞 +255 622 995 734</p>
              </div>

              {/* Receipt Info */}
              <div style={{ marginBottom: '15px', fontSize: template === 'thermal' ? '10px' : '12px' }}>
                <p style={{ margin: '0 0 5px' }}><strong>{t.number}:</strong> #{receiptData.receipt}</p>
                <p style={{ margin: 0 }}><strong>{t.date}:</strong> {receiptData.date?.toLocaleString()}</p>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', marginBottom: '15px', fontSize: template === 'thermal' ? '10px' : '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: template === 'thermal' ? '1px dashed #000' : '2px solid #0f172a' }}>
                    <th style={{ textAlign: 'left', padding: '5px 0' }}>{t.item}</th>
                    <th style={{ textAlign: 'center', padding: '5px 0' }}>{t.quantity}</th>
                    <th style={{ textAlign: 'right', padding: '5px 0' }}>{t.subtotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: template === 'thermal' ? '1px dotted #ccc' : '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 0' }}>{item.name}</td>
                      <td style={{ textAlign: 'center', padding: '5px 0' }}>{item.qty}</td>
                      <td style={{ textAlign: 'right', padding: '5px 0' }}>{Number(item.price * item.qty).toLocaleString()} TSh</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div style={{
                borderTop: template === 'thermal' ? '1px dashed #000' : '2px solid #0f172a',
                paddingTop: '10px',
                marginBottom: '15px',
                fontSize: template === 'thermal' ? '12px' : '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>{t.grandTotal}</span>
                  <span style={{ color: '#22c55e' }}>{Number(receiptData.total).toLocaleString()} TSh</span>
                </div>
                {receiptData.method && (
                  <p style={{ margin: '5px 0 0', fontSize: template === 'thermal' ? '10px' : '12px', color: '#64748b' }}>
                    {t.payment}: {receiptData.method}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div style={{
                textAlign: 'center',
                fontSize: template === 'thermal' ? '10px' : '12px',
                color: '#64748b',
                borderTop: template === 'thermal' ? '1px dashed #000' : '1px solid #e2e8f0',
                paddingTop: '10px'
              }}>
                <p style={{ margin: '0 0 5px' }}>{footerNote}</p>
                <p style={{ margin: 0, fontSize: template === 'thermal' ? '9px' : '10px' }}>
                  {t.support}: +255 622 995 734 | +255 613 808 727
                </p>
                <p style={{ margin: '5px 0 0', fontSize: template === 'thermal' ? '8px' : '10px' }}>
                  © {new Date().getFullYear()} KasiTrade Web
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#f1f5f9',
              color: '#0f172a',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {lang === 'sw' ? 'Ghairi' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {lang === 'sw' ? 'Hifadhi' : 'Save'}
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {lang === 'sw' ? 'Chapisha' : 'Print'}
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-preview, #receipt-preview * {
            visibility: visible;
          }
          #receipt-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptTemplates;