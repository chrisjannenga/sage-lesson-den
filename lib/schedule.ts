import raw from './schedule.json';

export type Row = [code: string, name: string, category: string];
/** Reading & writing tasks: [id, text, tag]. The id is used verbatim (no prefix). */
export type TaskRow = [id: string, text: string, tag: string];
export type Day = { d: string; n: number; w: string; m: Row[]; e: Row[]; s: Row[]; h: Row[]; r: TaskRow[] };
export type Subject = 'Math' | 'ELA' | 'Science' | 'Social' | 'Read';
export type Lesson = { id: string; subj: Subject; code: string; name: string; cat: string };

type DayKey = 'm' | 'e' | 's' | 'h' | 'r';
export type SubjectInfo = { key: DayKey; subj: Subject; prefix: string; title: string; cls: string };

/**
 * One entry per section, in display order. Ids are `prefix + code`:
 * m-<IXL code>, e-<IXL code>, s-<IXL code>, h-<IXL url slug>, and reading/writing ids as-is
 * (read-YYYY-MM-DD, write-YYYY-MM-DD, report-YYYY-MM).
 */
export const SUBJECTS: SubjectInfo[] = [
  { key: 'm', subj: 'Math', prefix: 'm-', title: 'Math', cls: 'math' },
  { key: 'e', subj: 'ELA', prefix: 'e-', title: 'Language Arts', cls: 'ela' },
  { key: 's', subj: 'Science', prefix: 's-', title: 'Science', cls: 'sci' },
  { key: 'h', subj: 'Social', prefix: 'h-', title: 'Social Studies', cls: 'soc' },
  { key: 'r', subj: 'Read', prefix: '', title: 'Reading & Writing', cls: 'read' },
];

export const DAYS = raw as Day[];
export const FIRST = DAYS[0].d;
export const LAST = DAYS[DAYS.length - 1].d;

export const byDate: Record<string, Day> = {};
DAYS.forEach((d) => {
  byDate[d.d] = d;
});

const BY_SUBJ = Object.fromEntries(SUBJECTS.map((s) => [s.subj, s])) as Record<Subject, SubjectInfo>;

export const lid = (subj: Subject, code: string) => BY_SUBJ[subj].prefix + code;

export function lessonsOf(day: Day): Lesson[] {
  return SUBJECTS.flatMap((s) =>
    (day[s.key] ?? []).map((x) => ({ id: s.prefix + x[0], subj: s.subj, code: x[0], name: x[1], cat: x[2] })),
  );
}

/** Every valid id (lessons and reading/writing tasks), used by the API to reject anything else. */
export const ALL_IDS: Set<string> = new Set(DAYS.flatMap((d) => lessonsOf(d).map((l) => l.id)));

/** Small line under each row: the IXL code, or the task tag for reading/writing. */
export function codeLabel(l: Lesson): string {
  if (l.subj === 'Social') return 'IXL social studies';
  if (l.subj === 'Read') return l.cat;
  return 'IXL ' + l.code;
}

export function focusOf(ls: Lesson[]): string {
  const seen: string[] = [];
  ls.forEach((l) => {
    if (!seen.includes(l.cat)) seen.push(l.cat);
  });
  return seen.join(' · ');
}
