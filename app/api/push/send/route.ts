import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SubRow = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type SendBody = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:contato@dellapace.com.br';
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys ausentes nas env vars');
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function POST(request: Request) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await safeBody<SendBody>(request);
    if (!body || !body.title?.trim() || !body.body?.trim()) {
      return badRequest('title e body são obrigatórios');
    }

    configureWebPush();

    const subs = await query<SubRow>(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE active = 1',
    );

    const payload = JSON.stringify({
      title: body.title.trim().slice(0, 80),
      body: body.body.trim().slice(0, 240),
      url: body.url?.trim() || '/',
      tag: body.tag?.trim() || 'della-pace',
    });

    let success = 0;
    let gone = 0;
    let failed = 0;

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            payload,
            { TTL: 60 * 60 * 24 },
          );
          success += 1;
          await execute(
            'UPDATE push_subscriptions SET last_used_at = NOW() WHERE id = ?',
            [s.id],
          );
        } catch (err: unknown) {
          const status =
            err && typeof err === 'object' && 'statusCode' in err
              ? Number((err as { statusCode: number }).statusCode)
              : 0;
          if (status === 404 || status === 410) {
            gone += 1;
            await execute(
              'UPDATE push_subscriptions SET active = 0 WHERE id = ?',
              [s.id],
            );
          } else {
            failed += 1;
          }
        }
      }),
    );

    return NextResponse.json({ ok: true, total: subs.length, success, gone, failed });
  } catch (err) {
    return serverError(err);
  }
}
