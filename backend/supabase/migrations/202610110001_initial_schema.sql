-- AstroQuiz Sri Lanka initial schema
-- Apply to a new Supabase project using the SQL Editor or Supabase CLI.
create extension if not exists pgcrypto;
create type public.app_role as enum ('student','moderator','admin');
create type public.quiz_type as enum ('daily','weekend','practice');
create type public.quiz_status as enum ('draft','published','archived');
create type public.question_difficulty as enum ('easy','medium','hard','olympiad');
create type public.question_kind as enum ('single_choice');
create type public.session_status as enum ('scheduled','open','closed');
create type public.attempt_status as enum ('in_progress','submitted','expired');
create type public.ui_language as enum ('en','si');
create type public.ui_theme as enum ('light','dark','system');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username = lower(username) and length(username) between 3 and 32),
 display_name text not null check (length(trim(display_name)) between 1 and 60),
 role public.app_role not null default 'student', is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.quizzes (
 id uuid primary key default gen_random_uuid(), title_en text not null, title_si text not null,
 description_en text, description_si text, quiz_type public.quiz_type not null,
 duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
 status public.quiz_status not null default 'draft', created_by uuid references public.profiles(id), created_at timestamptz not null default now(),
 constraint quiz_duration_matches_type check ((quiz_type='daily' and duration_seconds=1800) or (quiz_type='weekend' and duration_seconds=5400) or (quiz_type='practice' and duration_seconds is null))
);
create table public.questions (
 id uuid primary key default gen_random_uuid(), question_type public.question_kind not null default 'single_choice', topic text not null,
 difficulty public.question_difficulty not null default 'medium', prompt_en text not null, prompt_si text not null,
 explanation_en text not null, explanation_si text not null, created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.question_options (
 id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade,
 label text not null, text_en text not null, text_si text not null, is_correct boolean not null default false, question_position integer not null check(question_position>0),
 unique(question_id,label), unique(question_id,question_position), unique(id,question_id)
);
create table public.quiz_questions (
 id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.quizzes(id) on delete cascade,
 question_id uuid not null references public.questions(id), question_position integer not null check(question_position>0), marks numeric(8,2) not null check(marks>0),
 negative_marks numeric(8,2) not null default 0 check(negative_marks>=0), unique(quiz_id,question_position), unique(quiz_id,question_id), unique(id,quiz_id)
);
create table public.quiz_sessions (
 id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.quizzes(id), starts_at timestamptz not null,
 ends_at timestamptz not null, timezone text not null default 'Asia/Colombo', status public.session_status not null default 'scheduled',
 created_at timestamptz not null default now(), check(ends_at>starts_at), unique(id,quiz_id)
);
create table public.quiz_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), quiz_id uuid not null references public.quizzes(id),
 session_id uuid references public.quiz_sessions(id), attempt_number integer not null check(attempt_number>0), started_at timestamptz not null default now(),
 deadline_at timestamptz not null, submitted_at timestamptz, status public.attempt_status not null default 'in_progress',
 raw_score numeric(10,2) not null default 0, max_score numeric(10,2) not null check(max_score>=0), accuracy_percent numeric(5,2) not null default 0 check(accuracy_percent between 0 and 100),
 duration_seconds integer not null default 0 check(duration_seconds>=0), created_at timestamptz not null default now(), unique(user_id,quiz_id,attempt_number),
 check(deadline_at>=started_at), check((status='in_progress' and submitted_at is null) or (status<>'in_progress' and submitted_at is not null)),
 foreign key(session_id,quiz_id) references public.quiz_sessions(id,quiz_id)
);
create unique index one_open_attempt_per_session on public.quiz_attempts(user_id,session_id) where status='in_progress' and session_id is not null;
create table public.attempt_answers (
 id uuid primary key default gen_random_uuid(), attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
 quiz_question_id uuid not null references public.quiz_questions(id), selected_option_id uuid references public.question_options(id),
 is_correct boolean not null default false, marks_awarded numeric(8,2) not null default 0, unique(attempt_id,quiz_question_id)
);
create table public.leaderboard_entries (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), quiz_id uuid not null references public.quizzes(id),
 session_id uuid not null references public.quiz_sessions(id), attempt_id uuid not null unique references public.quiz_attempts(id),
 points_awarded numeric(10,2) not null check(points_awarded>=0), awarded_at timestamptz not null default now(), unique(user_id,session_id)
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id), action text not null,
 target_user_id uuid references public.profiles(id), metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.user_preferences (
 user_id uuid primary key references public.profiles(id) on delete cascade, language public.ui_language not null default 'en',
 theme public.ui_theme not null default 'dark', updated_at timestamptz not null default now()
);
create index quiz_sessions_schedule_idx on public.quiz_sessions(starts_at,ends_at);
create index attempts_user_recent_idx on public.quiz_attempts(user_id,started_at desc);
create index leaderboard_session_points_idx on public.leaderboard_entries(session_id,points_awarded desc);
create index leaderboard_awarded_idx on public.leaderboard_entries(awarded_at desc);

-- Create a profile on signup. Public signup should be disabled in Auth settings for a closed class.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,username,display_name,role)
 values(new.id, coalesce(nullif(lower(new.raw_user_meta_data->>'username'),''),'student_'||substr(new.id::text,1,8)),
 coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Astronomy Student'),'student') on conflict(id) do nothing;
 insert into public.user_preferences(user_id) values(new.id) on conflict(user_id) do nothing;
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.current_role() returns public.app_role language sql stable security definer set search_path=public as $$
 select role from public.profiles where id=auth.uid() and is_active=true limit 1;
$$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$
 select coalesce(public.current_role() in ('moderator','admin'),false);
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select coalesce(public.current_role()='admin',false);
$$;

-- Prevent profile self-escalation. Users can only update display name; role/active/username remain admin-controlled.
create or replace function public.guard_profile_update() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is not null and not public.is_admin() then
   if new.id is distinct from old.id or new.role is distinct from old.role or new.is_active is distinct from old.is_active or new.username is distinct from old.username then
     raise exception 'Only an administrator can change role, activation, or username';
   end if;
 end if;
 new.updated_at=now(); return new;
end; $$;
create trigger profiles_guard_update before update on public.profiles for each row execute procedure public.guard_profile_update();

-- Snapshot question order/content after any attempt exists; create a new quiz version for corrections.
create or replace function public.guard_quiz_question_mutation() returns trigger language plpgsql as $$
declare qid uuid;
begin
 qid:=coalesce(new.quiz_id,old.quiz_id);
 if exists(select 1 from public.quiz_attempts a where a.quiz_id=qid) then raise exception 'Quiz questions are immutable after an attempt starts'; end if;
 return coalesce(new,old);
end; $$;
create trigger quiz_questions_immutable before update or delete on public.quiz_questions for each row execute procedure public.guard_quiz_question_mutation();

-- Student-safe question payload excludes is_correct. Correct options are only exposed after an attempt has been submitted via review function.
create or replace function public.get_quiz_questions(p_quiz_id uuid) returns table(quiz_question_id uuid,question_id uuid,question_position integer,marks numeric,topic text,difficulty public.question_difficulty,prompt_en text,prompt_si text,option_id uuid,option_label text,option_text_en text,option_text_si text)
language plpgsql stable security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.quizzes q where q.id=p_quiz_id and (q.status='published' or public.is_staff())) then raise exception 'Quiz unavailable'; end if;
 return query select qq.id,q.id,qq.question_position,qq.marks,q.topic,q.difficulty,q.prompt_en,q.prompt_si,o.id,o.label,o.text_en,o.text_si
 from public.quiz_questions qq join public.questions q on q.id=qq.question_id join public.question_options o on o.question_id=q.id
 where qq.quiz_id=p_quiz_id order by qq.question_position,o.question_position;
end; $$;

create or replace function public.start_quiz(p_quiz_id uuid,p_session_id uuid default null) returns public.quiz_attempts
language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_quiz public.quizzes; v_session public.quiz_sessions; v_start timestamptz:=clock_timestamp(); v_deadline timestamptz; v_num integer; v_max numeric; v_attempt public.quiz_attempts;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.profiles where id=v_user and is_active) then raise exception 'Account inactive'; end if;
 select * into v_quiz from public.quizzes where id=p_quiz_id and status='published'; if not found then raise exception 'Quiz unavailable'; end if;
 if v_quiz.quiz_type='practice' then
   if p_session_id is not null then raise exception 'Practice quiz must not use a session'; end if;
   v_deadline:=v_start+interval '24 hours';
 else
   if p_session_id is null then raise exception 'Scheduled quiz requires a session'; end if;
   select * into v_session from public.quiz_sessions where id=p_session_id and quiz_id=p_quiz_id;
   if not found or v_start<v_session.starts_at or v_start>=v_session.ends_at then raise exception 'Quiz session is not open'; end if;
   v_deadline:=least(v_start+make_interval(secs=>v_quiz.duration_seconds),v_session.ends_at);
 end if;
 if exists(select 1 from public.quiz_attempts where user_id=v_user and quiz_id=p_quiz_id and status='in_progress' and (session_id is not distinct from p_session_id)) then raise exception 'An attempt is already in progress'; end if;
 select coalesce(max(attempt_number),0)+1 into v_num from public.quiz_attempts where user_id=v_user and quiz_id=p_quiz_id and session_id is not distinct from p_session_id;
 select coalesce(sum(marks),0) into v_max from public.quiz_questions where quiz_id=p_quiz_id;
 insert into public.quiz_attempts(user_id,quiz_id,session_id,attempt_number,started_at,deadline_at,max_score,status)
 values(v_user,p_quiz_id,p_session_id,v_num,v_start,v_deadline,v_max,'in_progress') returning * into v_attempt;
 return v_attempt;
end; $$;

create or replace function public.save_quiz_answer(p_attempt_id uuid,p_quiz_question_id uuid,p_selected_option_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare a public.quiz_attempts; qq public.quiz_questions; opt_question uuid;
begin
 select * into a from public.quiz_attempts where id=p_attempt_id and user_id=auth.uid() for update;
 if not found or a.status<>'in_progress' then raise exception 'Attempt unavailable'; end if;
 if clock_timestamp()>a.deadline_at then raise exception 'Attempt deadline has passed'; end if;
 select * into qq from public.quiz_questions where id=p_quiz_question_id and quiz_id=a.quiz_id;
 if not found then raise exception 'Question is not part of this quiz'; end if;
 if p_selected_option_id is not null then
   select question_id into opt_question from public.question_options where id=p_selected_option_id;
   if opt_question is distinct from qq.question_id then raise exception 'Selected option does not belong to this question'; end if;
 end if;
 insert into public.attempt_answers(attempt_id,quiz_question_id,selected_option_id) values(a.id,qq.id,p_selected_option_id)
 on conflict(attempt_id,quiz_question_id) do update set selected_option_id=excluded.selected_option_id,is_correct=false,marks_awarded=0;
end; $$;

create or replace function public.submit_quiz(p_attempt_id uuid) returns public.quiz_attempts
language plpgsql security definer set search_path=public as $$
declare a public.quiz_attempts; v_now timestamptz:=clock_timestamp(); v_score numeric:=0; v_max numeric:=0; v_correct integer:=0; v_total integer:=0; v_points numeric:=0; v_mult numeric:=1; v_eligible boolean:=false; result public.quiz_attempts;
begin
 select * into a from public.quiz_attempts where id=p_attempt_id and user_id=auth.uid() for update;
 if not found or a.status<>'in_progress' then raise exception 'Attempt unavailable'; end if;
 if v_now>a.deadline_at then v_now:=a.deadline_at; end if;
 -- Grade only saved options that belong to the corresponding question.
 insert into public.attempt_answers(attempt_id,quiz_question_id,selected_option_id,is_correct,marks_awarded)
 select a.id,qq.id,null,false,0 from public.quiz_questions qq where qq.quiz_id=a.quiz_id
 on conflict(attempt_id,quiz_question_id) do nothing;
 update public.attempt_answers aa set
  is_correct=(aa.selected_option_id is not null and exists(select 1 from public.question_options o where o.id=aa.selected_option_id and o.question_id=qq.question_id and o.is_correct)),
  marks_awarded=case when aa.selected_option_id is null then 0 when exists(select 1 from public.question_options o where o.id=aa.selected_option_id and o.question_id=qq.question_id and o.is_correct) then qq.marks else -qq.negative_marks end
 from public.quiz_questions qq where aa.quiz_question_id=qq.id and aa.attempt_id=a.id;
 select coalesce(sum(aa.marks_awarded),0),coalesce(sum(qq.marks),0),count(*),count(*) filter(where aa.is_correct)
 into v_score,v_max,v_total,v_correct from public.attempt_answers aa join public.quiz_questions qq on qq.id=aa.quiz_question_id where aa.attempt_id=a.id;
 update public.quiz_attempts set status='submitted',submitted_at=v_now,raw_score=v_score,max_score=v_max,
 accuracy_percent=case when v_total=0 then 0 else round(v_correct::numeric*100/v_total,2) end,
 duration_seconds=greatest(0,least(extract(epoch from (v_now-started_at))::integer,extract(epoch from (deadline_at-started_at))::integer))
 where id=a.id returning * into result;
 if a.session_id is not null and exists(select 1 from public.quizzes where id=a.quiz_id and quiz_type in ('daily','weekend')) then
   select case when quiz_type='weekend' then 3 else 1 end into v_mult from public.quizzes where id=a.quiz_id;
   v_points:=case when v_max<=0 then 0 else greatest(0,(v_score/v_max)*100)*v_mult end;
   -- First successfully submitted attempt for a session wins. Unique(user_id,session_id) handles concurrent submissions.
   if not exists(select 1 from public.leaderboard_entries where user_id=a.user_id and session_id=a.session_id) then
     insert into public.leaderboard_entries(user_id,quiz_id,session_id,attempt_id,points_awarded,awarded_at)
     values(a.user_id,a.quiz_id,a.session_id,a.id,v_points,v_now) on conflict do nothing;
   end if;
 end if;
 return result;
end; $$;

create or replace function public.get_attempt_review(p_attempt_id uuid) returns table(quiz_question_id uuid,question_position integer,topic text,difficulty public.question_difficulty,prompt_en text,prompt_si text,selected_option_id uuid,selected_label text,selected_text_en text,selected_text_si text,is_correct boolean,marks_awarded numeric,correct_option_id uuid,correct_label text,correct_text_en text,correct_text_si text,explanation_en text,explanation_si text)
language plpgsql stable security definer set search_path=public as $$
begin
 if not exists(select 1 from public.quiz_attempts a where a.id=p_attempt_id and (a.user_id=auth.uid() or public.is_staff()) and a.status in ('submitted','expired')) then raise exception 'Review unavailable'; end if;
 return query select qq.id,qq.question_position,q.topic,q.difficulty,q.prompt_en,q.prompt_si,aa.selected_option_id,so.label,so.text_en,so.text_si,aa.is_correct,aa.marks_awarded,co.id,co.label,co.text_en,co.text_si,q.explanation_en,q.explanation_si
 from public.quiz_attempts a join public.quiz_questions qq on qq.quiz_id=a.quiz_id join public.questions q on q.id=qq.question_id
 left join public.attempt_answers aa on aa.attempt_id=a.id and aa.quiz_question_id=qq.id
 left join public.question_options so on so.id=aa.selected_option_id
 left join lateral (select o.* from public.question_options o where o.question_id=q.id and o.is_correct order by o.question_position limit 1) co on true
 where a.id=p_attempt_id order by qq.question_position;
end; $$;

-- RLS on all exposed tables.
alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_preferences enable row level security;
create policy profiles_read_self_or_staff on public.profiles for select to authenticated using(id=auth.uid() or public.is_staff());
create policy profiles_update_self_or_admin on public.profiles for update to authenticated using(id=auth.uid() or public.is_admin()) with check(id=auth.uid() or public.is_admin());
create policy profiles_admin_insert on public.profiles for insert to authenticated with check(public.is_admin());
create policy quizzes_read_published_or_staff on public.quizzes for select to authenticated using(status='published' or public.is_staff());
create policy quizzes_staff_manage on public.quizzes for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy questions_staff_manage on public.questions for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy options_staff_manage on public.question_options for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy quiz_questions_staff_manage on public.quiz_questions for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy quiz_sessions_read on public.quiz_sessions for select to authenticated using(public.is_staff() or exists(select 1 from public.quizzes q where q.id=quiz_id and q.status='published'));
create policy quiz_sessions_staff_manage on public.quiz_sessions for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy attempts_read_own_or_staff on public.quiz_attempts for select to authenticated using(user_id=auth.uid() or public.is_staff());
create policy answers_read_own_or_staff on public.attempt_answers for select to authenticated using(exists(select 1 from public.quiz_attempts a where a.id=attempt_id and (a.user_id=auth.uid() or public.is_staff())));
create policy leaderboard_read_authenticated on public.leaderboard_entries for select to authenticated using(true);
create policy audit_admin_read on public.audit_logs for select to authenticated using(public.is_admin());
create policy preferences_own_read on public.user_preferences for select to authenticated using(user_id=auth.uid());
create policy preferences_own_insert on public.user_preferences for insert to authenticated with check(user_id=auth.uid());
create policy preferences_own_update on public.user_preferences for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- No direct student writes to attempts, answers, or leaderboard. Trusted functions own lifecycle writes.
revoke insert,update,delete on public.quiz_attempts from anon,authenticated;
revoke insert,update,delete on public.attempt_answers from anon,authenticated;
revoke insert,update,delete on public.leaderboard_entries from anon,authenticated;
revoke all on function public.start_quiz(uuid,uuid) from public,anon;
revoke all on function public.save_quiz_answer(uuid,uuid,uuid) from public,anon;
revoke all on function public.submit_quiz(uuid) from public,anon;
revoke all on function public.get_attempt_review(uuid) from public,anon;
grant execute on function public.start_quiz(uuid,uuid) to authenticated;
grant execute on function public.save_quiz_answer(uuid,uuid,uuid) to authenticated;
grant execute on function public.submit_quiz(uuid) to authenticated;
grant execute on function public.get_attempt_review(uuid) to authenticated;
grant execute on function public.get_quiz_questions(uuid) to authenticated;
-- Public leaderboard query should select only profiles.display_name, leaderboard_entries.points_awarded and safe ranking fields.
