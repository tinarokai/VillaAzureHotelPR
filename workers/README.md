# Helper Workers for villaazurehotelpr.com

Both run on the Rokai Labs Cloudflare account (bd5788a18e117f328ac0c6a9155abb54). Deploy each with `npx wrangler deploy` from its folder.

- `concierge/`: the site chat widget backend (villa-azure-concierge.tina-bd5.workers.dev). Answers live in KV key `config`; edit them in the admin dashboard, not in code. Admin key is a Worker secret (`ADMIN_KEY`).
- `guesty-ga4/`: receives Guesty `reservation.new` webhooks (webhook 6ab99dca3f05c10012c40ba5) and sends GA4 `purchase` events to the villa, hotel and Grace GA4 properties. Secrets: GA4_API_SECRET, HOTEL_GA4_API_SECRET, GRACE_GA4_API_SECRET, HOTEL_GA4_MEASUREMENT_ID, GRACE_GA4_MEASUREMENT_ID, GUESTY_SHARED_SECRET, REFUND_KEY.

Key values are not in this repo; Room Rankers sends them separately.
