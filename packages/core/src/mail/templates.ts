/** Slovenské šablóny e-mailov cenových alarmov (zatiaľ plain-text). */

export interface AlertConfirmationParams {
  productName: string;
  targetPrice: string;
  currency: string;
  confirmUrl: string;
}

export function buildAlertConfirmationEmail(params: AlertConfirmationParams): {
  subject: string;
  text: string;
} {
  return {
    subject: `Potvrď cenový alarm: ${params.productName}`,
    text:
      `Ahoj,\n\n` +
      `chceš strážiť cenu produktu ${params.productName} — dáme ti vedieť, ` +
      `keď klesne na ${params.targetPrice} ${params.currency} alebo nižšie.\n\n` +
      `Alarm potvrdíš kliknutím na tento odkaz:\n${params.confirmUrl}\n\n` +
      `Ak si alarm nenastavil(a) ty, tento e-mail pokojne ignoruj — ` +
      `bez potvrdenia sa nič diať nebude a údaje sa dajú kedykoľvek vymazať.\n`,
  };
}

export interface ReviewVerificationParams {
  shopName: string;
  verifyUrl: string;
}

export function buildReviewVerificationEmail(params: ReviewVerificationParams): {
  subject: string;
  text: string;
} {
  return {
    subject: `Potvrď svoje hodnotenie obchodu ${params.shopName}`,
    text:
      `Ahoj,\n\n` +
      `napísal(a) si hodnotenie obchodu ${params.shopName}. Aby sme mali istotu, ` +
      `že hodnotenia píšu skutoční ľudia, potvrď ho kliknutím na tento odkaz:\n` +
      `${params.verifyUrl}\n\n` +
      `Po overení hodnotenie skontroluje moderátor a následne sa zverejní.\n\n` +
      `Ak si hodnotenie nepísal(a) ty, tento e-mail ignoruj — nič sa nezverejní.\n`,
  };
}

export interface PriceDropParams {
  productName: string;
  price: string;
  currency: string;
  targetPrice: string;
  offerUrl: string;
  manageUrl: string;
}

export function buildPriceDropEmail(params: PriceDropParams): { subject: string; text: string } {
  return {
    subject: `Cena klesla: ${params.productName} je za ${params.price} ${params.currency}`,
    text:
      `Dobrá správa!\n\n` +
      `Produkt ${params.productName} klesol na ${params.price} ${params.currency} ` +
      `(tvoja cieľová cena: ${params.targetPrice} ${params.currency}).\n\n` +
      `Ponuka: ${params.offerUrl}\n\n` +
      `Alarm môžeš spravovať alebo zrušiť tu:\n${params.manageUrl}\n`,
  };
}

export interface MagicLinkParams {
  loginUrl: string;
}

export function buildMagicLinkEmail(params: MagicLinkParams): { subject: string; text: string } {
  return {
    subject: "Prihlásenie do App0",
    text:
      `Ahoj,\n\nprihlásiš sa kliknutím na tento odkaz (platí 15 minút):\n` +
      `${params.loginUrl}\n\nAk si prihlásenie nevyžiadal(a) ty, e-mail ignoruj.\n`,
  };
}
