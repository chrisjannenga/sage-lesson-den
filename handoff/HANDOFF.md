# Sage's Lesson Den: handoff to Claude Code

Paste the "Prompt for Claude Code" section below into a Claude Code session opened at the root of the sage-den repo, after copying this folder into the repo (e.g. `handoff/`).

---

## Prompt for Claude Code

You are updating an existing Next.js app, **Sage's Lesson Den**, a cat-themed daily lesson tracker for one homeschool student (4th grade). Read `handoff/HANDOFF.md` fully first, then do the work in "Tasks". Keep the existing cat theme, tokens and component structure; this is an extension, not a redesign.

### Where the repo was (before)
- Next.js 16 App Router, React 19, TypeScript, `@upstash/redis`, deployed on Vercel. Single user, no sign-in.
- Plan: 450 unique IXL lessons (250 Math, 200 ELA) from Oct 13, 2026 to Mar 5, 2027, about 7/day Mon/Tue/Fri and 5/day Wed/Thu.
- Data: `lib/schedule.json` is an array of days `{ d, n, w, m: [[code,name,cat]], e: [[code,name,cat]] }`.
- `lib/schedule.ts` exports `DAYS`, `byDate`, `lessonsOf(day)`, `ALL_IDS`, `focusOf`, `lid(subj, code)` (`m-<code>` / `e-<code>`).
- `lib/dates.ts` has `offLabel(k)` with hard-coded off-day names (winter break Nov 25 to Jan 3, etc.).
- API: `app/api/progress/route.ts`. `GET` returns `{ done: string[] }`; `POST { ops: [{ id, on }] }`. It rejects any id not in `ALL_IDS`. `lib/store.ts` uses Upstash Redis (set of done ids) with a `.data/done.json` fallback in dev. `lib/useProgress.ts` does optimistic updates with an offline queue.
- UI: `components/Den.tsx` (Today / Catch-up / Week tabs, subject sections, check-off rows, "Mark all done", work-ahead), `components/Cat.tsx` (mascot SVG).

### Where it is now (after)
1. **Calendar is now the Mesa Public Schools 2026-27 calendar.** School days run **Mon Nov 23, 2026 to Thu May 27, 2027 = 112 days**. No school: Nov 11, Nov 25-27 (Thanksgiving), **Dec 18 to Jan 1 (winter break, school resumes Mon Jan 4)**, Jan 18 (MLK), Feb 15 (Presidents Day), Mar 8-12 (spring break), Mar 26 (spring holiday), May 31 (Memorial Day). Early-release and professional-learning days count as school days.
2. **Only unfinished lessons are scheduled.** Sage's IXL account on Nov 22, 2026 showed 64 math and 48 ELA skills complete (score + gold medal), so the plan contains **186 math + 152 ELA** remaining.
3. **Two new subjects woven in:** **Science** (19 skills, IXL Arizona Grade 4 science plan) and **Social Studies** (123 skills, the general IXL Grade 4 social studies list; IXL has no Arizona plan for it and 1 of 124 was already done). Total **480 lessons, about 4.3 per school day** (about 5 on Mon/Tue/Fri, 3-4 on Wed/Thu). Each subject is consumed in IXL category order, categories kept contiguous.
4. **Reading & Writing items** per school day, in a fifth section:
   - **Daily:** "Read your Warrior Cats book for 30 minutes" (every school day, 112).
   - **Weekly writing:** on the last school day of each week (24), a rotating book-report prompt (retell, character wants, predict next, favorite scene, new word, compare two cats, a character's choice, setting).
   - **Monthly book report:** last school day of Dec, Jan, Feb, Mar, Apr, May (Dec 17, Jan 29, Feb 26, Mar 31, Apr 30, May 27). November is skipped.
5. New data shape (see `data/schedule.json`): each day `{ d, n, w, m, e, s, h, r }`. `m/e/s/h` are `[code, name, category][]`. `r` is `[id, text, tag][]` where tag is `Daily reading`, `Weekly writing` or `Monthly book report`.

### Id scheme (important: existing check-offs live in Redis)
- Keep `m-<code>` and `e-<code>` exactly as is, so progress already saved stays valid.
- New: `s-<code>` (science, IXL permacode), `h-<slug>` (social studies, IXL URL slug).
- Reading & writing ids are taken **verbatim** from `r[i][0]`: `read-YYYY-MM-DD`, `write-YYYY-MM-DD`, `report-YYYY-MM`. They have **no** prefix added.
- `ALL_IDS` must include every id above (build it from all of `m,e,s,h,r`) so the API keeps accepting them.

### Tasks
1. Replace `lib/schedule.json` with `handoff/data/schedule.json`. Update the `Day` type in `lib/schedule.ts` to add `s`, `h`, `r` (`r` rows are `[id, text, tag]`). Extend `Subject` to `'Math' | 'ELA' | 'Science' | 'Social' | 'Read'`.
2. Rewrite `lessonsOf` to emit lessons from all five keys using the id scheme above, and rebuild `ALL_IDS` from it. Add a `SUBJECTS` table (key, subj, id prefix, section title, css class) so views loop over subjects instead of hard-coding Math/ELA.
3. Update `offLabel` in `lib/dates.ts` to the Mesa calendar names: Veterans Day, Thanksgiving break (Nov 25-27), Winter break (Dec 18 to Jan 1), MLK Day, Presidents Day, Spring break, Spring holiday, Memorial Day; before first day "Starts ...", after last day "School year complete", otherwise "No school".
4. Update `components/Den.tsx`: sections for Math, Language Arts, Science, Social Studies, and Reading & Writing (no category focus line for Reading & Writing). The week view and Today view both use the same loop. Row sub-label: `IXL <code>` for math/ELA/science, `IXL social studies` for social studies, and the task tag for reading/writing. Change hero copy "lessons done" to "checked off". Add footer links to the IXL science plan (`https://www.ixl.com/science/skill-plans/arizona-science-standards-grade-4`) and the social studies page (`https://www.ixl.com/social-studies/grade-4`).
5. Add theme tokens in `app/globals.css`, light and dark (dark applies for `prefers-color-scheme: dark` unless `data-theme="light"`, and for `data-theme="dark"`):
   - science: `--sci #0B6E78`, `--sci-soft #D6F0F2` (dark `#6FD6DF` / `#1B4448`)
   - social: `--soc #8A5200`, `--soc-soft #FBE9C6` (dark `#F2C26B` / `#4A3A18`)
   - reading: `--read #6A3FA3`, `--read-soft #EADCF9` (dark `#C9A6F5` / `#3E2D5E`)
   plus `.subj.sci/.soc/.read h3` and `.sublabel.*` rules like the existing math/ela ones.
6. Confirm the catch-up badge, "Mark all done", work-ahead block, and the optimistic sync/offline queue all work with the new ids (no code assumes only two subjects).
7. Update `README.md` (data shape, id scheme, calendar, how to regenerate) and `package.json` only if needed.
8. Verify: `npm run build` passes; `npm run dev` then `curl` `GET /api/progress` and `POST` one id of each kind (`m-`, `s-`, `h-`, `read-`, `write-`, `report-`) and confirm a bogus id is rejected; screenshot Today for a Friday with all five sections (the reference `reference/today-screenshot.png` shows the target, e.g. Fri Feb 26, 2027 with a monthly report).
9. Optional but useful: a small script `scripts/regenerate.py` already exists in `handoff/scripts/build2.py`; keep it so the plan can be re-spread when Sage falls behind again (re-scrape IXL completion, update `done_*.txt`, rerun).

### Reference files in this folder
- `data/schedule.json`: the finished 112-day schedule (drop-in for `lib/schedule.json`).
- `reference/lesson-den-artifact.html`: a **working single-file version of the exact UI** (rendering logic, CSS, copy, SUBJ table). Port its `SUBJ`, `lessonsOf`, `codeLabel`, `subjectSection`, `daySections` and week-card logic into `Den.tsx`. Its storage layer differs (claude.ai db) so do not copy that part.
- `reference/today-screenshot.png`: target look.
- `data/lessons.json`, `data/lessons_raw.txt`: all 450 math/ELA lessons with codes and IXL categories; `data/ss_raw.txt`, `data/sci_raw.txt`: social studies and science lists; `data/done_math.txt`, `data/done_ela.txt`: completed IXL codes as of Nov 22, 2026.
- `scripts/build2.py` (+ `schedule_old.py`, which holds the IXL category order lists): regenerates `data/schedule.json`. Run from `handoff/scripts/`. Weights: Mon/Tue/Fri = 10, Wed/Thu = 7; per-day totals by cumulative rounding; subject chosen by largest deficit so subjects are spread evenly.

### Constraints
- Single user, no auth. Keep the Upstash Redis + file-fallback store.
- Don't commit secrets. Don't rename existing ids. Keep accessibility (labels, focus rings, keyboard checkboxes) as in the current components.
