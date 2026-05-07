import { NextResponse } from 'next/server';
import { serverError } from '@/lib/api-helpers';
import { execute } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ date: string }> },
) {
  try {
    const { date } = await context.params;
    await execute('DELETE FROM availability WHERE date = ?', [date]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
