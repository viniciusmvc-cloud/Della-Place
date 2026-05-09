import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute } from '@/lib/db';
import { PRODUCT_CATEGORIES, type ProductCategory } from '@/lib/products';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isFinite(numId)) return badRequest('ID inválido');

    const body = await safeBody<{
      name?: string;
      category?: ProductCategory;
      categories?: ProductCategory[];
      defaultUnit?: string;
      notes?: string;
      active?: boolean;
    }>(request);
    if (!body) return badRequest('Corpo vazio');

    const fragments: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      if (!body.name.trim()) return badRequest('Nome inválido');
      fragments.push('name = ?');
      values.push(body.name.trim().slice(0, 120));
    }
    if (body.category !== undefined) {
      if (!PRODUCT_CATEGORIES.includes(body.category)) {
        return badRequest('Categoria inválida');
      }
      fragments.push('category = ?');
      values.push(body.category);
    }
    if (body.categories !== undefined) {
      const primary = body.category;
      const extras = Array.isArray(body.categories)
        ? body.categories.filter(
            (c) =>
              PRODUCT_CATEGORIES.includes(c as ProductCategory) &&
              c !== primary,
          )
        : [];
      fragments.push('categories_json = ?');
      values.push(extras.length > 0 ? JSON.stringify(extras) : null);
    }
    if (body.defaultUnit !== undefined) {
      if (!body.defaultUnit.trim()) return badRequest('Unidade inválida');
      fragments.push('default_unit = ?');
      values.push(body.defaultUnit.trim().slice(0, 16));
    }
    if (body.notes !== undefined) {
      fragments.push('notes = ?');
      values.push(body.notes.trim().slice(0, 255) || null);
    }
    if (body.active !== undefined) {
      fragments.push('active = ?');
      values.push(body.active ? 1 : 0);
    }

    if (fragments.length === 0) return badRequest('Nada para atualizar');

    values.push(numId);
    await execute(
      `UPDATE products SET ${fragments.join(', ')} WHERE id = ?`,
      values,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Duplicate')) {
      return badRequest('Já existe um produto com esse nome');
    }
    return serverError(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isFinite(numId)) return badRequest('ID inválido');

    try {
      await execute('DELETE FROM products WHERE id = ?', [numId]);
      return NextResponse.json({ ok: true });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('foreign key') ||
          err.message.includes('a foreign key constraint fails'))
      ) {
        await execute('UPDATE products SET active = 0 WHERE id = ?', [numId]);
        return NextResponse.json({
          ok: true,
          softDeleted: true,
          message: 'Produto tem compras associadas; foi desativado em vez de apagado.',
        });
      }
      throw err;
    }
  } catch (err) {
    return serverError(err);
  }
}
