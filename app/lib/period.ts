export type Period = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export const PERIOD_LABEL: Record<Period, string> = {
  today: 'Hoje',
  week: 'Semana',
  month: 'Mês',
  quarter: 'Trimestre',
  year: 'Ano',
  all: 'Tudo',
};

export const PERIODS: Period[] = ['today', 'week', 'month', 'quarter', 'year', 'all'];

export function periodRange(p: Period): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (p === 'week') {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
  } else if (p === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (p === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), q * 3, 1);
  } else if (p === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
  } else if (p === 'all') {
    start = new Date(2000, 0, 1);
  }

  return { start, end };
}

export function inPeriod(dateString: string, p: Period): boolean {
  const d = new Date(`${dateString}T12:00:00`);
  const { start, end } = periodRange(p);
  return d >= start && d <= end;
}
