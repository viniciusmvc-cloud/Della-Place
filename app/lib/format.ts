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

// Formata quantidade × unidade pra leitura humana.
// Para pizzas (medidas pequenas): kg < 1 vira gramas, L < 1 vira ml.
// kg/L só aparece pra valores grandes (compras, mise-en-place).
//   formatAmount(0.21, 'kg') → '210 g'
//   formatAmount(0.0006, 'kg') → '0,6 g'
//   formatAmount(2.5, 'kg') → '2,5 kg'
//   formatAmount(0.5, 'L') → '500 ml'
//   formatAmount(1, 'un') → '1 un'
export function formatAmount(amount: number, unit: string): string {
  const u = (unit || '').toLowerCase();
  const fmt = (n: number, decimals: number) =>
    n.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });

  if (u === 'kg' && amount < 1) {
    const g = amount * 1000;
    return `${fmt(g, g < 10 ? 2 : 0)} g`;
  }
  if ((u === 'l' || u === 'L') && amount < 1) {
    const ml = amount * 1000;
    return `${fmt(ml, ml < 10 ? 2 : 0)} ml`;
  }
  return `${fmt(amount, 3)} ${unit}`;
}
