# Seed data
Run [`backend/supabase/seed_data_clean.sql`](../seed_data_clean.sql) in the Supabase SQL Editor after applying the migrations. It first clears application data (attempts, leaderboard rows, quizzes, sessions, questions, options, and preferences), while preserving `auth.users` and `public.profiles`, then creates fresh published daily, weekend, and practice quizzes.

The seed intentionally does not create student accounts. Create users through Supabase Auth; the `handle_new_user` trigger creates their profile and preferences.

For a safe first test, create a user in Supabase Auth, then set that user's profile role to `admin` in the SQL Editor. The seed provides four options and exactly one correct option for every question.
