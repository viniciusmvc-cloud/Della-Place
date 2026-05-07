import { NextResponse } from 'next/server';
import { notFound, serverError } from '@/lib/api-helpers';
import { queryOne } from '@/lib/db';

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
