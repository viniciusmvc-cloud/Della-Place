export type AvailableDate = {
  date: string;
  capacity: number;
  notes?: string;
};

const KEY = 'della-pace.availability.v1';

export function loadAvailability(): AvailableDate[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as AvailableDate[];
  } catch {
    return [];
  }
}

export function saveAvailability(list: AvailableDate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function isDateOpen(date: string): boolean {
  return loadAvailability().some((a) => a.date === date);
}

export function getDateConfig(date: string): AvailableDate | undefined {
  return loadAvailability().find((a) => a.date === date);
}
