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
  // Períodos cobrem a unidade INTEIRA (até o fim), pra incluir
  // pedidos futuros do mesmo período. Ex: estamos no dia 09/05; o
  // mês "Maio" deve incluir os domingos futuros até 31/05.
  const now = new Date();

  let start = new Date(now);
  start.setHours(0, 0, 0, 0);

  let end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (p === 'today') {
    // hoje somente — start e end já estão certos
  } else if (p === 'week') {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    end = new Date(start);
    end.setDate(start.getDate() + 6); // sábado
    end.setHours(23, 59, 59, 999);
  } else if (p === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // último dia do mês
    end.setHours(23, 59, 59, 999);
  } else if (p === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), q * 3, 1);
    end = new Date(now.getFullYear(), q * 3 + 3, 0);
    end.setHours(23, 59, 59, 999);
  } else if (p === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
  } else if (p === 'all') {
    start = new Date(2000, 0, 1);
    end = new Date(now.getFullYear() + 10, 11, 31);
  }

  return { start, end };
}

export function inPeriod(dateString: string, p: Period): boolean {
  const d = new Date(`${dateString}T12:00:00`);
  const { start, end } = periodRange(p);
  return d >= start && d <= end;
}
