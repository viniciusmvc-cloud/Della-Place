import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PostRow = {
  id: number;
  name: string;
  message: string;
  image_data: string | null;
  status: 'pending' | 'approved' | 'hidden';
  show_in_hero: number;
  created_at: Date;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function rowToJson(r: PostRow) {
  return {
    id: r.id,
    name: r.name,
    message: r.message,
    imageData: r.image_data,
    status: r.status,
    showInHero: r.show_in_hero === 1,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope');

    const me = await getCurrentAdmin();

    if (scope === 'hero') {
      const rows = await query<PostRow>(
        `SELECT id, name, message, image_data, status, show_in_hero, created_at
         FROM community_posts
         WHERE status = 'approved' AND show_in_hero = 1 AND image_data IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 8`,
      );
      return NextResponse.json(rows.map(rowToJson));
    }

    if (scope === 'public') {
      const rows = await query<PostRow>(
        `SELECT id, name, message, image_data, status, show_in_hero, created_at
         FROM community_posts
         WHERE status = 'approved'
         ORDER BY created_at DESC
         LIMIT 30`,
      );
      return NextResponse.json(rows.map(rowToJson));
    }

    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rows = await query<PostRow>(
      `SELECT id, name, message, image_data, status, show_in_hero, created_at
       FROM community_posts
       ORDER BY created_at DESC`,
    );
    return NextResponse.json(rows.map(rowToJson));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await safeBody<{
      name: string;
      message: string;
      imageData?: string | null;
    }>(request);
    if (!body || !body.name?.trim() || !body.message?.trim()) {
      return badRequest('Nome e mensagem são obrigatórios');
    }
    const image = body.imageData?.trim() || null;
    if (image && image.length > MAX_IMAGE_BYTES) {
      return badRequest('Imagem muito grande (máx 5MB)');
    }
    if (image && !image.startsWith('data:image/')) {
      return badRequest('Formato de imagem inválido');
    }
    await execute(
      `INSERT INTO community_posts (name, message, image_data, status)
       VALUES (?, ?, ?, 'pending')`,
      [body.name.trim().slice(0, 120), body.message.trim(), image],
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
