'use client';

import { useEffect, useState } from 'react';

type HelpBannerProps = {
  id: string;
  title: string;
  whenToFill?: string;
  steps?: string[];
  doNot?: string[];
  notes?: string;
};

const STORAGE_PREFIX = 'della-pace.help.collapsed.';

export default function HelpBanner({
  id,
  title,
  whenToFill,
  steps,
  doNot,
  notes,
}: HelpBannerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const v = localStorage.getItem(STORAGE_PREFIX + id);
    setCollapsed(v === '1');
    setHydrated(true);
  }, [id]);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + id, next ? '1' : '0');
    }
  }

  if (!hydrated) return null;

  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-4 text-sm">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">
            📖
          </span>
          <span className="font-medium text-primary-500">
            Como usar · {title}
          </span>
        </span>
        <span className="text-xs text-primary-500/60">
          {collapsed ? '▼ ler' : '▲ recolher'}
        </span>
      </button>

      {!collapsed && (
        <div className="mt-3 space-y-3 text-primary-500/85">
          {whenToFill && (
            <p>
              <strong className="text-primary-500">Quando preencher:</strong>{' '}
              {whenToFill}
            </p>
          )}
          {steps && steps.length > 0 && (
            <div>
              <p className="mb-1 font-medium text-primary-500">
                Como usar:
              </p>
              <ol className="ml-4 list-decimal space-y-1 text-[13px]">
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}
          {doNot && doNot.length > 0 && (
            <div>
              <p className="mb-1 font-medium text-rose-700">
                Não confunda com:
              </p>
              <ul className="ml-4 list-disc space-y-1 text-[13px] text-rose-700/90">
                {doNot.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {notes && (
            <p className="rounded-md border border-primary-100 bg-white p-2 text-[12px] text-primary-500/70">
              💡 {notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
