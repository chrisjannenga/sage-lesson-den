export type Mood = 'open' | 'happy' | 'sleepy';

/** The Lesson Den cat. Colors come from CSS variables so it works in light and dark. */
export default function Cat({ mood }: { mood: Mood }) {
  return (
    <svg viewBox="0 0 100 90" role="img" aria-label="Cat">
      <path d="M13 40 18 6 44 24z" fill="var(--fur)" />
      <path d="M87 40 82 6 56 24z" fill="var(--fur)" />
      <path d="M20 31 22 15 34 24z" fill="var(--ear)" />
      <path d="M80 31 78 15 66 24z" fill="var(--ear)" />
      <ellipse cx="50" cy="54" rx="38" ry="32" fill="var(--fur)" />
      <path d="M50 23v9M41 25l2 8M59 25l-2 8" stroke="var(--fur-dark)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="50" cy="66" rx="15" ry="10" fill="#fff" opacity=".85" />
      {mood === 'happy' && (
        <path d="M30 46q6-9 12 0M58 46q6-9 12 0" fill="none" stroke="var(--ink)" strokeWidth="3.4" strokeLinecap="round" />
      )}
      {mood === 'sleepy' && (
        <>
          <path d="M30 46h12M58 46h12" stroke="var(--ink)" strokeWidth="3.4" strokeLinecap="round" />
          <text x="74" y="22" fontSize="11" fontWeight="800" fill="var(--muted)" fontFamily="Nunito,sans-serif">z</text>
          <text x="82" y="13" fontSize="8" fontWeight="800" fill="var(--muted)" fontFamily="Nunito,sans-serif">z</text>
        </>
      )}
      {mood === 'open' && (
        <>
          <ellipse cx="36" cy="46" rx="4.6" ry="5.6" fill="var(--ink)" />
          <ellipse cx="64" cy="46" rx="4.6" ry="5.6" fill="var(--ink)" />
          <circle cx="37.6" cy="44" r="1.5" fill="#fff" />
          <circle cx="65.6" cy="44" r="1.5" fill="#fff" />
        </>
      )}
      <path d="M46 58h8l-4 5z" fill="var(--ela)" />
      <path d="M50 63q-3.5 5-8 2.5M50 63q3.5 5 8 2.5" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M26 58 8 54M26 63 9 65M74 58 92 54M74 63 91 65" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}
