import { describe, expect, it } from "vitest";
import { createMailer } from "../src/mail/factory";
import { buildAlertConfirmationEmail, buildPriceDropEmail } from "../src/mail/templates";

describe("createMailer", () => {
  it("bez konfigurácie vráti console mailer", () => {
    expect(createMailer({})).toBeDefined();
    expect(createMailer({ provider: "console" })).toBeDefined();
  });

  it("resend vyžaduje API kľúč a odosielateľa", () => {
    expect(() => createMailer({ provider: "resend" })).toThrow(/RESEND_API_KEY/);
    expect(() => createMailer({ provider: "resend", resendApiKey: "re_x" })).toThrow(/MAIL_FROM/);
    expect(
      createMailer({ provider: "resend", resendApiKey: "re_x", from: "App0 <a@b.sk>" }),
    ).toBeDefined();
  });

  it("smtp vyžaduje URL a odosielateľa", () => {
    expect(() => createMailer({ provider: "smtp" })).toThrow(/SMTP_URL/);
    expect(
      createMailer({ provider: "smtp", smtpUrl: "smtp://u:p@host:587", from: "a@b.sk" }),
    ).toBeDefined();
  });

  it("neznámy provider zlyhá zrozumiteľne", () => {
    expect(() => createMailer({ provider: "holub" })).toThrow(/Neznámy MAIL_PROVIDER/);
  });
});

describe("šablóny e-mailov", () => {
  it("potvrdenie alarmu obsahuje produkt, cenu a odkaz", () => {
    const mail = buildAlertConfirmationEmail({
      productName: "Sony WH-1000XM5",
      targetPrice: "300.00",
      currency: "EUR",
      confirmUrl: "https://app0.sk/alarm/tok-1?akcia=potvrdit",
    });
    expect(mail.subject).toContain("Sony WH-1000XM5");
    expect(mail.text).toContain("300.00 EUR");
    expect(mail.text).toContain("https://app0.sk/alarm/tok-1?akcia=potvrdit");
  });

  it("notifikácia o poklese obsahuje ponuku aj správu alarmu", () => {
    const mail = buildPriceDropEmail({
      productName: "Sony WH-1000XM5",
      price: "289.00",
      currency: "EUR",
      targetPrice: "300.00",
      offerUrl: "https://obchod.example/xm5",
      manageUrl: "https://app0.sk/alarm/tok-1",
    });
    expect(mail.subject).toContain("289.00 EUR");
    expect(mail.text).toContain("https://obchod.example/xm5");
    expect(mail.text).toContain("https://app0.sk/alarm/tok-1");
  });
});
