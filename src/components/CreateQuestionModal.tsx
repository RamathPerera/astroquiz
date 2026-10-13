import { useState } from 'react';
import { X } from 'lucide-react';
import { createQuestionWithOptions } from '../lib/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateQuestionModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // Simplification for the sake of the form: 
    // Assuming 4 options for simplicity for now.
    const options = [
      { label: 'A', text_en: formData.get('optA_en') as string, text_si: formData.get('optA_si') as string, is_correct: formData.get('correct') === 'A', question_position: 1 },
      { label: 'B', text_en: formData.get('optB_en') as string, text_si: formData.get('optB_si') as string, is_correct: formData.get('correct') === 'B', question_position: 2 },
      { label: 'C', text_en: formData.get('optC_en') as string, text_si: formData.get('optC_si') as string, is_correct: formData.get('correct') === 'C', question_position: 3 },
      { label: 'D', text_en: formData.get('optD_en') as string, text_si: formData.get('optD_si') as string, is_correct: formData.get('correct') === 'D', question_position: 4 },
    ];

    const result = await createQuestionWithOptions({
      topic: formData.get('topic') as string,
      difficulty: formData.get('difficulty') as 'easy' | 'medium' | 'hard' | 'olympiad',
      prompt_en: formData.get('prompt_en') as string,
      prompt_si: formData.get('prompt_si') as string,
      explanation_en: formData.get('explanation_en') as string,
      explanation_si: formData.get('explanation_si') as string,
      options,
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
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Question</h2>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="notice warning">{error}</div>}
          
          <div className="form-group">
            <label>Topic</label>
            <input name="topic" required />
          </div>
          <div className="form-group">
            <label>Difficulty</label>
            <select name="difficulty" defaultValue="easy">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="olympiad">Olympiad</option>
            </select>
          </div>
          <div className="form-group">
            <label>Prompt (EN)</label>
            <textarea name="prompt_en" required />
          </div>
          <div className="form-group">
            <label>Prompt (SI)</label>
            <textarea name="prompt_si" required />
          </div>
          
          {/* Options */}
          {['A','B','C','D'].map(l => (
            <div key={l} style={{display: 'flex', gap: '10px'}}>
              <div className="form-group">
                <label>Option {l} (EN)</label>
                <input name={`opt${l}_en`} required />
              </div>
              <div className="form-group">
                <label>Option {l} (SI)</label>
                <input name={`opt${l}_si`} required />
              </div>
            </div>
          ))}
          <div className="form-group">
            <label>Correct Answer</label>
            <select name="correct">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Explanation (EN)</label>
            <textarea name="explanation_en" />
          </div>
          <div className="form-group">
            <label>Explanation (SI)</label>
            <textarea name="explanation_si" />
          </div>
          
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
