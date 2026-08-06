import React, { useState, useRef, useEffect } from 'react';

const SYSTEM_PROMPT_SW = `Wewe ni KasiAI, msaidizi wa KasiTRADE POS System. Jibu kwa Kiswahili kwa ufupi na kwa maneno rahisi. KasiTRADE ni mfumo wa POS (Point of Sale) unaosaidia kudhibiti: Mauzo, Bidhaa (Stock), Wateja, Ripoti, Matumizi, Wauzaji. Features: Ongeza bidhaa, rekodi mauzo, angalia faida, pokea malipo kwa fedha/simu/kadi, tuma risiti kwa SMS, angalia hesabu ya bidhaa. Jibu kwa kirefu (max mistari 5). Kuwa na tabasamu.`;
const SYSTEM_PROMPT_EN = `You are KasiAI, assistant for KasiTRADE POS System. Be brief and helpful. KasiTRADE is a POS system managing: Sales, Products (Stock), Customers, Reports, Expenses, Suppliers. Keep responses under 5 lines. Be friendly.`;

const API_KEY = process.env.REACT_APP_GROQ_KEY || '';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const AIAssistant = ({ isDarkMode, lang, theme, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const initialized = useRef(false);
  const isSw = lang === 'sw';
  const t = theme || {};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setMessages([{
        role: 'assistant',
        content: isSw
          ? '👋 Habari! Mimi ni KasiAI, msaidizi wako. Ninaweza kukusaidia kuhusu matumizi ya KasiTRADE, kuongeza bidhaa, kuuza, ripoti na mambo mengine. Uliza chochote!'
          : "👋 Hi! I'm KasiAI, your assistant. I can help with using KasiTRADE, adding products, sales, reports and more. Ask me anything!",
      }]);
    }
  }, [isSw]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (!API_KEY) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isSw ? '❌ API key haijasanidiwa. Wasiliana na admin.' : '❌ API key not configured. Contact admin.',
      }]);
      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: isSw ? SYSTEM_PROMPT_SW : SYSTEM_PROMPT_EN },
            ...messages.slice(-6),
            userMsg,
          ],
          max_tokens: 250,
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
      const reply = data.choices?.[0]?.message?.content || '...';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isSw ? `❌ Samahani, kuna hitilafu. Jaribu tena.` : `❌ Sorry, an error occurred. Try again.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
      width: '380px', maxWidth: 'calc(100vw - 40px)', maxHeight: '520px',
      background: t.surface || 'var(--surface)',
      borderRadius: '20px', border: `1px solid ${t.border || 'var(--border)'}`,
      boxShadow: t.shadow?.xl || '0 20px 60px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'fadeInScale 0.3s ease',
    }}>
      <div style={{
        padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
            <div style={{ fontSize: '10px', opacity: 0.8 }}>
              {API_KEY ? (isSw ? 'Anawasha ✅' : 'Online ✅') : (isSw ? 'Hajasanidiwa ⚠' : 'Not setup ⚠')}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{
          width: '30px', height: '30px', borderRadius: '8px', border: 'none',
          background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '14px',
        maxHeight: '370px', display: 'flex', flexDirection: 'column', gap: '10px',
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
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px', borderRadius: '14px',
              background: isDarkMode ? '#334155' : '#f1f5f9',
              display: 'flex', gap: '4px',
            }}>
              <div className="k-ai-dot" />
              <div className="k-ai-dot" style={{ animationDelay: '0.2s' }} />
              <div className="k-ai-dot" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '10px 14px', borderTop: `1px solid ${t.border || 'var(--border)'}`,
        display: 'flex', gap: '8px', alignItems: 'center',
      }}>
        <input type="text" ref={inputRef}
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={isSw ? 'Andika ujumbe...' : 'Type a message...'}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '12px',
            border: `1px solid ${t.border || 'var(--border)'}`,
            background: isDarkMode ? '#0f172a' : '#fff',
            color: t.text || 'var(--text-primary)', fontSize: '13px', outline: 'none',
          }} />
        <button onClick={handleSend} disabled={loading || !input.trim()} style={{
          width: '40px', height: '40px', borderRadius: '12px', border: 'none',
          background: input.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : (isDarkMode ? '#334155' : '#e2e8f0'),
          color: input.trim() ? '#fff' : '#94a3b8',
          cursor: input.trim() ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      <style>{`
        .k-ai-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--text-secondary, #94a3b8);
          animation: kaiPulse 1.4s ease-in-out infinite;
        }
        @keyframes kaiPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;
