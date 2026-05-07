'use client';

import { useMemo } from 'react';
import { cn, generateTimeSlots, type TimeSlot } from '@/lib/utils';

type TimeslotSelectorProps = {
  startHour?: number;
  endHour?: number;
  intervalMinutes?: number;
  availableSlots?: string[];
  selected?: string | null;
  onSelect?: (slot: string) => void;
};

export default function TimeslotSelector({
  startHour = 18,
  endHour = 23,
  intervalMinutes = 15,
  availableSlots,
  selected = null,
  onSelect,
}: TimeslotSelectorProps) {
  const slots: TimeSlot[] = useMemo(
    () => generateTimeSlots(startHour, endHour, intervalMinutes),
    [startHour, endHour, intervalMinutes],
  );

  const availableSet = useMemo(
    () => (availableSlots ? new Set(availableSlots) : null),
    [availableSlots],
  );

  function isDisabled(value: string): boolean {
    if (!availableSet) return false;
    return !availableSet.has(value);
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-primary-500">
        Horário disponível
      </h3>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const disabled = isDisabled(slot.value);
          const isSelected = selected === slot.value;
          return (
            <button
              key={slot.value}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(slot.value)}
              className={cn(
                'rounded-md border px-2 py-2 text-sm transition-colors',
                disabled &&
                  'cursor-not-allowed border-primary-100 text-primary-200',
                !disabled && !isSelected &&
                  'border-primary-200 text-primary-500 hover:border-accent-500 hover:bg-accent-50',
                isSelected &&
                  'border-primary-500 bg-primary-500 text-white',
              )}
            >
              {slot.label}
            </button>
          );
        })}
      </div>

      {slots.length === 0 && (
        <p className="text-center text-sm text-primary-400">
          Nenhum horário configurado
        </p>
      )}
    </div>
  );
}
