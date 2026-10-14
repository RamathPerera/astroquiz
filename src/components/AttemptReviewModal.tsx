import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Award, Sparkles, BookOpen } from 'lucide-react';
import { getAttemptReview, type AttemptReviewItem } from '../lib/api';
import type { Language } from '../lib/i18n';
import { t, ui } from '../lib/i18n';
import BilingualText from './BilingualText';

interface Props {
  attemptId: string;
  lang: Language;
  onClose: () => void;
}

export default function AttemptReviewModal({ attemptId, lang, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [reviewItems, setReviewItems] = useState<AttemptReviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getAttemptReview(attemptId)
      .then((items) => {
        if (!alive) return;
        setReviewItems(items);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || ui(lang, 'Failed to load review.', 'සමාලෝචනය පූරණය කළ නොහැක.'));
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [attemptId]);

  const totalAwarded = reviewItems.reduce(
    (sum, item) => sum + Number(item.marks_awarded || 0),
    0
  );
  const correctCount = reviewItems.filter((i) => i.is_correct).length;

  return (
    <div className="modal-backdrop">
      <div className="modal-content review-modal">
        <div className="modal-header">
          <div>
            <div className="eyebrow">{t(lang, 'attemptReview')}</div>
            <h2>{t(lang, 'questionBreakdown')}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="modal-loading">
            <span className="loading-atom">✦</span>
            <p>{t(lang, 'loadingReview')}</p>
          </div>
        ) : error ? (
          <div className="notice warning">
            <span>{error}</span>
          </div>
        ) : reviewItems.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={32} />
            <p>{t(lang, 'noQuestions')}</p>
          </div>
        ) : (
          <>
            <div className="review-summary-banner">
              <div className="summary-pill">
                <CheckCircle size={17} />
                <span>{t(lang, 'correct')}: <b>{correctCount} / {reviewItems.length}</b></span>
              </div>
              <div className="summary-pill">
                <Award size={17} />
                <span>{t(lang, 'score')}: <b>{totalAwarded.toFixed(1)} pts</b></span>
              </div>
            </div>

            <div className="review-list">
              {reviewItems.map((item, index) => {
                return (
                  <div
                    key={item.quiz_question_id || index}
                    className={`review-card ${item.is_correct ? 'correct-card' : 'incorrect-card'}`}
                  >
                    <div className="review-card-top">
                      <span className="question-num-tag">{t(lang, 'question')} {item.question_position || index + 1}</span>
                      <span className="tag tag-muted">{item.topic}</span>
                      <span className="tag tag-blue">{item.difficulty}</span>
                      <span className={`marks-pill ${item.is_correct ? 'positive' : 'negative'}`}>
                        {item.is_correct ? `+${item.marks_awarded}` : `${item.marks_awarded}`} pts
                      </span>
                    </div>

                    <h4 className="question-prompt"><BilingualText en={item.prompt_en} si={item.prompt_si} /></h4>

                    <div className="answers-comparison">
                      <div className={`answer-box ${item.is_correct ? 'correct' : 'incorrect'}`}>
                        <div className="answer-label">
                          {item.is_correct ? <CheckCircle size={15} /> : <XCircle size={15} />}
                          <span>{t(lang, 'yourAnswer')}:</span>
                        </div>
                        <p>{item.selected_label ? <b>{item.selected_label}. </b> : null}{item.selected_text_en || item.selected_text_si ? <BilingualText en={item.selected_text_en} si={item.selected_text_si} /> : <em>{t(lang, 'notAnswered')}</em>}</p>
                      </div>

                      {!item.is_correct && (
                        <div className="answer-box correct">
                          <div className="answer-label">
                            <CheckCircle size={15} />
                            <span>{t(lang, 'correctAnswer')}:</span>
                          </div>
                          <p><b>{item.correct_label}. </b><BilingualText en={item.correct_text_en} si={item.correct_text_si} /></p>
                        </div>
                      )}
                    </div>

                    {(item.explanation_en || item.explanation_si) && (
                      <div className="explanation-box">
                        <div className="explanation-title">
                          <Sparkles size={14} />
                          <span>{t(lang, 'explanation')}</span>
                        </div>
                        <p><BilingualText en={item.explanation_en} si={item.explanation_si} /></p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="modal-footer">
          <button className="primary-button" onClick={onClose}>{t(lang, 'closeReview')}</button>
        </div>
      </div>
    </div>
  );
}
