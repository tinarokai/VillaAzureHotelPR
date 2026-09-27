import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decide, isOtaSource } from '../src/decide.js'

const base = (over = {}) => ({
  event: 'reservation.new',
  reservation: {
    status: 'confirmed',
    source: 'manual',
    confirmationCode: 'GY-TEST123',
    money: { fareAccommodation: 5000 },
    listing: { title: 'Test Villa' },
    ...over,
  },
})

test('direct confirmed booking → send', () => {
  const d = decide(base())
  assert.equal(d.send, true)
  assert.equal(d.tid, 'GY-TEST123')
  assert.equal(d.value, 5000)
})

test('Airbnb (airbnb2) confirmed → skip (OTA excluded)', () => {
  const d = decide(base({ source: 'airbnb2', confirmationCode: 'HM9J35QXJK' }))
  assert.equal(d.send, false)
  assert.match(d.reason, /OTA channel excluded/)
})

test('VRBO confirmed → skip (OTA excluded)', () => {
  const d = decide(base({ source: 'VRBO', confirmationCode: 'HA-Nkumxnw' }))
  assert.equal(d.send, false)
})

test('Booking.com / Expedia / HomeAway → skip', () => {
  for (const s of ['bookingCom', 'Booking.com', 'expedia', 'homeaway2']) {
    assert.equal(decide(base({ source: s })).send, false, `${s} should skip`)
  }
})

test('inquiry / non-confirmed status → skip', () => {
  for (const st of ['inquiry', 'reserved', 'pending', 'canceled', 'declined', 'expired']) {
    const d = decide(base({ status: st }))
    assert.equal(d.send, false, `${st} should skip`)
    assert.match(d.reason, /status not confirmed/)
  }
})

test('unrecognized event → skip', () => {
  const d = decide({ event: 'reservation.updated', reservation: base().reservation })
  assert.equal(d.send, false)
  assert.match(d.reason, /unrecognized event/)
})

test('missing value → skip', () => {
  const d = decide(base({ money: {}, totalPrice: 0 }))
  assert.equal(d.send, false)
  assert.match(d.reason, /missing transaction_id or value/)
})

test('isOtaSource matches variants', () => {
  assert.ok(isOtaSource('airbnb2'))
  assert.ok(isOtaSource('VRBO'))
  assert.ok(!isOtaSource('manual'))
  assert.ok(!isOtaSource('direct'))
})
