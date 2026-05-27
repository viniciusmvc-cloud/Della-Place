import { CONTACT } from '@/lib/contact';
import type { MenuItem } from '@/lib/menu';
import type { StoredCustomer } from '@/lib/orders';

export const SITE_URL = 'https://dellapace.com.br';

function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export type BroadcastInput = {
  customer: StoredCustomer;
  date: string;
  startHour: string;
  menu: MenuItem[];
  notes?: string;
  forPreview?: boolean;
  /** Template customizado. Se omitido, usa o padrão. Suporta variáveis {nome}, {data}, {dataShort}, {hora}, {sabores}, {site}, {telefone}. */
  customTemplate?: string;
};

/** Template padrão (usado quando admin não personalizou). */
export const DEFAULT_BROADCAST_TEMPLATE = `Olá, {nome}! 👋

A Della Pace está aberta *{data}*.
Início dos pedidos: *{hora}* (slots de 15 em 15 min).

Sabores desta edição:
{sabores}

Reserve pelo site: {site}

📱 Quer receber os avisos no celular como um app?
Abra o site no Chrome (Android) ou Safari (iPhone) e toque em "Adicionar à tela inicial".

Aurélio · Della Pace
{telefone}`;

/**
 * Renderiza um template substituindo as variáveis pelos valores.
 * Variáveis suportadas: {nome}, {data}, {dataShort}, {hora}, {sabores}, {site}, {telefone}.
 */
export function renderBroadcastTemplate(
  template: string,
  vars: {
    nome: string;
    data: string;
    dataShort: string;
    hora: string;
    sabores: string;
    site: string;
    telefone: string;
  },
): string {
  // Usa split/join em vez de replaceAll() pra suportar targets ES anteriores.
  function replaceAllSafe(str: string, search: string, replace: string): string {
    return str.split(search).join(replace);
  }
  let out = template;
  out = replaceAllSafe(out, '{nome}', vars.nome);
  out = replaceAllSafe(out, '{data}', vars.data);
  out = replaceAllSafe(out, '{dataShort}', vars.dataShort);
  out = replaceAllSafe(out, '{hora}', vars.hora);
  out = replaceAllSafe(out, '{sabores}', vars.sabores);
  out = replaceAllSafe(out, '{site}', vars.site);
  out = replaceAllSafe(out, '{telefone}', vars.telefone);
  return out;
}

export function buildBroadcastMessage({
  customer,
  date,
  startHour,
  menu,
  notes,
  forPreview = false,
  customTemplate,
}: BroadcastInput): string {
  const vars = {
    nome: forPreview ? '[primeiro nome do cliente]' : firstName(customer.fullName),
    data: formatDateLong(date),
    dataShort: formatDateShort(date),
    hora: startHour,
    sabores: menu
      .filter((m) => m.active)
      .slice(0, 8)
      .map((m) => `• ${m.name} — R$ ${m.price}`)
      .join('\n'),
    site: SITE_URL,
    telefone: CONTACT.whatsAppDisplay,
  };

  const template = customTemplate ?? DEFAULT_BROADCAST_TEMPLATE;
  let message = renderBroadcastTemplate(template, vars);

  // Quando há `notes` da Disponibilidade e o admin NÃO customizou o template,
  // injetamos antes dos sabores (comportamento legado).
  if (notes && !customTemplate) {
    message = message.replace(
      'Sabores desta edição:',
      `_${notes}_\n\nSabores desta edição:`,
    );
  }
  return message;
}

export function broadcastWhatsAppLink(input: BroadcastInput): string {
  const phone = (input.customer.phone ?? '').replace(/\D/g, '');
  const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
  const text = encodeURIComponent(buildBroadcastMessage(input));
  return `https://wa.me/${fullPhone}?text=${text}`;
}
