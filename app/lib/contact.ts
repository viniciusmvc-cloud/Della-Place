export const CONTACT = {
  ownerName: 'Aurélio Augusto Santos da Paz',
  whatsAppDigits: '5521986668009',
  whatsAppDisplay: '(21) 98666-8009',
  instagramHandle: 'dellapace',
  pixKey: '(21) 98666-8009',
  pixKeyType: 'Telefone',
  serviceArea:
    'Entrega presencial pelo Aurélio em área limitada. Não é serviço de delivery comercial.',
} as const;

export function whatsAppLink(message: string): string {
  return `https://wa.me/${CONTACT.whatsAppDigits}?text=${encodeURIComponent(message)}`;
}
