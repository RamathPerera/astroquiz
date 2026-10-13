-- ============================================================================
-- ASTROQUIZ SRI LANKA - SAMPLE SEED DATA
-- Run this script in your Supabase SQL Editor to populate sample questions,
-- quizzes, and active sessions for testing.
-- ============================================================================

-- 1. Insert sample Quizzes
INSERT INTO public.quizzes (id, title_en, title_si, description_en, description_si, quiz_type, duration_seconds, status)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'Daily Solar System Exploration',
    'දෛනික සූර්ය මණ්ඩල ගවේෂණය',
    'Explore planets, moons, and our place in the Solar System.',
    'ග්‍රහලෝක, සඳු සහ සූර්ය මණ්ඩලයේ අපගේ ස්ථානය ගවේෂණය කරන්න.',
    'daily',
    1800,
    'published'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'Weekend Astronomy Olympiad',
    'සති අන්ත තාරකා විද්‍යා ඔලිම්පියාඩ්',
    'Comprehensive test of celestial mechanics, stars, and cosmology.',
    'ආකාශ යාන්ත්‍ර විද්‍යාව, තරු සහ විශ්ව විද්‍යාව පිළිබඳ පුළුල් පරීක්ෂණය.',
    'weekend',
    5400,
    'published'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'Practice: Solar System Essentials',
    'පුහුණුව: සූර්ය මණ්ඩල මූලික කරුණු',
    'Unlimited practice questions for Solar System fundamentals.',
    'සූර්ය මණ්ඩල මූලික කරුණු සඳහා අසීමිත පුහුණු ප්‍රශ්න.',
    'practice',
    null,
    'published'
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'Practice: Stars & Galaxies',
    'පුහුණුව: තරු සහ මන්දාකිಣಿ',
    'Practice stellar evolution, spectra, and galaxy types.',
    'තරු පරිණාමය, වර්ණාවලි සහ මන්දාකිಣಿ වර්ග පුහුණු වන්න.',
    'practice',
    null,
    'published'
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Insert active Quiz Sessions
INSERT INTO public.quiz_sessions (id, quiz_id, starts_at, ends_at, timezone, status)
VALUES
  (
    's0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '22 hours',
    'Asia/Colombo',
    'open'
  ),
  (
    's0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '48 hours',
    'Asia/Colombo',
    'open'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert sample Questions
INSERT INTO public.questions (id, topic, difficulty, prompt_en, prompt_si, explanation_en, explanation_si)
VALUES
  (
    'q0000000-0000-0000-0000-000000000001',
    'Solar System',
    'easy',
    'Which planet in our Solar System has the most prominent ring system?',
    'අපගේ සූර්ය මණ්ඩලයේ වඩාත්ම කැපී පෙනෙන වළලු පද්ධතිය ඇත්තේ කුමන ග්‍රහලෝකයටද?',
    'Saturn has the most extensive and complex ring system in our Solar System.',
    'ශෙනී (Saturn) ග්‍රහලෝකයට පුළුල්ම සහ සංකීර්ණම වළලු පද්ධතිය ඇත.'
  ),
  (
    'q0000000-0000-0000-0000-000000000002',
    'Solar System',
    'medium',
    'What is the primary gas composing the atmosphere of Venus?',
    'ශුක්‍රයාගේ (Venus) වායුගෝලයේ ඇති ප්‍රධාන වායුව කුමක්ද?',
    'Venusian atmosphere is roughly 96.5% carbon dioxide.',
    'ශුක්‍රයාගේ වායුගෝලයෙන් 96.5% ක් පමණ කාබන්ඩයොක්සයිඩ් වේ.'
  ),
  (
    'q0000000-0000-0000-0000-000000000003',
    'Stars & Galaxies',
    'medium',
    'What type of star is our Sun classified as?',
    'අපගේ සූර්යයා කුමන වර්ගයේ තාරුවක් ලෙස වර්ගීකරණය කර තිබේද?',
    'The Sun is a G-type main-sequence star (yellow dwarf).',
    'සූර්යයා G-වර්ගයේ ප්‍රධාන අනුක්‍රමික තාරුවකි.'
  )
ON CONFLICT (id) DO NOTHING;


-- 4. Insert Question Options
INSERT INTO public.question_options (id, question_id, label, text_en, text_si, is_correct, question_position)
VALUES
  ('o0000001-01', 'q0000000-0000-0000-0000-000000000001', 'A', 'Jupiter', 'බ්‍රහස්පති', false, 1),
  ('o0000001-02', 'q0000000-0000-0000-0000-000000000001', 'B', 'Saturn', 'ශෙනී (සෙනසුරු)', true, 2),
  ('o0000001-03', 'q0000000-0000-0000-0000-000000000001', 'C', 'Uranus', 'යුරේනස්', false, 3),
  ('o0000001-04', 'q0000000-0000-0000-0000-000000000001', 'D', 'Neptune', 'නෙප්චූන්', false, 4),

  ('o0000002-01', 'q0000000-0000-0000-0000-000000000002', 'A', 'Oxygen', 'ඔක්සිජන්', false, 1),
  ('o0000002-02', 'q0000000-0000-0000-0000-000000000002', 'B', 'Nitrogen', 'නයිට්‍රජන්', false, 2),
  ('o0000002-03', 'q0000000-0000-0000-0000-000000000002', 'C', 'Carbon Dioxide', 'කාබන්ඩයොක්සයිඩ්', true, 3),
  ('o0000002-04', 'q0000000-0000-0000-0000-000000000002', 'D', 'Methane', 'මීතේන්', false, 4),

  ('o0000003-01', 'q0000000-0000-0000-0000-000000000003', 'A', 'Red Giant', 'රතු යෝධයා', false, 1),
  ('o0000003-02', 'q0000000-0000-0000-0000-000000000003', 'B', 'White Dwarf', 'සුදු වාමන', false, 2),
  ('o0000003-03', 'q0000000-0000-0000-0000-000000000003', 'C', 'G-type Main-Sequence (Yellow Dwarf)', 'G-වර්ගයේ ප්‍රධාන අනුක්‍රමික (කහ වාමන)', true, 3),
  ('o0000003-04', 'q0000000-0000-0000-0000-000000000003', 'D', 'Neutron Star', 'නියුට්‍රෝන තාරුව', false, 4)
ON CONFLICT (id) DO NOTHING;

-- 5. Link Questions to Quizzes
INSERT INTO public.quiz_questions (quiz_id, question_id, question_position, marks)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000001', 1, 10),
  ('d0000000-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000002', 2, 10),
  ('d0000000-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000003', 3, 10),

  ('d0000000-0000-0000-0000-000000000002', 'q0000000-0000-0000-0000-000000000001', 1, 20),
  ('d0000000-0000-0000-0000-000000000002', 'q0000000-0000-0000-0000-000000000002', 2, 20),
  ('d0000000-0000-0000-0000-000000000002', 'q0000000-0000-0000-0000-000000000003', 3, 20),

  ('d0000000-0000-0000-0000-000000000003', 'q0000000-0000-0000-0000-000000000001', 1, 10),
  ('d0000000-0000-0000-0000-000000000003', 'q0000000-0000-0000-0000-000000000002', 2, 10),

  ('d0000000-0000-0000-0000-000000000004', 'q0000000-0000-0000-0000-000000000003', 1, 10)
ON CONFLICT DO NOTHING;
