import { Redis } from '@upstash/redis';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Where check-offs live.
 *  - On Vercel: an Upstash Redis set. The Vercel Upstash integration provides
 *    KV_REST_API_URL / KV_REST_API_TOKEN; a manual Upstash setup uses
 *    UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Either works.
 *  - On your own computer (npm run dev) with no Redis configured: a small JSON file in .data/
 */
const KEY = 'sage-den:done';

export type Op = { id: string; on: boolean };

let client: Redis | null | undefined;
function redis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

const FILE = path.join(process.cwd(), '.data', 'done.json');
let fileLock: Promise<unknown> = Promise.resolve();

async function readFile(): Promise<string[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as string[];
  } catch {
    return [];
  }
}

function localAllowed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Storage is not set up yet. Connect an Upstash Redis database to this project and redeploy.');
  }
}

export async function getDone(): Promise<string[]> {
  const r = redis();
  if (r) return (await r.smembers<string[]>(KEY)) ?? [];
  localAllowed();
  return readFile();
}

export async function applyOps(ops: Op[]): Promise<string[]> {
  const add = ops.filter((o) => o.on).map((o) => o.id);
  const del = ops.filter((o) => !o.on).map((o) => o.id);
  const r = redis();
  if (r) {
    if (add.length) await r.sadd(KEY, add[0], ...add.slice(1));
    if (del.length) await r.srem(KEY, ...del);
    return (await r.smembers<string[]>(KEY)) ?? [];
  }
  localAllowed();
  const run = fileLock.then(async () => {
    const set = new Set(await readFile());
    add.forEach((id) => set.add(id));
    del.forEach((id) => set.delete(id));
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const out = [...set];
    await fs.writeFile(FILE, JSON.stringify(out));
    return out;
  });
  fileLock = run.catch(() => undefined);
  return run;
}
