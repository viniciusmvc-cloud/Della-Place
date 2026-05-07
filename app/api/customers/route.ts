import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query } from '@/lib/db';

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

export async function GET() {
  try {
    const rows = await query<CustomerRow>(
      'SELECT cpf, full_name, phone, email, address, block_apt FROM customers ORDER BY full_name',
    );
    return NextResponse.json(
      rows.map((c) => ({
        cpf: c.cpf,
        fullName: c.full_name,
        phone: c.phone,
        email: c.email ?? '',
        address: c.address,
        blockApt: c.block_apt,
      })),
    );
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await safeBody<{
      cpf: string;
      fullName: string;
      phone: string;
      email?: string;
      address: string;
      blockApt: string;
    }>(request);
    if (!body || !body.cpf || !body.fullName) {
      return badRequest('Missing required fields');
    }

    await execute(
      `INSERT INTO customers (cpf, full_name, phone, email, address, block_apt)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         phone = VALUES(phone),
         email = VALUES(email),
         address = VALUES(address),
         block_apt = VALUES(block_apt)`,
      [
        body.cpf,
        body.fullName,
        body.phone,
        body.email ?? null,
        body.address,
        body.blockApt,
      ],
    );

    return NextResponse.json({ ok: true, cpf: body.cpf }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
