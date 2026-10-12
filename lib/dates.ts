import { FIRST, LAST } from './schedule';

const pad = (n: number) => String(n).padStart(2, '0');

export const keyOf = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

export const parse = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (k: string, n: number) => {
  const dt = parse(k);
  dt.setDate(dt.getDate() + n);
  return keyOf(dt);
};

const SHORT: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
export const fmt = (k: string, o: Intl.DateTimeFormatOptions = SHORT) => parse(k).toLocaleDateString('en-US', o);

export const todayKey = () => keyOf(new Date());

/** Monday of the week containing k. Saturday and Sunday roll forward to the next Monday. */
export function mondayOf(k: string) {
  const dt = parse(k);
  const wd = dt.getDay();
  if (wd === 6) dt.setDate(dt.getDate() + 2);
  else if (wd === 0) dt.setDate(dt.getDate() + 1);
  else dt.setDate(dt.getDate() - (wd - 1));
  return keyOf(dt);
}

export function offLabel(k: string) {
  if (k === '2026-11-11') return 'Veterans Day';
  if (k >= '2026-11-25' && k <= '2027-01-03') return 'Winter break';
  if (k === '2027-01-18') return 'MLK Day';
  if (k === '2027-02-15') return 'Presidents Day';
  if (k >= '2027-03-08' && k <= '2027-03-12') return 'Spring break';
  if (k === '2027-03-26') return 'Spring holiday';
  if (k === '2027-05-31') return 'Memorial Day';
  if (k < FIRST) return 'Starts ' + fmt(FIRST);
  if (k > LAST) return 'All lessons planned';
  return 'No lessons';
}
