import { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { createQuiz } from '../lib/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateQuizModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizType, setQuizType] = useState<'daily' | 'weekend' | 'practice'>('practice');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const result = await createQuiz({
      title_en: formData.get('title_en') as string,
      title_si: formData.get('title_si') as string,
      description_en: formData.get('description_en') as string,
      description_si: formData.get('description_si') as string,
      quiz_type: formData.get('quiz_type') as 'daily' | 'weekend' | 'practice',
      duration_seconds: quizType === 'daily' ? 1800 : quizType === 'weekend' ? 5400 : null,
      status: formData.get('status') as 'draft' | 'published',
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content quiz-create-modal">
        <div className="modal-header">
          <div className="modal-heading">
            <span className="modal-heading-icon"><BookOpen size={20} /></span>
            <div>
              <span className="eyebrow">CONTENT STUDIO</span>
              <h2>Create a new quiz</h2>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>
        <p className="modal-intro">Build a bilingual astronomy challenge. Published daily and weekend quizzes open a session automatically.</p>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="notice warning">{error}</div>}
          <section className="form-section">
            <div className="form-section-title">Quiz identity <span>01</span></div>
            <div className="form-grid two-column">
              <div className="form-group">
                <label>Title (English)</label>
                <input name="title_en" placeholder="e.g. Solar System Explorer" required />
              </div>
              <div className="form-group">
                <label>Title (Sinhala)</label>
                <input name="title_si" placeholder="සිංහල මාතෘකාව" required />
              </div>
            </div>
            <div className="form-grid two-column">
              <div className="form-group">
                <label>Description (English)</label>
                <textarea name="description_en" placeholder="What will students explore?" required />
              </div>
              <div className="form-group">
                <label>Description (Sinhala)</label>
                <textarea name="description_si" placeholder="සිංහල විස්තරය" required />
              </div>
            </div>
          </section>
          <section className="form-section">
            <div className="form-section-title">Format and access <span>02</span></div>
            <div className="form-grid two-column">
              <div className="form-group">
                <label>Quiz type</label>
                <select name="quiz_type" value={quizType} onChange={(event) => setQuizType(event.target.value as typeof quizType)}>
                  <option value="daily">Daily challenge</option>
                  <option value="weekend">Weekend Olympiad</option>
                  <option value="practice">Practice set</option>
                </select>
              </div>
              <div className="form-group">
                <label>Time limit</label>
                <div className="form-help">
                  {quizType === 'daily' && '30 minutes · opens a 30-day session'}
                  {quizType === 'weekend' && '90 minutes · opens a 30-day session'}
                  {quizType === 'practice' && 'Unlimited · no leaderboard points'}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Publishing status</label>
              <select name="status" defaultValue="draft">
                <option value="draft">Save as draft</option>
                <option value="published">Publish now</option>
              </select>
            </div>
          </section>
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={loading}>
              <BookOpen size={16} /> {loading ? 'Creating...' : 'Create quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
