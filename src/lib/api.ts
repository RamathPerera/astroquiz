import { supabase } from "./supabase";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  role: "student" | "moderator" | "admin";
  is_active: boolean;
  created_at: string;
}

export interface Quiz {
  id: string;
  title_en: string;
  title_si: string;
  description_en: string | null;
  description_si: string | null;
  quiz_type: "daily" | "weekend" | "practice";
  duration_seconds: number | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  active_session?: QuizSession | null;
}

export interface QuizSession {
  id: string;
  quiz_id: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  status: "scheduled" | "open" | "closed";
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  session_id: string | null;
  attempt_number: number;
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
  status: "in_progress" | "submitted" | "expired";
  raw_score: number;
  max_score: number;
  accuracy_percent: number;
  duration_seconds: number;
  created_at: string;
  quiz?: {
    title_en: string;
    title_si: string;
    quiz_type: "daily" | "weekend" | "practice";
  };
}

export interface QuizQuestionRow {
  quiz_question_id: string;
  question_id: string;
  question_position: number;
  marks: number;
  topic: string;
  difficulty: "easy" | "medium" | "hard" | "olympiad";
  prompt_en: string;
  prompt_si: string;
  option_id: string;
  option_label: string;
  option_text_en: string;
  option_text_si: string;
}

export interface QuestionOptionItem {
  id: string;
  label: string;
  text_en: string;
  text_si: string;
}

export interface FormattedQuestion {
  quiz_question_id: string;
  question_id: string;
  question_position: number;
  marks: number;
  topic: string;
  difficulty: "easy" | "medium" | "hard" | "olympiad";
  prompt_en: string;
  prompt_si: string;
  options: QuestionOptionItem[];
}

export interface AttemptReviewItem {
  quiz_question_id: string;
  question_position: number;
  topic: string;
  difficulty: string;
  prompt_en: string;
  prompt_si: string;
  selected_option_id: string | null;
  selected_label: string | null;
  selected_text_en: string | null;
  selected_text_si: string | null;
  is_correct: boolean;
  marks_awarded: number;
  correct_option_id: string;
  correct_label: string;
  correct_text_en: string;
  correct_text_si: string;
  explanation_en: string;
  explanation_si: string;
}

export interface LeaderboardItem {
  rank: number;
  user_id: string;
  name: string;
  points: number;
  is_current_user?: boolean;
}

export interface UserPreferences {
  language: "en" | "si";
  theme: "light" | "dark" | "system";
}

export interface DashboardStats {
  points: number;
  accuracy: number;
  activeDays: number;
  rank: string;
  totalAttempts: number;
  recentAttempts: QuizAttempt[];
  dailyQuiz: Quiz | null;
  weekendQuiz: Quiz | null;
  topicProgress: { topic: string; accuracy: number }[];
  attempts_count: number;
  accuracy_percent: number;
  streak_days: number;
}

export interface ModeratorStats {
  questionsCount: number;
  sessionsCount: number;
  publishedQuizzesCount: number;
  studentsCount: number;
}

export interface QuizDraftQuestion {
  id?: string;
  prompt_en?: string;
  prompt_si: string;
  options: { label: string; text_en?: string; text_si: string; is_correct: boolean }[];
}

export interface ModeratorQuestion extends QuizDraftQuestion {
  id: string;
}

export interface ModeratorQuiz extends Quiz {
  question_count: number;
  session?: QuizSession | null;
  attempt_count?: number;
  questions?: ModeratorQuestion[];
}
// ================= USER & PROFILE =================

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

export async function updateProfileName(displayName: string): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);
  return !error;
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("user_preferences")
    .select("language, theme")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return data as UserPreferences;
}

export async function saveUserPreferences(
  prefs: Partial<UserPreferences>,
): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    });
  return !error;
}

// ================= QUIZZES & SESSIONS =================

export async function getQuizzesWithSessions(quizId?: string): Promise<Quiz[]> {
  if (!supabase) return [];
  const { data: rows, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !rows) return [];
  const quizRows = quizId ? rows.filter((quiz) => quiz.id === quizId) : rows;
  if (quizRows.length === 0) return [];

  const now = new Date().toISOString();
  const { data: sessions } = await supabase
    .from("quiz_sessions")
    .select("*")
    .in("quiz_id", quizRows.map((q) => q.id))
    .in("status", ["scheduled", "open"])
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("starts_at", { ascending: true });

  const activeSessionsByQuiz = new Map<string, QuizSession>();
  if (sessions) {
    for (const s of sessions) {
      if (!activeSessionsByQuiz.has(s.quiz_id)) activeSessionsByQuiz.set(s.quiz_id, s);
    }
  }

  return quizRows.map((q) => ({
    ...q,
    active_session: activeSessionsByQuiz.get(q.id) || null,
  })) as Quiz[];
}

export async function getPracticeQuizzes(): Promise<Quiz[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("quiz_type", "practice")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Quiz[];
}
// ================= QUIZ LIFECYCLE (RPCs) =================

export async function startOrResumeQuiz(
  quizId: string,
  sessionId: string | null = null,
): Promise<{ attempt: QuizAttempt | null; error: string | null }> {
  if (!supabase) return { attempt: null, error: "Database not connected" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { attempt: null, error: "Authentication required" };

  // Check for in-progress attempt first
  let existingQuery = supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("quiz_id", quizId)
    .eq("status", "in_progress");

  if (sessionId) {
    existingQuery = existingQuery.eq("session_id", sessionId);
  }

  const { data: existingAttempts } = await existingQuery;
  if (existingAttempts && existingAttempts.length > 0) {
    return { attempt: existingAttempts[0] as QuizAttempt, error: null };
  }

  // Start new attempt via RPC
  const { data, error } = await supabase.rpc("start_quiz", {
    p_quiz_id: quizId,
    p_session_id: sessionId || null,
  });

  if (error) {
    return {
      attempt: null,
      error: [error.message, error.details, error.hint].filter(Boolean).join(" "),
    };
  }

  return { attempt: data as QuizAttempt, error: null };
}

export async function getQuizQuestions(
  quizId: string,
): Promise<FormattedQuestion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_quiz_questions", {
    p_quiz_id: quizId,
  });

  if (error || !data) return [];

  const rows = data as QuizQuestionRow[];
  const questionMap = new Map<string, FormattedQuestion>();

  for (const r of rows) {
    if (!questionMap.has(r.quiz_question_id)) {
      questionMap.set(r.quiz_question_id, {
        quiz_question_id: r.quiz_question_id,
        question_id: r.question_id,
        question_position: r.question_position,
        marks: Number(r.marks),
        topic: r.topic,
        difficulty: r.difficulty,
        prompt_en: r.prompt_en,
        prompt_si: r.prompt_si,
        options: [],
      });
    }
    const q = questionMap.get(r.quiz_question_id)!;
    q.options.push({
      id: r.option_id,
      label: r.option_label,
      text_en: r.option_text_en,
      text_si: r.option_text_si,
    });
  }

  return Array.from(questionMap.values()).sort(
    (a, b) => a.question_position - b.question_position,
  );
}

export async function getAttemptAnswers(
  attemptId: string,
): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("attempt_answers")
    .select("quiz_question_id, selected_option_id")
    .eq("attempt_id", attemptId);

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const item of data) {
    if (item.selected_option_id) {
      map[item.quiz_question_id] = item.selected_option_id;
    }
  }
  return map;
}

export async function saveQuizAnswer(
  attemptId: string,
  quizQuestionId: string,
  selectedOptionId: string | null,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.rpc("save_quiz_answer", {
    p_attempt_id: attemptId,
    p_quiz_question_id: quizQuestionId,
    p_selected_option_id: selectedOptionId,
  });
  return !error;
}

export async function submitQuiz(
  attemptId: string,
): Promise<{ result: QuizAttempt | null; error: string | null }> {
  if (!supabase) return { result: null, error: "Database not connected" };
  const { data, error } = await supabase.rpc("submit_quiz", {
    p_attempt_id: attemptId,
  });
  if (error) return { result: null, error: error.message };
  return { result: data as QuizAttempt, error: null };
}

export async function getAttemptReview(
  attemptId: string,
): Promise<AttemptReviewItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_attempt_review", {
    p_attempt_id: attemptId,
  });
  if (error || !data) return [];
  return data as AttemptReviewItem[];
}

// ================= ATTEMPTS & DASHBOARD =================

export async function getUserAttempts(): Promise<QuizAttempt[]> {
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(
      `
      id, user_id, quiz_id, session_id, attempt_number,
      started_at, deadline_at, submitted_at, status,
      raw_score, max_score, accuracy_percent, duration_seconds, created_at,
      quizzes (title_en, title_si, quiz_type)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((a: any) => ({
    ...a,
    quiz: a.quizzes,
  })) as QuizAttempt[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const defaultStats: DashboardStats = {
    points: 0,
    accuracy: 0,
    activeDays: 0,
    rank: "#—",
    totalAttempts: 0,
    recentAttempts: [],
    dailyQuiz: null,
    weekendQuiz: null,
    topicProgress: [],
    attempts_count: 0,
    accuracy_percent: 0,
    streak_days: 0,
  };

  if (!supabase) return defaultStats;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return defaultStats;

  const attempts = await getUserAttempts();
  const submitted = attempts.filter((a) => a.status === "submitted");

  const totalAttempts = submitted.length;
  const avgAccuracy =
    totalAttempts > 0
      ? Math.round(
          submitted.reduce(
            (sum, a) => sum + Number(a.accuracy_percent || 0),
            0,
          ) / totalAttempts,
        )
      : 0;

  const activeDaySet = new Set(
    attempts.map((a) => (a.started_at ? a.started_at.slice(0, 10) : "")),
  );
  activeDaySet.delete("");
  const activeDays = activeDaySet.size;

  let userPoints = 0;
  let userRank = "#—";

  const { data: userEntries } = await supabase
    .from("leaderboard_entries")
    .select("points_awarded")
    .eq("user_id", user.id);

  if (userEntries && userEntries.length > 0) {
    userPoints = Math.round(
      userEntries.reduce((sum, e) => sum + Number(e.points_awarded || 0), 0),
    );
  }

  const leaderboard = await getLeaderboard("all");
  const found = leaderboard.find((l) => l.user_id === user.id);
  if (found) {
    userRank = `#${found.rank}`;
  } else if (userPoints > 0) {
    userRank = `#${leaderboard.length + 1}`;
  }

  const quizzes = await getQuizzesWithSessions();
  const nowMs = Date.now();
  const hasOpenSession = (quiz: Quiz) => quiz.active_session &&
    new Date(quiz.active_session.starts_at).getTime() <= nowMs &&
    new Date(quiz.active_session.ends_at).getTime() > nowMs;
  const daily = quizzes.find((q) => q.quiz_type === "daily" && hasOpenSession(q)) || null;
  const weekend = quizzes.find((q) => q.quiz_type === "weekend" && hasOpenSession(q)) || null;

  const { data: topicRows } = await supabase.rpc("get_topic_progress");
  const topicProgress = (topicRows || []).map((row: { topic: string; accuracy: number }) => ({
    topic: row.topic,
    accuracy: Number(row.accuracy || 0),
  }));

  return {
    points: userPoints,
    accuracy: avgAccuracy,
    activeDays,
    rank: userRank,
    totalAttempts,
    recentAttempts: attempts.slice(0, 5),
    dailyQuiz: daily,
    weekendQuiz: weekend,
    topicProgress,
    attempts_count: totalAttempts,
    accuracy_percent: avgAccuracy,
    streak_days: activeDays,
  };
}

// ================= LEADERBOARD =================

export async function getLeaderboard(
  timeframe: "all" | "weekly",
): Promise<LeaderboardItem[]> {
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  // Try RPC get_leaderboard first if available
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_leaderboard",
      {
        p_timeframe: timeframe,
      },
    );

    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      return rpcData.map((row: any, index: number) => ({
        rank: Number(row.rank) || index + 1,
        user_id: row.user_id,
        name: row.display_name || row.username || "Astronomer",
        points: Math.round(Number(row.total_points || 0)),
        is_current_user: row.user_id === currentUserId,
      }));
    }
  } catch {
    // fallback if RPC doesn't exist
  }

  // Fallback: Query leaderboard_entries directly
  let query = supabase
    .from("leaderboard_entries")
    .select("user_id, points_awarded, awarded_at");

  if (timeframe === "weekly") {
    const monday = new Date();
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    query = query.gte("awarded_at", monday.toISOString());
  }

  const { data: entries, error } = await query;
  if (error || !entries || entries.length === 0) return [];

  const userMap = new Map<string, number>();
  for (const e of entries) {
    const prev = userMap.get(e.user_id) || 0;
    userMap.set(e.user_id, prev + Number(e.points_awarded || 0));
  }

  const sortedUsers = Array.from(userMap.entries()).sort((a, b) => b[1] - a[1]);
  const userIds = sortedUsers.map(([uid]) => uid);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .in("id", userIds);

  const profileMap = new Map<string, string>();
  if (profiles) {
    for (const p of profiles) {
      profileMap.set(p.id, p.display_name || p.username);
    }
  }

  return sortedUsers.map(([uid, pts], idx) => ({
    rank: idx + 1,
    user_id: uid,
    name:
      profileMap.get(uid) ||
      (uid === currentUserId ? "You" : `Astronomer ${idx + 1}`),
    points: Math.round(pts),
    is_current_user: uid === currentUserId,
  }));
}

// ================= MODERATOR / ADMIN OPS =================

export async function getModeratorStats(): Promise<ModeratorStats> {
  if (!supabase)
    return { questionsCount: 0, sessionsCount: 0, publishedQuizzesCount: 0, studentsCount: 0 };
  const [qRes, sRes, qzRes, studentsRes] = await Promise.all([
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("quiz_sessions").select("id", { count: "exact", head: true }),
    supabase
      .from("quizzes")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
  ]);
  return {
    questionsCount: qRes.count || 0,
    sessionsCount: sRes.count || 0,
    publishedQuizzesCount: qzRes.count || 0,
    studentsCount: studentsRes.count || 0,
  };
}

export async function getAdminStats() {
  if (!supabase)
    return {
      usersCount: 0,
      moderatorsCount: 0,
      activeSessionsCount: 0,
      auditEventsCount: 0,
    };
  const [uRes, mRes, sRes, aRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "moderator"),
    supabase
      .from("quiz_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }),
  ]);
  return {
    usersCount: uRes.count || 0,
    moderatorsCount: mRes.count || 0,
    activeSessionsCount: sRes.count || 0,
    auditEventsCount: aRes.count || 0,
  };
}

export async function getAdminProfiles(): Promise<Profile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Profile[];
}

export async function getModeratorQuestions(): Promise<any[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("questions")
    .select("*, question_options(*)")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export interface AdminStats {
  usersCount: number;
  moderatorsCount: number;
  activeSessionsCount: number;
  auditEventsCount: number;
}

export async function createQuestionWithOptions(question: {
  topic: string;
  difficulty: "easy" | "medium" | "hard" | "olympiad";
  prompt_en: string;
  prompt_si: string;
  explanation_en: string;
  explanation_si: string;
  options: {
    label: string;
    text_en: string;
    text_si: string;
    is_correct: boolean;
    question_position: number;
  }[];
}): Promise<{ id: string | null; error: string | null }> {
  if (!supabase) return { id: null, error: "Database not connected" };
  const { data: qData, error: qError } = await supabase
    .from("questions")
    .insert({
      topic: question.topic,
      difficulty: question.difficulty,
      prompt_en: question.prompt_en,
      prompt_si: question.prompt_si,
      explanation_en: question.explanation_en,
      explanation_si: question.explanation_si,
    })
    .select("id")
    .single();

  if (qError || !qData)
    return { id: null, error: qError?.message || "Failed to create question" };

  const optRows = question.options.map((opt) => ({
    question_id: qData.id,
    label: opt.label,
    text_en: opt.text_en,
    text_si: opt.text_si,
    is_correct: opt.is_correct,
    question_position: opt.question_position,
  }));

  const { error: optError } = await supabase
    .from("question_options")
    .insert(optRows);
  if (optError) {
    return { id: qData.id, error: optError.message };
  }
  return { id: qData.id, error: null };
}

export async function createQuiz(quiz: {
  title_en: string;
  title_si: string;
  description_en: string;
  description_si: string;
  quiz_type: "daily" | "weekend" | "practice";
  duration_seconds: number | null;
  status: "draft" | "published";
}): Promise<{ id: string | null; error: string | null }> {
  if (!supabase) return { id: null, error: "Database not connected" };
  const expectedDuration =
    quiz.quiz_type === "daily" ? 1800 : quiz.quiz_type === "weekend" ? 5400 : null;
  if (quiz.duration_seconds !== expectedDuration) {
    return {
      id: null,
      error: quiz.quiz_type === "practice"
        ? "Practice quizzes must use unlimited duration."
        : `${quiz.quiz_type === "daily" ? "Daily" : "Weekend"} quizzes must use the configured duration.`,
    };
  }
  const { data, error } = await supabase
    .from("quizzes")
    .insert({ ...quiz, duration_seconds: expectedDuration })
    .select("id")
    .single();
  if (error || !data)
    return {
      id: null,
      error: [error?.message, error?.details, error?.hint].filter(Boolean).join(" ") || "Failed to create quiz",
    };

  if (quiz.status === "published" && quiz.quiz_type !== "practice") {
    const now = new Date();
    const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { error: sessionError } = await supabase.from("quiz_sessions").insert({
      quiz_id: data.id,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      timezone: "Asia/Colombo",
      status: "open",
    });
    if (sessionError) {
      return {
        id: data.id,
        error: ["Quiz created, but its session could not be opened.", sessionError.message, sessionError.details, sessionError.hint]
          .filter(Boolean)
          .join(" "),
      };
    }
  }
  return { id: data.id, error: null };
}

export async function createQuizSession(session: {
  quiz_id: string;
  starts_at: string;
  ends_at: string;
  status?: "scheduled" | "open" | "closed";
}): Promise<{ id: string | null; error: string | null }> {
  if (!supabase) return { id: null, error: "Database not connected" };
  const { data, error } = await supabase
    .from("quiz_sessions")
    .insert({
      quiz_id: session.quiz_id,
      starts_at: session.starts_at,
      ends_at: session.ends_at,
      status: session.status || "open",
    })
    .select("id")
    .single();
  if (error || !data)
    return { id: null, error: error?.message || "Failed to schedule session" };
  return { id: data.id, error: null };
}

export async function getModeratorQuizzes(): Promise<ModeratorQuiz[]> {
  if (!supabase) return [];
  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !quizzes) return [];

  const quizIds = (quizzes as any[]).map((quiz) => quiz.id);
  if (quizIds.length === 0) return [];
  const [{ data: sessions }, { data: links }, { data: attempts }] = await Promise.all([
    supabase.from("quiz_sessions").select("*").in("quiz_id", quizIds),
    supabase.from("quiz_questions").select("id,quiz_id,question_id,question_position,marks").in("quiz_id", quizIds).order("question_position"),
    supabase.from("quiz_attempts").select("quiz_id").in("quiz_id", quizIds),
  ]);
  const questionIds = [...new Set(((links || []) as any[]).map((link) => link.question_id))];
  const { data: questions } = questionIds.length
    ? await supabase.from("questions").select("id,prompt_en,prompt_si,question_options(id,label,text_en,text_si,is_correct,question_position)").in("id", questionIds)
    : { data: [] };
  const questionMap = new Map((questions || []).map((question: any) => [question.id, question]));

  return (quizzes as any[]).map((quiz) => {
    const quizLinks = ((links || []) as any[])
      .filter((link) => link.quiz_id === quiz.id)
      .sort((a, b) => a.question_position - b.question_position);
    const quizSessions = ((sessions || []) as any[])
      .filter((session) => session.quiz_id === quiz.id)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return {
      ...quiz,
      question_count: quizLinks.length,
      attempt_count: ((attempts || []) as any[]).filter((attempt) => attempt.quiz_id === quiz.id).length,
      session: quizSessions[0] || null,
      questions: quizLinks.map((link) => {
        const question = questionMap.get(link.question_id);
        return {
          id: link.question_id,
          prompt_en: question?.prompt_en || "",
          prompt_si: question?.prompt_si || "",
          options: [...(question?.question_options || [])]
            .sort((a, b) => a.question_position - b.question_position)
            .map((option) => ({ label: option.label, text_en: option.text_en, text_si: option.text_si, is_correct: option.is_correct })),
        };
      }),
    };
  });
}

export async function createQuizWithQuestions(input: {
  title_si: string;
  description_si: string;
  quiz_type: "daily" | "weekend" | "practice";
  starts_at?: string;
  questions: QuizDraftQuestion[];
}): Promise<{ id: string | null; error: string | null }> {
  if (!supabase) return { id: null, error: "Database not connected" };
  if (input.questions.length === 0) return { id: null, error: "Add at least one question." };
  if (input.questions.some((q) => q.options.length !== 4 || q.options.filter((o) => o.is_correct).length !== 1)) {
    return { id: null, error: "Every question needs four options and one correct answer." };
  }

  let startsAt: Date | null = input.starts_at ? new Date(input.starts_at) : null;
  let endsAt: Date | null = null;
  if (input.quiz_type !== "practice") {
    if (!startsAt || Number.isNaN(startsAt.getTime())) return { id: null, error: "Choose a valid date and time." };
    if (input.quiz_type === "daily") {
      const dayStart = new Date(startsAt);
      dayStart.setHours(0, 0, 0, 0);
      startsAt = dayStart;
      endsAt = new Date(dayStart);
      endsAt.setDate(endsAt.getDate() + 1);
    } else {
      endsAt = new Date(startsAt.getTime() + 90 * 60 * 1000);
    }

    const weekStart = new Date(startsAt);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const conflictStart = input.quiz_type === "daily" ? startsAt : weekStart;
    const conflictEnd = input.quiz_type === "daily" ? endsAt! : weekEnd;
    const { data: existingSessions, error: existingError } = await supabase
      .from("quiz_sessions")
      .select("quiz_id, starts_at, quizzes!inner(quiz_type, status)")
      .lt("starts_at", conflictEnd.toISOString())
      .gt("ends_at", conflictStart.toISOString());
    if (existingError) return { id: null, error: existingError.message };
    const duplicate = (existingSessions as any[] | null)?.some((session) =>
      session.quizzes?.status === "published" && session.quizzes?.quiz_type === input.quiz_type,
    );
    if (duplicate) {
      return { id: null, error: input.quiz_type === "daily"
        ? "A daily quiz already exists for that date."
        : "A weekend quiz is already scheduled for that week." };
    }
  }

  const quizTypeDuration = input.quiz_type === "daily" ? 1800 : input.quiz_type === "weekend" ? 5400 : null;
  const { data: quiz, error: quizError } = await supabase.from("quizzes").insert({
    title_en: input.title_si,
    title_si: input.title_si,
    description_en: input.description_si,
    description_si: input.description_si,
    quiz_type: input.quiz_type,
    duration_seconds: quizTypeDuration,
    status: "published",
  }).select("id").single();
  if (quizError || !quiz) return { id: null, error: quizError?.message || "Could not create quiz." };

  const createdQuestionIds: string[] = [];
  try {
    if (startsAt && endsAt) {
      const { error: sessionError } = await supabase.from("quiz_sessions").insert({
        quiz_id: quiz.id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        timezone: "Asia/Colombo",
        status: startsAt <= new Date() ? "open" : "scheduled",
      });
      if (sessionError) throw sessionError;
    }
    for (const [index, question] of input.questions.entries()) {
      const { data: createdQuestion, error: questionError } = await supabase.from("questions").insert({
        topic: "Astronomy",
        difficulty: "medium",
        prompt_en: question.prompt_en?.trim() || question.prompt_si,
        prompt_si: question.prompt_si,
        explanation_en: "",
        explanation_si: "",
      }).select("id").single();
      if (questionError || !createdQuestion) throw questionError || new Error("Could not create question.");
      createdQuestionIds.push(createdQuestion.id);
      const { error: optionsError } = await supabase.from("question_options").insert(question.options.map((option, optionIndex) => ({
        question_id: createdQuestion.id,
        label: option.label,
        text_en: option.text_en?.trim() || option.text_si,
        text_si: option.text_si,
        is_correct: option.is_correct,
        question_position: optionIndex + 1,
      })));
      if (optionsError) throw optionsError;
      const { error: linkError } = await supabase.from("quiz_questions").insert({
        quiz_id: quiz.id,
        question_id: createdQuestion.id,
        question_position: index + 1,
        marks: 10,
      });
      if (linkError) throw linkError;
    }
    return { id: quiz.id, error: null };
  } catch (error: any) {
    if (createdQuestionIds.length) await supabase.from("questions").delete().in("id", createdQuestionIds);
    await supabase.from("quizzes").delete().eq("id", quiz.id);
    return { id: null, error: error?.message || "Could not finish quiz creation." };
  }
}

export async function updateQuizDetails(id: string, values: {
  title_si: string;
  description_si: string;
  status: "draft" | "published" | "archived";
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Database not connected" };
  const { error } = await supabase.from("quizzes").update({
    title_en: values.title_si,
    title_si: values.title_si,
    description_en: values.description_si,
    description_si: values.description_si,
    status: values.status,
  }).eq("id", id);
  return { error: error?.message || null };
}

export async function updateQuizFull(input: {
  id: string;
  title_si: string;
  description_si: string;
  status: "draft" | "published" | "archived";
  quiz_type: "daily" | "weekend" | "practice";
  starts_at?: string;
  questions: QuizDraftQuestion[];
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Database not connected" };
  if (!input.title_si.trim() || !input.description_si.trim()) return { error: "Add a title and description." };
  if (input.questions.length === 0) return { error: "Add at least one question." };
  if (input.questions.some((q) => q.options.length !== 4 || q.options.filter((o) => o.is_correct).length !== 1)) {
    return { error: "Every question needs four options and one correct answer." };
  }

  const { count: attemptCount } = await supabase
    .from("quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", input.id);
  if ((attemptCount || 0) > 0) {
    return { error: "This quiz already has attempts, so its questions and schedule are locked to protect student results." };
  }

  let startsAt: Date | null = input.starts_at ? new Date(input.starts_at) : null;
  let endsAt: Date | null = null;
  if (input.quiz_type !== "practice") {
    if (!startsAt || Number.isNaN(startsAt.getTime())) return { error: "Choose a valid date and time." };
    if (input.quiz_type === "daily") {
      startsAt.setHours(0, 0, 0, 0);
      endsAt = new Date(startsAt);
      endsAt.setDate(endsAt.getDate() + 1);
    } else {
      endsAt = new Date(startsAt.getTime() + 90 * 60 * 1000);
    }
    const weekStart = new Date(startsAt);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const conflictStart = input.quiz_type === "daily" ? startsAt : weekStart;
    const conflictEnd = input.quiz_type === "daily" ? endsAt! : weekEnd;
    const { data: existingSessions, error: conflictError } = await supabase
      .from("quiz_sessions")
      .select("quiz_id, quizzes!inner(quiz_type,status)")
      .neq("quiz_id", input.id)
      .lt("starts_at", conflictEnd.toISOString())
      .gt("ends_at", conflictStart.toISOString());
    if (conflictError) return { error: conflictError.message };
    const duplicate = input.status === "published" && (existingSessions as any[] | null)?.some((session) =>
      session.quizzes?.status === "published" && session.quizzes?.quiz_type === input.quiz_type,
    );
    if (duplicate) return { error: input.quiz_type === "daily" ? "A published daily quiz already exists for that date." : "A published weekend quiz is already scheduled for that week." };
  }

  const { error: quizError } = await supabase.from("quizzes").update({
    title_en: input.title_si,
    title_si: input.title_si,
    description_en: input.description_si,
    description_si: input.description_si,
    quiz_type: input.quiz_type,
    duration_seconds: input.quiz_type === "daily" ? 1800 : input.quiz_type === "weekend" ? 5400 : null,
    status: input.status,
  }).eq("id", input.id);
  if (quizError) return { error: quizError.message };

  const { data: existingSessions } = await supabase.from("quiz_sessions").select("id").eq("quiz_id", input.id).order("starts_at");
  if (input.quiz_type === "practice") {
    if ((existingSessions || []).length) await supabase.from("quiz_sessions").delete().eq("quiz_id", input.id);
  } else {
    const session = (existingSessions || [])[0];
    const sessionValues = {
      quiz_id: input.id,
      starts_at: startsAt!.toISOString(),
      ends_at: endsAt!.toISOString(),
      timezone: "Asia/Colombo",
      status: startsAt! <= new Date() ? "open" : "scheduled",
    };
    if (session) await supabase.from("quiz_sessions").update(sessionValues).eq("id", session.id);
    else await supabase.from("quiz_sessions").insert(sessionValues);
    if ((existingSessions || []).length > 1) {
      await supabase.from("quiz_sessions").delete().in("id", (existingSessions || []).slice(1).map((item) => item.id));
    }
  }

  const { data: existingLinks } = await supabase.from("quiz_questions").select("id,question_id,question_position").eq("quiz_id", input.id);
  const currentIds = new Set(input.questions.map((question) => question.id).filter(Boolean));
  const removedLinks = ((existingLinks || []) as any[]).filter((link) => !currentIds.has(link.question_id));
  for (const link of removedLinks) {
    await supabase.from("quiz_questions").delete().eq("id", link.id);
    const { count: remainingLinks } = await supabase.from("quiz_questions").select("id", { count: "exact", head: true }).eq("question_id", link.question_id);
    if (!remainingLinks) {
      await supabase.from("question_options").delete().eq("question_id", link.question_id);
      await supabase.from("questions").delete().eq("id", link.question_id);
    }
  }

  const existingLinkMap = new Map(((existingLinks || []) as any[]).map((link) => [link.question_id, link]));
  for (const [index, question] of input.questions.entries()) {
    let questionId = question.id;
    const existingLink = questionId ? existingLinkMap.get(questionId) : null;
    if (!existingLink) {
      const { data: createdQuestion, error: questionError } = await supabase.from("questions").insert({
        topic: "Astronomy", difficulty: "medium", prompt_en: question.prompt_en?.trim() || question.prompt_si, prompt_si: question.prompt_si, explanation_en: "", explanation_si: "",
      }).select("id").single();
      if (questionError || !createdQuestion) return { error: questionError?.message || "Could not create question." };
      questionId = createdQuestion.id;
      const { error: linkError } = await supabase.from("quiz_questions").insert({ quiz_id: input.id, question_id: questionId, question_position: index + 1, marks: 10 });
      if (linkError) return { error: linkError.message };
    } else {
      const { count: linkCount } = await supabase.from("quiz_questions").select("id", { count: "exact", head: true }).eq("question_id", questionId);
      if ((linkCount || 0) > 1) {
        const { data: clonedQuestion, error: cloneError } = await supabase.from("questions").insert({
          topic: "Astronomy", difficulty: "medium", prompt_en: question.prompt_en?.trim() || question.prompt_si, prompt_si: question.prompt_si, explanation_en: "", explanation_si: "",
        }).select("id").single();
        if (cloneError || !clonedQuestion) return { error: cloneError?.message || "Could not copy question." };
        questionId = clonedQuestion.id;
        const { error: relinkError } = await supabase.from("quiz_questions").update({ question_id: questionId, question_position: index + 1 }).eq("id", existingLink.id);
        if (relinkError) return { error: relinkError.message };
      } else {
        const { error: questionError } = await supabase.from("questions").update({ prompt_en: question.prompt_en?.trim() || question.prompt_si, prompt_si: question.prompt_si }).eq("id", questionId);
        if (questionError) return { error: questionError.message };
        const { error: linkError } = await supabase.from("quiz_questions").update({ question_position: index + 1 }).eq("id", existingLink.id);
        if (linkError) return { error: linkError.message };
      }
    }
    await supabase.from("question_options").delete().eq("question_id", questionId);
    const { error: optionsError } = await supabase.from("question_options").insert(question.options.map((option, optionIndex) => ({
      question_id: questionId, label: option.label, text_en: option.text_en?.trim() || option.text_si, text_si: option.text_si, is_correct: option.is_correct, question_position: optionIndex + 1,
    })));
    if (optionsError) return { error: optionsError.message };
  }
  return { error: null };
}

export async function deleteQuiz(id: string): Promise<{ deleted: boolean; archived: boolean; error: string | null }> {
  if (!supabase) return { deleted: false, archived: false, error: "Database not connected" };
  const { count: attemptCount } = await supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("quiz_id", id);
  if ((attemptCount || 0) > 0) {
    const { error } = await supabase.from("quizzes").update({ status: "archived" }).eq("id", id);
    return { deleted: false, archived: !error, error: error?.message || "This quiz was archived because it has student attempts." };
  }
  const { data: links } = await supabase.from("quiz_questions").select("question_id").eq("quiz_id", id);
  const questionIds = [...new Set(((links || []) as any[]).map((link) => link.question_id))];
  const { error: linkError } = await supabase.from("quiz_questions").delete().eq("quiz_id", id);
  if (linkError) return { deleted: false, archived: false, error: linkError.message };
  if (questionIds.length) {
    for (const questionId of questionIds) {
      const { count: remainingLinks } = await supabase.from("quiz_questions").select("id", { count: "exact", head: true }).eq("question_id", questionId);
      if (!remainingLinks) {
        await supabase.from("question_options").delete().eq("question_id", questionId);
        await supabase.from("questions").delete().eq("id", questionId);
      }
    }
  }
  await supabase.from("quiz_sessions").delete().eq("quiz_id", id);
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  return { deleted: !error, archived: false, error: error?.message || null };
}

export const getAvailableQuizzes = getQuizzesWithSessions;
export const getLeaderboardEntries = getLeaderboard;
