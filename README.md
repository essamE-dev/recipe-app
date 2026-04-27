# Recipe PWA (React + Vite + Express Proxy)

A production-ready Progressive Web App that browses recipes from TheMealDB via a secure Node/Express proxy.

## Features

- Search meals by name, browse categories, and open meal details.
- Local favorites stored in IndexedDB and usable offline.
- PWA setup with installable manifest + service worker + offline fallback page.
- Runtime caching strategies for API and image requests.
- Skeleton loading states, toast notifications, and route-level error boundary.
- Accessible structure with semantic landmarks, keyboard navigation, and labels.

## Tech Stack

- **Client:** React, Vite, TypeScript, Tailwind CSS, shadcn-style UI primitives, TanStack Query, idb, sonner
- **Server:** Node.js, Express, TypeScript, helmet, cors, compression
- **Data Source:** TheMealDB v1 (proxied from server only)

## Project Structure

```txt
recipe-app/
  README.md
  server/
    .env.example
    package.json
    tsconfig.json
    src/
      index.ts
      routes/
        mealdb.ts
  client/
    index.html
    package.json
    postcss.config.cjs
    tailwind.config.cjs
    tsconfig.json
    tsconfig.app.json
    tsconfig.node.json
    vite.config.ts
    public/
      manifest.webmanifest
      offline.html
      icons/
        icon-192.svg
        icon-512.svg
    src/
      App.tsx
      main.tsx
      sw.js
      styles/
        globals.css
      lib/
        api.ts
        queryClient.ts
        utils.ts
      features/
        favorites/
          db.ts
      components/
        app-header.tsx
        error-boundary.tsx
        recipe-card.tsx
        theme-toggle.tsx
        ui/
          badge.tsx
          button.tsx
          card.tsx
          dialog.tsx
          input.tsx
          skeleton.tsx
      pages/
        Home.tsx
        Details.tsx
        Favorites.tsx
```

## Setup

### 0) Run both with one command (optional)

```bash
npm i
npm run dev
```

### 1) Server

```bash
cd server
cp .env.example .env
npm i
npm run dev
```

Default env values:

```env
MEALDB_API_BASE=https://www.themealdb.com/api/json/v1
MEALDB_API_KEY=1
PORT=5174
```

### 2) Client

```bash
cd client
npm i
npm run dev
```

The client calls only `/api/*` routes (proxied by the server in deployment setups where both share origin).

## Available API Proxy Routes

- `GET /api/search?q=...` -> `search.php?s=...`
- `GET /api/meal/:id` -> `lookup.php?i=...`
- `GET /api/categories` -> `categories.php` (in-memory TTL cached)
- `GET /api/filter?category=...` -> `filter.php?c=...`
- `GET /api/random` -> `random.php`

## shadcn Setup Notes (Vite + Tailwind)

This repository already includes shadcn-style component files under `client/src/components/ui`.
If you want to initialize official shadcn tooling on top:

```bash
cd client
npx shadcn@latest init
```

Suggested answers:

- Framework: `Vite`
- TypeScript: `Yes`
- Tailwind config: `tailwind.config.cjs`
- CSS file: `src/styles/globals.css`
- Alias: `@/*`

Then you can add components:

```bash
npx shadcn@latest add button card input badge dialog skeleton
```

## PWA Details

- Manifest at `client/public/manifest.webmanifest`
- Service worker source at `client/src/sw.js` (manual, no Workbox)
- Offline fallback at `client/public/offline.html`
- SW install and registration in `client/src/main.tsx`

### Runtime Caching Strategy

- **Stale-While-Revalidate**
  - Images (`request.destination === "image"`)
  - Categories endpoint (`/api/categories`)
- **Network-First + cache fallback**
  - All other `/api/*` requests (search/details/filter)
- **Navigation fallback**
  - If navigation fails offline, serves `/offline.html`

To tune caching, edit constants and route checks inside `client/src/sw.js`.

## Offline Testing

1. Run client + server.
2. Open app, browse meals, and add favorites.
3. In browser devtools, switch network to Offline.
4. Reload:
   - App shell should still open.
   - Favorites page should show IndexedDB data.
   - Meal/category requests should use cache when available.

## Build and Deploy Suggestions

- **Server:** Render, Railway, Fly.io, or any Node host.
- **Client:** Netlify or Vercel static hosting.
- Prefer same-origin deployment (`/api/*`) or a reverse proxy so client still uses only `/api/*`.

Build commands:

```bash
cd . && npm run build
cd server && npm run build
cd client && npm run build
```

## Post-Generation Checklist

- Replace placeholder icons in `client/public/icons`.
- Optionally run official `shadcn init` and re-generate components.
- Configure production domain + HTTPS (required for full PWA install behavior).
- Verify offline behavior on a real mobile device.
# recipe-app
