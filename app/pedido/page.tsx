'use client';

import { useEffect, useMemo, useState } from 'react';
import CalendarPicker from '@/components/booking/CalendarPicker';
import { LogoTextOnly } from '@/components/brand/Logo';
import {
  createCommunityPost,
  createOrder,
  fetchAvailability,
  fetchBookedSlots,
  fetchMenu,
  lookupCustomer,
  upsertCustomer,
} from '@/lib/api';
import { generateSlots } from '@/lib/availability';
import { CONTACT } from '@/lib/contact';
import { DEFAULT_MENU, type MenuItem } from '@/lib/menu';
import { newOrderId, type StoredCustomer } from '@/lib/orders';
import { formatDateBR, formatDateISO } from '@/lib/utils';

type Finish = 'Assada' | 'Pré-assada' | 'Congelada';
const FINISHES: Finish[] = ['Assada', 'Congelada'];

const STORAGE_KEY = 'della-pace.customer.cpf.v1';

type PizzaItem = { time: string; flavor: string; finish: Finish };

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}
function formatCpf(s: string): string {
  const d = digitsOnly(s).slice(0, 11);
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9), d.slice(9, 11)];
  let out = parts[0];
  if (parts[1]) out += `.${parts[1]}`;
  if (parts[2]) out += `.${parts[2]}`;
  if (parts[3]) out += `-${parts[3]}`;
  return out;
}
function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
// generateSlots agora vive em @/lib/availability — importado acima.

export default function PedidoPage() {
  const [stage, setStage] = useState<'login' | 'register' | 'app'>('login');
  const [customer, setCustomer] = useState<StoredCustomer | null>(null);
  const [cpfInput, setCpfInput] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [startHourByDate, setStartHourByDate] = useState<Record<string, string>>({});
  const [capacityByDate, setCapacityByDate] = useState<Record<string, number>>({});
  const [flavorsByDate, setFlavorsByDate] = useState<Record<string, string[]>>({});

  const [date, setDate] = useState<Date | null>(null);
  const [items, setItems] = useState<PizzaItem[]>([]);
  const [stagingTime, setStagingTime] = useState<string | null>(null);
  const [stagingFlavor, setStagingFlavor] = useState<string>('');
  const [stagingFinish, setStagingFinish] = useState<Finish>('Assada');
  const [orderNotes, setOrderNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // First-load: try to recover saved CPF
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      lookupCustomer(saved)
        .then((found) => {
          if (found) {
            setCustomer(found);
            setStage('app');
          }
        })
        .catch(() => {});
    }
  }, []);

  // Load menu + availability when entering app stage
  useEffect(() => {
    if (stage !== 'app') return;
    Promise.all([
      fetchMenu().catch(() => DEFAULT_MENU),
      fetchAvailability().catch(() => []),
    ]).then(([menuData, av]) => {
      const active = menuData.filter((x) => x.active);
      setMenu(active);
      if (active.length > 0) setStagingFlavor((s) => s || active[0].name);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (av.length > 0) {
        const future = av.filter(
          (a) => new Date(`${a.date}T12:00:00`) >= todayStart,
        );
        setAvailableDates(future.map((a) => new Date(`${a.date}T12:00:00`)));
        const hourMap: Record<string, string> = {};
        const capMap: Record<string, number> = {};
        const flavorMap: Record<string, string[]> = {};
        future.forEach((a) => {
          hourMap[a.date] = a.startHour ?? '18:00';
          capMap[a.date] = a.capacity ?? 8;
          if (a.flavorIds && a.flavorIds.length > 0) {
            flavorMap[a.date] = a.flavorIds;
          }
        });
        setStartHourByDate(hourMap);
        setCapacityByDate(capMap);
        setFlavorsByDate(flavorMap);
      }
    });
  }, [stage]);

  useEffect(() => {
    if (!date) {
      setBookedSlots([]);
      return;
    }
    let cancelled = false;
    fetchBookedSlots(formatDateISO(date))
      .then((slots) => {
        if (!cancelled) setBookedSlots(slots);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [date]);

  const allSlots = useMemo(() => {
    const iso = date ? formatDateISO(date) : null;
    const startHour = (iso && startHourByDate[iso]) || '18:00';
    const capacity = iso ? capacityByDate[iso] : undefined;
    return generateSlots(startHour, capacity);
  }, [date, startHourByDate, capacityByDate]);

  const visibleMenu = useMemo(() => {
    const iso = date ? formatDateISO(date) : null;
    const allowed = iso ? flavorsByDate[iso] : null;
    if (!allowed || allowed.length === 0) return menu;
    const set = new Set(allowed);
    return menu.filter((m) => set.has(m.id));
  }, [menu, date, flavorsByDate]);

  useEffect(() => {
    if (visibleMenu.length === 0) return;
    if (!visibleMenu.some((m) => m.name === stagingFlavor)) {
      setStagingFlavor(visibleMenu[0].name);
    }
  }, [visibleMenu, stagingFlavor]);

  const usedTimes = useMemo(() => {
    const used = [...bookedSlots, ...items.map((i) => i.time)];
    if (stagingTime) used.push(stagingTime);
    return used;
  }, [bookedSlots, items, stagingTime]);
  const availableTimes = allSlots.filter((t) => !usedTimes.includes(t));

  function priceFor(name: string): number {
    return menu.find((m) => m.name === name)?.price ?? 0;
  }
  const total = items.reduce((s, it) => s + priceFor(it.flavor), 0);

  async function handleCpfSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cpf = formatCpf(cpfInput);
    if (digitsOnly(cpf).length !== 11) {
      setError('CPF precisa ter 11 dígitos.');
      return;
    }
    setLookupBusy(true);
    try {
      const found = await lookupCustomer(cpf);
      if (found) {
        setCustomer(found);
        localStorage.setItem(STORAGE_KEY, cpf);
        setStage('app');
      } else {
        setStage('register');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLookupBusy(false);
    }
  }

  async function handleRegisterSubmit(c: StoredCustomer) {
    setError(null);
    try {
      await upsertCustomer(c);
      setCustomer(c);
      localStorage.setItem(STORAGE_KEY, c.cpf);
      setStage('app');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setCustomer(null);
    setCpfInput('');
    setStage('login');
    setItems([]);
    setDate(null);
  }

  function addPizza() {
    if (!stagingTime || !stagingFlavor) return;
    setItems((prev) =>
      [
        ...prev,
        { time: stagingTime, flavor: stagingFlavor, finish: stagingFinish },
      ].sort((a, b) => a.time.localeCompare(b.time)),
    );
    setStagingTime(null);
  }

  async function submitOrder() {
    if (!customer || !date || items.length === 0) return;
    setSubmitting(true);
    try {
      await createOrder({
        id: newOrderId(),
        createdAt: new Date().toISOString(),
        status: 'pendente',
        date: formatDateISO(date),
        customer,
        items: items.map((it) => ({
          time: it.time,
          flavor: it.flavor,
          finish: it.finish,
          price: priceFor(it.flavor),
        })),
        total,
        notes: orderNotes,
      });
      setSubmitted(true);
      setItems([]);
      setDate(null);
      setOrderNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === 'login') {
    return (
      <Shell>
        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
          <p
            className="mb-2 text-2xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Bem-vindo
          </p>
          <p className="mb-5 text-sm text-primary-500/70">
            Digite seu CPF pra começar. Da próxima vez você já cai direto na
            tela de pedido.
          </p>
          <form onSubmit={handleCpfSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
                CPF
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={cpfInput}
                onChange={(e) => setCpfInput(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <button
              type="submit"
              disabled={lookupBusy}
              className="w-full rounded-full bg-primary-500 px-4 py-2.5 text-sm text-white disabled:opacity-50"
            >
              {lookupBusy ? 'Buscando…' : 'Entrar'}
            </button>
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </form>
        </div>
      </Shell>
    );
  }

  if (stage === 'register') {
    return (
      <Shell>
        <RegisterForm
          cpf={formatCpf(cpfInput)}
          onSubmit={handleRegisterSubmit}
          onBack={() => setStage('login')}
          error={error}
        />
      </Shell>
    );
  }

  // stage === 'app'
  if (!customer) return null;

  return (
    <Shell>
      {submitted ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <p className="text-3xl text-emerald-600">✓</p>
          <p className="mt-2 text-lg font-medium text-primary-500">
            Pedido recebido!
          </p>
          <p className="mt-2 text-sm text-primary-500/70">
            Aurélio confirma pelo WhatsApp em até 1h. Pagamento na entrega.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-4 rounded-full bg-primary-500 px-5 py-2 text-sm text-white"
          >
            Fazer outro pedido
          </button>
        </div>
      ) : (
        <>
          <header className="rounded-2xl border border-primary-100 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-accent-500">
                  Hoje na Della Pace
                </p>
                <h1
                  className="text-2xl italic text-primary-500"
                  style={{
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
                  }}
                >
                  Olá, {firstName(customer.fullName)}
                </h1>
                <p className="text-sm text-primary-500/70">
                  Qual o seu pedido hoje?
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-[10px] text-primary-500/50 hover:text-primary-500"
                title="Sair (precisa colocar CPF de novo)"
              >
                trocar
              </button>
            </div>
          </header>

          <section className="rounded-2xl border border-primary-100 bg-white p-5">
            <h2
              className="mb-3 text-lg italic text-primary-500"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              Reservar pizza
            </h2>

            {availableDates.length === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                Nenhuma data aberta no momento. Aguarde aviso do Aurélio.
              </p>
            ) : (
              <>
                <div className="mb-4">
                  <p className="mb-2 text-[10px] uppercase tracking-widest text-primary-500/60">
                    Quando?
                  </p>
                  <CalendarPicker
                    availableDates={availableDates}
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      setItems([]);
                      setStagingTime(null);
                    }}
                  />
                </div>

                {date && (
                  <>
                    <div className="mb-3 rounded-md border border-primary-100 bg-primary-50/40 p-3 text-xs text-primary-500/80">
                      <strong>{formatDateBR(date)}</strong>
                      {' · '}
                      início{' '}
                      {startHourByDate[formatDateISO(date)] ?? '18:00'}
                    </div>

                    <div className="mb-3 grid gap-2">
                      <div>
                        <p className="mb-1 text-[10px] uppercase tracking-widest text-primary-500/60">
                          Horário
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {availableTimes.length === 0 ? (
                            <p className="text-xs text-primary-500/60">
                              Sem horários livres nesta data.
                            </p>
                          ) : (
                            availableTimes.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setStagingTime(t)}
                                className={
                                  stagingTime === t
                                    ? 'rounded-full bg-primary-500 px-2.5 py-1 text-[11px] text-white'
                                    : 'rounded-full border border-primary-200 px-2.5 py-1 text-[11px] text-primary-500/70 hover:border-primary-500'
                                }
                              >
                                {t}
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={stagingFlavor}
                          onChange={(e) => setStagingFlavor(e.target.value)}
                          className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
                        >
                          {visibleMenu.map((f) => (
                            <option key={f.id} value={f.name}>
                              {f.name} · R$ {f.price}
                            </option>
                          ))}
                        </select>
                        <select
                          value={stagingFinish}
                          onChange={(e) =>
                            setStagingFinish(e.target.value as Finish)
                          }
                          className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
                        >
                          {FINISHES.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={addPizza}
                        disabled={!stagingTime}
                        className="rounded-full border border-primary-300 px-4 py-2 text-sm text-primary-500 hover:bg-primary-50 disabled:opacity-40"
                      >
                        + Adicionar pizza
                      </button>
                    </div>

                    {items.length > 0 && (
                      <ul className="mb-3 space-y-1">
                        {items.map((it, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between rounded-md border border-primary-100 bg-white px-3 py-2 text-xs"
                          >
                            <span>
                              🕒 {it.time} · 🍕 {it.flavor} ({it.finish}) · R${' '}
                              {priceFor(it.flavor)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setItems(items.filter((_, i) => i !== idx))
                              }
                              className="text-rose-500"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={2}
                      placeholder="Observação (opcional): mais bem assada, sem cebola..."
                      className="mb-3 w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
                    />

                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={submitOrder}
                        disabled={submitting}
                        className="w-full rounded-full bg-primary-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {submitting
                          ? 'Enviando…'
                          : `Confirmar pedido · R$ ${total}`}
                      </button>
                    )}

                    {error && (
                      <p className="mt-2 text-xs text-rose-600">{error}</p>
                    )}
                  </>
                )}
              </>
            )}
          </section>

          <CommunityPostForm customerName={customer.fullName} />

          <SuggestionForm customerName={customer.fullName} />
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary-50/30">
      <header className="border-b border-primary-100 bg-white p-4 text-center">
        <LogoTextOnly width={180} />
      </header>
      <main className="mx-auto max-w-md space-y-4 p-4">{children}</main>
      <footer className="p-6 text-center text-[10px] text-primary-500/40">
        Della Pace · Aurélio · {CONTACT.whatsAppDisplay}
      </footer>
    </div>
  );
}

function RegisterForm({
  cpf,
  onSubmit,
  onBack,
  error,
}: {
  cpf: string;
  onSubmit: (c: StoredCustomer) => void;
  onBack: () => void;
  error: string | null;
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [blockApt, setBlockApt] = useState('');
  const [cep, setCep] = useState('');
  const [number, setNumber] = useState('');
  const [cepBusy, setCepBusy] = useState(false);
  const [cepMsg, setCepMsg] = useState<string | null>(null);

  async function lookupCep() {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) {
      setCepMsg('CEP precisa de 8 dígitos.');
      return;
    }
    setCepBusy(true);
    setCepMsg(null);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const j = await r.json();
      if (j.erro || !j.logradouro) {
        setCepMsg('CEP não encontrado.');
        return;
      }
      const addr = `${j.logradouro}${number ? ', ' + number : ''}, ${j.bairro}, ${j.localidade}-${j.uf}`;
      setAddress(addr);
    } catch {
      setCepMsg('Erro ao consultar CEP.');
    } finally {
      setCepBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || digitsOnly(phone).length < 10 || !address.trim())
      return;
    onSubmit({ cpf, fullName, phone, email, address, blockApt });
  }

  return (
    <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
      <p
        className="mb-2 text-xl italic text-primary-500"
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
      >
        Cadastro rápido
      </p>
      <p className="mb-4 text-xs text-primary-500/70">
        CPF: <strong>{cpf}</strong>{' '}
        <button
          type="button"
          onClick={onBack}
          className="ml-2 text-[10px] text-primary-500/50 underline"
        >
          trocar
        </button>
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nome completo"
          className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
        />
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefone com DDD"
          className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (opcional)"
          className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
        />
        <div className="rounded-md border border-primary-100 bg-primary-50/30 p-2">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-primary-500/60">
            Buscar endereço por CEP (opcional)
          </p>
          <div className="flex flex-wrap gap-1">
            <input
              type="text"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              placeholder="CEP"
              className="w-28 rounded-md border border-primary-200 bg-white px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Nº"
              className="w-16 rounded-md border border-primary-200 bg-white px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={lookupCep}
              disabled={cepBusy}
              className="rounded-full bg-primary-500 px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              {cepBusy ? '…' : '🔍 Buscar'}
            </button>
          </div>
          {cepMsg && <p className="mt-1 text-xs text-rose-700">{cepMsg}</p>}
        </div>
        <input
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Endereço (rua/condomínio)"
          className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={blockApt}
          onChange={(e) => setBlockApt(e.target.value)}
          placeholder="Bloco / apto / casa"
          className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-primary-500 px-4 py-2.5 text-sm text-white"
        >
          Salvar e continuar
        </button>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </form>
    </div>
  );
}

function CommunityPostForm({ customerName }: { customerName: string }) {
  const [text, setText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande (máx 5MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setImageDataUrl(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus('sending');
    setError(null);
    try {
      await createCommunityPost({
        name: customerName,
        message: text.trim(),
        imageData: imageDataUrl,
      });
      setStatus('sent');
      setText('');
      setImageDataUrl(null);
      setTimeout(() => setStatus('idle'), 3500);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="rounded-2xl border border-primary-100 bg-white p-5">
      <h2
        className="mb-1 text-lg italic text-primary-500"
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
      >
        Comente sua experiência
      </h2>
      <p className="mb-3 text-xs text-primary-500/70">
        Foto e comentário aparecem na home depois que Aurélio aprovar.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Conte como foi a pizza..."
          className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
        />
        <input
          type="file"
          accept="image/*"
          onChange={onPickImage}
          className="block w-full text-xs text-primary-500 file:mr-3 file:rounded-full file:border-0 file:bg-primary-500 file:px-3 file:py-1 file:text-xs file:text-white"
        />
        {imageDataUrl && (
          <img
            src={imageDataUrl}
            alt="prévia"
            className="h-24 w-24 rounded-md object-cover"
          />
        )}
        <button
          type="submit"
          disabled={!text.trim() || status === 'sending'}
          className="w-full rounded-full border border-primary-300 px-4 py-2 text-sm text-primary-500 hover:bg-primary-50 disabled:opacity-50"
        >
          {status === 'sending' ? 'Enviando…' : 'Compartilhar'}
        </button>
        {status === 'sent' && (
          <p className="text-xs text-emerald-600">
            ✓ Recebido. Aurélio aprova em breve.
          </p>
        )}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </form>
    </section>
  );
}

function SuggestionForm({ customerName }: { customerName: string }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customerName, message: text.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('sent');
      setText('');
      setTimeout(() => setStatus('idle'), 3500);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="rounded-2xl border border-primary-100 bg-white p-5">
      <h2
        className="mb-1 text-lg italic text-primary-500"
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
      >
        Sugestão pra Della Pace
      </h2>
      <p className="mb-3 text-xs text-primary-500/70">
        Sabor novo, ingrediente, ideia. Aurélio lê com calma.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Sua sugestão..."
          className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim() || status === 'sending'}
          className="w-full rounded-full border border-primary-300 px-4 py-2 text-sm text-primary-500 hover:bg-primary-50 disabled:opacity-50"
        >
          {status === 'sending' ? 'Enviando…' : 'Enviar sugestão'}
        </button>
        {status === 'sent' && (
          <p className="text-xs text-emerald-600">✓ Recebido. Obrigado!</p>
        )}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </form>
    </section>
  );
}
