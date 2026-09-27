#!/usr/bin/env python3
"""
Register the Cloudflare Worker URL as a Guesty `reservation.new` webhook.
Run AFTER the worker is deployed (Step 4 in README).

Usage:
    cd /Users/pablo/Work/grace-collection/villa-azure-guesty-ga4-worker
    WORKER_URL='https://villa-azure-guesty-ga4.<account>.workers.dev?secret=<shared-secret>' \\
        python3 register-webhook.py

Re-running is safe: if a webhook with the same URL already exists, it's left alone.
"""
import json, os, sys, urllib.parse, urllib.request

ENV_PATH = '/Users/pablo/Work/grace-collection/villa-collection-guesty/.env'
WORKER_URL = os.environ.get('WORKER_URL')
if not WORKER_URL:
    sys.exit("Set WORKER_URL env var, e.g. WORKER_URL='https://villa-azure-guesty-ga4.you.workers.dev?secret=xxx'")

env = {}
for line in open(ENV_PATH):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k] = v.strip().strip('"').strip("'")

# Token
data = urllib.parse.urlencode({
    'grant_type': 'client_credentials', 'scope': 'open-api',
    'client_id': env['GUESTY_CLIENT_ID'], 'client_secret': env['GUESTY_CLIENT_SECRET'],
}).encode()
tok = json.loads(urllib.request.urlopen(urllib.request.Request(
    'https://open-api.guesty.com/oauth2/token', data=data,
    headers={'Content-Type': 'application/x-www-form-urlencoded'},
)).read())['access_token']

def api(method, path, body=None):
    req = urllib.request.Request(
        f"https://open-api.guesty.com/v1{path}",
        data=(json.dumps(body).encode() if body is not None else None),
        method=method,
        headers={'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json'},
    )
    try:
        return json.loads(urllib.request.urlopen(req).read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} {e.reason}: {e.read().decode()[:300]}")
        raise

print("Existing webhooks:")
existing = api('GET', '/webhooks')
hooks = existing if isinstance(existing, list) else existing.get('results') or existing.get('data') or []
for w in hooks:
    if not isinstance(w, dict): continue
    print(f"  {str(w.get('_id','?'))[:24]}  url={str(w.get('url','?'))[:80]}  events={w.get('events','?')}")
    if w.get('url') == WORKER_URL:
        sys.exit(f"\nA webhook with this exact URL already exists ({w.get('_id')}). No action taken.")

print("\nCreating webhook…")
created = api('POST', '/webhooks', {
    'url': WORKER_URL,
    'events': ['reservation.new', 'reservation.created.v2'],
})
print(json.dumps(created, indent=2))
