import { NextResponse } from 'next/server';
import {
  consumeMagicToken,
  isAllowedAdmin,
  setSessionCookie,
} from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const failUrl = `${url.origin}/login?error=invalid`;
  if (!token) return NextResponse.redirect(failUrl);

  const email = await consumeMagicToken(token);
  if (!email) return NextResponse.redirect(failUrl);

  if (!(await isAllowedAdmin(email))) {
    return NextResponse.redirect(`${url.origin}/login?error=denied`);
  }

  await setSessionCookie(email);
  return NextResponse.redirect(`${url.origin}/admin`);
}
