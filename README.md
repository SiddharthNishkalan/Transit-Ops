# TransitOps

Smart transport operations, unified. TransitOps is a fleet management console for tracking vehicles, drivers, trips, maintenance, fuel, and expenses — all in one operations dashboard.

## Features

- **Dashboard** — at-a-glance operational overview
- **Vehicles** — fleet registry with status (Available / On Trip / In Shop / Retired), odometer, load capacity, region, service intervals, and document tracking (insurance, registration, inspection, permits)
- **Drivers** — license tracking (number, category, expiry), safety scores, and status
- **Trips** — dispatch and complete trips with planned vs. actual distance, fuel consumed, and revenue
- **Maintenance** — open/close maintenance tickets per vehicle with cost tracking
- **Fuel logs** — record fuel purchases per vehicle
- **Reports** — expense tracking across tolls, maintenance, insurance, and misc categories
- **Activity feed** — audit log of actions across the platform
- **CSV import** — bulk-import vehicles and drivers
- **Role-based access** — Admin, Fleet Manager, Driver, Safety Officer, and Financial Analyst roles

## Tech Stack

- [TanStack Start](https://tanstack.com/start) (file-based routing via TanStack Router) + React 19 + TypeScript
- Vite build tooling
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
- Client-side state via React Context, persisted to `localStorage`
- Bun for package management (npm lockfile also included)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+

### Installation

```bash
bun install
# or
npm install
```

### Development

```bash
bun run dev
# or
npm run dev
```

The app will be available at `http://localhost:3000` (default Vite dev port may vary — check your terminal output).

### Other scripts

```bash
bun run build       # production build
bun run build:dev   # development-mode build
bun run preview     # preview the production build
bun run lint        # run ESLint
bun run format      # format with Prettier
```

## Demo Accounts

The app ships with seeded demo data and the following accounts (email / password):

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@transitops.dev | admin123 |
| Fleet Manager | manager@transitops.dev | manager123 |
| Driver | driver@transitops.dev | driver123 |
| Safety Officer | safety@transitops.dev | safety123 |
| Financial Analyst | finance@transitops.dev | finance123 |

> **Note:** This is demo/prototype data intended for local development only. Do not reuse these credentials or this storage approach in a production deployment.

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── app-sidebar.tsx
│   └── notifications-bell.tsx
├── hooks/
├── lib/
│   ├── types.ts         # domain types (Vehicle, Driver, Trip, Maintenance, etc.)
│   ├── store.tsx         # app state, actions, and localStorage persistence
│   ├── seed.ts           # seed/demo data
│   ├── csv.ts / csv-import.ts
│   └── derived.ts        # derived/computed data helpers
├── routes/
│   ├── __root.tsx        # app shell
│   ├── login.tsx
│   ├── index.tsx
│   └── _app/              # authenticated routes: dashboard, vehicles, drivers,
│                           # trips, maintenance, fuel, reports, activity, users
├── router.tsx
├── server.ts / start.ts
└── styles.css
```

Routing follows TanStack Start's file-based conventions — see `src/routes/README.md` for details.

## License

No license specified.
