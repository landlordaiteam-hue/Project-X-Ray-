import { describe, expect, it } from 'vitest';
import { calculateDrawPayment, calculatePurchaseOrderTotal } from './workflow-data';

describe('construction workflow calculations', () => {
  it('calculates purchase order totals deterministically', () => {
    expect(calculatePurchaseOrderTotal([{ quantity: 2, unitPrice: 12.5 }, { quantity: 3, unitPrice: 4 }])).toBe(37);
  });

  it('calculates draw payment and retainage deterministically', () => {
    expect(calculateDrawPayment({ previousCompletedWork: 100, currentWork: 50, storedMaterials: 25, retainagePercent: 10 })).toEqual({ gross: 175, retainage: 17.5, currentPaymentDue: 57.5 });
  });
});
