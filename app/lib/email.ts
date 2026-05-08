import nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;
  const host = process.env.EMAIL_SERVER_HOST;
  const port = Number(process.env.EMAIL_SERVER_PORT || 587);
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  if (!host || !user || !pass) {
    throw new Error(
      'Email server env vars not set: EMAIL_SERVER_HOST, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD',
    );
  }
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
}

export async function sendMagicLinkEmail(
  to: string,
  link: string,
): Promise<void> {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER;
  if (!from) throw new Error('EMAIL_FROM not set');

  const subject = 'Della Pace · Acesso ao painel administrativo';
  const text = [
    'Olá!',
    '',
    'Você solicitou acesso ao painel da Della Pace.',
    'Clique no link abaixo para entrar (válido por 15 minutos):',
    '',
    link,
    '',
    'Se não foi você, pode ignorar este email — o link expira sozinho.',
    '',
    'Della Pace · Pizzeria Artigianale',
  ].join('\n');

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff; color: #2B4C6B;">
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="font-size: 28px; font-style: italic; margin: 0; color: #2B4C6B;">Della Pace</p>
        <p style="font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: #C9A961; margin: 4px 0 0;">Pizzeria Artigianale</p>
      </div>

      <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px; color: #2B4C6B;">Acesso ao painel</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #2B4C6B; margin: 0 0 24px;">
        Você solicitou acesso ao painel administrativo. Clique no botão abaixo para entrar.
        O link é válido por <strong>15 minutos</strong>.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${link}" style="display: inline-block; background: #2B4C6B; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-size: 14px; font-weight: 500;">
          Entrar no painel
        </a>
      </div>

      <p style="font-size: 12px; color: rgba(43,76,107,0.7); line-height: 1.5; margin: 24px 0 0;">
        Se o botão não funcionar, copie e cole este link no navegador:<br>
        <span style="word-break: break-all; color: #2B4C6B;">${link}</span>
      </p>

      <hr style="border: none; border-top: 1px solid #C9A961; margin: 32px 0;" />

      <p style="font-size: 11px; color: rgba(43,76,107,0.5); line-height: 1.5; margin: 0;">
        Se não foi você que solicitou, pode ignorar este email — o link expira sozinho em 15 minutos e ninguém entra sem ele.
      </p>
    </div>
  `;

  await getTransporter().sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
