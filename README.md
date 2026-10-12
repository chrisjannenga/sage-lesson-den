# Sage's Lesson Den

Sage's 4th grade IXL plan as a Next.js app: a Today view, a Catch-up list, and a Week view, with paw-print check-offs that are saved online so they look the same on the tablet and the MacBook.

- 450 lessons (250 math, 200 language arts), in IXL's order, Oct 13, 2026 to Mar 5, 2027.
- About 7 lessons on Mon/Tue/Fri and about 5 on Wed/Thu. Days off follow the plan: Veterans Day, Nov 25 to Jan 3, MLK Day, Presidents Day, spring break (Mar 8-12), Mar 26, Memorial Day.
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
- The saved list is one Redis set (`sage-den:done`) holding lesson ids like `m-GGE` (math) and `e-UB2` (language arts).
- If the connection drops, changes wait in a small queue on the device and are sent when it returns.
- The API only accepts lesson ids from the plan, so nothing else can be written.

## Changing the plan

The schedule is the data file `lib/schedule.json`: one entry per school day with its math and language arts lessons as `[IXL code, lesson name, category]`. Edit or regenerate that file and redeploy. Check-offs are tied to the IXL code, so lessons that stay in the plan keep their check marks.

Day-off names shown in the Week view live in `lib/dates.ts` (`offLabel`).
