// /app/admin/disponibilidade/page.tsx - VERSÃO CORRIGIDA COM CAMPO DE DEADLINE
// ✅ NOVO: Campo "Fechar pedidos em" para definir deadline

'use client';

import { useEffect, useState } from 'react';

interface AvailableDate {
  date: string;
  capacity: number;
  startHour: string;
  notes: string;
  flavorIds: string[];
  orderDeadlineAt?: string | null;  // ✅ NOVO CAMPO
}

export default function DisponibilidadePage() {
  const [dates, setDates] = useState<AvailableDate[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formDate, setFormDate] = useState('');
  const [formCapacity, setFormCapacity] = useState(8);
  const [formStartHour, setFormStartHour] = useState('18:00');
  const [formOrderDeadline, setFormOrderDeadline] = useState('');  // ✅ NOVO

  // Carregar disponibilidades
  const loadDates = async () => {
    try {
      const res = await fetch('/api/availability');
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setDates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDates();
  }, []);

  // Abrir novo domingo
  const handleOpenDate = async () => {
    if (!formDate) {
      alert('Selecione a data');
      return;
    }

    try {
      // ✅ NOVO: Incluir orderDeadlineAt na requisição
      const deadlineAt = formOrderDeadline
        ? new Date(formOrderDeadline).toISOString()
        : undefined;

      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formDate,
          capacity: formCapacity,
          startHour: formStartHour,
          orderDeadlineAt: deadlineAt,  // ✅ NOVO
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Erro: ${err.error}`);
        return;
      }

      alert('Domingo aberto com sucesso!');

      // Limpar form
      setFormDate('');
      setFormCapacity(8);
      setFormStartHour('18:00');
      setFormOrderDeadline('');  // ✅ NOVO

      // Recarregar lista
      await loadDates();
    } catch (err) {
      alert(`Erro: ${err}`);
    }
  };

  // Remover data
  const handleRemoveDate = async (date: string) => {
    if (!confirm(`Tem certeza que quer remover ${date}?`)) return;

    try {
      const res = await fetch(`/api/availability/${date}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover');
      await loadDates();
    } catch (err) {
      alert(`Erro: ${err}`);
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Disponibilidade</h1>

      {/* Formulário para abrir novo domingo */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-4 text-lg font-semibold">+ Abrir novo domingo</h2>

        <div className="grid gap-4">
          {/* Data */}
          <label className="block">
            <span className="text-sm font-medium">📅 Data</span>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>

          {/* Capacidade */}
          <label className="block">
            <span className="text-sm font-medium">📦 Capacidade (pizzas)</span>
            <input
              type="number"
              value={formCapacity}
              onChange={(e) => setFormCapacity(parseInt(e.target.value) || 8)}
              min="1"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>

          {/* Horário de início */}
          <label className="block">
            <span className="text-sm font-medium">⏰ Horário de início</span>
            <input
              type="time"
              value={formStartHour}
              onChange={(e) => setFormStartHour(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>

          {/* ✅ NOVO: Campo de deadline */}
          <label className="block">
            <span className="text-sm font-medium">⏰ Fechar pedidos em</span>
            <input
              type="datetime-local"
              value={formOrderDeadline}
              onChange={(e) => setFormOrderDeadline(e.target.value)}
              placeholder="2026-05-29T23:59"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              Deixe vazio para aceitar pedidos até o domingo. Exemplo: sexta
              23:59
            </p>
          </label>

          <button
            onClick={handleOpenDate}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            Abrir domingo
          </button>
        </div>
      </div>

      {/* Lista de domingos abertos */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Domingos abertos</h2>

        {dates.length === 0 ? (
          <p className="text-gray-500">Nenhum domingo aberto</p>
        ) : (
          dates.map((d) => (
            <div
              key={d.date}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div>
                <div className="font-semibold">
                  {new Date(`${d.date}T12:00:00`).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  📦 {d.capacity} pizzas • ⏰ {d.startHour}
                  {/* ✅ NOVO: Mostrar deadline se existir */}
                  {d.orderDeadlineAt && (
                    <>
                      {' '}
                      • 🔒 Pedidos até{' '}
                      {new Date(d.orderDeadlineAt).toLocaleString('pt-BR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleRemoveDate(d.date)}
                className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
