# ClimbON

A responsive web app for indoor climbers to log sends, share beta, and rate
route difficulty. Built as a capstone project.

Climbers can browse routes by gym and grade, log completed climbs, upload
text/video beta for specific moves, and rate how hard a route really felt —
with the community's ratings averaged into each route's difficulty score.
Route setters get their own gym admin dashboard to add, edit, and retire
routes as gym layouts change, and platform admins manage the gym directory
itself.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- TanStack Query
- Recharts
- Supabase (Postgres, Auth, Storage)

## Project structure

```
src/
├── components/   shared UI components
├── context/      auth context/provider
├── hooks/        data-fetching hooks (Supabase + React Query)
├── layouts/      route layouts (auth, root)
├── lib/          grading, permissions, validation, Supabase client
├── pages/        routed pages
└── types/        shared TypeScript types
```

## Getting started

```bash
npm install
```

Create a `.env.local` with your Supabase project credentials:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

Database schema, RLS policies, and the auto-profile-on-signup trigger are
managed directly in the Supabase SQL Editor.

```bash
npm run dev      # start the dev server
npm run build    # typecheck + production build
npm run lint     # eslint
```
