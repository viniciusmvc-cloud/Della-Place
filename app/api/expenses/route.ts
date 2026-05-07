import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ExpenseRow = {
  id: string;
  date: Date;
  category: string;
  description: string;
  amount: string;
  recurring: number;
};

function dateToIso(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET() {
  try {
    const rows = await query<ExpenseRow>(
      'SELECT id, date, category, description, amount, recurring FROM expenses ORDER BY date DESC',
    );
    return NextResponse.json(
      rows.map((e) => ({
        id: e.id,
        date: dateToIso(e.date),
        category: e.category,
        description: e.description,
        amount: Number(e.amount),
        recurring: e.recurring === 1,
      })),
    );
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await safeBody<{
      id: string;
      date: string;
      category: string;
      description: string;
      amount: number;
      recurring?: boolean;
    }>(request);
    if (!body || !body.id || !body.date || !body.category) {
      return badRequest('Missing required fields');
    }
    await execute(
      'INSERT INTO expenses (id, date, category, description, amount, recurring) VALUES (?, ?, ?, ?, ?, ?)',
      [
        body.id,
        body.date,
        body.category,
        body.description,
        body.amount,
        body.recurring ? 1 : 0,
      ],
    );
    return NextResponse.json({ ok: true, id: body.id }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
