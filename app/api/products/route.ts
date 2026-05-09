import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query } from '@/lib/db';
import { PRODUCT_CATEGORIES, type ProductCategory } from '@/lib/products';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProductRow = {
  id: number;
  name: string;
  category: ProductCategory;
  categories_json: string | null;
  default_unit: string;
  notes: string | null;
  active: number;
  created_at: Date;
};

function parseCategories(
  primary: ProductCategory,
  json: string | null,
): ProductCategory[] {
  const set = new Set<ProductCategory>([primary]);
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        parsed.forEach((c) => {
          if (
            typeof c === 'string' &&
            ['massa', 'molho', 'cobertura', 'operacao'].includes(c)
          ) {
            set.add(c as ProductCategory);
          }
        });
      }
    } catch {}
  }
  return Array.from(set);
}

function rowToJson(r: ProductRow) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    categories: parseCategories(r.category, r.categories_json),
    defaultUnit: r.default_unit,
    notes: r.notes ?? '',
    active: r.active === 1,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function GET() {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const rows = await query<ProductRow>(
      `SELECT id, name, category, categories_json, default_unit, notes, active, created_at
       FROM products
       ORDER BY category, name`,
    );
    return NextResponse.json(rows.map(rowToJson));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await safeBody<{
      name: string;
      category: ProductCategory;
      categories?: ProductCategory[];
      defaultUnit: string;
      notes?: string;
      active?: boolean;
    }>(request);
    if (!body?.name?.trim()) return badRequest('Nome obrigatório');
    if (!PRODUCT_CATEGORIES.includes(body.category)) {
      return badRequest('Categoria inválida');
    }
    if (!body.defaultUnit?.trim()) return badRequest('Unidade obrigatória');

    const extras =
      Array.isArray(body.categories) && body.categories.length > 0
        ? body.categories.filter(
            (c) =>
              PRODUCT_CATEGORIES.includes(c as ProductCategory) &&
              c !== body.category,
          )
        : [];
    const categoriesJson = extras.length > 0 ? JSON.stringify(extras) : null;

    const result = await execute(
      `INSERT INTO products (name, category, categories_json, default_unit, notes, active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        body.name.trim().slice(0, 120),
        body.category,
        categoriesJson,
        body.defaultUnit.trim().slice(0, 16),
        body.notes?.trim() || null,
        body.active === false ? 0 : 1,
      ],
    );
    return NextResponse.json(
      { ok: true, id: (result as unknown as { insertId: number }).insertId },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes('Duplicate')) {
      return badRequest('Já existe um produto com esse nome');
    }
    return serverError(err);
  }
}
