// Helpers de formatação consistente em todo o painel.

export function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const SMALL_WORDS = new Set([
  'de',
  'do',
  'da',
  'dos',
  'das',
  'e',
  'a',
  'o',
  'com',
  'em',
  'no',
  'na',
]);

// Converte 'MARGUERITHA' em 'Margueritha', 'LOMBINHO COM ALHO PORÓ' em
// 'Lombinho com Alho Poró'. Mantém preposições em minúsculas.
export function titleCase(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => {
      if (i > 0 && SMALL_WORDS.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}
