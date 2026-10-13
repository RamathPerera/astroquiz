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
            throw new Error(startErr || 'Failed to start quiz attempt.');
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
        setError(err.message || 'Could not load quiz questions.');
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
      alert(`Submission error: ${submitErr}`);
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
        <p>Loading quiz questions…</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="panel quiz-runner-error">
        <AlertTriangle size={32} />
        <h3>Cannot start quiz</h3>
        <p>{error || 'This quiz currently has no questions linked.'}</p>
        <button className="primary-button" onClick={onCancel}>
          Return to Quizzes
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const title = quiz.title_si || 'ප්‍රශ්නාවලිය';
  const prompt = currentQ.prompt_si || 'මෙම ප්‍රශ්නය සඳහා සිංහල අන්තර්ගතය නොමැත.';
  const totalCount = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  return (
    <div className="quiz-runner">
      <div className="runner-header">
        <div className="runner-title-group">
          <button className="icon-button close-runner-btn" onClick={onCancel} title="Exit quiz">
            <X size={18} />
          </button>
          <div>
            <span className="eyebrow">{quiz.quiz_type.toUpperCase()} CHALLENGE</span>
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
            <span>{answeredCount} / {totalCount} answered</span>
          </div>
          <button
            className="primary-button submit-quiz-btn"
            onClick={() => setShowConfirm(true)}
            disabled={isSubmitting}
          >
            <Send size={15} />
            <span>Submit Quiz</span>
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
              title={`Question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div className="panel question-panel">
        <div className="question-panel-top">
          <span className="tag tag-blue">ප්‍රශ්නය {currentIndex + 1} / {totalCount}</span>
          <span className="tag tag-muted">{currentQ.topic}</span>
          <span className="marks-badge">ලකුණු {currentQ.marks}</span>
        </div>

        <div className="question-progress-track"><i style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }} /></div>

        <h3 className="question-text">{prompt}</h3>

        <div className="options-grid">
          {currentQ.options.map((opt) => {
            const isSelected = selectedAnswers[currentQ.quiz_question_id] === opt.id;
            const optText = opt.text_si || 'සිංහල පිළිතුර නොමැත';

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
            <ChevronLeft size={16} /> Previous
          </button>

          {currentIndex < totalCount - 1 ? (
            <button
              className="primary-button"
              onClick={() => setCurrentIndex((c) => Math.min(totalCount - 1, c + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={() => setShowConfirm(true)}
            >
              Finish & Review <Send size={16} />
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="modal-backdrop">
          <div className="modal-content confirm-modal">
            <h3>Ready to submit?</h3>
            <p>
              You have answered <b>{answeredCount}</b> of <b>{totalCount}</b> questions.
              {answeredCount < totalCount && ' You have unanswered questions.'}
            </p>
            <p className="confirm-note">
              Once submitted, your answers will be graded and saved immediately.
            </p>
            <div className="confirm-actions">
              <button
                className="secondary-button"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
              >
                Continue Answering
              </button>
              <button
                className="primary-button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Grading…' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

