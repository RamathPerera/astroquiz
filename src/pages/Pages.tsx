import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Clock3,
  Trophy,
  Target,
  Flame,
  CalendarDays,
  ChevronRight,
  Sparkles,
  CircleCheck,
  LockKeyhole,
  Search,
  Filter,
  BookOpen,
  Telescope,
  Orbit,
  ChartNoAxesCombined,
  Sun,
  Moon,
  Users,
  Lock,
  Atom,
  ShieldCheck,
  History,
  Play,
  Plus,
  AlertCircle,
  Languages,
  Check,
  X,
} from "lucide-react";
import { t, type Language } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  getDashboardStats,
  getAvailableQuizzes,
  getUserAttempts,
  getLeaderboardEntries,
  getAdminProfiles,
  getAdminStats,
  getModeratorQuestions,
  createQuestionWithOptions,
  getModeratorStats,
  getModeratorQuizzes,
  createQuiz,
  createQuizSession,
  updateProfileName,
  getCurrentProfile,
  getUserPreferences,
  saveUserPreferences,
  type Quiz,
  type QuizAttempt,
  type LeaderboardItem,
  type Profile,
  type DashboardStats,
  type AdminStats,
  type ModeratorQuiz,
} from "../lib/api";
import QuizRunner from "../components/QuizRunner";
import AttemptReviewModal from "../components/AttemptReviewModal";
import CreateQuizModal from "../components/CreateQuizModal";
import CreateQuestionModal from "../components/CreateQuestionModal";
import { QuizBuilderModal, EditQuizModal } from "../components/QuizBuilderModal";



export function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
  detail,
  trend,
}: {
  icon: any;
  label: string;
  value: string;
  detail: string;
  trend?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-icon">
          <Icon size={19} />
        </span>
        {trend && <span className="trend">{trend}</span>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}

function sessionIsOpen(session: Quiz["active_session"], now = Date.now()) {
  if (!session) return false;
  return new Date(session.starts_at).getTime() <= now && new Date(session.ends_at).getTime() > now;
}

function sessionCountdown(session: Quiz["active_session"], now = Date.now()) {
  if (!session) return "Not scheduled";
  const seconds = Math.max(0, Math.floor((new Date(session.starts_at).getTime() - now) / 1000));
  if (seconds <= 0) return "Starting now";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${days ? `${days}d ` : ""}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}
export function Dashboard({ lang }: { lang: Language }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [dailyQuiz, setDailyQuiz] = useState<Quiz | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      getDashboardStats(),
      getUserAttempts(),
      getAvailableQuizzes(),
    ]).then(([s, attempts, quizzes]) => {
      if (!alive) return;
      setStats(s);
      setRecentAttempts(attempts.slice(0, 5));
      const daily = quizzes.find((q: Quiz) => q.quiz_type === 'daily' && sessionIsOpen(q.active_session));
      setDailyQuiz(daily || null);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (activeQuiz) {
    return (
      <QuizRunner
        quiz={activeQuiz}
        sessionId={activeQuiz.active_session?.id || null}
        lang={lang}
        onComplete={(att) => {
          setActiveQuiz(null);
          setReviewAttemptId(att.id);
        }}
        onCancel={() => setActiveQuiz(null)}
      />
    );
  }

  const currentDateStr = new Date().toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <PageTitle
        eyebrow="YOUR COSMIC CLASSROOM"
        title={`${t(lang, "welcomeBack")}, Astronomer!`}
        subtitle={t(lang, "welcome")}
        action={
          <span className="date-pill">
            <CalendarDays size={15} /> {currentDateStr}
          </span>
        }
      />
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="hero-kicker">
            <Sparkles size={14} /> YOUR NEXT DISCOVERY AWAITS
          </span>
          <h2>
            Curiosity is your
            <br />
            <em>superpower.</em>
          </h2>
          <p>
            Build your astronomy skills one question at a time. Your next great
            discovery starts here.
          </p>
          <Link className="primary-button" to="/quizzes">
            Explore quizzes <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="planet-scene">
          <div className="planet planet-large" />
          <div className="planet planet-small" />
          <div className="planet-ring" />
          <div className="starfield">
            ✦　·　✧　·　✦
            <br />
            　·Token　·　✧
          </div>
        </div>
        <div className="hero-bottom">
          <span>
            <span className="live-dot" /> {dailyQuiz ? 'DAILY CHALLENGE IS READY' : 'NO DAILY CONTEST TODAY'}
          </span>
          <span>{dailyQuiz ? `${Math.round((dailyQuiz.duration_seconds || 1800) / 60)} minutes timer` : 'Practice sets open 24/7'}</span>
        </div>
      </section>
      <section className="stats-grid">
        <Stat
          icon={Trophy}
          label={t(lang, "points")}
          value={stats ? stats.points.toLocaleString() : '0'}
          detail="Leaderboard points"
          trend={stats && stats.points > 0 ? "Active" : undefined}
        />
        <Stat
          icon={Target}
          label={t(lang, "accuracy")}
          value={stats && stats.attempts_count > 0 ? `${stats.accuracy_percent}%` : '—'}
          detail={stats ? `Across ${stats.attempts_count} completed attempts` : 'No attempts yet'}
        />
        <Stat
          icon={Flame}
          label={t(lang, "active")}
          value={stats ? `${stats.streak_days} days` : '0 days'}
          detail="Keep your learning streak going"
        />
        <Stat
          icon={ChartNoAxesCombined}
          label={t(lang, "rank")}
          value={stats?.rank ? `#${stats.rank}` : '—'}
          detail="Leaderboard ranking"
        />
      </section>
      <div className="content-grid dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">READY WHEN YOU ARE</div>
              <h3>Continue your journey</h3>
            </div>
            <Link to="/quizzes" className="text-link">
              {t(lang, "view")} <ChevronRight size={15} />
            </Link>
          </div>
          <div className="challenge-card daily">
            <div className="challenge-icon">
              <Telescope size={23} />
            </div>
            <div className="challenge-main">
              <div className="challenge-tags">
                <span className="tag tag-blue">DAILY QUIZ</span>
                <span className={`tag ${dailyQuiz ? 'tag-green' : 'tag-muted'}`}>
                  {dailyQuiz ? 'AVAILABLE' : 'OFFLINE'}
                </span>
              </div>
              <h4>{dailyQuiz ? (lang === 'si' && dailyQuiz.title_si ? dailyQuiz.title_si : dailyQuiz.title_en) : t(lang, "daily")}</h4>
              <p>{dailyQuiz?.description_en || 'Explore celestial mechanics, stars, and our place in the Solar System.'}</p>
              <div className="challenge-meta">
                <span>
                  <Clock3 size={14} /> {dailyQuiz ? `${Math.round((dailyQuiz.duration_seconds || 1800) / 60)} min` : '30 min'}
                </span>
                <span>
                  <Trophy size={14} /> Official points
                </span>
              </div>
            </div>
            {dailyQuiz ? (
              <button
                className="round-arrow"
                onClick={() => setActiveQuiz(dailyQuiz)}
                title="Start Daily Quiz"
                style={{ border: 'none', cursor: 'pointer' }}
              >
                <ArrowUpRight size={19} />
              </button>
            ) : (
              <Link className="round-arrow" to="/quizzes">
                <ArrowUpRight size={19} />
              </Link>
            )}
          </div>
          <div className="challenge-card weekend">
            <div className="challenge-icon gold">
              <Trophy size={23} />
            </div>
            <div className="challenge-main">
              <div className="challenge-tags">
                <span className="tag tag-gold">WEEKEND CONTEST</span>
                <span className="tag tag-muted">UPCOMING</span>
              </div>
              <h4>{stats?.weekendQuiz ? (lang === 'si' ? stats.weekendQuiz.title_si : stats.weekendQuiz.title_en) : t(lang, "weekend")}</h4>
              <p>{stats?.weekendQuiz?.description_en || 'No weekend contest is currently open.'}</p>
              <div className="challenge-meta">
                <span>
                  <Clock3 size={14} /> {stats?.weekendQuiz?.duration_seconds ? `${Math.round(stats.weekendQuiz.duration_seconds / 60)} min` : '—'}
                </span>
                <span>
                  <CalendarDays size={14} /> See schedule
                </span>
              </div>
            </div>
            <Link className="round-arrow" to="/quizzes">
              <ArrowUpRight size={19} />
            </Link>
          </div>
        </section>
        <section className="panel progress-panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">SMALL STEPS, BIG DISCOVERIES</div>
              <h3>{t(lang, "progress")}</h3>
            </div>
            <span className="sparkle-badge">
              <Sparkles size={17} />
            </span>
          </div>
          <div className="progress-summary">
            <div className="progress-ring">
              <div>
                <b>{stats && stats.attempts_count > 0 ? `${stats.accuracy_percent}%` : '0%'}</b>
                <small>overall</small>
              </div>
            </div>
            <div>
              <h4>{stats && stats.attempts_count > 0 ? "You're making progress!" : "Start your journey today!"}</h4>
              <p>{stats && stats.attempts_count > 0 ? "Your consistency is building a strong astronomy foundation." : "Complete quizzes to build accuracy and climb the leaderboard."}</p>
              <span className="progress-note">
                <CircleCheck size={14} /> {stats?.attempts_count || 0} attempts completed
              </span>
            </div>
          </div>
          {(stats?.topicProgress || []).map((topic) => (
            <div className="topic-row" key={topic.topic}>
              <span>{topic.topic}</span>
              <div className="progress-track">
                <i style={{ width: `${topic.accuracy}%` }} />
              </div>
              <b>{Math.round(topic.accuracy)}%</b>
            </div>
          ))}
          <Link to="/practice" className="secondary-button full-width">
            Practice a topic <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">YOUR LEARNING TRAIL</div>
            <h3>{t(lang, "recent")}</h3>
          </div>
          <Link to="/attempts" className="text-link">
            View history <ChevronRight size={15} />
          </Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>QUIZ</th>
                <th>TYPE</th>
                <th>DATE</th>
                <th>SCORE</th>
                <th>ACCURACY</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentAttempts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    No attempts recorded yet. Start a quiz above to begin your learning trail!
                  </td>
                </tr>
              ) : (
                recentAttempts.map((a, i) => (
                  <tr key={a.id}>
                    <td>
                      <div className="table-title">
                        <span className="table-icon">
                          {i % 2 === 1 ? (
                            <Orbit size={17} />
                          ) : (
                            <Telescope size={17} />
                          )}
                        </span>
                        <b>{a.quiz?.title_en || 'Quiz Attempt'}</b>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`tag ${a.quiz?.quiz_type === "practice" ? "tag-violet" : "tag-blue"}`}
                      >
                        {a.quiz?.quiz_type?.toUpperCase() || 'QUIZ'}
                      </span>
                    </td>
                    <td>{new Date(a.started_at).toLocaleDateString()}</td>
                    <td>
                      <b>{a.raw_score} / {a.max_score}</b>
                    </td>
                    <td>
                      <span className="accuracy">
                        <span />
                        {a.accuracy_percent.toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      <button
                        className="row-arrow"
                        onClick={() => setReviewAttemptId(a.id)}
                        title="Review answers"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {reviewAttemptId && (
        <AttemptReviewModal
          attemptId={reviewAttemptId}
          lang={lang}
          onClose={() => setReviewAttemptId(null)}
        />
      )}
    </>
  );
}
export function Quizzes({ lang = 'en' }: { lang?: Language }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    getAvailableQuizzes().then((list: Quiz[]) => {
      if (!alive) return;
      setQuizzes(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (activeQuiz) {
    return (
      <QuizRunner
        quiz={activeQuiz}
        sessionId={activeQuiz.active_session?.id || null}
        lang={lang}
        onComplete={(att) => {
          setActiveQuiz(null);
          setReviewAttemptId(att.id);
        }}
        onCancel={() => setActiveQuiz(null)}
      />
    );
  }

  const dailyQuiz = quizzes.find((q) => q.quiz_type === 'daily' && sessionIsOpen(q.active_session, now));
  const weekendQuiz = quizzes.find((q) => q.quiz_type === 'weekend' && q.active_session);
  const weekendOpen = sessionIsOpen(weekendQuiz?.active_session, now);

  return (
    <>
      <PageTitle
        eyebrow="CHOOSE YOUR CHALLENGE"
        title="Quiz Centre"
        subtitle="Test what you know. Discover what you don't. Keep exploring."
      />
      <div className="notice">
        <LockKeyhole size={18} />
        <span>
          <b>Fair play, always.</b> Your timer and score are managed securely by Supabase.
          Only your first eligible daily/weekend submission earns leaderboard points.
        </span>
      </div>
      <div className="quiz-cards">
        <div className="quiz-feature">
          <div className="quiz-art art-blue">
            <div className="art-orbit">✦</div>
            <Telescope size={48} />
            <span>01 / DAILY</span>
          </div>
          <div className="quiz-feature-body">
            <div className="challenge-tags">
              <span className={`tag ${dailyQuiz ? 'tag-green' : 'tag-muted'}`}>
                {dailyQuiz ? 'AVAILABLE' : 'OFFLINE'}
              </span>
              <span className="tag tag-blue">
                {dailyQuiz?.duration_seconds ? `${Math.round(dailyQuiz.duration_seconds / 60)} MIN` : '30 MIN'}
              </span>
            </div>
            <h2>{dailyQuiz ? (lang === 'si' && dailyQuiz.title_si ? dailyQuiz.title_si : dailyQuiz.title_en) : 'Daily Challenge'}</h2>
            <p>
              {dailyQuiz?.description_en || 'A fresh astronomy challenge to keep your knowledge sharp. Start any time while today\'s session is open.'}
            </p>
            <div className="feature-facts">
              <span>
                <BookOpen size={16} /> Official questions
              </span>
              <span>
                <Clock3 size={16} /> {dailyQuiz?.duration_seconds ? `${Math.round(dailyQuiz.duration_seconds / 60)} min timer` : '30 min timer'}
              </span>
            </div>
            {dailyQuiz ? (
              <button
                className="primary-button"
                onClick={() => setActiveQuiz(dailyQuiz)}
              >
                Start daily quiz <ArrowUpRight size={17} />
              </button>
            ) : (
              <button className="primary-button" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                Daily Quiz Not Available
              </button>
            )}
          </div>
        </div>
        <div className="quiz-feature">
          <div className="quiz-art art-gold">
            <div className="art-orbit">✧</div>
            <Trophy size={48} />
            <span>02 / WEEKEND</span>
          </div>
          <div className="quiz-feature-body">
            <div className="challenge-tags">
              <span className={`tag ${weekendQuiz ? 'tag-gold' : 'tag-muted'}`}>
                {weekendOpen ? 'OPEN NOW' : weekendQuiz ? 'UPCOMING' : 'CLOSED'}
              </span>
              <span className="tag tag-violet">
                {weekendQuiz?.duration_seconds ? `${Math.round(weekendQuiz.duration_seconds / 60)} MIN` : '90 MIN'}
              </span>
            </div>
            <h2>{weekendQuiz ? (lang === 'si' && weekendQuiz.title_si ? weekendQuiz.title_si : weekendQuiz.title_en) : 'Weekend Olympiad'}</h2>
            <p>
              {weekendQuiz?.description_en || 'The main event. Compete in a shared scheduled window and earn triple leaderboard weighting.'}
            </p>
            <div className="feature-facts">
              <span>
                <BookOpen size={16} /> Contest set
              </span>
              <span>
                <Clock3 size={16} /> {weekendOpen ? '90 min timer' : `Starts in ${sessionCountdown(weekendQuiz?.active_session, now)}`}
              </span>
            </div>
            {weekendQuiz ? (
              <button
                className="secondary-button"
                disabled={!weekendOpen}
                onClick={() => weekendOpen && setActiveQuiz(weekendQuiz)}
                style={!weekendOpen ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                {weekendOpen ? 'Start Olympiad contest' : `Starts in ${sessionCountdown(weekendQuiz.active_session, now)}`} <ArrowUpRight size={17} />
              </button>
            ) : (
              <button className="secondary-button" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                No active weekend contest
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="panel rules-panel">
        <h3>
          <Sparkles size={18} /> How scoring works
        </h3>
        <div className="rules-grid">
          <div>
            <b>01</b>
            <strong>Every attempt is saved</strong>
            <p>
              Build your progress through all valid attempts, including retries.
            </p>
          </div>
          <div>
            <b>02</b>
            <strong>First eligible attempt counts</strong>
            <p>
              Only the first eligible daily or weekend submission awards points.
            </p>
          </div>
          <div>
            <b>03</b>
            <strong>Practice is for learning</strong>
            <p>
              Practice sets are unlimited and never affect official rankings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
export function Leaderboard() {
  const [timeframe, setTimeframe] = useState<'all' | 'weekly'>('all');
  const [entries, setEntries] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getLeaderboardEntries(timeframe).then((data) => {
      if (alive) {
        setEntries(data);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [timeframe]);

  const currentUserEntry = entries.find((e) => e.is_current_user);
  const myRank = currentUserEntry ? `#${currentUserEntry.rank}` : '-';
  const myPoints = currentUserEntry ? currentUserEntry.points : 0;

  return (
    <>
      <PageTitle
        eyebrow="CELEBRATE YOUR PROGRESS"
        title="Leaderboard"
        subtitle="Friendly competition. Brilliant discoveries. One shared universe."
      />
      <div className="leaderboard-banner">
        <div>
          <Trophy size={29} />
          <div>
            <span>{timeframe === 'all' ? 'ALL-TIME RANKING' : 'WEEKLY RANKING'}</span>
            <h2>Every point tells a story.</h2>
            <p>Daily points + weekend points (3× weighted)</p>
          </div>
        </div>
        <div className="my-rank">
          <small>YOUR RANK</small>
          <strong>{myRank}</strong>
          <span>{myPoints} points</span>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">ASTROQUIZ COMMUNITY</div>
            <h3>Top astronomers</h3>
          </div>
          <div className="filter-tabs">
            <button
              className={timeframe === 'all' ? 'selected' : ''}
              onClick={() => setTimeframe('all')}
            >
              All time
            </button>
            <button
              className={timeframe === 'weekly' ? 'selected' : ''}
              onClick={() => setTimeframe('weekly')}
            >
              This week
            </button>
          </div>
        </div>
        <div className="table-scroll">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading leaderboard…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>STUDENT</th>
                  <th>POINTS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                      No leaderboard entries yet. Complete a scored quiz to appear here!
                    </td>
                  </tr>
                ) : (
                  entries.map((u) => {
                    const initials = u.name
                      .split(' ')
                      .map((x) => x[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();
                    return (
                      <tr
                        key={u.user_id}
                        className={u.is_current_user ? 'highlight-row' : ''}
                      >
                        <td>
                          <span className={`rank-number rank-${u.rank}`}>
                            {u.rank < 4 ? '♛' : u.rank}
                          </span>
                        </td>
                        <td>
                          <div className="table-title">
                            <span className="table-icon">{initials}</span>
                            <b>{u.name}</b>
                            {u.is_current_user && (
                              <span className="tag tag-blue">YOU</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <b>{u.points.toLocaleString()}</b>{' '}
                          <span className="muted">pts</span>
                        </td>
                        <td>
                          <span className="status-dot">
                            <i /> Active
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
        <p className="privacy-note">
          <LockKeyhole size={14} /> Public rankings show display names only.
          Private account details are never shown.
        </p>
      </div>
    </>
  );
}
export function Attempts() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getUserAttempts().then((list) => {
      if (alive) {
        setAttempts(list);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="loading-atom">✦</span>
        <span>Loading attempt history…</span>
      </div>
    );
  }

  return (
    <>
      <PageTitle
        eyebrow="LEARN FROM EVERY ANSWER"
        title="Attempt History"
        subtitle="Review your past quiz submissions, check correct answers, and understand explanations."
      />
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">SUBMISSION RECORDS</div>
            <h3>All your quiz attempts</h3>
          </div>
          <span className="tag tag-blue">{attempts.length} attempts recorded</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>QUIZ TITLE</th>
                <th>TYPE</th>
                <th>DATE</th>
                <th>SCORE</th>
                <th>ACCURACY</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    No attempts found. Head over to the Quiz Centre and start a challenge!
                  </td>
                </tr>
              ) : (
                attempts.map((a) => {
                  const title = a.quiz
                    ? a.quiz.title_en
                    : 'Quiz Attempt';
                  const dateStr = new Date(a.started_at).toLocaleString();
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="table-title">
                          <span className="table-icon">
                            <History size={17} />
                          </span>
                          <b>{title}</b>
                        </div>
                      </td>
                      <td>
                        <span className={`tag tag-${a.quiz?.quiz_type === 'daily' ? 'blue' : a.quiz?.quiz_type === 'weekend' ? 'gold' : 'green'}`}>
                          {a.quiz?.quiz_type?.toUpperCase() || 'PRACTICE'}
                        </span>
                      </td>
                      <td>{dateStr}</td>
                      <td>
                        <b>{a.raw_score}</b> / {a.max_score}
                      </td>
                      <td>
                        <span className={`badge-pill ${a.accuracy_percent >= 75 ? 'success' : ''}`}>
                          {a.accuracy_percent.toFixed(0)}%
                        </span>
                      </td>
                      <td>
                        <span className={`tag tag-${a.status === 'submitted' ? 'green' : 'muted'}`}>
                          {a.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button
                          className="secondary-button"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                          onClick={() => setReviewAttemptId(a.id)}
                        >
                          Review Answers
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reviewAttemptId && (
        <AttemptReviewModal
          attemptId={reviewAttemptId}
          lang="en"
          onClose={() => setReviewAttemptId(null)}
        />
      )}
    </>
  );
}
export function Practice() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    let alive = true;
    getAvailableQuizzes().then((list) => {
      if (alive) {
        setQuizzes(list.filter((q) => q.quiz_type === 'practice'));
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="loading-atom">✦</span>
        <span>Loading practice sets…</span>
      </div>
    );
  }

  if (activeQuiz) {
    return (
      <QuizRunner
        quiz={activeQuiz}
        sessionId={null}
        lang="en"
        onComplete={() => setActiveQuiz(null)}
        onCancel={() => setActiveQuiz(null)}
      />
    );
  }

  return (
    <>
      <PageTitle
        eyebrow="SELF-PACED MASTERY"
        title="Practice Sets"
        subtitle="Explore specific astronomy topics without time limits or rank pressure."
      />
      <div className="practice-grid">
        {quizzes.length === 0 ? (
          <div className="notice" style={{ gridColumn: 'span 2' }}>
            <AlertCircle size={18} />
            <span>No practice sets published yet. Ask a moderator to add practice quizzes in Supabase.</span>
          </div>
        ) : (
          quizzes.map((pq) => (
            <div className="practice-card" key={pq.id}>
              <div className="practice-icon green">
                <BookOpen size={23} />
              </div>
              <span className="tag tag-green">PRACTICE SET</span>
              <h3>{pq.title_en}</h3>
              <p>{pq.description_en || 'Sharpen your skills at your own pace.'}</p>
              <div className="practice-bottom">
                <span>
                  <BookOpen size={15} /> Unlimited
                </span>
                <button
                  className="round-arrow"
                   onClick={() => setActiveQuiz(pq)}
                  title="Start Practice"
                >
                  <Play size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="notice" style={{ marginTop: '2rem' }}>
        <Sparkles size={18} />
        <span>
          <b>Practice without pressure.</b> Practice attempts are unlimited,
          saved in your history, and never affect official leaderboard points.
        </span>
      </div>
    </>
  );
}
export function SettingsPage({
  lang,
  setLang,
  theme,
  setTheme,
}: {
  lang: Language;
  setLang: (v: Language) => void;
  theme: string;
  setTheme: (v: string) => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    Promise.all([getCurrentProfile(), getUserPreferences()]).then(([currentProfile, preferences]) => {
      setProfile(currentProfile);
      if (preferences?.language && preferences.language !== lang) setLang(preferences.language);
      if (preferences?.theme && preferences.theme !== theme) setTheme(preferences.theme);
    });
  }, []);

  const chooseLanguage = (value: Language) => {
    setLang(value);
    void saveUserPreferences({ language: value });
  };

  const chooseTheme = (value: string) => {
    setTheme(value);
    if (value === 'light' || value === 'dark' || value === 'system') {
      void saveUserPreferences({ theme: value });
    }
  };

  return (
    <>
      <PageTitle
        eyebrow="MAKE IT YOURS"
        title="Settings"
        subtitle="Choose how AstroQuiz feels and works for you."
      />
      <div className="settings-layout">
        <section className="panel settings-panel">
          <div className="settings-heading">
            <div className="settings-icon">
              <Languages />
            </div>
            <div>
              <h3>Language</h3>
              <p>Choose your preferred display language.</p>
            </div>
          </div>
          <div className="option-row">
            <div>
              <b>English</b>
              <small>English interface and content where available</small>
            </div>
            <button
              className={`choice-button ${lang === "en" ? "chosen" : ""}`}
               onClick={() => chooseLanguage("en")}
            >
              {lang === "en" ? "Selected" : "Choose"}
            </button>
          </div>
          <div className="option-row">
            <div>
              <b>සිංහල (Sinhala)</b>
              <small>සිංහල අතුරු මුහුණත</small>
            </div>
            <button
              className={`choice-button ${lang === "si" ? "chosen" : ""}`}
               onClick={() => chooseLanguage("si")}
            >
              {lang === "si" ? "Selected" : "තෝරන්න"}
            </button>
          </div>
          <div className="settings-heading separated">
            <div className="settings-icon">
              <Sun />
            </div>
            <div>
              <h3>Appearance</h3>
              <p>Make your learning space comfortable.</p>
            </div>
          </div>
          <div className="theme-options">
            <button
              className={`theme-option ${theme === "light" ? "chosen" : ""}`}
               onClick={() => chooseTheme("light")}
            >
              <Sun />
              <b>Light</b>
              <small>Clear and bright</small>
            </button>
            <button
              className={`theme-option ${theme === "dark" ? "chosen" : ""}`}
               onClick={() => chooseTheme("dark")}
            >
              <Moon />
              <b>Dark</b>
              <small>Easy on the eyes</small>
            </button>
          </div>
          <p className="settings-footnote">
             Your display preferences are saved to your Supabase profile.
          </p>
        </section>
        <section className="panel account-panel">
          <div className="settings-heading">
            <div className="settings-icon">
              <LockKeyhole />
            </div>
            <div>
              <h3>Account & privacy</h3>
              <p>Your information stays protected.</p>
            </div>
          </div>
          <div className="account-profile">
            <div className="avatar large-avatar">{(profile?.display_name || 'AS').slice(0, 2).toUpperCase()}</div>
            <div>
              <b>{profile?.display_name || 'Profile unavailable'}</b>
              <small>{profile?.role || 'student'} role</small>
              <span className={`tag ${profile?.is_active ? 'tag-green' : 'tag-muted'}`}>{profile?.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
          </div>
          <div className="privacy-item">
            <CircleCheck />
            <span>
              <b>Role-based access</b>
              <small>
                Private attempt details are restricted to your account.
              </small>
            </span>
          </div>
          <div className="privacy-item">
            <CircleCheck />
            <span>
              <b>Protected answer keys</b>
              <small>
                Correct answers should only be revealed after submission.
              </small>
            </span>
          </div>
          <div className="privacy-item">
            <CircleCheck />
            <span>
              <b>Minimal public profile</b>
              <small>
                Leaderboards use display names, not email addresses.
              </small>
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
export function Moderator() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<ModeratorQuiz | null>(null);
  const [moderatorStats, setModeratorStats] = useState({
    questionsCount: 0,
    sessionsCount: 0,
    publishedQuizzesCount: 0,
    studentsCount: 0,
  });
  const [moderatorQuizzes, setModeratorQuizzes] = useState<ModeratorQuiz[]>([]);

  useEffect(() => {
    Promise.all([getModeratorStats(), getModeratorQuizzes()]).then(([stats, quizzes]) => {
      setModeratorStats(stats);
      setModeratorQuizzes(quizzes);
    });
  }, []);

  const reloadQuizzes = () => {
    setShowBuilder(false);
    setEditingQuiz(null);
    Promise.all([getModeratorStats(), getModeratorQuizzes()]).then(([stats, quizzes]) => {
      setModeratorStats(stats);
      setModeratorQuizzes(quizzes);
    });
  };

  return (
    <>
      <PageTitle
        eyebrow="CONTENT MANAGEMENT"
        title="Moderator workspace"
        subtitle="Create, schedule, and manage every quiz from one simple workspace."
      />
      <div className="notice">
        <LockKeyhole size={18} />
        <span>
          <b>One simple workflow.</b> Create the quiz, add questions, and choose its schedule in one place.
        </span>
      </div>
      <div className="stats-grid">
        <Stat
          icon={BookOpen}
          label="Question bank"
          value={String(moderatorStats.questionsCount)}
          detail="Add bilingual questions"
        />
        <Stat
          icon={CalendarDays}
          label="Upcoming sessions"
          value={String(moderatorStats.sessionsCount)}
          detail="Daily and weekend windows"
        />
        <Stat
          icon={Trophy}
          label="Published quizzes"
          value={String(moderatorStats.publishedQuizzesCount)}
          detail="Daily and weekend"
        />
        <Stat
          icon={Users}
          label="Students"
          value={String(moderatorStats.studentsCount)}
          detail="Private statistics"
        />
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">MODERATION TOOLS</div>
            <h3>Your quizzes</h3>
          </div>
          <button className="primary-button" onClick={() => setShowBuilder(true)}><Plus size={16} /> Create quiz</button>
        </div>
        <div className="managed-quiz-list">
          {moderatorQuizzes.length === 0 ? <div className="empty-state"><div className="empty-icon"><BookOpen size={24} /></div><h3>No quizzes yet</h3><p>Create your first quiz and add questions in the guided form.</p><button className="primary-button" onClick={() => setShowBuilder(true)}><Plus size={16} /> Create quiz</button></div> : moderatorQuizzes.map((quiz) => <div className="managed-quiz-row" key={quiz.id}><div className="managed-quiz-icon"><BookOpen size={18} /></div><div className="managed-quiz-main"><div className="challenge-tags"><span className={`tag tag-${quiz.quiz_type === 'daily' ? 'blue' : quiz.quiz_type === 'weekend' ? 'gold' : 'green'}`}>{quiz.quiz_type}</span><span className={`tag ${quiz.status === 'published' ? 'tag-green' : 'tag-muted'}`}>{quiz.status}</span></div><b>{quiz.title_si}</b><small>{quiz.question_count} questions {quiz.session ? `· ${new Date(quiz.session.starts_at).toLocaleString()}` : '· No schedule'}</small></div><button className="secondary-button small-button" onClick={() => setEditingQuiz(quiz)}>Edit</button></div>)}
        </div>
      </div>

      {showBuilder && <QuizBuilderModal onClose={() => setShowBuilder(false)} onSuccess={reloadQuizzes} />}
      {editingQuiz && <EditQuizModal quiz={editingQuiz} onClose={() => setEditingQuiz(null)} onSuccess={reloadQuizzes} />}
    </>
  );
}
export function Admin() {
  const [adminStats, setAdminStats] = useState<AdminStats>({
    usersCount: 0,
    moderatorsCount: 0,
    activeSessionsCount: 0,
    auditEventsCount: 0,
  });
  const [adminProfiles, setAdminProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([getAdminStats(), getAdminProfiles()])
      .then(([stats, profiles]) => {
        if (!alive) return;
        setAdminStats(stats);
        setAdminProfiles(profiles);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <PageTitle
        eyebrow="PLATFORM CONTROL"
        title="Administration"
        subtitle="Manage access carefully and keep the learning environment safe."
      />
      <div className="notice warning">
        <LockKeyhole size={18} />
        <span>
          <b>Admin-only operations.</b> User creation and role changes must be
          performed by a trusted server-side function. Never expose the Supabase
          service-role key in the frontend.
        </span>
      </div>
      <div className="stats-grid">
        <Stat
          icon={Users}
          label="Registered accounts"
          value={loading ? "…" : String(adminStats.usersCount)}
          detail="Connect Supabase to view users"
        />
        <Stat
          icon={ShieldCheck}
          label="Moderators"
          value={loading ? "…" : String(adminStats.moderatorsCount)}
          detail="Role-protected access"
        />
        <Stat
          icon={Trophy}
          label="Active sessions"
          value={loading ? "…" : String(adminStats.activeSessionsCount)}
          detail="Scheduled quiz windows"
        />
        <Stat
          icon={History}
          label="Audit events"
          value={loading ? "…" : String(adminStats.auditEventsCount)}
          detail="Sensitive actions only"
        />
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">ACCOUNT SAFETY</div>
            <h3>User administration</h3>
          </div>
        </div>
        <div className="user-table">
          <div className="table-header">
            <span>Username</span>
            <span>Display Name</span>
            <span>Role</span>
            <span>Status</span>
          </div>
          {adminProfiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Users size={24} />
              </div>
              <p>No users found. The database is empty.</p>
            </div>
          ) : (
            adminProfiles.map((user) => (
              <div key={user.id} className="table-row">
                <span>{user.username || '—'}</span>
                <span>{user.display_name || '—'}</span>
                <span>
                  <span className={`status-pill ${user.role === 'admin' ? 'positive' : user.role === 'moderator' ? 'warning' : 'muted'}`}>
                    {user.role || 'student'}
                  </span>
                </span>
                <span>
                  <span className={user.is_active ? "status-pill positive" : "status-pill warning"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
export function Login() {
  return (
    <div className="login-page">
      <div className="login-art">
        <div className="login-stars">
          ✦　　 ·　　 ✧<br />
          　　✧　　·　　✦
        </div>
        <div className="login-planet" />
        <div className="login-brand">
          <div className="brand-icon">
            <Telescope size={29} />
          </div>
          <div>
            <strong>
              AstroQuiz <span>Sri Lanka</span>
            </strong>
            <small>Astronomy Olympiad Platform</small>
          </div>
        </div>
        <div className="login-message">
          <div className="eyebrow">A UNIVERSE OF KNOWLEDGE</div>
          <h1>
            Big questions.
            <br />
            <em>Bright futures.</em>
          </h1>
          <p>
            Explore the cosmos, challenge your curiosity, and discover what
            you're capable of.
          </p>
          <div className="login-points">
            <span>
              <CircleCheck /> Daily astronomy challenges
            </span>
            <span>
              <CircleCheck /> Friendly student leaderboard
            </span>
            <span>
              <CircleCheck /> Learn at your own pace
            </span>
          </div>
        </div>
        <div className="login-copyright">
          ✦ Built for Sri Lankan Astronomy Olympiad students
        </div>
      </div>
      <div className="login-form-side">
        <form
          className="login-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            if (!isSupabaseConfigured) {
              alert(
                "Demo preview only. Add Supabase URL and anon key to .env.local to enable sign-in.",
              );
              return;
            }
            const { supabase } = await import("../lib/supabase");
            const { error } = await supabase!.auth.signInWithPassword({
              email: String(f.get("email")),
              password: String(f.get("password")),
            });
            if (error) alert(error.message);
            else window.location.href = "/dashboard";
          }}
        >
          <div className="form-symbol">
            <Atom size={26} />
          </div>
          <div className="eyebrow">WELCOME BACK, ASTRONOMER</div>
          <h2>Sign in to AstroQuiz</h2>
          <p>Use the account provided by your administrator.</p>
          <label>
            Email address
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="primary-button submit-button" type="submit">
            Sign in <ArrowUpRight size={17} />
          </button>
          <div className="login-security">
            <LockKeyhole size={15} /> Secure sign-in · No public registration
          </div>
          {!isSupabaseConfigured && (
            <div className="demo-notice">
              Preview mode: configure Supabase to enable real authentication.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
