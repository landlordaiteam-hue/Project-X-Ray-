import { NextResponse } from 'next/server';
export function GET() { return NextResponse.json({ ok: true, status: 'ready', app: 'Capital X-RAY' }); }
