import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { query, transaction } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OrderRow = {
  id: string;
  customer_cpf: string;
  delivery_date: Date;
  total: string;
  notes: string | null;
  status: 'pendente' | 'confirmado' | 'pago' | 'cancelado';
  created_at: Date;
  full_name: string;
  phone: string;
  email: string | null;
  address: string;
  block_apt: string;
};

type OrderItemRow = {
  id: number;
  order_id: string;
  time_slot: string;
  flavor: string;
  finish: 'Assada' | 'Pré-assada' | 'Congelada';
  price: string;
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
    const orders = await query<OrderRow>(
      `SELECT o.id, o.customer_cpf, o.delivery_date, o.total, o.notes, o.status, o.created_at,
              c.full_name, c.phone, c.email, c.address, c.block_apt
         FROM orders o
         JOIN customers c ON c.cpf = o.customer_cpf
        ORDER BY o.created_at DESC`,
    );
    const items = await query<OrderItemRow>(
      'SELECT id, order_id, time_slot, flavor, finish, price FROM order_items ORDER BY time_slot',
    );

    return NextResponse.json(
      orders.map((o) => ({
        id: o.id,
        createdAt: new Date(o.created_at).toISOString(),
        date: dateToIso(o.delivery_date),
        customer: {
          cpf: o.customer_cpf,
          fullName: o.full_name,
          phone: o.phone,
          email: o.email ?? '',
          address: o.address,
          blockApt: o.block_apt,
        },
        items: items
          .filter((it) => it.order_id === o.id)
          .map((it) => ({
            time: it.time_slot,
            flavor: it.flavor,
            finish: it.finish,
            price: Number(it.price),
          })),
        total: Number(o.total),
        notes: o.notes ?? '',
        status: o.status,
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
      customer: {
        cpf: string;
        fullName: string;
        phone: string;
        email?: string;
        address: string;
        blockApt: string;
      };
      items: { time: string; flavor: string; finish: string; price: number }[];
      total: number;
      notes?: string;
    }>(request);
    if (!body || !body.id || !body.customer?.cpf || !body.items?.length) {
      return badRequest('Missing required fields');
    }

    await transaction(async (conn) => {
      await conn.query(
        `INSERT INTO customers (cpf, full_name, phone, email, address, block_apt)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           full_name = VALUES(full_name),
           phone = VALUES(phone),
           email = VALUES(email),
           address = VALUES(address),
           block_apt = VALUES(block_apt)`,
        [
          body.customer.cpf,
          body.customer.fullName,
          body.customer.phone,
          body.customer.email ?? null,
          body.customer.address,
          body.customer.blockApt,
        ],
      );

      await conn.query(
        `INSERT INTO orders (id, customer_cpf, delivery_date, total, notes, status)
         VALUES (?, ?, ?, ?, ?, 'pendente')`,
        [
          body.id,
          body.customer.cpf,
          body.date,
          body.total,
          body.notes ?? null,
        ],
      );

      for (const item of body.items) {
        await conn.query(
          `INSERT INTO order_items (order_id, time_slot, flavor, finish, price)
           VALUES (?, ?, ?, ?, ?)`,
          [body.id, item.time, item.flavor, item.finish, item.price],
        );
      }
    });

    return NextResponse.json({ ok: true, id: body.id }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
