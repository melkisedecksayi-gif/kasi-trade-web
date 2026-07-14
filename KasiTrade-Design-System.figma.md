# KasiTrade POS — Figma UI/UX Design System

> **Document Version** 1.0  
> **Target** Figma Local Styles + Component Library  
> **Platform** Web (Desktop-first, responsive to mobile)  
> **Languages** Swahili & English  
> **Themes** Light Mode & Dark Mode  

---

---

# PART 1: FOUNDATION LAYER

## 1.1 Design Principles

| Principle | Description |
|-----------|-------------|
| **Utulivu (Calm)** | Clean, minimal interfaces. No visual noise. Generous whitespace. Slate-based backgrounds. |
| **Haraka (Speed)** | Zero-friction workflows. One-tap checkout. Keyboard shortcuts. Instant search. |
| **Kila Mtu (Inclusive)** | Bilingual (Swahili/English). Touch-optimized. Accessible (WCAG AA). Works on low-end devices. |
| **Taarifa Wazi (Clarity)** | Data visualization that tells stories. Profit/loss at a glance. No confusing jargon. |
| **Kiafrika (African)** | Warm, earthy undertones. Inspired by East African color palettes. Modern-meets-local. |

---

## 1.2 Brand Colors

### Primary Palette

```
Color/black & brand   Base          Hover/Active     Dark Variant     Light Variant
─────────────────────────────────────────────────────────────────────────────────────
Brand Indigo          #6366F1       #5558E6           #4F46E5          #818CF8
Brand Purple          #8B5CF6       #7C3AED           #6D28D9          #A78BFA
Primary Action        #3B82F6       #2563EB           #1D4ED8          #60A5FA
```

### Semantic Palette

```
Semantic              Base          Background        Border           Text
──────────────────────────────────────────────────────────────────────────────
Success (Green)       #10B981       rgba(16,185,129,   #059669          #047857
                                     0.10)
Warning (Amber)       #F59E0B       rgba(245,158,11,   #D97706          #92400E
                                     0.10)
Danger  (Red)         #EF4444       rgba(239,68,68,    #DC2626          #991B1B
                                     0.10)
Info    (Cyan)        #06B6D4       rgba(6,182,212,    #0891B2          #155E75
                                     0.10)
```

### Neutral Palette (Light Mode)

```
Token                 Value         Usage
──────────────────────────────────────────────────────────
White                 #FFFFFF       Card backgrounds
Gray 50               #F8FAFC       Page background
Gray 100              #F1F5F9       Sidebar background
Gray 200              #E2E8F0       Borders, dividers
Gray 300              #CBD5E1       Disabled borders
Gray 400              #94A3B8       Placeholder icons
Gray 500              #64748B       Secondary text
Gray 600              #475569       Input labels
Gray 700              #334155       Subtle headings
Gray 800              #1E293B       Content heading
Gray 900              #0F172A       Primary text
```

### Neutral Palette (Dark Mode)

```
Token                 Value         Usage
──────────────────────────────────────────────────────────
Gray 900              #0F172A       Page background
Gray 800              #1E293B       Card backgrounds
Gray 750              #273449       Card hover
Gray 700              #334155       Borders, dividers
Gray 600              #475569       Placeholder icons
Gray 400              #94A3B8       Secondary text
Gray 300              #CBD5E1       Input labels
Gray 100              #F1F5F9       Primary text
White                 #FFFFFF       Headings, emphasis
```

### Gradient Palette

```
Name                         Start          End           Angle    Usage
────────────────────────────────────────────────────────────────────────────────
Primary Gradient             #6366F1        #8B5CF6       135deg   Primary buttons, CTA, active nav
Auth Gradient                #667EEA        #764BA2       135deg   Auth pages backdrop
Success Gradient             #10B981        #059669       135deg   Success states, profit indicators
Warm Gradient                #EF4444        #F59E0B       135deg   Expense/alert indicators
Card Accent Gradient         #6366F1        #A78BFA       180deg   Card top borders
Glow Gradient                rgba(99,102,   transparent   180deg   Button glows
                             241,0.40)
```

### Chart Palette (10 colors for data visualization)

```
Index  Color     Name
─────────────────────
1      #6366F1   Indigo
2      #8B5CF6   Purple
3      #10B981   Emerald
4      #F59E0B   Amber
5      #EF4444   Red
6      #06B6D4   Cyan
7      #EC4899   Pink
8      #84CC16   Lime
9      #F97316   Orange
10     #14B8A6   Teal
```

### Category Color Map (Products)

```
Category      Text        Background      Border Light
────────────────────────────────────────────────────────────────
Food          #EF4444     #FEE2E2          #FECACA
Drinks        #3B82F6     #DBEAFE          #BFDBFE
Clothing      #8B5CF6     #EDE9FE          #DDD6FE
Electronics   #06B6D4     #CFFAFE          #A5F3FC
Home          #F59E0B     #FEF3C7          #FDE68A
Medicine      #10B981     #D1FAE5          #A7F3D0
Gift          #EC4899     #FCE7F3          #FBCFE8
Shopping      #6366F1     #E0E7FF          #C7D2FE
Beauty        #D946EF     #FAE8FF          #F5D0FE
Other         #64748B     #F1F5F9          #E2E8F0
```

### Category Color Map (Expenses)

```
Category        Text        Background
──────────────────────────────────────
Rent            #EF4444     #FEE2E2
Utilities       #3B82F6     #DBEAFE
Salaries        #8B5CF6     #EDE9FE
Stock Purchase  #10B981     #D1FAE5
Transport       #F59E0B     #FEF3C7
Marketing       #EC4899     #FCE7F3
Maintenance     #06B6D4     #CFFAFE
Other           #64748B     #F1F5F9
```

---

## 1.3 Typography System

### Font Family

```
Primary:    Inter (Google Fonts)
            Weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold
Fallback:   -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
Monospace:  'JetBrains Mono', 'Fira Code', monospace  (for numbers, barcodes, SKUs)
```

### Type Scale (Desktop — 1440px)

```
Style Name          Size    Weight   Line Height   Letter Spacing   Usage
──────────────────────────────────────────────────────────────────────────────
Display / h0        36px    800      1.1           0px              Auth hero title
Heading 1 / h1      28px    800      1.2          -0.3px            Page titles
Heading 2 / h2      24px    700      1.25         -0.2px            Section headers, KPI values
Heading 3 / h3      20px    700      1.3          -0.1px            Card titles
Heading 4 / h4      16px    600      1.4           0px              Modal titles, form sections
Body / p            14px    500      1.5           0px              Body text, descriptions
Body Small / small  13px    500      1.5           0px              Table cells, secondary info
Caption / caption   12px    600      1.4           0.5px (upper)    Badges, labels, meta
Overline / overline 11px    600      1.3           1px   (upper)    Table headers, tiny labels
Micro / micro       10px    500      1.3           0px              Tooltips, timestamps
Mono / code         13px    500      1.6           0px              Prices, barcodes, IDs
```

### Type Scale (Mobile — 375px)

```
Style Name          Size    Weight
──────────────────────────────────
h0                  28px    800
h1                  22px    800
h2                  20px    700
h3                  18px    700
h4                  15px    600
Body                14px    500
Small               13px    500
Caption             11px    600
Overline            10px    600
Micro               10px    500
Mono                13px    500
```

### Text Colors (Token Names)

```
Token                   Light Mode    Dark Mode     Usage
───────────────────────────────────────────────────────────────
text-primary            Gray 900      Gray 100      Body, headings, main content
text-secondary          Gray 500      Gray 400      Descriptions, muted labels
text-tertiary           Gray 400      Gray 600      Placeholder, disabled
text-inverse            White         Gray 900      Text on dark/colored background
text-brand              #6366F1       #818CF8       Links, active, highlight
text-success            #10B981       #34D399       Profit, positive
text-warning            #F59E0B       #FBBF24       Warnings, caution
text-danger             #EF4444       #F87171       Errors, delete, danger
text-gradient-primary   #6366F1→#8B5CF6 gradient     Accent headings
```

---

## 1.4 Spacing System

```
Token    Value     px     Usage
────────────────────────────────────
space-0   0        0      Zero spacing, flush edges
space-1   0.25rem  4px    Icon padding, tight gaps
space-2   0.5rem   8px    Inline gaps, small padding
space-3   0.75rem  12px   Component padding, flex gaps
space-4   1rem     16px   Standard padding, card inset
space-5   1.25rem  20px   Section gaps, large padding
space-6   1.5rem   24px   Page content padding, large gaps
space-8   2rem     32px   Page section spacing, modal padding
space-10  2.5rem   40px   Hero spacing, feature gaps
space-12  3rem     48px   Major page section dividers
space-16  4rem     64px   Landing page sections
```

### Layout Spacing Rules

```
Context                   Horizontal Pad    Vertical Pad     Gap
─────────────────────────────────────────────────────────────────
Page content area         24px (space-6)     24px (space-6)   24px
Card (standard)           16px (space-4)     16px (space-4)   12px (space-3)
Card (compact)            12px (space-3)     12px (space-3)   8px  (space-2)
Modal body                32px (space-8)     32px (space-8)   16px (space-4)
Sidebar                   20px (space-5)     20px (space-5)   8px  (space-2) (items)
Header bar                24px (space-6)     12px (space-3)   16px (space-4)
Form field group          0                   0                16px (space-4)
Table cell                16px (space-4)     10px              0
Stat card                 20px (space-5)     16px (space-4)   12px (space-3)
Button (medium)           24px (space-6) PAD  12px (space-3)   8px (space-2) icon gap
Button (small)            16px (space-4) PAD  8px  (space-2)   6px icon gap
Button (large)            32px (space-8) PAD  16px (space-4)   10px icon gap
Input field               14px (horiz)        12px (space-3)   8px (space-2) icon gap
```

---

## 1.5 Border Radius System

```
Token          Value   Usage
─────────────────────────────────────────
radius-none    0px     Sharp edges (rare)
radius-sm      4px     Input fields, small chips
radius-md      8px     Cards, buttons, containers
radius-lg      12px    Modals, panels, large cards
radius-xl      16px    Stat cards, hero cards
radius-2xl     20px    Badges, pills, toast
radius-full    9999px  Avatars, circular badges, toggle pills

radius-top     md(8px) top, md(8px) top, 0 0    Cards with flush bottoms
radius-bottom  0 0, md(8px) bottom, md(8px) bottom
radius-left    md(8px) left, 0, 0, md(8px) left
radius-right   0, md(8px) right, md(8px) right, 0
```

---

## 1.6 Shadow System

```
Token         X    Y    Blur   Spread    Color (Light)              Color (Dark)
───────────────────────────────────────────────────────────────────────────────────
shadow-xs     0    1px  2px    0         rgba(0,0,0,0.05)           rgba(0,0,0,0.30)
shadow-sm     0    1px  3px    0         rgba(0,0,0,0.08)           rgba(0,0,0,0.40)
shadow-md     0    4px  12px   -2px      rgba(0,0,0,0.10)           rgba(0,0,0,0.50)
shadow-lg     0    8px  24px   -4px      rgba(0,0,0,0.12)           rgba(0,0,0,0.60)
shadow-xl     0    20px 60px   -8px      rgba(0,0,0,0.18)           rgba(0,0,0,0.70)

shadow-glow-sm  0 0 10px   rgba(99,102,241,0.25)
shadow-glow-md  0 0 20px   rgba(99,102,241,0.35)
shadow-glow-lg  0 0 40px   rgba(99,102,241,0.45)

shadow-glass   0 8px 32px   rgba(0,0,0,0.12)  + backdrop-blur   Used on glass surfaces
```

### Figma Effect Styles

```
Name                Type           Settings
─────────────────────────────────────────────────────────
glass-effect        Background     rgba(255,255,255,0.05) + blur(16px)
glass-effect-dark   Background     rgba(0,0,0,0.20) + blur(16px)
gradient-overlay    Background     linear-gradient(...)
text-gradient       Fill           linear-gradient(135deg, #6366F1, #8B5CF6)
```

---

## 1.7 Iconography

### Icon Grid & Sizing

```
All icons are built on a 24x24px base grid with 2px stroke width.

Size Token   Dimensions   Usage
─────────────────────────────────────────
icon-xs      14px         Badges, inline text
icon-sm      16px         Buttons (small), table cells
icon-md      20px         Standard: buttons, inputs, menu
icon-lg      24px         Sidebar nav, stat cards
icon-xl      32px         Empty states, auth pages
icon-2xl     48px         Hero sections, branding
icon-3xl     64px         Login page logo
```

### Icon Library (22 core + 34 colored)

```
Monochrome SVG (stroke, currentColor):
  home  cart  box  users  bar-chart  settings  user  log-out
  menu  x  plus  trash  edit  search  moon  sun  building
  phone  mail  check  alert  clock  chevron-down  truck  help-circle
  credit-card  printer  refresh  eye  eye-off  camera  key
  lock  unlock  heart  star  chat  photo  location  calendar

Colored SVG (filled, pre-colored backgrounds):
  money  package  users-group  warning  cart-color  chart
  trending-up  user-color  help-color  lock-color  unlock-color
  key-color  mail-color  phone-color  location-color  calendar-color
  camera-color  eye-color  eye-off-color  heart-color  star-color
  trash-color  printer-color  clock-color  settings-color
  globe  shield  building-color  home-color  refresh-color
  mobile  credit-card-color  chat-color  photo-color
```

---

## 1.8 Illustrations & Visual Assets

```
Asset               Format    Size        Usage
────────────────────────────────────────────────────
App Logo            PNG/SVG   48×48       Sidebar, header, favicon
App Logo Full       PNG/SVG   180×60      Auth pages, footer
Empty State (Cart)  SVG       200×200     POS empty cart
Empty State (List)  SVG       200×200     No data in tables
Empty State (Chart) SVG       200×200     No report data
Success Check       SVG/Lottie 120×120    Checkout success
Error Cross         SVG/Lottie 120×120    Error state
Loading Spinner     CSS/SVG   40×40       Global loading
Avatar Placeholder  Gradient  varies      Profile initials fallback
TZ Flag             SVG Emoji 32×24       Language toggle
US Flag             SVG Emoji 32×24       Language toggle

Background Pattern  SVG       1440×900    Auth pages (geometric African motif)
```

---

---

# PART 2: COMPONENT LIBRARY

> All components follow Figma auto-layout 4.0.  
> All components have Light/Dark variants via `Swap Library`.  
> All interactable components have states: Default, Hover, Focus, Active, Disabled, Loading.

---

## 2.1 BUTTONS

### Variants

```
┌─────────────────────────────────────────────────────────────────┐
│ PRIMARY BUTTON                                                   │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ [icon?]  Rinda Bidhaa  [icon?]                           │    │
│ └──────────────────────────────────────────────────────────┘    │
│ Fill: linear-gradient(135deg, #6366F1, #8B5CF6)                 │
│ Text: White, 14px, SemiBold (600)                                │
│ Radius: 8px (radius-md)                                          │
│ Padding: 24px horiz, 12px vert                                   │
│ Gap (icon↔text): 8px                                             │
│ Shadow: glow-sm                                                  │
│ Hover: scale(1.02), glow-md                                      │
│ Active: scale(0.98)                                              │
│ Disabled: opacity 0.5, no shadow, no hover                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SECONDARY BUTTON (Outline)                                        │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ [icon?]  Onyesha Yote  [icon?]                           │    │
│ └──────────────────────────────────────────────────────────┘    │
│ Fill: transparent                                                │
│ Border: 1.5px solid, using text-secondary color                  │
│ Text: text-primary, 14px, SemiBold (600)                         │
│ Hover: border → primary, text → primary, bg → rgba(99,102...)    │
│ Active: scale(0.98)                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ GHOST BUTTON                                                     │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ [icon]  Hariri                                          │    │
│ └──────────────────────────────────────────────────────────┘    │
│ Fill: transparent                                                │
│ Text: text-secondary, 13px, Medium (500)                         │
│ Hover: bg → subtle bg change, text → primary                     │
│ Active: scale(0.97)                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DANGER / DESTRUCTIVE BUTTON                                       │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ [icon]  Futa                                             │    │
│ └──────────────────────────────────────────────────────────┘    │
│ Fill: #EF4444                                                    │
│ Text: White, 14px, SemiBold                                      │
│ Hover: #DC2626, glow with danger red                             │
│ Used as primary variant with danger color                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SUCCESS BUTTON                                                    │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ [icon]  Hifadhi                                          │    │
│ └──────────────────────────────────────────────────────────┘    │
│ Fill: #10B981                                                    │
│ Text: White, 14px, SemiBold                                      │
│ Hover: #059669                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ICON-ONLY BUTTON (Circle / Small)                                 │
│ ┌──────┐   ┌──────┐   ┌──────┐                                   │
│ │  ✕   │   │  +   │   │  ☰   │                                   │
│ └──────┘   └──────┘   └──────┘                                   │
│ Size: 36×36px (md), 28×28px (sm)                                  │
│ Radius: full (circle)                                             │
│ Fill: transparent                                                 │
│ Hover: bg → subtle (Gray 200 / Gray 700)                          │
│ Icon: 20px (md), 16px (sm)                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ FAB (Floating Action Button)                                      │
│ ┌─────────┐                                                      │
│ │   [ + ]  │                                                     │
│ └─────────┘                                                      │
│ 56×56px circle                                                    │
│ Fill: primary gradient + glow-lg                                  │
│ Shadow: shadow-lg                                                 │
│ Position: fixed, bottom 32px, right 32px                          │
│ Hover: scale(1.08)                                                │
│ Used on: Products, Customers, Expenses, Suppliers (mobile)        │
└─────────────────────────────────────────────────────────────────┘
```

### Button Sizes

```
Size      Height   Padding Horz   Font Size   Icon Size   Radius
─────────────────────────────────────────────────────────────────
xs        28px     10px           11px        12px        6px
sm        34px     16px           12px        14px        8px
md        42px     24px           14px        18px        10px
lg        50px     32px           16px        20px        12px
xl        58px     40px           18px        24px        14px
```

### Button Composition (Figma Auto-Layout)

```
┌──────────────────────────────────────────┐
│ Button / Primary / md / with-icon         │
│ ┌─────────────────────────────────────┐  │
│ │ Horizontal Auto-Layout               │  │
│ │ ├── Gap: 8px                         │  │
│ │ ├── Padding H: 24px, V: 12px         │  │
│ │ ├── Corner Radius: rounded-lg(12)    │  │
│ │ ├── Fill: Primary Gradient           │  │
│ │ │                                     │  │
│ │ │ [icon:20px]  Text:14/SB  [icon]    │  │
│ │ └─────────────────────────────────────┘  │
│                                              │
│ Variants (Component Properties):             │
│   Variant  = Primary | Secondary | Ghost     │
│              | Danger | Success              │
│   Size     = xs | sm | md | lg | xl         │
│   Icon L   = true | false                    │
│   Icon R   = true | false                    │
│   State    = Default | Hover | Active        │
│              | Disabled | Loading            │
│   FullWidth = true | false                   │
└──────────────────────────────────────────────┘
```

---

## 2.2 INPUT FIELDS

### Text Input

```
┌─────────────────────────────────────────────────────────────────┐
│ STANDARD TEXT INPUT                                               │
│                                                                   │
│  ┌─ Label ──────────────────────────────────────────────────┐    │
│  │ Jina la Bidhaa                        (Required)        │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │ ┌────────────────────────────────────────────────────┐   │    │
│  │ │ 🔍  Ingiza jina la bidhaa...         [clear btn]  │   │    │
│  │ └────────────────────────────────────────────────────┘   │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │ Msaada: Weka jina kamili la bidhaa hii               │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│ Specs:                                                           │
│   Height: 44px                                                   │
│   Radius: 8px                                                    │
│   Border: 1.5px solid, Gray-200 (light) / Gray-700 (dark)      │
│   Background: White (light) / Gray-800 (dark)                   │
│   Padding left: 14px + icon width + 8px gap                      │
│   Padding right: 14px                                            │
│   Label: 13px, SemiBold(600), text-secondary, mb-2               │
│   Helper: 11px, Medium(500), text-tertiary, mt-1                 │
│   Placeholder: 14px, Regular(400), text-tertiary                 │
│   Focus: border → Brand Indigo + glow-sm                         │
│   Error: border → Danger Red, helper → Danger Red                │
│   Disabled: opacity 0.5, no interaction                          │
│                                                                   │
│ Variants:                                                        │
│   Type    = text | password | email | number | tel | url | date  │
│   State   = default | hover | focus | filled | error | disabled   │
│   Icon L  = show | hide                                           │
│   Icon R  = none | clear | visibility | chevron                  │
│   Size    = sm(36px) | md(44px) | lg(52px)                       │
└─────────────────────────────────────────────────────────────────┘
```

### Select / Dropdown

```
┌─────────────────────────────────────────────────────────────────┐
│ SELECT DROPDOWN                                                   │
│                                                                   │
│  ┌─ Aina ya Biashara ──────────────────────────────────────┐    │
│  │ ┌─────────────────────────────────────────────────  ▼ ┐  │    │
│  │ │ Duka la Rejareja                                   │ │  │    │
│  │ └─────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│ ┌─ Dropdown Menu (Overlay) ───────────────────────────────┐     │
│ │ ┌─────────────────────────────────────────────────────┐ │     │
│ │ │ Duka la Rejareja                           ✓       │ │     │
│ │ │ Microfinance                                       │ │     │
│ │ │ Mgahawa (Restaurant)                              │ │     │
│ │ │ Pharmacy                                          │ │     │
│ │ └─────────────────────────────────────────────────────┘ │     │
│ └──────────────────────────────────────────────────────────┘     │
│                                                                   │
│ Specs:                                                           │
│   Same dimensions as Text Input                                   │
│   Chevron icon right, rotates 180° on open                       │
│   Menu: shadow-lg, radius-md, max-h 240px (scroll)               │
│   Menu items: 44px height, 14px text, hover → primary bg tint    │
│   Active item: primary text + checkmark right                      │
│   Animation: slideDown 150ms ease-out                             │
└─────────────────────────────────────────────────────────────────┘
```

### Textarea

```
┌─────────────────────────────────────────────────────────────────┐
│ TEXTAREA                                                          │
│                                                                   │
│  ┌─ Maelezo ───────────────────────────────────────────────┐    │
│  │ ┌────────────────────────────────────────────────────┐   │    │
│  │ │                                                    │   │    │
│  │ │ Ingiza maelezo ya bidhaa...                        │   │    │
│  │ │                                                    │   │    │
│  │ └────────────────────────────────────────────────────┘   │    │
│  │                                        Wahusika: 0/500   │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│ Specs:                                                           │
│   Min height: 100px (about 4 rows)                               │
│   Max height: 300px                                              │
│   Auto-resize: true (grows with content)                         │
│   Padding: 12px all sides                                         │
│   Line height: 1.5                                                │
│   Char counter: right aligned, caption style                     │
└─────────────────────────────────────────────────────────────────┘
```

### Toggle / Switch

```
┌─────────────────────────────────────────────────────────────────┐
│ TOGGLE SWITCH                                                     │
│                                                                   │
│   Hali ya Giza    ○━━━━━━━━━●    (Active / On)                    │
│   Hali ya Giza    ●━━━━━━━━━○    (Inactive / Off)                │
│                                                                   │
│ Specs:                                                           │
│   Track: 44×24px, radius-full                                    │
│   Thumb: 20×20px, White, shadow-sm, radius-full                  │
│   Track Off: Gray-300 (light) / Gray-600 (dark)                  │
│   Track On: #6366F1 (primary)                                    │
│   Transition: 200ms ease                                          │
│   Thumb offset: 2px from edge                                     │
│                                                                   │
│ Variants:                                                        │
│   With Label (left) | With Label (right) | icon-only             │
│   Small: 36×20px track, 16×16px thumb                            │
└─────────────────────────────────────────────────────────────────┘
```

### Search Input (Special)

```
┌─────────────────────────────────────────────────────────────────┐
│ SEARCH INPUT (With Category Filter)                               │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ ┌──────────────┬───────────────────────────────────────┐   │  │
│ │ │ Vyote    ▼ │🔍 Tafuta bidhaa, barcode... [clear]│   │  │
│ │ └──────────────┴───────────────────────────────────────┘   │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ Specs:                                                           │
│   Category chip: 100px fixed width left, with dropdown            │
│   Search field: flex 1, fills remaining space                     │
│   Clear button: appears when text entered                         │
│   Entire group: border 1.5px, radius: 8px                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.3 CARDS

### Card Types

```
┌─────────────────────────────────────────────────────────────────┐
│ STAT CARD (Dashboard KPI)                                         │
│ ┌─────────────────────────────────────┐                          │
│ │ ┌──────────────────────┐            │                          │
│ │ │ 📊 Mauzo ya Leo      │            │                          │
│ │ │                      │  ↑ 12.5%   │                          │
│ │ │ TZS 1,250,000       │  (+45,000)  │                          │
│ │ │                      │            │                          │
│ │ │ Mauzo ya jumla leo   │            │                          │
│ │ └──────────────────────┘            │                          │
│ └─────────────────────────────────────┘                          │
│ Size: 280×132px                                                   │
│ Radius: radius-xl (16px)                                          │
│ Padding: 20px                                                     │
│ Shadow: shadow-md                                                 │
│ Left: icon circle (48×48, primary gradient bg, white icon)       │
│ Center: label (caption), value (h2), subtitle (small)             │
│ Right: trend indicator (+12.5% green / -5% red)                   │
│ Hover: lift (translateY -2px), shadow-lg                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PRODUCT CARD (Grid Item)                                          │
│ ┌──────────────────────┐                                          │
│ │ [  Category Badge  ] │                                          │
│ │                      │                                          │
│ │  Sukari ya Kagera    │                                          │
│ │  Bei: TZS 2,500      │  ← sell price                           │
│ │  Hisa: 45            │  ← stock                                 │
│ │                      │                                          │
│ │ ┌─────┐ ┌──────────┐│                                          │
│ │ │  ➕  │ │ Ongeza   ││  ← quick add to cart                    │
│ │ └─────┘ └──────────┘│                                          │
│ └──────────────────────┘                                          │
│ Size: Flexible (min 200px)                                        │
│ Radius: radius-md (12px)                                          │
│ Padding: 16px                                                     │
│ Top: category badge (caption, colored bg)                         │
│ Title: h4, 16px, Medium(600)                                      │
│ Meta: small text + mono prices                                    │
│ Bottom: action button (ghost, sm)                                 │
│ Hover: border → primary, subtle lift                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TABLE ROW CARD (Mobile)                                           │
│ ┌──────────────────────────────────────────────┐                 │
│ │ ┌───────────────────────────┬──────────────┐ │                 │
│ │ │ Juma Hassan               │  TZS 25,000  │ │                 │
│ │ │ 255 787 123 456           │  Cash ✓      │ │                 │
│ │ │ 10 Jul 2026, 14:32        │              │ │                 │
│ │ └───────────────────────────┴──────────────┘ │                 │
│ └──────────────────────────────────────────────┘                 │
│ Replaces table rows on mobile viewports                          │
│ Radius: radius-md (12px)                                          │
│ Padding: 14px                                                     │
│ Two-column grid internally                                        │
│ Bottom border: subtle separator                                   │
│ Swipe-to-reveal actions (optional, advanced)                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ EMPTY STATE CARD                                                  │
│ ┌─────────────────────────────────────┐                          │
│ │                                      │                          │
│ │          [Illustration]              │                          │
│ │                                      │                          │
│ │  Hakuna bidhaa bado                  │                          │
│ │  Anza kwa kuongeza bidhaa yako       │                          │
│ │  ya kwanza.                          │                          │
│ │                                      │                          │
│ │     ┌─────────────────────┐         │                          │
│ │     │  + Ongeza Bidhaa    │         │                          │
│ │     └─────────────────────┘         │                          │
│ │                                      │                          │
│ └─────────────────────────────────────┘                          │
│ Size: fills container, min 320px                                  │
│ Centered content, large illustration (200px)                     │
│ Title: h4, subtext: body-small, CTA: primary button              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ CHART CARD                                                        │
│ ┌──────────────────────────────────────────┐                    │
│ │ Mwenendo wa Mauzo          Leo ▼        │                    │
│ │ ┌──────────────────────────────────────┐│                    │
│ │ │                                      ││                    │
│ │ │     📈 Line/Area Chart               ││                    │
│ │ │                                      ││                    │
│ │ │  ── Mauzo   ── Faida                 ││  Legend           │
│ │ │                                      ││                    │
│ │ └──────────────────────────────────────┘│                    │
│ │                            TZS 450,000  │ Summary total     │
│ └──────────────────────────────────────────┘                    │
│ Size: fills grid, min 400×300px                                   │
│ Radius: radius-lg (16px)                                          │
│ Padding: 20px                                                     │
│ Header row: title (h4) + period selector (dropdown, sm)          │
│ Chart area: fills remaining, SVG canvas                           │
│ Footer: total value or legend                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SETTINGS CARD                                                     │
│ ┌──────────────────────────────────────────────┐                 │
│ │ ┌─────────────────────────────────────────┐ │                 │
│ │ │ Hali ya Giza               [Toggle ●] │ │                 │
│ │ │ Wezesha mwonekano wa giza                 │ │                 │
│ │ └─────────────────────────────────────────┘ │                 │
│ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤                 │
│ │ ┌─────────────────────────────────────────┐ │                 │
│ │ │ Lugha              🇹🇿 Kiswahili  ▼ │ │                 │
│ │ │ Chagua lugha unayopendelea               │ │                 │
│ │ └─────────────────────────────────────────┘ │                 │
│ └──────────────────────────────────────────────┘                 │
│ Separator lines between items                                     │
│ Each row: label + value or control, subtitle below               │
│ Row height: 56px (default), 48px (compact)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.4 MODALS & DIALOGS

```
┌─────────────────────────────────────────────────────────────────┐
│ MODAL OVERLAY                                                     │
│                                                                   │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │                    Backdrop: rgba(0,0,0,0.5)                │   │
│ │                    + backdrop-blur(4px)                     │   │
│ │                                                             │   │
│ │   ┌──────────────────────────────────────────────┐        │   │
│ │   │ ┌─────────────────────────────────┬──────┐  │        │   │
│ │   │ │ Ongeza Bidhaa Mpya              │  ✕   │  │        │   │
│ │   │ ├─────────────────────────────────┴──────┤  │        │   │
│ │   │ │                                         │  │        │   │
│ │   │ │  ──────── Form Fields ──────────       │  │        │   │
│ │   │ │  Jina la Bidhaa    [____________]      │  │        │   │
│ │   │ │  Kategoria          [Vyote    ▼]       │  │        │   │
│ │   │ │  Bei ya Kununua    [____________]      │  │        │   │
│ │   │ │  Bei ya Kuuza      [____________]      │  │        │   │
│ │   │ │  Idadi ya Hisa     [____________]      │  │        │   │
│ │   │ │                                         │  │        │   │
│ │   │ ├─────────────────────────────────────────┤  │        │   │
│ │   │ │  [  Ghairi  ]     [  Hifadhi Bidhaa  ] │  │        │   │
│ │   │ └─────────────────────────────────────────┘  │        │   │
│ │   └──────────────────────────────────────────────┘        │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│ Specs:                                                           │
│   Width: 520px (default), 680px (large), 360px (small mobile)    │
│   Max height: 85vh, scrollable content                           │
│   Radius: radius-lg (16px)                                        │
│   Padding: 32px                                                   │
│   Background: card background                                     │
│   Shadow: shadow-xl                                               │
│   Header: h4 title + close icon button (36px)                    │
│   Body: scrollable, gap 16px between fields                      │
│   Footer: secondary (left) + primary (right) buttons             │
│   Animation: fadeInScale 200ms ease-out                          │
│   Close: click backdrop, press Escape, click X button            │
│                                                                   │
│ Variants:                                                        │
│   Size    = sm(400px) | md(520px) | lg(680px) | xl(isFullscreen) │
│   Type    = standard | confirm | success | error                 │
│   Scroll  = fixed-body | scrollable                              │
│                                                                   │
│ CONFIRM DIALOG                                                    │
│   Width: 400px                                                    │
│   Danger icon centered (48px, red circle)                         │
│   Title: "Unathibitisha?" centered, h3                            │
│   Body: description text, centered, body-small                    │
│   Buttons: Danger (left/ghost) + Cancel (right/secondary)        │
│                                                                   │
│ CHECKOUT MODAL (Special case)                                     │
│   Width: 680px                                                    │
│   Three sections: Cart items (scroll), Summary rows, Payment     │
│   Payment: 3 method cards (Cash, Mobile Money, Card)             │
│   Selected method: highlighted border + checkmark                │
│   Bottom: Total (h2, bold) + Complete Sale button (full width)   │
└─────────────────────────────────────────────────────────────────┘
```

### Toast Notifications

```
┌─────────────────────────────────────────────────────────────────┐
│ TOAST                                                             │
│                                                                   │
│   ┌──────────────────────────────────────────┐                   │
│   │ ✓  Bidhaa imeongezwa kwa ufanisi!    ✕ │                   │
│   └──────────────────────────────────────────┘                   │
│                                                                   │
│ Specs:                                                           │
│   Width: max 400px                                                │
│   Padding: 14px horiz, 12px vert                                 │
│   Radius: radius-md (10px)                                        │
│   Shadow: shadow-lg                                               │
│   Position: fixed, top 20px, right 20px                          │
│   Icon left: 20px, colored (success/warning/error)               │
│   Text: 14px, Medium(500)                                        │
│   Close button: right, 16px icon                                  │
│   Background: card background + top border (3px, colored)        │
│   Animation: slideInRight 300ms, fadeOutRight 300ms             │
│   Auto-dismiss: 3s (configurable)                                │
│   Stack: vertical gap 8px for multiple                            │
│                                                                   │
│ Types:                                                            │
│   Success  - green left border, check icon                       │
│   Warning  - amber left border, alert icon                       │
│   Error    - red left border, x-circle icon                      │
│   Info     - blue left border, info icon                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.5 DATA DISPLAY

### Table

```
┌─────────────────────────────────────────────────────────────────┐
│ DATA TABLE                                                        │
│                                                                   │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │  Bidhaa              │Kategoria   │Bei   │Hisa │Hali │Vitendo│  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ 🏷 Sukari Kagera    │🍞 Chakula   │2,500 │45   │ ✅  │ ⋯    │  │
│ │ 🏷 Mchele Mbeya     │🍞 Chakula   │3,200 │12   │ ⚠️  │ ⋯    │  │
│ │ 🏷 Coca Cola 500ml  │🥤 Vinywaji │1,500 │0    │ ❌  │ ⋯    │  │
│ │ 🏷 Suruali Jeans    │👕 Nguo      │35,000│8    │ ✅  │ ⋯    │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ Specs:                                                           │
│   Width: 100% of container                                        │
│   Header row: 40px height, bg-muted, caption-style text, upper   │
│   Data rows: 48px height, stripe alternating (every odd row)      │
│   Cell padding: 16px horiz, 10px vert                             │
│   Borders: horizontal only (header bottom, row bottom)            │
│   Row hover: subtle bg tint                                       │
│   Sort indicator: ▲▼ arrows in header                            │
│   Actions column: fixed width 80px, right aligned                │
│   Checkbox column: 40px fixed, left aligned (for bulk)            │
│   Empty: "Hakuna data" centered across all columns                │
│   Sticky header: yes                                              │
│                                                                   │
│ Pagination Bar (Footer of Table):                                 │
│ ┌───────┬───────────────────────────────────────┬──────────┐     │
│ │ 1-10  │   ◀  1  2  3  4  ...  12  ▶        │ 10 kwa   │     │
│ │ ya 120│                                      │ ukrasa ▼ │     │
│ └───────┴───────────────────────────────────────┴──────────┘     │
│   Result count (left), Page numbers (center), Page size (right)   │
└─────────────────────────────────────────────────────────────────┘
```

### Badges & Chips

```
┌─────────────────────────────────────────────────────────────────┐
│ STATUS BADGE                                                      │
│                                                                   │
│   ┌────────────┐   ┌────────────┐   ┌────────────┐              │
│   │  ✅ In Stock │   │ ⚠️ Low Stock│   │ ❌ Out     │              │
│   └────────────┘   └────────────┘   └────────────┘              │
│                                                                   │
│ Specs:                                                           │
│   Height: 22px                                                    │
│   Padding H: 10px                                                 │
│   Radius: radius-full (20px)                                      │
│   Font: caption, 600                                              │
│   Colors: use semantic palette with appropriate bg                │
│   Icon: 12px left of text                                        │
│                                                                   │
│ CATEGORY CHIP                                                     │
│   ┌─────────────┐                                                │
│   │ 🥤 Vinywaji  │                                               │
│   └─────────────┘                                                │
│   Similar to badge, slightly taller (26px), radius-md (8px)      │
│   Colored by category map                                         │
│   Can be dismissible (with × icon right)                          │
│                                                                   │
│ QUANTITY BADGE (Cart indicator)                                   │
│   ┌────┐                                                          │
│   │ 12 │  ← positioned top-right of icon                          │
│   └────┘                                                          │
│   12×12px or 16×16px, full-radius                                 │
│   Fill: #EF4444, Text: White, 9px, Bold                            │
└─────────────────────────────────────────────────────────────────┘
```

### Avatar

```
┌─────────────────────────────────────────────────────────────────┐
│ AVATAR                                                            │
│                                                                   │
│   ┌──────┐    ┌──────┐    ┌──────────────┐                       │
│   │  JM  │    │      │    │              │                       │
│   │      │    │  📷  │    │ [Profile Pic]│                       │
│   └──────┘    └──────┘    └──────────────┘                       │
│   Initials    Upload        Image                                  │
│                                                                   │
│ Specs:                                                           │
│   Shape: circle (radius-full)                                    │
│   Sizes: sm(32px) | md(40px) | lg(48px) | xl(64px) | 2xl(96px) │
│   Initials: bold, white text on gradient background              │
│   Gradient: primary gradient (6366F1→8B5CF6)                     │
│   Image: object-fit cover, border 2px card-bg                    │
│   Upload overlay: dark overlay + camera icon (on hover)          │
│   Status dot: 10px circle, green=online, positioned bottom-right │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.6 NAVIGATION

### Sidebar (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│ SIDEBAR (Desktop: 260px, Mobile: 300px overlay)                   │
│                                                                   │
│ ┌───────────────────────────────┐                                │
│ │ ┌─────────────────────────┐   │                                │
│ │ │ [Logo]  Kasitrade POS    │   │  ← Brand header (56px)       │
│ │ └─────────────────────────┘   │                                │
│ │                               │                                │
│ │ ┌─── Active Shop Badge ────┐ │                                │
│ │ │ 🏪 Duka la Mjini          │ │                                │
│ │ └──────────────────────────┘ │                                │
│ │ ──────────────────────────── │                                │
│ │                               │                                │
│ │  ●  Dashibodi                │  ← Active item (gradient bg)   │
│ │  ○  Mauzo (POS)              │                                │
│ │  ○  Bidhaa                   │                                │
│ │  ○  Wateja                   │                                │
│ │  ○  Ripoti                   │                                │
│ │  ○  Matumizi                 │                                │
│ │  ○  Wasambazaji              │                                │
│ │  ○  Mipangilio               │                                │
│ │                               │                                │
│ │ ──────────────────────────── │                                │
│ │                               │                                │
│ │  ○  Msaada                   │                                │
│ │  ○  Toka (Ondoka)            │  ← Red on hover               │
│ │                               │                                │
│ └───────────────────────────────┘                                │
│                                                                   │
│ Specs:                                                           │
│   Width: 260px (desktop), 300px (mobile overlay)                  │
│   Height: 100vh                                                    │
│   Background: Gray-100 (light) / Gray-900 (dark)                  │
│   + subtle glass effect                                           │
│   Border right: 1px subtle (Gray-200 / Gray-800)                 │
│   Padding: 20px                                                   │
│                                                                   │
│ Nav Item:                                                         │
│   Height: 44px, radius: 10px                                     │
│   Icon left: 20px, text: 14px Medium(500)                        │
│   Padding: 12px horiz                                             │
│   Gap icon↔text: 12px                                             │
│   Default: text-secondary, transparent bg                        │
│   Hover: bg → subtle tint, text → white (dark)/dark (light)      │
│   Active: bg → primary gradient, text → white, shadow → glow    │
│           + white indicator bar left edge (3px width, 20px tall) │
│                                                                   │
│ Mobile Overlay:                                                   │
│   Appears on top with dark backdrop                              │
│   Slide in from left (300ms ease-out)                            │
│   Close: click backdrop, swipe left, or tap menu icon            │
└─────────────────────────────────────────────────────────────────┘
```

### Header Bar (Top)

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (Height: 56px, Sticky, Glass effect)                       │
│                                                                   │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ☰  │  Mauzo (POS)   │          │ 🇹🇿  │🏪│ JM │  │          │  │
│ │    │                 │          │lang │  │    │  │          │  │
│ └──────────────────────────────────────────────────────────────┘  │
│    ↑                   ↑                                ↑         │
│    hamburger       page title                   right actions     │
│                                                                   │
│ Specs:                                                           │
│   Height: 56px                                                    │
│   Sticky: top 0, z-index 50                                      │
│   Background: glass effect (blur + semi-transparent)             │
│   Border bottom: 1px subtle                                       │
│   Padding: 0 24px                                                 │
│   Layout: flex, space-between, align-center                      │
│                                                                   │
│ Left Section:                                                     │
│   Hamburger button (36px circle icon button)                     │
│   Page title: h3 style, 20px, Bold (700)                       │
│   Active shop name: 13px, Medium(500), text-secondary            │
│                                                                   │
│ Right Section (gap 12px):                                        │
│   Language toggle: flag emoji + text, 13px                       │
│   Shop switcher: icon + shop name, dropdown chevron             │
│   Profile button: avatar md(40px)                                │
│                                                                   │
│ Mobile:                                                           │
│   Title truncated if long                                          │
│   Actions compress to icons only                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tab / Period Selector

```
┌─────────────────────────────────────────────────────────────────┐
│ PERIOD SELECTOR (Reports, Dashboard)                               │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ ┌─────────┐ ┌───────────┐ ┌─────────┐ ┌──────┐ ┌──────┐   │  │
│ │ │ ● Leo   │ │ ○ Wiki hii│ │ ○ Mwezi │ │○ Mwaka│ │○ Muda│   │  │
│ │ └─────────┘ └───────────┘ └─────────┘ └──────┘ └──────┘   │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ Specs:                                                           │
│   Each tab: 36px height, padding H: 16px, radius: 8px            │
│   Default: transparent, text-secondary                           │
│   Hover: bg → subtle                                             │
│   Active: bg → primary (10% opacity), text → primary, SemiBold   │
│   Underline indicator: 2px primary bar (optional, alternative)   │
│   Gap between tabs: 4px                                           │
│   Custom range: opens date picker popover                        │
│                                                                   │
│ Mobile: Scroll horizontally, fade edges                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.7 CHARTS & DATA VISUALIZATION

```
┌─────────────────────────────────────────────────────────────────┐
│ CHART TYPES (SVG-based, no 3rd party lib needed)                  │
│                                                                   │
│ 1. LINE + AREA CHART (Sales Trend)                                │
│    ┌────────────────────────────────────────────┐                │
│    │           ╱╲    ╱╲                          │               │
│    │    ╱╲    ╱  ╲╱╱  ╲    ╱╲                   │               │
│    │   ╱  ╲╱╱          ╲╱╱  ╲  ╱╲               │               │
│    │ ╱                        ╲╱  ╲             │               │
│    └────────────────────────────────────────────┘                │
│    Dual series: Sales (#6366F1, area fill 15% opacity)           │
│                  Profit (#10B981, area fill 15% opacity)          │
│    Grid: horizontal dashed lines, subtle gray                     │
│    Axis labels: 11px caption-style                                │
│    Tooltip: on hover, card with date + values                    │
│                                                                   │
│ 2. HORIZONTAL BAR CHART (Top Products)                           │
│    ┌─────────────────────────────────────────────┐               │
│    │ Sukari Kagera  ████████████████   TZS 45...  │               │
│    │ Mchele Mbeya   ██████████████     TZS 38...  │               │
│    │ Samaki         ██████████         TZS 25...  │               │
│    │ Mafuta         ████████           TZS 18...  │               │
│    │ Unga           ██████             TZS 12...  │               │
│    └──────────────────────────────────────────────┘               │
│    Single bar: 20px height, radius 4px right                     │
│    Bar color: primary gradient (6366F1→8B5CF6)                   │
│    Background track: Gray-100 (light) / Gray-700 (dark)         │
│    Labels: left (name, small), right (value, semi-bold mono)     │
│    Gap between bars: 8px                                          │
│                                                                   │
│ 3. DONUT CHART (Category Distribution)                            │
│          ╭─────────────────╮                                     │
│        ╱    ██ Chakula      ╲     Center: "Jumla: 150"          │
│       │   ██   (35%)   ██   │      (h3, centered)               │
│       │  ██            ██   │     Radius outer: 80px             │
│       │  ██   150      ██   │     Radius inner: 55px             │
│       │  ██  bidhaa    ██   │     Hole: center text              │
│       │   ██         ██    │     Legend: right side or below     │
│        ╲   ██████████     ╱      Each slice: 8px spacing        │
│          ╰────────────────╯      Colors: chart palette          │
│                                                                   │
│ 4. PROFIT GAUGE (Semi-circular)                                   │
│              ╭──────╮                                           │
│            ╱   35%   ╲                                          │
│           │            │         Arc: 180° semi-circle           │
│           │   FAIDA    │         Fill: success gradient          │
│            ╲          ╱          Value: h2, centered below      │
│              ╰──────╯           Subtext: "Kiwango cha faida"   │
│                                                                   │
│ 5. STAT SPARKLINE (inline mini chart in stat cards)               │
│    ───╲────╱──╲───╱╲──╱──     (monochrome, 80px width)         │
│    Positive trend: success green, Negative: danger red           │
│                                                                   │
│ 6. CATEGORY BREAKDOWN BAR (Expenses)                              │
│    ┌────────────────────────────────────────────┐                │
│    │ Kodi     ████████████████      45%  TZS ...│                │
│    │ Mishahara████████████          30%  TZS ...│                │
│    │ Usafiri  ████████              15%  TZS ...│                │
│    │ Nyinginezo█████                10%  TZS ...│                │
│    └────────────────────────────────────────────┘                │
│    Each row: 40px height                                          │
│    Colored by expense category map                                │
│    Percentage + amount right aligned                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.8 FORMS

### Form Layout Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│ STANDARD FORM (Modal / Full Page)                                  │
│                                                                   │
│ ┌──────────────────────────────────────────────────────┐        │
│ │                                                       │        │
│ │  Section: "Taarifa za Bidhaa"                         │        │
│ │  ─────────────────────────────────────────────────    │        │
│ │                                                       │        │
│ │  ┌─────────────────────┐ ┌─────────────────────┐     │        │
│ │  │ Jina la Bidhaa      │ │ Kategoria           │     │        │
│ │  │ [_______________] │ │ [Duka la Reja ▼]   │     │        │
│ │  └─────────────────────┘ └─────────────────────┘     │        │
│ │                                                       │        │
│ │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │        │
│ │  │Bei Kununua│ │Bei Kuuza │ │Hisa      │             │        │
│ │  │[________]│ │[________]│ │[________]│             │        │
│ │  └──────────┘ └──────────┘ └──────────┘             │        │
│ │                                                       │        │
│ │  ┌─────────────────────────────────────────┐        │        │
│ │  │ Maelezo                                  │        │        │
│ │  │ [                                  ]   │        │        │
│ │  │ [                                  ]   │        │        │
│ │  └─────────────────────────────────────────┘        │        │
│ │                                                       │        │
│ └──────────────────────────────────────────────────────┘        │
│                                                                   │
│ Column Grid:                                                     │
│   1 col: mobile (< 640px)                                        │
│   2 col: 640px-1024px                                             │
│   3 col: > 1024px                                                 │
│   Gap: 16px both axes                                             │
│                                                                   │
│ Field Spacing:                                                    │
│   Field group to field group: 20px                                │
│   Field to field: inherited gap from grid                         │
│                                                                   │
│ Validation States:                                                │
│   Default: border Gray-200/700                                    │
│   Focus: border primary + glow                                    │
│   Valid: border success + checkmark right                         │
│   Error: border danger + error icon right + error text below     │
│                                                                   │
│ Required Indicator: "*" red asterisk next to label                │
│ Optional Indicator: "(si lazima)" gray caption text              │
└─────────────────────────────────────────────────────────────────┘
```

### Auth Form (Special)

```
┌─────────────────────────────────────────────────────────────────┐
│ AUTH FORM (Centered, full viewport height)                         │
│                                                                   │
│ ┌──────────────────────────────────────┐                         │
│ │                                      │                         │
│ │        [Logo 180×60]                 │                         │
│ │                                      │                         │
│ │  ┌──────────────────────────────┐   │                         │
│ │  │  Karibu KasiTRADE             │   │                         │
│ │  │                               │   │                         │
│ │  │  ┌─ Barua Pepe ──────────┐  │   │                         │
│ │  │  │ 📧  mfano@email.com    │  │   │                         │
│ │  │  └────────────────────────┘  │   │                         │
│ │  │                               │   │                         │
│ │  │  ┌─ Nenosiri ───────────┐  │   │                         │
│ │  │  │ 🔒  ••••••••    👁    │  │   │                         │
│ │  │  └────────────────────────┘  │   │                         │
│ │  │                               │   │                         │
│ │  │  ╔══════════════════════╗   │   │                         │
│ │  │  ║     Ingia            ║   │   │  ← Full-width primary  │
│ │  │  ╚══════════════════════╝   │   │                         │
│ │  │                               │   │                         │
│ │  │     Umesahau nenosiri?        │   │                         │
│ │  │                               │   │                         │
│ │  │  ──────── au ─────────        │   │                         │
│ │  │                               │   │                         │
│ │  │  ╔══════════════════════╗   │   │                         │
│ │  │  ║  Fungua Akaunti      ║   │   │  ← Outline style       │
│ │  │  ╚══════════════════════╝   │   │                         │
│ │  │                               │   │                         │
│ │  └──────────────────────────────┘   │                         │
│ │                                      │                         │
│ └──────────────────────────────────────┘                         │
│                                                                   │
│ Specs:                                                           │
│   Card width: 440px (desktop), 90vw (mobile)                     │
│   Card: shadow-xl, radius-xl                                     │
│   Background: full viewport with geometric pattern overlay        │
│   Auth page background: gradient(135deg, #667EEA, #764BA2)       │
│                                                                   │
│ Registration (2-step):                                            │
│   Step 1: Email, Phone, Password, Confirm Password               │
│           Password strength meter (5-segment bar, color-coded)   │
│   Step 2: Business Type, Business Name, Country, Region,          │
│           District, Ward                                          │
│   Step indicator: dots (● ○) at top, progressive                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.9 POS CART (Special Component)

```
┌─────────────────────────────────────────────────────────────────┐
│ POS LAYOUT                                                        │
│                                                                   │
│ ┌───────────────────────────┬────────────────────┐              │
│ │    PRODUCT GRID            │    CART PANEL       │ 360px fixed │
│ │                            │                     │              │
│ │ ┌───────────────────────┐ │ ┌─────────────────┐│              │
│ │ │ 🔍 Tafuta...  [Vyote▼]│ │ │ Mkokoteni  (4)  ││              │
│ │ └───────────────────────┘ │ ├─────────────────┤│              │
│ │                            │ │                 ││              │
│ │ ┌──────┐ ┌──────┐ ┌─────┐│ │ │● Sukari ×2     ││              │
│ │ │Prod A│ │Prod B│ │Prod ││ │ │  - 1  +  TZS... ││              │
│ │ │TZS X │ │TZS Y │ │TZS Z││ │ │                 ││              │
│ │ │➕Ongez│ │➕Ongez│ │➕Onge││ │ │● Mchele ×1    ││              │
│ │ └──────┘ └──────┘ └─────┘│ │ │  - 0  +  TZS... ││              │
│ │                            │ │                 ││              │
│ │ ┌──────┐ ┌──────┐ ┌─────┐│ │ │                 ││              │
│ │ │Prod D│ │Prod E│ │Prod ││ │ │                 ││              │
│ │ │TZS W │ │TZS V │ │TZS U││ │ │                 ││              │
│ │ └──────┘ └──────┘ └─────┘│ │ │                 ││              │
│ │                            │ ├─────────────────┤│              │
│ │                            │ │Jumla: TZS 8,500 ││              │
│ │                            │ │Vipengee: 4      ││              │
│ │                            │ │                 ││              │
│ │                            │ │╔═══════════════╗││              │
│ │                            │ │║  Lipia (F1)   ║││              │
│ │                            │ │╚═══════════════╝││              │
│ └───────────────────────────┴────────────────────┘              │
│                                                                   │
│ Cart Item Row:                                                   │
│   Height: 60px                                                    │
│   Left: product name (bold 14px) + unit price (muted 12px)      │
│   Right: quantity controls (─ 0 +) inline                        │
│   Quantity: 28px×28px buttons, 36px middle display               │
│   Swipe left to remove (mobile)                                   │
│                                                                   │
│ Cart Summary:                                                     │
│   Subtotal, Tax (if applicable), Discount, Total                  │
│   Each row: label (small, muted) + value (13px, medium, mono)   │
│   Total row: larger (16px, bold), colored (primary)              │
│                                                                   │
│ Checkout Button:                                                  │
│   Full width, height 50px, primary gradient                      │
│   Text: "Lipia" (Pay) + total amount                             │
│   Keyboard shortcut hint: (F1)                                   │
│   Pulsing animation when cart has items                          │
└─────────────────────────────────────────────────────────────────┘
```

### Payment Methods Selector (Checkout Modal)

```
┌─────────────────────────────────────────────────────────────────┐
│ PAYMENT METHODS (3 Options)                                        │
│                                                                   │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐           │
│ │  💵           │ │  📱           │ │  💳           │           │
│ │  Fedha Taslimu│ │  Simu ya Mkononi│ │ Kadi ya Benki │           │
│ │               │ │               │ │               │           │
│ │   ✓ Imeteuliwa│ │               │ │               │           │
│ └───────────────┘ └───────────────┘ └───────────────┘           │
│                                                                   │
│ Specs:                                                           │
│   Each card: 100px height, 33% width                             │
│   Radius: 12px                                                    │
│   Border: 1.5px, Gray-200/700                                    │
│   Icon: 32px, centered top                                        │
│   Label: caption, centered bottom                                │
│   Selected: border 2px primary, bg primary-10%, checkmark icon   │
│   Hover: border → primary (subtle)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.10 RECEIPT TEMPLATES

```
┌─────────────────────────────────────────────────────────────────┐
│ RECEIPT PREVIEW (in settings)                                      │
│                                                                   │
│ Template 1: SIMPLE                                                │
│ ┌───────────────────────────────────┐                            │
│ │         KasiTRADE POS             │                            │
│ │         Duka letu, Duka lako      │                            │
│ │ ─────────────────────────────────│                            │
│ │                                    │                            │
│ │ Bidhaa           Qty    Jumla      │                            │
│ │ Sukari           2      5,000      │                            │
│ │ Mchele           1      3,200      │                            │
│ │ ─────────────────────────────────│                            │
│ │ JUMLA                    8,200      │                            │
│ │                                    │                            │
│ │ Lipa: Fedha Taslimu                │                            │
│ │ Tarehe: 10/07/2026 14:32           │                            │
│ │ ─────────────────────────────────│                            │
│ │    Asante kwa kununua kwetu!       │                            │
│ └───────────────────────────────────┘                            │
│                                                                   │
│ Template 2: DETAILED (with shop info, tax, footer)                │
│ Template 3: THERMAL 80mm (optimized for receipt printers)        │
│                                                                   │
│ Receipt Settings:                                                 │
│   Logo upload (max 200×200px)                                    │
│   Footer text customization                                      │
│   Show/hide tax, shop address, phone                             │
│   Print button (opens browser print dialog)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

---

# PART 3: LAYOUT SYSTEM

## 3.1 Page Grid

```
Desktop (≥ 1024px):
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: 56px height, sticky, full width                           │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┬─────────────────────────────────────────────────┐  │
│ │          │                                                  │  │
│ │ SIDEBAR  │              CONTENT AREA                        │  │
│ │ 260px    │              fluid, max-width 1200px             │  │
│ │ fixed    │              padding: 24px all sides              │  │
│ │          │                                                  │  │
│ │          │  ┌──────────────────────────────────────────┐   │  │
│ │          │  │  CONTENT GRID (12 col, 16px gap)         │   │  │
│ │          │  │                                          │   │  │
│ │          │  │ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐ │   │  │
│ │          │  │ │  │  │  │  │  │  │  │  │  │  │  │  │ │   │  │
│ │          │  │ ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤ │   │  │
│ │          │  │ │  │  │  │  │  │  │  │  │  │  │  │  │ │   │  │
│ │          │  │ └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘ │   │  │
│ │          │  │                                          │   │  │
│ │          │  └──────────────────────────────────────────┘   │  │
│ │          │                                                  │  │
│ └──────────┴─────────────────────────────────────────────────┘  │
│                                                                   │
│ FOOTER: 64px height, full width                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Content Area Layouts by Page

```
DASHBOARD:
┌────────────────────────────────────────────┐
│ PAGE TITLE + WELCOME                        │
├────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ │ STAT 1   │ │ STAT 2   │ │ STAT 3   │ │ STAT 4   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘
├────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────┐
│ │ CHART: Sales Trend      │ │ RECENT       │
│ │                         │ │ TRANSACTIONS │
│ │                         │ │              │
│ └─────────────────────────┘ └─────────────┘
└────────────────────────────────────────────┘

POS:
┌───────────────────────────┬────────────────┐
│ PRODUCT LIST (flex 1)     │ CART (360px)   │
│   Search + Categories      │   Items list    │
│ │ Filters                  │   Summary       │
│ │                          │   Checkout btn  │
│   ┌───┐ ┌───┐ ┌───┐      │                │
│   │ P │ │ P │ │ P │      │                │
│   └───┘ └───┘ └───┘      │                │
│   ┌───┐ ┌───┐ ┌───┐      │                │
│   │ P │ │ P │ │ P │      │                │
│   └───┘ └───┘ └───┘      │                │
└───────────────────────────┴────────────────┘

PRODUCTS / CUSTOMERS / SUPPLIERS / EXPENSES:
┌────────────────────────────────────────────┐
│ HEADER: Title + Action Bar                  │
│ [Search ────────] [Filter ▼] [+ Add New]  │
├────────────────────────────────────────────┤
│ STAT CARDS (Products only)                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ Total    │ │ Low Stock│ │ Out Stock│    │
│ └──────────┘ └──────────┘ └──────────┘    │
├────────────────────────────────────────────┤
│ TABLE / DATA LIST                           │
│ ┌──────────────────────────────────────┐   │
│ │ ...                                  │   │
│ └──────────────────────────────────────┘   │
│ PAGINATION                                  │
└────────────────────────────────────────────┘

REPORTS:
┌────────────────────────────────────────────┐
│ HEADER: Title + Period Tabs + Export       │
│ [Leo] [Wiki] [Mwezi] [Mwaka] [Muda Maalum]│
├────────────────────────────────────────────┤
│ KPI CARDS (5 across)                        │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌───┐ │
│ │Revenue│ │Profit│ │Trans.│ │AOV   │ │Sold│
│ └──────┘ └──────┘ └──────┘ └──────┘ └───┘ │
├────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌───────────────┐ │
│ │ Sales Trend (8col)   │ │ Top Products  │ │
│ │                      │ │ (4col)        │ │
│ └──────────────────────┘ └───────────────┘ │
│ ┌──────────────────────┐ ┌───────────────┐ │
│ │ Category Dist(6col)  │ │ Profit Gauge  │ │
│ │                      │ │ (6col)        │ │
│ └──────────────────────┘ └───────────────┘ │
│ TRANSACTION TABLE                           │
└────────────────────────────────────────────┘

SETTINGS:
┌────────────────────────────────────────────┐
│ SECTION: Shops                              │
│ ┌──────────────────────────────────────┐   │
│ │ Active Shop: Duka la Mjini      [▼]  │   │
│ │ [+ Add New Shop]                      │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ SECTION: Preferences                       │
│ ┌──────────────────────────────────────┐   │
│ │ Dark Mode              [Toggle ○●]   │   │
│ │ Language       🇹🇿 Kiswahili  [▼]   │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ SECTION: Account                           │
│ ┌──────────────────────────────────────┐   │
│ │ Email: user@example.com              │   │
│ │ [Toka (Logout)]                       │   │
│ └──────────────────────────────────────┘   │
└────────────────────────────────────────────┘

PROFILE:
┌────────────────────────────────────────────┐
│ ┌────────────────┐                          │
│ │                │  Jina Kamili              │
│ │   [Avatar]     │  Simu: 255...             │
│ │                │  Biashara: Duka langu     │
│ │  [Change Photo]│  Mahali: Dar es Salaam    │
│ └────────────────┘                          │
│ ┌──────────────────────────────────────┐   │
│ │ Form Fields for editing              │   │
│ │ + Save Button                        │   │
│ └──────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

---

## 3.2 Responsive Breakpoints

```
Breakpoint        Width         Layout Changes
─────────────────────────────────────────────────────────────────
Mobile S          320-374px     Single column, condensed
Mobile M          375-479px     Single column
Mobile L          480-639px     Single column, larger touch targets
Tablet            640-767px     Single column, side padding increase
Tablet L          768-1023px    2-column grids possible
Desktop           1024-1279px   Full layout, sidebar visible
Desktop L         1280-1439px   Wider content, 3-4 column KPI grids
Desktop XL        1440px+      Max width 1440px, centered
```

### Mobile Adaptations

```
Component          Desktop                  Mobile
──────────────────────────────────────────────────────────────────
Sidebar            260px persistent         300px slide-out overlay
Table              Full columns             Card list (row→card)
KPI Stats          4 across                 2 across (scrollable)
Charts             Large canvas             Reduced, scrollable
Modal              520px centered           90vw, near full-screen
POS Cart           360px side panel         Bottom sheet / toggle
Header Actions     Icons + text             Icons only
Form Grid          2-3 columns              1 column
Search+Filter      Inline                   Stacked vertically
Footer             Multi-column             Single column, centered
Tabs               Inline stretched         Horizontal scroll
FAB                Not shown                Visible bottom-right
```

---

---

# PART 4: INTERACTION SPECS

## 4.1 Motion Tokens

```
Token            Duration   Easing                  Usage
──────────────────────────────────────────────────────────────────
instant          0ms        linear                  Instant state changes
micro            100ms      ease-out                Icon hover, focus ring
quick            150ms      ease-out                Menu open, tooltip appear
standard         200ms      ease-in-out             Button press, card hover
smooth           300ms      ease-out                Modal open, toast slide
expressive       400ms      ease-in-out             Sidebar open, page transition
slow             600ms      ease-in-out             Large panel open, celebration
```

### CSS Easing Curves (for Figma prototype)

```
ease-out:           cubic-bezier(0.16, 1, 0.3, 1)
ease-in-out:        cubic-bezier(0.65, 0, 0.35, 1)
ease-spring:        cubic-bezier(0.34, 1.56, 0.64, 1)
ease-bounce:        cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

---

## 4.2 Key Animations

### Page Transitions

```
Page Enter (standard):
  transition-page-enter
    opacity: 0→1 (200ms, ease-out)
    transform: translateY(8px)→translateY(0) (200ms, ease-out)

Page Exit (rare, future):
    opacity: 1→0 (150ms, ease-in)
    transform: translateY(0)→translateY(-8px) (150ms, ease-in)
```

### Sidebar

```
Open (mobile overlay):
  Backdrop: opacity 0→1 (300ms)
  Panel: translateX(-100%)→translateX(0) (300ms, ease-spring)
  Content: slight scale 1→0.98 (300ms, ease-out)

Close (mobile overlay):
  Backdrop: opacity 1→0 (200ms)
  Panel: translateX(0)→translateX(-100%) (200ms, ease-in)

Item Hover:
  Background: color transition 150ms ease-out
  Active indicator: width 0→3px, 200ms ease-out
```

### Modal

```
Open:
  Backdrop: opacity 0→1 (200ms, ease-out)
  Modal: scale(0.95)→scale(1), opacity 0→1 (200ms, ease-spring)

Close:
  Backdrop: opacity 1→0 (150ms)
  Modal: scale(1)→scale(0.95), opacity 1→0 (150ms, ease-in)
```

### Toast

```
Enter: translateX(100%)→translateX(0) + opacity 0→1 (300ms, ease-spring)
Exit:  translateX(0)→translateX(100%) + opacity 1→0 (200ms, ease-in)
Hover: slight scale(1.02), extended display time
```

### Loading States

```
Spinner: continuous 360° rotation, 1s linear
  ┌────────┐
  │ ◌      │  ← 3/4 circle with gap, 40px
  └────────┘

Skeleton Loader:
  ┌───────────────────────────────┐
  │ ██████████████████████████████│  ← animated shimmer left→right
  │ ███████████████████           │     1.5s infinite
  │ ██████████████████████████    │
  └───────────────────────────────┘

Button Loading:
  [text disappears] → [spinner 20px appears]  (150ms crossfade)
  Width remains constant (no layout shift)

Progress Bar:
  ┌──────────────────────────────────┐
  │███████████████░░░░░░░░░░░░░░░░░░░│  65%
  └──────────────────────────────────┘
  6px height, radius-full, gradient fill
```

### Micro-interactions

```
Button Press:
  scale(1)→scale(0.97) (100ms, ease-out)
  release: scale(0.97)→scale(1) (150ms, ease-spring)

Toggle Switch:
  thumb translate X (150ms, ease-out)
  track color transition (150ms, ease-out)

Card Hover Lift:
  transform: translateY(0)→translateY(-2px) (150ms, ease-out)
  shadow: md → lg (150ms)

Input Focus:
  border color transition (200ms)
  glow shadow fade in (200ms)

Checkbox/Radio:
  fill + scale bounce (200ms, ease-spring)

Dropdown Chevron:
  rotate 0→180° (150ms, ease-out)

Like/Favorite:
  scale(1)→scale(1.3)→scale(1) (300ms, ease-spring)
  color: transparent→pink fill

Add to Cart:
  badge count increment with scale pop
  number: scale(1)→scale(1.4)→scale(1) (300ms)

Notification Bell:
  icon shake/wobble on new alert
```

---

## 4.3 Interactive States (Every Component)

```
┌─────────────────────────────────────────────────────┐
│ STATE MATRIX FOR ALL INTERACTIVE ELEMENTS            │
│                                                      │
│ Default    Normal resting state                      │
│ Hover      Cursor over, preview of action            │
│ Focus      Keyboard Tab, visible focus ring          │
│ Active     Currently being pressed/clicked           │
│ Disabled   Not available, reduced opacity            │
│ Loading    Processing, spinner shown                 │
│ Error      Validation failed, red indicators         │
│ Success    Action completed, green confirmation      │
│ Selected   Active choice (tabs, radio, dropdown)    │
│ Expanded   Open state (accordion, dropdown)          │
│ Empty      No data to display                        │
└─────────────────────────────────────────────────────┘
```

---

---

# PART 5: ACCESSIBILITY

## 5.1 WCAG 2.1 AA Compliance

```
Requirement                  Implementation
──────────────────────────────────────────────────────────────────
Color Contrast (min 4.5:1)   All text meets ratio against bg
                              Primary text: 13.5:1 (light), 12:1 (dark)
                              Secondary text: 4.7:1 minimum

Focus Indicators             2px solid primary color outline
                              offset: 2px from element edge
                              visible on :focus-visible only

Keyboard Navigation          All interactive elements reachable via Tab
                              Enter/Space to activate
                              Escape to close modals/dropdowns
                              Arrow keys to navigate menus

Skip Link                    "Ruka hadi maudhui" visible on first Tab
                              Links to main content area

Screen Readers               aria-label on icon-only buttons
                              aria-expanded on dropdowns
                              role="dialog" on modals
                              aria-live="polite" on toasts
                              alt text on images
                              lang="sw" / lang="en" on html

Touch Targets                Minimum 44×44px for all interactive elements
                              Adequate spacing between touch targets (8px+)

Reduced Motion               @media (prefers-reduced-motion) disables
                              all non-essential animations

Zoom Support                 Layout works at 200% zoom without
                              horizontal scroll or content loss
```

## 5.2 Language & Localization

```
Direction: LTR (Left-to-Right)
Primary:  Swahili (Kiswahili)
Secondary: English

Font considerations:
  Inter supports both Latin and Swahili diacritics
  Monospace fonts for numeric data are universal

RTL not required for current markets (East Africa)
```

---

---

# PART 6: FIGMA FILE STRUCTURE

## 6.1 Page Organization

```
📄 COVER                    Thumbnail, version, team info
📄 DESIGN PRINCIPLES        Visual mood board, principles
📄 STYLE GUIDE              All local styles shown in usage
📄 FOUNDATIONS
   ├── Colors
   ├── Typography
   ├── Spacing & Grid
   ├── Shadows & Effects
   └── Icons (full library)
📄 COMPONENTS (Library)
   ├── Buttons
   ├── Inputs
   ├── Cards
   ├── Modals & Dialogs
   ├── Tables
   ├── Badges & Chips
   ├── Avatars
   ├── Navigation
   ├── Charts
   ├── Forms
   ├── POS Cart
   ├── Receipts
   ├── Toast
   ├── Empty States
   └── Loading States
📄 PAGE LAYOUTS
   ├── Shell (Sidebar + Header + Footer)
   ├── Dashboard
   ├── POS (Point of Sale)
   ├── Products
   ├── Customers
   ├── Reports
   ├── Expenses
   ├── Suppliers
   ├── Settings
   ├── Profile
   └── Help
📄 AUTH FLOWS
   ├── Login
   ├── Register (Step 1 + Step 2)
   ├── Forgot Password
   └── Update Password
📄 RESPONSIVE
   ├── Mobile Dashboard
   ├── Mobile POS
   ├── Mobile Table → Cards
   └── Mobile Modals
📄 PROTOTYPES
   ├── Full POS Transaction Flow
   ├── Product CRUD Flow
   └── Auth Registration Flow
📄 HANDOFF NOTES
   └── Developer specs, export settings
```

---

## 6.2 Figma Local Styles Setup

```
COLOR STYLES (Grouped by folder):
  brand/primary
  brand/purple
  brand/action
  semantic/success
  semantic/warning
  semantic/danger
  semantic/info
  neutral/light-50 through light-900
  neutral/dark-50 through dark-900
  chart/01 through chart/10
  category/product-*
  category/expense-*

TEXT STYLES (Named with type scale):
  desktop/display
  desktop/h1 through desktop/h4
  desktop/body
  desktop/body-small
  desktop/caption
  desktop/overline
  desktop/micro
  desktop/mono
  mobile/h0 through mobile/mono

EFFECT STYLES:
  shadow/xs through shadow/xl
  shadow/glow-sm through shadow/glow-lg
  glass/light
  glass/dark
  gradient/primary
  gradient/auth
  gradient/success
  gradient/warm
  gradient/card-accent

GRID STYLES:
  grid/12-col-desktop (1200px max, 16px gutter, 16px margin)
  grid/4-col-tablet
  grid/2-col-mobile
```

---

## 6.3 Component Properties (Figma)

```
Each component uses Boolean, Text, and Instance Swap properties:

BUTTON:
  - Variant (variant): Primary | Secondary | Ghost | Danger | Success
  - Size (variant): xs | sm | md | lg | xl
  - Icon Left (boolean): true | false
  - Icon Right (boolean): true | false
  - Full Width (boolean): true | false
  - State (variant): Default | Hover | Focus | Active | Disabled | Loading
  - Label (text): "Button Text"

INPUT:
  - Type (variant): Text | Password | Email | Number | Textarea
  - State (variant): Default | Focus | Filled | Error | Disabled
  - Icon Left (boolean): true | false
  - Icon Right (variant): None | Clear | Visibility | Chevron
  - Size (variant): sm | md | lg

CARD:
  - Variant (variant): Stat | Product | Chart | Settings | Empty
  - Hover State (boolean): true | false
  - Has Action (boolean): true | false

MODAL:
  - Size (variant): sm | md | lg | xl
  - Type (variant): Standard | Confirm | Success
  - Title (text): "Modal Title"

TABLE:
  - Has Checkbox (boolean)
  - Has Sort (boolean)
  - Row Count (number): 5
  - State (variant): Normal | Loading | Empty

TOGGLE:
  - State (variant): On | Off
  - Size (variant): md | sm
  - Label Side (variant): Left | Right | None

TOAST:
  - Type (variant): Success | Warning | Error | Info
  - Message (text): "Notification message"

CHART CARD:
  - Chart Type (variant): Line+Area | HorizontalBar | Donut | Gauge | CategoryBar
  - Period (variant): Today | Week | Month | Year | Custom
  - Has Trend (boolean)
```

---

## 6.4 Prototype Flows

```
FLOW 1: Complete Sale (POS)
  Dashboard → POS Page → Search Product → Add to Cart
  → Adjust Quantity → Open Checkout → Select Payment Method
  → Complete Sale → Success Toast → Receipt Preview → Print/Done

FLOW 2: Add New Product
  Products Page → Click "+ Bidhaa Mpya" → Fill Form
  → Select Category → Enter Prices → Enter Stock
  → Save → Success Toast → Product appears in list

FLOW 3: User Registration
  Auth Page → Click "Fungua Akaunti" → Step 1: Email/Phone/Password
  → Password strength fills → Click "Endelea"
  → Step 2: Business Type/Name/Location → Click "Kamilisha"
  → Auto-redirect to Dashboard with onboarding empty state

FLOW 4: View Reports
  Dashboard → Reports Page → Default "Leo" tab
  → Switch to "Wiki Hii" → Charts animate update
  → Switch to "Muda Maalum" → Date picker appears
  → Select range → Export CSV → Download
```

---

---

# PART 7: EXPORT SPECS FOR DEVELOPMENT

## 7.1 Asset Export Settings

```
Icons (SVG):
  Export as: SVG
  Include: id attribute
  Stroke: expand to outline (optional)
  Minify: yes

Logos (PNG):
  Logo 48px:       1x, 1.5x, 2x
  Logo 180px:      1x, 2x
  Format: PNG, transparent bg

Illustrations (SVG):
  Export as: SVG
  Optimize: SVGO

Profile Placeholder (SVG):
  Export type: SVG component

Background Patterns:
  Export as: SVG, tileable

Charts: Not exported (code-generated SVG)
```

## 7.2 Design Token Export

```
Recommended plugin: "Design Tokens" or "Figma Tokens"
Export format: JSON (for theme.js consumption)

Example token.json output:
{
  "colors": {
    "primary": { "base": "#6366F1", "hover": "#5558E6", ... },
    ...
  },
  "typography": {
    "h1": { "fontFamily": "Inter", "fontSize": 28, "fontWeight": 800, ... },
    ...
  },
  "spacing": { "xs": 4, "s": 8, "m": 12, ... },
  "radius": { "sm": 4, "md": 8, ... },
  "shadow": { "sm": "0 1px 3px rgba(0,0,0,0.08)", ... }
}
```

---

---

# APPENDIX: QUICK REFERENCE CARDS

## A. Color Cheat Sheet

```
Element             Light Mode        Dark Mode
─────────────────────────────────────────────────
Page background     #F8FAFC           #0F172A
Card background     #FFFFFF           #1E293B
Primary text        #0F172A           #F1F5F9
Secondary text      #64748B           #94A3B8
Border              #E2E8F0           #334155
Primary accent      #6366F1           #818CF8
Success             #10B981           #34D399
Warning             #F59E0B           #FBBF24
Danger              #EF4444           #F87171
```

## B. Typography Cheat Sheet

```
Usage               Desktop      Mobile      Weight
──────────────────────────────────────────────────
Page title           28px         22px        800
Section heading      24px         20px        700
Card title           20px         18px        700
Modal title          16px         15px        600
Body text            14px         14px        500
Small text           13px         13px        500
Badge/Label          12px         11px        600
Table header         11px         10px        600
Prices (mono)        13px         13px        500
```

## C. Spacing Cheat Sheet

```
Context              Padding     Gap
────────────────────────────────────────
Page content         24px        24px
Card standard        16px        12px
Card compact         12px        8px
Modal                32px        16px
Button (md)          24/12px     8px
Input                14/12px     8px
Table cell           16/10px     0
Sidebar item         12px        12px
```

---

> **END OF DESIGN SYSTEM DOCUMENT**  
> Built for KasiTRADE POS v1.0 — Designed for East African retail businesses.  
> This document serves as the complete specification for building the Figma UI kit.  
> For questions, refer to the KasiTRADE engineering team.
