import nodemailer from "nodemailer";
import { NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function sendEmail(to: string, subject: string, text: string) {
  if (process.env.EMAIL_ENABLED !== "true") {
    console.info("[email:disabled]", { to, subject, text });
    return { sent: false as const, reason: "EMAIL_ENABLED is not true" };
  }

  const host = process.env.SMTP_HOST;
  if (!host) {
    console.info("[email:missing-smtp]", { to, subject });
    return { sent: false as const, reason: "SMTP_HOST not configured" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@example.com",
    to,
    subject,
    text,
  });

  return { sent: true as const, messageId: info.messageId };
}

export async function notifyUser(input: {
  userId: string;
  title: string;
  body: string;
  linkUrl?: string;
  email?: string | null;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      channel: NotificationChannel.IN_APP,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl,
    },
  });

  let emailMeta: { sent: boolean; reason?: string; messageId?: string } | undefined;
  if (input.email) {
    const result = await sendEmail(input.email, input.title, input.body);
    emailMeta = result;
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        emailSent: result.sent,
        emailMeta: result,
      },
    });
  }

  return { notification, emailMeta };
}
