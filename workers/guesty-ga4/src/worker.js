// Villa Azure — Guesty reservation webhook → GA4 Measurement Protocol
//
// Receives Guesty `reservation.new` / `reservation.created.v2` webhooks and
// forwards a clean `purchase` event to GA4 with the REAL Guesty confirmation
// code as transaction_id. Replaces the misfiring "Custom HTML - Booking
// Confirmation (Guesty)" GTM tag.
//
// Guards (see src/decide.js for the testable logic):
//   1. Only `confirmed` reservations count (no inquiries / holds / cancellations).
//   2. DIRECT bookings only — OTA channels (Airbnb/VRBO/Booking.com/Expedia/
//      HomeAway) are excluded; they have their own dashboards and would inflate
//      site-conversion data.
//   3. Dedupe by confirmation code via KV (SENT_TX) so channel re-syncs, webhook
//      retries, and duplicate event subscriptions can't double-count a booking.

import { decide } from './decide.js'

const DEDUPE_TTL_SECONDS = 60 * 60 * 24 * 365 // 1 year

export default {
  async fetch(request, env, ctx) {
    // Health check
    if (request.method === 'GET') {
      return json({ ok: true, service: 'villa-azure-guesty-ga4', ts: new Date().toISOString() })
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    // One-off refund sender: offsets a previously sent purchase in GA4.
    // POST /refund?key=<REFUND_KEY> {"transaction_id":"GY-XXXX","value":123,"currency":"USD"}
    const url = new URL(request.url)
    if (url.pathname === '/refund') {
      if (!env.REFUND_KEY || url.searchParams.get('key') !== env.REFUND_KEY) {
        return new Response('Forbidden', { status: 403 })
      }
      let rb
      try { rb = await request.json() } catch { return new Response('Bad JSON', { status: 400 }) }
      const payload = {
        client_id: `guesty.${rb.transaction_id}`,
        events: [{ name: 'refund', params: { transaction_id: rb.transaction_id, value: Number(rb.value) || 0, currency: rb.currency || 'USD' } }],
      }
      const res = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(env.GA4_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(env.GA4_API_SECRET)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      return json({ ok: res.ok, status: res.status, tid: rb.transaction_id })
    }

    // Optional shared-secret check (set GUESTY_SHARED_SECRET in worker env;
    // configure Guesty webhook to include `?secret=<value>` in the URL).
    if (env.GUESTY_SHARED_SECRET) {
      if (url.searchParams.get('secret') !== env.GUESTY_SHARED_SECRET) {
        return new Response('Forbidden', { status: 403 })
      }
    }

    let body
    try { body = await request.json() } catch { return new Response('Bad JSON', { status: 400 }) }

    const d = decide(body)
    if (!d.send) {
      // Acknowledge so Guesty doesn't retry, but don't send a purchase.
      return json({ ok: true, skipped: true, reason: d.reason })
    }

    // Dedupe: one purchase per confirmation code, ever.
    if (env.SENT_TX) {
      const seen = await env.SENT_TX.get(d.tid)
      if (seen) {
        return json({ ok: true, skipped: true, reason: 'duplicate (already sent)', tid: d.tid })
      }
    }

    // Synthetic but stable client_id per booking. Real session attribution is lost
    // (we don't have the original GA _ga cookie); revenue + count + transaction_id
    // are accurate. To recover attribution, capture the user's _ga cookie at
    // booking-engine entry and pass it through as a Guesty custom field.
    const client_id = `guesty.${d.tid}`

    const mpPayload = {
      client_id,
      non_personalized_ads: false,
      events: [{
        name: 'purchase',
        params: {
          transaction_id: d.tid,
          value: d.value,
          currency: d.currency,
          source: d.source,
          nights: d.nights,
          items: [{
            item_id: d.listingId,
            item_name: d.listingTitle,
            price: d.value,
            quantity: 1,
          }],
        },
      }],
    }

    const mpUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(env.GA4_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(env.GA4_API_SECRET)}`
    const mpRes = await fetch(mpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mpPayload),
    })

    // Multi-send: one physical inventory, three storefronts (villa sites, hotel
    // site, Grace Collection). Direct purchases count in every brand property
    // until reservations carry a reliable per-engine marker to split on.
    const extraProperties = [
      [env.HOTEL_GA4_MEASUREMENT_ID, env.HOTEL_GA4_API_SECRET],
      [env.GRACE_GA4_MEASUREMENT_ID, env.GRACE_GA4_API_SECRET],
    ]
    for (const [mid, secret] of extraProperties) {
      if (!mid || !secret) continue
      const extraUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(mid)}&api_secret=${encodeURIComponent(secret)}`
      await fetch(extraUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mpPayload),
      }).catch(() => {})
    }

    // Only record as "sent" if GA4 accepted it (204 on success), so a transient
    // GA4 failure can be retried by Guesty rather than silently dropped.
    if (mpRes.ok && env.SENT_TX) {
      await env.SENT_TX.put(d.tid, new Date().toISOString(), { expirationTtl: DEDUPE_TTL_SECONDS })
    }

    return json({
      ok: mpRes.ok,
      status: mpRes.status,
      tid: d.tid,
      value: d.value,
      currency: d.currency,
      listing: d.listingTitle,
      source: d.source,
      eventName: d.eventName,
    })
  },
}

function json(obj, init = {}) {
  return new Response(JSON.stringify(obj), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
}
