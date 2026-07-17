import { log } from "./log";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/**
 * Kostra: e-maily sa iba logujú do konzoly. Reálny poskytovateľ (SMTP/Resend)
 * a double opt-in potvrdenia dopĺňa fáza 3 roadmapy.
 */
export const consoleMailer: Mailer = {
  async send(message) {
    log(`[mail → ${message.to}] ${message.subject} | ${message.text}`);
  },
};
