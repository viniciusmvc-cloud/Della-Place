import { NextResponse } from 'next/server';
import { serverError } from '@/lib/api-helpers';
import { execute } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await execute('DELETE FROM expenses WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
