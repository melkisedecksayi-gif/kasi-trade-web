import React from 'react';

const InfoPage = ({ page, lang, isDarkMode, onBack }) => {
  const isSw = lang === 'sw';
  const theme = {
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#334155' : '#e2e8f0',
  };

  const titles = {
    about: { sw: 'Kuhusu Sisi', en: 'About Us' },
    privacy: { sw: 'Sera ya Faragha', en: 'Privacy Policy' },
    terms: { sw: 'Masharti na Vigezo', en: 'Terms & Conditions' },
  };

  const content = {
    about: {
      sw: [
        'KasiTRADE ni mfumo wa kisasa wa POS (Point of Sale) uliotengenezwa mahsusi kwa ajili ya wafanyabiashara wa Tanzania na Afrika Mashariki.',
        'Mfumo huu unakupa uwezo wa kudhibiti mauzo, bidhaa, wateja, matumizi, na ripoti za biashara yako yote katika sehemu moja.',
        'Tunaamini kila mfanyabiashara anastahili zana bora za kukuza biashara yake. Ndiyo maana KasiTRADE imeundwa kuwa rahisi kutumia, salama, na yenye nguvu.',
        'Imetengenezwa na: Melicksedeki Zakaria Sayi & Abdallah Mshamu Nassoro',
        'Tanzania, Afrika Mashariki · 2025',
      ],
      en: [
        'KasiTRADE is a modern POS (Point of Sale) system built specifically for business owners in Tanzania and East Africa.',
        'This system gives you the power to manage sales, products, customers, expenses, and business reports all in one place.',
        'We believe every business owner deserves the best tools to grow their business. That\'s why KasiTRADE is designed to be easy to use, secure, and powerful.',
        'Built by: Melicksedeki Zakaria Sayi & Abdallah Mshamu Nassoro',
        'Tanzania, East Africa · 2025',
      ],
    },
    privacy: {
      sw: [
        'Hii ni Sera ya Faragha ya mfumo wa KasiTRADE POS.',
        '1. Takwimu Binafsi: Tunakusanya taarifa kama jina, barua pepe, namba ya simu, na eneo lako ili kukuhudumia vizuri. Hatuwahi kushirikisha data yako na watu wengine bila idhini yako.',
        '2. Matumizi ya Data: Data yako inatumika kukupa huduma za POS, kuboresha mfumo, na kukutumia arifa muhimu kuhusu biashara yako.',
        '3. Ulinzi wa Data: Data yako inahifadhiwa salama kupitia Supabase na encryption ya kisasa. Wewe ndiye unaye-control data yako kupitia akaunti yako.',
        '4. Haki Zako: Una haki ya kufuta akaunti yako, kutoa data yako, au kubadilisha taarifa zako wakati wowote kupitia mipangilio.',
        '5. Vidakuzi (Cookies): KasiTRADE inatumia vidakuzi kwa ajili ya kuhifadhi mapendeleo yako kama lugha na hali ya mandhari. Hakuna tracking ya tatu.',
        '6. Maboresho: Tunawarea kufanya maboresho ya sera hii wakati wowote. Tutaarifu watumiaji kabla ya mabadiliko makubwa.',
      ],
      en: [
        'This is the Privacy Policy for KasiTRADE POS system.',
        '1. Personal Data: We collect information such as name, email, phone number, and location to serve you better. We never share your data with third parties without your consent.',
        '2. Data Usage: Your data is used to provide POS services, improve the system, and send you important notifications about your business.',
        '3. Data Protection: Your data is stored securely via Supabase with modern encryption. You control your data through your account.',
        '4. Your Rights: You have the right to delete your account, export your data, or modify your information at any time through settings.',
        '5. Cookies: KasiTRADE uses cookies to store your preferences such as language and theme. No third-party tracking.',
        '6. Updates: We may update this policy from time to time. Users will be notified of major changes.',
      ],
    },
    terms: {
      sw: [
        'Haya ni Masharti na Vigezo vya matumizi ya KasiTRADE POS.',
        '1. Matumizi: Unaruhusiwa kutumia mfumo huu kwa shughuli halali za kibiashara. Hairuhusiwi kutumia mfumo kwa shughuli haramu au udanganyifu.',
        '2. Akaunti: Unawajibika kwa usalama wa akaunti yako. Usishirikishe nenosiri lako na mtu yeyote.',
        '3. Malipo: KasiTRADE inatoa toleo la bure lenye vipengele msingi. Vipengele vya juu vinaweza kuhitaji malipo.',
        '4. Data: Data yako ni yako. Tunaweza kutumia data kwa ubora wa huduma lakini sio kwa minajili ya kukuuzia.',
        '5. Kukomesha: Tuna haki ya kukomesha au kusitisha akaunti yako ikiwa unavunja masharti haya.',
        '6. Dhima: KasiTRADE haiwajibikii kwa hasara yoyote itakayotokana na matumizi ya mfumo. Tunafanya bidii kuhakikisha mfumo unafanya kazi vizuri lakini hatutoi guarantee ya 100%.',
        '7. Maboresho: Tunaweza kuboresha masharti haya wakati wowote. Matumizi yako yaendelea baada ya mabadiliko inamaanisha umekubali.',
      ],
      en: [
        'These are the Terms & Conditions for using KasiTRADE POS.',
        '1. Usage: You are permitted to use this system for legitimate business activities. Illegal or fraudulent use is prohibited.',
        '2. Account: You are responsible for your account security. Do not share your password with anyone.',
        '3. Payments: KasiTRADE offers a free tier with core features. Advanced features may require payment.',
        '4. Data: Your data belongs to you. We may use aggregated data to improve service quality but never to sell to you.',
        '5. Termination: We reserve the right to terminate or suspend your account if you violate these terms.',
        '6. Liability: KasiTRADE is not liable for any losses resulting from use of the system. We strive to ensure the system works well but cannot guarantee 100% uptime.',
        '7. Updates: We may update these terms at any time. Continued use after changes implies acceptance.',
      ],
    },
  };

  const title = titles[page]?.[isSw ? 'sw' : 'en'] || '';
  const paragraphs = content[page]?.[isSw ? 'sw' : 'en'] || [];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text, fontSize: '20px', padding: '4px' }}>←</button>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: theme.text, margin: 0 }}>{title}</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {paragraphs.map((p, i) => (
          <p key={i} style={{ margin: 0, fontSize: '14px', color: theme.textMuted, lineHeight: '1.8' }}>
            {p}
          </p>
        ))}
      </div>
    </div>
  );
};

export default InfoPage;
