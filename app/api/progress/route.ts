import { NextResponse } from 'next/server';
import { ALL_IDS } from '@/lib/schedule';
import { applyOps, getDone, type Op } from '@/lib/store';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store' };

function fail(e: unknown) {
  const message = e instanceof Error ? e.message : 'Could not reach storage.';
  return NextResponse.json({ error: message }, { status: 503, headers: NO_STORE });
}

export async function GET() {
  try {
    return NextResponse.json({ done: await getDone() }, { headers: NO_STORE });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400, headers: NO_STORE });
  }
  const ops = (body as { ops?: unknown })?.ops;
  if (!Array.isArray(ops) || ops.length === 0 || ops.length > 500) {
    return NextResponse.json({ error: 'Send between 1 and 500 changes.' }, { status: 400, headers: NO_STORE });
  }
  const clean: Op[] = [];
  for (const o of ops) {
    const id = (o as Op)?.id;
    const on = (o as Op)?.on;
    if (typeof id !== 'string' || typeof on !== 'boolean' || !ALL_IDS.has(id)) {
      return NextResponse.json({ error: 'Unknown lesson.' }, { status: 400, headers: NO_STORE });
    }
    clean.push({ id, on });
  }
  try {
    return NextResponse.json({ done: await applyOps(clean) }, { headers: NO_STORE });
  } catch (e) {
    return fail(e);
  }
}
