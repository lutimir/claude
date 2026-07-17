# App0 — porovnávač cien elektroniky

Porovnávač cien pre slovenský a český trh postavený na **legálnom, feed-first
prístupe**: ceny preberáme výhradne z oficiálnych XML feedov a API, ku ktorým dal
obchod súhlas. Žiadny scraping bez povolenia.

> Stav projektu a ďalšie kroky: pozri **[ROADMAP.md](./ROADMAP.md)** — projekt je
> rozdelený na fázy s pripravenými promptami.

## Architektúra

```
app0 (pnpm monorepo)
├── apps/
│   ├── web/        Next.js 15 (App Router) — verejný web + /admin sekcia
│   └── worker/     importy feedov (cron 03:00), kontrola cenových alarmov
├── packages/
│   ├── core/       doménová logika: Heureka XML parser, EAN validácia,
│   │               slugify/normalizácia, compliance User-Agent
│   └── db/         Drizzle ORM schéma, migrácie, seed
└── fixtures/       testovací feed na lokálne overenie import pipeline
```

**Tok dát:** obchod publikuje XML feed (Heureka formát) → worker ho denne stiahne
(identifikuje sa User-Agentom s kontaktom) → parser znormalizuje položky → párovanie
cez EAN/GTIN (kontrolná číslica sa validuje) → upsert ponúk + zápis histórie cien
pri každej zmene → web číta z PostgreSQL (full-text vyhľadávanie bez diakritiky).

## Compliance model (prečo je to legálne)

- Každý obchod má v DB **právny základ** (`legal_basis`): feed so súhlasom,
  oficiálne API alebo písomné povolenie.
- Feed sa **neimportuje bez `consent_confirmed_at`** — vynútené priamo v kóde
  workera, nie len procesne.
- Každý HTTP request sa identifikuje User-Agentom s kontaktnou adresou
  (`FEED_FETCH_CONTACT`).
- Právne stránky (`/podmienky`, `/sukromie`) sú pripravené ako kostra — pred
  produkciou ich musí skontrolovať právnik (fáza 9).

## Rýchly štart

Prerekvizity: Node 22+, pnpm 10+, Docker.

```bash
cp .env.example .env          # uprav heslá
docker compose up -d          # PostgreSQL 17
pnpm install
pnpm db:migrate               # aplikuje migrácie z packages/db/migrations
pnpm db:seed                  # demo katalóg elektroniky (POZOR: maže dáta)
pnpm dev                      # web na http://localhost:3000
```

Admin sekcia: `http://localhost:3000/admin` (HTTP Basic — `ADMIN_USER` / `ADMIN_PASSWORD`).

## Užitočné príkazy

| Príkaz              | Popis                                              |
| ------------------- | -------------------------------------------------- |
| `pnpm dev`          | Next.js dev server                                 |
| `pnpm import:feeds`       | jednorazový import všetkých zapnutých feedov       |
| `pnpm alerts:check`       | jednorazová kontrola cenových alarmov              |
| `pnpm worker`       | worker s cron plánovačom (import denne o 03:00)    |
| `pnpm db:generate`  | vygeneruje SQL migrácie zo zmien schémy            |
| `pnpm db:migrate`   | aplikuje migrácie                                  |
| `pnpm db:seed`      | demo dáta (deštruktívne!)                          |
| `pnpm test`         | unit testy (vitest)                                |
| `pnpm typecheck`    | typová kontrola celého monorepa                    |
| `pnpm build`        | produkčný build                                    |

Test celej import pipeline na lokálnom feede: [fixtures/README.md](./fixtures/README.md).

## Pridanie reálneho obchodu

1. Dohodni si s obchodom použitie jeho produktového feedu (Heureka XML formát —
   obchody ho už väčšinou majú) a **zdokumentuj súhlas**.
2. Vlož obchod + feed do DB (admin CRUD prichádza vo fáze 1):
   `legal_basis`, `consent_confirmed_at` a `consent_note` sú povinné pre import.
3. Spusti `pnpm import:feeds` a skontroluj `/admin/importy`.

## Produkčné nasadenie

`docker-compose.prod.yml` obsahuje web (standalone Next.js), worker a PostgreSQL.
CI/CD, zálohy, monitoring a hardening rieši fáza 9 roadmapy.

## Environment premenné

Pozri [.env.example](./.env.example). V produkcii nastav silné `ADMIN_PASSWORD`
a `POSTGRES_PASSWORD`; `FEED_FETCH_CONTACT` musí byť reálna adresa, na ktorej ťa
obchody zastihnú.
