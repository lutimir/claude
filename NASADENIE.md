# Ako dostať App0 online (aj úplne zadarmo)

Appka má 3 časti: **web** (Next.js), **worker** (importy + alarmy) a **PostgreSQL**.
Podľa rozpočtu si vyber variant A (0 €) alebo B (~5 €/mes., najmenej starostí).

---

## Variant A — úplne zadarmo (Vercel + Neon + GitHub Actions)

| Časť | Služba | Cena |
| --- | --- | --- |
| Web | [Vercel](https://vercel.com) Hobby | 0 € |
| Databáza | [Neon](https://neon.tech) Free (Postgres, 0,5 GB) | 0 € |
| Worker (denné importy) | GitHub Actions cron (workflow už je v repe) | 0 € |
| Doména | `tvoj-nazov.vercel.app` | 0 € |

### Postup

1. **Neon**: registruj sa, vytvor projekt (región EU), skopíruj **connection string**
   (`postgres://...neon.tech/...?sslmode=require`).
2. **Migrácie + seed** (z tvojho počítača):
   ```bash
   DATABASE_URL="postgres://...neon.tech/..." pnpm db:migrate
   DATABASE_URL="postgres://...neon.tech/..." pnpm db:seed   # voliteľné demo dáta
   ```
3. **Vercel**: Import Git repository → vyber tento repozitár.
   - **Root Directory**: `apps/web` (Vercel si sám všimne pnpm workspace)
   - **Environment Variables**: `DATABASE_URL` (Neon), `ADMIN_USER`,
     `ADMIN_PASSWORD`, `APP_BASE_URL=https://tvoj-nazov.vercel.app`,
     `REVALIDATE_SECRET`, `MAIL_PROVIDER=resend` + `RESEND_API_KEY` +
     `MAIL_FROM` (Resend má free 100 e-mailov/deň; kým ho nemáš, nechaj
     `MAIL_PROVIDER=console` — alarmy sa budú len logovať).
   - Deploy. Hotovo — web beží na `https://tvoj-nazov.vercel.app`.
4. **Denné importy**: v GitHube → Settings → Secrets and variables → Actions
   pridaj secret **`DATABASE_URL`** (Neon) a voliteľne `APP_BASE_URL` +
   `REVALIDATE_SECRET` + `FEED_FETCH_CONTACT`. Workflow
   `.github/workflows/cron-import.yml` potom každý deň o 03:00 spustí import
   feedov, párovanie, agregácie aj kontrolu alarmov.
   Manuálne ho spustíš v záložke Actions → „Denný import“ → Run workflow.

**Obmedzenia variantu A:** tlačidlo „Importovať teraz“ v admine čaká na worker —
vo variante A ho nahrádza denný cron (alebo ručné spustenie workflowu).
Neon free po ~5 min nečinnosti uspáva DB (prvý request má ~1 s navyše).

---

## Variant B — VPS za ~5 €/mes. (všetko na jednom mieste, plný worker)

[Hetzner](https://www.hetzner.com/cloud) CX22 (~4,5 €/mes.) alebo ľubovoľný VPS
s Dockerom. Kompletný stack (HTTPS cez Caddy, migrácie, denné zálohy, worker
so živou frontou importov) je pripravený — **postup krok za krokom je
v [DEPLOY.md](./DEPLOY.md)**. Skrátene:

```bash
curl -fsSL https://get.docker.com | sh
git clone <URL-repa> /opt/app0 && cd /opt/app0
cp .env.example .env   # vyplň heslá, DOMAIN, APP_BASE_URL
docker compose -f docker-compose.prod.yml up -d --build
```

*Bonus zadarmo navyše:* [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
dáva VPS zadarmo natrvalo (treba kartu na overenie) — variant B potom vyjde na 0 €.

---

## Doména

### Tvoja vlastná (odporúčam, ~10–15 €/rok)

1. Kúp doménu: `.sk` na [Websupport](https://websupport.sk) / [Wedos](https://wedos.sk),
   lacné `.eu`/`.online` na [Porkbun](https://porkbun.com).
2. DNS nasmeruj podľa variantu:
   - **Vercel**: v projekte Settings → Domains pridaj doménu; Vercel ti ukáže
     A záznam (`76.76.21.21`) alebo CNAME (`cname.vercel-dns.com`) — nastav ho
     u registrátora. HTTPS je automatické.
   - **VPS**: A záznam domény → IP tvojho VPS, do `.env` daj `DOMAIN=tvojadomena.sk`
     a `APP_BASE_URL=https://tvojadomena.sk`, reštartni compose — Caddy si sám
     vybaví certifikát.
3. Všade aktualizuj `APP_BASE_URL` (e-maily, sitemap, presmerovania).

### Zadarmo

- **`*.vercel.app`** — automaticky pri variante A, funguje okamžite, seriózne HTTPS.
- **[DuckDNS](https://www.duckdns.org)** — free subdoména `tvojnazov.duckdns.org`
  s A záznamom na tvoj VPS (variant B); Caddy k nej vie vystaviť certifikát.
- Skutočné free TLD domény (bývalý Freenom) už de facto neexistujú — subdoména
  vyššie je čistejšie riešenie na štart.

---

## Ako appku zapnúť lokálne (vývoj)

```bash
cp .env.example .env               # uprav heslá
docker compose up -d               # PostgreSQL (alebo lokálny Postgres 16+)
pnpm install
pnpm db:migrate && pnpm db:seed    # schéma + demo katalóg
pnpm dev                           # web: http://localhost:3000
pnpm worker                        # druhý terminál: importy + alarmy + fronta
```

- Admin: `http://localhost:3000/admin` (ADMIN_USER / ADMIN_PASSWORD z .env)
- Test celej import pipeline na lokálnom feede: [fixtures/README.md](./fixtures/README.md)
- Testy: `pnpm test` · typy: `pnpm typecheck` · build: `pnpm build`

## Checklist pred ostrým spustením

- [ ] Právne texty (`/podmienky`, `/sukromie`) skontroluje právnik
- [ ] `MAIL_PROVIDER` prepnutý z console na resend/smtp a otestovaný e-mail
- [ ] Silné heslá (`ADMIN_PASSWORD`, `POSTGRES_PASSWORD`, `REVALIDATE_SECRET`)
- [ ] `APP_BASE_URL` = finálna doména (e-maily, sitemap, JSON-LD)
- [ ] Prví reálni obchodníci pridaní cez `/admin/obchody` s potvrdeným súhlasom
- [ ] `/api/health` zapojený do UptimeRobot (free) na stráženie výpadkov
