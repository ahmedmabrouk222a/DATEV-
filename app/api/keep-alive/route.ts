import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ status: 'no-supabase-configured', timestamp: new Date().toISOString() });
  }

  try {
    const res = await fetch(`${url}/rest/v1/workspaces?select=username&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    return NextResponse.json({
      status: res.ok ? 'ok' : 'error',
      httpStatus: res.status,
      timestamp: new Date().toISOString(),
    });
  } catch (e: unknown) {
    return NextResponse.json({
      status: 'error',
      message: e instanceof Error ? e.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
