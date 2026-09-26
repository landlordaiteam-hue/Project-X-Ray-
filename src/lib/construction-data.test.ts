import { describe, expect, it } from 'vitest';
import { calculateEstimateLine, calculateEstimateTotal } from './construction-data';

describe('construction data calculations', () => {
  it('calculates deterministic estimate lines and totals', () => {
    const line = calculateEstimateLine({ description: 'Concrete', quantity: 10, unit: 'cy', unitCost: 100, materialCost: 25 });
    expect(line.laborCost).toBe(1000);
    expect(line.lineTotal).toBe(1025);
    expect(calculateEstimateTotal([{ description: 'Concrete', quantity: 10, unit: 'cy', unitCost: 100, materialCost: 25 }], 10, 50, 25).total).toBe(1202.5);
  });
});
