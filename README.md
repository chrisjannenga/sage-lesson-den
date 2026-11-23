# Sage's Lesson Den

Sage's 4th grade IXL plan as a Next.js app: a Today view, a Catch-up list, and a Week view, with paw-print check-offs that are saved online so they look the same on the tablet and the MacBook.

- Follows the **Mesa Public Schools 2026-27 calendar**: 112 school days, Mon Nov 23, 2026 to Thu May 27, 2027. No school on Nov 11, Nov 25-27 (Thanksgiving), Dec 18 to Jan 1 (winter break), Jan 18 (MLK), Feb 15 (Presidents Day), Mar 8-12 (spring break), Mar 26 (spring holiday) and May 31 (Memorial Day). Early-release days count as school days.
- Only unfinished IXL skills are planned (as of Nov 22, 2026): 186 math, 152 language arts, 19 science (IXL Arizona Grade 4 science plan) and 123 social studies (IXL Grade 4 social studies). That's 480 lessons, about 4.3 per school day: about 5 on Mon/Tue/Fri and 3-4 on Wed/Thu. Each subject follows IXL's category order.
- A **Reading & Writing** section each day: 30 minutes of the Warrior Cats book every school day, a weekly writing prompt on the last school day of each week, and a monthly book report on the last school day of Dec through May.
- One user, no sign-in. Anyone with the web address can see and tick lessons, so keep the address to yourselves.

## Try it on your computer

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no database connected, check-offs are saved in a small file in `.data/` so you can try everything.

## Put it online (Vercel + Upstash Redis, both free to start)

1. Put this folder in a GitHub repository (new repo, upload or push the files; `node_modules` is already ignored).
2. In Vercel, choose **Add New > Project**, pick the repository, and click **Deploy**. The first deploy works, but check-offs will not save yet.
3. In the Vercel project, open the **Storage** tab, choose **Upstash Redis** (from the Marketplace), create a free database, and connect it to the project. This adds the settings the app reads:
   - `KV_REST_API_URL` and `KV_REST_API_TOKEN` (Vercel's Upstash integration), or
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (if you set Upstash up yourself).
4. **Redeploy** (Deployments tab, the three dots on the latest one, Redeploy) so the app picks up the database.
5. Open the web address on the tablet and the MacBook. Tick a lesson on one and it appears on the other within about 20 seconds, or right away when the page is reopened.

On the tablet, use **Share > Add to Home Screen** to get a Lesson Den icon.

If the page shows "Can't reach the saved list right now" at the bottom, the database is not connected yet (step 3 or 4). Check-offs made meanwhile are kept on that device and sync once it is.

## How saving works

- Ticking a lesson updates the screen right away, then saves to `/api/progress`.
- The saved list is one Redis set (`sage-den:done`) holding ids:
  - `m-<IXL code>` math and `e-<IXL code>` language arts (unchanged from the first plan, so old check-offs still count),
  - `s-<IXL code>` science and `h-<IXL url slug>` social studies,
  - `read-YYYY-MM-DD`, `write-YYYY-MM-DD` and `report-YYYY-MM` for reading and writing (no prefix).
- If the connection drops, changes wait in a small queue on the device and are sent when it returns.
- The API only accepts lesson ids from the plan, so nothing else can be written.

## Changing the plan

The schedule is the data file `lib/schedule.json`, one entry per school day:

```
{ d: "2027-02-26", n: 54, w: "Fri",
  m: [[code, name, category], ...],   // math
  e: [...], s: [...], h: [...],        // language arts, science, social studies
  r: [[id, text, tag], ...] }          // reading & writing; tag is Daily reading / Weekly writing / Monthly book report
```

`lib/schedule.ts` turns each day into lessons using the `SUBJECTS` table (section title, id prefix, colour class), and every view loops over that table. `ALL_IDS` is built from the whole file, so the API accepts exactly the ids in the plan. Check-offs are tied to the id, so lessons that stay in the plan keep their check marks when it is re-spread.

Day-off names shown in the Week view live in `lib/dates.ts` (`offLabel`).

### Re-spreading the plan when Sage falls behind

The generator and its inputs are in `handoff/`:

1. Update `handoff/data/done_math.txt` and `done_ela.txt` (comma-separated IXL codes Sage has finished) from her IXL account, and `SS_DONE` in `handoff/scripts/build2.py` for social studies.
2. Change the start date or calendar in `build2.py` if needed.
3. Run it and copy the result in:

```bash
cd handoff/scripts && python3 build2.py && cp ../data/schedule.json ../../lib/schedule.json
```

Weights are Mon/Tue/Fri = 10 and Wed/Thu = 7. Per-day totals use cumulative rounding, and each slot goes to the subject furthest behind its even share, so all four subjects move along together. `handoff/reference/` has the single-file artifact version of the UI and a screenshot of the target look.
