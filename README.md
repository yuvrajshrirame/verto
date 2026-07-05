<div align="center">
  <img src="./public/verto-logo.png" alt="VERTO. Logo" width="220" />

  <br />
  <br />

  # **VERTO.**
  **Gamified Focus. Neural Telemetry. Unbroken Flow.**

  <p align="center">
    <img src="https://img.shields.io/badge/React-18.2.0-0f1117?style=for-the-badge&logo=react&logoColor=%2310b981" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-0f1117?style=for-the-badge&logo=tailwind-css&logoColor=%2310b981" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Firebase-10.8-0f1117?style=for-the-badge&logo=firebase&logoColor=%2310b981" alt="Firebase" />
    <img src="https://img.shields.io/badge/Spotify_API-Web_Playback-0f1117?style=for-the-badge&logo=spotify&logoColor=%2310b981" alt="Spotify" />
  </p>
</div>

<br />

---

## ✦ Table of Contents 🟩

1. [Project Philosophy](#-project-philosophy)
2. [System Architecture](#-system-architecture)
3. [Core Modules & Features](#-core-modules--features)
4. [Audio Telemetry Pipeline](#-audio-telemetry-pipeline)
5. [Database Schema](#-database-schema)
6. [Component Tree](#-component-tree)
7. [Environment Initialization](#-environment-initialization)
8. [Installation & Deployment](#-installation--deployment)
9. [Known Protocols & Failsafes](#-known-protocols--failsafes)

---

## ✦ Project Philosophy 🟩

**VERTO.** is an elite, high-fidelity productivity environment engineered to induce and sustain deep work states. Rejecting the standard, cluttered utility apps, VERTO utilizes a strict cyber-editorial aesthetic, glassmorphic UI framing, and deep, dark-mode styling (`#0f1117` base with `#10b981` emerald accents).

---

## ✦ System Architecture 🟩

VERTO operates on a decoupled client-server model, leveraging **React.js** for the reactive frontend and **Google Firebase** for backend state persistence and authentication.

- **Frontend Rendering:** React 18 in Strict Mode, built with Vite.
- **Styling Engine:** Tailwind CSS, utilizing custom backdrop-blur layers and dynamic `linear-gradient` fills.
- **Database:** Firestore (NoSQL), optimized with `onSnapshot` real-time listeners.
- **Authentication:** Firebase Auth (GitHub Provider), running parallel to a specialized Spotify PKCE auth handshake.

---

## ✦ Core Modules & Features 🟩

### ✦ The Neural Timer Engine
The heart of VERTO. A customizable Pomodoro-style block timer designed to track cognitive endurance.
- **XP Algorithm:** Converts raw seconds into an Experience Point currency (`1 minute = 10 XP` baseline).
- **State Preservation:** Engineered to maintain countdown integrity across component re-renders.

### ✦ Gamification & Global Ranking
- **Lifetime XP Aggregation:** All logged sessions are permanently etched into the Firestore database.
- **Real-Time Leaderboard:** A globally synced ranking board sorting all active users on the network by their total accrued XP.

### ✦ Auto-Scaling Activity Log
- **Dynamic Space Calculation:** Uses `useRef` and window resize listeners to measure available vertical pixels.
- **Algorithmic Pagination:** Mathematically determines how many log entries fit on the screen perfectly.

---

## ✦ Audio Telemetry Pipeline 🟩

VERTO entirely removes the need to switch tabs to change music. It utilizes a custom-built Spotify integration.

### ✦ PKCE Authentication Handshake
- Generates cryptographic Code Verifiers and SHA-256 Code Challenges locally.
- Intercepts dead sessions: the app tracks the exact millisecond the 1-hour Spotify token dies.

### ✦ Hybrid Playback Control
- **Web Playback SDK:** Handles the initialization of the "Verto Audio Engine".
- **REST API Override:** Bypasses internal iframe communication bugs by utilizing direct Spotify REST API calls (`/seek`, `/play`, `/pause`, `/next`).

### ✦ Real-Time Visual Feedback
- **Gradient Telemetry:** Custom CSS injection dynamically paints the volume slider and track progress bar using a `linear-gradient` that tracks completion percentages in real-time.

---

## ✦ Database Schema 🟩

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Auto-generated document ID |
| `uid` | `String` | The Firebase Auth UID |
| `userName` | `String` | Cached GitHub display name |
| `task` | `String` | Designated name of the focus block |
| `duration` | `Number` | Total time focused in raw seconds |
| `xp` | `Number` | Total Experience Points earned |
| `timestamp` | `Timestamp` | Firebase server-side timestamp |

---

## ✦ Component Tree 🟩

```text
src/
├── components/
│   ├── AnimatedBackground.jsx  # Ambient cyber grid canvas
│   ├── Feed.jsx                # Auto-scaling Activity Log
│   ├── SpotifyEngine.jsx       # Audio telemetry and playback hub
│   └── Timer.jsx               # Neural focus engine
├── App.jsx                     # Master Layout & Auth manager
└── spotify.js                  # Cryptographic PKCE utilities
```

---

## ✦ Environment Initialization 🟩

Create a `.env` file in the root of the project:

```env
# FIREBASE NETWORK KEYS
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# SPOTIFY AUDIO PIPELINE
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
```

> [!TIP]
> Ensure your Spotify Developer Dashboard sets the Redirect URI strictly to `http://127.0.0.1:5173/callback`.

---

## ✦ Installation & Deployment 🟩

```bash
# 1. Install dependencies
npm install

# 2. Boot the Local Development Server
npm run dev -- --host 127.0.0.1

# 3. Build for Production
npm run build
```

---

## ✦ Known Protocols & Failsafes 🟩

- **Token Expiry Failsafe:** The app monitors the Spotify token's exact expiry millisecond and preemptively flags dead sessions before playback calls fail silently.
- **Iframe Bypass:** All critical playback actions route through direct REST calls instead of relying on the embeddable iframe, avoiding cross-origin messaging quirks.
- **Re-render Safe Timer:** Countdown state is preserved through component re-renders so an active focus block is never reset by an unrelated UI update.

<br />

<div align="center">
  <sub>Built with 💚 by Yuvraj</sub>
</div>