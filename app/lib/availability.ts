export type AvailableDate = {
  date: string;
  capacity: number;
  startHour: string;
  notes?: string;
  flavorIds?: string[];
  /** ISO datetime; após esse instante, pedidos novos para essa data são bloqueados. */
  orderDeadlineAt?: string | null;
};

/**
 * Gera os horários disponíveis pra reserva num dia de produção.
 *
 * - Começa em `startHour` (default 18:00), em incrementos de 15 min.
 * - Se `capacity` informada: gera EXATAMENTE `capacity` slots (1 por pizza).
 *   Ex: start=18:00, capacity=8 → ['18:00', '18:15', ..., '19:45'].
 *   Último horário disponível é 18:00 + (capacity - 1) × 15 min.
 * - Sem capacity: comportamento legado — vai do start até 23:00.
 *
 * Hard cap em 23:00 mesmo com capacity alta (Aurélio não produz tarde).
 */
export function generateSlots(startHour: string, capacity?: number): string[] {
  const m = /^(\d{1,2}):(\d{2})/.exec(startHour);
  const startH = m ? Math.max(0, Math.min(22, parseInt(m[1], 10))) : 18;
  const startM = m ? Math.max(0, Math.min(45, parseInt(m[2], 10))) : 0;
  const out: string[] = [];
  let h = startH;
  let mm = startM - (startM % 15);
  const maxSlots = capacity && capacity > 0 ? capacity : 999;
  while (h < 23 && out.length < maxSlots) {
    out.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
    mm += 15;
    if (mm >= 60) {
      mm = 0;
      h += 1;
    }
  }
  return out;
}

/**
 * Retorna true se a data ainda aceita pedidos novos.
 * - Se não há entrada de disponibilidade, retorna false.
 * - Se há entrada mas sem deadline, retorna true (aberta indefinidamente).
 * - Se há deadline, compara com `now`.
 */
export function isAcceptingOrders(
  config: AvailableDate | undefined,
  now: Date = new Date(),
): boolean {
  if (!config) return false;
  if (!config.orderDeadlineAt) return true;
  return now.getTime() < new Date(config.orderDeadlineAt).getTime();
}

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
