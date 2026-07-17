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

## ⬜ Fáza 1 — Onboarding reálnych obchodov

**Cieľ:** pripojiť prvé skutočné obchody bez ručného SQL.
**Rozsah:** admin CRUD pre obchody a feedy (formuláre + server actions),
validátor feedu (stiahni, naparsuj, ukáž náhľad položiek a chyby pred uložením),
tlačidlo "spustiť import teraz" v admine (job queue cez DB tabuľku alebo triggnutie
workera), evidencia súhlasov (upload/poznámka), stavové prehľady feedov.
**Hotové keď:** nový obchod sa dá pridať, zvalidovať a naimportovať čisto cez /admin.

**Prompt:**
```text
Pokračuj v projekte App0 (porovnávač cien, pozri README.md a ROADMAP.md — Fáza 1).
Priprav onboarding reálnych obchodov: admin CRUD pre obchody a feedy so server
actions a zod validáciou, validátor feedu s náhľadom naparsovaných položiek pred
uložením, tlačidlo "spustiť import teraz", a evidenciu súhlasu obchodu (dátum +
poznámka + kontakt). Dodrž compliance model z packages/core (import len so
súhlasom). Po dokončení aktualizuj ROADMAP.md a commitni.
```

---

## ⬜ Fáza 2 — História cien naplno

**Cieľ:** história cien ako hlavná pridaná hodnota.
**Rozsah:** denné agregácie do samostatnej tabuľky (min/avg na produkt a deň),
interaktívny graf (klientský komponent, tooltips, prepínač 30/90/365 dní),
"najväčšie zľavy" sekcia na homepage, detekcia falošných zliav (porovnanie
s 30-dňovým priemerom), retencia surových záznamov.
**Hotové keď:** produkt má interaktívny graf a homepage ukazuje reálne poklesy cien.

**Prompt:**
```text
Pokračuj v projekte App0 (pozri README.md a ROADMAP.md — Fáza 2). Vybuduj
históriu cien naplno: agregačná tabuľka denných min/avg cien na produkt (počíta
worker po importe), interaktívny graf na detaile produktu (prepínač 30/90/365 dní,
tooltip s cenou a obchodom), sekcia "najväčšie poklesy cien" na homepage a výpočet
férovej ceny (30-dňový priemer) na odhalenie falošných zliav. Po dokončení
aktualizuj ROADMAP.md a commitni.
```

---

## ⬜ Fáza 3 — Cenové alarmy end-to-end

**Cieľ:** funkčný watchdog s e-mailami.
**Rozsah:** napojenie reálneho e-mail providera (SMTP alebo Resend — rozhranie
Mailer už existuje v apps/worker/src/lib/mailer.ts), double opt-in (potvrdenie
alarmu tokenom — stĺpce token/confirmed_at už v schéme), unsubscribe odkaz,
šablóny e-mailov po slovensky, rate limiting formulára, stránka správy alarmu.
**Hotové keď:** alarm sa potvrdí e-mailom a notifikácia príde pri poklese ceny.

**Prompt:**
```text
Pokračuj v projekte App0 (pozri README.md a ROADMAP.md — Fáza 3). Dokonči cenové
alarmy: napoj e-mail provider cez existujúce Mailer rozhranie (Resend alebo SMTP,
konfigurovateľné cez env), double opt-in potvrdenie cez token (stĺpce už existujú
v price_alerts), unsubscribe odkaz, slovenské e-mail šablóny a rate limiting
formulára. Server action v apps/web zmeň tak, aby alarm vznikal nepotvrdený.
Po dokončení aktualizuj ROADMAP.md a commitni.
```

---

## ⬜ Fáza 4 — Fuzzy párovanie a fronta párovania

**Cieľ:** spárovať ponuky bez EAN.
**Rozsah:** pg_trgm similarity nad normalizovanými názvami (immutable_unaccent
a trigram index už existujú), kandidáti s confidence skóre, automatické párovanie
nad prahom, admin fronta na ručné potvrdenie (match_status matched_fuzzy /
matched_manual už v schéme), učenie sa z manuálnych rozhodnutí (blocklist párov).
**Hotové keď:** nespárované ponuky dostávajú kandidátov a admin ich vie potvrdiť.

**Prompt:**
```text
Pokračuj v projekte App0 (pozri README.md a ROADMAP.md — Fáza 4). Vybuduj fuzzy
párovanie ponúk bez EAN: pg_trgm similarity nad normalizovanými názvami (unaccent
aj trigram index už sú v migráciách), návrhy kandidátov s confidence skóre po
importe, automatické spárovanie nad konfigurovateľným prahom a admin frontu na
ručné potvrdenie/zamietnutie zvyšku. Využi match_status hodnoty matched_fuzzy a
matched_manual zo schémy. Po dokončení aktualizuj ROADMAP.md a commitni.
```

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
