import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_STATUS = ['pending', 'approved', 'hidden'] as const;
type PostStatus = (typeof ALLOWED_STATUS)[number];

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
      status?: PostStatus;
      showInHero?: boolean;
    }>(request);
    if (!body) return badRequest('Corpo vazio');

    const fragments: string[] = [];
    const values: unknown[] = [];

    if (body.status !== undefined) {
      if (!ALLOWED_STATUS.includes(body.status)) {
        return badRequest('status inválido');
      }
      fragments.push('status = ?');
      values.push(body.status);
    }
    if (body.showInHero !== undefined) {
      fragments.push('show_in_hero = ?');
      values.push(body.showInHero ? 1 : 0);
    }
    if (fragments.length === 0) return badRequest('Nada para atualizar');

    values.push(numId);
    await execute(
      `UPDATE community_posts SET ${fragments.join(', ')} WHERE id = ?`,
      values,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
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

    await execute('DELETE FROM community_posts WHERE id = ?', [numId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
