import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

export type SendResult = {
  previewUrl?: string;
  messageId: string;
};

let devTransport: Transporter | null = null;
let etherealAccount: { user: string; pass: string } | null = null;

async function getDevTransport(): Promise<Transporter> {
  if (devTransport) return devTransport;

  etherealAccount = await nodemailer.createTestAccount();
  devTransport = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: etherealAccount.user, pass: etherealAccount.pass },
  });
  return devTransport;
}

function getProdTransport(): Transporter {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP_HOST / SMTP_USER / SMTP_PASS must be set in production. " +
        "(Resend setup deferred — see docs/PLAN.md §5 D8.)",
    );
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<SendResult> {
  const from = process.env.EMAIL_FROM ?? "Stakeholders <no-reply@stakeholders.local>";
  const isProd = process.env.NODE_ENV === "production";

  const transporter = isProd ? getProdTransport() : await getDevTransport();
  const info = await transporter.sendMail({ from, to, subject, text, html });

  let previewUrl: string | undefined;
  if (!isProd) {
    const raw = nodemailer.getTestMessageUrl(info);
    previewUrl = typeof raw === "string" ? raw : undefined;
  }
  return { messageId: info.messageId, previewUrl };
}