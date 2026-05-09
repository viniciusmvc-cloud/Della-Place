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
};

export function buildBroadcastMessage({
  customer,
  date,
  startHour,
  menu,
  notes,
  forPreview = false,
}: BroadcastInput): string {
  const greet = forPreview ? '[primeiro nome do cliente]' : firstName(customer.fullName);
  const dataLabel = formatDateLong(date);

  const flavors = menu
    .filter((m) => m.active)
    .slice(0, 8)
    .map((m) => `• ${m.name} — R$ ${m.price}`)
    .join('\n');

  const lines = [
    `Olá, ${greet}! 👋`,
    '',
    `A Della Pace está aberta *${dataLabel}*.`,
    `Início dos pedidos: *${startHour}* (slots de 15 em 15 min).`,
  ];

  if (notes) {
    lines.push('', `_${notes}_`);
  }

  lines.push(
    '',
    'Sabores desta edição:',
    flavors,
    '',
    `Reserve pelo site: ${SITE_URL}`,
    '',
    '📱 Quer receber os avisos no celular como um app?',
    'Abra o site no Chrome (Android) ou Safari (iPhone) e toque em "Adicionar à tela inicial".',
    '',
    `Aurélio · Della Pace`,
    `${CONTACT.whatsAppDisplay}`,
  );

  return lines.join('\n');
}

export function broadcastWhatsAppLink(input: BroadcastInput): string {
  const phone = (input.customer.phone ?? '').replace(/\D/g, '');
  const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
  const text = encodeURIComponent(buildBroadcastMessage(input));
  return `https://wa.me/${fullPhone}?text=${text}`;
}
