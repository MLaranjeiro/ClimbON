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

## Testing

| Suite | Tool | Location | Command |
| --- | --- | --- | --- |
| Unit | Vitest | `src/testing/vitest` | `npm test` |
| End-to-end, accessibility, security | Playwright (+ axe-core) | `src/testing/playwright` | `npm run test:e2e` |
| API / RLS | Postman (run with newman) | `src/testing/postman` | `npm run test:api` |

Playwright and the Postman runner read test accounts from `.env.test.local`:

```
TEST_EMAIL=climber-account@example.com
TEST_PASSWORD=...
# Optional: an account with a route_setter or gym_admin role. Without it the
# route setter suites fall back to TEST_EMAIL (which then needs a gym role).
TEST_SETTER_EMAIL=setter-account@example.com
TEST_SETTER_PASSWORD=...
```

To run the Playwright suite against a deployment instead of the local dev server,
set `BASE_URL` (this also enables the security-header checks):

```bash
BASE_URL=https://your-deployment.vercel.app npm run test:e2e
```

## Deployment

The app is deployed to Vercel as a static Vite build. `vercel.json` rewrites
all paths to `index.html` (client-side routing) and sets the security headers
(CSP, HSTS, `X-Frame-Options`, `nosniff`, referrer and permissions policies).

1. Import the GitHub repo into Vercel (framework preset: Vite).
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
3. In Supabase → Authentication → URL Configuration, set the Site URL to the
   deployment URL and add `https://<deployment>/**` to the redirect allow list
   (needed for password reset and Google sign-in).
