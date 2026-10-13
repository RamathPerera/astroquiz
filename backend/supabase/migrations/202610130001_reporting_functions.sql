-- Reporting functions used by the authenticated frontend.
-- They run with definer privileges but only return the current user's safe aggregates.

create or replace function public.get_topic_progress()
returns table(topic text, accuracy numeric)
language sql stable security definer set search_path=public as $$
  select q.topic,
         round(coalesce(avg(case when aa.is_correct then 100 else 0 end), 0), 2) as accuracy
  from public.quiz_attempts a
  join public.attempt_answers aa on aa.attempt_id=a.id
  join public.quiz_questions qq on qq.id=aa.quiz_question_id
  join public.questions q on q.id=qq.question_id
  where a.user_id=auth.uid() and a.status in ('submitted','expired')
  group by q.topic
  order by q.topic;
$$;

create or replace function public.get_leaderboard(p_timeframe text default 'all')
returns table(rank bigint, user_id uuid, display_name text, username text, total_points numeric)
language sql stable security definer set search_path=public as $$
  with totals as (
    select le.user_id, sum(le.points_awarded) as total_points
    from public.leaderboard_entries le
    where p_timeframe <> 'weekly'
       or le.awarded_at >= date_trunc('week', now())
    group by le.user_id
  )
  select dense_rank() over(order by t.total_points desc) as rank,
         t.user_id, p.display_name, p.username, t.total_points
  from totals t
  join public.profiles p on p.id=t.user_id and p.is_active=true
  order by rank, p.display_name;
$$;

revoke all on function public.get_topic_progress() from public, anon;
revoke all on function public.get_leaderboard(text) from public, anon;
grant execute on function public.get_topic_progress() to authenticated;
grant execute on function public.get_leaderboard(text) to authenticated;

-- Patch the original question RPC if the initial migration was already applied.
create or replace function public.get_quiz_questions(p_quiz_id uuid)
returns table(
  quiz_question_id uuid, question_id uuid, question_position integer, marks numeric,
  topic text, difficulty public.question_difficulty, prompt_en text, prompt_si text,
  option_id uuid, option_label text, option_text_en text, option_text_si text
)
language plpgsql stable security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.quizzes q where q.id=p_quiz_id and (q.status='published' or public.is_staff())) then
    raise exception 'Quiz unavailable';
  end if;
  return query
    select qq.id,q.id,qq.question_position,qq.marks,q.topic,q.difficulty,q.prompt_en,q.prompt_si,
           o.id,o.label,o.text_en,o.text_si
    from public.quiz_questions qq
    join public.questions q on q.id=qq.question_id
    join public.question_options o on o.question_id=q.id
    where qq.quiz_id=p_quiz_id
    order by qq.question_position,o.question_position;
end; $$;

grant execute on function public.get_quiz_questions(uuid) to authenticated;
