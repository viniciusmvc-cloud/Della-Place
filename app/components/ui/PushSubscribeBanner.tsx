'use client';

import { useEffect, useState } from 'react';
import {
  dismiss,
  getCurrentSubscription,
  isDismissed,
  pushSupported,
  subscribeToPush,
} from '@/lib/push';

type State = 'idle' | 'asking' | 'subscribed' | 'denied' | 'error';

export default function PushSubscribeBanner() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pushSupported()) return;
    if (isDismissed()) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    getCurrentSubscription().then((sub) => {
      if (cancelled || sub) return;
      timer = setTimeout(() => setVisible(true), 6000);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!visible || state === 'subscribed') return null;

  async function handleEnable() {
    setError(null);
    setState('asking');
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setState('error');
        setError('Notificações não configuradas neste site.');
        return;
      }
      const sub = await subscribeToPush(key);
      if (sub) {
        setState('subscribed');
        dismiss();
        setTimeout(() => setVisible(false), 1500);
      } else {
        setState('denied');
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleDismiss() {
    dismiss();
    setVisible(false);
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm rounded-2xl border border-primary-100 bg-white p-4 shadow-xl md:left-auto md:right-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">🔔</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-primary-500">
            Quer saber quando abrir uma nova edição?
          </p>
          <p className="mt-1 text-xs text-primary-500/70">
            Receba um aviso curto no celular quando o Aurélio liberar nova
            data. Sem spam, só quando tem pizza.
          </p>
          {error && (
            <p className="mt-2 text-[11px] text-rose-600">{error}</p>
          )}
          {state === 'denied' && (
            <p className="mt-2 text-[11px] text-rose-600">
              Permissão negada. Pra ativar, abra as configurações do
              navegador e permita notificações pra este site.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleEnable}
              disabled={state === 'asking'}
              className="rounded-full bg-primary-500 px-4 py-1.5 text-xs text-white hover:bg-primary-600 disabled:opacity-60"
            >
              {state === 'asking' ? 'Pedindo permissão…' : 'Ativar avisos'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full border border-primary-200 px-3 py-1.5 text-xs text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
