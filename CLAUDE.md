# Trailblaze

Mobile-first PWA that turns daily exercise into virtual world adventures. Log walks/runs/cycles, advance along real city routes, unlock postcards at landmarks.

## Tech Stack

- **React 19** + TypeScript + Vite 6
- **Tailwind CSS 4** with custom dark theme tokens in `src/index.css`
- **Firebase 12**: Auth (email/password), Firestore (real-time listeners)
- **Google Maps JS API**: interactive map, polylines, Street View panorama
- **Google Fit REST API**: optional step import via OAuth2
- **Motion** (Framer Motion): animations, AnimatePresence
- **html-to-image**: JPEG export for postcards and certificates
- **canvas-confetti**: milestone celebrations

## Commands

```bash
npm run dev      # Vite dev server on 0.0.0.0:3000
npm run build    # Production build to dist/
npm run lint     # TypeScript type-check (tsc --noEmit)
npm run clean    # Remove dist/
```

## Environment Variables

```
VITE_GOOGLE_MAPS_API_KEY          # Required — Maps JS + Street View
VITE_GOOGLE_CLIENT_ID             # Optional — Google Fit OAuth (Web app type)
VITE_FIREBASE_API_KEY             # Required — Firebase API key
VITE_FIREBASE_AUTH_DOMAIN         # Required — Firebase auth domain
VITE_FIREBASE_PROJECT_ID          # Required — Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET      # Required — Firebase storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID # Required — Firebase messaging sender ID
VITE_FIREBASE_APP_ID              # Required — Firebase app ID
VITE_FIREBASE_FIRESTORE_DB_ID    # Optional — Firestore database ID (defaults to "(default)")
```

## Project Structure

```
src/
├── App.tsx                    # Root: auth state, tab routing, overlay modals
├── main.tsx                   # React 19 createRoot entry
├── index.css                  # Tailwind @theme tokens + component layer
├── vite-env.d.ts              # Env + Google Identity Services types
├── components/
│   ├── Auth.tsx               # Email/password login & signup
│   ├── ChallengeSetup.tsx     # 3-step flow: route → mode → deadline
│   ├── Map.tsx                # Google Map + Street View + bottom drawer
│   ├── LogActivity.tsx        # Steps/distance input, photo, Google Fit
│   ├── Postcards.tsx          # Waypoint cards + vintage postcard modal
│   ├── Partner.tsx            # Partner sync, invite codes, nudge
│   ├── Profile.tsx            # Stats, streak, settings, reset
│   └── ErrorBoundary.tsx      # Global error catch
└── lib/
    ├── firebase.ts            # Firebase init + error handler
    ├── googlefit.ts           # OAuth flow + Fitness API step query
    ├── routes.ts              # Route definitions: waypoints, paths, postcards
    └── utils.ts               # cn(), formatDistance(), calculateStreak(), getInitials()
```

## Architecture

- **No state management library** — React hooks + Firestore `onSnapshot` real-time listeners
- **Tab-based navigation** — `activeTab` state in App.tsx renders one of 5 components
- **Modals** — postcard unlock + completion certificate rendered as overlays in App.tsx with AnimatePresence
- **Each component manages its own Firestore queries** via `useEffect` → `onSnapshot`

## Firestore Collections

**users/{userId}**: `name`, `email`, `avatarColor`, `units`

**challenges/{challengeId}**: `routeId`, `routeName`, `totalDistanceKm`, `totalDistanceLogged`, `mode` (solo|partner), `creatorId`, `partnerId`, `inviteCode`, `startDate`, `targetEndDate` (nullable), `status` (active|completed)

**logs/{logId}**: `userId`, `challengeId`, `activityType`, `distanceKm`, `date` (YYYY-MM-DD local), `notes`, `createdAt`, `steps` (optional), `photo` (optional base64)

**milestones/{milestoneId}**: `userId`, `challengeId`, `waypointIndex`, `unlockedAt`

Security rules are in `firestore.rules` — must be deployed manually via Firebase Console.

## Route Data (src/lib/routes.ts)

Each route has:
- `waypoints[]`: landmark stops with lat/lng, `distanceFromStart` (real walking km), `funFact`, `postcard` (personalised message), `streetViewHeading`
- `path[]`: dense lat/lng array for the map polyline (hand-drawn along streets, no Directions API)
- `coverImage`: local path to `/images/{city}-cover.jpg`

Distances are calculated from GPS coordinates with 1.35x street-routing factor. Milestones trigger per-waypoint (not percentage-based).

## Key Patterns

### Styling
- All styling via Tailwind utility classes
- Use `cn()` from `src/lib/utils.ts` for conditional classes (clsx + tailwind-merge)
- Dark theme: surface `#1f201b`, background `#13140f`, primary `#a1d494`, accent green `#4ade80`
- `.card` and `.btn-primary` component classes defined in `index.css`
- Icons from `lucide-react` — do not use Material Symbols

### Dates
- All dates in logs use **local time** via `format(new Date(), 'yyyy-MM-dd')` from date-fns
- Never use `toISOString()` for date comparisons (UTC mismatch)
- Streak calculation in `utils.ts` uses local date strings

### Steps → Distance
Walk mode accepts steps, converted via randomised stride: `(steps × stride) / 1000` where stride = 0.72m ± 12% jitter. This is intentional — "element of surprise".

### Postcards & Certificates
- Rendered as DOM elements, captured to JPEG via `html-to-image` (`toJpeg`)
- Wrap the capturable area in a `ref` div, keep action buttons outside
- Share via Web Share API with file attachment, fallback to download

### Street View
- Interactive 360° panorama in Map header (top 1/3)
- Always check coverage via `StreetViewService.getPanorama()` before creating panorama — prevents `imagery_viewer.js` crashes at locations with no coverage
- Falls back to static Street View image, then route cover image

### Google Fit Import
- Only shown when `VITE_GOOGLE_CLIENT_ID` is set
- Uses Google Identity Services (`google.accounts.oauth2.initTokenClient`)
- Queries `fitness/v1/users/me/dataset:aggregate` for today's step_count.delta
- Pre-fills the steps input; user confirms with Log It

## Deployment

Netlify from GitHub `main` branch. Config in `netlify.toml`:
- Build: `npm run build`
- Publish: `dist/`
- SPA redirect: `/* → /index.html` (200)

Netlify env vars: `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_CLIENT_ID`, `VITE_FIREBASE_*` (all 7 Firebase vars)

## Adding a New Route

1. Add a `Route` object to `routes[]` in `src/lib/routes.ts`
2. Include `waypoints` with real GPS coords and cumulative walking `distanceFromStart`
3. Include `path` array with 20-30 intermediate lat/lng points following streets
4. Add cover image to `public/images/`
5. Set `coverImage` to `/images/{name}-cover.jpg`
6. Run `npm run lint` to type-check
