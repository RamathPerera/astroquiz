# Deployment and launch checklist

## Supabase
1. Create a new project and run `backend/supabase/migrations/202610110001_initial_schema.sql`.
2. Disable public signups in Authentication settings for a closed student cohort.
3. Create the first trusted admin in Auth; verify the profile trigger created a `profiles` row, then set its role to `admin` in SQL Editor.
4. Set Edge Function secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and deploy `admin-users`.
5. Add questions with bilingual prompts/explanations and options; verify exactly one correct option per question before publishing.
6. Create published daily/weekend quizzes and their `quiz_sessions` in `Asia/Colombo` time. Daily sessions should cover the relevant Sri Lankan calendar day; weekend sessions use the shared competition window.
7. Test with isolated student, moderator, and admin accounts. Confirm students cannot read answer keys, update roles, write marks, or alter leaderboard entries.

## Cloudflare Pages
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`
- Redeploy after changing environment variables.

## Before real students use it
- Review the RLS and security-definer functions with a PostgreSQL/Supabase security reviewer.
- Decide whether an expired weekend attempt consumes eligibility; the current migration awards points only for submitted attempts and lets the first submitted attempt that successfully inserts an entry win.
- Implement moderator CRUD, scheduling UI, automatic finalization of expired attempts, weekly ranking query, account invitation/password setup, rate limits, monitoring, and backups.
- Obtain school/guardian approval as appropriate and use display names rather than full names or emails on the public leaderboard.
