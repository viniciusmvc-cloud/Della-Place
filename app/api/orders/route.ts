// /api/orders/route.ts - VERSÃO CORRIGIDA COM VALIDAÇÃO DE DEADLINE
// ✅ NOVO: Valida se o pedido está dentro do deadline antes de aceitar

// Esta é uma versão PARCIAL mostrando ONDE adicionar o código
// Copie a seção ✅ NOVO e cole no seu arquivo original

import { NextRequest, NextResponse } from 'next/server';
import { query, execute, transaction } from '@/lib/db';

// ... seu código existente de tipos e helpers ...

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id: string;
      date: string;
      customer?: { cpf: string };
      items?: unknown[];
      // ... outros campos ...
    };

    // Validar campos obrigatórios
    if (!body || !body.date || !body.customer?.cpf || !body.items?.length) {
      return NextResponse.json(
        { error: 'Faltam campos obrigatórios' },
        { status: 400 }
      );
    }

    // ✅ NOVO: ADICIONE ISTO AQUI (antes de inserir o pedido)
    // Verificar se a data está aberta para pedidos
    const availRow = await query<{ order_deadline_at: Date | null }>(
      'SELECT order_deadline_at FROM availability WHERE date = ?',
      [body.date]
    );

    if (availRow.length === 0) {
      return NextResponse.json(
        { error: 'Data não está aberta para pedidos' },
        { status: 400 }
      );
    }

    // ✅ NOVO: Se tem deadline definido, verificar se ainda está no horário
    if (availRow[0].order_deadline_at) {
      const now = new Date();
      const deadline = new Date(availRow[0].order_deadline_at);

      if (now > deadline) {
        const deadlineStr = deadline.toLocaleString('pt-BR');
        const dateStr = new Date(`${body.date}T12:00:00`).toLocaleDateString('pt-BR');

        return NextResponse.json(
          {
            error: `Pedidos para ${dateStr} foram fechados em ${deadlineStr}`,
          },
          { status: 400 }
        );
      }
    }
    // ✅ FIM DO CÓDIGO NOVO

    // ... resto do seu código de inserção (inalterado) ...
    // Exemplo:
    // await transaction(async (conn) => {
    //   await conn.execute(
    //     'INSERT INTO orders (id, date, customer_cpf, ...) VALUES (?, ?, ?, ...)',
    //     [body.id, body.date, body.customer.cpf, ...]
    //   );
    // });

    return NextResponse.json({ ok: true, id: body.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    return NextResponse.json(
      { error: 'Erro ao salvar pedido' },
      { status: 500 }
    );
  }
}
