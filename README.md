# AstroQuiz Sri Lanka

A React + TypeScript + Vite frontend with Supabase Auth/PostgreSQL for a Sri Lankan Astronomy Olympiad quiz platform. The project structure and rules are based on the supplied **AstroQuiz Sri Lanka — Full System Architecture & Database Design** document and architecture image.

## Features in this starter
- Responsive astronomy-themed dashboard and navigation for student, moderator, and admin areas
- Login with Supabase Auth; no public sign-up UI (accounts should be provisioned by an administrator)
- Student dashboard, quiz centre, leaderboard, attempt history, practice, and settings pages
- English/Sinhala UI toggle and light/dark theme preference (local browser preference starter)
- Supabase migration for the 11 core tables, RLS policies, indexes, and trusted quiz lifecycle functions
- Daily quizzes (30 minutes), weekend quizzes (90 minutes), practice quizzes, first eligible submission scoring, 3× weekend leaderboard weighting
- Cloudflare Pages deployment notes

> **Important:** This is a functional starter codebase, not a certified production system. Apply the SQL migration to a new Supabase project, test with separate student/moderator/admin accounts, and review policies before inviting minors. Admin user provisioning is deliberately kept server-side; never put a Supabase service-role key in the browser. The Edge Function is a scaffold and must be configured with secrets before use.

## Requirements
- Node.js 18 or later
- A Supabase project

## Local setup
1. Extract this ZIP and open the `astroquiz-sri-lanka` directory in a terminal.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. In Supabase SQL Editor, run `backend/supabase/migrations/202610110001_initial_schema.sql`.
5. Start the frontend: `npm run dev`
6. Visit `http://localhost:5173`. Without environment values, the app opens in demo-preview mode; authentication and data operations require Supabase credentials.

## First administrator
Create the first user through Supabase Auth Dashboard, then insert/update that user's `profiles` row as `admin` using the SQL Editor. Do this only for a trusted account. Subsequent account creation should use the server-side Edge Function with `SUPABASE_SERVICE_ROLE_KEY` configured as a Supabase secret. Never expose that key in `.env.local` or a `VITE_` variable.

## Deploy to Cloudflare Pages
- Push the repository to GitHub.
- Create a Cloudflare Pages project connected to the repository.
- Build command: `npm run build`
- Build output directory: `dist`
- Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_APP_URL` in Pages environment variables.
- Deploy and test sign-in, RLS, quiz deadlines, answer-key secrecy, and role access using test accounts.

## Business rules encoded in the migration
- Daily duration: 1,800 seconds; weekend duration: 5,400 seconds; practice untimed.
- Server-controlled start and deadline. The deadline is capped at the session close.
- Raw percentage is `marks earned / maximum marks × 100`. Daily leaderboard points use multiplier 1; weekend points use multiplier 3.
- Only one leaderboard entry per user per session and per attempt; practice never contributes points.
- Weekly ranking periods should be computed Monday 00:00 to Monday 00:00 in `Asia/Colombo`.
- Students can read their own attempts; answer keys are not returned by student question-fetch policies.

## Current scope and next steps
The UI is an MVP shell and includes demo content when Supabase is not configured. To complete a live deployment, seed published quizzes/questions, create users, test lifecycle functions, and build out moderator CRUD screens and a thoroughly reviewed account-admin workflow.
