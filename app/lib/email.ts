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

function getFrom(): string {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER;
  if (!from) throw new Error('EMAIL_FROM not set');
  if (from.includes('<')) return from;
  return `Della Pace <${from}>`;
}

function shell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff; color: #2B4C6B;">
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="font-size: 28px; font-style: italic; margin: 0; color: #2B4C6B;">Della Pace</p>
        <p style="font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: #C9A961; margin: 4px 0 0;">Pizzeria Artigianale</p>
      </div>
      <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px; color: #2B4C6B;">${title}</h1>
      ${bodyHtml}
      <hr style="border: none; border-top: 1px solid #C9A961; margin: 32px 0;" />
      <p style="font-size: 11px; color: rgba(43,76,107,0.5); line-height: 1.5; margin: 0;">
        Della Pace · Pizzeria Artigianale · Salvador, BA
      </p>
    </div>
  `;
}

export async function sendPasswordResetEmail(
  to: string,
  link: string,
): Promise<void> {
  const subject = 'Della Pace · Redefinição de senha';
  const text = [
    'Olá!',
    '',
    'Recebemos uma solicitação para redefinir sua senha do painel administrativo.',
    'Clique no link abaixo para escolher uma nova senha (válido por 30 minutos):',
    '',
    link,
    '',
    'Se não foi você quem solicitou, pode ignorar este email — sua senha continua igual.',
    '',
    'Della Pace · Pizzeria Artigianale',
  ].join('\n');

  const html = shell(
    'Redefinir sua senha',
    `
      <p style="font-size: 14px; line-height: 1.6; color: #2B4C6B; margin: 0 0 24px;">
        Recebemos uma solicitação para redefinir sua senha do painel administrativo.
        Clique no botão abaixo para escolher uma nova senha. O link é válido por
        <strong>30 minutos</strong>.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${link}" style="display: inline-block; background: #2B4C6B; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-size: 14px; font-weight: 500;">
          Redefinir senha
        </a>
      </div>

      <p style="font-size: 12px; color: rgba(43,76,107,0.7); line-height: 1.5; margin: 24px 0 0;">
        Se o botão não funcionar, copie e cole este link no navegador:<br>
        <span style="word-break: break-all; color: #2B4C6B;">${link}</span>
      </p>

      <p style="font-size: 12px; color: rgba(43,76,107,0.6); line-height: 1.5; margin: 24px 0 0;">
        Se não foi você quem solicitou, pode ignorar este email — sua senha continua igual.
      </p>
    `,
  );

  await getTransporter().sendMail({
    from: getFrom(),
    to,
    subject,
    text,
    html,
  });
}

export async function sendPasswordChangedEmail(to: string): Promise<void> {
  const subject = 'Della Pace · Senha alterada';
  const text = [
    'Olá!',
    '',
    'Sua senha do painel administrativo foi alterada com sucesso.',
    '',
    'Se NÃO foi você quem alterou, entre em contato imediatamente para revogar o acesso.',
    '',
    'Della Pace · Pizzeria Artigianale',
  ].join('\n');

  const html = shell(
    'Senha alterada',
    `
      <p style="font-size: 14px; line-height: 1.6; color: #2B4C6B; margin: 0 0 16px;">
        Sua senha do painel administrativo foi alterada com sucesso.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #2B4C6B; margin: 0 0 24px;">
        Data e hora: <strong>${new Date().toLocaleString('pt-BR', { timeZone: 'America/Bahia' })}</strong>
      </p>

      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <p style="font-size: 13px; color: #991b1b; margin: 0; line-height: 1.5;">
          <strong>Se NÃO foi você</strong> quem alterou esta senha, entre em contato
          imediatamente com outro administrador para revogar o acesso.
        </p>
      </div>
    `,
  );

  await getTransporter().sendMail({
    from: getFrom(),
    to,
    subject,
    text,
    html,
  });
}
