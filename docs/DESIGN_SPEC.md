# LongLore 龙知 — Design Specification v1.0

> **"Chinese, through the ages."**
>
> This document is the comprehensive design specification for LongLore, a Chinese language learning
> platform that teaches through engaging Chinese history stories. It was produced through 10 rounds
> of cross-group brainstorming by 40 domain experts (learners, product managers, designers, engineers).
>
> **Domain:** loonglore.com | **Target:** 100K users, 10K DAU | **Revenue:** Freemium

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Information Architecture](#2-information-architecture)
3. [Homepage & Landing Page](#3-homepage--landing-page)
4. [Story Reading Experience](#4-story-reading-experience)
5. [SRS Review & Vocabulary](#5-srs-review--vocabulary)
6. [Learning Dashboard](#6-learning-dashboard)
7. [Onboarding Flow](#7-onboarding-flow)
8. [Monetization & Payment](#8-monetization--payment)
9. [Mobile & PWA](#9-mobile--pwa)
10. [Technical Architecture](#10-technical-architecture)
- [Appendix A: Unresolved Disagreements](#appendix-a-unresolved-disagreements)

---


## 1. Brand Identity


### Brand Name
**LongLore 龙知**
- English: always camelCase "LongLore" — never "Long Lore" or "Longlore"
- Chinese: 龙知 (simplified) / 龍知 (traditional)
- Rationale: 龙 (dragon, symbol of Chinese civilization) + 知 (knowledge, wisdom). English name suggests "long lore" = deep history. Phonetically maps to Mandarin lóng zhī. Culturally safe across all Chinese-speaking markets. Ownable as a single compound word.

### Tagline
- **Primary:** *"Chinese, through the ages."*
- **Alternate 1:** *"Where history teaches Chinese."*
- **Alternate 2:** *"Learn Chinese. Discover China."* (for ad copy/simplicity)

### Color Palette

#### Light Mode (Primary)
| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary Neutral | **Ink** | `#1c1917` | Primary text, logo, headings |
| Brand Accent | **Vermillion** | `#c4392a` | Brand moments, alerts, emphasis |
| Background | **Parchment** | `#f5f0e6` | Page background |
| Interactive | **Jade** | `#2d8a72` | Buttons, links, CTAs, progress |
| Premium | **Gold Leaf** | `#cda434` | Pro badges, achievements, highlights |
| Surface | **Cloud** | `#eae5db` | Cards, secondary backgrounds |
| Secondary Text | — | `#57534e` | Captions, metadata, placeholders |

#### Dark Mode
| Role | Light Hex | Dark Hex |
|---|---|---|
| Background | `#f5f0e6` | `#141210` |
| Card/Surface | `#ffffff` | `#1e1c19` |
| Elevated/Overlay | `#eae5db` | `#2a2722` |
| Primary Text | `#1c1917` | `#e8e2d6` |
| Secondary Text | `#57534e` | `#a8a29e` |
| Jade | `#2d8a72` | `#3fa68a` |
| Vermillion | `#c4392a` | `#d4473a` |
| Gold Leaf | `#cda434` | `#d4b04a` |
| Subtle Border | `#eae5db` | `#2f2c27` |
| Strong Border | `#d6d0c4` | `#3d3a34` |

#### Reading Mode (Sepia)
- Light: bg `#f0ead8`, text `#33302b`, line-height 1.9
- Dark: bg `#1a1814`, text `#d9d0c0`, line-height 1.9

#### Rules
- Jade is the primary interactive color (not Vermillion — avoids error-state confusion)
- Vermillion is never used for destructive actions; use a desaturated red `#b33a3a` for errors
- Gold Leaf is reserved for premium/Pro features only — do not use for generic highlights
- Always use explicitly defined colors for borders; never use white/black at opacity

### Typography System

#### Font Stack
| Role | Font | Weight | Fallback Stack |
|---|---|---|---|
| EN Display (≥24px) | **Cormorant Garamond** | 400, 600, 700 | Georgia, 'Times New Roman', serif |
| CN Display (≥24px) | **Noto Serif SC** (subset) | 400, 700 | 'Songti SC', SimSun, serif |
| UI / EN Body | **DM Sans** | 400, 500, 600 | system-ui, -apple-system, sans-serif |
| CN Body (default) | System CJK | — | 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif |
| CN Body (enhanced) | **LXGW WenKai Screen** | 400 | falls back to system CJK stack |

#### Type Scale (ratio 1.25)
| Level | Size | Line-height (Latin) | Line-height (CJK) |
|---|---|---|---|
| Hero | 48px / 3rem | 1.2 | 1.5 |
| H1 | 32px / 2rem | 1.3 | 1.6 |
| H2 | 26px / 1.625rem | 1.35 | 1.65 |
| H3 | 20px / 1.25rem | 1.4 | 1.7 |
| Body | 16px / 1rem | 1.5 | 1.8 |
| Small | 14px / 0.875rem | 1.5 | 1.7 |
| Caption | 12px / 0.75rem | 1.4 | 1.6 |

#### Pinyin/Ruby
- Minimum ruby text size: 10px (override browser default)
- Ruby position: `ruby-position: over`
- When pinyin is toggled on, parent line-height increases by ~0.6 to accommodate
- Toggle stored in user preferences, synced across devices

#### Loading Strategy
1. **Critical (first paint):** DM Sans latin subset (~12KB) + system CJK = <15KB
2. **Deferred (on scroll/interaction):** Noto Serif SC display subset (~200KB, ~500 chars)
3. **Deferred (on scroll):** Cormorant Garamond (~30KB)
4. **Optional (user opt-in):** LXGW WenKai Screen (~7.8MB, cached via service worker)
- **Total brand font budget:** <50KB critical, <300KB full page, WenKai optional

#### Special Treatments
- Vocabulary words in-context: `font-weight: 600` + `border-bottom: 2px solid rgba(45, 138, 114, 0.4)` (jade at 40%)
- Character stroke order animations: rendered in Ink (#1c1917) on Parchment, 48px minimum
- Classical Chinese quotations: Noto Serif SC, italic-style via `font-style: oblique` (true CJK italic doesn't exist), slightly reduced size (0.9em), Vermillion left-border 3px

### Tone of Voice

**Core voice:** A knowledgeable friend — not a professor, not a cartoon mascot.

| Attribute | Do | Don't |
|---|---|---|
| Warm | "You just learned a word emperors used!" | "Good job! ⭐🎉🎊" |
| Enthusiastic | "This character has survived 3,000 years." | "Here is the next character." |
| Respectful | "This is where it gets interesting..." | "Don't worry, it's easy!" |
| Clear | "曹操 (Cáo Cāo) was a warlord in 200 CE." | "Cao Cao was like a really important guy." |
| Adaptive | Beginner: encouraging, scaffolded | Advanced: nuanced, culturally rich |

**Brand writing examples:**
- Onboarding: *"Welcome to LongLore. You're about to learn Chinese the way it was meant to be learned — through the stories that shaped a civilization."*
- SRS prompt: *"You last saw 将军 three days ago. Ready to remember?"*
- Error state: *"Something went wrong on our end. We're fixing it — even the Great Wall had to be rebuilt a few times."*
- Pro upsell: *"Unlock every story, every era, every character. Your journey through Chinese history has no limits."*

### Visual Motifs & Iconography

| Motif | Implementation | Usage |
|---|---|---|
| **Lattice Patterns** (窗棂) | SVG pattern fills (~2KB each), colorable via CSS custom properties | Section dividers, card borders, background textures, empty states |
| **Ink Wash Gradients** | CSS radial-gradient with soft edges, using Parchment → Cloud | Hero sections, page transitions, background atmosphere |
| **Dynasty Seal Icons** | Simplified seal-script (篆书) character per dynasty, monoline SVG | Content categorization, timeline navigation, era indicators |
| **Dynasty Color Tints** | Subtle background color shifts per historical era | Tang = warm gold, Song = cool jade, Ming = vermillion, Qing = deep ink |

**What we don't use:** brush stroke clichés, bamboo, cherry blossoms, generic "oriental" patterns, red lanterns.

### Logo Concept

**Logomark:** An abstracted 知 character, geometrically constructed.
- The 矢 (arrow) radical is styled to subtly suggest a dragon's profile facing right — evoking forward progress and the 龙 in LongLore
- The 口 (mouth) component is rendered as a small square reminiscent of a Chinese seal stamp (印章)
- Clean geometric lines, no organic brush texture — this is a modern mark
- Must be legible at 16×16px (favicon) — at small sizes it reads as a clean abstract mark; at large sizes the character and dragon reference become apparent

**Lockups:**
1. **Horizontal:** Logomark + "LongLore" (Cormorant Garamond 600) + "龙知" (Noto Serif SC 400, smaller)
2. **Stacked:** Logomark above "LongLore" above "龙知"
3. **Mark only:** Logomark alone (for favicon, app icon, watermark)

**Color applications:**
- Default: Ink (#1c1917) on light, Parchment (#e8e2d6) on dark
- Festive variant: Vermillion (#c4392a) — Lunar New Year, launch events
- Monochrome: pure black/white for print and partner contexts

### Dark Mode Specification

- Detect `prefers-color-scheme: media` query on first visit
- Manual toggle in header (sun/moon icon), stored in user profile
- Synced across devices via existing Cloudflare Worker auth system
- Transition: `transition: background-color 0.2s ease, color 0.15s ease` — no flash
- Images: apply `filter: brightness(0.9)` in dark mode to reduce glare
- SVG illustrations/motifs: recolor via CSS custom properties, not separate assets
- Three modes total: **Light**, **Dark**, **Reading** (each with its own sepia sub-variant)

### Unresolved Disagreements

1. **LXGW WenKai adoption path:** D-group wants it opt-in only forever (performance). C-group wants it as default after first session (beauty). **Compromise noted but not fully resolved:** default for Pro users, opt-in for free users. Revisit after launch metrics.

2. **Lattice pattern density:** C7 wants dense, intricate lattice patterns as a signature element. D7 warns SVG pattern complexity impacts paint performance on low-end Android devices. **Needs testing:** benchmark on Snapdragon 600-series before committing to complex patterns.

3. **Dynasty color tints scope:** B3 wants every piece of content tagged with a dynasty color. C4 argues this creates visual chaos when browsing mixed-era content. **Partial resolution:** tints apply only to single-story reading view and dedicated era pages, not to mixed feeds/lists.

---

*"Like opening an old, beautiful book in a modern library."* — A3, Round 10. That's the brand.

---

## 2. Information Architecture


### 1. Complete Site Map

```
/                                → Home (marketing, public) — redirects to /dashboard when logged in
/stories                         → Stories index (public, filterable)
/stories/level/:level            → Filtered story list by difficulty (beginner/intermediate/advanced)
/stories/era/:era                → Filtered story list by era (deferred to Phase 2)
/stories/:slug                   → Individual story page (public preview, full for Pro)
/review                          → SRS review session (auth required)
/dashboard                       → User dashboard with progress, streaks, due reviews (auth required)
/pricing                         → Pricing & plan comparison
/profile                         → User settings, plan management (auth required)
/about                           → About LongLore
/login                           → Login page (Google OAuth + Magic Link)
/privacy                         → Privacy Policy
/terms                           → Terms of Service
```

**Total: 13 routes** (including 2 deferred filter routes). 9 active at Phase 1.

### 2. Navigation Component Spec

**Desktop Top Nav (56px height)**
```
┌─────────────────────────────────────────────────────────────────┐
│  🐉 LongLore    Stories   Review   Dashboard       [Log In]    │
│                                                  or [Avatar ▾] │
└─────────────────────────────────────────────────────────────────┘
```
- Logo: left-aligned, links to `/` (Home) or `/dashboard` (logged in)
- Center links: `Stories | Review | Dashboard` (logged in) or `Stories | Pricing | About` (logged out)
- Right: "Log In" button (logged out) or avatar dropdown with Profile, Settings, Logout (logged in)
- Free users: small "✦ Upgrade" text link after the center nav items
- Active state: 3px vermillion `#c4392a` underline on current page link
- Background: Parchment `#f5f0e6`, text: Ink `#1c1917`
- Max content width: 1200px, centered
- Behavior: auto-hide on scroll down (in story reader), reveal on scroll up

**Mobile Bottom Tab Bar (56px height, fixed bottom)**
```
┌──────────────────────────────────────┐
│  📖 Stories  🃏 Review  📊 Home  👤 Me │
└──────────────────────────────────────┘
```
- 4 tabs: Stories, Review, Dashboard (labeled "Home"), Profile (labeled "Me")
- Active tab: filled icon + vermillion label; inactive: outline icon + muted label
- Only visible when authenticated; logged-out users see a minimal top nav with hamburger
- Persists across page navigations via Astro `transition:persist`

**Mobile Top Bar (48px, when authenticated — minimal)**
```
┌──────────────────────────────────────┐
│  🐉 LongLore               [🔍 ···] │
└──────────────────────────────────────┘
```
- Logo only + optional overflow menu (Pricing, About, etc.)

### 3. Content Taxonomy System

| Axis | Values | Role | Implementation |
|------|--------|------|---------------|
| **Difficulty** | `beginner`, `intermediate`, `advanced` | Primary browse/filter axis | Frontmatter field, tab filter on `/stories` |
| **Era** | `ancient`, `qin-han`, `sui-tang`, `song-yuan`, `ming-qing`, `modern` | Secondary filter (Phase 2) | Frontmatter field, filterable |
| **Theme** | `politics`, `trade`, `culture`, `war`, `daily-life` | Tag-style, multiple per story | Frontmatter array, displayed on story cards |
| **HSK Level** | `1`–`6+` | Metadata display (badge on card) | Frontmatter field, not a browse axis |
| **Word Count** | Auto-calculated | Displayed on card for time estimation | Build-time calculation from Chinese segments |

All taxonomy data lives in each story's Markdown frontmatter and is compiled into a static `/stories/index.json` manifest at build time. Client-side filtering reads this manifest (Svelte island).

### 4. URL Structure Rules

| Pattern | Example | Notes |
|---------|---------|-------|
| Story page | `/stories/the-grand-canal` | Flat slug, permanent, no taxonomy nesting |
| Stories index | `/stories` | All stories, default sorted by newest |
| Difficulty filter | `/stories/level/beginner` | SEO-indexable filtered listing |
| Era filter | `/stories/era/sui-tang` | Phase 2, SEO-indexable |
| Auth pages | `/login`, `/profile`, `/dashboard`, `/review` | Top-level, no nesting |
| Static pages | `/about`, `/pricing`, `/privacy`, `/terms` | Top-level |

**Rules:**
- Story slugs are **kebab-case English**, derived from the title, and **never change** once published
- No taxonomy in story URLs — reorganizing difficulty doesn't break links
- Filter routes use a prefix (`/level/`, `/era/`) to disambiguate from story slugs
- All authenticated routes return 302 → `/login?redirect=...` if no valid JWT

### 5. Story Discovery UX

**Phase 1 (4–15 stories):**
- Card grid: 2 columns desktop (max-width 1200px), 1 column mobile
- Card component: 320×200px cover image, 16px padding, title (20px/600), difficulty pill (color-coded), era subtitle (14px), reading time estimate, "New" badge (<14 days)
- Difficulty pill colors: Beginner → Jade `#2d8a72`, Intermediate → Gold `#cda434`, Advanced → Vermillion `#c4392a`
- Sort: newest first (default)

**Phase 1.5 (15–50 stories):**
- Add difficulty tab bar above grid: `All | Beginner | Intermediate | Advanced`
- Tabs are links to `/stories` and `/stories/level/:level`
- Add "Recommended for you" section on Dashboard (based on difficulty + reading history)

**Phase 2 (50+ stories):**
- Full faceted filter sidebar (desktop) / filter sheet (mobile)
- Timeline view toggle (horizontal scrollable dynasty timeline)
- Client-side search with fuzzy matching (Fuse.js or similar)

### 6. Primary User Journey

**New User (first visit):**
```
Landing page (/) → Scroll "How It Works" → Click "Browse Stories" →
Stories index (/stories) → Click a story card →
Story page (/stories/the-grand-canal) → Read free preview →
CTA: "Sign up free to save your progress" →
Login (/login) → Google OAuth → Redirect to /dashboard →
Dashboard: "Continue reading: The Grand Canal"
```

**Returning Free User:**
```
Open site → Auto-redirect to /dashboard →
See: "5 words due for review" + "Continue: The Grand Canal" →
Option A: Tap "Review now" → /review (SRS session, max 20 words/day) →
  Review complete → Dashboard updated
Option B: Tap "Continue reading" → /stories/the-grand-canal →
  Read next section → In-context mini-review (3–5 cards) →
  Continue reading → Story complete → Full story review → Dashboard
```

**Returning Pro User:**
```
Open site → /dashboard →
See: "23 words due" + "Continue: Mandate of Heaven" + streak counter →
Tap "Review now" → /review (unlimited SRS) → Review complete →
Tap "Continue reading" → Resume story → Section → Mini-review →
... → Story complete → Recommended next story → Dashboard
```

### 7. Navigation States

| Element | Logged Out | Free (auth) | Pro (auth) |
|---------|-----------|-------------|------------|
| Desktop nav links | Stories · Pricing · About | Stories · Review · Dashboard | Stories · Review · Dashboard |
| Desktop right | "Log In" button (outlined) | Avatar dropdown | Avatar + ✦ gold badge dropdown |
| Mobile top bar | Logo + hamburger (full nav) | Logo + overflow | Logo + overflow |
| Mobile bottom bar | *(none)* | Stories · Review · Home · Me | Stories · Review · Home · Me |
| Upgrade CTA | "Start free" on Home | In-context (review limit, story paywall) | *(none)* |
| Pricing link | Top nav (center) | Footer + Dashboard card | Footer only |
| Dashboard redirect | N/A — `/` shows Home | `/` → `/dashboard` | `/` → `/dashboard` |

### 8. Wayfinding System

- **Active nav indicator:** 3px vermillion underline on desktop; filled icon + vermillion label on mobile tab
- **Back navigation (story pages):** "← All Stories" link above story title, links to `/stories`
- **Reading progress:** 3px vermillion bar, `position: fixed; top: 0`, width = scroll percentage
- **Section indicator (desktop):** Sticky sidebar listing all `<h2>` section titles; current section highlighted with vermillion left border (3px); implemented via `IntersectionObserver` in a Svelte island
- **Section indicator (mobile):** Current section title shown in a sticky sub-header below the top bar (collapses to just the title on small screens)
- **Review progress:** "Card 7 of 23" counter in the review interface header
- **Story completion:** Checkmark overlay on story cards in the grid for completed stories
- **Breadcrumbs:** Not implemented (site is too flat). Re-evaluate when depth > 2.

### 9. Footer Spec

```
┌─────────────────────────────────────────────────────────────────────┐
│  LongLore 龙知                          Legal                       │
│  About                                  Privacy Policy              │
│  Contact                                Terms of Service            │
│  Pricing                                                            │
│                                                                     │
│─────────────────────────────────────────────────────────────────────│
│  © 2025 LongLore 龙知 · Chinese, through the ages.                  │
└─────────────────────────────────────────────────────────────────────┘
```

- **Background:** Ink `#1c1917`
- **Text:** Parchment `#f5f0e6`, links lighten on hover
- **Layout:** 2 columns at ≥768px, stacked at <768px
- **Padding:** 48px top, 24px bottom, 24px horizontal
- **Max width:** 1200px, centered
- **Not included yet (deferred):** Social links (no accounts yet), "For Educators," locale selector, HSK level guide
- **Footer is rendered on all public pages.** Authenticated pages (Dashboard, Review, Profile) show a minimal footer (copyright line only) to maximize content space.

### 10. Unresolved Disagreements

1. **`/` redirect behavior:** The majority favors redirecting authenticated users from `/` to `/dashboard`. Minority (D1, C7) argue for a single route with conditional rendering to avoid the redirect flash. **Decision needed** after testing perceived performance of the 302 redirect with JWT cookie check.

2. **Filter URLs vs. query params:** Group D prefers `/stories/level/beginner` for clean routing; Group B prefers `/stories?difficulty=beginner` for flexibility. **Leaning toward** sub-routes for SEO but final call depends on whether Astro static generation can pre-render filter pages efficiently at build time.

3. **Mobile bottom bar persistence:** D6 flagged that persisting the bottom bar across Astro page navigations requires `transition:persist` with View Transitions API. If View Transitions prove unreliable cross-browser, fallback is a traditional hamburger menu. **Needs prototyping.**

4. **In-context mini-review timing:** B8 wants it after every section; A3 says it breaks reading flow. **Compromise proposed:** show mini-review only after sections with 5+ new vocabulary words, and make it dismissible ("Review later").

5. **Search placeholder:** C3 wants a disabled search icon in nav ("Coming soon"); C1 says don't show features that don't work — it erodes trust. **Unresolved.** May A/B test.

---

## 3. Homepage & Landing Page

### 3.1. Hero Section Spec

| Property | Value |
|---|---|
| **H1** | "Learn Chinese Through the Ages" |
| **Sub-headline** | "Master Mandarin through real history stories — from the Grand Canal to the Mandate of Heaven." |
| **Primary CTA** | "Start Learning — Free" |
| **CTA Style** | `bg: #c4392a, color: #fff, h: 48px, px: 24px, radius: 12px, font: 700 16px 'DM Sans', shadow: 0 2px 8px rgba(196,57,42,0.3)` |
| **Trust line** | "No credit card required · Free forever for 50 words" (14px, 50% opacity) |
| **Visual** | Inline SVG 知 character, stroke-dashoffset animation (1.2s, 0.3s delay), 280×280px desktop / 160×160px mobile, Ink #1c1917 on Parchment #f5f0e6, Vermillion underline on complete. Pinyin "zhī" + gloss "to know" below in 14px. |
| **Layout** | Desktop: 55/45 split (text left, character right), 100svh. Mobile: stacked, text → CTA → character. |
| **Background** | Parchment #f5f0e6, full viewport |
| **JS** | Zero. Pure CSS animation. |

### 3.2. Page Sections (ordered)

### Section 1 — Hero
*(See above)*

### Section 2 — Value Proposition ("Why LongLore")
- **3 cards**, stacked on mobile, row on desktop (max-width 320px each)
- Card style: Parchment bg, 1px border Ink at 8%, 24px padding, 16px radius
- Cards:
  1. **Stories, Not Textbooks** — "Learn vocabulary through real history, not artificial dialogues." (Custom SVG: open scroll icon)
  2. **You'll Actually Remember** — "Smart review ensures every word sticks, using proven spaced repetition." (Custom SVG: brain/refresh icon)
  3. **Sentence-Level Clarity** — "Every Chinese sentence comes with pinyin, glosses, and English side-by-side." (Custom SVG: bilingual text icon)
- All icons: inline SVG line-art, Ink #1c1917, 40×40px
- Section heading: none (cards are self-explanatory)
- **JS: Zero.** Static Astro HTML.

### Section 3 — Interactive Demo ("See How It Works")
- **H2**: "Try it yourself"
- Render 3 sentences from the Grand Canal story using the real lesson component
- Tap/click a sentence → expands to show Chinese + segmented pinyin/gloss
- After 3 sentences: content fades to blur with overlay CTA: **"Unlock the full story →"** (secondary CTA style)
- **Svelte island**, `client:visible` with `rootMargin: "200px"`, ~4KB gzipped
- Skeleton placeholder: 400px height reserved, Parchment bg, subtle shimmer
- Steps shown above the demo as 3 labels: **Read → Discover → Remember**

### Section 4 — Stats Strip
- **Background**: Ink #1c1917, full-width
- **3 stats** centered in row: `12 Stories` | `800+ Words` | `4 Dynasties`
- Numbers: Cormorant Garamond 600, 48px, Parchment #f5f0e6
- Labels: DM Sans 400, 14px, Parchment at 70%
- Padding: 80px vertical
- **JS: Zero.** Hardcoded at build time.

### Section 5 — Pricing Preview Strip
- Light-touch: single row, Parchment bg
- "✓ Free forever · 50 words · 20 reviews/day" in DM Sans 400, 16px, Ink
- "See all plans →" link in Jade #2d8a72
- **JS: Zero.**

### Section 6 — Footer CTA
- Centered block, 120px vertical padding
- **H2**: "Start your journey through Chinese history"
- **Primary CTA**: "Get Started Free" (same Vermillion style as hero)
- Sub-text: "Join free. No credit card." 14px, 50% opacity

### Section 7 — Footer
- Links: Stories, Review, Pricing, About, Login
- © LongLore 龙知
- Minimal, Ink bg, Parchment text

### Deferred Sections (placeholder comments in HTML)
- `<!-- testimonials-slot -->` (after Stats Strip)
- `<!-- as-seen-in-slot -->` (after testimonials)
- `<!-- video-walkthrough-slot -->` (after Demo)

### 3.3. Mobile Layout (390px screen)

```
┌──────────────────────────────┐
│  LongLore 龙知 (logo, 44px) │ ← top bar
├──────────────────────────────┤
│                              │
│  Learn Chinese               │
│  Through the Ages            │ ← H1, 32px/38px, centered
│                              │
│  Master Mandarin through     │
│  real history stories...     │ ← Sub, 16px/24px, centered
│                              │
│  ┌──────────────────────┐    │
│  │ Start Learning — Free│    │ ← CTA, full-width - 32px
│  └──────────────────────┘    │
│  No credit card · Free...    │ ← Trust line, 13px
│                              │
│         ┌──────┐             │
│         │  知  │             │ ← 160×160 animated SVG
│         └──────┘             │
│         zhī · to know        │
│                              │
├──── FOLD (844px) ────────────┤
│  [Value Prop Cards stacked]  │
│  [Interactive Demo]          │
│  [Stats Strip]               │
│  [Pricing Strip]             │
│  [Footer CTA]                │
│  [Footer]                    │
│                              │
│  ┌──────────────────────┐    │
│  │ 🏠  📖  🔄  👤     │    │ ← Bottom tab bar, 56px
│  └──────────────────────┘    │
└──────────────────────────────┘
```

- All horizontal padding: 16px
- Card gaps: 16px
- Section vertical spacing: 64px
- Bottom tab bar shows on all mobile views (Home, Stories, Review, Profile)
- Bottom tab bar visible only when logged in; for landing page visitors, no tab bar — just the footer

### 3.4. CTA Strategy

| Location | Copy | Style | Links to | `data-cta` |
|---|---|---|---|---|
| Hero | "Start Learning — Free" | Primary (Vermillion bg) | `/login` | `hero` |
| After Demo | "Unlock the full story →" | Secondary (Vermillion outline) | `/login` | `demo-gate` |
| After Demo | "Try Your First Story" | Secondary (Vermillion outline) | `/stories` | `how-it-works` |
| Pricing Strip | "See all plans →" | Text link (Jade) | `/pricing` | `pricing-strip` |
| Footer CTA | "Get Started Free" | Primary (Vermillion bg) | `/login` | `footer` |

### 3.5. SEO Spec

```html
<title>LongLore 龙知 — Learn Chinese Through History Stories</title>
<meta name="description" content="Master Mandarin Chinese through real history stories. Read about the Grand Canal, the Mandate of Heaven, and more — with pinyin, glosses, and spaced repetition review. Free to start.">
<link rel="canonical" href="https://loonglore.com/">

<!-- Open Graph -->
<meta property="og:title" content="LongLore 龙知 — Learn Chinese Through History Stories">
<meta property="og:description" content="Master Mandarin through real history stories with pinyin, glosses, and spaced repetition.">
<meta property="og:image" content="https://loonglore.com/og/home.png">
<meta property="og:type" content="website">
<meta property="og:url" content="https://loonglore.com/">

<!-- Schema.org -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "LongLore 龙知",
  "url": "https://loonglore.com/",
  "description": "Learn Chinese through history stories"
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Learn Chinese Through History",
  "provider": {
    "@type": "Organization",
    "name": "LongLore 龙知",
    "url": "https://loonglore.com"
  },
  "educationalLevel": ["Beginner", "Intermediate", "Advanced"],
  "teaches": "Chinese (Mandarin)",
  "inLanguage": ["en", "zh"],
  "isAccessibleForFree": true
}
</script>
```

### 3.6. Performance Constraints

| Metric | Target |
|---|---|
| **LCP** | < 1.0s on 4G |
| **CLS** | 0 |
| **Total page weight** | < 100KB |
| **JS (gzipped)** | < 8KB (one Svelte island: interactive demo) |
| **HTML + CSS** | ~23KB |
| **Fonts** | ~25KB (DM Sans Latin subset 400+700, Cormorant Garamond 600 subset) |
| **Images** | 0 raster images above fold. OG image generated at build, not loaded on page. |
| **Font loading** | `font-display: swap` + `size-adjust` fallback metrics |
| **Hero render** | Zero JS, zero network images. Inline SVG + CSS animation only. |
| **Demo island** | `client:visible`, `rootMargin: 200px`, skeleton placeholder at exact height |
| **Analytics** | `navigator.sendBeacon` to CF Workers endpoint, <1KB script, deferred |

### 3.7. Ship vs Defer

### 🚀 SHIP (v1)
- Hero (H1 + animated 知 SVG + CTA + trust line)
- Value Proposition (3 cards, static)
- Interactive Demo (3-sentence Grand Canal excerpt, Svelte island, fade-gate CTA)
- Stats Strip (3 hardcoded stats)
- Pricing Preview Strip (free tier highlight + link)
- Footer CTA
- Footer
- Full SEO/meta/schema markup
- OG image (static build-time PNG)
- CTA analytics via `sendBeacon`
- Mobile-responsive layout with all specs above

### 🔜 DEFER (v2+)
- Testimonials section (after 50+ users)
- "As seen in" press strip
- Video walkthrough
- 4th value-prop card ("From HSK 1 to Classical Chinese")
- Cycling character animation in hero (知 → 龙 → 道)
- A/B test infrastructure (Cloudflare Workers variant assignment)
- Haptic feedback on mobile demo
- Full pricing cards on homepage (use strip + link to /pricing for now)
- LXGW WenKai font loading on homepage (defer to story pages)
- User word counter widget
---

## 4. Story Reading Experience

### 4.1. Bilingual Layout Spec

**Structure:** Stacked layout — Chinese paragraph above, English translation below.

| Property | Desktop (≥1024px) | Tablet (768–1023px) | Mobile (<768px) |
|---|---|---|---|
| Content max-width | 600px (36rem) | 600px | 100% − 32px (16px padding) |
| Content centering | Auto margins | Auto margins | Padding |
| ZH→EN gap | 8px | 8px | 8px |
| Paragraph-pair gap | See typography spec (level-dependent) | Same | Same |
| EN translation indent | `margin-left: 2px` | Same | Same |
| Layout container | CSS Grid: `200px sidebar + content` | Single column | Single column |

**Translation visibility by reading mode:**
- **Guided:** English always visible, full opacity (0.55 of Ink)
- **Assisted:** English visible, full opacity (0.55 of Ink)
- **Immersive:** English collapsed — single truncated line at 12px, 0.35 opacity, expands on tap (max-height transition, 300ms ease)
- **Review:** English always visible

**Translation toggle animation:** `max-height` transition, 300ms ease-in-out. No layout shift on surrounding content.

---

### 4.2. Vocabulary Token Component Spec

**Element:** `<button>` wrapping each YAML segment `<span>`, with event delegation on paragraph container.

| State | Visual Treatment | Transition |
|---|---|---|
| **Default (new/unknown)** | `border-bottom: 1.5px dotted rgba(45, 138, 114, 0.3)` | — |
| **Hover / Focus** | `background: rgba(45, 138, 114, 0.1); border-bottom-color: rgba(45, 138, 114, 0.6); border-radius: 2px` | `150ms ease` |
| **Active (sheet open)** | `background: rgba(45, 138, 114, 0.15); border-radius: 2px` | `100ms ease` |
| **Saved (in SRS)** | `border-bottom: 1.5px solid #2d8a72` (solid jade) | `200ms ease` |
| **Mastered** | No decoration, `color: inherit`, cursor remains pointer | `200ms ease` |

**Adaptive decoration:** Only first occurrence of each unsaved word shows the dotted underline. Subsequent occurrences render plain. Words already in user's SRS show saved/mastered state on all occurrences.

**Bottom sheet (mobile):** Slides up from bottom, 320px max-height, 300ms cubic-bezier(0.32, 0.72, 0, 1). Contains: Hanzi (48px), pinyin (16px), English gloss (14px), "添加到词库" button (40px height, Jade bg, white text, border-radius: 8px), audio play icon (speaker, 24px).

**Popover (desktop, ≥1024px):** Appears near the word, 280px wide, auto-positioned above/below. Same content as bottom sheet. `box-shadow: 0 4px 16px rgba(28,25,23,0.1)`. Parchment bg. Entrance: opacity + translateY(4px→0), 200ms ease.

**Particle animation on save:** 3–5 small Jade circles (4px) burst from the word and arc toward the nav "词库" icon, 600ms duration, CSS keyframes with randomized `translate` paths.

---

### 4.3. Pinyin Display System

**Implementation:** Native `<ruby>` / `<rt>` elements with `<rp>` fallbacks.

| Mode | Pinyin Behavior | Line-Height |
|---|---|---|
| **Pinyin ON** | All ruby annotations visible | `--cn-lh: 2.4` |
| **Pinyin OFF** | Ruby hidden: `rt { visibility: hidden; font-size: 0; line-height: 0 }` — collapses space | `--cn-lh: 1.8` |
| **Pinyin on tap** | Ruby hidden globally; individual segment reveals on tap (shows until next tap elsewhere) | `--cn-lh: 1.8` (reserves no space; single revealed pinyin uses absolute positioning) |

**Pinyin text style:** 11px, Inter / system-ui, Ink at 0.45 opacity (`rgba(28,25,23,0.45)`).

**Toggle transition:** `transition: line-height 250ms ease, font-size 250ms ease` on `rt` elements. Container uses `overflow: hidden` during transition to prevent jank.

**Defaults by mode:**
- Guided → Pinyin ON
- Assisted → Pinyin OFF (toggle available)
- Immersive → Pinyin OFF (tap-only in bottom sheet)
- Review → Pinyin ON

**Toggle location:** Sticky reading toolbar — a labeled switch "拼音" with on/off state.

---

### 4.4. Reading Mode System

| Mode | Pinyin | Translation | Token Decoration | Mini-Review | Default For |
|---|---|---|---|---|---|
| **Guided** | ON (ruby) | Visible | All unknown words | Auto after sections | Beginner stories |
| **Assisted** | OFF (toggle) | Visible | New/unsaved only | Opt-in prompt | Intermediate stories |
| **Immersive** | OFF (tap-only) | Collapsed (peek) | None | OFF | Advanced stories |
| **Review** | ON (ruby) | Visible | All words | After every section | Manually selected |

**UI:** Two independent toggles ("拼音" and "翻译") in a sticky toolbar. Mode name is implicit based on combination. Toolbar position: bottom of viewport on mobile (48px bar, above safe area), right sidebar on desktop (below section nav).

**Persistence:** `localStorage` key `longlore:reading-prefs`, JSON object `{ pinyin: bool, translation: 'visible' | 'collapsed' | 'hidden', reviewMode: bool }`. Keyed per difficulty level: `longlore:reading-prefs:beginner`, etc.

**First visit:** Mode auto-assigned based on story `difficulty` frontmatter. User overrides persist for subsequent visits at that level.

---

### 4.5. Story Header Layout

```
┌─────────────────────────────────────────────────────┐
│ ← All Stories                          (14px, Jade) │ ← back link, mb: 24px
│                                                     │
│ 唐朝 TANG DYNASTY                (12px, 0.5 opacity,│ ← era tag, caps, ls: 0.05em
│                                     mb: 8px)        │
│ 玄武门之变                       (32px, 700 weight)  │ ← ZH title, mb: 4px
│ The Xuanwu Gate Incident         (18px, 0.6 opacity) │ ← EN title, mb: 16px
│                                                     │
│ [Beginner]  ·  8 min read  ·  1,240 字              │ ← meta row, 13px, gap: 16px
│                                                     │
│ ─────────────────────── (divider, 0.08 opacity) ──── │ ← margin: 24px 0
└─────────────────────────────────────────────────────┘
```

**Difficulty badge:** Pill, `padding: 4px 12px`, `border-radius: 12px`, `font-size: 12px`, `font-weight: 600`.
- Beginner: Jade bg (#2d8a72), white text
- Intermediate: Gold bg (#cda434), Ink text
- Advanced: Vermillion bg (#c4392a), white text

**Reading time formula:** `Math.ceil(charCount / cpm)` where cpm = { beginner: 80, intermediate: 150, advanced: 250 }.

**Mobile adaptation (< 768px):** Same hierarchy, no divider, title sizes reduce to 28px ZH / 16px EN. Era tag + meta row merge into one line if space allows.

---

### 4.6. Section & Navigation Spec

**Section dividers:** 48px vertical margin, centered decorative `◆` at 10px, Ink at 0.15 opacity.

**Desktop sidebar (≥1024px):**
- Position: `sticky`, `top: 56px` (below 3px progress bar + 53px gap)
- Width: 200px, left of content in CSS Grid
- Items: section titles at 13px, Ink at 0.5 opacity, `padding: 8px 0`
- Active state: full opacity + `border-left: 3px solid #2d8a72`, `padding-left: 12px`
- Active detection: IntersectionObserver, `rootMargin: '-20% 0px -60% 0px'`
- Click behavior: `scrollIntoView({ behavior: 'smooth', block: 'start' })` + 80px top offset via `scroll-margin-top: 80px` on `<h2>`

**Mobile section drawer (<1024px):**
- Trigger bar: fixed bottom, 48px height, Parchment bg, top shadow `0 -1px 8px rgba(28,25,23,0.06)`
- Shows current section name (14px, truncated) + chevron icon
- Expanded: slides up to 60vh, section list with 48px row height per item, Jade dot (6px) for active
- Transition: `transform: translateY(0→100%)`, 300ms `cubic-bezier(0.32, 0.72, 0, 1)`

**Reading progress bar:** `position: fixed; top: 0; left: 0; height: 3px; background: #c4392a; z-index: 50; transition: width 50ms linear`. Updated via `scroll` event + `requestAnimationFrame` throttle.

**Deep linking:** `history.replaceState` with `#section-id` on active section change. Section headings have `id` attributes.

---

### 4.7. In-Context Review Spec

**Trigger rules:**
1. User must have saved ≥2 words in the current section
2. Section must have ≥3 paragraphs (skip after short sections)
3. Mode must be Guided (auto-trigger) or Review (auto-trigger). For Assisted mode, show opt-in prompt: "Review 3 words? Yes / Skip" (14px, centered, Jade/Ink links)
4. Immersive mode: never show

**Card count:** Max 3 cards per section break. Cards drawn from words tapped/saved in that section.

**Card format:** Front: pinyin + English gloss (user mentally recalls character). Tap to flip: reveals Hanzi (48px, centered). Self-grade: "Knew it ✓" (Jade text) / "Study more" (Vermillion text).

**Card UI:** Inline with story flow (not modal), 280px wide, centered, Parchment bg, `border: 1px solid rgba(28,25,23,0.08)`, `border-radius: 12px`, `padding: 24px`.

**Animations:**
- Cards enter: stagger from bottom, 100ms delay between cards, each 250ms ease-out (opacity 0→1, translateY 12px→0)
- Correct answer: green flash on card border (`border-color: #2d8a72` for 150ms) + subtle scale pulse (1.02, 150ms)
- Incorrect: horizontal shake (translateX ±4px, 300ms) + show correct answer below in Vermillion
- Card flip: `transform: rotateY(180deg)`, 300ms, with backface-visibility hidden

**Dismissal:** "Skip review →" link above card stack, 13px, Ink at 0.4 opacity. After all cards: "Continue reading ↓" button, 14px, Jade text.

**Analytics:** Track: cards_shown, cards_correct, cards_skipped, time_per_card per section.

---

### 4.8. Audio Integration Spec

**Audio files:** Per-sentence MP3 (fallback) / Opus (modern browsers), stored on CDN. Average: 3-5s, 20-40KB each. Lazy-loaded (`preload="none"`).

**Per-paragraph play:** Speaker icon (🔊) at start of each Chinese paragraph, 16px, Ink at 0.3 opacity → Jade on hover/tap. Tap plays all sentences in that paragraph sequentially.

**Sentence highlighting during playback:** Active sentence gets `background: rgba(45, 138, 114, 0.06)`, transition 200ms. Cleared when sentence audio ends.

**Global narration:** Play-all button in the sticky reading toolbar. When active:
- Audio player bar appears fixed at bottom: 56px height, Parchment bg, `box-shadow: 0 -2px 12px rgba(28,25,23,0.06)`
- Contents: play/pause (40px circle, Jade bg, white triangle/bars icon), sentence progress bar (Vermillion, 2px, tracks within current sentence), speed selector (0.75× | 1× | 1.25× | 1.5×), close ✕
- Auto-scroll: `scrollIntoView({ behavior: 'smooth', block: 'center' })` when active sentence changes. Debounced: only triggers if next sentence is >200px from viewport center

**Word-level audio:** Available in bottom sheet/popover — tap the Hanzi to play pronunciation. Separate audio file per word, ~1s each.

**Interaction with tap:** If audio is playing and user taps a word, pause playback, open bottom sheet. When sheet closes, resume playback.

**Keyboard shortcut:** `Space` to play/pause (when audio bar is active, not when typing in search).

---

### 4.9. Story Completion Flow

**Trigger:** User scrolls past the last paragraph. The completion section is inline (below last paragraph), not an overlay.

**End-of-story marker:** Three dots ` · · · ` centered, 10px, Ink at 0.2 opacity, 48px vertical margin above and below.

**Completion card:**
- Max-width: 480px, centered, Parchment bg, `box-shadow: 0 2px 24px rgba(28,25,23,0.08)`, `border-radius: 16px`, `padding: 32px`
- Entrance: opacity 0→1 + translateY(16px→0), 300ms ease-out, triggered by IntersectionObserver when card enters viewport
- Header: Jade checkmark icon (32px) + "Story Complete!" (24px, 700 weight, Ink) + story title (16px, 0.5 opacity), centered
- Stats row: flex, centered, gap 24px. Each stat: number (24px, Jade, 600 weight) + label (12px, Ink at 0.4 opacity)
  - Words saved | Reading time | Characters read
- Celebration: ink-wash circle expands from center of checkmark, Jade at 0.05 opacity, 0→300px, 600ms ease-out, then fades
- CTA primary: "Review saved words" — 44px height, Jade bg, white text, 16px, `border-radius: 8px`, full-width on mobile
- CTA secondary: "Read next story →" — text link, 14px, Jade, `margin-top: 12px`
- If saved words < 5: swap CTA priority (next story becomes primary)
- Rating: "How was this story?" + three emoji buttons (😐 🙂 🤩), 32px each, `gap: 16px`, tap to select (selected gets `transform: scale(1.2)` + Jade underline)

**Next story suggestions:** Below completion card, 24px top margin.
- Desktop: 3-column grid, each card 200px × 120px, Parchment bg, border `1px solid rgba(28,25,23,0.06)`, `border-radius: 12px`
- Mobile: horizontal scroll, `scroll-snap-type: x mandatory`, `scroll-padding: 16px`, `gap: 12px`
- Card contents: difficulty badge (top-left), title ZH (16px, 600 weight), title EN (13px, 0.5 opacity), era tag (11px)
- Suggestion logic: same era → same difficulty → next difficulty up

**Persistence:** Story marked as "read" in IDB store `longlore:completed-stories` with timestamp. Completion count visible on story index page.

---

### 4.10. Typography Spec for Learning

**Font stack:**
- Chinese: `'Noto Serif SC', 'Songti SC', 'STSongti', 'SimSun', serif`
- Latin/Pinyin: `'Inter', system-ui, -apple-system, sans-serif`
- Font loading: Google Fonts CDN with automatic `unicode-range` subsetting. `font-display: swap`. Preload 400 and 700 weights.

**Level-dependent sizing:**

| Property | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Chinese body font-size | 26px | 24px | 22px |
| Chinese body line-height | 1.8 (no pinyin) / 2.4 (pinyin) | 1.8 / 2.4 | 1.75 / 2.3 |
| Chinese letter-spacing | 0.04em | 0.02em | 0 |
| Chinese font-weight | 400 | 400 | 400 |
| English body font-size | 16px | 15px | 14px |
| English body line-height | 1.6 | 1.6 | 1.5 |
| English opacity | 0.55 | 0.55 | 0.55 |
| Pinyin (ruby rt) font-size | 11px | 11px | 10px |
| Pinyin opacity | 0.45 | 0.45 | 0.40 |
| Paragraph-pair gap | 32px | 28px | 24px |
| Section heading ZH | 30px / 700 | 28px / 700 | 26px / 700 |
| Section heading EN | 17px / 400 | 16px / 400 | 15px / 400 |

**CSS custom properties (set on `.story` container):**

```css
.story--beginner {
  --cn-body: 26px; --cn-lh: 1.8; --cn-lh-pinyin: 2.4; --cn-ls: 0.04em;
  --en-body: 16px; --en-lh: 1.6; --en-opacity: 0.55;
  --pin-size: 11px; --pin-opacity: 0.45;
  --pair-gap: 32px;
  --heading-cn: 30px; --heading-en: 17px;
}
.story--intermediate {
  --cn-body: 24px; --cn-lh: 1.8; --cn-lh-pinyin: 2.4; --cn-ls: 0.02em;
  --en-body: 15px; --en-lh: 1.6; --en-opacity: 0.55;
  --pin-size: 11px; --pin-opacity: 0.45;
  --pair-gap: 28px;
  --heading-cn: 28px; --heading-en: 16px;
}
.story--advanced {
  --cn-body: 22px; --cn-lh: 1.75; --cn-lh-pinyin: 2.3; --cn-ls: 0;
  --en-body: 14px; --en-lh: 1.5; --en-opacity: 0.55;
  --pin-size: 10px; --pin-opacity: 0.40;
  --pair-gap: 24px;
  --heading-cn: 26px; --heading-en: 15px;
}
```

**Content width:** `clamp(320px, 90vw, 600px)` — fluid responsive, no breakpoint jumps for text column.

---

### 4.11. Unresolved Disagreements

1. **Dotted underline vs. background tint for default tokens (C1 vs. C5):** C1's dotted underline won for desktop but C5's concern about interference with character strokes at small sizes on mobile is valid. *Resolution pathway:* A/B test both on mobile devices; use underline for screens ≥768px and background tint (`rgba(45,138,114,0.04)`) for <768px if underline tests poorly.

2. **Mid-story review vs. end-of-story review (A4/B2 vs. A7):** Consensus is mid-story at section breaks with the trigger rules above, but A7's concern about flow disruption is real. *Resolution pathway:* Track skip rates for the first 30 days. If >50% of users in a difficulty tier skip, change default to opt-in prompt for that tier.

3. **Reserved line-height vs. dynamic reflow on pinyin toggle (D1 vs. D8):** D8's approach (collapse ruby space when hidden) won, but the reflow transition must be tested on low-end devices. *Resolution pathway:* If scroll jank is measured at <30fps on Samsung A13 during pinyin toggle, fall back to reserved line-height.

4. **Hero illustration in story header (C9):** Liked by designers, but adds content production burden and page weight. *Resolution pathway:* Defer to v2. Use optional `illustration` field in story frontmatter; render if present, skip if not. Do not block launch.

5. **Per-level font sizing progression (C4):** Broadly accepted but the advanced size (22px) may be too small for users with visual impairments. *Resolution pathway:* Add an accessibility override in reading settings: "Larger text" toggle that adds +2px to all CN sizes. Store in localStorage.
---

## 5. SRS Review & Vocabulary


### 1. Review Card Component Spec

| Property | Front | Back |
|---|---|---|
| **Container** | 360px max-width, 420px min-height, 8px radius, 1px `#1c1917` border, `#f5f0e6` bg, 24px padding | Same container, revealed via Y-axis 3D flip |
| **Primary text** | Hanzi — 36px LXGW WenKai, `#1c1917`, centered | English — 22px DM Sans, `#1c1917`, centered |
| **Secondary text** | (hidden by default; tap "hint" icon for pinyin in 16px DM Sans `#78716c`) | Pinyin — 16px DM Sans, `#78716c`, above English |
| **Tertiary** | — | Example sentence — 14px system CJK, target word in `#c4392a`, max 2 lines |
| **Interaction** | Tap anywhere to flip | Score buttons appear below card |
| **Animation** | — | 280ms Y-axis `rotateY(180deg)`, `ease-out`, backface hidden |
| **Direction** | Recognition (ZH→EN) for stages 1-3; Production (EN→ZH) introduced at stage 4+ | Front/back swap accordingly for production cards |
| **Label** | Recognition: "你认识这个词吗？" (13px, `#78716c`, top) | Production: "怎么说…？" (13px, top) |

### 2. Scoring UI Spec

| Button | Label | Color (text/bg) | SM-2 Quality | Interval Preview |
|---|---|---|---|---|
| Again | 重来 | `#c4392a` / `#fef2f2` | q=1 | "< 1分钟" |
| Hard | 困难 | `#b8860b` / `#fefce8` | q=2 | e.g. "6分钟" |
| Good | 记得 | `#2d8a72` / `#f0fdf4` | q=3 | e.g. "3天" |
| Easy | 简单 | `#6b7280` / `#f9fafb` | q=5 | e.g. "7天" |

- **Layout:** 4 buttons in a horizontal row, bottom-fixed, 48px height, 12px gap, equal width, full container bleed.
- **Tap targets:** ≥ 44×48px (WCAG compliant).
- **Interval preview:** 11px DM Sans, `#78716c`, below button label. Desktop only; hidden on viewports < 640px.
- **Press animation:** `scale(0.96)`, 120ms spring.
- **Post-score:** Card slides out left (200ms `ease-in`), next card enters from right (250ms `ease-out`, content staggered: body 0ms, text 80ms).

### 3. Review Session Flow

1. **Entry:** "复习" nav item with Vermillion badge showing due count. Tap opens review immediately — no config screen.
2. **Batch size:** `min(due_cards, 20)` for free tier, `min(due_cards, 50)` for Pro.
3. **Card ordering:** Most overdue first (`nextReview ASC`).
4. **Progress indicator:** 3px Jade bar across top, + "4 / 12" counter (13px DM Sans `#78716c`).
5. **Mid-session exit:** All individually scored cards already persisted to IDB. No session summary generated.
6. **Session complete:** Progress bar pulses Jade→Gold (300ms). Summary card shows: total reviewed, accuracy %, streak count. CTAs: "继续学习" (→ stories) or "再来一轮" (Pro only, loads next batch).
7. **State management:** Session state in Svelte `$state` (memory). Each score triggers an immediate IDB `put` to the `vocabulary` store + an append to `reviewLog`.

### 4. Word Saving Interaction

- **Trigger:** Tap on any word in story text.
- **UI:** Bottom sheet slides up (240px, 200ms `ease-out`). Contains:
  - Hanzi (28px LXGW WenKai) + speaker icon (24×24, triggers `speechSynthesis` with `lang: 'zh-CN'`)
  - Pinyin (16px DM Sans `#78716c`)
  - English definition (16px DM Sans)
  - "+ 添加到词库" button (Jade `#2d8a72` bg, white text, 40px height, full width − 32px margin)
  - If already saved: "已保存 ✓" (muted gray, disabled)
  - If at 50-word cap: button triggers Pro upsell modal instead
- **Save animation:** Hanzi scales 1→1.2 (150ms) then fades to 0 (300ms). A ghost particle flies to the "词库" nav icon, which bounces (translateY −4px, 200ms spring). Total: <500ms.
- **Data written on save:** IDB `vocabulary` store entry with initial SM-2 values (`easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: now()`), `storyId`, and `sentenceContext` (extracted from DOM at save time). Also appended to `pendingSync` queue.

### 5. Vocabulary List Page Spec

- **Layout:** Vertical scroll list. Each row: 64px height, full width. Left: hanzi (20px LXGW WenKai) + pinyin (13px DM Sans `#78716c`) stacked. Right: English (14px DM Sans). Far right: mastery dot (8px circle) — Red (new/lapsed), Amber (learning), Jade (mature), Gold (mastered). Divider: 1px `#e7e5e4`.
- **Filters:** Story dropdown, Mastery level (All / New / Learning / Mature / Mastered), free-text search (fuzzy match on hanzi/pinyin/english).
- **Sorting:** By pinyin (alpha), date added, next review date, mastery level.
- **Virtual scrolling:** For Pro users with 500+ words, use `position: absolute` + `translateY` (no library, keeps island < 6KB).
- **Nudge banner:** If user has ≥1 due card and hasn't reviewed in current session, list header shows: "你有 8 个词需要复习" with Vermillion-outlined "开始复习" button.
- **Empty state:** Ink-wash illustration of open book with floating characters. Headline: "你的词库空空如也" (20px Cormorant Garamond). Subtext: "在故事中点击生词，添加到你的词库" (14px DM Sans). CTA: "开始阅读" → story index.

### 6. Progress & Stats UI

- **Streak card:** Large number (48px DM Sans Bold) + 🔥 icon + "天连续" label. Parchment-to-warm-amber gradient bg. Streak freeze (Pro only): 1 freeze per 7 days. Reset message: "你的连续记录重置了，但你的进步还在！"
- **Words breakdown:** Horizontal stacked bar, segments by mastery (Red/Amber/Jade/Gold), total count right-aligned.
- **30-day heatmap:** 30 squares (16×16px, 4px gap). Opacity: 0 reviews = `#e7e5e4`, 1-5 = light jade, 6-10 = medium jade, 11+ = `#2d8a72`.
- **Accuracy sparkline:** Last 30 days, Jade stroke, 2px.
- **Trouble Words:** 5 lowest ease-factor words displayed as a mini-list below the heatmap.
- **Computation:** All stats derived at page load from `vocabulary` + `reviewLog` IDB stores. No separate stats table. ReviewLog schema: `{ id: ulid, date: string, cardId: string, score: number }`.
- **Streak computation:** Distinct dates from `reviewLog`, count consecutive from today backwards. Cached in memory, invalidated on new review.

### 7. Word Detail View Spec

- **Container:** Full-screen sheet on mobile, 480px centered modal on desktop. Parchment bg.
- **Layout (top to bottom):**
  1. Hanzi — 48px LXGW WenKai, centered. Speaker icon (24×24) next to pinyin.
  2. Pinyin — 20px DM Sans, `#78716c`.
  3. English — 18px DM Sans.
  4. Divider (1px `#e7e5e4`).
  5. **Source Story** — Story title as a tappable link.
  6. **Example Sentence** — From the story, target word highlighted in `#c4392a`.
  7. **SRS Info** — "Next review: 3天后", mastery dot + label. Ease factor hidden.
  8. **Stroke Order** — Placeholder: "笔顺练习 — 即将推出" (Phase 2).
  9. **Related Words** — Reserved 80px (Phase 2).
  10. **Actions** — "删除" (red text, destructive, with confirmation) | "立即复习" (Jade outline button, opens single-card review).

### 8. Notification Strategy

| Channel | Trigger | Frequency | Copy | Tier |
|---|---|---|---|---|
| In-app badge | Due cards > 0 | Always visible | Vermillion dot (8px) + count on "词库" nav icon; pulse if > 20 due | All |
| Browser push | Due cards > 0, user opted in | Max 1/day, user-set time (default 9am) | "龙知：你有 8 个词待复习" | All |
| Streak risk push | Streak ≥ 3, no review by 6pm | 1/day at 6pm | "你的 7 天连续记录即将结束！" | All |
| Email digest | Weekly summary | 1/week | "Your week: 42 reviewed, 5 mastered" | Pro |

- **Opt-in timing:** After 3rd completed review session.
- **Controls:** Snooze 1 day ("稍后提醒") or 7 days ("暂停提醒") from any notification. Settings page for full control.
- **Implementation:** Service Worker + Push API. Subscription endpoint stored in D1. Cloudflare Worker cron trigger for scheduling.

### 9. Offline Behavior Spec

- **Architecture:** IDB is source of truth. App is fully functional offline for all review and vocabulary operations.
- **Sync strategy:** Last-write-wins with `updatedAt` timestamps. Client mutation → IDB write + `pendingSync` queue entry.
- **`pendingSync` schema:** `{ id: ulid, operation: 'create'|'update'|'delete', table: string, payload: object, timestamp: string }`.
- **Sync triggers:** `navigator.onLine` → `true`, `visibilitychange` → `visible`, `setInterval` every 5 minutes if online.
- **Batch size:** Max 50 operations per sync request (Cloudflare Worker CPU limit).
- **Retry:** Exponential backoff: 1s → 2s → 4s → 8s → max 60s.
- **Conflict resolution:** If server `updatedAt` > client `updatedAt`, server wins. Otherwise client wins. For single-user data, this is deterministic and correct.
- **Cap enforcement:** Client-side via IDB count query. Works offline. Upsell modal is a static Svelte component (works offline). "Upgrade" CTA links to pricing page (requires connectivity, but service-worker cached).
- **UX:** No "you're offline" toast for reviews. Sync indicator: subtle cloud icon (16px, `#a8a29e`) in session summary, ✓ when synced.

### 10. Free/Pro Limit UX

| Limit | Free | Pro | UX When Hit |
|---|---|---|---|
| Vocabulary cap | 50 words | Unlimited | Save button triggers modal: "你的免费词库已满" + "升级到 Pro，解锁无限词汇" |
| Daily reviews | 20 reviews/day | Unlimited | After review #20: "今天的免费复习次数已用完" + Pro upsell |
| New introductions | Uncapped (within 50 total) | Unlimited | — |
| Streak freeze | Not available | 1 per 7 days | Streak settings show "Pro feature" badge |
| Session continuation | No "再来一轮" | Available | CTA hidden for free users |
| Email digest | Not available | Weekly | — |

- **Modal design:** Centered, 340px max-width, 32px padding, Parchment bg, 2px Gold border on top edge. Backdrop blur 8px. Fade in 200ms + translateY 16→0.
- **CTA:** "Upgrade to Pro" (Gold `#cda434` bg, Ink text) + "稍后再说" (ghost button, clearly visible). No dark patterns.
- **Key principle:** Never block *review* of existing words — only block new saves and extended sessions.

### 11. Gamification System

| Include | Exclude | Rationale |
|---|---|---|
| ✅ Day streak + 🔥 icon | ❌ XP / points | Streaks are proven retention drivers; XP feels gamey for the brand |
| ✅ Mastery milestones (gold shimmer on card, 600ms CSS `@keyframes`) | ❌ Levels / leveling up | Milestones celebrate *knowledge*; levels celebrate *grinding* |
| ✅ Per-story word completion ring ("郑和: 12/20 词") | ❌ Leaderboards | Completion rings motivate story engagement; leaderboards create anxiety |
| ✅ Knowledge-based achievements (Phase 2: "Learned 100 Tang Dynasty words") | ❌ Behavior-based badges ("30-day login") | Achievements should celebrate *learning*, not *logging in* |
| ✅ Streak-break empathy ("你的进步还在！") | ❌ Punitive loss animations | The brand is a wise teacher, not a slot machine |

**Design voice:** Gamification = *acknowledgment*, not *manipulation*. No sounds. No coins. No avatars. Let the content — the stories, the characters, the history — be the primary reward.

### 12. Unresolved Disagreements

1. **Daily review cap (Free tier):** B2 proposed 20/day with uncapped maintenance reviews. B10 flagged revenue risk — if free users never feel friction on reviews, conversion weakens. **Resolution needed:** A/B test 10 vs 20 at launch, measure Pro conversion rate at 30 days.

2. **Pinyin visibility on card front:** A2 (beginners) want it always visible. A9 (advanced) wants it hidden. **Consensus for now:** Hidden by default with a tap-to-reveal hint icon. Add a global setting "Always show pinyin" in user preferences (Phase 1.1).

3. **Audio pronunciation:** Web Speech API is zero-cost but inconsistent across devices. Premium recorded audio is higher quality but adds storage + cost. **Consensus:** Ship with Web Speech API in Phase 1. Evaluate user feedback. Budget for premium audio files as a Phase 2 Pro feature.

4. **Stroke order:** High learner demand (especially A4, A7), but significant scope. **Parked for Phase 2.** Placeholder in the Word Detail View signals intent.

5. **Knowledge-based achievements:** B4 proposed achievements tied to historical eras. Requires a taxonomy of words by dynasty/era and is content-dependent. **Parked for Phase 2** after sufficient story content exists to make it meaningful.

---

### IndexedDB Schema Summary

```
Store: vocabulary
  Key: id (ulid)
  Fields: hanzi, pinyin, english, storyId, sentenceContext,
          stage, easeFactor, interval, repetitions,
          nextReview, lastReview, createdAt, updatedAt
  Indexes: nextReview, storyId, easeFactor

Store: reviewLog
  Key: id (ulid)
  Fields: date, cardId, score, responseTimeMs
  Indexes: date, cardId

Store: pendingSync
  Key: id (ulid)
  Fields: operation, table, payload, timestamp
  Indexes: timestamp
```
---

## 6. Learning Dashboard

### 6.1. Dashboard Layout Spec

```
Card Order (top → bottom):
  ① Greeting + Streak Header (not a card — full-width banner)
  ② Review CTA Card (hero)
  ③ Continue Reading Card(s) (1-2 stories)
  ④ Stats Grid (4 stat cards)
  ⑤ 30-Day Heatmap Card
  ⑥ Pro Upsell Card (free users only, last position)

Grid System:
  Mobile  (<640px):  single column, 16px padding, 16px card gap
  Tablet  (640-1023px): single column, 24px padding, 20px card gap
  Desktop (≥1024px): 12-col grid, main 8col + sidebar 4col
                      sidebar holds: Stats Grid + Heatmap
                      main holds: Greeting, Review CTA, Continue Reading
                      max-width: 960px centered, 32px padding

Base spacing: 8px grid
Card border-radius: 12px
Card shadow: 0 1px 3px rgba(0,0,0,0.08)
Card padding: 16px mobile, 24px desktop
Card bg: #FAFAF5 (parchment-white)
```

### 6.2. Review CTA Component

```
States:
  ① DUE: "23 words to review · ~8 min"
     - Full-width card, 120px mobile / 140px desktop
     - Jade (#2E8B57) primary button, vermillion (#C41E3A) count badge
     - Sub-headline adapts to time of day
  ② OVERDUE (>24h): adds vermillion left border (4px)
     - "5 words overdue!" in vermillion text
     - Card border pulses: scale 1.0→1.02, 2s ease, infinite
     - NO red backgrounds
  ③ CAUGHT UP: 80px height, celebratory
     - "All caught up! 🎉 Next review in 3小时"
     - Light jade bg (#E8F5E9), muted button
     - CSS confetti on first view per session (3 particles, 1s)

Data Sources:
  - Due count: vocabulary store WHERE nextReviewDate <= now
  - Est. time: dueCount × avgReviewTime (from settings store, default 20s)
  - Next due: MIN(nextReviewDate) WHERE nextReviewDate > now
  - Formatted with Intl.RelativeTimeFormat('zh-CN')
```

### 6.3. Continue Reading Component

```
Primary Story Card (most recent):
  - Height: 160px mobile / 180px desktop, full-width
  - Left: cover thumbnail 64×88px, rounded corners
  - Right: title (16px bold ink), period badge (12px jade tag),
    segmented progress bar (8px, jade fill, tick marks per chapter),
    "12 new words ahead" (14px muted), "Continue →" jade link

Secondary Story Card (if exists):
  - Height: 120px, smaller thumbnail, text-only progress "Ch 3/8"
  - Max 2 visible, 3+ → "See all (N)" link

Completion State:
  - "You've read everything! 📜" + "Revisit favorites" link

Data: reading progress from story/chapter tracking in IDB
```

### 6.4. Stats Cards Spec

```
Layout: 2×2 grid mobile, 4×1 row desktop
Card size: ~150×100px each (flexible within grid)

Cards:
  ① 🔥 Streak: "{N} 天" — 32px bold ink number, "day streak" 14px muted
  ② 🏆 Mastered: "{N}" — words at Mastered stage
  ③ 📚 In Pipeline: "{N}" — Learning + Mature stage words
     Weekly delta: "+12 this week" jade / "-3" vermillion
  ④ ✓ Today: "{N}" — reviews completed today
     Contains 7-day sparkline (80×24px SVG polyline, jade stroke 2px,
     area fill 10% opacity, vermillion dot on today)

Expandable Detail (tap "Show more"):
  - Full mastery funnel: New → Learning → Mature → Mastered
    horizontal stacked bar, proportional widths
  - Accuracy sparkline (7-day, same SVG style)
  - Power users only (dashboardState === 'power', vocab > 200)

Data Sources:
  - vocabulary store: group by stage field
  - reviewLog store: filter by date for today/weekly counts
  - Streak: consecutive days with ≥1 review in reviewLog
```

### 6.5. Heatmap Component Spec

```
Layout: 7 rows (Mon-Sun) × ~5 cols (weeks), left-to-right
Cell size: 16×16px mobile, 20×20px desktop, 3px gap
Total: ~110×130px mobile, ~136×162px desktop

Color Scale (on parchment):
  0 reviews:  #E8DCC8 (dark parchment — visible but empty)
  1-5:        #A8D5A2 (light jade)
  6-15:       #2E8B57 (jade)
  16+:        #1A5C38 (deep jade)
  Streak freeze day: ❄️ overlay icon on cell

Tooltip (hover desktop / tap mobile):
  "Wednesday, Jan 15: 12 reviews · 92% accuracy"
  Svelte {#if} popover, positioned above cell

Click Behavior:
  Desktop: expand-in-place panel below heatmap
    → shows up to 20 words reviewed that day (word + ✓/✗)
    → "and X more" overflow link
  Mobile: navigate to /stats/{date} detail view (deferred — v1.1)
    → v1.0: expand-in-place on all viewports

Data: reviewLog grouped by date(timestamp), last 30 days
Lazy loading: detail data fetched on click, not preloaded
Skeleton: 3 shimmer rows (12px height) while loading
```

### 6.6. Streak Component Spec

```
Location: Greeting header, right-aligned
Display: 🔥 + "{N}" in 36px bold ink + "天" in 18px muted
Total width: ~80-120px depending on digit count

Animation (daily increment, first review of day):
  - Flame icon: scale 1.0 → 1.3 → 1.0, 400ms ease-out
  - Number: CSS counter increment animation (old → new, slide-up)
  - No sound effects

Milestones (7, 30, 100, 365 days):
  - One-time modal, centered, 320px wide
  - Custom illustration per tier (dragon growth stages)
  - "You've studied for N days! 龙知 is proud of you."
  - Single CTA: "继续学习" (Continue studying)
  - Tracked: localStorage milestone_{N}_shown = true

Streak Freeze (Pro only):
  - Badge on streak display: "❄️ Freeze available" (subtle)
  - Manual activation only, 1 per calendar month
  - IDB settings: freezesUsed (number), lastFreezeMonth (string)
  - Free user micro-upsell: "Pro members can freeze streaks"
```

### 6.7. Empty State Designs

```
① NEW USER (0 vocabulary, 0 reviewLog):
   - Hero illustration: parchment scroll unrolling + dragon mascot
   - "Welcome to 龙知! 开始你的第一个故事"
   - Single jade CTA button: "Start your first story →"
   - NO stats cards, NO heatmap, NO streak
   - Full-width centered, 320px max illustration

② NO REVIEWS DUE (has vocab, none due):
   - Review CTA card transforms to caught-up state (see §2, state ③)
   - Rest of dashboard renders normally
   - CSS confetti (jade/gold/vermillion, 3 particles, 1s, CSS-only)

③ ALL CONTENT COMPLETE (all stories finished):
   - Continue Reading card transforms:
     "You've read everything! 📜 New stories coming soon."
   - "Revisit your favorites" link below

Progressive Disclosure Tiers:
  empty  (0 vocab):     EmptyDashboard component only
  beginner (1-20):      Greeting + CTA + Reading + 2 stat cards
  active (21-200):      Full dashboard, simplified stats
  power (201+):         Full dashboard + mastery funnel + accuracy
```

### 6.8. Time-Adaptive UI Rules

```
Greeting (by hour, client-side new Date().getHours()):
  05-11:  "早上好！"  (Good morning)
  12-17:  "下午好！"  (Good afternoon)
  18-22:  "晚上好！"  (Good evening)
  23-04:  "夜深了！"  (It's late)

Card Sub-headline Adaptation (text only, order unchanged):
  Morning CTA:  "Start your day with a quick review 📖"
  Evening CTA:  "A few reviews before you rest 🌙"
  Morning Read: "Continue your morning reading"
  Evening Read: "Wind down with a story"

Layout/card order: NEVER changes based on time.
```

### 6.9. Pro Upsell Placement

```
Bottom Card (persistent):
  - Last position on dashboard, below all learning content
  - Gold (#D4A017) left border 4px, parchment bg
  - "Unlock streak freeze, advanced stats & more with 龙知 Pro"
  - Gold "Learn More →" text link
  - Dismissible: ✕ button, after 3 dismissals → hidden 30 days
  - Tracked: localStorage upsell_dismiss_count, upsell_hidden_until

Contextual Micro-Upsells (max 1 visible at a time):
  ① Below streak when streak ≥3 and no freeze available:
     "Pro members can freeze streaks ❄️" (14px muted, inline)
  ② On mastery funnel expansion (power users):
     "Detailed analytics with Pro" (14px muted, inline)
  ③ Not dismissible — disappear when condition unmet

Rules:
  - NEVER interrupt learning flow (no modals, no interstitials)
  - NEVER shown to Pro users ({#if !isPro})
  - Priority: contextual > bottom card (if both would show)
```

### 6.10. Unresolved Disagreements

```
① Sparkline Placement
   Option A: Inside the "Today's Reviews" stat card (reduces card count)
   Option B: Standalone "Weekly Trends" card (more space, clearer)
   LEANING: Option A (inside stat card) — B7 recommendation
   ACTION: Prototype both, A/B test post-launch

② Heatmap Click on Mobile
   Option A: Expand-in-place (consistent with desktop)
   Option B: Navigate to /stats/{date} page (avoids scroll-push)
   LEANING: Expand-in-place for v1.0 (simpler), revisit if scroll
   complaints arise in user testing
   ACTION: Ship expand-in-place, add analytics on usage depth

③ Study Time Tracking
   Request from A8 (advanced learner): show total review minutes/week
   BLOCKED: requires reviewLog schema addition (sessionId, sessionStart)
   ACTION: Defer to v1.1, add schema fields, then surface as 5th stat card

④ Words by Historical Period Breakdown
   Request from A10: "45 三国 words, 23 唐朝 words"
   Not blocked but lower priority — could live in a /stats page
   ACTION: v1.1, dedicated stats page with period-based breakdowns

⑤ Collapsible Sections on Mobile
   A5 concern about scroll depth. Could collapse Stats + Heatmap
   after the first week of use.
   LEANING: Don't collapse by default — users lose discoverability.
   Add a user preference toggle in settings if scroll complaints arise.
   ACTION: Monitor scroll-depth analytics post-launch
```

---

**Total components spec'd: 6 primary + 3 empty states + time rules + upsell system.** All data sourced from client-side IDB (`vocabulary`, `reviewLog`, `settings` stores). Performance budget: FCP <1.5s, TBT <200ms, IDB queries <50ms. Ship as Astro page with Svelte 5 islands for interactive elements only.
---

## 7. Onboarding Flow

### 7.1. Complete Onboarding Flow (Step-by-Step)

| Step | Timing | What Happens | Trigger |
|------|--------|-------------|---------|
| 1. Land | 0-1.5s | Page loads. Hero: one-line value prop + live story fragment with one glowing word. No nav clutter, no modals. | Page load |
| 2. First Tap | 1.5-12s | User taps the glowing word. Inline definition popover appears (pinyin + meaning). **AHA MOMENT.** | User curiosity |
| 3. Explore | 12-45s | User taps 2-3 more words. Each tap reinforces the pattern. A subtle "⭐ Save" button appears on the 3rd definition popover. | Natural exploration |
| 4. First Save | 45-90s | User taps Save. Inline expansion (NOT modal): "Create a free account to keep your words." Google OAuth button + Magic Link. | Save tap |
| 5. Signup | 90-120s | User signs up (Google: 3-5s, Magic Link: 30-120s). Redirected back to same story. localStorage words synced to account. Toast: "✓ 3 words saved!" | Auth completion |
| 6. Level Select | 120-150s | One-screen question: "How much Chinese do you know?" with 4 friendly options (see §4). Framed as "Let me find the right stories for you." | Post-signup |
| 7. Story Feed | 150s+ | Personalized story feed based on level. Continue reading the hero story or pick a new one. | Level selected |
| 8. First Review | End of session or next day | After 5+ saved words, introduce SRS: "Ready to practice your words?" | Word count threshold |

**For users who DON'T sign up:** They can keep reading stories freely. The save prompt remains gentle and non-blocking. localStorage preserves their word list for return visits.

### 7.2. First Visit Experience (Second-by-Second)

```
0.0s   — HTML loads. SSR story fragment visible immediately. Static, readable.
0.3s   — Svelte island hydrates. Word-tap interactions become active.
0.8s   — First word begins soft amber glow pulse (CSS keyframes, 0.8s cycle).
         Hero text: "Learn Chinese through history's greatest stories."
         Below: 2-sentence story excerpt from a Three Kingdoms tale (HSK3-4 level).
1.5s   — Page fully interactive. Glowing word awaits tap.

[User taps glowing word]
+0ms   — Glow stops. Word gets subtle highlight background.
+50ms  — Definition popover flies in (Svelte transition:fly, y:8, 200ms).
         Shows: pinyin (large), English meaning, word in sentence context highlighted.
+∞     — Popover stays until user taps elsewhere or taps another word.

[User taps 2nd word]
+0ms   — Previous popover dismisses. New popover appears.

[User taps 3rd word]
+0ms   — Popover appears WITH a small "⭐ Save word" button at bottom.
         Tooltip on first appearance: "Save words to review later"

[User taps Save]
+0ms   — Word saved to localStorage. Star fills in. Micro-animation: star scales
         1.0→1.3→1.0 with a brief gold particle burst (CSS only).
+300ms — Below the popover, inline expansion slides down:
         "Your word list is started! 🎉
          Sign up free to keep your words and start reviewing."
         [🔵 Continue with Google]
         [✉️ Sign up with email]
         [Maybe later →]

[User clicks "Maybe later"]
+0ms   — Expansion collapses. User continues reading. Words save to localStorage.
         A small persistent badge appears in corner: "3 unsaved words"
```

### 7.3. Aha Moment Design

- **What:** Tapping an unknown Chinese word and instantly seeing its pinyin + meaning while reading a compelling historical story. The user realizes: "I can actually read Chinese — and it's a real story, not a textbook exercise."
- **When:** Within the first 12 seconds of page load. Target: under 8 seconds for users who notice the glowing word.
- **How:**
  - One word in the hero fragment glows with a warm amber pulse (CSS animation).
  - Tap → inline popover with pinyin, meaning, and the word highlighted in its sentence.
  - The definition is contextual — not a generic dictionary entry but tailored to its use in THIS sentence.
  - No signup required. No level selection required. Zero barriers between landing and aha.
- **Reinforcement:** Each subsequent tap deepens the aha. By tap 3, the user has learned 3 words in context and proven to themselves that the method works.

### 7.4. Level Assessment Spec

**Timing:** After account creation (step 6). Never before the aha moment.

**UI:** Single screen, friendly illustrations, no test anxiety.

**Question:** "How much Chinese do you know?"

| Option | Label | Sublabel | Maps To |
|--------|-------|----------|---------|
| 🌱 | "Starting fresh" | "I know zero Chinese — and that's okay!" | Beginner (HSK1-2) |
| 🌿 | "I know some basics" | "I can say hello and count to ten" | Elementary (HSK2-3) |
| 🌳 | "I can hold a conversation" | "I've studied for a year or more" | Intermediate (HSK3-4) |
| 🏔️ | "I can read articles" | "I'm comfortable with most everyday Chinese" | Advanced (HSK5+) |

**Behavior after selection:**
- Story feed reorders to match level.
- Pinyin display default changes (always-on → on-tap → off).
- Story length recommendations adjust.
- A brief confirmation: "Great! I've picked some stories for you. 📚"

**Passive recalibration:** After 3 stories, compare tap frequency to expected rate for their self-reported level. If mismatch >30%, gently suggest: "These stories might be a better fit for you →" with adjusted recommendations.

### 7.5. Account Creation Strategy

**When to ask:** After the user's first word save attempt.

**How to ask:** Inline expansion below the word card. NOT a modal. NOT a page redirect. The story remains visible behind/above the prompt.

**What to say:**
> "Your word list is started! 🎉
> Sign up free to keep your words and start reviewing them."

**Auth options (in order):**
1. **Continue with Google** (primary, blue button) — fastest path, 3-5s
2. **Sign up with email** (secondary, outlined) — Magic Link, 30-120s
3. **Maybe later →** (text link) — dismiss, persist words in localStorage

**Post-signup:**
- Redirect to the exact scroll position in the story they were reading.
- Merge localStorage words to their account.
- Toast notification: "✓ [N] words saved to your account!"
- Proceed to level selection.

**What NOT to do:**
- Don't ask for username, display name, or profile photo during onboarding.
- Don't show a "Welcome to LongLore!" interstitial page.
- Don't send a welcome email immediately (wait 24hrs — they're still in-app).
- Don't gate story reading behind auth. Ever.

### 7.6. Return Visit Handling

### Detection
- **Server-side:** First-party cookie `ll_visit=1` set on first page load (`SameSite=Strict`, no expiry). Astro reads this cookie and conditionally renders the appropriate hero component.
- **Client-side:** `localStorage` object with `visitCount`, `lastVisit`, `lastStorySlug`, `savedWords[]`, `inferredLevel`, `hasSeenOnboarding`.

### Returning Non-Auth User Experience
```
Hero section replaced with:
┌─────────────────────────────────────────────┐
│  Welcome back 👋                            │
│                                             │
│  📖 Continue: "The Art of War, Ch. 3"       │
│     [Continue Reading →]                    │
│                                             │
│  📝 You've discovered 12 words              │
│     Create an account to start reviewing    │
│     [Sign up free →]                        │
└─────────────────────────────────────────────┘
```
- Below: personalized story feed based on inferred level.
- No repeat of the glowing-word tutorial.
- The "12 words" count creates urgency — they have something to lose.

### Edge Cases
- **Cleared cookies/storage:** Treat as new user. No penalty. Re-show onboarding.
- **Incognito mode:** Every visit is "new." Set a session-level flag to avoid re-showing onboarding within the same tab session.
- **Multiple devices:** No sync without account. This is a natural signup nudge: "Sign up to access your words on any device."

### 7.7. Personalization Rules

### By Level

| Aspect | Beginner | Intermediate | Advanced |
|--------|----------|-------------|----------|
| Pinyin | Always visible (ruby) | On-tap only | On-tap, smaller font |
| Story length | 200-400 chars | 400-800 chars | 800+ chars |
| Glossary sidebar | Visible, expanded | Collapsed | Hidden |
| Story recommendations | Simple narratives, modern | Classical tales, dialogues | Literary texts, essays |
| Definition detail | Pinyin + meaning only | + example sentence | + usage notes, etymology |
| New words per story | 5-10 highlighted | 10-20 available | All tappable, none highlighted |

### By Behavior (Passive Signals)

| Signal | Inference | Action |
|--------|-----------|--------|
| Taps >80% of words | Level too high | Suggest easier stories |
| Taps <5% of words | Level too low | Suggest harder stories |
| Reads >3 stories from same era | Era preference | Weight recommendations to that era |
| Session >15 min | High engagement | Introduce SRS earlier |
| Saves >10 words in session | Power user | Show "Pro" features sooner |
| Bounces from story in <30s | Content mismatch | Show different genre/era next |

### Personalization Timeline
- **Visit 1-2:** Curated "best of" content. No algorithmic recommendations.
- **Visit 3+:** Begin passive personalization based on collected signals.
- **10+ saved words:** Full personalization active.

### 7.8. Anti-Friction Measures

| Friction Point | Who Identified | Solution |
|---|---|---|
| "I don't know what to tap" | A1 | One word glows with amber pulse. `aria-label` for accessibility. |
| "Definition popup has too much info" | A4 | Compact default: pinyin + meaning. "More ▾" expands to examples, etymology. |
| "Can't tell story difficulty" | A5 | HSK level badge + descriptive label ("Beginner-friendly", "Challenging") on every story card. |
| "Signup interrupts reading" | A7 | Inline expansion, NOT modal. "Maybe later" always available. Story stays visible. |
| "Hero assumes I'm a beginner" | A10 | Hero story is HSK3-4 level (mid-range). Interesting for all levels. |
| "Slow page load" | D5 | SSR everything. Inline hero dictionary data (2KB). Lazy-load rest. <2s TTI on 3G. |
| "OAuth fails" | D10 | Automatic fallback to Magic Link with pre-filled email. Clear error message. |
| "localStorage full" | D10 | Graceful degradation: prompt signup instead of crashing. Try/catch all storage writes. |
| "Dictionary lookup fails" | D10 | Fallback to `<ruby>` pinyin (already in HTML). "Tap to retry" on definition popover. |
| "Accidentally dismissed definition" | C7 | Tap same word again to re-show. No penalty. History of viewed words in session. |
| "Don't know my level" | A1 | Friendly self-select with plain language, not HSK numbers. Passive recalibration after 3 stories. |
| "Too many choices on story page" | C5 | Default sort: "Recommended for you" (1 prominent story + 3 alternates). Not a grid of 50. |

### 7.9. Key Metrics

### Onboarding Funnel (First Session)

| Gate | Metric | Target | Event Name |
|------|--------|--------|------------|
| G1 | Time to first tap | <12s median | `first_word_tap` |
| G2 | Time from first tap to 3rd tap | <45s median | `third_word_tap` |
| G3 | % who save at least 1 word | 60%+ | `first_word_save` |
| G4 | Time from save prompt to signup | <30s median | `signup_completed` |
| G5 | % who complete level selection | 85%+ of signups | `level_selected` |

### Retention Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Day-1 return rate | 40%+ | Next calendar day |
| Day-7 return rate | 25%+ | Within 7 days |
| First review completion | 70%+ of users with 5+ words | Within 48hrs of 5th save |
| Words saved per session | 5+ median | Per active session |
| Stories started per session | 1.5+ median | Per active session |

### Health Metrics

| Metric | Alert Threshold | Meaning |
|--------|----------------|---------|
| Bounce rate (no tap) | >60% | Hero isn't working |
| Signup prompt dismiss rate | >80% | Prompt too aggressive or poorly timed |
| Level-select drop-off | >25% | Question is confusing or feels invasive |
| Error rate (dictionary lookup) | >2% | API/CDN issue |
| TTI (p75) | >3s | Performance regression |

### 7.10. Unresolved Disagreements

1. **Hero Story Content:** A10 argues for HSK3-4; A1 worries even that is intimidating. **Compromise in progress:** Use HSK3-4 text BUT with 2-3 words pre-revealed with pinyin+English inline (not requiring tap), so beginners see they CAN understand it. **Needs A/B testing.**

2. **Save Button Timing:** B10 wants to test showing Save on the 1st tap vs. 3rd tap. B5 hypothesizes 3rd is better. **Agreed to A/B test.** Ship with 3rd-tap as default.

3. **Level Selection vs. Pure Inference:** B6 advocates never asking, just inferring from tap behavior. B4 argues self-selection is faster and more accurate for the first session. **Agreed to A/B test** both approaches, measuring stories-started and 7-day retention.

4. **Magic Link vs. Google-Only:** D4 notes Magic Link adds 30-120s of friction. B7 argues some users distrust Google OAuth for privacy reasons. **Consensus: keep both**, but make Google the visually primary option (larger button, top position).

5. **Personalization Start Point:** B6 says wait until visit 3+. C10 argues even visit 1 can be personalized if we ask one question (level). **Consensus: ask level after signup (visit 1), use it immediately, but don't do behavioral personalization until visit 3+.**

---

*End of brainstorm. All 40 experts have spoken. Ship the prototype.* 🐉
---

## 8. Monetization & Payment

### 8.1. TIER DEFINITIONS

| | Free | Pro ($7.99/mo) | Scholar ($14.99/mo) |
|---|---|---|---|
| **Price (Annual)** | $0 | $59.99/yr ($5.00/mo) | $109.99/yr ($9.17/mo) |
| **Stories** | All | All | All + Scholar-exclusive series |
| **Vocabulary** | 50 words | Unlimited | Unlimited |
| **Daily Reviews** | 20 | Unlimited | Unlimited |
| **SRS** | Basic intervals | Optimized intervals | Optimized + custom scheduling |
| **Audio** | Slow + natural | + sentence replay | + character-level + pronunciation hints |
| **Stats** | Basic (streak, count) | Detailed (accuracy, weak areas) | + exportable reports |
| **Writing** | — | Stroke-order practice | + handwriting recognition |
| **Offline** | — | — | ✓ download stories & reviews |
| **Content** | — | — | Classical Chinese, advanced series |
| **Support** | Community | Email | Priority + quarterly Q&A |

**Founder's Edition:** $99.99 one-time, Pro features forever. Capped at 500. Launch-only.

---

### 8.2. PRICING PAGE SPEC

**URL:** `/pricing`

**Layout:** 3-column card grid (desktop), single-column stack with Pro first (mobile).

**Toggle:** Monthly ↔ Annual. Default: Annual. Label: `Save up to 39%`.

**Featured column:** Pro — lifted 8px, jade border, "Most Popular" jade pill badge.

**CTAs:**
- Free: outlined ink button → `继续免费使用 Stay Free` (logged in) / `免费开始 Get Started Free` (logged out)
- Pro: solid jade button → `开始免费试用 Start Free Trial`
- Scholar: solid vermillion button → `开始免费试用 Start Free Trial`

**Below cards:**
1. Expandable comparison table (collapsed by default on mobile)
2. FAQ accordion (4-6 questions — cancellation, downgrade data safety, student discount, payment methods, refund policy, "What happens after my trial?")
3. Trust strip: Stripe security · 14-day guarantee · Cancel anytime · Learners in 40+ countries

**Feature labels:** Bilingual — `✓ 无限词汇 Unlimited Vocabulary`

---

### 8.3. CHECKOUT FLOW

```
Click "Upgrade" or "Start Free Trial"
  → If logged out → /login?redirect=/checkout/{plan}
  → If logged in ↓

Confirmation interstitial (our page):
  Shows: plan name, price, billing cycle, 3 key features, trial badge if applicable
  CTAs: [Continue to Payment →] / [← Back]

Redirect to Stripe Checkout (hosted):
  mode: 'subscription'
  allow_promotion_codes: true
  billing_address_collection: 'auto'
  tax_id_collection: { enabled: true }

Success → /welcome-pro:
  Celebration page. Poll plan status (webhook race condition).
  CTAs: [→ Dashboard] / [→ Explore Stories]

Cancel → /pricing (return to pricing page)
```

**Total clicks: 3** (Upgrade → Confirm → Pay on Stripe)

**Founder's Edition checkout:** Same flow, but `mode: 'payment'` (one-time).

---

### 8.4. TRIAL STRATEGY

- **Duration:** 7 days
- **Credit card:** NOT required
- **Features unlocked:** Full Pro tier
- **One trial per account** (tracked in D1: `user.trial_used`)
- **Day 5:** In-app prompt: "Your trial ends in 2 days. Subscribe to keep your Pro features."
- **Day 7:** Graceful downgrade to Free. Words above 50 become read-only for 7 additional days (grace period for conversion).
- **Scholar trial:** Available to active Pro subscribers. 7 days. On expiry, reverts to Pro (no loss).

---

### 8.5. PAYWALL MOMENT MAP

| # | Trigger | Location | UX | Frequency |
|---|---|---|---|---|
| P1 | Vocab cap (50/50) | Story page / word click | Modal with progress bar, manage vocab option | Every occurrence |
| P2 | Review cap (20/20) | Review end screen | End card with tomorrow reminder | Every occurrence |
| P3 | Pro feature click | Stats, stroke order, etc. | Lock icon → slide-up drawer with preview | 1x/feature/session |
| P4 | Scholar story click | Story browser | Gold 🔒 badge → preview (2 paragraphs) + upsell | 1x/story/session |
| P5 | Dashboard card | Dashboard sidebar | Contextual card after 7-day streak or 40+ words | 1x/session, dismissable (3 dismiss = 30 day cooldown) |
| P6 | Account page | /settings | "Your Plan: Free" + Compare Plans link | Always visible (not a "prompt") |
| P7 | Post-review nudge | After review session | Subtle stat comparison line | 1x/week max, not in first 3 days |

**Hard rule:** Never >2 non-functional upgrade touchpoints per session. Never interrupt mid-review.

---

### 8.6. UPGRADE PROMPT SYSTEM

**Copy rotation for P7 (post-review nudge):**
- "Pro learners review 3x more words per day on average."
- "Unlock smarter SRS to remember more with less effort."
- "You've learned 47 words — just 3 from the free cap."

**Design:** All prompts use parchment bg, jade CTA, clear dismiss. Every modal closes on backdrop click and Escape key.

**"Manage Vocabulary" escape hatch:** On P1, users can remove words to stay under 50. This is a *feature*, not a bug — it builds trust and still communicates the cap's existence.

---

### 8.7. PLAN MANAGEMENT UX

**Page:** `/settings/billing`

**Shows:** Current plan, renewal date, payment method (last 4), billing history (downloadable invoices).

**Actions:**
- **Change Plan:** Opens plan comparison → confirms proration → redirects to Stripe Checkout for new plan
- **Cancel Plan:** One-click → confirmation with factual loss summary → [Confirm] / [Keep Plan]. No save offers. No guilt.
- **Update Payment:** Redirects to Stripe Customer Portal
- **View Invoices:** Stripe Customer Portal

**Downgrade behavior:** Words above 50 become read-only. User selects which 50 remain "active." All words remain visible and searchable. **"Your words are always yours"** — stated in FAQ.

---

### 8.8. PAYMENT INFRASTRUCTURE

### Stripe Products
```
LongLore Pro
  ├── price_pro_monthly        $7.99/mo   recurring
  └── price_pro_annual         $59.99/yr  recurring
LongLore Scholar
  ├── price_scholar_monthly    $14.99/mo  recurring
  └── price_scholar_annual     $109.99/yr recurring
LongLore Pro — Founder's Edition
  └── price_founder_lifetime   $99.99     one-time payment
```

### Webhook Handler (Cloudflare Worker at `/api/webhooks/stripe`)
| Event | D1 Action |
|---|---|
| `checkout.session.completed` | Activate plan, send welcome email |
| `customer.subscription.updated` | Sync plan status (upgrade/downgrade/renewal) |
| `customer.subscription.deleted` | Downgrade to free, send retention email |
| `invoice.paid` | Log payment |
| `invoice.payment_failed` | Set `past_due`, grace 7 days, show banner |
| `invoice.payment_action_required` | Email re: 3DS authentication |
| `charge.refunded` | Downgrade to free, set `has_used_refund` |

### D1 Schema (relevant fields)
```sql
ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';
-- 'free' | 'pro' | 'scholar' | 'pro_trial' | 'pro_lifetime'
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN plan_period_end INTEGER; -- unix timestamp
ALTER TABLE users ADD COLUMN payment_status TEXT DEFAULT 'ok';
-- 'ok' | 'past_due' | 'canceled'
ALTER TABLE users ADD COLUMN trial_used BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN trial_end INTEGER;
ALTER TABLE users ADD COLUMN has_used_refund BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN founder_number INTEGER; -- 1-500, null if not founder
```

### Edge Cases
- **Past-due:** 7-day grace → Stripe Smart Retries → auto-cancel after exhaustion
- **Double-subscription:** Check for active sub before creating Checkout session
- **Lifetime conflict:** Reject subscription creation for `pro_lifetime` users
- **Refund:** Automated within 14 days (one per user). Manual review after.
- **Webhook race:** Success page polls `/api/me` for up to 10s before showing fallback message
- **Proration:** Stripe handles automatically. Surface as "You'll be charged $X.xx today (prorated)."

### Localized Pricing (Post-Launch Phase)
- **V1:** USD only
- **V2:** EUR / GBP via Stripe multi-currency Prices
- **V3:** PPP pricing for India, SE Asia, LATAM. Geo-detection via `cf.country`. Fraud mitigation: payment method country must match. Accept some leakage.

---

### 8.9. UNRESOLVED / DEFERRED

| Item | Status | Notes |
|---|---|---|
| Student discount | Deferred | Explore SheerID or .edu email verification. 30-50% off Pro. Post-launch. |
| Gift subscriptions | Deferred | Nice-to-have. Stripe supports it. Phase 2. |
| Family plan | Deferred | Low priority. Revisit at 10k users. |
| Pause subscription | Rejected | Adds complexity, encourages churn. Offer cancel + re-subscribe instead. |
| Crypto payments | Rejected | Not aligned with target audience. |
| Annual → Monthly switch mid-cycle | Allowed | Stripe handles proration. Effective at next renewal. |
| Scholar without Pro history | Allowed | Users can go Free → Scholar directly. |

---

*Brainstorm complete. 40 experts, 10 rounds, consensus achieved on all primary items. Three items deferred to post-launch. Zero unresolved disagreements on launch-critical decisions.*
---

## 9. Mobile & PWA

### 9.1. Touch Interaction Standards

| Element | Min tap target | Hit area technique | Haptic |
|---|---|---|---|
| Vocabulary token | 44×44px | `padding: 6px 4px` invisible expansion | 5ms vibrate (Android) |
| SRS score button | 48×48px | 8px inter-button gap | 10ms vibrate (Android) |
| Bottom tab icon | 48×48px | Full tab width ÷ 4 | None |
| Nav links / CTAs | 44×44px | Adequate padding | None |

- **Swipe gestures:** Reading view only — left (next section), right (back). Velocity ≥0.3px/ms, distance ≥75px. SRS cards: tap-to-flip, no swipe.
- **Long press:** On vocabulary tokens → character detail bottom sheet. Prevent default text selection via `user-select: none` on token elements.
- **Passive listeners:** All `touchstart`, `touchmove`, `scroll` events registered with `{ passive: true }`.
- **Custom gesture recognizer:** ~800 bytes gz, no external library.

### 9.2. Bottom Tab Bar Spec

```
Height:           56px + env(safe-area-inset-bottom)
Tabs:             Stories | Review | Home | Me
Icon size:        24×24px (outlined inactive, filled active)
Label font:       10px, system font
Active color:     Vermillion #C8102E (icon + label)
Inactive color:   #6B6B6B (icon + label)
Transition:       Icon outline→fill morph, 200ms ease-out
Badge (Review):   Red dot (1–9), numeral (10–49), "50+" cap
                  8px diameter dot, top-right of icon
                  Badge count sourced from IDB, no network fetch
Tab switch:       Content cross-fade, 150ms ease-in-out
Visibility:       Authenticated only; hidden at ≥768px
```

### 9.3. Responsive Breakpoint System

| Token | Range | Nav | Reading column | SRS card | Dashboard |
|---|---|---|---|---|---|
| `sm` | 0–599px | 48px top + 56px bottom tabs | Full bleed, `p: 16px`, ZH 20px / EN 15px | `w: calc(100vw-32px) max 360px`, h: 420px | 1 col stack |
| `md` | 600–1023px | 56px top nav only | `max-w: 640px` centered, `p: 24px`, ZH 22px / EN 16px | w: 380px, h: 440px | 2 col grid |
| `lg` | 1024px+ | 56px top nav only | `max-w: 720px` + optional vocab sidebar, `p: 32px`, ZH 24px / EN 17px | w: 400px, h: 460px | 3 col layout |

- **Approach:** Mobile-first, `min-width` media queries only.
- **Container queries:** Used for reading column and card components (`@container`).
- **ZH line-height:** 1.8. **EN line-height:** 1.6. **ZH letter-spacing:** 0.02em.
- **CSS budget:** <8KB gz shell, <3KB gz per page.

### 9.4. PWA Install Strategy

| Trigger | After 3rd story completion OR 2nd review session (whichever first) |
|---|---|
| **UI** | Custom bottom sheet (not browser default) |
| **Content** | 48px icon, "Add LongLore to Home Screen", value prop: "Read offline • Track streak • Instant launch", Vermillion CTA, "Not now" text dismiss |
| **Dismiss logic** | Hides 14 days; after 3 dismissals, never again (IDB) |
| **Timing** | On dashboard or post-story completion — NEVER mid-reading |
| **iOS** | Manual instruction sheet with Safari share screenshots |
| **Post-install** | Detect `display-mode: standalone`, hide install CTAs, show one-time welcome toast |
| **Metrics** | Track: banner_shown → banner_dismissed → banner_accepted → install_completed |

### 9.5. Offline Experience Spec

**Tier 1 — Always Available Offline:**
- App shell (HTML/CSS/JS/icons/fonts) — precached
- Cached stories (last 5 read + user-pinned downloads)
- SRS review cards for pending items (from IDB)
- Review scoring (writes to IDB, syncs later)

**Tier 2 — Stale Data Offline:**
- Dashboard stats (last-known, grayed timestamp "Last updated 2h ago")

**Tier 3 — Online Only:**
- Story discovery/browsing (uncached), account settings, payment

**Offline Indicator:**
```
Position:     Top of viewport, above all content
Height:       4px banner (collapsed) / 28px (expanded with text)
Background:   Vermillion #C8102E
Text:         "You're offline — cached content available" · white · 12px
Animation:    translateY(-100%) → translateY(0), 300ms ease-out
Reconnect:    Green #2E7D32 "Back online" flash, 1.5s, then dismiss
```

**Non-cached story tap:** Custom offline fallback page (precached) listing available cached stories.

### 9.6. Service Worker Architecture

| Resource | Strategy | Cache name | Limits |
|---|---|---|---|
| App shell (HTML, CSS, JS, manifest) | **Precache** (install) | `precache-v{hash}` | ~80KB gz |
| Story content pages | **StaleWhileRevalidate** | `stories-cache` | 30 entries, 7-day expiry |
| Font files | **StaleWhileRevalidate** | `fonts-cache` | 10 entries, 30-day |
| Static images | **CacheFirst** | `images-cache` | 60 entries, 30-day |
| API responses | **NetworkFirst** | `api-cache` | Fallback to IDB |
| Review POST | **BackgroundSync** | Queue: `review-queue` | 24h retry window |

- **SW file size:** <5KB gz.
- **Workbox modules:** `workbox-precaching`, `workbox-strategies`, `workbox-expiration`, `workbox-background-sync`.
- **Update flow:** `skipWaiting()` + `clients.claim()`, toast "LongLore updated — tap to refresh". No forced reload.
- **Persistent storage:** Request `navigator.storage.persist()` after 3rd session.
- **Cache budget cap:** 50MB total. Warning at 45MB with story management UI.
- **Safari fallback for Background Sync:** `navigator.onLine` event-driven replay on reconnect.

### 9.7. View Transitions & Animation Spec

| Animation | Duration | Easing | Properties | Fallback |
|---|---|---|---|---|
| Page navigation (cross-fade) | 200ms | ease-in-out | opacity | Instant swap |
| Story card → detail (hero) | 300ms | ease-out | transform, opacity | Cross-fade 200ms |
| SRS card flip | 500ms | cubic-bezier(0.4,0,0.2,1) | rotateY(180deg) + shadow | Cross-fade 200ms |
| Score button press | 100ms down, 150ms up | ease | scale(0.95) → scale(1) | No animation |
| Tab icon morph | 200ms | ease-out | fill/outline swap | Instant swap |
| Pull-to-refresh | 800ms spin loop | linear | rotate(360deg) | Refresh button in header |
| Offline banner | 300ms | ease-out | translateY | Instant show |

- **Rules:** Only animate `transform` and `opacity`. Use `will-change: transform` during animation, remove after.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` → disable all transitions except essential state changes (card flip becomes cross-fade).
- **Low memory (`deviceMemory < 4`):** Same reduced set. No View Transitions API, no pull-to-refresh gesture.
- **Scroll restoration:** `history.scrollRestoration = 'manual'`. Forward → top. Back → stored position (sessionStorage). Reading view: restore by paragraph index.

### 9.8. Keyboard & Input Spec

- **Email input (magic link):** `type="email" inputmode="email" font-size: 16px` (prevents iOS zoom). Positioned in upper third of screen.
- **Virtual keyboard handling:** `visualViewport` API to detect keyboard height. Shift form container up by `innerHeight - visualViewport.height`.
- **SRS review:** No keyboard. Tap-only interaction. If future "type pinyin" mode added: card remains centered above keyboard via `visualViewport` adjustment.
- **Accessibility:** All interactive elements carry `aria-label`. Card: `role="button"`. Tab bar: `role="navigation"` + `role="tab"`. Focus moves to first score button after card flip.

### 9.9. Low-End Device Strategy

| Item | Specification |
|---|---|
| **Floor device** | Moto G Power 2022 (Helio G37, 4GB RAM, 720×1600) |
| **DevTools throttle** | CPU 4×, Network Slow 3G |
| **Lighthouse targets** | Perf ≥90, A11y ≥95, PWA 100 |
| **JS budget** | <15KB gz/page (shell ~3KB + Svelte ~4KB + islands ≤8KB) |
| **Image budget** | Hero max 80KB WebP, `loading="lazy"` + `decoding="async"` |
| **CI enforcement** | Lighthouse CI on every PR, fail if budget exceeded |
| **Real device testing** | Monthly on BrowserStack (Moto G Power, Samsung Galaxy A13) |
| **Data Saver mode** | Settings toggle: disables images, reduces font scale |
| **Graceful degradation** | <4GB RAM or prefers-reduced-motion: no View Transitions, no pull-to-refresh, card flip → cross-fade |

### 9.10. Native App Readiness Assessment

| Decision | Detail |
|---|---|
| **Phase 1 (Launch)** | PWA only. Maximize Web Push (Android + iOS 16.4+ installed PWAs). |
| **Phase 2 (Month 8–12)** | Evaluate Capacitor wrap if PWA install <15% or App Store presence needed for market credibility. |
| **Capacitor prep (do now)** | Abstract platform APIs behind `src/lib/platform.ts` — `vibrate()`, `share()`, `storage`, `push`. Near-zero overhead. |
| **Capacitor effort** | Initial wrap: 2–3 days. Push notifications: +3–5 days. |
| **Sync compatibility** | Dual-path strategy (Background Sync + `onLine` fallback) already works in Capacitor WebView. |
| **Push roadmap** | PWA: VAPID Web Push. Capacitor: FCM (Android) + APNs (iOS). Notification types: daily review reminder, streak-at-risk (8 PM local), new story alert. |
| **No-go for Capacitor** | Do not use Capacitor-specific storage or plugins before Phase 2. Keep IDB as the single source of truth. |

### Unresolved Disagreements

1. **Home vs. Review tab as default landing (B3's proposal):** B3 wants to redirect to Review tab when ≥10 reviews pending. Others prefer always landing on Home/Dashboard. **Resolution: A/B test post-launch** — track 7-day retention for both flows.
2. **Dark mode timeline:** C10 raised it; group agreed it's post-MVP. No dark-mode CSS custom properties shipped at launch, but design tokens should use CSS variables to make it addable without refactoring.
3. **"Type the pinyin" review mode:** A7 mentioned it. Deferred to post-MVP — keyboard handling for this mode is designed but not built at launch.
---

## 10. Technical Architecture


### 1. SSG Decision: Migrate to Astro 5

**Rationale**: Hexo lacks island architecture, TypeScript support, and modern content tooling. At only 4 articles and ~400 lines of build plugins, migration cost is minimal and grows with content volume.

**Migration plan**:
| Week | Deliverable |
|------|-------------|
| 1 | Astro scaffolding, `tokens.css`, remark `cnlesson` plugin, 4 articles migrated |
| 2 | Svelte islands: lesson interactivity (word popover, translation toggle, audio), SRS review card |
| 3 | Auth UI island, platform-api client, service worker, Cloudflare Pages config |
| 4 | Unit tests (SRS), Worker integration tests (sync, auth), Lighthouse CI, staging deploy |
| 5 | Buffer + production cutover, SEO verification, `_redirects`, old deploy removal |

**Fallback**: If SRS Svelte port slips, ship SRS engine as vanilla JS `<script>` and port in Phase 2.

---

### 2. Frontend Framework: Svelte 5 (with Astro Islands)

**Rationale**: Best DX for 1-2 devs. Built-in animation primitives (`transition:`, `animate:`, `tweened`) eliminate need for animation libraries. Runes (`$state`, `$derived`, `$effect`) provide clean reactivity. Compiled output is ~2 KB runtime overhead. Island scope is small (5-6 components), so Svelte's smaller ecosystem is not a risk.

**Islands inventory**:
| Island | Hydration | Estimated Size (gz) |
|--------|-----------|---------------------|
| `WordPopover.svelte` | `client:visible` | ~1.5 KB |
| `TranslationToggle.svelte` | `client:visible` | ~0.8 KB |
| `AudioPlayer.svelte` | `client:visible` | ~0.5 KB |
| `SrsReview.svelte` | `client:idle` | ~6 KB |
| `AuthModal.svelte` | `client:idle` | ~3 KB |
| `DarkModeToggle.svelte` | `client:load` | ~0.3 KB |

**Total island JS per lesson page**: ~12 KB gz (within 15 KB budget).
**Non-lesson pages** (home, archives): ~0.3 KB gz (dark mode toggle only).

---

### 3. CSS Architecture

**Approach**: CSS custom properties (design tokens) + Astro scoped styles. No Tailwind. No Fluid theme.

**Design tokens** (`src/styles/tokens.css`, ~30 variables):
```
/* Colors */
--color-bg, --color-surface, --color-surface-raised
--color-text, --color-text-muted, --color-text-inverse
--color-primary (#2563eb), --color-primary-hover, --color-accent
--color-success, --color-warning, --color-error

/* Typography */
--font-body: 'LXGW WenKai Screen', serif
--font-mono: 'JetBrains Mono', monospace
--font-size-{sm,base,lg,xl,2xl}
--line-height-{tight,normal,relaxed}

/* Spacing */
--space-{xs,sm,md,lg,xl,2xl} (4px scale)

/* Shape */
--radius-{sm,md,lg,full}
--shadow-{sm,md,lg}

/* Animation */
--duration-fast (150ms), --duration-normal (300ms), --duration-slow (500ms)
--easing-default (cubic-bezier(0.4, 0, 0.2, 1))
```

**Dark mode**: `[data-theme="dark"]` selector overrides color tokens. Toggled by `DarkModeToggle.svelte` island. Respects `prefers-color-scheme` on first load via inline `<script>` in `<head>` (no FOUC).

**Font loading**: LXGW WenKai Screen via jsDelivr CDN with `font-display: swap`. Subset to SC (Simplified Chinese) variant (~1.5 MB). Fallback stack: `'Noto Serif SC', 'Songti SC', serif`.

**Estimated total CSS**: ~6 KB gz (down from current 10.5 KB custom + ~80 KB Fluid).

---

### 4. Content Pipeline

**Authoring format**: Markdown with `:::cnlesson` fenced directives (remark-directive plugin). YAML content blocks unchanged from current format. Parsed by custom remark plugin (~150 lines).

**Example**:
```markdown
:::cnlesson
paragraphs:
  - sentences:
    - en: "The emperor received the Mandate of Heaven."
      zh: "皇帝受命于天。"
      segments:
        - { text: "皇帝", gloss: "emperor", pinyin: "huángdì" }
        - { text: "受命", gloss: "received the mandate", pinyin: "shòumìng" }
:::
```

**Validation**: Zod schema validates every cnlesson block at build time. Errors fail the build with clear messages (missing pinyin, invalid segment structure).

**Content collections**: Astro content collections with typed frontmatter schema (title, date, difficulty, tags, premium flag).

**Generated APIs**:
- `/api/vocabulary.json` — Astro static endpoint, replaces `vocabulary-manifest.js`
- `/api/articles-meta.json` — Astro static endpoint

**Authoring workflow**: Write `.md` → `astro dev` for instant preview → PR → Lighthouse CI on preview deploy → merge → auto-deploy.

---

### 5. Performance Budgets

| Metric | Budget | Measurement |
|--------|--------|-------------|
| **LCP** | < 1.8s (non-China) / < 2.5s (China) | Lighthouse CI, `web-vitals` RUM |
| **FID / INP** | < 100ms | `web-vitals` RUM |
| **CLS** | < 0.05 | Lighthouse CI, `web-vitals` RUM |
| **Total JS (critical)** | < 15 KB gz per page | CI size check |
| **Total CSS** | < 8 KB gz | CI size check |
| **TTI** | < 3.5s on Moto G4 (simulated) | Lighthouse CI |
| **Total page weight** | < 150 KB gz (excl. fonts/images) | CI size check |
| **Service worker** | < 3 KB gz | CI size check |
| **Font (CJK)** | < 1.5 MB (cached after first load) | Manual check |

**Enforcement**: Lighthouse CI in GitHub Actions fails the build if LCP, CLS, or TTI budgets are exceeded. JS/CSS size checks via a custom CI step.

---

### 6. Build & Deploy Pipeline

**Package manager**: `pnpm` (strict deps, 3x faster installs, workspace support for workers).

**CI/CD (GitHub Actions)**:
```yaml
# .github/workflows/deploy.yml
jobs:
  build:
    steps:
      - pnpm install --frozen-lockfile
      - astro check          # TypeScript/template validation
      - astro build           # Generate static site
      - vitest run            # Unit + Worker integration tests
      - size-check            # Fail if JS > 15KB gz or CSS > 8KB gz

  preview:
    if: github.event_name == 'pull_request'
    steps:
      - wrangler pages deploy ./dist --branch=${{ github.head_ref }}
      - lighthouse-ci (against preview URL)
      - Comment results on PR

  deploy:
    if: github.ref == 'refs/heads/main'
    steps:
      - wrangler pages deploy ./dist --project-name=longlore

  workers:
    strategy:
      matrix:
        worker: [auth, sync, payment, media]
    steps:
      - wrangler deploy (in workers/${{ matrix.worker }}/)
```

**Preview deploys**: Every PR gets a Cloudflare Pages preview URL. Lighthouse CI runs against it.

**Deploy target**: Cloudflare Pages only (drop GitHub Pages dual-deploy).

---

### 7. Testing Strategy

| Layer | Tool | Scope | Coverage Target | When |
|-------|------|-------|-----------------|------|
| **Unit** | Vitest | SM-2 algorithm (interval, ease factor, next review calculations) | 100% | Phase 1 |
| **Unit** | Vitest | Remark cnlesson plugin (parsing, validation, HTML output) | 90% | Phase 1 |
| **Integration** | Vitest + Miniflare v3 | Sync Worker (save, retrieve, delta sync) | Key paths | Phase 1 |
| **Integration** | Vitest + Miniflare v3 | Auth Worker (OAuth flow, JWT issue/verify, session management) | Key paths | Phase 1 |
| **Performance** | Lighthouse CI | LCP, CLS, TTI, bundle sizes | Budget gates | Phase 1 |
| **E2E** | Playwright | Read article → save word → SRS review flow | 3 critical paths | Phase 2 (10+ articles) |
| **Integration** | Vitest + Miniflare v3 | Payment Worker (Stripe webhooks) | Key paths | Phase 2 (paying users) |

---

### 8. Monitoring Stack

| Tool | Purpose | Cost | Phase |
|------|---------|------|-------|
| **Cloudflare Analytics** | Page views, Web Vitals (CWV), bandwidth | Free (included with Pages) | 1 |
| **`web-vitals` v4** | Real User Monitoring — LCP, INP, CLS reported to Worker endpoint | Free (1.5 KB gz library) | 1 |
| **CF Workers Analytics Engine** | Custom events: word saves, reviews completed, articles read, auth events | Free (25 writes/s) | 1 |
| **Sentry (free tier)** | JS error tracking with source maps, 5K events/month | Free | 1 |
| **D1 `review_log` table** | SRS review quality distribution (detect if algo is miscalibrated) | Free (existing) | 1 |

**Alerting**: Sentry alerts on new JS errors. Manual weekly review of CWV dashboards. Automated alerting deferred until DAU > 1K.

**A/B testing**: Cloudflare Worker edge-side variant selection via cookie. Log variant to Analytics Engine. No client-side A/B library needed.

---

### 9. Progressive Enhancement Rules

| Feature | Without JS | With JS |
|---------|-----------|---------|
| **Article reading** | ✅ Full text visible (CN + EN inline, pinyin as `<ruby>`) | Enhanced: translation toggles, clean layout |
| **Word definitions** | ✅ Visible as inline annotations | Enhanced: popover with gloss, pinyin, audio, "Save" button |
| **Audio playback** | ❌ No audio | ✅ Inline audio player via island |
| **SRS review** | ❌ Not available | ✅ Full review cards with quality rating |
| **Authentication** | ❌ Not available | ✅ OAuth modal, session management |
| **Dark mode** | ✅ Respects `prefers-color-scheme` via CSS | Enhanced: manual toggle persisted to localStorage |
| **Navigation** | ✅ All links work | Same |
| **Search** | ❌ Not available (future feature) | Future: client-side search |

**Inline `<head>` script** (~200 bytes, blocks render): reads `localStorage` theme preference or `prefers-color-scheme` and sets `data-theme` attribute. Prevents dark mode FOUC.

---

### 10. Migration Plan (Step-by-Step)

```
Phase 0 — Prep (Days 1-2)
├── Init Astro 5 project in new branch
├── Configure @astrojs/svelte, @astrojs/sitemap
├── Create tokens.css with 30 design tokens
├── Port _config.yml settings to astro.config.mjs
└── Set up pnpm workspace (site + workers)

Phase 1A — Content (Days 3-5)
├── Write remark-cnlesson plugin (~150 lines)
├── Add Zod schema for cnlesson + frontmatter validation
├── Convert 4 articles: {% cnlesson %} → :::cnlesson (sed script)
├── Create Astro content collection with typed schema
├── Build vocabulary.json + articles-meta.json endpoints
└── Verify: `astro build` produces correct HTML + API JSON

Phase 1B — Islands (Days 6-10)
├── WordPopover.svelte — gloss, pinyin, audio, save button
├── TranslationToggle.svelte — show/hide Chinese per sentence
├── AudioPlayer.svelte — play audio from R2 via media Worker
├── SrsReview.svelte — card flip, quality buttons, IndexedDB
├── AuthModal.svelte — Google OAuth, magic link, profile
├── DarkModeToggle.svelte — theme switch + localStorage
├── Port platform-api.js to TypeScript module
└── Port sync.js to TypeScript module

Phase 1C — Infrastructure (Days 11-14)
├── Minimal service worker (cache shell, bundles, fonts)
├── Cloudflare Pages deploy config (wrangler.toml)
├── _redirects file for URL preservation
├── robots.txt, sitemap.xml, manifest.json
└── Preview deploy working on PR branch

Phase 1D — Quality (Days 15-19)
├── Vitest: SRS algorithm unit tests (100% coverage)
├── Vitest: remark-cnlesson plugin tests
├── Vitest + Miniflare: sync + auth Worker tests
├── Lighthouse CI in GitHub Actions (budget gates)
├── Bundle size CI check (JS < 15KB, CSS < 8KB)
├── Sentry integration + source map upload
└── web-vitals reporting to Analytics Engine Worker

Phase 1E — Cutover (Days 20-22)
├── Production deploy to Cloudflare Pages
├── Verify all 4 article URLs resolve (no 404s)
├── Google Search Console: submit new sitemap
├── Verify OAuth callbacks work with new domain
├── Remove Hexo deploy from CI
├── Monitor Sentry + CWV for 48 hours
└── Done ✅
```

**Total: ~5 weeks (22 working days + buffer)**

---

### 11. Phase 1 Technical Scope (MVP)

**Ships**:
- Astro 5 site with Svelte 5 islands
- 4 articles with full cnlesson interactivity (popover, toggle, audio)
- SRS review engine (SM-2, IndexedDB, cloud sync)
- Authentication (Google OAuth, magic link)
- Dark mode
- PWA (offline reading, offline SRS review)
- Performance: < 1.8s LCP, < 15 KB JS gz/page
- CI: Vitest + Lighthouse CI + preview deploys
- Monitoring: Sentry + CF Analytics + web-vitals RUM

**Does NOT ship** (Phase 2):
- Onboarding wizard
- Comments (Giscus)
- Payment/paywall enforcement
- Analytics dashboard
- Anki export
- Keyboard shortcuts
- E2E tests
- A/B testing infrastructure
- ICP license / China CDN optimization

---

### 12. Unresolved Disagreements

| Topic | Position A | Position B | Resolution Path |
|-------|-----------|-----------|-----------------|
| **SRS algorithm** | D4: Switch to FSRS-5 (better retention modeling) | D1: SM-2 is proven, don't change during migration | Defer to Phase 2. Keep SM-2 for migration. Evaluate FSRS-5 with A/B test later. |
| **Font hosting** | C6: Self-host from R2 (control, no third-party dependency) | D8: jsDelivr CDN (faster, cached across sites) | Use jsDelivr initially. Self-host if CDN reliability issues arise. |
| **Monorepo** | D3: Single repo (site + workers) with pnpm workspaces | D7: Separate repos for site and workers (independent deploy cycles) | Keep monorepo. Workers already in `workers/` dir. pnpm workspaces make shared code easy. |
| **Search** | B6: Client-side search (Pagefind, 30 KB) is essential for MVP | B2: Search is Phase 2 — 4 articles don't need search | Phase 2. Revisit at 15+ articles. Pagefind integrates trivially with Astro when ready. |
---


## Appendix A: Unresolved Disagreements

Items below were debated but not fully resolved. Each should be resolved through prototyping, A/B testing, or user research.

### brand identity


1. **LXGW WenKai adoption path:** D-group wants it opt-in only forever (performance). C-group wants it as default after first session (beauty). **Compromise noted but not fully resolved:** default for Pro users, opt-in for free users. Revisit after launch metrics.

2. **Lattice pattern density:** C7 wants dense, intricate lattice patterns as a signature element. D7 warns SVG pattern complexity impacts paint performance on low-end Android devices. **Needs testing:** benchmark on Snapdragon 600-series before committing to complex patterns.

3. **Dynasty color tints scope:** B3 wants every piece of content tagged with a dynasty color. C4 argues this creates visual chaos when browsing mixed-era content. **Partial resolution:** tints apply only to single-story reading view and dedicated era pages, not to mixed feeds/lists.

---

*"Like opening an old, beautiful book in a modern library."* — A3, Round 10. That's the brand.
### ia navigation


### reading experience


1. **Dotted underline vs. background tint for default tokens (C1 vs. C5):** C1's dotted underline won for desktop but C5's concern about interference with character strokes at small sizes on mobile is valid. *Resolution pathway:* A/B test both on mobile devices; use underline for screens ≥768px and background tint (`rgba(45,138,114,0.04)`) for <768px if underline tests poorly.

2. **Mid-story review vs. end-of-story review (A4/B2 vs. A7):** Consensus is mid-story at section breaks with the trigger rules above, but A7's concern about flow disruption is real. *Resolution pathway:* Track skip rates for the first 30 days. If >50% of users in a difficulty tier skip, change default to opt-in prompt for that tier.

3. **Reserved line-height vs. dynamic reflow on pinyin toggle (D1 vs. D8):** D8's approach (collapse ruby space when hidden) won, but the reflow transition must be tested on low-end devices. *Resolution pathway:* If scroll jank is measured at <30fps on Samsung A13 during pinyin toggle, fall back to reserved line-height.

4. **Hero illustration in story header (C9):** Liked by designers, but adds content production burden and page weight. *Resolution pathway:* Defer to v2. Use optional `illustration` field in story frontmatter; render if present, skip if not. Do not block launch.

5. **Per-level font sizing progression (C4):** Broadly accepted but the advanced size (22px) may be too small for users with visual impairments. *Resolution pathway:* Add an accessibility override in reading settings: "Larger text" toggle that adds +2px to all CN sizes. Store in localStorage.
### srs vocabulary


1. **Daily review cap (Free tier):** B2 proposed 20/day with uncapped maintenance reviews. B10 flagged revenue risk — if free users never feel friction on reviews, conversion weakens. **Resolution needed:** A/B test 10 vs 20 at launch, measure Pro conversion rate at 30 days.

2. **Pinyin visibility on card front:** A2 (beginners) want it always visible. A9 (advanced) wants it hidden. **Consensus for now:** Hidden by default with a tap-to-reveal hint icon. Add a global setting "Always show pinyin" in user preferences (Phase 1.1).

3. **Audio pronunciation:** Web Speech API is zero-cost but inconsistent across devices. Premium recorded audio is higher quality but adds storage + cost. **Consensus:** Ship with Web Speech API in Phase 1. Evaluate user feedback. Budget for premium audio files as a Phase 2 Pro feature.

4. **Stroke order:** High learner demand (especially A4, A7), but significant scope. **Parked for Phase 2.** Placeholder in the Word Detail View signals intent.

5. **Knowledge-based achievements:** B4 proposed achievements tied to historical eras. Requires a taxonomy of words by dynasty/era and is content-dependent. **Parked for Phase 2** after sufficient story content exists to make it meaningful.

---

### IndexedDB Schema Summary

```
Store: vocabulary
  Key: id (ulid)
  Fields: hanzi, pinyin, english, storyId, sentenceContext,
          stage, easeFactor, interval, repetitions,
          nextReview, lastReview, createdAt, updatedAt
  Indexes: nextReview, storyId, easeFactor

Store: reviewLog
  Key: id (ulid)
  Fields: date, cardId, score, responseTimeMs
  Indexes: date, cardId

Store: pendingSync
  Key: id (ulid)
  Fields: operation, table, payload, timestamp
  Indexes: timestamp
```
### dashboard


```
① Sparkline Placement
   Option A: Inside the "Today's Reviews" stat card (reduces card count)
   Option B: Standalone "Weekly Trends" card (more space, clearer)
   LEANING: Option A (inside stat card) — B7 recommendation
   ACTION: Prototype both, A/B test post-launch

② Heatmap Click on Mobile
   Option A: Expand-in-place (consistent with desktop)
   Option B: Navigate to /stats/{date} page (avoids scroll-push)
   LEANING: Expand-in-place for v1.0 (simpler), revisit if scroll
   complaints arise in user testing
   ACTION: Ship expand-in-place, add analytics on usage depth

③ Study Time Tracking
   Request from A8 (advanced learner): show total review minutes/week
   BLOCKED: requires reviewLog schema addition (sessionId, sessionStart)
   ACTION: Defer to v1.1, add schema fields, then surface as 5th stat card

④ Words by Historical Period Breakdown
   Request from A10: "45 三国 words, 23 唐朝 words"
   Not blocked but lower priority — could live in a /stats page
   ACTION: v1.1, dedicated stats page with period-based breakdowns

⑤ Collapsible Sections on Mobile
   A5 concern about scroll depth. Could collapse Stats + Heatmap
   after the first week of use.
   LEANING: Don't collapse by default — users lose discoverability.
   Add a user preference toggle in settings if scroll complaints arise.
   ACTION: Monitor scroll-depth analytics post-launch
```

---

**Total components spec'd: 6 primary + 3 empty states + time rules + upsell system.** All data sourced from client-side IDB (`vocabulary`, `reviewLog`, `settings` stores). Performance budget: FCP <1.5s, TBT <200ms, IDB queries <50ms. Ship as Astro page with Svelte 5 islands for interactive elements only.
### onboarding


1. **Hero Story Content:** A10 argues for HSK3-4; A1 worries even that is intimidating. **Compromise in progress:** Use HSK3-4 text BUT with 2-3 words pre-revealed with pinyin+English inline (not requiring tap), so beginners see they CAN understand it. **Needs A/B testing.**

2. **Save Button Timing:** B10 wants to test showing Save on the 1st tap vs. 3rd tap. B5 hypothesizes 3rd is better. **Agreed to A/B test.** Ship with 3rd-tap as default.

3. **Level Selection vs. Pure Inference:** B6 advocates never asking, just inferring from tap behavior. B4 argues self-selection is faster and more accurate for the first session. **Agreed to A/B test** both approaches, measuring stories-started and 7-day retention.

4. **Magic Link vs. Google-Only:** D4 notes Magic Link adds 30-120s of friction. B7 argues some users distrust Google OAuth for privacy reasons. **Consensus: keep both**, but make Google the visually primary option (larger button, top position).

5. **Personalization Start Point:** B6 says wait until visit 3+. C10 argues even visit 1 can be personalized if we ask one question (level). **Consensus: ask level after signup (visit 1), use it immediately, but don't do behavioral personalization until visit 3+.**

---

*End of brainstorm. All 40 experts have spoken. Ship the prototype.* 🐉
### monetization


### mobile pwa


1. **Home vs. Review tab as default landing (B3's proposal):** B3 wants to redirect to Review tab when ≥10 reviews pending. Others prefer always landing on Home/Dashboard. **Resolution: A/B test post-launch** — track 7-day retention for both flows.
2. **Dark mode timeline:** C10 raised it; group agreed it's post-MVP. No dark-mode CSS custom properties shipped at launch, but design tokens should use CSS variables to make it addable without refactoring.
3. **"Type the pinyin" review mode:** A7 mentioned it. Deferred to post-MVP — keyboard handling for this mode is designed but not built at launch.
### tech architecture


| Topic | Position A | Position B | Resolution Path |
|-------|-----------|-----------|-----------------|
| **SRS algorithm** | D4: Switch to FSRS-5 (better retention modeling) | D1: SM-2 is proven, don't change during migration | Defer to Phase 2. Keep SM-2 for migration. Evaluate FSRS-5 with A/B test later. |
| **Font hosting** | C6: Self-host from R2 (control, no third-party dependency) | D8: jsDelivr CDN (faster, cached across sites) | Use jsDelivr initially. Self-host if CDN reliability issues arise. |
| **Monorepo** | D3: Single repo (site + workers) with pnpm workspaces | D7: Separate repos for site and workers (independent deploy cycles) | Keep monorepo. Workers already in `workers/` dir. pnpm workspaces make shared code easy. |
| **Search** | B6: Client-side search (Pagefind, 30 KB) is essential for MVP | B2: Search is Phase 2 — 4 articles don't need search | Phase 2. Revisit at 15+ articles. Pagefind integrates trivially with Astro when ready. |
