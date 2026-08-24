import nodemailer from "nodemailer";

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  user: string;
  pass: string;
}

export function getEmailConfig(): EmailConfig {
  return {
    smtpHost: process.env.SMTP_HOST || "smtp.office365.com",
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    smtpSecure: process.env.SMTP_SECURE === "true",
    user: process.env.EMAIL_USER || "pannontransfer@pannonguard.hu",
    pass: process.env.EMAIL_PASS || "",
  };
}

export function createTransporter() {
  const config = getEmailConfig();
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const config = getEmailConfig();
  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: options.from || `Pannon Transfer <${config.user}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo || config.user,
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ismeretlen email hiba.",
    };
  }
}

export async function testSmtpConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: "SMTP kapcsolat rendben van." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Ismeretlen SMTP hiba.",
    };
  }
}
