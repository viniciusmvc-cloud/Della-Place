export type AvailableDate = {
  date: string;
  capacity: number;
  startHour: string;
  notes?: string;
  flavorIds?: string[];
};

export const DEFAULT_START_HOUR = '18:00';
export const DEFAULT_CAPACITY = 8;

export function parseStartHour(s: string | null | undefined): string {
  if (!s) return DEFAULT_START_HOUR;
  const m = /^(\d{1,2}):(\d{2})/.exec(s.trim());
  if (!m) return DEFAULT_START_HOUR;
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

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
