## Otakon Core Product Spec (Living Doc)

Status: v1.0 (living document; append-only updates)
Owner: Product + Engineering
Source of truth: Supabase + this doc (kept in repo for dev context)

### Vision
An AI companion for gamers that helps in-the-moment while playing on PC and also serves as a gaming assistant for news, discovery, goals, and progress tracking. The ISP (important selling point) is instant, context-aware screenshot assistance from gameplay.

### User Types and Access Modes
- **Authenticated Users (subscription-bound)**
  - **Free**: Limited features and quotas (see Feature Matrix). No Insights subtabs, no hands-free mode, no batch screenshots, no AI-generated tasks in Otaku Diary, no Command Center to modify tabs, no Grounding Search.
  - **Pro (Monthly)**: Full feature set.
  - **Vanguard (Annual)**: Same as Pro, annual subscription.
- **Developer Mode (password-only)**
  - Can switch between Free/Pro/Vanguard tiers without a subscription for testing and QA.
  - Mirrors user experience of the selected tier (except billing).

### Authentication and Entry Flow
1. **Landing Page**
   - Public marketing page.
   - **Waitlist capture** via Supabase (email or minimal form). Data must persist.
   - CTA to **Login**.
2. **Login Page**
   - Auth choices: **Google**, **Discord**, **Email** (magic link or OTP), and **Developer mode** (password-only).
   - Display **PWA install banner** here for non-installed users (Android/iOS). If not logged in, PWA starts here; once logged in and app is later reopened, it starts from Chat.
3. **Initial Splash**
   - Lightweight loading/intro screen post-auth before the Connect to PC flow.

### Connect to PC Flow
1. **Connect to PC Splash Screen**
   - Provide **PC client download** link.
   - Offer **6-digit pairing code** entry or **Skip**.
2. **If paired**: Show **How to use** splash, then go to Chat.
3. **If not paired**: Show **Upgrade to Pro/Vanguard** splash (upsell), then go to Chat.

### Chat Architecture
- **Primary surface where users interact most**.
- Two high-level sections:
  - **Everything Else tab** (single): General chat for gaming news, meta topics, and any non-game-specific queries.
  - **Game Pills** (multiple): One per game context detected in user queries/screenshots. Future messages for that game route to its pill.

#### Game Pill Creation Rules
- If user query implies game-help intent AND a confirming screenshot is present, create/update a **Game Pill** for that game.
- Queries about unreleased games or games not owned remain in **Everything Else**.
- Detection relies on text + image analysis; screenshots confirm ownership.

#### Suggested Prompts (Everything Else)
- Present 4 suggested prompts with distinct templates.
- Cache the first response from these prompts for **24 hours** and reuse across the app to avoid repeated API calls.

#### Per-Tab Features
- **Everything Else**: Includes **Wishlist**.
- **Game Pill**: Includes **Otaku Diary** (tasks + favorites) per game.

### Feature Matrix by Tier
- **Free**
  - Reduced query quota.
  - No Insights subtabs (which are generated via one Gemini 2.5 Pro call when a Game Pill is created/updated).
  - No Hands-Free mode.
  - No Batch screenshots.
  - No AI-generated tasks in Otaku Diary.
  - No Command Center to modify tabs.
  - No Grounding Search for queries.
- **Pro / Vanguard**
  - Full access: Insights subtabs (wiki-style: story so far, missed items, lore, etc.). Tabs can be deleted/renamed via context menu or Command Center.
  - Vanguard = 12-month subscription; Pro = 1-month subscription.
- **Developer Mode**
  - Can toggle between tiers for testing without subscription.

### AI Usage Principles
- Default all calls to **Gemini 2.5 Flash**.
- On Game Pill creation/update for Pro/Vanguard, perform exactly one **Gemini 2.5 Pro** call to generate/update rich, spoiler-aware **Insights subtabs**.
- Strict **1:1 call pattern**: One user-triggered call in, one model call out; no automatic background calls.
- **Context injection**: Use prior user queries, responses, screenshots, and Otaku Diary tasks to personalize outputs and avoid repetition.
- **Caching**: Persist model outputs suitable for reuse (e.g., suggested prompts) across users where applicable.

### Persistence, Sync, and Offline
- All data (auth, profiles, conversations, pills, diary, wishlist, caches, pairing, limits) stored in **Supabase**.
- **Conversations and memory persist across sessions** on all devices.
- **Cross-device sync** via Supabase.
- **Offline-first**: PWA should allow reading local state and queue writes for sync when online.

### Screenshot Capture and Media
- Core ISP: On PC, the client captures **instant screenshots** with a hotkey; the app processes the image to assist.
- Users can **manually upload up to 5 images** to add context.
- Users can **pause/resume manual screenshot collection** so images are queued and added to chat with optional text.
- When paired, a **floating button** in app can remotely trigger PC screenshot capture (no hotkey needed).

### First-Run Profile Setup
- On first entry to Chat, show a **Profile Setup modal** to configure response styles/preferences.
- Each option must produce a **distinct, observable outcome** in responses.
- User can **skip** (use defaults) and later change settings via **Settings modal**.

### PWA Behavior
- Show PWA install UX on the **Login** page.
- If user is not authenticated: PWA opens to **Login**.
- If authenticated and not logged out: PWA opens to **Chat**.
- Offline capabilities through service worker; cache critical assets and essential data reads.

### Payment
- Payments for Authenticated users: **Pending** (not yet implemented). Pro = monthly, Vanguard = annual.

### Governance and Safety
- Supabase **RLS** must protect user data with row-level policies.
- Logs should avoid sensitive content and comply with privacy settings.

### Removal/Conditional UI
- Hide/disable **Insights modal/button** from Settings context menu if **no Insights** exist.

### Non-Goals and Constraints
- No hidden/automatic model calls; all generation is explicitly triggered by the user.
- Keep spoilers within a player’s progress when generating Insights.

### Data Model (High-Level)
- User Profile: id, auth providers, role (free/pro/vanguard), devMode flag, preferences.
- Conversation: id, owner, scope (everythingElse | game:<id>), messages[], createdAt, updatedAt.
- Game Pill: id, gameId/slug, associated conversationId, insightsTabs[], diaryId.
- Insights Tab: id, pillId, title, content, order.
- Otaku Diary: id, pillId, tasks[], favorites[].
- Wishlist Item: id, userId, gameId/slug, releaseDate, metadata.
- Pairing: userId, pairingCode (6-digit), deviceId, status, lastSeenAt.
- Screenshot: id, owner, source (pc/manual), imageMeta, associatedMessageId.
- Caches: key, scope, payload, expiresAt.
- Quotas: userId, period, used, limits by tier.

### Flows (Happy Paths)
1) Landing → Waitlist (Supabase) → Login (PWA banner) → Splash → Connect to PC → (How-to | Upsell) → Chat
2) Chat first-run → Profile Setup (skip or save) → Messages (Everything Else) → Game Pill auto-creation on valid game-help + screenshot
3) Pro/Vanguard Game Pill → One-time Gemini 2.5 Pro call → Insights tabs created → Optional Command Center edits
4) Paired PC → Floating button triggers screenshot → Image auto-attached to chat

### Edge Cases
- Missing/invalid pairing code: show retry, do not block Chat entry.
- Unreleased game queries: always remain in Everything Else.
- Screenshot upload without text: still create/route to Game Pill if game detected.
- Offline actions: queue message sends and local changes for later sync.
- Free tier interacting with Pro features: show upsell callouts consistently.

### Open Questions
- Exact quotas per tier (messages/day, images/day)?
- Payment processor (Stripe?) and subscription change flows.
- Details of Grounding Search sources and limits.
- Hands-Free mode UX and privacy controls.

### Implementation Notes
- Supabase used for: auth, storage, RLS, realtime sync, database for all entities, and durable caches.
- PWA: service worker for offline-first; IndexedDB/local cache for pending writes and quick reads.
- Model adapters: centralize Gemini calls with strict 1:1 enforcement and context injection.

---
This document is append-only. Future updates must be additive and preserve previous content.



### Addendum v1.1 – Clarifications and Corrections

- Grounding Search Policy
  - Suggested Prompts (Canonical 4):
    1) "What's the latest gaming news?"
    2) "Which games are releasing soon?"
    3) "What are the latest game reviews?"
    4) "Show me the hottest new game trailers."
    - The first successful responses to each of the four prompts MUST use grounding when needed and be cached globally in Supabase for 24 hours, then reused across the entire app and all users.
  - Paid Insight Tabs (Latest Data): For Pro/Vanguard only, specific tabs that require up-to-date information (e.g., latest strategies, builds, live multiplayer/meta, latest game help) MAY use grounding with Gemini 2.5 Pro/Flash as appropriate. Tabs such as story, lore, items, bosses MUST avoid grounding and rely on static knowledge.
  - Cutoff: Model knowledge cutoff is January 2025. For content released AFTER January 2025, use grounding calls and cache globally for reuse across users.
  - Enforcement: Implement a single policy module that routes calls to grounding vs. static depending on (a) prompt type (four prompts), (b) tab flags, and (c) cutoff checks.

- Otaku Diary Availability
  - The Otaku Diary tab is available to ALL users (Free/Pro/Vanguard/Developer mode).

- Insights Subtabs by Tier
  - Free: No insights subtabs. Do NOT perform Gemini 2.5 Pro insight calls for Free users.
  - Pro/Vanguard: Insights subtabs enabled. On new game pill creation, perform exactly one Gemini 2.5 Pro call to generate rich tabs; subsequent updates use Flash.

- How-To and Upgrade Splash Logic (PC Client)
  - Show "How to Use" ONLY to users who are paired/connected to a PC client (it teaches the PC client usage).
  - If a Free user is paired, show How-to AND then show the Upgrade (Pro/Vanguard) splash before entering Chat.
  - If not paired, show Upgrade splash (as previously stated), then proceed to Chat.

- Insights Entry Point Visibility
  - Do NOT hide/remove the Insights access when tabs are empty. The previous guidance to hide when empty is cancelled; keep the entry available (no special-case around `otaku-diary`).

- Game Pill Creation Criteria
  - A Game Pill MAY be created from a text-only query when the user asks for game help (image is NOT required). Screenshots, when present, confirm ownership but are not mandatory for pill creation.

### Addendum v1.2 – Pill Creation & Insights Entry Visibility

### Addendum v1.3 – Latest Info Policy, Cutoff, Caching, and News Freshness

- Latest Info (Global for Paid Users)
  - Applies to ANY AI response (not just insight tabs) whose intent is “latest info” (strategies, builds, meta, latest help, patches/updates, trailers, release dates).
  - For Pro/Vanguard: before generating, query the universal cache; if hit, reuse to avoid grounding/API calls. If miss, append cutoff guidance (January 2025) and generate; then persist to universal cache for reuse across the app.
  - For Free: latest-info features remain gated (no grounding), with upsell messaging.

- Four Suggested Prompts (Global 24h Cache, No Repeats)
  - Prompts:
    1) What’s the latest gaming news?
    2) Which games are releasing soon?
    3) What are the latest game reviews?
    4) Show me the hottest new game trailers.
  - First successful responses are grounded (regardless of tier) when cache is empty, cached globally for 24h, and reused across the app and users.
  - Freshness rules: Responses must only include items from the last 7–14 days; exclude older content.
  - Non-repetition: Use recent-content context to avoid repeating items within the freshness window. News uses a 15-day context; other prompts follow the same principle.

- Insight Tabs (Paid Only) – Grounding & Cutoff
  - Tabs marked as requiring latest info use grounding + cutoff guidance for Pro/Vanguard; static tabs never use grounding.
  - Results cached and reused across users when appropriate.

- What Changed (vs Before)
  - Before: Grounding policy uneven; cutoff guidance not consistently applied; Four prompts reused responses but could repeat items; latest-info caching not universal.
  - Now: Unified latest-info policy across AI responses; consistent January 2025 cutoff; 24h global cache for four prompts with non-repetition; paid latest-info answers cached and reused to avoid repeat grounding/API calls.

- Game Pill Creation (All Input Modes)
  - Text-only: Create/route to a Game Pill when intent is game help and a game can be confidently identified.
  - Image-only: Create/route to a Game Pill when a game is detected from the screenshot.
  - Text + Image: Create/route to a Game Pill when either/both confirm game-help intent; prefer image signal for ownership.
  - Note: Screenshots are a strong ownership signal but NOT required. Add guardrails to avoid misidentification; allow user correction.

- Insights Entry Point Visibility
  - Hide the Insights entry point when there are no insight subtabs beyond `otaku-diary`.
  - Show the Insights entry point once at least one non-`otaku-diary` insight tab exists.

### Addendum v1.4 – Centralized Cutoff, One-Time Pro Guard, Free Gating

- Centralized Knowledge Cutoff
  - The model knowledge cutoff label is centralized as a constant and reused across the app: `KNOWLEDGE_CUTOFF_LABEL = "January 2025"`.
  - Applied in `hooks/useChat.ts` (paid latest-info queries append `[KNOWLEDGE_CUTOFF: {LABEL}]`) and in `services/geminiService.ts` prompts for the four suggested prompts (releases, reviews, trailers) to ensure consistency.

- Four Suggested Prompts – Global 24h Cache & No-Repeats (Enforced)
  - First successful responses are grounded when cache is empty and cached globally in Supabase for 24 hours; subsequent requests serve cache app-wide.
  - A 15-day recent-content context is used to avoid repeating items within freshness window.
  - Free-user windows remain supported so the first free user can trigger a fresh grounding fetch when no cache exists.

- One-Time Pro Call Guard (Insights)
  - For paid tiers, the one-time Gemini 2.5 Pro call on new Game Pill creation is protected by a persistent guard per game.
  - Persistence across sessions via localStorage + Supabase app cache; additional Pro calls for the same game are blocked (subsequent insight updates use Flash).
  - Telemetry recorded via API cost logging for observability.

- Free Gating – Hands-Free & Batch Screenshots
  - Hands-Free mode and batch screenshot auto-analysis remain gated for Free users with clear, in-flow upsell messaging.
  - When a `screenshot_batch` is received for Free, images display but are not auto-analyzed; an upsell prompt is shown to upgrade for batch analysis.

