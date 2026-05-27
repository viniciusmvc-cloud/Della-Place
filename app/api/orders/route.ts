import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query, transaction } from '@/lib/db';

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

    // ─── Validação de deadline ────────────────────────────────────────
    // Se a data tem order_deadline_at definido e já passou, bloqueia o pedido.
    // Override: header X-Admin-Bypass-Deadline=1 pra forçar criação pós-deadline
    // (esperado apenas para fluxo admin futuro). Hoje só o site público chama
    // este endpoint, então esse caminho é a porta pública.
    const bypass = request.headers.get('x-admin-bypass-deadline') === '1';
    if (!bypass && body.date) {
      try {
        const availRow = await query<{ order_deadline_at: Date | null }>(
          'SELECT order_deadline_at FROM availability WHERE date = ?',
          [body.date],
        );
        if (availRow.length === 0) {
          return badRequest(
            `A data ${body.date} não está aberta para pedidos.`,
          );
        }
        const deadlineRaw = availRow[0]?.order_deadline_at;
        if (deadlineRaw) {
          const deadline = new Date(deadlineRaw);
          if (Date.now() > deadline.getTime()) {
            const deadlineStr = deadline.toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });
            const dateStr = new Date(`${body.date}T12:00:00`).toLocaleDateString(
              'pt-BR',
              { day: '2-digit', month: '2-digit' },
            );
            return NextResponse.json(
              {
                error: `Pedidos para ${dateStr} foram fechados em ${deadlineStr}.`,
                code: 'deadline_expired',
              },
              { status: 400 },
            );
          }
        }
      } catch (err) {
        // Se a coluna ainda não foi migrada, segue sem validar deadline.
        const msg = err instanceof Error ? err.message : String(err);
        if (!/order_deadline_at|Unknown column/i.test(msg)) throw err;
      }
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

    notifyAdminsNewOrder({
      customerName: body.customer.fullName,
      total: body.total,
      itemsCount: body.items.length,
      date: body.date,
      firstTime: body.items[0]?.time ?? null,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: body.id }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

type AdminSub = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function notifyAdminsNewOrder(payload: {
  customerName: string;
  total: number;
  itemsCount: number;
  date: string;
  firstTime: string | null;
}) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contato@dellapace.com.br',
    publicKey,
    privateKey,
  );

  const subs = await query<AdminSub>(
    `SELECT id, endpoint, p256dh, auth
       FROM push_subscriptions
      WHERE active = 1 AND role = 'admin'`,
  );
  if (subs.length === 0) return;

  const dateLabel = new Date(`${payload.date}T12:00:00`).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: '2-digit' },
  );
  const body = JSON.stringify({
    title: '🍕 Novo pedido na Della Pace',
    body:
      `${payload.customerName} reservou ${payload.itemsCount} pizza${payload.itemsCount > 1 ? 's' : ''}` +
      ` para ${dateLabel}${payload.firstTime ? ` às ${payload.firstTime}` : ''}.` +
      ` Total: R$ ${payload.total}.`,
    url: '/admin/pedidos',
    tag: 'new-order',
  });

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body,
          { TTL: 60 * 60 * 6 },
        );
      } catch (err: unknown) {
        const status =
          err && typeof err === 'object' && 'statusCode' in err
            ? Number((err as { statusCode: number }).statusCode)
            : 0;
        if (status === 404 || status === 410) {
          await execute(
            'UPDATE push_subscriptions SET active = 0 WHERE id = ?',
            [s.id],
          );
        }
      }
    }),
  );
}
