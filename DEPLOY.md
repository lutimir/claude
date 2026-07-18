# Nasadenie App0 na VPS

Stack: Docker Compose — Caddy (automatické HTTPS), Next.js web, worker,
PostgreSQL 17, jednorazové migrácie pri každom deployi a denné zálohy
s rotáciou (14 dní). Deploy sa spúšťa automaticky pri pushi na `main`.

## 1. Príprava VPS (raz)

Ubuntu/Debian VPS (2 GB RAM stačí na štart):

```bash
# Docker
curl -fsSL https://get.docker.com | sh

# aplikácia
sudo mkdir -p /opt/app0 && sudo chown $USER /opt/app0
git clone <URL-repa> /opt/app0
cd /opt/app0
cp .env.example .env
```

V `.env` nastav minimálne:

| Premenná | Hodnota |
| --- | --- |
| `POSTGRES_PASSWORD` | silné heslo |
| `ADMIN_USER` / `ADMIN_PASSWORD` | prístup do /admin |
| `DOMAIN` | tvoja doména (napr. `app0.sk`) — DNS A záznam musí mieriť na VPS |
| `APP_BASE_URL` | `https://app0.sk` (používa sa v e-mailoch a sitemap) |
| `MAIL_PROVIDER` + `MAIL_FROM` (+ `RESEND_API_KEY`/`SMTP_URL`) | reálne e-maily alarmov |
| `FEED_FETCH_CONTACT` | kontakt v User-Agentovi feed bota |
| `REVALIDATE_SECRET` | náhodný reťazec |

Prvé spustenie:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy si sám vybaví certifikát pre `DOMAIN`. Migrácie prebehnú v službe
`migrate` ešte pred štartom webu a workera.

## 2. CI/CD z GitHubu

V repozitári nastav secrets (Settings → Secrets → Actions, environment
`production`): `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (privátny kľúč, ktorého
verejná časť je v `~/.ssh/authorized_keys` na VPS). Push na `main` potom
spustí `.github/workflows/deploy.yml`: pull + rebuild + migrácie + reštart.

## 3. Zálohy a obnova

Služba `backup` robí denný `pg_dump` (gzip) do volume `backups`, drží
posledných 14. Obnova:

```bash
docker compose -f docker-compose.prod.yml exec backup ls -1t /backups | head
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U app0 app0 < <(docker compose -f docker-compose.prod.yml exec -T backup \
  zcat /backups/app0-2026-07-18-0300.sql.gz)
```

Zálohy odporúčame navyše synchronizovať mimo VPS (napr. restic/rclone do S3).

## 4. Monitoring

- `GET /api/health` — vráti 200 + `{status:"ok", db:true}`; compose ho používa
  ako healthcheck webu. Zapoj ho do UptimeRobot/Better Stack (zadarmo).
- Logy: `docker compose -f docker-compose.prod.yml logs -f web worker`.
- Error tracking (Sentry a pod.) sa dá doplniť neskôr — appka loguje na stderr.

## 5. Pred ostrým spustením

- [ ] Právne texty (/podmienky, /sukromie) skontroluje právnik.
- [ ] `MAIL_PROVIDER` prepnutý z `console` na resend/smtp a otestovaný.
- [ ] Prvé reálne obchody pripojené cez /admin s potvrdeným súhlasom.
- [ ] Zálohy overené obnovou naprázdno.
