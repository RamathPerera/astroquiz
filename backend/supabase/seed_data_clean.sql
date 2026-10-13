-- AstroQuiz Sri Lanka initial data.
-- Run migrations first, then run this file in Supabase SQL Editor.
-- Auth users are intentionally not seeded; create them in Supabase Auth.

-- Reset application data while preserving auth.users and public.profiles.
-- Run this only when you want a clean application dataset.
begin;
delete from public.leaderboard_entries;
delete from public.attempt_answers;
delete from public.quiz_attempts;
delete from public.audit_logs;
delete from public.quiz_questions;
delete from public.question_options;
delete from public.quiz_sessions;
delete from public.questions;
delete from public.quizzes;
delete from public.user_preferences;

create or replace function public.get_topic_progress()
returns table(topic text, accuracy numeric)
language sql stable security definer set search_path=public as $$
  select q.topic, round(coalesce(avg(case when aa.is_correct then 100 else 0 end),0),2)
  from public.quiz_attempts a
  join public.attempt_answers aa on aa.attempt_id=a.id
  join public.quiz_questions qq on qq.id=aa.quiz_question_id
  join public.questions q on q.id=qq.question_id
  where a.user_id=auth.uid() and a.status in ('submitted','expired')
  group by q.topic order by q.topic;
$$;
grant execute on function public.get_topic_progress() to authenticated;

create or replace function public.get_quiz_questions(p_quiz_id uuid)
returns table(quiz_question_id uuid,question_id uuid,question_position integer,marks numeric,topic text,difficulty public.question_difficulty,prompt_en text,prompt_si text,option_id uuid,option_label text,option_text_en text,option_text_si text)
language plpgsql stable security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.quizzes q where q.id=p_quiz_id and (q.status='published' or public.is_staff())) then raise exception 'Quiz unavailable'; end if;
  return query
    select qq.id,q.id,qq.question_position,qq.marks,q.topic,q.difficulty,q.prompt_en,q.prompt_si,o.id,o.label,o.text_en,o.text_si
    from public.quiz_questions qq
    join public.questions q on q.id=qq.question_id
    join public.question_options o on o.question_id=q.id
    where qq.quiz_id=p_quiz_id
    order by qq.question_position,o.question_position;
end; $$;
grant execute on function public.get_quiz_questions(uuid) to authenticated;

insert into public.quizzes (id,title_en,title_si,description_en,description_si,quiz_type,duration_seconds,status)
values
 ('d0000000-0000-0000-0000-000000000001','Daily Solar System Exploration','දෛනික සූර්ය මණ්ඩල ගවේෂණය','Explore planets, moons, and our place in the Solar System.','ග්‍රහලෝක, චන්ද්‍රයන් සහ සූර්ය මණ්ඩලයේ අපගේ ස්ථානය ගවේෂණය කරන්න.','daily',1800,'published'),
 ('d0000000-0000-0000-0000-000000000002','Weekend Astronomy Olympiad','සති අන්ත තාරකා විද්‍යා ඔලිම්පියාඩ්','A comprehensive test of celestial mechanics, stars, and cosmology.','ආකාශ යාන්ත්‍රණය, තරු සහ විශ්ව විද්‍යාව පිළිබඳ පරීක්ෂණයක්.','weekend',5400,'published'),
 ('d0000000-0000-0000-0000-000000000003','Practice: Solar System Essentials','පුහුණුව: සූර්ය මණ්ඩලයේ මූලික කරුණු','Unlimited practice for Solar System fundamentals.','සූර්ය මණ්ඩලයේ මූලික කරුණු සඳහා සීමා රහිත පුහුණුව.','practice',null,'published'),
 ('d0000000-0000-0000-0000-000000000004','Practice: Stars and Galaxies','පුහුණුව: තරු සහ මන්දාකිණි','Practice stellar evolution and galaxy types.','තරු පරිණාමය සහ මන්දාකිණි වර්ග පුහුණු වන්න.','practice',null,'published')
on conflict (id) do update set title_en=excluded.title_en,title_si=excluded.title_si,description_en=excluded.description_en,description_si=excluded.description_si,quiz_type=excluded.quiz_type,duration_seconds=excluded.duration_seconds,status=excluded.status;

insert into public.quiz_sessions (id,quiz_id,starts_at,ends_at,timezone,status)
values
 ('c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001',now()-interval '1 day',now()+interval '30 days','Asia/Colombo','open'),
 ('c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000002',now()-interval '1 day',now()+interval '30 days','Asia/Colombo','open')
on conflict (id) do update set starts_at=excluded.starts_at,ends_at=excluded.ends_at,timezone=excluded.timezone,status=excluded.status;

insert into public.questions (id,topic,difficulty,prompt_en,prompt_si,explanation_en,explanation_si)
values
 ('a0000000-0000-0000-0000-000000000001','Solar System','easy','Which planet has the most prominent ring system?','වඩාත් කැපී පෙනෙන වළලු පද්ධතිය ඇති ග්‍රහලෝකය කුමක්ද?','Saturn has the most extensive and complex ring system.','සෙනසුරුට වඩාත් පුළුල් හා සංකීර්ණ වළලු පද්ධතියක් ඇත.'),
 ('a0000000-0000-0000-0000-000000000002','Solar System','medium','What gas primarily composes the atmosphere of Venus?','සිකුරුගේ වායුගෝලය ප්‍රධාන වශයෙන් සමන්විත වන්නේ කුමන වායුවෙන්ද?','Venus is roughly 96.5% carbon dioxide.','සිකුරුගේ වායුගෝලය ආසන්න වශයෙන් 96.5% කාබන් ඩයොක්සයිඩ් වේ.'),
 ('a0000000-0000-0000-0000-000000000003','Stars and Galaxies','medium','What type of star is our Sun?','අපගේ සූර්යයා කුමන තාරකා වර්ගයට අයත්ද?','The Sun is a G-type main-sequence star.','සූර්යයා G වර්ගයේ ප්‍රධාන අනුක්‍රම තාරකාවකි.'),
 ('a0000000-0000-0000-0000-000000000004','Celestial Motion','hard','What force keeps planets in orbit around the Sun?','ග්‍රහලෝක සූර්යයා වටා කක්ෂගතව තබන බලය කුමක්ද?','Gravity provides the centripetal force for planetary orbits.','ගුරුත්වාකර්ෂණය ග්‍රහලෝක කක්ෂ සඳහා කේන්ද්‍රගාමී බලය සපයයි.')
on conflict (id) do update set topic=excluded.topic,difficulty=excluded.difficulty,prompt_en=excluded.prompt_en,prompt_si=excluded.prompt_si,explanation_en=excluded.explanation_en,explanation_si=excluded.explanation_si;

insert into public.question_options (id,question_id,label,text_en,text_si,is_correct,question_position)
values
 ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','A','Jupiter','බ්‍රහස්පති',false,1),('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','B','Saturn','සෙනසුරු',true,2),('b0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','C','Uranus','යුරේනස්',false,3),('b0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001','D','Neptune','නෙප්චූන්',false,4),
 ('b0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000002','A','Oxygen','ඔක්සිජන්',false,1),('b0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000002','B','Nitrogen','නයිට්‍රජන්',false,2),('b0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000002','C','Carbon dioxide','කාබන් ඩයොක්සයිඩ්',true,3),('b0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000002','D','Methane','මීතේන්',false,4),
 ('b0000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000003','A','Red giant','රතු යෝධයා',false,1),('b0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000003','B','White dwarf','සුදු වාමනයා',false,2),('b0000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000003','C','G-type main sequence','G වර්ගයේ ප්‍රධාන අනුක්‍රමය',true,3),('b0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000003','D','Neutron star','නියුට්‍රෝන තාරකාව',false,4),
 ('b0000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000004','A','Magnetism','චුම්බකත්වය',false,1),('b0000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-000000000004','B','Gravity','ගුරුත්වාකර්ෂණය',true,2),('b0000000-0000-0000-0000-000000000015','a0000000-0000-0000-0000-000000000004','C','Radiation pressure','විකිරණ පීඩනය',false,3),('b0000000-0000-0000-0000-000000000016','a0000000-0000-0000-0000-000000000004','D','Friction','ඝර්ෂණය',false,4)
on conflict (id) do update set question_id=excluded.question_id,label=excluded.label,text_en=excluded.text_en,text_si=excluded.text_si,is_correct=excluded.is_correct,question_position=excluded.question_position;

insert into public.quiz_questions (quiz_id,question_id,question_position,marks)
values
 ('d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',1,10),('d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002',2,10),('d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003',3,10),
 ('d0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001',1,20),('d0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',2,20),('d0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000004',3,20),
 ('d0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001',1,10),('d0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000002',2,10),
 ('d0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000003',1,10),('d0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000004',2,10)
-- Quiz question links become immutable after the first attempt by design.
-- Re-running the seed must preserve those historical links.
on conflict (quiz_id,question_id) do nothing;

commit;
