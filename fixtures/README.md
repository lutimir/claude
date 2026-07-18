# Testovacie feedy

Lokálne overenie celej import pipeline (stiahnutie → parsovanie → párovanie → ceny).

Najjednoduchšie cez admin: spusti `python3 -m http.server 8787 --directory fixtures`,
v `/admin/obchody` pridaj obchod a feed `http://localhost:8787/demo-feed.xml`
(zvaliduj, potvrď súhlas, ulož) a klikni **Importovať teraz** (frontu spracúva
`pnpm worker`). Alternatíva cez SQL a CLI:

```bash
# 1. Servuj fixtures na porte 8787
python3 -m http.server 8787 --directory fixtures

# 2. Zaregistruj testovací obchod a feed (compliance: so súhlasom a právnym základom)
docker compose exec postgres psql -U app0 -d app0 <<'SQL'
insert into shops (name, slug, website_url, country, legal_basis)
values ('MegaTech (test)', 'megatech-test', 'http://localhost:8787', 'sk', 'feed_consent')
on conflict (slug) do nothing;

insert into feeds (shop_id, url, enabled, consent_confirmed_at, consent_note)
select id, 'http://localhost:8787/demo-feed.xml', true, now(), 'Lokálny testovací feed'
from shops where slug = 'megatech-test'
on conflict do nothing;
SQL

# 3. Spusti import a pozri výsledok v /admin/importy
pnpm import:feeds
```

Očakávaný výsledok: 8 položiek naimportovaných, 1 varovanie (položka bez ceny),
3 ponuky spárované s existujúcimi produktmi cez EAN, 1 nový produkt (JBL)
a 4 ponuky bez EAN pre fuzzy párovanie: MT-4001 (názov identický s produktom)
sa spáruje automaticky, MT-4002 a MT-4003 dostanú kandidátov do fronty
/admin/parovanie a MT-3001 (Trust) zostane bez kandidátov.
