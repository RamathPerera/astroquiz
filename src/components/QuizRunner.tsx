import { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, ChevronLeft, ChevronRight, Send, AlertTriangle, X } from 'lucide-react';
import {
  type Quiz,
  type QuizAttempt,
  type FormattedQuestion,
  startOrResumeQuiz,
  getQuizQuestions,
  getAttemptAnswers,
  saveQuizAnswer,
  submitQuiz,
} from '../lib/api';
import type { Language } from '../lib/i18n';
import { t, ui } from '../lib/i18n';
import BilingualText from './BilingualText';

interface Props {
  quiz: Quiz;
  attempt?: QuizAttempt | null;
  sessionId?: string | null;
  lang: Language;
  onComplete: (submitted: QuizAttempt) => void;
  onCancel: () => void;
}

export default function QuizRunner({
  quiz,
  attempt: initialAttempt,
  sessionId,
  lang,
  onComplete,
  onCancel,
}: Props) {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(initialAttempt || null);
  const [questions, setQuestions] = useState<FormattedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    let alive = true;

    async function init() {
      try {
        let activeAttempt = initialAttempt;
        if (!activeAttempt) {
          const { attempt: started, error: startErr } = await startOrResumeQuiz(
            quiz.id,
            sessionId ?? null
          );
          if (startErr || !started) {
            throw new Error(startErr || ui(lang, 'Failed to start quiz attempt.', 'ප්‍රශ්නාවලි උත්සාහය ආරම්භ කළ නොහැක.'));
          }
          activeAttempt = started;
          if (alive) setAttempt(started);
        }

        const [qList, ansMap] = await Promise.all([
          getQuizQuestions(quiz.id),
          getAttemptAnswers(activeAttempt.id),
        ]);

        if (!alive) return;
        setQuestions(qList);
        setSelectedAnswers(ansMap);
        setLoading(false);
      } catch (err: any) {
        if (!alive) return;
        setError(err.message || ui(lang, 'Could not load quiz questions.', 'ප්‍රශ්නාවලි ප්‍රශ්න පූරණය කළ නොහැක.'));
        setLoading(false);
      }
    }

    init();

    return () => {
      alive = false;
    };
  }, [quiz.id, initialAttempt, sessionId]);

  useEffect(() => {
    if (!attempt?.deadline_at) return;
    const deadline = new Date(attempt.deadline_at).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((deadline - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        clearInterval(interval);
        handleFinalSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt?.deadline_at]);

  async function handleSelectOption(quizQuestionId: string, optionId: string) {
    if (!attempt) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [quizQuestionId]: optionId,
    }));
    await saveQuizAnswer(attempt.id, quizQuestionId, optionId);
  }

  async function handleFinalSubmit() {
    if (!attempt) return;
    setIsSubmitting(true);
    setShowConfirm(false);
    const { result, error: submitErr } = await submitQuiz(attempt.id);
    setIsSubmitting(false);

    if (submitErr) {
      alert(`${ui(lang, 'Submission error', 'යොමු කිරීමේ දෝෂය')}: ${submitErr}`);
      return;
    }

    if (result) {
      onComplete(result);
    }
  }

  function formatTimer(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="quiz-runner-loading">
        <span className="loading-atom">✦</span>
        <p>{t(lang, 'loadingQuestions')}</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="panel quiz-runner-error">
        <AlertTriangle size={32} />
        <h3>{t(lang, 'cannotStart')}</h3>
        <p>{error || ui(lang, 'This quiz currently has no questions linked.', 'මෙම ප්‍රශ්නාවලියට තවමත් ප්‍රශ්න සම්බන්ධ කර නැත.')}</p>
        <button className="primary-button" onClick={onCancel}>
          {t(lang, 'returnQuizzes')}
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const title = <BilingualText en={quiz.title_en} si={quiz.title_si} />;
  const prompt = <BilingualText en={currentQ.prompt_en} si={currentQ.prompt_si} className="question-content" />;
  const totalCount = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  return (
    <div className="quiz-runner">
      <div className="runner-header">
        <div className="runner-title-group">
          <button className="icon-button close-runner-btn" onClick={onCancel} title={t(lang, 'exitQuiz')}>
            <X size={18} />
          </button>
          <div>
            <span className="eyebrow">{quiz.quiz_type.toUpperCase()} {t(lang, 'challenge')}</span>
            <h3>{title}</h3>
          </div>
        </div>

        <div className="runner-meta-group">
          {timeLeft !== null && (
            <div className={`timer-pill ${timeLeft < 180 ? 'timer-warning' : ''}`}>
              <Clock size={16} />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          )}
          <div className="progress-badge">
            <CheckCircle2 size={16} />
            <span>{answeredCount} / {totalCount} {t(lang, 'answered')}</span>
          </div>
          <button
            className="primary-button submit-quiz-btn"
            onClick={() => setShowConfirm(true)}
            disabled={isSubmitting}
          >
            <Send size={15} />
            <span>{t(lang, 'submitQuiz')}</span>
          </button>
        </div>
      </div>

      <div className="question-nav-strip">
        {questions.map((q, idx) => {
          const isAnswered = Boolean(selectedAnswers[q.quiz_question_id]);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.quiz_question_id}
              className={`nav-dot-btn ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              title={`${t(lang, 'question')} ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div className="panel question-panel">
        <div className="question-panel-top">
          <span className="tag tag-blue">{t(lang, 'question')} {currentIndex + 1} / {totalCount}</span>
          <span className="tag tag-muted">{currentQ.topic}</span>
          <span className="marks-badge">{t(lang, 'marks')} {currentQ.marks}</span>
        </div>

        <div className="question-progress-track"><i style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }} /></div>

        <h3 className="question-text">{prompt}</h3>

        <div className="options-grid">
          {currentQ.options.map((opt) => {
            const isSelected = selectedAnswers[currentQ.quiz_question_id] === opt.id;
            const optText = <BilingualText en={opt.text_en} si={opt.text_si} className="option-content" />;

            return (
              <button
                key={opt.id}
                className={`option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectOption(currentQ.quiz_question_id, opt.id)}
              >
                <span className="option-label">{opt.label}</span>
                <span className="option-text">{optText}</span>
              </button>
            );
          })}
        </div>

        <div className="question-actions">
          <button
            className="secondary-button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((c) => Math.max(0, c - 1))}
          >
            <ChevronLeft size={16} /> {t(lang, 'previous')}
          </button>

          {currentIndex < totalCount - 1 ? (
            <button
              className="primary-button"
              onClick={() => setCurrentIndex((c) => Math.min(totalCount - 1, c + 1))}
            >
              {t(lang, 'next')} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={() => setShowConfirm(true)}
            >
              {t(lang, 'finishReview')} <Send size={16} />
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="modal-backdrop">
          <div className="modal-content confirm-modal">
            <h3>{t(lang, 'readySubmit')}</h3>
            <p>
              {ui(lang, `You have answered ${answeredCount} of ${totalCount} questions.`, `ඔබ ප්‍රශ්න ${totalCount}කින් ${answeredCount}කට පිළිතුරු දී ඇත.`)}
              {answeredCount < totalCount && ` ${t(lang, 'unanswered')}`}
            </p>
            <p className="confirm-note">
              {t(lang, 'savedImmediately')}
            </p>
            <div className="confirm-actions">
              <button
                className="secondary-button"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
              >
                {t(lang, 'continueAnswering')}
              </button>
              <button
                className="primary-button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? t(lang, 'grading') : t(lang, 'yesSubmit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

