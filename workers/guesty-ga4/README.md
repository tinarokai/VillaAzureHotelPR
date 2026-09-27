# Villa Azure — Guesty → GA4 (Measurement Protocol) Worker

A tiny Cloudflare Worker that replaces the misfiring GTM DOM scraper.

**Flow:** Guesty fires `reservation.new` → Worker validates → Worker sends a clean `purchase` event to GA4 Measurement Protocol with the **real** Guesty confirmation code as `transaction_id`.

- GA4 property: `537282737` (Villa Azure)
- Measurement ID: `G-ZDG73P27V6`
- Replaces tag id 38 in container `GTM-TF3W29BD` (which has been paused)

## Files
- `src/worker.js` — the worker
- `wrangler.toml` — Cloudflare config
- `register-webhook.py` — one-shot script to register the Worker URL with Guesty

## One-time setup

### 1. Create the GA4 Measurement Protocol API secret
1. In GA4 admin: **Data Streams** → click the Villa Azure web stream → scroll to **Measurement Protocol API secrets** → **Create**.
2. Nickname it `guesty-webhook`. Copy the **secret value** (you'll paste it in step 3).

### 2. Install Wrangler and log into Cloudflare
```bash
cd /Users/pablo/Work/grace-collection/villa-azure-guesty-ga4-worker
npm install
npx wrangler login   # opens browser; sign in with the Cloudflare account that owns your Pages projects
```

### 3. Set worker secrets
```bash
npx wrangler secret put GA4_API_SECRET
# paste the secret from step 1, press Enter

# Optional but recommended (generates a random string to gate the endpoint):
openssl rand -hex 24 | tee /tmp/guesty-shared-secret.txt | npx wrangler secret put GUESTY_SHARED_SECRET
# remember the value in /tmp/guesty-shared-secret.txt for step 5
```

### 4. Deploy
```bash
npx wrangler deploy
```
Note the deployed URL — e.g. `https://villa-azure-guesty-ga4.<account-subdomain>.workers.dev`.

### 5. Register the Guesty webhook
```bash
WORKER_URL='https://villa-azure-guesty-ga4.<account>.workers.dev?secret=<paste-shared-secret>' \
  python3 register-webhook.py
```
(Omit the `?secret=` if you skipped that worker secret.)

## Test it
1. Tail the worker logs in one terminal:
   ```bash
   npx wrangler tail
   ```
2. Create a test reservation in Guesty (any small total, listing = Villa Azure or Paradiso).
3. Logs should show a JSON line with `ok:true, tid:<conf code>, value:<total>`.
4. In GA4 → **Realtime** report you should see one `purchase` event within ~30 seconds. Its `transaction_id` will be the real Guesty confirmation code (e.g. `HM…`, `HA-…`, `GY-…`) — NOT `res_<timestamp>`.

## What the worker does NOT do (yet)
- **Session attribution.** We don't have the user's original GA `_ga` cookie, so each booking shows up as its own synthetic user (`client_id = guesty.<conf-code>`). Revenue + transaction count are accurate, but the source/medium attribution will say "direct" in GA4 (the `source` event param still carries the Guesty channel: `airbnb2` / `bookingCom` / `VRBO` / `manual` / `direct`).
- **Signature verification.** Guesty's payload signature scheme isn't documented in the overview; for now we use a URL-query shared secret. If Guesty publishes a per-event HMAC, swap in HMAC verification.
- **Refund/cancellation events.** Currently only listens for new bookings. Add `reservation.updated.v2` later if you want to send `refund` events when a booking is cancelled.

## Reverting
- Disable: `wrangler delete` (removes the worker)
- Or unregister the Guesty webhook: in Guesty Dashboard → Integrations → API & Webhooks → delete the entry pointing at the worker URL.
