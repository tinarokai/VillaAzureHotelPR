// Pure decision logic for the Guesty → GA4 worker.
// Kept separate from the fetch handler so it can be unit-tested without a runtime.

export const ALLOWED_EVENTS = new Set([
  'reservation.new',
  'reservation.created',
  'reservation.created.v2',
])

// OTA channels we do NOT count as GA4 purchases. GA4 tracks DIRECT bookings only
// (your own site / manual). Airbnb, VRBO, Booking.com, Expedia have their own
// dashboards and would otherwise inflate site-conversion data. Match is on a
// lower-cased source string and is substring-based to catch variants
// (e.g. "airbnb2", "Booking.com", "HomeAway").
export const OTA_SOURCE_PATTERNS = [
  'airbnb',
  'vrbo',
  'homeaway',
  'booking',   // bookingCom / Booking.com
  'expedia',
]

export function numberOr(v, fb) { const n = Number(v); return Number.isFinite(n) ? n : fb }

export function pickFirstNumber(...vals) {
  for (const v of vals) { const n = Number(v); if (Number.isFinite(n) && n > 0) return n }
  return 0
}

export function isOtaSource(source) {
  const s = String(source || '').toLowerCase()
  return OTA_SOURCE_PATTERNS.some((p) => s.includes(p))
}

// Returns { send: boolean, reason: string, ...fields } describing whether this
// webhook should produce a GA4 purchase. Does NOT handle dedupe (that needs KV
// state and lives in the worker).
export function decide(body) {
  const eventName = body.event || body.eventType || body.topic || ''
  const reservation = body.reservation || body.data || body.payload || body

  if (!ALLOWED_EVENTS.has(eventName)) {
    return { send: false, reason: `unrecognized event: ${eventName}`, eventName }
  }

  const status = String(reservation.status || '').toLowerCase()
  if (status !== 'confirmed') {
    return { send: false, reason: `status not confirmed: ${reservation.status || 'none'}`, eventName }
  }

  const source = reservation.source || reservation.channel || 'direct'
  if (isOtaSource(source)) {
    return { send: false, reason: `OTA channel excluded: ${source}`, eventName, source }
  }

  // Staff-created reservations (Guesty dashboard "manual" source) are phone
  // bookings, tests, or holds — not website conversions. Never count them.
  if (String(source).toLowerCase() === 'manual') {
    return { send: false, reason: 'manual (staff-created) reservation excluded', eventName, source }
  }

  const tid = reservation.confirmationCode || reservation._id || reservation.id
  const money = reservation.money || {}
  const value = pickFirstNumber(
    money.fareAccommodation,
    money.totalPaid,
    money.subTotalPrice,
    money.hostOriginalPayout,
    reservation.totalPrice,
  )
  if (!tid || !value || value <= 0) {
    return { send: false, reason: 'missing transaction_id or value', eventName, tid, value }
  }

  const listing = reservation.listing || {}
  return {
    send: true,
    reason: 'ok',
    eventName,
    tid,
    value: Number(value.toFixed(2)),
    currency: reservation.currency || money.currency || 'USD',
    listingTitle: listing.title || listing.nickname || 'Villa Azure Booking',
    listingId: String(reservation.listingId || listing._id || 'villa-azure'),
    source,
    nights: numberOr(reservation.nights ?? reservation.nightsCount, 0),
  }
}
