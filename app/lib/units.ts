export const UNIT_FAMILY: Record<string, 'weight' | 'volume' | 'count'> = {
  g: 'weight',
  kg: 'weight',
  ml: 'volume',
  L: 'volume',
  un: 'count',
  cx: 'count',
  pct: 'count',
};

export const UNIT_FACTOR: Record<string, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  L: 1000,
  un: 1,
  cx: 1,
  pct: 1,
};

export const ALL_UNITS = ['g', 'kg', 'ml', 'L', 'un', 'cx', 'pct'];

export const RECIPE_UNITS = ['g', 'kg', 'ml', 'L', 'un'];

export function isCompatible(unitA: string, unitB: string): boolean {
  return UNIT_FAMILY[unitA] && UNIT_FAMILY[unitA] === UNIT_FAMILY[unitB];
}

export function convertAmount(
  amount: number,
  fromUnit: string,
  toUnit: string,
): number {
  if (!isCompatible(fromUnit, toUnit)) return 0;
  return (amount * UNIT_FACTOR[fromUnit]) / UNIT_FACTOR[toUnit];
}
