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
import { t, ui, type Language } from "../lib/i18n";
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
import BilingualText from "../components/BilingualText";



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
        eyebrow={ui(lang, 'YOUR COSMIC CLASSROOM', 'ඔබේ විශ්වීය පන්ති කාමරය')}
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
            <Sparkles size={14} /> {ui(lang, 'YOUR NEXT DISCOVERY AWAITS', 'ඔබේ ඊළඟ සොයාගැනීම බලා සිටී')}
          </span>
          <h2>
            {ui(lang, 'Curiosity is your', 'කුතුහලය ඔබේ')}
            <br />
            <em>{ui(lang, 'superpower.', 'බලවත් හැකියාවයි.')}</em>
          </h2>
          <p>
            {ui(lang, 'Build your astronomy skills one question at a time. Your next great discovery starts here.', 'එක් ප්‍රශ්නයක් බැගින් ඔබේ තාරකා විද්‍යා කුසලතා වර්ධනය කරන්න. ඔබේ ඊළඟ සොයාගැනීම මෙතැනින් ආරම්භ වේ.')}
          </p>
          <Link className="primary-button" to="/quizzes">
            {ui(lang, 'Explore quizzes', 'ප්‍රශ්නාවලි ගවේෂණය කරන්න')} <ArrowUpRight size={17} />
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
            <span className="live-dot" /> {dailyQuiz ? ui(lang, 'DAILY CHALLENGE IS READY', 'දෛනික අභියෝගය සූදානම්') : ui(lang, 'NO DAILY CONTEST TODAY', 'අද දෛනික තරගයක් නැත')}
          </span>
          <span>{dailyQuiz ? `${Math.round((dailyQuiz.duration_seconds || 1800) / 60)} ${ui(lang, 'minutes timer', 'මිනිත්තු කාල ගණකය')}` : ui(lang, 'Practice sets open 24/7', 'පුහුණු කට්ටල 24/7 විවෘතයි')}</span>
        </div>
      </section>
      <section className="stats-grid">
        <Stat
          icon={Trophy}
          label={t(lang, "points")}
          value={stats ? stats.points.toLocaleString() : '0'}
          detail={ui(lang, 'Leaderboard points', 'ලකුණු පුවරු ලකුණු')}
          trend={stats && stats.points > 0 ? ui(lang, 'Active', 'සක්‍රිය') : undefined}
        />
        <Stat
          icon={Target}
          label={t(lang, "accuracy")}
          value={stats && stats.attempts_count > 0 ? `${stats.accuracy_percent}%` : '—'}
          detail={stats ? ui(lang, `Across ${stats.attempts_count} completed attempts`, `සම්පූර්ණ කළ උත්සාහ ${stats.attempts_count}ක්`) : ui(lang, 'No attempts yet', 'තවම උත්සාහ නැත')}
        />
        <Stat
          icon={Flame}
          label={t(lang, "active")}
          value={stats ? `${stats.streak_days} ${ui(lang, 'days', 'දින')}` : `0 ${ui(lang, 'days', 'දින')}`}
          detail={ui(lang, 'Keep your learning streak going', 'ඔබේ අධ්‍යයන අඛණ්ඩතාව පවත්වා ගන්න')}
        />
        <Stat
          icon={ChartNoAxesCombined}
          label={t(lang, "rank")}
          value={stats?.rank ? `#${stats.rank}` : '—'}
          detail={ui(lang, 'Leaderboard ranking', 'ලකුණු පුවරු ශ්‍රේණිය')}
        />
      </section>
      <div className="content-grid dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">{ui(lang, 'READY WHEN YOU ARE', 'ඔබ සූදානම් වූ විට')}</div>
              <h3>{ui(lang, 'Continue your journey', 'ඔබේ ගමන දිගටම කරගෙන යන්න')}</h3>
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
                  {dailyQuiz ? t(lang, 'available') : t(lang, 'offline')}
                </span>
              </div>
              <h4>{dailyQuiz ? <BilingualText en={dailyQuiz.title_en} si={dailyQuiz.title_si} /> : t(lang, "daily")}</h4>
              <p>{dailyQuiz ? <BilingualText en={dailyQuiz.description_en} si={dailyQuiz.description_si} /> : ui(lang, 'Explore celestial mechanics, stars, and our place in the Solar System.', 'ආකාශ යාන්ත්‍රණය, තරු සහ සූර්ය මණ්ඩලයේ අපගේ ස්ථානය ගවේෂණය කරන්න.')}</p>
              <div className="challenge-meta">
                <span>
                  <Clock3 size={14} /> {dailyQuiz ? `${Math.round((dailyQuiz.duration_seconds || 1800) / 60)} min` : '30 min'}
                </span>
                <span>
                  <Trophy size={14} /> {ui(lang, 'Official points', 'නිල ලකුණු')}
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
                <span className="tag tag-gold">{ui(lang, 'WEEKEND CONTEST', 'සති අන්ත තරගය')}</span>
              <span className="tag tag-muted">{t(lang, 'upcoming')}</span>
              </div>
              <h4>{stats?.weekendQuiz ? <BilingualText en={stats.weekendQuiz.title_en} si={stats.weekendQuiz.title_si} /> : t(lang, "weekend")}</h4>
              <p>{stats?.weekendQuiz ? <BilingualText en={stats.weekendQuiz.description_en} si={stats.weekendQuiz.description_si} /> : ui(lang, 'No weekend contest is currently open.', 'දැනට විවෘත සති අන්ත තරගයක් නැත.')}</p>
              <div className="challenge-meta">
                <span>
                  <Clock3 size={14} /> {stats?.weekendQuiz?.duration_seconds ? `${Math.round(stats.weekendQuiz.duration_seconds / 60)} min` : '—'}
                </span>
                <span>
                  <CalendarDays size={14} /> {ui(lang, 'See schedule', 'කාලසටහන බලන්න')}
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
              <div className="eyebrow">{ui(lang, 'SMALL STEPS, BIG DISCOVERIES', 'කුඩා පියවර, විශාල සොයාගැනීම්')}</div>
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
                <small>{ui(lang, 'overall', 'සමස්ත')}</small>
              </div>
            </div>
            <div>
                <h4>{stats && stats.attempts_count > 0 ? ui(lang, "You're making progress!", 'ඔබ ප්‍රගතියක් ලබමින් සිටී!') : ui(lang, 'Start your journey today!', 'අද ඔබේ ගමන ආරම්භ කරන්න!')}</h4>
              <p>{stats && stats.attempts_count > 0 ? ui(lang, 'Your consistency is building a strong astronomy foundation.', 'ඔබේ අඛණ්ඩතාව ශක්තිමත් තාරකා විද්‍යා පදනමක් ගොඩනඟයි.') : ui(lang, 'Complete quizzes to build accuracy and climb the leaderboard.', 'නිවැරදිභාවය වර්ධනය කර ලකුණු පුවරුවේ ඉහළ යාමට ප්‍රශ්නාවලි සම්පූර්ණ කරන්න.')}</p>
              <span className="progress-note">
                <CircleCheck size={14} /> {stats?.attempts_count || 0} {ui(lang, 'attempts completed', 'උත්සාහ සම්පූර්ණ කර ඇත')}
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
            {ui(lang, 'Practice a topic', 'මාතෘකාවක් පුහුණු වන්න')} <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{ui(lang, 'YOUR LEARNING TRAIL', 'ඔබේ ඉගෙනුම් මාවත')}</div>
            <h3>{t(lang, "recent")}</h3>
          </div>
          <Link to="/attempts" className="text-link">
            {ui(lang, 'View history', 'ඉතිහාසය බලන්න')} <ChevronRight size={15} />
          </Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t(lang, 'quiz')}</th><th>{t(lang, 'type')}</th><th>{t(lang, 'date')}</th><th>{t(lang, 'score')}</th><th>{t(lang, 'accuracy')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentAttempts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    {ui(lang, 'No attempts recorded yet. Start a quiz above to begin your learning trail!', 'තවමත් උත්සාහ සටහන් වී නැත. ඔබේ ඉගෙනුම් මාවත ආරම්භ කිරීමට ඉහත ප්‍රශ්නාවලියක් ආරම්භ කරන්න!')}
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
                        <b>{a.quiz ? <BilingualText en={a.quiz.title_en} si={a.quiz.title_si} /> : t(lang, 'quiz')}</b>
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
                        title={t(lang, 'reviewAnswers')}
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
        eyebrow={t(lang, 'chooseChallenge')}
        title={t(lang, 'quizzes')}
        subtitle={t(lang, 'quizCentreSubtitle')}
      />
      <div className="notice">
        <LockKeyhole size={18} />
        <span>
          <b>{t(lang, 'fairPlay')}</b> {t(lang, 'secureQuiz')}
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
                {dailyQuiz ? t(lang, 'available') : t(lang, 'offline')}
              </span>
              <span className="tag tag-blue">
                {dailyQuiz?.duration_seconds ? `${Math.round(dailyQuiz.duration_seconds / 60)} MIN` : '30 MIN'}
              </span>
            </div>
            <h2>{dailyQuiz ? <BilingualText en={dailyQuiz.title_en} si={dailyQuiz.title_si} /> : t(lang, 'daily')}</h2>
            <p>
              {dailyQuiz ? <BilingualText en={dailyQuiz.description_en} si={dailyQuiz.description_si} /> : ui(lang, 'A fresh astronomy challenge to keep your knowledge sharp. Start any time while today\'s session is open.', 'ඔබේ දැනුම තියුණු කර ගැනීමට නව තාරකා විද්‍යා අභියෝගයකි. අද සැසිය විවෘතව ඇති විට ආරම්භ කරන්න.')}
            </p>
            <div className="feature-facts">
              <span>
                <BookOpen size={16} /> {t(lang, 'officialQuestions')}
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
                {t(lang, 'startDaily')} <ArrowUpRight size={17} />
              </button>
            ) : (
              <button className="primary-button" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                {t(lang, 'dailyNotAvailable')}
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
                {weekendOpen ? t(lang, 'openNow') : weekendQuiz ? t(lang, 'upcoming') : t(lang, 'closed')}
              </span>
              <span className="tag tag-violet">
                {weekendQuiz?.duration_seconds ? `${Math.round(weekendQuiz.duration_seconds / 60)} MIN` : '90 MIN'}
              </span>
            </div>
            <h2>{weekendQuiz ? <BilingualText en={weekendQuiz.title_en} si={weekendQuiz.title_si} /> : t(lang, 'weekend')}</h2>
            <p>
              {weekendQuiz ? <BilingualText en={weekendQuiz.description_en} si={weekendQuiz.description_si} /> : ui(lang, 'The main event. Compete in a shared scheduled window and earn triple leaderboard weighting.', 'ප්‍රධාන තරගයයි. නියමිත සැසිය තුළ තරග කර තුන් ගුණයක ලකුණු ලබා ගන්න.')}
            </p>
            <div className="feature-facts">
              <span>
                <BookOpen size={16} /> {t(lang, 'contestSet')}
              </span>
              <span>
                <Clock3 size={16} /> {weekendOpen ? `90 min ${t(lang, 'timer')}` : `${t(lang, 'startsIn')} ${sessionCountdown(weekendQuiz?.active_session, now)}`}
              </span>
            </div>
            {weekendQuiz ? (
              <button
                className="secondary-button"
                disabled={!weekendOpen}
                onClick={() => weekendOpen && setActiveQuiz(weekendQuiz)}
                style={!weekendOpen ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                {weekendOpen ? t(lang, 'startOlympiad') : `${t(lang, 'startsIn')} ${sessionCountdown(weekendQuiz.active_session, now)}`} <ArrowUpRight size={17} />
              </button>
            ) : (
              <button className="secondary-button" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                {t(lang, 'noWeekend')}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="panel rules-panel">
        <h3>
          <Sparkles size={18} /> {t(lang, 'howScoring')}
        </h3>
        <div className="rules-grid">
          <div>
            <b>01</b>
            <strong>{t(lang, 'everyAttemptSaved')}</strong>
            <p>
              Build your progress through all valid attempts, including retries.
            </p>
          </div>
          <div>
            <b>02</b>
            <strong>{t(lang, 'firstAttemptCounts')}</strong>
            <p>
              Only the first eligible daily or weekend submission awards points.
            </p>
          </div>
          <div>
            <b>03</b>
            <strong>{t(lang, 'practiceLearning')}</strong>
            <p>
              {ui(lang, 'Practice sets are unlimited and never affect official rankings.', 'පුහුණු කට්ටල සීමා රහිත අතර නිල ශ්‍රේණිගත කිරීම්වලට බලපාන්නේ නැත.')}
            </p>
          </div>
        </div>
      </div>
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
export function Leaderboard({ lang = 'en' }: { lang?: Language }) {
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
        eyebrow={ui(lang, 'CELEBRATE YOUR PROGRESS', 'ඔබේ ප්‍රගතිය සමරන්න')}
        title={t(lang, 'leaderboard')}
        subtitle={ui(lang, 'Friendly competition. Brilliant discoveries. One shared universe.', 'හිතවත් තරගයක්. විශිෂ්ට සොයාගැනීම්. එකම විශ්වයක්.')}
      />
      <div className="leaderboard-banner">
        <div>
          <Trophy size={29} />
          <div>
            <span>{timeframe === 'all' ? 'ALL-TIME RANKING' : 'WEEKLY RANKING'}</span>
            <h2>{ui(lang, 'Every point tells a story.', 'සෑම ලකුණකටම කතාවක් ඇත.')}</h2>
            <p>{ui(lang, 'Daily points + weekend points (3× weighted)', 'දෛනික ලකුණු + සති අන්ත ලකුණු (3× බරිත)')}</p>
          </div>
        </div>
        <div className="my-rank">
          <small>{ui(lang, 'YOUR RANK', 'ඔබේ ශ්‍රේණිය')}</small>
          <strong>{myRank}</strong>
          <span>{myPoints} {t(lang, 'points')}</span>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">ASTROQUIZ COMMUNITY</div>
            <h3>{ui(lang, 'Top astronomers', 'ප්‍රමුඛ තාරකා විද්‍යාඥයින්')}</h3>
          </div>
          <div className="filter-tabs">
            <button
              className={timeframe === 'all' ? 'selected' : ''}
              onClick={() => setTimeframe('all')}
            >
              {ui(lang, 'All time', 'සියලු කාලය')}
            </button>
            <button
              className={timeframe === 'weekly' ? 'selected' : ''}
              onClick={() => setTimeframe('weekly')}
            >
              {ui(lang, 'This week', 'මෙම සතිය')}
            </button>
          </div>
        </div>
        <div className="table-scroll">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>{ui(lang, 'Loading leaderboard…', 'ලකුණු පුවරුව පූරණය වෙමින්…')}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{ui(lang, 'RANK', 'ශ්‍රේණිය')}</th>
                  <th>{ui(lang, 'STUDENT', 'ශිෂ්‍යයා')}</th>
                  <th>{t(lang, 'pointsLabel')}</th>
                  <th>{t(lang, 'status')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                      {ui(lang, 'No leaderboard entries yet. Complete a scored quiz to appear here!', 'තවමත් ලකුණු පුවරු ඇතුළත් කිරීම් නැත. ලකුණු සහිත ප්‍රශ්නාවලියක් සම්පූර්ණ කරන්න.')}
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
                              <span className="tag tag-blue">{ui(lang, 'YOU', 'ඔබ')}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <b>{u.points.toLocaleString()}</b>{' '}
                          <span className="muted">pts</span>
                        </td>
                        <td>
                          <span className="status-dot">
                            <i /> {t(lang, 'activeStatus')}
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
          <LockKeyhole size={14} /> {ui(lang, 'Public rankings show display names only. Private account details are never shown.', 'පොදු ශ්‍රේණිගත කිරීම්වල පෙන්වන්නේ ප්‍රදර්ශන නාම පමණි. පෞද්ගලික ගිණුම් තොරතුරු නොපෙන්වයි.')}
        </p>
      </div>
    </>
  );
}
export function Attempts({ lang = 'en' }: { lang?: Language }) {
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
        <span>{ui(lang, 'Loading attempt history…', 'උත්සාහ ඉතිහාසය පූරණය වෙමින්…')}</span>
      </div>
    );
  }

  return (
    <>
      <PageTitle
        eyebrow={ui(lang, 'LEARN FROM EVERY ANSWER', 'සෑම පිළිතුරකින්ම ඉගෙන ගන්න')}
        title={t(lang, 'attempts')}
        subtitle={ui(lang, 'Review your past quiz submissions, check correct answers, and understand explanations.', 'ඔබේ පෙර ප්‍රශ්නාවලි යොමු කිරීම් සමාලෝචනය කර නිවැරදි පිළිතුරු සහ පැහැදිලි කිරීම් බලන්න.')}
      />
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{ui(lang, 'SUBMISSION RECORDS', 'යොමු කිරීමේ වාර්තා')}</div>
            <h3>{ui(lang, 'All your quiz attempts', 'ඔබේ සියලු ප්‍රශ්නාවලි උත්සාහ')}</h3>
          </div>
          <span className="tag tag-blue">{attempts.length} {ui(lang, 'attempts recorded', 'උත්සාහ සටහන් කර ඇත')}</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                  <th>{ui(lang, 'QUIZ TITLE', 'ප්‍රශ්නාවලි නාමය')}</th>
                  <th>{t(lang, 'type')}</th><th>{t(lang, 'date')}</th><th>{t(lang, 'score')}</th><th>{t(lang, 'accuracy')}</th><th>{t(lang, 'status')}</th><th>{ui(lang, 'ACTION', 'ක්‍රියාව')}</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    {t(lang, 'noAttempts')} {t(lang, 'startChallenge')}
                  </td>
                </tr>
              ) : (
                attempts.map((a) => {
                  const title = a.quiz
                    ? a.quiz.title_en
                    : t(lang, 'quiz');
                  const dateStr = new Date(a.started_at).toLocaleString();
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="table-title">
                          <span className="table-icon">
                            <History size={17} />
                          </span>
                          <b>{a.quiz ? <BilingualText en={a.quiz.title_en} si={a.quiz.title_si} /> : title}</b>
                        </div>
                      </td>
                      <td>
                        <span className={`tag tag-${a.quiz?.quiz_type === 'daily' ? 'blue' : a.quiz?.quiz_type === 'weekend' ? 'gold' : 'green'}`}>
                          {a.quiz?.quiz_type?.toUpperCase() || t(lang, 'practiceSets').toUpperCase()}
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
                          {t(lang, 'reviewAnswers')}
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
          lang={lang}
          onClose={() => setReviewAttemptId(null)}
        />
      )}
    </>
  );
}
export function Practice({ lang = 'en' }: { lang?: Language }) {
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
        <span>{ui(lang, 'Loading practice sets…', 'පුහුණු කට්ටල පූරණය වෙමින්…')}</span>
      </div>
    );
  }

  if (activeQuiz) {
    return (
      <QuizRunner
        quiz={activeQuiz}
        sessionId={null}
        lang={lang}
        onComplete={() => setActiveQuiz(null)}
        onCancel={() => setActiveQuiz(null)}
      />
    );
  }

  return (
    <>
      <PageTitle
        eyebrow={t(lang, 'selfPaced')}
        title={t(lang, 'practiceSets')}
        subtitle={t(lang, 'practiceSubtitle')}
      />
      <div className="practice-grid">
        {quizzes.length === 0 ? (
          <div className="notice" style={{ gridColumn: 'span 2' }}>
            <AlertCircle size={18} />
            <span>{t(lang, 'practicePublishedEmpty')} {t(lang, 'askModerator')}</span>
          </div>
        ) : (
          quizzes.map((pq) => (
            <div className="practice-card" key={pq.id}>
              <div className="practice-icon green">
                <BookOpen size={23} />
              </div>
              <span className="tag tag-green">{t(lang, 'practiceSets')}</span>
              <h3><BilingualText en={pq.title_en} si={pq.title_si} /></h3>
              <p>{pq.description_en || pq.description_si ? <BilingualText en={pq.description_en} si={pq.description_si} /> : ui(lang, 'Sharpen your skills at your own pace.', 'ඔබේ වේගයෙන් ඔබේ කුසලතා තියුණු කරගන්න.')}</p>
              <div className="practice-bottom">
                <span>
                  <BookOpen size={15} /> {t(lang, 'unlimited')}
                </span>
                <button
                  className="round-arrow"
                   onClick={() => setActiveQuiz(pq)}
                  title={ui(lang, 'Start practice', 'පුහුණුව ආරම්භ කරන්න')}
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
          <b>{t(lang, 'practiceWithoutPressure')}</b> {t(lang, 'practiceInfo')}
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
        eyebrow={t(lang, 'makeYours')}
        title={t(lang, 'settings')}
        subtitle={t(lang, 'settingsSubtitle')}
      />
      <div className="settings-layout">
        <section className="panel settings-panel">
          <div className="settings-heading">
            <div className="settings-icon">
              <Languages />
            </div>
            <div>
              <h3>{t(lang, 'language')}</h3>
              <p>{t(lang, 'chooseLanguage')}</p>
            </div>
          </div>
          <div className="option-row">
            <div>
              <b>{t(lang, 'english')}</b>
              <small>{ui(lang, 'English interface and content where available', 'ලබා ගත හැකි තැන්වල English අතුරුමුහුණත සහ අන්තර්ගතය')}</small>
            </div>
            <button
              className={`choice-button ${lang === "en" ? "chosen" : ""}`}
               onClick={() => chooseLanguage("en")}
            >
              {lang === "en" ? t(lang, 'selected') : t(lang, 'choose')}
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
              {lang === "si" ? t(lang, 'selected') : t(lang, 'choose')}
            </button>
          </div>
          <div className="settings-heading separated">
            <div className="settings-icon">
              <Sun />
            </div>
            <div>
              <h3>{t(lang, 'theme')}</h3>
              <p>{ui(lang, 'Make your learning space comfortable.', 'ඔබේ ඉගෙනුම් අවකාශය සුවපහසු කරගන්න.')}</p>
            </div>
          </div>
          <div className="theme-options">
            <button
              className={`theme-option ${theme === "light" ? "chosen" : ""}`}
               onClick={() => chooseTheme("light")}
            >
              <Sun />
              <b>{t(lang, 'light')}</b>
              <small>{t(lang, 'clearBright')}</small>
            </button>
            <button
              className={`theme-option ${theme === "dark" ? "chosen" : ""}`}
               onClick={() => chooseTheme("dark")}
            >
              <Moon />
              <b>{t(lang, 'dark')}</b>
              <small>{t(lang, 'easyEyes')}</small>
            </button>
          </div>
          <p className="settings-footnote">
             {t(lang, 'savedPreferences')}
          </p>
        </section>
        <section className="panel account-panel">
          <div className="settings-heading">
            <div className="settings-icon">
              <LockKeyhole />
            </div>
            <div>
              <h3>{t(lang, 'accountPrivacy')}</h3>
              <p>{t(lang, 'protected')}</p>
            </div>
          </div>
          <div className="account-profile">
            <div className="avatar large-avatar">{(profile?.display_name || 'AS').slice(0, 2).toUpperCase()}</div>
            <div>
              <b>{profile?.display_name || 'Profile unavailable'}</b>
              <small>{profile?.role || 'student'} role</small>
              <span className={`tag ${profile?.is_active ? 'tag-green' : 'tag-muted'}`}>{profile?.is_active ? t(lang, 'activeStatus') : t(lang, 'inactiveStatus')}</span>
            </div>
          </div>
          <div className="privacy-item">
            <CircleCheck />
            <span>
                  <b>{t(lang, 'roleAccess')}</b>
                  <small>{ui(lang, 'Private attempt details are restricted to your account.', 'පෞද්ගලික උත්සාහ විස්තර ඔබේ ගිණුමට පමණක් සීමා වේ.')}</small>
            </span>
          </div>
          <div className="privacy-item">
            <CircleCheck />
            <span>
                  <b>{t(lang, 'protectedKeys')}</b>
                  <small>{ui(lang, 'Correct answers are revealed only after submission.', 'නිවැරදි පිළිතුරු පෙන්වන්නේ යොමු කළ පසුව පමණි.')}</small>
            </span>
          </div>
          <div className="privacy-item">
            <CircleCheck />
            <span>
                  <b>{t(lang, 'minimalProfile')}</b>
                  <small>{ui(lang, 'Leaderboards use display names, not email addresses.', 'ලකුණු පුවරුවේ භාවිතා කරන්නේ විද්‍යුත් තැපෑල නොව ප්‍රදර්ශන නාමයයි.')}</small>
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
export function Moderator({ lang = 'en' }: { lang?: Language }) {
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
        eyebrow={ui(lang, 'CONTENT MANAGEMENT', 'අන්තර්ගත කළමනාකරණය')}
        title={ui(lang, 'Moderator workspace', 'මධ්‍යස්ථක වැඩ අවකාශය')}
        subtitle={ui(lang, 'Create, schedule, and manage every quiz from one simple workspace.', 'එක් සරල වැඩ අවකාශයකින් සියලු ප්‍රශ්නාවලි සාදන්න, කාලසටහන්ගත කරන්න සහ කළමනාකරණය කරන්න.')}
      />
      <div className="notice">
        <LockKeyhole size={18} />
        <span>
          <b>{ui(lang, 'One simple workflow.', 'එක් සරල ක්‍රියාවලියක්.')}</b> {ui(lang, 'Create the quiz, add questions, and choose its schedule in one place.', 'ප්‍රශ්නාවලිය සාදා, ප්‍රශ්න එක් කර, එකම ස්ථානයකින් කාලසටහන තෝරන්න.')}
        </span>
      </div>
      <div className="stats-grid">
        <Stat
          icon={BookOpen}
          label={ui(lang, 'Question bank', 'ප්‍රශ්න බැංකුව')}
          value={String(moderatorStats.questionsCount)}
          detail={ui(lang, 'Add bilingual questions', 'භාෂා දෙකෙන් ප්‍රශ්න එක් කරන්න')}
        />
        <Stat
          icon={CalendarDays}
          label={ui(lang, 'Upcoming sessions', 'ඉදිරි සැසි')}
          value={String(moderatorStats.sessionsCount)}
          detail={ui(lang, 'Daily and weekend windows', 'දෛනික සහ සති අන්ත කාල කවුළු')}
        />
        <Stat
          icon={Trophy}
          label={ui(lang, 'Published quizzes', 'ප්‍රකාශිත ප්‍රශ්නාවලි')}
          value={String(moderatorStats.publishedQuizzesCount)}
          detail={ui(lang, 'Daily and weekend', 'දෛනික සහ සති අන්ත')}
        />
        <Stat
          icon={Users}
          label={ui(lang, 'Students', 'ශිෂ්‍යයින්')}
          value={String(moderatorStats.studentsCount)}
          detail={ui(lang, 'Private statistics', 'පෞද්ගලික සංඛ්‍යාලේඛන')}
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
export function Login({ lang = 'en' }: { lang?: Language }) {
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
          <div className="eyebrow">{ui(lang, 'A UNIVERSE OF KNOWLEDGE', 'දැනුමේ විශ්වයක්')}</div>
          <h1>
            {ui(lang, 'Big questions.', 'විශාල ප්‍රශ්න.')}
            <br />
            <em>{ui(lang, 'Bright futures.', 'දීප්තිමත් අනාගතයක්.')}</em>
          </h1>
          <p>
            {ui(lang, "Explore the cosmos, challenge your curiosity, and discover what you're capable of.", 'විශ්වය ගවේෂණය කර, ඔබේ කුතුහලයට අභියෝග කර, ඔබට කළ හැකි දේ සොයාගන්න.')}
          </p>
          <div className="login-points">
            <span>
              <CircleCheck /> {ui(lang, 'Daily astronomy challenges', 'දෛනික තාරකා විද්‍යා අභියෝග')}
            </span>
            <span>
              <CircleCheck /> {ui(lang, 'Friendly student leaderboard', 'හිතවත් ශිෂ්‍ය ලකුණු පුවරුව')}
            </span>
            <span>
              <CircleCheck /> {ui(lang, 'Learn at your own pace', 'ඔබේ වේගයෙන් ඉගෙන ගන්න')}
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
          <div className="eyebrow">{ui(lang, 'WELCOME BACK, ASTRONOMER', 'නැවත සාදරයෙන් පිළිගනිමු, තාරකා විද්‍යාඥයා')}</div>
          <h2>{t(lang, 'login')}</h2>
          <p>{t(lang, 'loginHint')}</p>
          <label>
            {t(lang, 'email')}
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="username"
              required
            />
          </label>
          <label>
            {t(lang, 'password')}
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="primary-button submit-button" type="submit">
            {t(lang, 'signin')} <ArrowUpRight size={17} />
          </button>
          <div className="login-security">
            <LockKeyhole size={15} /> {ui(lang, 'Secure sign-in · No public registration', 'ආරක්ෂිත පිවිසුම · පොදු ලියාපදිංචිය නැත')}
          </div>
          {!isSupabaseConfigured && (
            <div className="demo-notice">
              {ui(lang, 'Preview mode: configure Supabase to enable real authentication.', 'පෙරදසුන් ආකාරය: සැබෑ පිවිසුම සක්‍රිය කිරීමට Supabase සකසන්න.')}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
