import { useState } from "react";
import { CalendarDays, Check, Clock3, Plus, Trash2, X } from "lucide-react";
import { createQuizWithQuestions, deleteQuiz, updateQuizFull, type ModeratorQuiz, type QuizDraftQuestion } from "../lib/api";

type QuizType = "daily" | "weekend" | "practice";

interface BuilderProps {
  onClose: () => void;
  onSuccess: () => void;
}

const blankQuestion = (): QuizDraftQuestion => ({
  prompt_si: "",
  options: ["A", "B", "C", "D"].map((label) => ({ label, text_si: "", is_correct: label === "A" })),
});

export function QuizBuilderModal({ onClose, onSuccess }: BuilderProps) {
  const [quizType, setQuizType] = useState<QuizType>("practice");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dailyDate, setDailyDate] = useState("");
  const [weeklyDate, setWeeklyDate] = useState("");
  const [weeklyTime, setWeeklyTime] = useState("");
  const [questions, setQuestions] = useState<QuizDraftQuestion[]>([]);
  const [draftQuestion, setDraftQuestion] = useState<QuizDraftQuestion>(blankQuestion());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateOption(index: number, text_si: string) {
    setDraftQuestion((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index ? { ...option, text_si } : option),
    }));
  }

  function setCorrect(index: number) {
    setDraftQuestion((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => ({ ...option, is_correct: optionIndex === index })),
    }));
  }

  function addQuestion() {
    if (!draftQuestion.prompt_si.trim() || draftQuestion.options.some((option) => !option.text_si.trim())) {
      setError("ප්‍රශ්නය සහ පිළිතුරු හතරම ඇතුළත් කරන්න.");
      return;
    }
    setQuestions((current) => [...current, draftQuestion]);
    setDraftQuestion(blankQuestion());
    setError(null);
  }
  function updateExistingQuestion(questionIndex: number, update: (question: QuizDraftQuestion) => QuizDraftQuestion) {
    setQuestions((current) => current.map((question, index) => index === questionIndex ? update(question) : question));
  }

  async function submit() {
    if (!title.trim() || !description.trim()) return setError("මාතෘකාව සහ විස්තරය ඇතුළත් කරන්න.");
    if (questions.length === 0) return setError("අවම වශයෙන් එක් ප්‍රශ්නයක් එකතු කරන්න.");
    if (quizType === "daily" && !dailyDate) return setError("Daily quiz දිනය තෝරන්න.");
    if (quizType === "weekend" && (!weeklyDate || !weeklyTime)) return setError("Weekend quiz දිනය සහ ආරම්භක වේලාව තෝරන්න.");
    setSaving(true);
    setError(null);
    const starts_at = quizType === "daily"
      ? new Date(`${dailyDate}T00:00:00`).toISOString()
      : quizType === "weekend"
        ? new Date(`${weeklyDate}T${weeklyTime}:00`).toISOString()
        : undefined;
    const result = await createQuizWithQuestions({ title_si: title, description_si: description, quiz_type: quizType, starts_at, questions });
    setSaving(false);
    if (result.error) setError(result.error);
    else onSuccess();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content quiz-builder-modal">
        <div className="modal-header">
          <div className="modal-heading"><span className="modal-heading-icon"><Plus size={20} /></span><div><span className="eyebrow">QUIZ BUILDER</span><h2>Create quiz</h2></div></div>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>
        <p className="modal-intro">එක් තැනකින් quiz විස්තර, දිනය සහ ප්‍රශ්න එකතු කරන්න.</p>
        <div className="builder-step"><span>01</span><div><b>Quiz details</b><small>වර්ගය සහ schedule එක තෝරන්න</small></div></div>
        <div className="form-grid two-column">
          <div className="form-group"><label>Quiz title</label><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="උදා: සූර්ය මණ්ඩලය" /></div>
          <div className="form-group"><label>Quiz type</label><select value={quizType} onChange={(event) => setQuizType(event.target.value as QuizType)}><option value="daily">Daily quiz</option><option value="weekend">Weekly / Weekend quiz</option><option value="practice">Practice quiz</option></select></div>
        </div>
        <div className="form-group"><label>Description</label><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="මෙම quiz එක ගැන කෙටි විස්තරයක්" /></div>
        {quizType === "daily" && <div className="schedule-choice"><CalendarDays size={18} /><div><label>Daily quiz date</label><input type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} /><small>එදින පුරා studentලාට open වේ.</small></div></div>}
        {quizType === "weekend" && <div className="form-grid two-column"><div className="schedule-choice"><CalendarDays size={18} /><div><label>Weekend date</label><input type="date" value={weeklyDate} onChange={(event) => setWeeklyDate(event.target.value)} /></div></div><div className="schedule-choice"><Clock3 size={18} /><div><label>Start time</label><input type="time" value={weeklyTime} onChange={(event) => setWeeklyTime(event.target.value)} /><small>End time විනාඩි 90කට පසුවයි.</small></div></div></div>}
        {quizType === "practice" && <div className="form-help">Practice quiz එකට date/time අවශ්‍ය නැහැ. Studentsට unlimited attempts ලැබේ.</div>}

        <div className="builder-step"><span>02</span><div><b>Questions</b><small>{questions.length} questions added</small></div></div>
        {questions.map((question, index) => <div className="question-draft-row" key={`${index}-${question.prompt_si}`}><span>{index + 1}</span><b>{question.prompt_si}</b><button className="icon-button danger-button" onClick={() => setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))}><Trash2 size={15} /></button></div>)}
        <div className="question-draft-form"><div className="form-group"><label>Question {questions.length + 1}</label><textarea value={draftQuestion.prompt_si} onChange={(event) => setDraftQuestion((current) => ({ ...current, prompt_si: event.target.value }))} placeholder="ප්‍රශ්නය සිංහලෙන්" /></div>{draftQuestion.options.map((option, index) => <div className="option-input-row" key={option.label}><button type="button" className={`correct-toggle ${option.is_correct ? "chosen" : ""}`} onClick={() => setCorrect(index)} title="Correct answer">{option.is_correct ? <Check size={15} /> : option.label}</button><input value={option.text_si} onChange={(event) => updateOption(index, event.target.value)} placeholder={`පිළිතුර ${option.label}`} /></div>)}<button className="secondary-button add-question-button" onClick={addQuestion}><Plus size={16} /> Add question</button></div>
        {error && <div className="notice warning">{error}</div>}
        <div className="modal-footer"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={submit} disabled={saving}>{saving ? "Creating..." : "Create quiz"}</button></div>
      </div>
    </div>
  );
}

export function EditQuizModal({ quiz, onClose, onSuccess }: { quiz: ModeratorQuiz; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState(quiz.title_si);
  const [description, setDescription] = useState(quiz.description_si || "");
  const [quizType, setQuizType] = useState<QuizType>(quiz.quiz_type);
  const [status, setStatus] = useState<"draft" | "published" | "archived">(quiz.status);
  const [dailyDate, setDailyDate] = useState(quiz.session ? new Date(quiz.session.starts_at).toISOString().slice(0, 10) : "");
  const [weeklyDate, setWeeklyDate] = useState(quiz.session ? new Date(quiz.session.starts_at).toISOString().slice(0, 10) : "");
  const [weeklyTime, setWeeklyTime] = useState(quiz.session ? new Date(quiz.session.starts_at).toISOString().slice(11, 16) : "");
  const [questions, setQuestions] = useState<QuizDraftQuestion[]>(quiz.questions || []);
  const [draftQuestion, setDraftQuestion] = useState<QuizDraftQuestion>(blankQuestion());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hasAttempts = (quiz.attempt_count || 0) > 0;

  function updateOption(index: number, text_si: string) {
    setDraftQuestion((current) => ({ ...current, options: current.options.map((option, optionIndex) => optionIndex === index ? { ...option, text_si } : option) }));
  }
  function setCorrect(index: number) {
    setDraftQuestion((current) => ({ ...current, options: current.options.map((option, optionIndex) => ({ ...option, is_correct: optionIndex === index })) }));
  }
  function addQuestion() {
    if (!draftQuestion.prompt_si.trim() || draftQuestion.options.some((option) => !option.text_si.trim())) {
      setError("Add a question and all four options first.");
      return;
    }
    setQuestions((current) => [...current, draftQuestion]);
    setDraftQuestion(blankQuestion());
    setError(null);
  }
  function updateExistingQuestion(questionIndex: number, update: (question: QuizDraftQuestion) => QuizDraftQuestion) {
    setQuestions((current) => current.map((question, index) => index === questionIndex ? update(question) : question));
  }
  async function save() {
    if (!title.trim() || !description.trim()) return setError("Add a title and description.");
    if (questions.length === 0) return setError("Add at least one question.");
    if (quizType === "daily" && !dailyDate) return setError("Choose the daily quiz date.");
    if (quizType === "weekend" && (!weeklyDate || !weeklyTime)) return setError("Choose the weekly date and start time.");
    setSaving(true);
    setError(null);
    const starts_at = quizType === "daily" ? new Date(`${dailyDate}T00:00:00`).toISOString() : quizType === "weekend" ? new Date(`${weeklyDate}T${weeklyTime}:00`).toISOString() : undefined;
    const result = await updateQuizFull({ id: quiz.id, title_si: title, description_si: description, status, quiz_type: quizType, starts_at, questions });
    setSaving(false);
    if (result.error) setError(result.error); else onSuccess();
  }
  async function removeQuiz() {
    if (!window.confirm("Delete this quiz? A quiz with attempts will be archived to preserve results.")) return;
    setSaving(true);
    const result = await deleteQuiz(quiz.id);
    setSaving(false);
    if (result.error && !result.archived) setError(result.error); else onSuccess();
  }

  return <div className="modal-backdrop"><div className="modal-content quiz-builder-modal"><div className="modal-header"><div><span className="eyebrow">EDIT QUIZ</span><h2>Update quiz</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>
    {hasAttempts && <div className="notice warning">This quiz has student attempts. Its questions and schedule are locked so existing results stay correct.</div>}
    <div className="form-grid two-column"><div className="form-group"><label>Quiz title</label><input value={title} onChange={(event) => setTitle(event.target.value)} /></div><div className="form-group"><label>Quiz type</label><select value={quizType} disabled={hasAttempts} onChange={(event) => setQuizType(event.target.value as QuizType)}><option value="daily">Daily quiz</option><option value="weekend">Weekly / Weekend quiz</option><option value="practice">Practice quiz</option></select></div></div>
    <div className="form-group"><label>Description</label><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></div>
    <div className="form-group"><label>Status</label><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
    {!hasAttempts && quizType === "daily" && <div className="schedule-choice"><CalendarDays size={18} /><div><label>Daily quiz date</label><input type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} /></div></div>}
    {!hasAttempts && quizType === "weekend" && <div className="form-grid two-column"><div className="schedule-choice"><CalendarDays size={18} /><div><label>Weekly date</label><input type="date" value={weeklyDate} onChange={(event) => setWeeklyDate(event.target.value)} /></div></div><div className="schedule-choice"><Clock3 size={18} /><div><label>Start time</label><input type="time" value={weeklyTime} onChange={(event) => setWeeklyTime(event.target.value)} /><small>End time is set automatically to 90 minutes later.</small></div></div></div>}
    {!hasAttempts && <><div className="builder-step"><span>01</span><div><b>Questions</b><small>{questions.length} questions</small></div></div>{questions.map((question, index) => <div className="question-draft-form" key={`${question.id || "new"}-${index}`}><div className="question-form-heading"><span className="question-number">{index + 1}</span><b>Edit question</b><button className="icon-button danger-button" onClick={() => setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))}><Trash2 size={15} /></button></div><textarea value={question.prompt_si} onChange={(event) => updateExistingQuestion(index, (current) => ({ ...current, prompt_si: event.target.value }))} placeholder="Sinhala question" />{question.options.map((option, optionIndex) => <div className="option-input-row" key={option.label}><button type="button" className={`correct-toggle ${option.is_correct ? "chosen" : ""}`} onClick={() => updateExistingQuestion(index, (current) => ({ ...current, options: current.options.map((item, itemIndex) => ({ ...item, is_correct: itemIndex === optionIndex })) }))}>{option.is_correct ? <Check size={15} /> : option.label}</button><input value={option.text_si} onChange={(event) => updateExistingQuestion(index, (current) => ({ ...current, options: current.options.map((item, itemIndex) => itemIndex === optionIndex ? { ...item, text_si: event.target.value } : item) }))} placeholder={`Option ${option.label}`} /></div>)}</div>)}<div className="question-draft-form"><div className="form-group"><label>New question</label><textarea value={draftQuestion.prompt_si} onChange={(event) => setDraftQuestion((current) => ({ ...current, prompt_si: event.target.value }))} placeholder="Sinhala question" /></div>{draftQuestion.options.map((option, index) => <div className="option-input-row" key={option.label}><button type="button" className={`correct-toggle ${option.is_correct ? "chosen" : ""}`} onClick={() => setCorrect(index)}>{option.is_correct ? <Check size={15} /> : option.label}</button><input value={option.text_si} onChange={(event) => updateOption(index, event.target.value)} placeholder={`Option ${option.label}`} /></div>)}<button className="secondary-button add-question-button" onClick={addQuestion}><Plus size={16} /> Add question</button></div></>}
    {error && <div className="notice warning">{error}</div>}
    <div className="modal-footer"><button className="danger-button secondary-button" onClick={removeQuiz} disabled={saving}><Trash2 size={15} /> Delete quiz</button><span className="modal-footer-spacer" /><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div>
  </div></div>;
}
