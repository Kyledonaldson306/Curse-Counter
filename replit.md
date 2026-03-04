# CurseControl

## Overview

CurseControl is a gamified habit-breaking web application that helps users reduce profanity usage. Users log curse words (manually or via speech recognition), receive randomly assigned punishments, and track their progress with statistics and charts. The app uses email/password authentication and a PostgreSQL database for persistence. It includes PWA support with a splash screen, push notifications, and service worker for an app-like experience on mobile devices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with routes: Landing (`/`), Auth (`/auth`), and Dashboard (`/dashboard`)
- **State Management**: TanStack React Query for server state (caching, mutations, invalidation)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Animations**: Framer Motion for page transitions, splash screen, and interactive elements
- **Charts**: Recharts for visualizing curse word statistics (bar charts of top words with colored bars and count labels)
- **Speech Recognition**: Web Speech API (`webkitSpeechRecognition`) for real-time curse word detection via microphone
- **Forms**: React Hook Form with Zod validation via `@hookform/resolvers`
- **Styling**: Tailwind CSS with CSS variables for theming (dark mode by default), custom fonts (DM Sans, Space Grotesk)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **PWA**: Web app manifest, apple-touch-icon, splash screen on startup, service worker for push notifications

### Curse Detection System
- **Location**: `shared/curse-detection.ts` — shared between client and server
- **Word list**: 60+ curse words including common variations, plurals, and compound forms
- **Normalization**: Lowercase conversion, punctuation stripping, leet speak decoding (@ -> a, $ -> s, etc.), repeated character collapsing (fuuuck -> fuck), and multi-variant matching
- **API**: `detectCurseWords(text)` returns array of detected words, `isCurseWord(word)` checks single word

### Push Notifications
- **Service Worker**: `client/public/sw.js` handles push events, notification clicks, and local message-based notifications
- **Client**: `client/src/lib/push-notifications.ts` manages service worker registration, push subscription, and local notification fallback
- **Server**: `server/push.ts` handles VAPID key serving, subscription storage, and push delivery via `web-push`
- **Flow**: When a curse is logged via POST `/api/curse-logs`, the server automatically sends a push notification to all user subscriptions
- **Notification text**: "Hey! You CURSED!" with the detected word in the body

### Backend Architecture
- **Framework**: Express.js running on Node.js with TypeScript (executed via `tsx`)
- **API Pattern**: RESTful JSON API under `/api/` prefix. Routes are defined in `server/routes.ts` with Zod schemas for validation shared between client and server in `shared/routes.ts`
- **Build**: Custom build script using esbuild for server bundling and Vite for client bundling. Production output goes to `dist/` directory
- **Development**: Vite dev server with HMR proxied through Express in development mode

### Data Storage
- **Database**: PostgreSQL via `node-postgres` (`pg` package)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (main tables) and `shared/models/auth.ts` (auth tables)
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Tables**:
  - `curse_logs`: id, userId, word, punishment, isCompleted, createdAt
  - `users`: id, email, passwordHash, firstName, lastName, profileImageUrl, createdAt, updatedAt
  - `sessions`: sid, sess, expire (used by connect-pg-simple for session storage)
  - `push_subscriptions`: id, userId, subscription (jsonb), createdAt

### Authentication & Authorization
- **Method**: Email/password authentication with bcryptjs for password hashing
- **Session Storage**: PostgreSQL-backed sessions using `connect-pg-simple` and `express-session`
- **Registration**: POST `/api/auth/register` — validates email format, prevents duplicates, hashes password with bcrypt (12 rounds)
- **Login**: POST `/api/auth/login` — verifies email/password, creates session
- **Logout**: POST `/api/auth/logout` — destroys session
- **Client-side**: `useAuth` hook queries `GET /api/auth/user` to check authentication status
- **Server-side**: `isAuthenticated` middleware protects API routes; user ID extracted from `req.session.userId`
- **Auth module**: `server/auth.ts` contains all auth logic (setup, routes, middleware)

### API Endpoints
- `POST /api/auth/register` — Register new user (email, password)
- `POST /api/auth/login` — Login with email/password
- `POST /api/auth/logout` — Logout (destroy session)
- `GET /api/auth/user` — Get current authenticated user
- `GET /api/curse-logs` — List all curse logs for authenticated user
- `GET /api/curse-logs/stats` — Get curse statistics (total curses, uncompleted punishments, top words)
- `POST /api/curse-logs` — Create a new curse log (input: `{ word: string }`, punishment auto-assigned, triggers push notification)
- `PATCH /api/curse-logs/:id` — Update a curse log (mark punishment as completed)
- `GET /api/push/vapid-public-key` — Get VAPID public key for push subscription
- `POST /api/push/subscribe` — Save push subscription for authenticated user
- `POST /api/push/notify` — Trigger push notification for authenticated user

### Key Design Decisions
- **Shared schemas**: Zod schemas and TypeScript types are shared between client and server via the `shared/` directory, ensuring type safety across the stack
- **Shared detection**: Curse word detection logic in `shared/curse-detection.ts` is used by both client (speech recognition) and server (validation)
- **Punishment system**: Punishments are randomly selected server-side from a predefined list when a curse is logged
- **Speech recognition**: Browser-based Web Speech API used for optional real-time listening mode — no server-side audio processing needed
- **Active listening**: Uses `useRef` for listening state to avoid stale closures in recognition callbacks; Wake Lock API keeps screen active during sessions; visibility change handler restarts recognition when tab regains focus
- **Server-triggered push**: Push notifications are triggered server-side when a curse is logged, not client-side, ensuring delivery even when the tab is backgrounded

## External Dependencies

- **PostgreSQL**: Primary database, required via `DATABASE_URL` environment variable
- **bcryptjs**: Password hashing (12 rounds)
- **web-push**: Server-side push notification delivery via Web Push Protocol
- **Environment Variables Required**:
  - `DATABASE_URL` — PostgreSQL connection string
  - `SESSION_SECRET` — Secret for express-session
  - `VAPID_PUBLIC_KEY` — VAPID public key for push notifications
  - `VAPID_PRIVATE_KEY` — VAPID private key for push notifications
  - `VAPID_EMAIL` — Contact email for VAPID (defaults to mailto:admin@cursecontrol.app)
- **Google Fonts**: DM Sans, Space Grotesk, Fira Code, Geist Mono loaded via CDN
- **No external AI/payment/OAuth services** are used
