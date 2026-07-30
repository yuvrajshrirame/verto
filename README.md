<div align="center">
  <img src="./public/verto-logo.png" alt="VERTO. Logo" width="220" />

  <br />
  <br />

  # **VERTO.**
  **Gamified Focus. Neural Telemetry. Unbroken Flow.**

  <p align="center">
    <img src="https://img.shields.io/badge/React-19.2-0f1117?style=for-the-badge&logo=react&logoColor=%2310b981" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.3-0f1117?style=for-the-badge&logo=tailwind-css&logoColor=%2310b981" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Firebase-12.14-0f1117?style=for-the-badge&logo=firebase&logoColor=%2310b981" alt="Firebase" />
    <img src="https://img.shields.io/badge/Spotify_API-Web_Playback-0f1117?style=for-the-badge&logo=spotify&logoColor=%2310b981" alt="Spotify" />
    <img src="https://img.shields.io/badge/Recharts-3.9-0f1117?style=for-the-badge&logo=chart.js&logoColor=%2310b981" alt="Recharts" />
  </p>
</div>

<br />

---

## ✦ Table of Contents 🟩

1. [Project Philosophy](#project-philosophy)
2. [System Architecture](#system-architecture)
3. [Core Modules & Features](#core-modules--features)
4. [The XP & Leveling Layer](#the-xp--leveling-layer)
5. [Audio Telemetry Pipeline](#audio-telemetry-pipeline)
6. [Firestore Database Schema](#firestore-database-schema)
7. [Component Tree](#component-tree)
8. [Component Reference (Deep Dive)](#component-reference-deep-dive)
9. [Environment Initialization](#environment-initialization)
10. [Installation & Deployment](#installation--deployment)
11. [Known Protocols, Failsafes & Quirks](#known-protocols-failsafes--quirks)
12. [Dead Code & Loose Ends](#dead-code--loose-ends)
13. [Security Notes](#security-notes)

---

## Project Philosophy

**VERTO.** is a gamified deep-work tracker built as a single-page React app. Instead of a plain Pomodoro timer, it frames focus sessions as "Focus Nodes," converts logged time into XP, and layers social accountability on top via public leaderboards and small private "Groups" (internally called *guilds*). The whole UI leans into a strict cyber-editorial aesthetic — glassmorphic panels, monospace labels, emerald (`#10b981`) accents on a near-black (`#030712`) base — carried consistently across every screen, including error states and empty states.

There is no custom backend. Every piece of state lives in the browser or in Firestore, and every "system" (GitHub sync, Spotify playback, leaderboards) is implemented as direct client-side calls to a third-party API.

---

## System Architecture

- **Frontend:** React 19 (`react` / `react-dom` ^19.2), bundled with Vite 8.
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss` + `@import "tailwindcss"` in `src/index.css`) — no `tailwind.config.js` theme customization; the entire cyber-glass look is achieved with inline utility classes (arbitrary values, `backdrop-blur`, layered `shadow-[...]`, gradient borders) rather than design tokens.
- **Database:** Firestore (NoSQL), read with a mix of one-shot `getDocs` calls and live `onSnapshot` listeners.
- **Auth:** Firebase Auth, GitHub provider only (`GithubAuthProvider`), with the `repo` OAuth scope requested up front so the app can push commits on the user's behalf later (see Daily Sync below).
- **Charts:** Recharts (`BarChart`, `PieChart`) for the Analytics Core.
- **Icons:** `lucide-react`.
- **Routing:** `react-router-dom` is installed but **not used** — the whole app is a single `App.jsx` component that swaps between views with local state (`currentView`), not routes. See [Dead Code & Loose Ends](#dead-code--loose-ends).

There is no `firestore.rules` file in the repo, so security rules live outside this codebase (in the Firebase console) — see [Security Notes](#security-notes).

---

## Core Modules & Features

### Authentication & Session
GitHub sign-in via a Firebase popup. On success, the GitHub OAuth access token is pulled out of the credential and stashed in `localStorage` (`github_token`) — this is what later authorizes the Daily Sync feature to write to the user's GitHub repos. Firebase's own `onAuthStateChanged` drives the `user` state for the rest of the app.

### The Neural Timer Engine ("Focus Node")
A category-tagged stopwatch (not a fixed-length Pomodoro) that:
- Anchors elapsed time to `Date.now()` rather than counting `setInterval` ticks, so backgrounded/throttled tabs don't cause the displayed timer to drift.
- Hard-caps a single session at **4 hours (14,400s)**, at which point it auto-pauses and shows a warning.
- Converts logged seconds into XP at **10 XP per minute** on save.
- Persists as a **draggable floating widget** (via `createPortal` into `document.body`) whenever the user navigates away from the Focus tab while a session is running or has unsaved time — implemented as a second `return` branch inside `Timer.jsx` (`isBackground` prop), not a separate component.
- Warns on tab close (`beforeunload`) if there's unsaved time.

### Categories ("Focus Nodes")
User-defined tags with a name, a preset color (7 swatches), and an icon (11 curated Lucide icons). Stored per-user in the `categories` collection and required before a session can be logged.

### Activity Log & Global Leaderboard
A single tabbed panel (`Feed.jsx`):
- **Activity Log** — a live (`onSnapshot`) list of the user's own sessions, editable (adjust logged minutes, which recalculates XP) and deletable inline.
- **Leaderboard** — a one-shot aggregation across *every* session document in the database, grouped by `uid` and summed into total XP, sorted descending. This runs a full collection scan client-side — see [Known Protocols, Failsafes & Quirks](#known-protocols-failsafes--quirks).
- Both lists use **dynamically computed pagination**: an effect measures the available container height and divides by an assumed 80px row height to decide how many rows fit, rather than using a fixed page size.

### Groups ("Guilds")
Small (max 10 member) accountability pods, stored in Firestore as `guilds` (the UI calls them "Groups" / "Networks," the schema still uses the original "guild" naming):
- Create a group (random 6-character invite code) or join one by code.
- Per-group leaderboard and a per-member category breakdown ("Network Diagnostics"), both computed client-side from a `where("uid", "in", members)` query — Firestore's `in` operator caps this at 10 values, which conveniently matches the 10-member group cap.
- Admin-only controls: rename group, delete group, kick a member. Non-admins can leave.
- Clicking any member opens their public profile card (`UserProfileModal`).

### Analytics Core
Three linked visualizations built from the user's full session history (`AnalyticsDashboard.jsx`):
- A **12-week (84-day) consistency heatmap**, clickable to drill into any day's per-category breakdown.
- A **7-day bar chart** of minutes focused per day (Recharts `BarChart`).
- A **category distribution donut chart** (Recharts `PieChart`) with a "TOTAL" readout in the center and a color-coded legend, using each category's saved color/icon.

### Command Palette
A `Cmd/Ctrl+K` overlay (`CommandPalette.jsx`) with two modes:
- **Command mode** — fuzzy-filtered list of navigation and system actions (switch view, force a Daily Sync, open profile settings, initialize Spotify, sign out).
- **User search mode** — typing `@` switches to searching the `users` collection (filtered to `isPublic == true`), letting you jump straight to any public operator's profile card.
Both modes support full keyboard navigation (arrow keys + Enter).

### Profile Settings
A three-tab modal (`ProfileSettingsModal.jsx`):
- **Identity** — display name, avatar URL, username, and a public/private telemetry toggle that controls leaderboard/profile visibility.
- **Data Export** — downloads all of the user's session documents as a raw JSON file.
- **Danger Zone** — permanently deletes the user's `sessions` and `categories` documents (batched) and then deletes the Firebase Auth account itself, with a re-authentication error path handled explicitly.

### Daily Sync Modal
A GitHub-integration feature that aggregates the current day's *unsynced* sessions and commits a markdown log to a GitHub repo named `verto-activity` under the signed-in user's GitHub username, at `logs/YYYY-MM-DD.md`. It fetches the existing file (if any) via the GitHub Contents API to get its `sha`, then `PUT`s the merged content back using the `github_token` captured at login. A 401 from GitHub anywhere in this flow triggers a forced sign-out with an explanatory message, since it means the cached token has expired or been revoked.

---

## The XP & Leveling Layer

There are actually **two separate leveling systems in this codebase**, and neither of them is wired into the live app:

| System | Where | Status |
|---|---|---|
| Flat XP, no "level," tier badges (`GHOST → RUNNER → HACKER → ADMIN → PRIME` at 0/1,000/5,000/15,000/50,000 XP) with a level-up celebration overlay | `PlayerStats.jsx` | **Not imported anywhere** — fully built but currently disconnected from `App.jsx`. |
| Square-root level curve (`level = floor(sqrt(xp/100)) + 1`) with per-level progress % | `utils/leveling.js` (`calculateLevel`) | **Also unused** — no component imports it. |

What actually drives the visible UI today is much simpler: **1 minute of focus = 10 XP**, computed inline wherever a session is saved or edited (`Timer.jsx`, `Feed.jsx`), and displayed as a raw running total — there's no level/tier shown anywhere in the current `App.jsx` tree. The tier-badge system in `PlayerStats.jsx` is a natural drop-in replacement for the plain XP counter if you want to re-enable it (it only needs a `uid` prop and a mount point).

---

## Audio Telemetry Pipeline

A custom Spotify integration so users never have to tab away to control music.

### PKCE Authentication Handshake
- Generates a cryptographically random code verifier and a SHA-256 code challenge entirely client-side (`src/spotify.js`) — no client secret is ever present in the app.
- Redirect URI is hard-coded to `http://127.0.0.1:5173/callback`, which must match the Spotify Developer Dashboard exactly.
- Tracks the token's exact expiry millisecond in `localStorage` and proactively flags it as expired on the next load rather than waiting for an API call to fail.

### Hybrid Playback Control
- Uses the **Spotify Web Playback SDK** to register a browser-based playback device ("Verto Audio Engine").
- All transport controls (play/pause/seek/next/previous) go through **direct REST calls** to `api.spotify.com`, not the SDK's own methods — this sidesteps SDK/iframe messaging quirks.
- Accepts a pasted Spotify URL or URI (playlist, album, artist, or track) and parses it into the right `context_uri` vs `uris` payload shape automatically.
- Renders a "Load Default Soothing Mix" shortcut pointed at a fixed Spotify playlist URI.

### Real-Time Visual Feedback
Volume and progress sliders are painted with a CSS `linear-gradient` whose stop percentage is recalculated on every tick/drag, giving the "filled track" look without a UI library.

---

## Firestore Database Schema

### `sessions`
| Field | Type | Description |
|---|---|---|
| `uid` | `String` | Firebase Auth UID of the session owner |
| `userName` | `String` | Cached display name at time of logging |
| `userPhoto` | `String` | Cached avatar URL at time of logging |
| `task` | `String` | Category name |
| `taskColor` / `taskIcon` | `String` | Cached category color/icon (survives category renames/deletes) |
| `duration` | `Number` | Focused time in raw seconds |
| `xp` | `Number` | `floor((duration / 60) * 10)` |
| `synced` | `Boolean` | Whether this session has been pushed via Daily Sync |
| `timestamp` | `Timestamp` | Server-side write time |

### `categories`
| Field | Type | Description |
|---|---|---|
| `uid` | `String` | Owner |
| `name` | `String` | Category label (max 20 chars in the UI) |
| `color` | `String` | Hex swatch |
| `icon` | `String` | Key into the shared `ICON_MAP` |
| `createdAt` | `Timestamp` | Server-side write time |

### `guilds` (displayed as "Groups")
| Field | Type | Description |
|---|---|---|
| `name` | `String` | Group display name |
| `admin` | `String` | UID of the creator/owner |
| `members` | `Array<String>` | Member UIDs, capped at 10 by app logic |
| `createdAt` | `Date` | Client-side timestamp (not `serverTimestamp()`) |

The document ID itself *is* the 6-character invite code.

### `users`
| Field | Type | Description |
|---|---|---|
| `displayName` | `String` | Editable display name |
| `photoURL` | `String` | Editable avatar URL |
| `username` | `String` | Unique-ish handle used by `@`-search and profile cards |
| `isPublic` | `Boolean` | Gates visibility on leaderboards and the profile modal |

Written via `setDoc(..., { merge: true })` from `ProfileSettingsModal`, and only created the first time a user opens that modal — until then, a user only exists as scattered `uid`/`userName` fields inside their own `sessions` documents.

---

## Component Tree

```text
src/
├── App.jsx                       # Master layout, auth state, view routing (no react-router)
├── main.jsx                      # React root / StrictMode entry
├── firebase.js                   # Firebase app/auth/Firestore init, GitHub provider + 'repo' scope
├── spotify.js                    # PKCE code verifier/challenge + token exchange
├── App.css                       # Unused leftover from the Vite React template
├── index.css                     # Tailwind import, global scrollbar/animation styles
├── utils/
│   └── leveling.js                # calculateLevel() — currently unused
├── assets/                       # react.svg, vite.svg, hero.png (template leftovers / unused)
└── components/
    ├── Landing.jsx                # Logged-out marketing page + GitHub login modal
    ├── AnimatedBackground.jsx     # Fixed, decorative rotating SVG topographic background
    ├── CommandPalette.jsx         # Cmd/Ctrl+K launcher — commands + @user search
    ├── Timer.jsx                  # Focus Node timer, incl. floating draggable widget (portal)
    ├── Feed.jsx                   # Tabbed Activity Log + global Leaderboard, dynamic pagination
    ├── ManageCategoriesModal.jsx  # CRUD for focus categories; exports the shared ICON_MAP
    ├── GroupDashboard.jsx         # Create/join/manage Groups ("guilds"), group leaderboard
    ├── AnalyticsDashboard.jsx     # 12-week heatmap + 7-day bar chart + category pie chart
    ├── SpotifyEngine.jsx          # Web Playback SDK + REST-based transport controls
    ├── DailySyncModal.jsx         # Aggregates today's sessions, commits a log to GitHub
    ├── ProfileSettingsModal.jsx   # Identity / data export / account deletion tabs
    ├── UserProfileModal.jsx       # Public profile card (own or another operator's)
    └── PlayerStats.jsx            # Tiered XP badge widget — built, but not currently mounted
```

---

## Component Reference (Deep Dive)

**`App.jsx`** — Owns `user`, `currentView`, and every modal's open/closed state. Handles the Spotify OAuth redirect (`?code=` in the URL) alongside Firebase auth on mount. Renders a persistent sidebar (nav: Focus Node / Groups / Audio Engine / Analytics Core) and swaps the main panel by `currentView`. Notably, the Focus tab is kept mounted but `hidden` via CSS rather than unmounted when you switch away — that's specifically what lets `Timer.jsx` detect it's "in the background" and pop out the floating widget instead of resetting.

**`Timer.jsx`** — See "The Neural Timer Engine" under [Core Modules & Features](#core-modules--features) above. Two structurally different JSX returns live in one component, selected by the `isBackground` prop passed from `App.jsx`.

**`Feed.jsx`** — See "Activity Log & Global Leaderboard" under [Core Modules & Features](#core-modules--features).

**`ManageCategoriesModal.jsx`** — Exports `ICON_MAP`, a shared lookup (`Code`, `BookOpen`, `Briefcase`, `Dumbbell`, `Monitor`, `Cpu`, `PenTool`, `Coffee`, `Layout`, `Terminal`, `Activity`) that `Timer.jsx`, `AnalyticsDashboard.jsx`, and others import so a category's icon renders consistently everywhere.

**`GroupDashboard.jsx`** — See "Groups (Guilds)" under [Core Modules & Features](#core-modules--features).

**`AnalyticsDashboard.jsx`** — See "Analytics Core" under [Core Modules & Features](#core-modules--features). All three charts are derived from a single `getDocs` pass over the user's `sessions` on mount; there's no live listener here (unlike the Activity Log).

**`SpotifyEngine.jsx`** — See [Audio Telemetry Pipeline](#audio-telemetry-pipeline).

**`DailySyncModal.jsx`** — See "Daily Sync Modal" under [Core Modules & Features](#core-modules--features).

**`ProfileSettingsModal.jsx`** — See "Profile Settings" under [Core Modules & Features](#core-modules--features).

**`UserProfileModal.jsx`** — Computes a "Focus Tier" label (`Initiate` / `Novice` / `Adept` / `Elite` / `Master` at 100/500/1,500/4,000 XP thresholds) inline — a *third*, independent tiering scheme from the two described in [The XP & Leveling Layer](#the-xp--leveling-layer). If opened with a `groupId` in context, it also computes that user's rank within the group. Respects the `isPublic` flag: private profiles show a locked-telemetry state instead of stats.

**`PlayerStats.jsx`** — Not currently imported by `App.jsx` or anything else. Fully functional badge/tier widget with a level-up modal animation; would need to be dropped into the sidebar or Focus tab and passed a `uid` to go live.

**`Landing.jsx`** / **`AnimatedBackground.jsx`** — Presentation-only, no Firestore/auth logic of their own.

---

## Environment Initialization

Create a `.env` file in the project root:

```env
# FIREBASE
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# SPOTIFY
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
```

> [!IMPORTANT]
> **Firebase:** enable the **GitHub** sign-in provider in the Firebase console (Authentication → Sign-in method) and register a matching GitHub OAuth App with its callback URL pointed at your Firebase auth domain.
>
> **GitHub OAuth scope:** the app requests the `repo` scope on login (`firebase.js`) so Daily Sync can read/write files in the signed-in user's repos. For that feature to work, each user needs a repo literally named `verto-activity` under their own GitHub account — this repo name is currently hard-coded in `DailySyncModal.jsx`, not configurable per-user.
>
> **Spotify:** in the Spotify Developer Dashboard, set the app's Redirect URI to exactly `http://127.0.0.1:5173/callback` (note: `127.0.0.1`, not `localhost` — Spotify treats these as different origins for PKCE).

There is no Firestore security-rules file bundled with the repo — rules need to be authored separately in the Firebase console (see [Security Notes](#security-notes)).

---

## Installation & Deployment

```bash
# 1. Install dependencies
npm install

# 2. Boot the local dev server (bound to 127.0.0.1 to satisfy the Spotify redirect URI)
npm run dev -- --host 127.0.0.1

# 3. Lint
npm run lint

# 4. Build for production
npm run build

# 5. Preview the production build locally
npm run preview
```

---

## Known Protocols, Failsafes & Quirks

- **Re-render-safe timer:** the active Focus Node anchors to `Date.now()` and recomputes elapsed seconds from that anchor each tick, so a throttled/backgrounded browser tab can't cause the on-screen time to fall behind real time.
- **4-hour session cap:** a single Focus Node run auto-pauses at 14,400 seconds with an on-screen warning; the user still has to hit "Log Session" to bank the XP.
- **Floating widget via Portal:** when the Focus tab isn't active but a session is running (or has unsaved seconds), `Timer.jsx` renders a second, draggable UI via `createPortal` straight into `document.body`, so it floats above every other view including modals.
- **Iframe bypass:** all Spotify transport actions (play/pause/seek/skip) go through direct REST calls instead of the Web Playback SDK's built-in controls, avoiding cross-origin iframe messaging bugs.
- **Token-expiry failsafes, twice over:** both the GitHub token (implicitly, via 401 handling in `DailySyncModal.jsx`) and the Spotify token (explicitly, via a stored expiry millisecond checked on load in `App.jsx`) are treated as capable of silently dying, and both paths surface that to the user rather than failing silently.
- **Global leaderboard cost:** `Feed.jsx`'s leaderboard tab does a full `getDocs` over the entire `sessions` collection and aggregates client-side every time it's opened — fine at small scale, but it will not scale gracefully as the number of logged sessions grows, since there's no server-side aggregation or caching.
- **Group queries capped at 10:** Firestore's `where(..., "in", array)` only accepts up to 10 values, which is why group size is capped at 10 members — `GroupDashboard.jsx` explicitly slices `members` to the first 10 before querying.
- **Placeholder avatars:** several components check for and specifically exclude Dicebear-style placeholder URLs (`photoURL.includes('dicebear')`) in favor of a generic `Bug` icon — this suggests an earlier version auto-generated Dicebear avatars that's no longer wired in, but the defensive check remains.

---

## Dead Code & Loose Ends

Worth knowing about if you pick this project back up:

- **`PlayerStats.jsx`** — a complete tier-badge XP widget with a level-up celebration modal, not imported anywhere in the current `App.jsx`.
- **`utils/leveling.js`** — a `calculateLevel()` helper (square-root XP curve) with no importers.
- **`react-router-dom`** — listed in `package.json` dependencies but never imported; the app does all view-switching with local `useState`, not routes.
- **`src/App.css`** and **`src/assets/react.svg` / `vite.svg` / `hero.png`** — left over from the default Vite + React template scaffold; not referenced by any active component.
- **Three separate XP-tiering schemes exist in parallel**: the flat XP counter actually shown in the app, the `GHOST`→`PRIME` badge system in `PlayerStats.jsx`, and the `Initiate`→`Master` "Focus Tier" computed inline in `UserProfileModal.jsx`. None of the three currently reference each other.

---

## Security Notes

- No `firestore.rules` file ships with the repo — access control for `sessions`, `categories`, `guilds`, and `users` needs to be defined directly in the Firebase console before this goes anywhere near production, especially since the leaderboard and group features intentionally read other users' documents.
- The GitHub access token is stored in `localStorage` (`github_token`) for the lifetime of the session, which is standard for client-only OAuth flows but means it's readable by any script running on the page (e.g. via an XSS bug elsewhere in the app or its dependencies).
- Spotify auth uses PKCE specifically so no client secret has to live in the frontend bundle — this is the correct pattern for a public client and doesn't need a server component.
- `ProfileSettingsModal`'s account deletion path deletes Firestore data and the Firebase Auth user, but does **not** delete the user's `guilds` membership entries or the `users/{uid}` document — a deleted account can leave orphaned references behind in groups they belonged to.

<br />

<div align="center">
  <sub>Built with 💚 by Yuvraj</sub>
</div>