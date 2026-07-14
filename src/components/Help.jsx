import React, { useState } from 'react';
import CI from './ColoredIcons';

const Help = ({ lang, theme }) => {
  const isDark = theme === 'dark';
  const isSw = lang === 'sw';
  const [openTutorial, setOpenTutorial] = useState(null);

  const colors = {
    bg: isDark ? '#0f172a' : '#f8fafc',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f1f5f9' : '#0f172a',
    textSec: isDark ? '#94a3b8' : '#475569',
    border: isDark ? '#334155' : '#e2e8f0',
    hlBg: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)',
  };

  const tutorials = [
    {
      id: 'intro',
      title: isSw ? '1. KasiTRADE ni Nini?' : '1. What is KasiTRADE?',
      color: '#6366f1',
      steps: isSw ? [
        'KasiTRADE ni mfumo wa POS unaokusaidia kudhibiti biashara yako.',
        'Inafanya kazi kwenye simu, tablet na kompyuta — inahitaji internet tu.',
        'Unaweza kurekodi mauzo, kufuatilia bidhaa, kuhifadhi wateja na kupata ripoti.',
        'Kujiunga ni bure — bonyeza "Anza Bure Sasa" kwenye ukurasa wa kwanza.',
        'Jaza taarifa zako: email, namba ya simu, jina la duka, eneo.',
        'Thibitisha email yako kisha ingia kuanza kutumia mfumo.'
      ] : [
        'KasiTRADE is a POS system that helps you manage your business.',
        'Works on phone, tablet and computer — just needs internet.',
        'Record sales, track products, store customers and get reports.',
        'Signup is free — click "Start Free Now" on the landing page.',
        'Fill in your details: email, phone, business name, location.',
        'Confirm your email then login to start using the system.'
      ]
    },
    {
      id: 'dashboard',
      title: isSw ? '2. Dashibodi Yako' : '2. Your Dashboard',
      color: '#8b5cf6',
      steps: isSw ? [
        'Ukifungua mfumo, utaona dashibodi — hii ndio ukurasa wako wa kwanza.',
        'Juu utaona stats: Mauzo ya Leo, Faida, Bidhaa, Wateja.',
        'Kwenye welcome card utaona jina la duka lako na tarehe ya leo.',
        'Ikibidi utaona alert nyekundu kwa bidhaa zilizo na hesabu chini ya 5.',
        'Upande wa kulia kuna vitufe 4 vya haraka: Mauzo, Bidhaa, Wateja, Ripoti.',
        'Kubadilisha sehemu, tumia sidebar upande wa kushoto au bonyeza ☰ kwenye simu.',
        'Unaweza kubadilisha lugha (🇹🇿/🇬🇧) na theme (dark/light) kwenye Mipangilio.'
      ] : [
        'When you open the system, you see the dashboard — your home page.',
        'At top are stats: Today Sales, Profit, Products, Customers.',
        'The welcome card shows your shop name and today\'s date.',
        'You\'ll see a red alert if any products have stock below 5.',
        'On the right are 4 quick action buttons: Sale, Products, Customers, Reports.',
        'To switch sections, use the left sidebar or tap ☰ on mobile.',
        'Change language (🇹🇿/🇬🇧) and theme (dark/light) in Settings.'
      ]
    },
    {
      id: 'pos',
      title: isSw ? '3. Kuuza Bidhaa (POS)' : '3. Selling Products (POS)',
      color: '#10b981',
      steps: isSw ? [
        'Nenda kwenye "Mauzo" (POS) kupitia sidebar au bonyeza "Mauzo Mapya" dashibodi.',
        'Utaona orodha ya bidhaa zako na sehemu ya kutafuta.',
        'Bonyeza bidhaa kuiongeza kwenye kikapu. Tumia + na - kurekebisha kiasi.',
        'Kikapu kinaonekana upande wa kulia (au chini kwenye simu).',
        'Ukishamaliza, bonyeza "Lipa Sasa" — kitufe cha kijani chini.',
        'Chagua njia ya malipo: Fedha Taslimu, Simu ya Mkononi, au Kadi ya Benki.',
        'Bonyeza "Thibitisha Malipo" kukamilisha mauzo.',
        'Baada ya mauzo, bonyeza "Chapisha Risiti" kupata nakala.'
      ] : [
        'Go to "POS" via sidebar or tap "New Sale" on dashboard.',
        'You\'ll see your product list and a search bar.',
        'Tap a product to add to cart. Use + and - to adjust quantity.',
        'Cart appears on the right (or at bottom on mobile).',
        'When done, tap "Checkout" — the green button at the bottom.',
        'Choose payment method: Cash, Mobile Money, or Bank Card.',
        'Tap "Confirm Payment" to complete the sale.',
        'After sale, tap "Print Receipt" to get a copy.'
      ]
    },
    {
      id: 'products',
      title: isSw ? '4. Kudhibiti Bidhaa' : '4. Managing Products',
      color: '#f59e0b',
      steps: isSw ? [
        'Nenda kwenye "Bidhaa" (Products) kupitia sidebar.',
        'Bonyeza "Ongeza Bidhaa" — kitufe cha zambarau juu.',
        'Chagua kategoria (Vyakula, Vinywaji, Mavazi, n.k).',
        'Weka jina la bidhaa, bei ya kununua, bei ya kuuza na hesabu.',
        'Bonyeza "Hifadhi" kumaliza.',
        'Ili kubadilisha bidhaa: bonyeza ikoni ya penseli → hariri → hifadhi.',
        'Ili kufuta: bonyeza ikoni ya taka → thibitisha.',
        'Ili kuingiza bidhaa nyingi kwa pamoja: Bonyeza "Ingiza CSV" → pakia file.',
        'File ya CSV ihitaji safu: name, category, buy_price, sell_price, stock.',
        'Unaweza pia kuchapisha orodha ya bidhaa kwa kubonyeza "Chapisha".'
      ] : [
        'Go to "Products" via sidebar.',
        'Tap "Add Product" — the purple button at top.',
        'Choose a category (Food, Drinks, Clothing, etc).',
        'Enter product name, buy price, sell price and stock quantity.',
        'Tap "Save" to finish.',
        'To edit: tap the pencil icon → edit → save.',
        'To delete: tap the trash icon → confirm.',
        'To import many products at once: Tap "Import CSV" → upload file.',
        'CSV file needs columns: name, category, buy_price, sell_price, stock.',
        'You can also print the product list by tapping "Print".'
      ]
    },
    {
      id: 'customers',
      title: isSw ? '5. Kudhibiti Wateja' : '5. Managing Customers',
      color: '#ec4899',
      steps: isSw ? [
        'Nenda kwenye "Wateja" (Customers) kupitia sidebar.',
        'Bonyeza "Ongeza Mteja" — kitufe cha zambarau juu.',
        'Jaza jina, namba ya simu, email na anwani (si lazima yote).',
        'Bonyeza "Hifadhi".',
        'Mteja atahifadhiwa na utaweza kumuona kwenye orodha.',
        'Ili kuhariri / kufuta: tumia ikoni za penseli na taka kwenye kadi ya mteja.',
        'Unaweza kuingiza wateja wengi kwa kutumia "Ingiza CSV".'
      ] : [
        'Go to "Customers" via sidebar.',
        'Tap "Add Customer" — the purple button at top.',
        'Fill name, phone, email and address (not all required).',
        'Tap "Save".',
        'Customer is saved and appears in the list.',
        'To edit / delete: use the pencil and trash icons on the customer card.',
        'You can import many customers using "Import CSV".'
      ]
    },
    {
      id: 'reports',
      title: isSw ? '6. Ripoti na Takwimu' : '6. Reports & Analytics',
      color: '#06b6d4',
      steps: isSw ? [
        'Nenda kwenye "Ripoti" (Reports) kupitia sidebar.',
        'Utakuta vitufe 3 juu: Wiki Hii, Mwezi Huu, Custom.',
        'Chagua kipindi unachotaka kutazama.',
        'Chini utaona takwimu za jumla: mauzo, faida, idadi ya miamala.',
        'Mwenendo wa Mauzo — grafu inayoonyesha mauzo kwa siku.',
        'Bidhaa Zinazouzika Zaidi — orodha ya bidhaa kwa mauzo.',
        'Mauzo kwa Kategoria — chati ya donut inayoonyesha mauzo kwa aina.',
        'Kiwango cha Faida — asilimia ya faida baada ya matumizi yote.',
        'Chini kuna orodha ya miamala yote — kila mauzo umeandikwa.',
        'Bonyeza "Export CSV" kupakua data au "Chapisha" kuchapisha ripoti.'
      ] : [
        'Go to "Reports" via sidebar.',
        'You\'ll see 3 buttons on top: This Week, This Month, Custom.',
        'Choose the period you want to view.',
        'Below are summary stats: total sales, profit, transaction count.',
        'Sales Trend — chart showing sales per day.',
        'Top Selling Products — list of products by sales.',
        'Sales by Category — donut chart showing sales by type.',
        'Profit Margin — profit percentage after all expenses.',
        'Below is a table of all transactions — every sale recorded.',
        'Tap "Export CSV" to download data or "Print" to print the report.'
      ]
    },
    {
      id: 'expenses',
      title: isSw ? '7. Kudhibiti Matumizi' : '7. Managing Expenses',
      color: '#ef4444',
      steps: isSw ? [
        'Nenda kwenye "Matumizi" (Expenses) kupitia sidebar.',
        'Bonyeza "Ongeza Gharama" kuweka matumizi mapya.',
        'Chagua aina: Kodi, Umeme, Mishahara, Usafiri, Matangazo, n.k.',
        'Weka kiasi, tarehe na maelezo.',
        'Bonyeza "Hifadhi".',
        'Matumizi yote yanaonekana kwenye orodha chini.',
        'Unaweza kuchuja kwa tarehe na aina ya matumizi.',
        'Matumizi yanajumlishwa kwenye ripoti ya faida (Reports → Kiwango cha Faida).'
      ] : [
        'Go to "Expenses" via sidebar.',
        'Tap "Add Expense" to record new spending.',
        'Choose type: Rent, Utilities, Salaries, Transport, Marketing, etc.',
        'Enter amount, date and description.',
        'Tap "Save".',
        'All expenses appear in the list below.',
        'You can filter by date and expense type.',
        'Expenses are totaled in the profit report (Reports → Profit Margin).'
      ]
    },
    {
      id: 'settings',
      title: isSw ? '8. Mipangilio ya Mfumo' : '8. System Settings',
      color: '#6366f1',
      steps: isSw ? [
        'Nenda kwenye "Mipangilio" (Settings) kupitia sidebar.',
        'Badilisha Lugha: Bonyeza 🇹🇿/🇬🇧 kubadilisha Kiswahili na Kiingereza.',
        'Badilisha Theme: Washa/zima dark mode kwa kutelezesha kitufe.',
        'Ongeza Duka: Kama una biashara zaidi ya moja, bonyeza "Ongeza Duka".',
        'Badili Duka: Chagua duka kwenye dropdown kwenye header upande wa juu.',
        'SMS Settings: Washa SMS kupokea taarifa za mauzo kwa simu.',
        'Sehemu ya mwisho: Bonyeza "Toka" (Logout) kutoka kwenye mfumo.'
      ] : [
        'Go to "Settings" via sidebar.',
        'Change Language: Tap 🇹🇿/🇬🇧 to switch between Swahili and English.',
        'Change Theme: Toggle dark mode on/off with the switch.',
        'Add Shop: If you have multiple businesses, tap "Add Shop".',
        'Switch Shop: Choose a shop from the dropdown in the top header.',
        'SMS Settings: Enable SMS to receive sales reports via phone.',
        'Bottom section: Tap "Logout" to exit the system.'
      ]
    },
  ];

  const contactItems = [
    { Icon: CI.Phone, title: isSw ? 'Piga Simu' : 'Call', text: '+255 622 995 734 | +255 613 808 727', color: '#10b981' },
    { Icon: CI.Chat, title: 'WhatsApp', text: '+255 613 334 713 | +255 656 448 727', color: '#25D366' },
    { Icon: CI.Mail, title: isSw ? 'Maoni' : 'Feedback', action: 'https://forms.gle/EoNjSm2NCHNh7ixD6', color: '#f59e0b' },
    { Icon: CI.Phone, title: 'Instagram', text: '@kasi_trade', color: '#E4405F' },
  ];

  return (
    <div style={{ padding: '0', maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 6px', color: colors.text, fontSize: '26px', fontWeight: '800' }}>
          {isSw ? 'Mafunzo ya KasiTRADE' : 'KasiTRADE Tutorials'}
        </h2>
        <p style={{ margin: 0, color: colors.textSec, fontSize: '14px' }}>
          {isSw ? 'Jifunze kutumia mfumo hatua kwa hatua. Bonyeza mada yoyote kufungua maelezo.' : 'Learn to use the system step by step. Click any topic to open instructions.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
        {tutorials.map((tut, i) => {
          const isOpen = openTutorial === tut.id;
          return (
            <div key={tut.id} style={{
              background: isOpen ? colors.hlBg : colors.cardBg,
              border: `1px solid ${isOpen ? tut.color + '40' : colors.border}`,
              borderRadius: '14px', overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}>
              <button
                onClick={() => setOpenTutorial(isOpen ? null : tut.id)}
                style={{
                  width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center',
                  gap: '12px', border: 'none', background: 'transparent', cursor: 'pointer',
                  color: colors.text, textAlign: 'left'
                }}>
                <span style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: `${tut.color}18`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '700', color: tut.color, flexShrink: 0
                }}>
                  {isOpen ? '−' : i + 1}
                </span>
                <span style={{ flex: 1, fontSize: '14px', fontWeight: '600' }}>{tut.title}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textSec} strokeWidth="2.5"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 18px 68px' }}>
                  <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tut.steps.map((step, si) => (
                      <li key={si} style={{
                        display: 'flex', gap: '10px', fontSize: '13px', color: colors.textSec, lineHeight: 1.5
                      }}>
                        <span style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: `${tut.color}15`, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: '700', color: tut.color,
                          flexShrink: 0, marginTop: '1px'
                        }}>
                          {si + 1}
                        </span>
                        <span style={{ paddingTop: '1px' }}>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '24px' }}>
        <h3 style={{ margin: '0 0 14px', color: colors.text, fontSize: '16px', fontWeight: '700', textAlign: 'center' }}>
          {isSw ? 'Wasiliana Nasi' : 'Contact Us'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {contactItems.map((item, i) => (
            <div key={i} style={{
              padding: '14px', borderRadius: '12px',
              background: isDark ? 'rgba(30,41,59,0.5)' : '#f8fafc',
              borderLeft: `3px solid ${item.color}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <item.Icon size={18} />
                <span style={{ color: colors.text, fontWeight: '600', fontSize: '12px' }}>{item.title}</span>
              </div>
              {item.action ? (
                <a href={item.action} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#6366f1', fontWeight: '600', fontSize: '12px', textDecoration: 'none' }}>
                  {isSw ? 'Fungua Fomu →' : 'Open Form →'}
                </a>
              ) : (
                <p style={{ margin: 0, color: colors.textSec, fontSize: '12px' }}>{item.text}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '20px 0 0', marginTop: '24px', borderTop: `1px solid ${colors.border}` }}>
        <p style={{ margin: 0, color: colors.textSec, fontSize: '12px' }}>
          &copy; {new Date().getFullYear()} KasiTRADE &middot; {isSw ? 'Tanzania' : 'Tanzania'}
        </p>
        <p style={{ margin: '4px 0 0', color: colors.textSec, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          {isSw ? 'Imetengenezwa kwa' : 'Made with'} <CI.Heart size={11} /> {isSw ? 'Tanzania' : 'in Tanzania'}
        </p>
      </div>
    </div>
  );
};

export default Help;
