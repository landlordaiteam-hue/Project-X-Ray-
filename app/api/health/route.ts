import { NextResponse } from 'next/server';
import { databaseHealthCheck } from '@/lib/db';
export async function GET() { try { const db = await databaseHealthCheck(); return NextResponse.json({ ok: db.ok, status: db.ok ? 'healthy' : 'unhealthy', database: db, timestamp: new Date().toISOString() }, { status: db.ok ? 200 : 503 }); } catch { return NextResponse.json({ ok:false, status:'unhealthy', database:{ok:false}, timestamp:new Date().toISOString() }, { status:503 }); } }
