'use client';

import { useEffect, useState } from 'react';
import Cat, { type Mood } from './Cat';
import { useProgress, type Status } from '@/lib/useProgress';
import { DAYS, byDate, focusOf, lessonsOf, type Day, type Lesson } from '@/lib/schedule';
import { addDays, fmt, mondayOf, offLabel, todayKey } from '@/lib/dates';

type Tab = 'today' | 'catchup' | 'week';
type Toggle = (ids: string[], on: boolean) => void;
type Done = Set<string>;

const LONG: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
const MD: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

function countsFor(day: Day, done: Done) {
  const ls = lessonsOf(day);
  return { total: ls.length, n: ls.filter((l) => done.has(l.id)).length };
}

function missedDays(today: string, done: Done) {
  return DAYS.filter((d) => d.d < today)
    .map((day) => ({ day, lessons: lessonsOf(day).filter((l) => !done.has(l.id)) }))
    .filter((x) => x.lessons.length);
}

function nextDayAfter(k: string, inclusive: boolean) {
  return DAYS.find((d) => (inclusive ? d.d >= k : d.d > k)) ?? null;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning, Sage' : h < 17 ? 'Good afternoon, Sage' : 'Good evening, Sage';
}

function syncNote(status: Status) {
  if (status === 'synced') return 'Progress is saved online and follows you between devices.';
  if (status === 'saving') return 'Saving...';
  if (status === 'offline') return "Can't reach the saved list right now. Check-offs are kept on this device and will sync when it's back.";
  return 'Loading your progress...';
}

/* ---------- small pieces ---------- */

function LessonRow({ l, done, onToggle }: { l: Lesson; done: Done; onToggle: Toggle }) {
  const on = done.has(l.id);
  return (
    <label className={'lesson' + (on ? ' is-done' : '')}>
      <input type="checkbox" checked={on} onChange={(e) => onToggle([l.id], e.target.checked)} />
      <span className="paw">
        <svg aria-hidden="true">
          <use href="#paw" />
        </svg>
      </span>
      <span className="ltxt">
        <span className="lname">{l.name}</span>
        <span className="code">IXL {l.code}</span>
      </span>
    </label>
  );
}

function Subject({ subj, ls, done, onToggle }: { subj: 'Math' | 'ELA'; ls: Lesson[]; done: Done; onToggle: Toggle }) {
  if (!ls.length) return null;
  const n = ls.filter((l) => done.has(l.id)).length;
  return (
    <section className={'subj ' + (subj === 'Math' ? 'math' : 'ela')}>
      <header>
        <h3>{subj === 'Math' ? 'Math' : 'Language Arts'}</h3>
        <span className="focus">{focusOf(ls)}</span>
        <span className="cnt">
          {n} of {ls.length}
        </span>
      </header>
      {ls.map((l) => (
        <LessonRow key={l.id} l={l} done={done} onToggle={onToggle} />
      ))}
    </section>
  );
}

function DaySections({ day, done, onToggle, onlyOpen }: { day: Day; done: Done; onToggle: Toggle; onlyOpen?: boolean }) {
  let ls = lessonsOf(day);
  if (onlyOpen) ls = ls.filter((l) => !done.has(l.id));
  return (
    <>
      <Subject subj="Math" ls={ls.filter((l) => l.subj === 'Math')} done={done} onToggle={onToggle} />
      <Subject subj="ELA" ls={ls.filter((l) => l.subj === 'ELA')} done={done} onToggle={onToggle} />
    </>
  );
}

function Hero(props: { title: string; sub: string; n: number; total: number; mood: Mood; cheer?: boolean }) {
  const { title, sub, n, total, mood, cheer } = props;
  const pct = total ? Math.round((100 * n) / total) : 0;
  const walk = Math.min(96, Math.max(4, pct));
  return (
    <section className={'hero' + (cheer ? ' cheer' : '')}>
      <div className="mascot">
        <Cat mood={mood} />
      </div>
      <div>
        <h2>{title}</h2>
        <div className="sub">{sub}</div>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={n}>
          <div className="fill" style={{ width: pct + '%' }} />
          <div className="walker" style={{ left: walk + '%' }}>
            <Cat mood={pct === 100 ? 'happy' : 'open'} />
          </div>
        </div>
        <div className="stat">
          {n} of {total} lessons done{pct === 100 && <span className="ok-note"> · Purr-fect!</span>}
        </div>
      </div>
    </section>
  );
}

function MissedNotice({ today, done, go }: { today: string; done: Done; go: (t: Tab) => void }) {
  const n = missedDays(today, done).reduce((a, x) => a + x.lessons.length, 0);
  if (!n) return null;
  return (
    <div className="notice">
      <span>
        {n} lesson{n === 1 ? ' is' : 's are'} waiting in Catch-up.
      </span>
      <button className="pill-btn" onClick={() => go('catchup')}>
        Open Catch-up
      </button>
    </div>
  );
}

/* ---------- the app ---------- */

export default function Den() {
  const { done, status, toggleMany } = useProgress();
  const [today, setToday] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  const [weekStart, setWeekStart] = useState('');
  const [aheadOpen, setAheadOpen] = useState(false);
  const [cheer, setCheer] = useState(false);

  useEffect(() => {
    const t = todayKey();
    setToday(t);
    setWeekStart(mondayOf(t));
    const onVisible = () => {
      if (!document.hidden) setToday(todayKey());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const onToggle: Toggle = (ids, on) => {
    if (today && on) {
      const day = byDate[today];
      if (day) {
        const ls = lessonsOf(day);
        const before = ls.every((l) => done.has(l.id));
        const after = ls.every((l) => done.has(l.id) || ids.includes(l.id));
        if (after && !before) {
          setCheer(true);
          window.setTimeout(() => setCheer(false), 2500);
        }
      }
    }
    toggleMany(ids, on);
  };
  const markDay = (day: Day) => onToggle(lessonsOf(day).filter((l) => !done.has(l.id)).map((l) => l.id), true);

  const missedCount = today ? missedDays(today, done).reduce((a, x) => a + x.lessons.length, 0) : 0;

  return (
    <div className="wrap">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <symbol id="paw" viewBox="0 0 24 24">
            <ellipse cx="5.2" cy="11" rx="2.2" ry="2.9" transform="rotate(-18 5.2 11)" />
            <ellipse cx="9.6" cy="6.2" rx="2.2" ry="3" transform="rotate(-6 9.6 6.2)" />
            <ellipse cx="14.4" cy="6.2" rx="2.2" ry="3" transform="rotate(6 14.4 6.2)" />
            <ellipse cx="18.8" cy="11" rx="2.2" ry="2.9" transform="rotate(18 18.8 11)" />
            <path d="M12 12.2c-3.6 0-6.4 3.1-6.4 5.6 0 2 1.7 2.8 3.4 2.6 1.1-.1 1.9-.5 3-.5s1.9.4 3 .5c1.7.2 3.4-.6 3.4-2.6 0-2.5-2.8-5.6-6.4-5.6z" />
          </symbol>
        </defs>
      </svg>

      <div className="top">
        <div className="brand">
          <Cat mood="open" />
          <div>
            <h1>Sage&apos;s Lesson Den</h1>
            <div className="date">{today ? fmt(today, { ...LONG, year: 'numeric' }) : ' '}</div>
          </div>
        </div>
        <div className="tabs" role="tablist" aria-label="Views">
          {(['today', 'catchup', 'week'] as Tab[]).map((t) => (
            <button key={t} className="tab" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t === 'today' ? 'Today' : t === 'catchup' ? 'Catch-up' : 'Week'}
              {t === 'catchup' && missedCount > 0 && <span className="badge">{missedCount}</span>}
            </button>
          ))}
        </div>
      </div>

      <main aria-live="polite">
        {today && tab === 'today' && <TodayView today={today} done={done} onToggle={onToggle} go={setTab} cheer={cheer} aheadOpen={aheadOpen} setAheadOpen={setAheadOpen} />}
        {today && tab === 'catchup' && <CatchupView today={today} done={done} onToggle={onToggle} markDay={markDay} />}
        {today && tab === 'week' && (
          <WeekView today={today} weekStart={weekStart} setWeekStart={setWeekStart} done={done} onToggle={onToggle} markDay={markDay} />
        )}
      </main>

      <div className="foot">
        <span>{syncNote(status)}</span>
        <span>
          Open IXL:{' '}
          <a href="https://www.ixl.com/math/skill-plans/arizona-mathematics-standards-grade-4" target="_blank" rel="noopener noreferrer">
            Math skill plan
          </a>{' '}
          ·{' '}
          <a href="https://www.ixl.com/ela/skill-plans/arizona-english-language-arts-standards-grade-4" target="_blank" rel="noopener noreferrer">
            Language Arts skill plan
          </a>
        </span>
      </div>
    </div>
  );
}

/* ---------- views ---------- */

function TodayView(props: {
  today: string;
  done: Done;
  onToggle: Toggle;
  go: (t: Tab) => void;
  cheer: boolean;
  aheadOpen: boolean;
  setAheadOpen: (v: boolean) => void;
}) {
  const { today, done, onToggle, go, cheer, aheadOpen, setAheadOpen } = props;
  const day = byDate[today];

  if (day) {
    const c = countsFor(day, done);
    const all = c.n === c.total;
    const mood: Mood = all ? 'happy' : c.n === 0 ? 'sleepy' : 'open';
    const nx = nextDayAfter(today, false);
    const nc = nx ? countsFor(nx, done) : null;
    return (
      <>
        <Hero
          title={greeting()}
          sub={`Day ${day.n} of ${DAYS.length} · ${fmt(today, LONG)}`}
          n={c.n}
          total={c.total}
          mood={mood}
          cheer={cheer && all}
        />
        <MissedNotice today={today} done={done} go={go} />
        <DaySections day={day} done={done} onToggle={onToggle} />
        {nx && nc && (
          <details className="ahead" open={aheadOpen} onToggle={(e) => setAheadOpen((e.currentTarget as HTMLDetailsElement).open)}>
            <summary>
              Work ahead: {fmt(nx.d)} · {nc.n} of {nc.total} done
            </summary>
            <DaySections day={nx} done={done} onToggle={onToggle} />
          </details>
        )}
      </>
    );
  }

  const nx = nextDayAfter(today, true);
  if (!nx) {
    return (
      <>
        <div className="empty">
          <Cat mood="happy" />
          <h2>Every planned lesson is on the calendar</h2>
          <span>Check the Catch-up tab for anything left over.</span>
        </div>
        <MissedNotice today={today} done={done} go={go} />
      </>
    );
  }
  const c = countsFor(nx, done);
  return (
    <>
      <div className="empty">
        <Cat mood="sleepy" />
        <h2>No lessons today</h2>
        <span>
          {offLabel(today)}. Next up: {fmt(nx.d, LONG)}.
        </span>
      </div>
      <MissedNotice today={today} done={done} go={go} />
      <div className="dayhead">
        <h2>Coming up: {fmt(nx.d)}</h2>
        <span className="meta">
          {c.n} of {c.total} done
        </span>
      </div>
      <DaySections day={nx} done={done} onToggle={onToggle} />
    </>
  );
}

function CatchupView(props: { today: string; done: Done; onToggle: Toggle; markDay: (d: Day) => void }) {
  const { today, done, onToggle, markDay } = props;
  const m = missedDays(today, done);
  if (!m.length) {
    return (
      <div className="empty">
        <Cat mood="happy" />
        <h2>Nothing to catch up on</h2>
        <span>Every lesson before today is checked off.</span>
      </div>
    );
  }
  const total = m.reduce((a, x) => a + x.lessons.length, 0);
  return (
    <>
      <section className="hero">
        <div className="mascot">
          <Cat mood="open" />
        </div>
        <div>
          <h2>Catch-up</h2>
          <div className="sub">
            {total} lesson{total === 1 ? '' : 's'} from earlier days. Oldest first.
          </div>
        </div>
      </section>
      {m.map((x) => (
        <div key={x.day.d}>
          <div className="dayhead">
            <h2>{fmt(x.day.d, LONG)}</h2>
            <span className="meta">
              {x.lessons.length} left{' '}
              <button className="linklike" onClick={() => markDay(x.day)}>
                Mark all done
              </button>
            </span>
          </div>
          <DaySections day={x.day} done={done} onToggle={onToggle} onlyOpen />
        </div>
      ))}
    </>
  );
}

function WeekView(props: {
  today: string;
  weekStart: string;
  setWeekStart: (k: string) => void;
  done: Done;
  onToggle: Toggle;
  markDay: (d: Day) => void;
}) {
  const { today, weekStart, setWeekStart, done, onToggle, markDay } = props;
  const keys = [0, 1, 2, 3, 4].map((i) => addDays(weekStart, i));
  let total = 0;
  let n = 0;
  keys.forEach((k) => {
    const d = byDate[k];
    if (d) {
      const c = countsFor(d, done);
      total += c.total;
      n += c.n;
    }
  });
  const pct = total ? Math.round((100 * n) / total) : 0;

  return (
    <>
      <div className="weekbar">
        <h2>
          {fmt(keys[0], MD)} to {fmt(keys[4], MD)}
        </h2>
        <div className="nav">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
            Back
          </button>
          <button onClick={() => setWeekStart(mondayOf(today))}>This week</button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
            Next
          </button>
        </div>
      </div>

      <section className="hero">
        <div className="mascot">
          <Cat mood={total && n === total ? 'happy' : 'open'} />
        </div>
        <div>
          <h2>This week&apos;s plan</h2>
          <div className="sub">{total ? 'Check off extras any time to get ahead.' : 'No lessons this week.'}</div>
          {total > 0 && (
            <>
              <div className="bar">
                <div className="fill" style={{ width: pct + '%' }} />
              </div>
              <div className="stat">
                {n} of {total} lessons done
              </div>
            </>
          )}
        </div>
      </section>

      <div className="weekgrid">
        {keys.map((k) => {
          const d = byDate[k];
          const isToday = k === today;
          if (!d) {
            return (
              <section key={k} className={'daycard off' + (isToday ? ' today' : '')}>
                <header>
                  <h3>{fmt(k)}</h3>
                </header>
                <div>{offLabel(k)}</div>
              </section>
            );
          }
          const c = countsFor(d, done);
          const ls = lessonsOf(d);
          const mth = ls.filter((l) => l.subj === 'Math');
          const ela = ls.filter((l) => l.subj === 'ELA');
          let tag: React.ReactNode = null;
          if (c.n === c.total) tag = <span className="tag done">Done</span>;
          else if (k < today) tag = <span className="tag missed">{c.total - c.n} missed</span>;
          else if (isToday) tag = <span className="tag today">Today</span>;
          return (
            <section key={k} className={'daycard' + (isToday ? ' today' : '')}>
              <header>
                <h3>{fmt(k)}</h3>
                <span>
                  {tag} <span className="meta">{c.n}/{c.total}</span>
                </span>
              </header>
              <div className="sublabel math">Math · {focusOf(mth)}</div>
              {mth.map((l) => (
                <LessonRow key={l.id} l={l} done={done} onToggle={onToggle} />
              ))}
              <div className="sublabel ela">Language Arts · {focusOf(ela)}</div>
              {ela.map((l) => (
                <LessonRow key={l.id} l={l} done={done} onToggle={onToggle} />
              ))}
              <footer>
                {c.n < c.total && (
                  <button className="linklike" onClick={() => markDay(d)}>
                    Mark all done
                  </button>
                )}
              </footer>
            </section>
          );
        })}
      </div>
    </>
  );
}
