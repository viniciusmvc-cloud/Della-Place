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
  block_apt: string | null;
};

/**
 * GET /api/customers/by-phone/:phone
 *
 * Localiza um cliente pelo telefone (digits-only). Útil pra o fluxo
 * "Já sou cliente" usar telefone como identificador alternativo ao CPF.
 *
 * O telefone recebido pode vir com máscara — normalizamos pra digits
 * antes de buscar.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ phone: string }> },
) {
  try {
    const { phone } = await context.params;
    const decoded = decodeURIComponent(phone).replace(/\D/g, '');
    if (!decoded) return notFound('Customer not found');

    const row = await queryOne<CustomerRow>(
      'SELECT cpf, full_name, phone, email, address, block_apt FROM customers WHERE phone = ? LIMIT 1',
      [decoded],
    );
    if (!row) return notFound('Customer not found');
    return NextResponse.json({
      cpf: row.cpf,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email ?? '',
      address: row.address,
      blockApt: row.block_apt ?? '',
    });
  } catch (err) {
    return serverError(err);
  }
}
