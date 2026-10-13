-- AstroQuiz Sri Lanka: initial content seed
-- Run the migration files first, then paste this file into Supabase SQL Editor.
-- This seed intentionally does not insert auth.users. Create users through
-- Supabase Authentication; the handle_new_user trigger creates their profile.

insert into public.quizzes
  (id, title_en, title_si, description_en, description_si, quiz_type, duration_seconds, status)
values
  ('d0000000-0000-0000-0000-000000000001', 'Daily Solar System Exploration', 'දෛනික සූර්ය මණ්ඩල ගවේෂණය', 'Explore planets, moons, and our place in the Solar System.', 'ග්‍රහලෝක, චන්ද්‍රයන් සහ සූර්ය මණ්ඩලයේ අපගේ ස්ථානය ගවේෂණය කරන්න.', 'daily', 1800, 'published'),
  ('d0000000-0000-0000-0000-000000000002', 'Weekend Astronomy Olympiad', 'සති අන්ත තාරකා විද්‍යා ඔලිම්පියාඩ්', 'A comprehensive test of celestial mechanics, stars, and cosmology.', 'ආකාශ යාන්ත්‍රණය, තරු සහ විශ්ව විද්‍යාව පිළිබඳ පුළුල් පරීක්ෂණයක්.', 'weekend', 5400, 'published'),
  ('d0000000-0000-0000-0000-000000000003', 'Practice: Solar System Essentials', 'පුහුණුව: සූර්ය මණ්ඩලයේ මූලික කරුණු', 'Unlimited practice for Solar System fundamentals.', 'සූර්ය මණ්ඩලයේ මූලික කරුණු සඳහා සීමා රහිත පුහුණුව.', 'practice', null, 'published'),
  ('d0000000-0000-0000-0000-000000000004', 'Practice: Stars and Galaxies', 'පුහුණුව: තරු සහ මන්දාකිණි', 'Practice stellar evolution, spectra, and galaxy types.', 'තරු පරිණාමය, වර්ණාවලි සහ මන්දාකිණි වර්ග පුහුණු වන්න.', 'practice', null, 'published')
on conflict (id) do update set
  title_en=excluded.title_en, title_si=excluded.title_si,
  description_en=excluded.description_en, description_si=excluded.description_si,
  quiz_type=excluded.quiz_type, duration_seconds=excluded.duration_seconds, status=excluded.status;

insert into public.quiz_sessions (id, quiz_id, starts_at, ends_at, timezone, status)
values
  ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', now() - interval '2 hours', now() + interval '22 hours', 'Asia/Colombo', 'open'),
  ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', now() - interval '1 hour', now() + interval '48 hours', 'Asia/Colombo', 'open')
on conflict (id) do update set starts_at=excluded.starts_at, ends_at=excluded.ends_at, status=excluded.status;

insert into public.questions (id, topic, difficulty, prompt_en, prompt_si, explanation_en, explanation_si)
values
  ('q0000000-0000-0000-0000-000000000001', 'Solar System', 'easy', 'Which planet has the most prominent ring system?', 'වඩාත් කැපී පෙනෙන වළලු පද්ධතිය ඇති ග්‍රහලෝකය කුමක්ද?', 'Saturn has the most extensive and complex ring system.', 'සෙනසුරුට වඩාත් පුළුල් හා සංකීර්ණ වළලු පද්ධතියක් ඇත.'),
  ('q0000000-0000-0000-0000-000000000002', 'Solar System', 'medium', 'What gas primarily composes the atmosphere of Venus?', 'සිකුරුගේ වායුගෝලය ප්‍රධාන වශයෙන් සමන්විත වන්නේ කුමන වායුවෙන්ද?', 'Venus is roughly 96.5% carbon dioxide.', 'සිකුරුගේ වායුගෝලය ආසන්න වශයෙන් සියයට 96.5ක් කාබන් ඩයොක්සයිඩ් වේ.'),
  ('q0000000-0000-0000-0000-000000000003', 'Stars and Galaxies', 'medium', 'What type of star is our Sun?', 'අපගේ සූර්යයා කුමන තාරකා වර්ගයට අයත්ද?', 'The Sun is a G-type main-sequence star.', 'සූර්යයා G වර්ගයේ ප්‍රධාන අනුක්‍රම තාරකාවකි.'),
  ('q0000000-0000-0000-0000-000000000004', 'Celestial Motion', 'hard', 'What force keeps planets in orbit around the Sun?', 'ග්‍රහලෝක සූර්යයා වටා කක්ෂගතව තබන බලය කුමක්ද?', 'Gravity provides the centripetal force for planetary orbits.', 'ගුරුත්වාකර්ෂණය ග්‍රහලෝක කක්ෂ සඳහා කේන්ද්‍රගාමී බලය සපයයි.')
on conflict (id) do update set
  topic=excluded.topic, difficulty=excluded.difficulty, prompt_en=excluded.prompt_en, prompt_si=excluded.prompt_si,
  explanation_en=excluded.explanation_en, explanation_si=excluded.explanation_si;

insert into public.question_options (id, question_id, label, text_en, text_si, is_correct, question_position)
values
  ('o0000001-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000001', 'A', 'Jupiter', 'බ්‍රහස්පති', false, 1),
  ('o0000001-0000-0000-0000-000000000002', 'q0000000-0000-0000-0000-000000000001', 'B', 'Saturn', 'සෙනසුරු', true, 2),
  ('o0000001-0000-0000-0000-000000000003', 'q0000000-0000-0000-0000-000000000001', 'C', 'Uranus', 'යුරේනස්', false, 3),
  ('o0000001-0000-0000-0000-000000000004', 'q0000000-0000-0000-0000-000000000001', 'D', 'Neptune', 'නෙප්චූන්', false, 4),
  ('o0000002-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000002', 'A', 'Oxygen', 'ඔක්සිජන්', false, 1),
  ('o0000002-0000-0000-0000-000000000002', 'q0000000-0000-0000-0000-000000000002', 'B', 'Nitrogen', 'නයිට්‍රජන්', false, 2),
  ('o0000002-0000-0000-0000-000000000003', 'q0000000-0000-0000-0000-000000000002', 'C', 'Carbon dioxide', 'කාබන් ඩයොක්සයිඩ්', true, 3),
  ('o0000002-0000-0000-0000-000000000004', 'q0000000-0000-0000-0000-000000000002', 'D', 'Methane', 'මීතේන්', false, 4),
  ('o0000003-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000003', 'A', 'Red giant', 'රතු යෝධයා', false, 1),
  ('o0000003-0000-0000-0000-000000000002', 'q0000000-0000-0000-0000-000000000003', 'B', 'White dwarf', 'සුදු වාමනයා', false, 2),
  ('o0000003-0000-0000-0000-000000000003', 'q0000000-0000-0000-0000-000000000003', 'C', 'G-type main sequence', 'G වර්ගයේ ප්‍රධාන අනුක්‍රමය', true, 3),
  ('o0000003-0000-0000-0000-000000000004', 'q0000000-0000-0000-0000-000000000003', 'D', 'Neutron star', 'නියුට්‍රෝන තාරකාව', false, 4),
  ('o0000004-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000004', 'A', 'Magnetism', 'චුම්බකත්වය', false, 1),
  ('o0000004-0000-0000-0000-000000000002', 'q0000000-0000-0000-0000-000000000004', 'B', 'Gravity', 'ගුරුත්වාකර්ෂණය', true, 2),
  ('o0000004-0000-0000-0000-000000000003', 'q0000000-0000-0000-0000-000000000004', 'C', 'Radiation pressure', 'විකිරණ පීඩනය', false, 3),
  ('o0000004-0000-0000-0000-000000000004', 'q0000000-0000-0000-0000-000000000004', 'D', 'Friction', 'ඝර්ෂණය', false, 4)
on conflict (id) do update set
  question_id=excluded.question_id, label=excluded.label, text_en=excluded.text_en, text_si=excluded.text_si,
  is_correct=excluded.is_correct, question_position=excluded.question_position;

insert into public.quiz_questions (quiz_id, question_id, question_position, marks)
values
  ('d0000000-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000001', 1, 10),
  ('d0000000-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000002', 2, 10),
  ('d0000000-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000003', 3, 10),
  ('d0000000-0000-0000-0000-000000000002', 'q0000000-0000-0000-0000-000000000001', 1, 20),
  ('d0000000-0000-0000-0000-000000000002', 'q0000000-0000-0000-0000-000000000003', 2, 20),
  ('d0000000-0000-0000-0000-000000000002', 'q0000000-0000-0000-0000-000000000004', 3, 20),
  ('d0000000-0000-0000-0000-000000000003', 'q0000000-0000-0000-0000-000000000001', 1, 10),
  ('d0000000-0000-0000-0000-000000000003', 'q0000000-0000-0000-0000-000000000002', 2, 10),
  ('d0000000-0000-0000-0000-000000000004', 'q0000000-0000-0000-0000-000000000003', 1, 10),
  ('d0000000-0000-0000-0000-000000000004', 'q0000000-0000-0000-0000-000000000004', 2, 10)
on conflict (quiz_id, question_id) do update set question_position=excluded.question_position, marks=excluded.marks;
