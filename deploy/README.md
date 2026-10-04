# Optimized public covers

Deploy the existing stack with the cover override. Paths are relative to the
original Compose file; `BIBLIESI_PUBLIC_CONTEXT` must point to this repository.

On the production VPS, the admin `deploy/docker-compose.override.yml` is a
symlink to `../../bibli-esi-public-runtime/deploy/compose.covers.yml`. Ordinary
Compose commands without explicit `-f` options therefore keep the cover service
and private network. When using explicit `-f`, include both files as below.

```sh
docker compose -p bibliesi --env-file .env \
  -f docker-compose.yml \
  -f ../../bibli-esi-public-runtime/deploy/compose.covers.yml \
  up -d --build public cover-service
```

The private Sharp service downloads only recognized provider images, follows
HTTPS redirects only on their known hosts, caps downloads at 8 MiB / 25 MP,
and runs at most four jobs. It creates 480 x 720 maximum, quality-82 WebP
covers with orientation correction and no original metadata. The persistent
`cover-cache` volume is pruned to 128 MiB. Missing images are retried after six
hours; BnF URLs have an Open Library ISBN fallback. Good copies remain usable
during provider outages. No authentication keys are used by the image service.

Cover identifiers/filenames must change when replacing an original image.
The `/covers/v1` prefix versions the transformation for future format changes.

Workbox caches 300 successful same-origin images for up to 30 days on the
device, cleans old entries and handles storage quota errors. Realtime/API and
affluence responses are never handled by the image cache.

Warm/benchmark the catalogue (use a public anon key, never a service-role key):

```sh
SUPABASE_ANON_KEY=... node scripts/benchmark-covers.mjs
SUPABASE_ANON_KEY=... node scripts/benchmark-covers.mjs --baseline
```
