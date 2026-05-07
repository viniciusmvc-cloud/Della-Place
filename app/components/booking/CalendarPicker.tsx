'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  cn,
  endOfMonth,
  formatDateISO,
  isSameDay,
  startOfDay,
  startOfMonth,
} from '@/lib/utils';

type CalendarPickerProps = {
  availableDates?: Date[];
  selected?: Date | null;
  onSelect?: (date: Date) => void;
  minDate?: Date;
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function CalendarPicker({
  availableDates,
  selected = null,
  onSelect,
  minDate,
}: CalendarPickerProps) {
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));
  const today = startOfDay(new Date());
  const min = minDate ? startOfDay(minDate) : today;

  const availableSet = useMemo(() => {
    if (!availableDates) return null;
    return new Set(availableDates.map((d) => formatDateISO(startOfDay(d))));
  }, [availableDates]);

  const days = useMemo(() => {
    const firstOfMonth = startOfMonth(cursor);
    const lastOfMonth = endOfMonth(cursor);
    const leadingBlanks = firstOfMonth.getDay();
    const result: (Date | null)[] = [];
    for (let i = 0; i < leadingBlanks; i++) result.push(null);
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      result.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    return result;
  }, [cursor]);

  function isDisabled(date: Date): boolean {
    if (date < min) return true;
    if (availableSet && !availableSet.has(formatDateISO(date))) return true;
    return false;
  }

  function goPrev() {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  }
  function goNext() {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Mês anterior"
          className="rounded-md px-2 py-1 text-primary-500 hover:bg-primary-50"
        >
          ‹
        </button>
        <span className="font-medium text-primary-500">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button
          type="button"
          onClick={goNext}
          aria-label="Próximo mês"
          className="rounded-md px-2 py-1 text-primary-500 hover:bg-primary-50"
        >
          ›
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-primary-400">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          if (!date) return <div key={`blank-${idx}`} />;
          const disabled = isDisabled(date);
          const isSelected = selected ? isSameDay(date, selected) : false;
          const isToday = isSameDay(date, today);

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(date)}
              className={cn(
                'aspect-square rounded-md text-sm transition-colors',
                disabled && 'cursor-not-allowed text-primary-200',
                !disabled && !isSelected && 'text-primary-500 hover:bg-accent-100',
                isSelected && 'bg-primary-500 text-white',
                isToday && !isSelected && 'ring-1 ring-accent-500',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-primary-400">
        Selecione uma data disponível
      </p>
    </div>
  );
}

export { addDays };
