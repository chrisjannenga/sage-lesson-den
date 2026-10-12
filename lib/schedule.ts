import raw from './schedule.json';

export type Row = [code: string, name: string, category: string];
export type Day = { d: string; n: number; w: string; m: Row[]; e: Row[] };
export type Subject = 'Math' | 'ELA';
export type Lesson = { id: string; subj: Subject; code: string; name: string; cat: string };

export const DAYS = raw as Day[];
export const FIRST = DAYS[0].d;
export const LAST = DAYS[DAYS.length - 1].d;

export const byDate: Record<string, Day> = {};
DAYS.forEach((d) => {
  byDate[d.d] = d;
});

export const lid = (subj: Subject, code: string) => (subj === 'Math' ? 'm-' : 'e-') + code;

export function lessonsOf(day: Day): Lesson[] {
  return [
    ...day.m.map((x) => ({ id: lid('Math', x[0]), subj: 'Math' as const, code: x[0], name: x[1], cat: x[2] })),
    ...day.e.map((x) => ({ id: lid('ELA', x[0]), subj: 'ELA' as const, code: x[0], name: x[1], cat: x[2] })),
  ];
}

/** Every valid lesson id, used by the API to reject anything else. */
export const ALL_IDS: Set<string> = new Set(DAYS.flatMap((d) => lessonsOf(d).map((l) => l.id)));

export function focusOf(ls: Lesson[]): string {
  const seen: string[] = [];
  ls.forEach((l) => {
    if (!seen.includes(l.cat)) seen.push(l.cat);
  });
  return seen.join(' · ');
}
