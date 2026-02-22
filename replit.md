# CurseControl

## Overview

CurseControl is a gamified habit-breaking web application that helps users reduce profanity usage. Users log curse words (manually or via speech recognition), receive randomly assigned punishments, and track their progress with statistics and charts. The app uses Replit Auth for authentication and a PostgreSQL database for persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with two main routes: Landing (`/`) and Dashboard (`/dashboard`)
- **State Management**: TanStack React Query for server state (caching, mutations, invalidation)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Animations**: Framer Motion for page transitions and interactive elements
- **Charts**: Recharts for visualizing curse word statistics (bar charts of top words)
- **Speech Recognition**: Web Speech API (`webkitSpeechRecognition`) for real-time curse word detection via microphone
- **Forms**: React Hook Form with Zod validation via `@hookform/resolvers`
- **Styling**: Tailwind CSS with CSS variables for theming (dark mode by default), custom fonts (DM Sans, Space Grotesk)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

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
  - `users`: id, email, firstName, lastName, profileImageUrl, createdAt, updatedAt (required for Replit Auth)
  - `sessions`: sid, sess, expire (required for Replit Auth, used by connect-pg-simple)

### Authentication & Authorization
- **Method**: Replit Auth via OpenID Connect (OIDC)
- **Session Storage**: PostgreSQL-backed sessions using `connect-pg-simple` and `express-session`
- **Login Flow**: Redirect to `/api/login`, which initiates OIDC flow with Replit
- **Logout Flow**: Redirect to `/api/logout`
- **Client-side**: `useAuth` hook queries `/api/auth/user` to check authentication status
- **Server-side**: `isAuthenticated` middleware protects API routes; user ID extracted from `req.user.claims.sub`
- **Important**: The `users` and `sessions` tables are mandatory for Replit Auth and must not be dropped

### API Endpoints
- `GET /api/curse-logs` — List all curse logs for authenticated user
- `GET /api/curse-logs/stats` — Get curse statistics (total curses, uncompleted punishments, top words)
- `POST /api/curse-logs` — Create a new curse log (input: `{ word: string }`, punishment auto-assigned)
- `PATCH /api/curse-logs/:id` — Update a curse log (mark punishment as completed)
- `GET /api/auth/user` — Get current authenticated user
- `GET /api/login` — Initiate Replit Auth login
- `GET /api/logout` — Logout

### Key Design Decisions
- **Shared schemas**: Zod schemas and TypeScript types are shared between client and server via the `shared/` directory, ensuring type safety across the stack
- **Punishment system**: Punishments are randomly selected server-side from a predefined list when a curse is logged
- **Speech recognition**: Browser-based Web Speech API used for optional real-time listening mode — no server-side audio processing needed

## External Dependencies

- **PostgreSQL**: Primary database, required via `DATABASE_URL` environment variable
- **Replit Auth (OIDC)**: Authentication provider using Replit's OpenID Connect service at `https://replit.com/oidc`
- **Environment Variables Required**:
  - `DATABASE_URL` — PostgreSQL connection string
  - `SESSION_SECRET` — Secret for express-session
  - `REPL_ID` — Replit environment identifier (set automatically in Replit)
  - `ISSUER_URL` — OIDC issuer URL (defaults to `https://replit.com/oidc`)
- **Google Fonts**: DM Sans, Space Grotesk, Fira Code, Geist Mono loaded via CDN
- **No external AI/payment services** are currently active in the codebase