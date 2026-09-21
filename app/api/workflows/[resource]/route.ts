import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { createBid, createChangeOrder, createComplianceItem, createDrawApplication, createPurchaseOrder, createRfi, createSchedule, createSubmittal } from '@/lib/workflow-data';

const schemas = {
  bids: z.object({ title: z.string().min(2), customerId: z.string().uuid().optional(), projectId: z.string().uuid().optional(), estimateId: z.string().uuid().optional(), scope: z.string().optional(), bidDate: z.string().optional(), dueDate: z.string().optional() }),
  purchaseOrders: z.object({ projectId: z.string().uuid(), vendorId: z.string().uuid(), poNumber: z.string().min(1), lines: z.array(z.object({ materialItemId: z.string().uuid().optional(), costCodeId: z.string().uuid().optional(), description: z.string().min(1), quantity: z.number().nonnegative(), unit: z.string().min(1), unitPrice: z.number().nonnegative() })).min(1) }),
  schedules: z.object({ projectId: z.string().uuid(), name: z.string().min(2), calloutHoursBeforeStart: z.number().nonnegative().optional() }),
  rfis: z.object({ projectId: z.string().uuid(), subject: z.string().min(2), question: z.string().min(2), requesterId: z.string().uuid().optional(), assigneeId: z.string().uuid().optional(), priority: z.enum(['low','normal','high','critical']).optional(), dueDate: z.string().optional() }),
  submittals: z.object({ projectId: z.string().uuid(), title: z.string().min(2), specificationReference: z.string().optional(), responsiblePartyId: z.string().uuid().optional(), dueDate: z.string().optional() }),
  changeOrders: z.object({ projectId: z.string().uuid(), contractId: z.string().uuid().optional(), reason: z.string().min(2), description: z.string().min(2), requestedAmount: z.number().nonnegative(), costImpact: z.number().optional(), scheduleImpactDays: z.number().int().optional() }),
  draws: z.object({ projectId: z.string().uuid(), contractId: z.string().uuid(), scheduledValue: z.number().nonnegative(), previousCompletedWork: z.number().nonnegative(), currentWork: z.number().nonnegative(), storedMaterials: z.number().nonnegative(), retainagePercent: z.number().min(0).max(100), changeOrderAmount: z.number().optional() }),
  compliance: z.object({ projectId: z.string().uuid(), requirement: z.string().min(2), dueDate: z.string().optional(), responsiblePartyId: z.string().uuid().optional(), evidenceDocumentId: z.string().uuid().optional() })
} as const;

type Resource = keyof typeof schemas;
const permissions: Record<Resource, string> = { bids: 'project.write', purchaseOrders: 'project.write', schedules: 'project.write', rfis: 'project.write', submittals: 'project.write', changeOrders: 'project.write', draws: 'project.write', compliance: 'project.write' };

export async function POST(request: NextRequest, { params }: { params: { resource: string } }) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const resource = params.resource as Resource;
  if (!(resource in schemas)) return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Workflow resource not found' } }, { status: 404 });
  if (!hasPermission(user.permissions, permissions[resource])) return forbidden();
  try {
    const input = schemas[resource].parse(await request.json());
    const actor = user.sub;
    const result = resource === 'bids' ? await createBid(user.organizationId, actor, input) : resource === 'purchaseOrders' ? await createPurchaseOrder(user.organizationId, actor, input) : resource === 'schedules' ? await createSchedule(user.organizationId, actor, input) : resource === 'rfis' ? await createRfi(user.organizationId, actor, input) : resource === 'submittals' ? await createSubmittal(user.organizationId, actor, input) : resource === 'changeOrders' ? await createChangeOrder(user.organizationId, actor, input) : resource === 'draws' ? await createDrawApplication(user.organizationId, actor, input) : await createComplianceItem(user.organizationId, actor, input);
    return NextResponse.json({ ok: true, resource, result }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: `Unable to create ${resource}` } }, { status: 400 });
  }
}
