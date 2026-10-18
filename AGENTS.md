# Duka POS - Frontend Context (React)

## Project Structure
- Frontend: React 19 (CRA — `react-scripts`), files ziko kwenye `src/`
- State Management: Hakuna Redux/Context kwa global state — kila component ina `useState`/`useEffect`; Dashboard ndiyo "shell" inayoshikilia `view`, `theme`, `lang`, `shopId`
- UI Framework: Hakuna Tailwind/MUI — inline styles mtindo wa msingi, colors kutoka `src/theme.js` (`getThemeColors`), i18n kwenye `src/translations.js` (sw/en)
- Backend: Supabase (`src/lib/supabaseClient.js`) — auth, DB (`profiles`, `products`, `sales`, `subscriptions`, `payments`)
- Navigation: Hakuna React Router — switch ya views kwenye `Dashboard.jsx` (`view` state + `allNavItems`)

## Subscription & Payment Flow (Frontend Role)
- **Bei**: TZS 12,000 kwa mwezi (`PRO_PRICE_TSH` kwenye `src/lib/subscription.js`, `MPESA_AMOUNT` kwenye edge function config).
- **Trial ya mtumiaji mpya**: Kila mtumiaji mpya anayejisajili anapata **siku 14 (wiki 2) bure**. Wakati wa signup (na mara ya kwanza Dashboard inapofunguka) huezwa `ensure_subscription()` — `trial_ends_at = sasa + siku 14`.
- **Soft/Hard Lock**: Dashboard inapaswa kuangalia kama subscription imeisha. Kama imeisha, mruhusu mtumiaji aende tu kwenye ukurasa wa `Paywall.jsx`.
  - Hali ya sasa: `useSubscription` (`src/lib/subscription.js`) hupata subscription, `subState.locked` = true mwisho wa trial bila PRO; Paywall inaonyeshwa isipokuwa views za `settings` na `help`
- **Banner ya Trial**: Wakati mtumiaji yuko kwenye trial, Dashboard inaonyesha banner: "Una wiki 2 za majaribio bure. Lipia TZS 12,000 kuendelea." (mara baada ya siku 3 inaongeza idadi ya siku zilizobaki).
- **Billing.jsx**: Inaonyesha bei (TZS 12,000/mwezi). Mteja akiingiza namba ya simu, tunatuma request kwenda Backend API yetu (sio Selcom moja kwa moja).
- **Paywall.jsx**: Ukurasa wa kuzuia huduma. Una fomu ya malipo na inapaswa kupoll (kupima) API ya backend kila sekunde 3-5 kuona kama malipo yamekamilika.
  - Hali ya sasa: polling kila 5s kupitia `mpesa-status`
- **Gate/Views**: Kama `subscription.status !== 'active'` au trial imeisha bila malipo (Hard Lock), block routes zote za mauzo (Sales, Products, Reports, Dashboard) na mpeleke kwenye Paywall.

## API Integration
- Tutatumia Backend API (Node.js) kwa ajili ya Selcom.
- Frontend haitawahi kuwa na `SELCOM_API_KEY` au `SECRET`.
