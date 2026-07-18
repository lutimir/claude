import type { Mailer, MailMessage } from "./types";

/** Dev provider — e-maily sa len logujú do konzoly. */
export function createConsoleMailer(): Mailer {
  return {
    async send(message: MailMessage) {
      console.log(
        `[mail → ${message.to}] ${message.subject}\n${message.text.replace(/^/gm, "  ")}`,
      );
    },
  };
}

/** Resend (https://resend.com) cez HTTP API — bez závislostí. */
export function createResendMailer(apiKey: string, from: string): Mailer {
  return {
    async send(message: MailMessage) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: message.to,
          subject: message.subject,
          text: message.text,
        }),
      });
      if (!res.ok) {
        throw new Error(`Resend API ${res.status}: ${await res.text()}`);
      }
    },
  };
}

/** SMTP cez nodemailer (URL tvaru smtp://user:pass@host:587). */
export function createSmtpMailer(smtpUrl: string, from: string): Mailer {
  // nodemailer sa načítava lenivo — pri iných provideroch sa vôbec nenačíta
  let transporterPromise: Promise<import("nodemailer").Transporter> | undefined;
  return {
    async send(message: MailMessage) {
      transporterPromise ??= import("nodemailer").then((nodemailer) =>
        nodemailer.default.createTransport(smtpUrl),
      );
      const transporter = await transporterPromise;
      await transporter.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    },
  };
}
