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

## ⬜ Fáza 5 — Porovnanie parametrov produktov

**Cieľ:** tabuľkové porovnanie 2–4 produktov.
**Rozsah:** normalizácia názvov parametrov (číselník + aliasy), stránka
/porovnat?ids=..., výber produktov na porovnanie (checkbox na kartách, stav v URL),
zvýraznenie rozdielov, SEO stránky "X vs Y".
**Hotové keď:** dva produkty sa dajú porovnať vedľa seba so zvýraznenými rozdielmi.

**Prompt:**
```text
Pokračuj v projekte App0 (pozri README.md a ROADMAP.md — Fáza 5). Sprav porovnanie
produktov: normalizácia parametrov (mapovacia tabuľka aliasov názvov parametrov),
stránka /porovnat?ids=1,2,3 s tabuľkou parametrov vedľa seba a zvýraznením
rozdielov, pridávanie do porovnania z kariet produktov (bez účtu, stav v URL),
a SEO friendly stránky /porovnat/slug-a-vs-slug-b. Po dokončení aktualizuj
ROADMAP.md a commitni.
```

---

## ⬜ Fáza 6 — Hodnotenia obchodov

**Cieľ:** dôveryhodnosť obchodov.
**Rozsah:** formulár recenzie s e-mail verifikáciou (tabuľka shop_reviews so
statusom už existuje), moderácia v admine, agregovaný rating pri ponukách,
anti-spam (rate limit, honeypot).
**Hotové keď:** overená recenzia sa po schválení zobrazuje pri obchode.

**Prompt:**
```text
Pokračuj v projekte App0 (pozri README.md a ROADMAP.md — Fáza 6). Sprav hodnotenia
obchodov: verejný formulár s overením e-mailu, moderácia (schváliť/zamietnuť)
v admine, agregovaný rating obchodu zobrazený v tabuľke ponúk a na stránke obchodu,
anti-spam ochrany. Tabuľka shop_reviews so statusmi už existuje. Po dokončení
aktualizuj ROADMAP.md a commitni.
```

---

## ⬜ Fáza 7 — SEO a výkon

**Cieľ:** organická návštevnosť a rýchlosť.
**Rozsah:** sitemap.xml, štruktúrované dáta (Product + Offer schema.org),
canonical URL, OpenGraph, ISR/cache stratégia namiesto force-dynamic, indexy podľa
EXPLAIN, stránkovanie kategórií a vyhľadávania.
**Hotové keď:** Lighthouse SEO 100, produktové stránky majú validné štruktúrované dáta.

**Prompt:**
```text
Pokračuj v projekte App0 (pozri README.md a ROADMAP.md — Fáza 7). Optimalizuj SEO
a výkon: sitemap.xml generovaná z DB, schema.org Product/Offer/AggregateOffer JSON-LD
na detailoch produktov, canonical URL a OpenGraph, prechod z force-dynamic na ISR
s revalidáciou po importe, stránkovanie kategórií a vyhľadávania, kontrola query
plánov a doplnenie indexov. Po dokončení aktualizuj ROADMAP.md a commitni.
```

---

## ⬜ Fáza 8 — Český trh

**Cieľ:** plná CZ verzia.
**Rozsah:** čeština (druhý messages súbor + locale routing v next-intl), CZK ceny
naprieč webom (agregácie per mena — teraz sa agreguje len EUR), prepínač
krajiny/meny, CZ obchody.
**Hotové keď:** web beží v SK aj CZ verzii s korektnými menami.

**Prompt:**
```text
Pokračuj v projekte App0 (pozri README.md a ROADMAP.md — Fáza 8). Rozšír appku na
český trh: pridaj cs preklady a locale routing do next-intl (messages sú už oddelené
v apps/web/src/messages), zaveď menu ako prvotriedny koncept v dopytoch (min ceny
a história per mena — teraz je natvrdo EUR), prepínač krajiny v hlavičke a podporu
CZ obchodov (currency CZK už je v schéme). Po dokončení aktualizuj ROADMAP.md
a commitni.
```

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
- Web build používa `force-dynamic` — zámerné pre kostru, rieši fáza 7 (ISR).
- Kategórie sa z feedov zakladajú ploché (najhlbší segment) — strom rieši fáza 1.
- E-maily sú konzolový stub — rieši fáza 3.
- `pnpm audit` spúšťať priebežne; verzie závislostí sú pinnuté v pnpm-lock.yaml.
