import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, queryOne } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const body = await safeBody<{ name?: string; active?: boolean }>(request);
    if (!body) return badRequest('Invalid body');

    const target = await queryOne<{ email: string }>(
      'SELECT email FROM admin_users WHERE id = ?',
      [id],
    );
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (body.active === false && target.email === me.email) {
      return badRequest('Você não pode desativar a si mesmo.');
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    if (body.name !== undefined) {
      fields.push('name = ?');
      values.push(body.name || null);
    }
    if (body.active !== undefined) {
      fields.push('active = ?');
      values.push(body.active ? 1 : 0);
    }
    if (fields.length === 0) return NextResponse.json({ ok: true });
    await execute(
      `UPDATE admin_users SET ${fields.join(', ')} WHERE id = ?`,
      [...values, id],
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const target = await queryOne<{ email: string }>(
      'SELECT email FROM admin_users WHERE id = ?',
      [id],
    );
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (target.email === me.email) {
      return badRequest('Você não pode remover a si mesmo.');
    }

    await execute('DELETE FROM admin_users WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
