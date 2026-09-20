import { NextResponse } from 'next/server';
export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
export function errorResponse(error: unknown) { const known = error instanceof ApiError; return NextResponse.json({ ok: false, error: { code: known ? error.code : 'internal_error', message: known ? error.message : 'Internal server error' } }, { status: known ? error.status : 500 }); }
