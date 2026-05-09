export const PRODUCT_CATEGORIES = [
  'massa',
  'molho',
  'cobertura',
  'operacao',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  massa: 'Massa',
  molho: 'Molho',
  cobertura: 'Cobertura',
  operacao: 'Operação',
};

export const CATEGORY_DESCRIPTION: Record<ProductCategory, string> = {
  massa: 'Farinhas, fermentos, líquidos da massa.',
  molho: 'Tomate, ervas, base do molho.',
  cobertura: 'Queijos, embutidos, vegetais que vão em cima.',
  operacao: 'Sal, azeite, embalagens, itens transversais.',
};

export type Product = {
  id: number;
  name: string;
  category: ProductCategory;
  categories: ProductCategory[];
  defaultUnit: string;
  notes: string;
  active: boolean;
  createdAt: string;
};

export type ProductInput = {
  name: string;
  category: ProductCategory;
  categories?: ProductCategory[];
  defaultUnit: string;
  notes?: string;
  active?: boolean;
};

export const COMMON_UNITS = ['kg', 'g', 'L', 'mL', 'un', 'maço', 'lata'] as const;
