import { describe, expect, it } from 'vitest';
import { formatMGA, formatNumber } from './format';

// Intl insère des espaces insécables fines : on normalise pour comparer.
const plain = (s: string) => s.replace(/\s/g, ' ');

describe('format', () => {
  it('sépare les milliers à la française', () => {
    expect(plain(formatNumber(425000))).toBe('425 000');
  });

  it('ajoute le sigle MGA', () => {
    expect(plain(formatMGA(1500))).toBe('1 500 MGA');
  });
});
