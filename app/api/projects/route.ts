import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { runQuery, withTenant } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
const schema=z.object({name:z.string().min(2).max(200),code:z.string().min(2).max(80),status:z.enum(['planning','active','on_hold','complete']).default('planning')});
export async function GET(request:NextRequest){const user=await currentUser(request);if(!user)return unauthorized();if(!hasPermission(user.permissions,'project.read'))return forbidden();const result=await withTenant(user.organizationId,c=>c.query('SELECT id,organization_id,name,code,status,created_at FROM projects ORDER BY created_at DESC'));return NextResponse.json({ok:true,projects:result.rows});}
export async function POST(request:NextRequest){const user=await currentUser(request);if(!user)return unauthorized();if(!hasPermission(user.permissions,'project.write'))return forbidden();try{const input=schema.parse(await request.json());const project=await withTenant(user.organizationId,async c=>(await c.query('INSERT INTO projects(organization_id,name,code,status) VALUES($1,$2,$3,$4) RETURNING *',[user.organizationId,input.name,input.code,input.status])).rows[0]);await logAudit({organizationId:user.organizationId,userId:user.sub,action:'project.create',entityType:'project',entityId:project.id,details:{code:project.code},source:'api.projects'});return NextResponse.json({ok:true,project},{status:201});}catch{return NextResponse.json({ok:false,error:{code:'invalid_request',message:'Invalid project request'}},{status:400});}}
