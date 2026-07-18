import { createConsoleMailer, createResendMailer, createSmtpMailer } from "./providers";
import type { Mailer } from "./types";

export interface MailerConfig {
  /** console (default) | resend | smtp */
  provider?: string;
  from?: string;
  resendApiKey?: string;
  smtpUrl?: string;
}

function configFromEnv(): MailerConfig {
  return {
    provider: process.env.MAIL_PROVIDER,
    from: process.env.MAIL_FROM,
    resendApiKey: process.env.RESEND_API_KEY,
    smtpUrl: process.env.SMTP_URL,
  };
}

/** Vyrobí mailer podľa konfigurácie (default: env premenné, fallback console). */
export function createMailer(config: MailerConfig = configFromEnv()): Mailer {
  const provider = config.provider?.trim() || "console";

  if (provider === "console") return createConsoleMailer();

  if (provider === "resend") {
    if (!config.resendApiKey) throw new Error("MAIL_PROVIDER=resend vyžaduje RESEND_API_KEY");
    if (!config.from) throw new Error("MAIL_PROVIDER=resend vyžaduje MAIL_FROM");
    return createResendMailer(config.resendApiKey, config.from);
  }

  if (provider === "smtp") {
    if (!config.smtpUrl) throw new Error("MAIL_PROVIDER=smtp vyžaduje SMTP_URL");
    if (!config.from) throw new Error("MAIL_PROVIDER=smtp vyžaduje MAIL_FROM");
    return createSmtpMailer(config.smtpUrl, config.from);
  }

  throw new Error(`Neznámy MAIL_PROVIDER: ${provider} (podporované: console, resend, smtp)`);
}
