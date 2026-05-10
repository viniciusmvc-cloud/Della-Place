import { NextResponse } from 'next/server';
import { badRequest, notFound, safeBody, serverError } from '@/lib/api-helpers';
import { execute, queryOne } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CustomerRow = {
  cpf: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string;
  block_apt: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ cpf: string }> },
) {
  try {
    const { cpf } = await context.params;
    const decoded = decodeURIComponent(cpf);
    const row = await queryOne<CustomerRow>(
      'SELECT cpf, full_name, phone, email, address, block_apt FROM customers WHERE cpf = ?',
      [decoded],
    );
    if (!row) return notFound('Customer not found');
    return NextResponse.json({
      cpf: row.cpf,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email ?? '',
      address: row.address,
      blockApt: row.block_apt,
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ cpf: string }> },
) {
  try {
    const { cpf } = await context.params;
    const decoded = decodeURIComponent(cpf);
    const body = await safeBody<{
      fullName?: string;
      phone?: string;
      email?: string;
      address?: string;
      blockApt?: string;
    }>(request);
    if (!body) return badRequest('Invalid body');

    const fields: string[] = [];
    const values: unknown[] = [];
    if (body.fullName !== undefined) {
      fields.push('full_name = ?');
      values.push(body.fullName);
    }
    if (body.phone !== undefined) {
      fields.push('phone = ?');
      values.push(body.phone);
    }
    if (body.email !== undefined) {
      fields.push('email = ?');
      values.push(body.email || null);
    }
    if (body.address !== undefined) {
      fields.push('address = ?');
      values.push(body.address);
    }
    if (body.blockApt !== undefined) {
      fields.push('block_apt = ?');
      values.push(body.blockApt);
    }
    if (fields.length === 0) return NextResponse.json({ ok: true });

    await execute(
      `UPDATE customers SET ${fields.join(', ')} WHERE cpf = ?`,
      [...values, decoded],
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
