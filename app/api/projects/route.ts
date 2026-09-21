import { NextResponse } from 'next/server';
import { getProjectList } from '@/lib/project-data';

export async function GET() {
  return NextResponse.json({ ok: true, projects: getProjectList() });
}
