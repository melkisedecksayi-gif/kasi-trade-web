import React, { useState, useRef, useEffect } from 'react';

const AIAssistant = ({ isDarkMode, lang, theme, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('app_groq_key') || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('app_groq_key'));
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isSw = lang === 'sw';
  const t = theme || {};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!showSettings && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: isSw
          ? '👋 Habari! Mimi ni KasiAI, msaidizi wako wa KasiTRADE. Ninaweza kukusaidia na:\n\n• Jinsi ya kutumia mfumo\n• Kuelezea features\n• Kutatua matatizo\n• Ushauri wa biashara\n\nUnaweza kuniuliza chochote!'
          : "👋 Hi! I'm KasiAI, your KasiTRADE assistant. I can help with:\n\n• How to use the system\n• Explaining features\n• Troubleshooting\n• Business advice\n\nAsk me anything!",
      }]);
    }
  }, [showSettings, messages.length, isSw]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const systemPrompt = {
        role: 'system',
        content: isSw
          ? `Wewe ni KasiAI, msaidizi wa KasiTRADE POS System. Jibu kwa Kiswahili kwa ufupi na kwa maneno rahisi. KasiTRADE ni mfumo wa POS (Point of Sale) unaosaidia kudhibiti: Mauzo, Bidhaa (Stock), Wateja, Ripoti, Matumizi, Wauzaji. Features: Ongeza bidhaa, rekodi mauzo, angalia faida, pokea malipo kwa fedha/simu/kadi, tuma risiti kwa SMS, angalia hesabu ya bidhaa. Jibu kwa kirefu (max mistari 5). Kuwa na tabasamu.`
          : `You are KasiAI, assistant for KasiTRADE POS System. Be brief and helpful. KasiTRADE is a POS system managing: Sales, Products (Stock), Customers, Reports, Expenses, Suppliers. Features: Add products, record sales, track profit, accept cash/mobile/card payments, send SMS receipts, manage stock. Keep responses under 5 lines. Be friendly.`,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [systemPrompt, ...messages.slice(-10), userMsg],
          max_tokens: 300,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || (isSw ? 'Samahani, sijapata jibu.' : 'Sorry, no response.');

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isSw
          ? `❌ Hitilafu: ${e.message}. Hakikisha API key yako iko sahihi.`
          : `❌ Error: ${e.message}. Make sure your API key is correct.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('app_groq_key', apiKey.trim());
      setShowSettings(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
      width: '380px', maxWidth: 'calc(100vw - 40px)', maxHeight: '560px',
      background: t.surface || 'var(--surface)',
      borderRadius: '20px', border: `1px solid ${t.border || 'var(--border)'}`,
      boxShadow: t.shadow?.xl || '0 20px 60px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'fadeInScale 0.3s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '16px',
          }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>KasiAI</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>{isSw ? 'Msaidizi wa KasiTRADE' : 'KasiTRADE Assistant'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setShowSettings(!showSettings)} style={{
            width: '30px', height: '30px', borderRadius: '8px', border: 'none',
            background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
          }}>⚙</button>
          <button onClick={onClose} style={{
            width: '30px', height: '30px', borderRadius: '8px', border: 'none',
            background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div style={{ padding: '16px', borderBottom: `1px solid ${t.border || 'var(--border)'}` }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: t.text || 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
            {isSw ? 'Groq API Key (Bure)' : 'Groq API Key (Free)'}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="gsk_..."
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '8px',
                border: `1px solid ${t.border || 'var(--border)'}`,
                background: isDarkMode ? '#0f172a' : '#fff',
                color: t.text || 'var(--text-primary)', fontSize: '12px', outline: 'none',
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveKey(); }} />
            <button onClick={handleSaveKey} style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              fontWeight: 600, fontSize: '12px', cursor: 'pointer',
            }}>{isSw ? 'Hifadhi' : 'Save'}</button>
          </div>
          <p style={{ fontSize: '10px', color: t.textSecondary || 'var(--text-secondary)', margin: '6px 0 0' }}>
            {isSw ? 'Pata API key bure kutoka console.groq.com/keys' : 'Get free API key from console.groq.com/keys'}
          </p>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '14px',
        maxHeight: showSettings ? '300px' : '380px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px', borderRadius: '14px',
              fontSize: '12px', lineHeight: 1.5,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : (isDarkMode ? '#334155' : '#f1f5f9'),
              color: msg.role === 'user' ? '#fff' : (t.text || 'var(--text-primary)'),
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '14px',
              borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '14px',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 18px', borderRadius: '14px',
              background: isDarkMode ? '#334155' : '#f1f5f9',
              display: 'flex', gap: '4px',
            }}>
              <div className="dot-typing" />
              <div className="dot-typing" style={{ animationDelay: '0.2s' }} />
              <div className="dot-typing" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!showSettings && (
        <div style={{
          padding: '10px 14px', borderTop: `1px solid ${t.border || 'var(--border)'}`,
          display: 'flex', gap: '8px', alignItems: 'center',
        }}>
          <input type="text" ref={inputRef}
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isSw ? 'Andika ujumbe...' : 'Type a message...'}
            disabled={!apiKey}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '12px',
              border: `1px solid ${t.border || 'var(--border)'}`,
              background: isDarkMode ? '#0f172a' : '#fff',
              color: t.text || 'var(--text-primary)', fontSize: '13px', outline: 'none',
            }} />
          <button onClick={handleSend} disabled={loading || !input.trim() || !apiKey} style={{
            width: '40px', height: '40px', borderRadius: '12px', border: 'none',
            background: input.trim() && apiKey ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : (isDarkMode ? '#334155' : '#e2e8f0'),
            color: input.trim() && apiKey ? '#fff' : (t.textSecondary || '#94a3b8'),
            cursor: input.trim() && apiKey ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      )}

      <style>{`
        .dot-typing {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--text-secondary, #94a3b8);
          animation: dotPulse 1.4s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;
