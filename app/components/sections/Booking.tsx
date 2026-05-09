'use client';

import { useEffect, useMemo, useState } from 'react';
import CalendarPicker from '@/components/booking/CalendarPicker';
import {
  createOrder,
  fetchAvailability,
  fetchBookedSlots,
  fetchMenu,
  lookupCustomer,
  upsertCustomer,
} from '@/lib/api';
import { CONTACT, whatsAppLink } from '@/lib/contact';
import { DEFAULT_MENU, type MenuItem } from '@/lib/menu';
import { newOrderId, type Order } from '@/lib/orders';
import { addDays, formatDateBR, formatDateISO } from '@/lib/utils';

type Finish = 'Assada' | 'Pré-assada' | 'Congelada';

const FINISHES: Finish[] = ['Assada', 'Pré-assada', 'Congelada'];

type PizzaItem = { time: string; flavor: string; finish: Finish };
type Mode = 'idle' | 'new' | 'returning';

type Customer = {
  cpf: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  blockApt: string;
};

const EMPTY_CUSTOMER: Customer = {
  cpf: '',
  fullName: '',
  phone: '',
  email: '',
  address: '',
  blockApt: '',
};

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
function nextSundays(count: number): Date[] {
  const result: Date[] = [];
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (result.length < count) {
    if (cursor.getDay() === 0) result.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return result;
}
function generateSlotsFrom(startHour: string): string[] {
  const m = /^(\d{1,2}):(\d{2})/.exec(startHour);
  const startH = m ? Math.max(0, Math.min(22, parseInt(m[1], 10))) : 18;
  const startM = m ? Math.max(0, Math.min(45, parseInt(m[2], 10))) : 0;
  const out: string[] = [];
  let h = startH;
  let mm = startM - (startM % 15);
  while (h < 23) {
    out.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
    mm += 15;
    if (mm >= 60) {
      mm = 0;
      h += 1;
    }
  }
  return out;
}

export default function Booking() {
  const [mode, setMode] = useState<Mode>('idle');
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [date, setDate] = useState<Date | null>(null);
  const [items, setItems] = useState<PizzaItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');

  const [stagingTime, setStagingTime] = useState<string | null>(null);
  const [stagingFlavor, setStagingFlavor] = useState<string>('');
  const [stagingFinish, setStagingFinish] = useState<Finish>('Assada');

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [startHourByDate, setStartHourByDate] = useState<Record<string, string>>({});
  const [flavorsByDate, setFlavorsByDate] = useState<Record<string, string[]>>({});
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const [lookupMessage, setLookupMessage] = useState<
    'idle' | 'found' | 'notfound' | 'short'
  >('idle');
  const [cadastroSavedNotice, setCadastroSavedNotice] = useState<string | null>(null);

  useEffect(() => {
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
        const futureAv = av.filter(
          (a) => new Date(`${a.date}T12:00:00`) >= todayStart,
        );
        setAvailableDates(
          futureAv.map((a) => new Date(`${a.date}T12:00:00`)),
        );
        const hourMap: Record<string, string> = {};
        const flavorMap: Record<string, string[]> = {};
        futureAv.forEach((a) => {
          hourMap[a.date] = a.startHour ?? '18:00';
          if (a.flavorIds && a.flavorIds.length > 0) {
            flavorMap[a.date] = a.flavorIds;
          }
        });
        setStartHourByDate(hourMap);
        setFlavorsByDate(flavorMap);
      } else {
        setAvailableDates(nextSundays(8));
        setStartHourByDate({});
        setFlavorsByDate({});
      }
    });
  }, []);

  function priceFor(name: string): number {
    return menu.find((m) => m.name === name)?.price ?? 0;
  }

  useEffect(() => {
    if (mode !== 'returning') return;
    const key = digitsOnly(customer.cpf);
    if (key.length === 0) {
      setLookupMessage('idle');
      return;
    }
    if (key.length < 11) {
      setLookupMessage('short');
      return;
    }
    let cancelled = false;
    lookupCustomer(customer.cpf).then((found) => {
      if (cancelled) return;
      if (found) {
        setCustomer({
          cpf: found.cpf,
          fullName: found.fullName,
          phone: found.phone,
          email: found.email,
          address: found.address,
          blockApt: found.blockApt,
        });
        setLookupMessage('found');
      } else {
        setLookupMessage('notfound');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [customer.cpf, mode]);

  const allSlots = useMemo(() => {
    const iso = date ? formatDateISO(date) : null;
    const startHour = (iso && startHourByDate[iso]) || '18:00';
    return generateSlotsFrom(startHour);
  }, [date, startHourByDate]);

  const visibleMenu = useMemo(() => {
    const iso = date ? formatDateISO(date) : null;
    const allowed = iso ? flavorsByDate[iso] : null;
    if (!allowed || allowed.length === 0) return menu;
    const allowedSet = new Set(allowed);
    return menu.filter((m) => allowedSet.has(m.id));
  }, [menu, date, flavorsByDate]);

  useEffect(() => {
    if (visibleMenu.length === 0) return;
    if (!visibleMenu.some((m) => m.name === stagingFlavor)) {
      setStagingFlavor(visibleMenu[0].name);
    }
  }, [visibleMenu, stagingFlavor]);

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
      .catch(() => {
        if (!cancelled) setBookedSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const usedTimes = useMemo(() => {
    const used = [...bookedSlots, ...items.map((i) => i.time)];
    if (stagingTime) used.push(stagingTime);
    return used;
  }, [bookedSlots, items, stagingTime]);
  const availableTimes = useMemo(
    () => allSlots.filter((t) => !usedTimes.includes(t)),
    [allSlots, usedTimes],
  );

  const total = items.reduce((sum, it) => sum + priceFor(it.flavor), 0);

  function setField<K extends keyof Customer>(key: K, value: Customer[K]) {
    setCustomer((prev) => ({ ...prev, [key]: value }));
  }

  function addPizza() {
    if (!stagingTime || !stagingFlavor) return;
    setItems((prev) =>
      [...prev, { time: stagingTime, flavor: stagingFlavor, finish: stagingFinish }].sort(
        (a, b) => a.time.localeCompare(b.time),
      ),
    );
    setStagingTime(null);
    setStagingFlavor(menu[0]?.name ?? '');
    setStagingFinish('Assada');
  }

  function removePizza(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const cpfOk = digitsOnly(customer.cpf).length === 11;
  const cadastroOk =
    cpfOk &&
    customer.fullName.trim().length > 0 &&
    digitsOnly(customer.phone).length >= 10 &&
    customer.address.trim().length > 0 &&
    customer.blockApt.trim().length > 0;
  const orderOk = !!date && items.length > 0;
  const allOk = cadastroOk && orderOk;

  async function handleSaveCadastro() {
    if (!cadastroOk) return;
    try {
      await upsertCustomer(customer);
      setCadastroSavedNotice(
        'Cadastro salvo. Você pode reutilizar com o mesmo CPF nas próximas reservas.',
      );
      setTimeout(() => setCadastroSavedNotice(null), 4500);
    } catch (err) {
      setCadastroSavedNotice(
        `Erro ao salvar: ${err instanceof Error ? err.message : 'tente novamente'}`,
      );
      setTimeout(() => setCadastroSavedNotice(null), 5000);
    }
  }

  function buildOrderMessage(): string {
    const lines: string[] = [];
    lines.push('🍕 *Pedido Della Pace*');
    lines.push('');
    lines.push(`*Cliente:* ${customer.fullName}`);
    lines.push(`*CPF:* ${customer.cpf}`);
    lines.push(`*WhatsApp:* ${customer.phone}`);
    if (customer.email) lines.push(`*E-mail:* ${customer.email}`);
    lines.push('');
    lines.push(`*Endereço:* ${customer.address}`);
    lines.push(`*Bloco/Apto:* ${customer.blockApt}`);
    lines.push('');
    lines.push(`*Data:* ${date ? formatDateBR(date) : ''}`);
    lines.push('');
    lines.push(`*Pizzas (${items.length}):*`);
    items.forEach((it, i) => {
      lines.push(
        `  ${i + 1}. ${it.time} — ${it.flavor} — *${it.finish}* — R$ ${priceFor(it.flavor)}`,
      );
    });
    if (orderNotes.trim()) {
      lines.push('');
      lines.push(`*Observações:* ${orderNotes.trim()}`);
    }
    lines.push('');
    lines.push(`*Total:* R$ ${total}`);
    lines.push('');
    lines.push(
      'Gostaria de confirmar essa reserva. Aguardo sua confirmação e os dados do PIX.',
    );
    return lines.join('\n');
  }

  async function handleSendOrder(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!allOk || !date) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const order: Order = {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      date: formatDateISO(date),
      customer: { ...customer },
      items: items.map((it) => ({
        time: it.time,
        flavor: it.flavor,
        finish: it.finish,
        price: priceFor(it.flavor),
      })),
      total,
      notes: orderNotes.trim(),
      status: 'pendente',
    };
    try {
      await createOrder(order);
      window.open(whatsAppLink(buildOrderMessage()), '_blank', 'noopener');
    } catch (err) {
      alert(
        `Erro ao salvar o pedido: ${err instanceof Error ? err.message : String(err)}\n\nO pedido NÃO foi enviado. Tente novamente.`,
      );
    }
  }

  return (
    <section id="reservar" className="bg-white px-4 py-20 md:px-8">
      <div className="mx-auto max-w-5xl">
        <p
          className="mb-3 text-center text-xs uppercase tracking-[0.4em] text-accent-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Reservar
        </p>
        <h2
          className="mb-4 text-center text-4xl italic text-primary-500 md:text-5xl"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Faça seu pedido
        </h2>

        <div className="mx-auto mb-10 max-w-2xl rounded-xl border border-accent-200 bg-accent-50/40 p-4 text-center text-sm text-primary-500/80">
          ⚠️ <strong>Não é serviço de delivery comercial.</strong> {CONTACT.serviceArea}
        </div>

        <div className="space-y-8">
          <Block n="1" title="Quem é você?">
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('returning');
                  setCustomer(EMPTY_CUSTOMER);
                  setLookupMessage('idle');
                }}
                className={tabClass(mode === 'returning')}
              >
                Já sou cliente
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('new');
                  setCustomer(EMPTY_CUSTOMER);
                  setLookupMessage('idle');
                }}
                className={tabClass(mode === 'new')}
              >
                Novo cadastro
              </button>
            </div>

            {mode === 'idle' && (
              <p className="text-center text-sm text-primary-500/60">
                Escolha acima como você quer continuar.
              </p>
            )}

            {mode === 'returning' && (
              <div className="space-y-3">
                <Input
                  label="CPF"
                  value={customer.cpf}
                  onChange={(v) => setField('cpf', formatCpf(v))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
                {lookupMessage === 'short' && (
                  <p className="text-xs text-primary-500/60">Continue digitando o CPF…</p>
                )}
                {lookupMessage === 'notfound' && (
                  <p className="text-xs text-primary-500/70">
                    Cadastro não encontrado. Use <strong>Novo cadastro</strong> para criar.
                  </p>
                )}
                {lookupMessage === 'found' && (
                  <div className="rounded-lg border border-accent-200 bg-accent-50/40 p-4 text-sm text-primary-500/80">
                    <p className="mb-2 text-xs uppercase tracking-widest text-accent-600">
                      ✓ Cadastro encontrado
                    </p>
                    <p>
                      <strong>Nome:</strong> {customer.fullName}
                    </p>
                    <p>
                      <strong>WhatsApp:</strong> {customer.phone}
                    </p>
                    {customer.email && (
                      <p>
                        <strong>E-mail:</strong> {customer.email}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {mode === 'new' && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input
                    label="CPF"
                    value={customer.cpf}
                    onChange={(v) => setField('cpf', formatCpf(v))}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Nome completo"
                    value={customer.fullName}
                    onChange={(v) => setField('fullName', v)}
                  />
                </div>
                <Input
                  label="WhatsApp"
                  value={customer.phone}
                  onChange={(v) => setField('phone', v)}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                />
                <Input
                  label="E-mail (opcional)"
                  value={customer.email}
                  onChange={(v) => setField('email', v)}
                />
              </div>
            )}
          </Block>

          {mode !== 'idle' && (
            <Block n="2" title="Para onde?">
              {mode === 'new' ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Input
                      label="Endereço (rua, condomínio, bairro)"
                      value={customer.address}
                      onChange={(v) => setField('address', v)}
                    />
                  </div>
                  <Input
                    label="Bloco / Apartamento / Complemento"
                    value={customer.blockApt}
                    onChange={(v) => setField('blockApt', v)}
                    placeholder="0000"
                  />
                </div>
              ) : lookupMessage === 'found' ? (
                <div className="rounded-lg border border-accent-200 bg-accent-50/40 p-4 text-sm text-primary-500/80">
                  <p>
                    <strong>Endereço:</strong> {customer.address}
                  </p>
                  <p>
                    <strong>Bloco/Apto:</strong> {customer.blockApt}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-primary-500/60">
                  Informe o CPF acima para preencher automaticamente.
                </p>
              )}
            </Block>
          )}

          {mode === 'new' && (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCadastro}
                disabled={!cadastroOk}
                className="rounded-full bg-primary-500 px-6 py-2.5 text-sm text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                Salvar cadastro
              </button>
              {cadastroSavedNotice && (
                <p className="text-xs text-accent-600">{cadastroSavedNotice}</p>
              )}
              {!cadastroOk && (
                <p className="text-[11px] text-primary-500/50">
                  Preencha CPF, nome, WhatsApp, endereço e bloco/apto para salvar.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-2">
            <Block n="3" title="Quando?">
              <CalendarPicker
                availableDates={availableDates}
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setItems([]);
                  setStagingTime(null);
                }}
              />
              <p className="mt-3 text-xs text-primary-500/60">
                Cada pizza ocupa um horário de 15 min — uma pizza por vez no forno.
              </p>
            </Block>

            <Block n="4" title="Suas pizzas">
              {!date ? (
                <p className="text-sm text-primary-500/60">
                  Escolha uma data ao lado para liberar os horários.
                </p>
              ) : (
                <>
                  <p className="mb-2 text-xs uppercase tracking-widest text-primary-500/60">
                    Horário para a próxima pizza
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {availableTimes.length === 0 ? (
                      <p className="col-span-4 text-xs text-primary-500/60">
                        Todos os horários do dia foram preenchidos.
                      </p>
                    ) : (
                      availableTimes.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setStagingTime(t)}
                          className={
                            stagingTime === t
                              ? 'rounded-md border border-primary-500 bg-primary-500 px-2 py-1.5 text-xs text-white'
                              : 'rounded-md border border-primary-200 px-2 py-1.5 text-xs text-primary-500 hover:border-primary-500'
                          }
                        >
                          {t}
                        </button>
                      ))
                    )}
                  </div>

                  {stagingTime && (
                    <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50/40 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-widest text-primary-500/60">
                          Pizza para {stagingTime}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setStagingTime(null);
                            setStagingFlavor('Marguerita');
                            setStagingFinish('Assada');
                          }}
                          className="text-xs text-primary-500/50 hover:text-primary-500"
                        >
                          cancelar
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={stagingFlavor}
                          onChange={(e) => setStagingFlavor(e.target.value)}
                          className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm text-primary-500"
                        >
                          {visibleMenu.map((f) => (
                            <option key={f.id} value={f.name}>
                              {f.name} · R$ {f.price}
                            </option>
                          ))}
                        </select>
                        <select
                          value={stagingFinish}
                          onChange={(e) => setStagingFinish(e.target.value as Finish)}
                          className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm text-primary-500"
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
                        className="mt-3 w-full rounded-full bg-primary-500 px-4 py-2 text-xs text-white"
                      >
                        Adicionar à reserva
                      </button>
                    </div>
                  )}

                  <div className="mt-6 border-t border-primary-100 pt-4">
                    <p className="mb-2 text-xs uppercase tracking-widest text-primary-500/60">
                      Pizzas adicionadas ({items.length})
                    </p>
                    {items.length === 0 ? (
                      <p className="text-xs text-primary-500/50">
                        Nenhuma pizza ainda. Escolha um horário acima.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {items.map((it, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between rounded-md border border-primary-100 bg-white p-2 text-sm"
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className="rounded bg-primary-500 px-2 py-0.5 text-xs text-white"
                                style={{
                                  fontFamily: 'var(--font-cormorant), Georgia, serif',
                                }}
                              >
                                {it.time}
                              </span>
                              <span className="text-primary-500">
                                {it.flavor} <span className="text-primary-500/60">·</span>{' '}
                                <span className="text-primary-500/70">{it.finish}</span>
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-accent-600">
                                R$ {priceFor(it.flavor)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removePizza(idx)}
                                aria-label={`Remover pizza ${idx + 1}`}
                                className="rounded-full text-primary-500/40 hover:text-primary-500"
                              >
                                ✕
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="mt-4">
                      <label className="mb-1 block text-xs uppercase tracking-widest text-primary-500/60">
                        Observações do pedido (opcional)
                      </label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm text-primary-500 outline-none focus:border-primary-500"
                      />
                    </div>
                  )}
                </>
              )}
            </Block>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-primary-100 bg-primary-50/40 p-6">
          <p className="mb-3 text-xs uppercase tracking-widest text-primary-500/60">
            Resumo do pedido
          </p>
          {date && items.length > 0 ? (
            <ul className="space-y-1 text-sm text-primary-500/85">
              <li>📅 {formatDateBR(date)}</li>
              {items.map((it, i) => (
                <li key={i}>
                  🕒 {it.time} — 🍕 {it.flavor} ({it.finish}) — R$ {priceFor(it.flavor)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-primary-500/50">
              Preencha os passos acima para ver o resumo.
            </p>
          )}
          <div className="mt-4 flex items-baseline justify-between border-t border-primary-200 pt-3">
            <span className="text-sm uppercase tracking-widest text-primary-500/60">
              Total
            </span>
            <span
              className="text-3xl text-primary-500"
              style={{
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontWeight: 600,
              }}
            >
              R$ {total}
            </span>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-accent-200 bg-accent-50/30 p-5 text-sm leading-relaxed text-primary-500/85">
          <strong className="text-primary-500">⚠️ Importante:</strong> a reserva só é
          confirmada quando o Aurélio recebe sua mensagem encaminhando o pedido por
          WhatsApp clicando no botão abaixo. Sobre o PIX, e para evitar fraude, trate
          diretamente pelo WhatsApp com o Aurélio — após ele confirmar o recebimento
          do pedido, ele envia a chave PIX. <strong>O pagamento é feito apenas no
          momento em que você receber a pizza.</strong>
        </div>

        <div className="mx-auto mt-6 max-w-3xl">
          <a
            href={allOk ? whatsAppLink(buildOrderMessage()) : '#reservar'}
            onClick={handleSendOrder}
            target="_blank"
            rel="noopener noreferrer"
            className={
              allOk
                ? 'flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-base font-medium text-white transition-transform hover:scale-[1.01]'
                : 'flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-primary-200 px-6 py-4 text-base text-white'
            }
          >
            {allOk
              ? 'Enviar pedido ao Aurélio via WhatsApp'
              : 'Preencha cadastro, data e ao menos uma pizza'}
          </a>
          <p className="mt-3 text-center text-[11px] text-primary-500/50">
            O Aurélio confirma sua reserva e envia os dados do PIX por WhatsApp em
            seguida.
          </p>
        </div>
      </div>
    </section>
  );
}

function Block({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white">
          {n}
        </span>
        <h3 className="text-lg font-medium text-primary-500">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'tel' | 'numeric' | 'email';
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-widest text-primary-500/60">
        {label}
      </label>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm text-primary-500 outline-none placeholder:text-primary-300 focus:border-primary-500"
      />
    </div>
  );
}

function tabClass(active: boolean): string {
  return active
    ? 'rounded-full bg-primary-500 px-4 py-2 text-xs text-white'
    : 'rounded-full border border-primary-200 px-4 py-2 text-xs text-primary-500/70 hover:border-primary-500';
}
