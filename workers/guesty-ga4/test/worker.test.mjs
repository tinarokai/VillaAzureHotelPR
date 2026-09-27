import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker from '../src/worker.js'

// Minimal in-memory KV mock matching the bits the worker uses.
function kvMock() {
  const m = new Map()
  return {
    store: m,
    async get(k) { return m.has(k) ? m.get(k) : null },
    async put(k, v) { m.set(k, v) },
  }
}

function envWith(kv, calls) {
  return {
    GA4_MEASUREMENT_ID: 'G-TEST',
    GA4_API_SECRET: 'secret',
    SENT_TX: kv,
    __calls: calls,
  }
}

// Stub global fetch (the GA4 MP call) and count invocations.
function withStubbedFetch(calls, fn) {
  const orig = globalThis.fetch
  globalThis.fetch = async () => { calls.n++; return { ok: true, status: 204 } }
  return Promise.resolve(fn()).finally(() => { globalThis.fetch = orig })
}

const post = (body) => new Request('https://w.dev/', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})

const direct = {
  event: 'reservation.new',
  reservation: { status: 'confirmed', source: 'manual', confirmationCode: 'GY-ABC', money: { fareAccommodation: 5000 }, listing: { title: 'Villa' } },
}

test('direct confirmed sends to GA4 once and records dedupe key', async () => {
  const kv = kvMock(); const calls = { n: 0 }
  await withStubbedFetch(calls, async () => {
    const res = await worker.fetch(post(direct), envWith(kv, calls), {})
    const j = await res.json()
    assert.equal(j.ok, true)
    assert.equal(j.tid, 'GY-ABC')
  })
  assert.equal(calls.n, 1, 'GA4 called exactly once')
  assert.equal(kv.store.has('GY-ABC'), true, 'dedupe key stored')
})

test('duplicate confirmation code is skipped (no second GA4 call)', async () => {
  const kv = kvMock(); const calls = { n: 0 }
  await withStubbedFetch(calls, async () => {
    await worker.fetch(post(direct), envWith(kv, calls), {})       // first
    const res = await worker.fetch(post(direct), envWith(kv, calls), {}) // re-sync / retry
    const j = await res.json()
    assert.equal(j.skipped, true)
    assert.match(j.reason, /duplicate/)
  })
  assert.equal(calls.n, 1, 'GA4 still called only once despite two webhooks')
})

test('OTA confirmed booking never reaches GA4', async () => {
  const kv = kvMock(); const calls = { n: 0 }
  await withStubbedFetch(calls, async () => {
    const ota = { ...direct, reservation: { ...direct.reservation, source: 'airbnb2', confirmationCode: 'HM123' } }
    const res = await worker.fetch(post(ota), envWith(kv, calls), {})
    const j = await res.json()
    assert.equal(j.skipped, true)
    assert.match(j.reason, /OTA/)
  })
  assert.equal(calls.n, 0, 'GA4 not called for OTA')
})
