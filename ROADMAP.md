# Roadmapa App0

Projekt je rozdelený na fázy. Každá fáza má **hotový prompt na skopírovanie** —
otvor novú session (Fable 5, Opus alebo iný model), vlož prompt a pokračuj.
Fázy na seba nadväzujú, ale 5, 6, 7 a 10 sa dajú robiť v ľubovoľnom poradí.

Po dokončení fázy: odškrtni ju tu, uprav "Stav" a commitni.

---

## ✅ Fáza 0 — Kostra (hotová)

Monorepo (pnpm), Next.js 15 web so slovenským UI (i18n-ready, next-intl),
worker s denným cron importom, Drizzle schéma (obchody, feedy, produkty, ponuky,
história cien, alarmy, recenzie), Heureka XML parser s testami, EAN párovanie
s validáciou kontrolnej číslice, compliance model (právny základ + súhlas +
identifikačný User-Agent), full-text vyhľadávanie bez diakritiky, admin sekcia
(Basic auth), SVG graf histórie cien, seed s demo katalógom, Docker + CI.

---

## ✅ Fáza 1 — Onboarding reálnych obchodov (hotová)

Admin CRUD pre obchody a feedy (server actions + zod), validátor feedu
s náhľadom (položky, EAN štatistiky, varovania) pred uložením, evidencia
súhlasu (dátum + poznámka + kontaktná osoba, `consent_contact`), manuálny
import cez frontu `import_jobs` (worker ju spracúva každých 30 s, FOR UPDATE
SKIP LOCKED), auto-refresh stránky importov. `fetchFeedXml` presunutý do
`packages/core` (zdieľa ho worker aj web). Overené E2E cez Playwright:
obchod → feed → validácia → uloženie → import → produkt na webe.

---

## ✅ Fáza 2 — História cien naplno (hotová)

Tabuľka `product_price_daily` (denné min/avg/počet ponúk na produkt a menu) —
snapshot po každom importe (cron aj manuálne joby), backfill z price_history
(`aggregate-backfill`), retencia surových záznamov 400 dní (`prune-history`).
Interaktívny SVG graf bez knižníc: tooltip (deň, najnižšia cena, priemer
ponúk), prepínač 30/90/365 dní. "Bežná cena" = 30-dňový priemer denných miním
(min. 5 dní dát) — detail produktu ukazuje % pod/nad bežnou cenou (detekcia
falošných zliav), homepage sekciu "Najväčšie poklesy cien" s preškrtnutou
bežnou cenou. Overené E2E cez Playwright.

---

## ✅ Fáza 3 — Cenové alarmy end-to-end (hotová)

Mail modul v `packages/core`: provider cez `MAIL_PROVIDER` env — console (dev),
Resend (HTTP API bez závislostí), SMTP (nodemailer, lenivo načítaný). Double
opt-in: alarm vzniká nepotvrdený, potvrdzuje sa odkazom z e-mailu
(`/alarm/[token]?akcia=potvrdit`); opakované nastavenie len aktualizuje cieľovú
cenu. Stránka správy alarmu `/alarm/[token]`: stav, potvrdenie, "strážiť znova"
po notifikácii, zrušenie (vymaže e-mail). Notifikácia obsahuje ponuku aj odkaz
na správu. Slovenské šablóny (core/mail/templates), rate limit 5 alarmov/IP/h.
Overené E2E: formulár → e-mail → potvrdenie → pokles ceny → notifikácia →
re-arm → zrušenie → rate limit.

---

## ✅ Fáza 4 — Fuzzy párovanie a fronta párovania (hotová)

Worker po každom importe navrhuje kandidátov pre nespárované ponuky: skóre =
greatest(similarity, word_similarity) nad unaccent+lower názvami — word_similarity
zvláda dlhé názvy ponúk s "omáčkou" okolo názvu produktu. Auto-párovanie
(matched_fuzzy) len pri prísnej plnej similarity ≥ 0.85 (prahy konfigurovateľné
cez FUZZY_AUTO_THRESHOLD / FUZZY_CANDIDATE_THRESHOLD). Admin fronta
/admin/parovanie: kandidáti so skóre v %, Spárovať (matched_manual) / Zamietnuť
(blocklist match_rejections — pár sa už nikdy nenavrhne). Trigram index nad
normalizovanými názvami, CLI match-candidates. Overené E2E vrátane blocklistu
po opakovanom behu.

---

## ✅ Fáza 5 — Porovnanie parametrov produktov (hotová)

Číselník aliasov (`param_aliases`, alias normalizovaný lower+bez diakritiky →
kanonický názov) a `mergeComparisonParams` v core: kľúče parametrov sa
normalizujú a zlučujú ("Úložisko" a "Pamäť" = jeden riadok), riadky sa radia
podľa vyplnenosti, zhodné sú tlmené a rozdielové zvýraznené. Výber cez ⇄
prepínač na kartách produktov — stav žije v URL (?porovnat=1,2, max 4),
plávajúca lišta s CTA. Stránka /porovnat?ids=… s tabuľkou, cenami, odoberaním
produktov a trvalým odkazom; SEO stránky /porovnat/a-vs-b s generovaným
title/description a canonical. "Porovnaj s podobnými" chipy na detaile
produktu (interné prelinkovanie). Overené E2E (15 kontrol).

---

## ✅ Fáza 6 — Hodnotenia obchodov (hotová)

Verejná stránka obchodu /obchod/[slug]: agregovaný rating (hviezdičky, priemer,
počet), schválené recenzie a formulár hodnotenia (1–5★, text, e-mail sa nikdy
nezverejňuje). Trojstupňový flow: e-mail verifikácia tokenom (/recenzia/[token])
→ moderácia v admine (/admin/recenzie, schváliť/zamietnuť) → zverejnenie.
Anti-spam: honeypot pole (bot dostane falošný úspech) + rate limit 3/IP/h.
Rating obchodu sa zobrazuje aj pri ponukách na detaile produktu s odkazom na
stránku obchodu. Seed obsahuje ukážkové recenzie. Overené E2E (16 kontrol
vrátane honeypotu a zamietnutia).

---

## ✅ Fáza 7 — SEO a výkon (hotová)

sitemap.xml a robots.txt generované z DB (produkty, kategórie, obchody; /admin,
/alarm, /recenzia, /hladat mimo indexu), metadataBase + canonical + OpenGraph
na všetkých verejných stránkach, JSON-LD na detaile produktu (Product s gtin13,
Brand a AggregateOffer + BreadcrumbList), vyhľadávanie noindex. Cache vrstva:
katalógové dotazy cez unstable_cache (TTL 5 min, tag "catalog") — hlavný dotaz
produktu s ponukami ostáva live (čerstvé ceny); worker invaliduje cache po
importe cez POST /api/revalidate (REVALIDATE_SECRET). Stránkovanie kategórií
aj vyhľadávania (?strana, limit+1 bez COUNT). ILIKE zladené s trigram indexom
(lower + LIKE). Overené E2E (16 kontrol vrátane validného JSON-LD).

---

## ✅ Fáza 8 — Český trh (hotová)

Locale routing next-intl (sk bez prefixu, /cs pre češtinu; localePrefix
as-needed), kompletné cs.json preklady (admin ostáva zámerne po slovensky),
kombinovaný middleware (Basic auth pre /admin + intl routing), prepínač SK/CZ
v hlavičke. Mena je prvotriedny parameter: sk→EUR, cs→CZK naprieč kartami,
vyhľadávaním, kategóriami, poklesmi cien, grafom, bežnou cenou aj cenovými
alarmami (alarm nesie menu, formulár ju posiela). CZK sa formátuje cez cs-CZ
("Kč"). JSON-LD nesie menu podľa locale, hreflang sk/cs, sitemap obsahuje
obe verzie. Seed má český demo obchod (TechArena.cz, CZK ceny + história).
Overené E2E (19 kontrol).

---

## ⬜ Fáza 9 — Produkčný deploy

**Cieľ:** beh na VPS, pripravené na verejnú prevádzku.
**Rozsah:** CI/CD pipeline (build + test + deploy cez GitHub Actions na VPS),
HTTPS reverse proxy (Caddy/Traefik), automatické migrácie pri deployi, zálohy
PostgreSQL, healthchecky a monitoring (uptime + error tracking), finálne právne
texty od právnika, cookies lišta ak bude treba.
**Hotové keď:** push na main automaticky nasadí na VPS s HTTPS a zálohami.

**Prompt:**
```text
Pokračuj v projekte App0 (pozri README.md a ROADMAP.md — Fáza 9). Priprav produkčný
deploy na VPS: GitHub Actions workflow (test → build → deploy cez SSH + docker
compose -f docker-compose.prod.yml), Caddy ako HTTPS reverse proxy, spúšťanie
migrácií pri deployi, denné zálohy PostgreSQL s rotáciou, healthcheck endpointy
pre web aj worker a základný monitoring. Skontroluj produkčné poistky (secrets,
limity, logy). Po dokončení aktualizuj ROADMAP.md a commitni.
```

---

## ⬜ Fáza 10 — Používateľské účty

**Cieľ:** prihlásenie a personalizácia.
**Rozsah:** auth (e-mail + heslo alebo magic link), obľúbené produkty, správa
vlastných alarmov, história prezeraných, prepojenie anonymných alarmov s účtom.
**Hotové keď:** používateľ sa prihlási a spravuje si obľúbené aj alarmy.

**Prompt:**
```text
Pokračuj v projekte App0 (pozri README.md a ROADMAP.md — Fáza 10). Pridaj
používateľské účty: auth cez magic link (využi existujúci Mailer), tabuľky users
a favorites, stránka účtu so správou cenových alarmov a obľúbených produktov,
prepojenie existujúcich alarmov podľa e-mailu pri registrácii. Admin Basic auth
nahraď rolou v účte. Po dokončení aktualizuj ROADMAP.md a commitni.
```

---

## ⬜ Fáza 11 — Monetizácia

**Cieľ:** príjmy bez poškodenia dôvery.
**Rozsah:** affiliate podpora (šablóny deep-linkov per obchod / affiliate sieť),
meranie preklikov (interná redirect route /presmeruj/:offerId so štatistikou),
reporting v admine, označenie affiliate odkazov podľa legislatívy.
**Hotové keď:** prekliky sa merajú a affiliate linky sa generujú tam, kde existujú.

**Prompt:**
```text
Pokračuj v projekte App0 (pozri README.md a ROADMAP.md — Fáza 11). Priprav
monetizáciu: redirect route /presmeruj/[offerId] s logovaním preklikov (tabuľka
clicks), šablóny affiliate deep-linkov per obchod (konfigurácia v DB, fallback na
priamy link), reporting preklikov v admine a korektné označenie komerčných odkazov
(rel="sponsored" už je v OffersTable). Po dokončení aktualizuj ROADMAP.md a commitni.
```

---

## Technické dlhy a poznámky (priebežne)

- Import robí per-položku SELECT+UPSERT — pri veľkých feedoch (>50k položiek)
  prejsť na dávkové upserty (fáza 1 alebo 2).
- Vyhľadávanie pokrýva len názov produktu — rozšíriť o značku, kategóriu
  a popis (fáza 7).
- Stránky sú dynamické s cachovanou dátovou vrstvou (TTL + tag invalidácia);
  plný ISR/PPR by vyžadoval DB pri builde — zvážiť pri fáze 9 (deploy).
- Kategórie sa z feedov zakladajú ploché (najhlbší segment) — strom rieši fáza 1.
- E-maily sú konzolový stub — rieši fáza 3.
- `pnpm audit` spúšťať priebežne; verzie závislostí sú pinnuté v pnpm-lock.yaml.
