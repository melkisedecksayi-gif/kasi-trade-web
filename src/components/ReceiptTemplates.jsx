import React, { useState } from 'react';
import { translations } from '../translations';
import CI from './ColoredIcons';

// ✅ Default fallback labels
const DEFAULT_RECEIPT_LABELS = {
  number: 'No',
  date: 'Date',
  item: 'Item',
  quantity: 'Qty',
  subtotal: 'Total',
  grandTotal: 'JUMLA KUU:',
  payment: 'Payment',
  support: 'Support'
};

const ReceiptTemplates = ({ isOpen, onClose, receiptData, lang }) => {
  const receiptTranslations = translations?.[lang]?.sales?.receipt || {};
  const t = { ...DEFAULT_RECEIPT_LABELS, ...receiptTranslations };
  
  const [template, setTemplate] = useState(localStorage.getItem('receiptTemplate') || 'detailed');
  const [logo, setLogo] = useState(localStorage.getItem('receiptLogo') || '');
  const [footerNote, setFooterNote] = useState(localStorage.getItem('receiptFooter') || 'Asante kwa kununua kwetu!');

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

  // ✅ NEW: Function to remove logo
  const handleRemoveLogo = () => {
    setLogo('');
    localStorage.removeItem('receiptLogo');
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

  const templates = {
    simple: { name: lang === 'sw' ? 'Rahisi' : 'Simple', border: 'none', font: 'Arial, sans-serif', width: '350px' },
    detailed: { name: lang === 'sw' ? 'Kina' : 'Detailed', border: '2px solid #3b82f6', font: 'Georgia, serif', width: '450px' },
    thermal: { name: lang === 'sw' ? 'Thermal (80mm)' : 'Thermal (80mm)', border: '1px dashed #000', font: 'Courier New, monospace', width: '280px', fontSize: '11px' }
  };

  const current = templates[template] || templates.detailed;
  const safeReceiptData = receiptData || { items: [], total: 0, receipt: 'N/A', date: new Date(), method: '' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box', overflow: 'auto', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', maxWidth: '950px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <h2 style={{ margin: '0 0 20px', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
          {lang === 'sw' ? <><CI.Settings size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Mipangilio ya Risiti</> : <><CI.Settings size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Receipt Settings</>}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '25px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>{lang === 'sw' ? 'Chagua Muundo' : 'Select Template'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {Object.entries(templates).map(([key, val]) => (
                <button key={key} onClick={() => setTemplate(key)} style={{ padding: '10px', background: template === key ? '#3b82f6' : '#f1f5f9', color: template === key ? '#fff' : '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>{val.name}</button>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>{lang === 'sw' ? 'Logo ya Duka' : 'Shop Logo'}</h3>
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ width: '100%', marginBottom: '8px' }} />
            {logo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <img src={logo} alt="Logo" style={{ maxWidth: '80px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                {/* ✅ NEW: Remove Logo Button */}
                <button onClick={handleRemoveLogo} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  {lang === 'sw' ? <><CI.Trash size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Ondoa</> : <><CI.Trash size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Remove</>}
                </button>
              </div>
            )}
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>{lang === 'sw' ? 'Maelezo ya Chini' : 'Footer Note'}</h3>
            <textarea value={footerNote} onChange={(e) => setFooterNote(e.target.value)} placeholder="Mfano: Karibu tena!" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '50px', resize: 'vertical' }} />
          </div>
        </div>

        {/* Preview Container */}
        <div id="receipt-preview-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
          <div id="receipt-preview" style={{ maxWidth: current.width, margin: '0 auto', padding: template === 'thermal' ? '10px' : '20px', background: '#fff', fontFamily: current.font, fontSize: template === 'thermal' ? current.fontSize : '13px', border: current.border, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {logo && <div style={{ textAlign: 'center', marginBottom: '10px' }}><img src={logo} alt="Logo" style={{ maxWidth: '70px', maxHeight: '70px' }} /></div>}
            <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: template === 'thermal' ? '1px dashed #000' : '2px solid #3b82f6', paddingBottom: '8px' }}>
              <h1 style={{ margin: '0 0 4px', fontSize: template === 'thermal' ? '13px' : '18px' }}>KasiTRADE Web</h1>
              <p style={{ margin: 0, fontSize: template === 'thermal' ? '9px' : '11px', color: '#64748b' }}>{lang === 'sw' ? 'Mfumo wa Kisasa wa Mauzo' : 'Modern Sales System'}</p>
              <p style={{ margin: '3px 0 0', fontSize: template === 'thermal' ? '9px' : '11px' }}><CI.Phone size={template === 'thermal' ? 10 : 12} style={{ marginRight: 2, verticalAlign: 'middle' }} /> +255 622 995 734</p>
            </div>
            <div style={{ marginBottom: '10px', fontSize: template === 'thermal' ? '9px' : '11px' }}>
              <p style={{ margin: '0 0 3px' }}><strong>{t.number}:</strong> #{safeReceiptData.receipt || 'N/A'}</p>
              <p style={{ margin: 0 }}><strong>{t.date}:</strong> {safeReceiptData.date?.toLocaleString() || '-'}</p>
            </div>
            <table style={{ width: '100%', marginBottom: '10px', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: template === 'thermal' ? '1px dashed #000' : '2px solid #0f172a' }}><th style={{ textAlign: 'left', padding: '4px 0' }}>{t.item}</th><th style={{ textAlign: 'center', padding: '4px 0' }}>{t.quantity}</th><th style={{ textAlign: 'right', padding: '4px 0' }}>{t.subtotal}</th></tr></thead>
              <tbody>
                {(safeReceiptData.items || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: template === 'thermal' ? '1px dotted #ccc' : '1px solid #e2e8f0' }}>
                    <td style={{ padding: '4px 0' }}>{item.name || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.qty || 1}</td>
                    <td style={{ textAlign: 'right', padding: '4px 0' }}>{Number((item.price || 0) * (item.qty || 1)).toLocaleString()} TSh</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ borderTop: template === 'thermal' ? '1px dashed #000' : '2px solid #0f172a', paddingTop: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: template === 'thermal' ? '12px' : '15px' }}>
                <span>{t.grandTotal}</span>
                <span style={{ color: '#16a34a' }}>{Number(safeReceiptData.total || 0).toLocaleString()} TSh</span>
              </div>
              {safeReceiptData.method && <p style={{ margin: '4px 0 0', fontSize: template === 'thermal' ? '9px' : '11px', color: '#64748b' }}>{t.payment}: {safeReceiptData.method}</p>}
            </div>
            <div style={{ textAlign: 'center', fontSize: template === 'thermal' ? '9px' : '11px', color: '#64748b', borderTop: template === 'thermal' ? '1px dashed #000' : '1px solid #e2e8f0', paddingTop: '8px' }}>
              <p style={{ margin: '0 0 4px' }}>{footerNote}</p>
              <p style={{ margin: 0, fontSize: template === 'thermal' ? '8px' : '10px' }}>{t.support}: +255 622 995 734</p>
              <p style={{ margin: '3px 0 0', fontSize: template === 'thermal' ? '7px' : '9px' }}>© {new Date().getFullYear()} KasiTrade Web</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{lang === 'sw' ? 'Ghairi' : 'Cancel'}</button>
          <button onClick={handleSave} style={{ padding: '10px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{lang === 'sw' ? 'Hifadhi' : 'Save'}</button>
          <button onClick={handlePrint} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}><CI.Printer size={16} /> {lang === 'sw' ? 'Chapisha' : 'Print'}</button>
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden; } #receipt-preview-container, #receipt-preview-container * { visibility: visible; } #receipt-preview-container { position: absolute; left: 0; top: 0; width: 100%; background: none; box-shadow: none; padding: 0; } #receipt-preview { box-shadow: none; border: ${template === 'thermal' ? 'none' : current.border}; max-width: 100%; } }`}</style>
    </div>
  );
};

export default ReceiptTemplates;