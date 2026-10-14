interface Props {
  en?: string | null;
  si?: string | null;
  className?: string;
}

export default function BilingualText({ en, si, className = '' }: Props) {
  const english = en?.trim() || '';
  const sinhala = si?.trim() || '';
  const same = english && sinhala && english === sinhala;

  if (!english && !sinhala) return null;
  if (!sinhala || same) return <span className={className}>{english || sinhala}</span>;
  if (!english) return <span className={className}>{sinhala}</span>;

  return (
    <span className={`bilingual-text ${className}`}>
      <span className="bilingual-si">{sinhala}</span>
      <span className="bilingual-en">{english}</span>
    </span>
  );
}
