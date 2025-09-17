// index.js
// MCP stub server — simple Express server with root health/status route.
// Replace your existing index.js with this file (or merge the GET '/' handler).
// Node >= 14 recommended

const express = require('express');
const fs = require('fs');
const path = require('path');

const appName = 'MCP Stub Server (staging)';
const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const PORT = DEFAULT_PORT;

const app = express();
app.use(express.json({ limit: '1mb' }));

// Simple logger for requests (minimal)
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`${now} [req] ${req.method} ${req.originalUrl}`);
  next();
});

// --- Stub endpoints (ensure they match your existing handlers) ---
// Note: keep POST semantics for endpoints that expect POST.
// If you already have implementations for these routes, merge handlers instead of duplicating.

app.post('/_stub/call', (req, res) => {
  // simulate outbound call - echo back with generated id
  const id = `call_${Date.now()}`;
  // optionally write audit event
  writeAudit({ event: 'call', id, body: req.body });
  res.status(200).json({ status: 'ok', id, sim: 'call' });
});

app.post('/_stub/sms', (req, res) => {
  const id = `sms_${Date.now()}`;
  writeAudit({ event: 'sms', id, body: req.body });
  res.status(200).json({ status: 'ok', id, sim: 'sms' });
});

app.post('/_stub/crm', (req, res) => {
  const id = `crm_${Date.now()}`;
  writeAudit({ event: 'crm', id, body: req.body });
  res.status(200).json({ status: 'ok', id, sim: 'crm' });
});

app.post('/_stub/audit', (req, res) => {
  // append audit event to audit.log (or audit.log.json)
  const item = { ts: new Date().toISOString(), ...req.body };
  appendAudit(item);
  res.status(201).json({ status: 'created', audit: item });
});

app.get('/_stub/audit', (req, res) => {
  // read audit file if exists
  const data = readAudit();
  res.status(200).json(data);
});

app.get('/_stub/calendar/availability', (req, res) => {
  // return a simple stubbed availability
  const availability = {
    days: 2,
    slots: [
      { start: new Date(Date.now() + 60 * 60 * 1000).toISOString(), minutes: 30 },
      { start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), minutes: 30 },
      { start: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), minutes: 30 }
    ]
  };
  res.status(200).json(availability);
});

// --- Health / root status endpoint (the requested GET / status)
app.get('/', (req, res) => {
  const payload = {
    status: 'ok',
    app: appName,
    port: PORT,
    message:
      'This is a stub server. Use POST on the stub endpoints in staging. See endpoints list.',
    endpoints: [
      { method: 'POST', path: '/_stub/call', desc: 'simulate outbound call' },
      { method: 'POST', path: '/_stub/sms', desc: 'simulate SMS' },
      { method: 'POST', path: '/_stub/crm', desc: 'simulate CRM write' },
      { method: 'POST', path: '/_stub/audit', desc: 'append audit event' },
      { method: 'GET', path: '/_stub/audit', desc: 'read audit events' },
      { method: 'GET', path: '/_stub/calendar/availability', desc: 'calendar avail. (stub)' }
    ]
  };

  // Always 200 with JSON (healthcheck)
  res.status(200).json(payload);
});

// --- Utilities: audit append/read (simple file-based) ---
const AUDIT_FILE = path.join(__dirname, 'audit.log.json');

function appendAudit(obj) {
  try {
    const arr = readAudit();
    arr.push(obj);
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(arr, null, 2), { encoding: 'utf8' });
  } catch (err) {
    console.error('Failed to append audit', err);
  }
}

function readAudit() {
  try {
    if (!fs.existsSync(AUDIT_FILE)) return [];
    const raw = fs.readFileSync(AUDIT_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Failed to read audit file', err);
    return [];
  }
}

function writeAudit(obj) {
  // small wrapper for endpoints that want a single write
  appendAudit(obj);
}

// --- Start server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`${appName} running on port ${PORT}`);
  console.log('Available endpoints: POST /_stub/call, POST /_stub/sms, POST /_stub/crm, POST /_stub/audit, GET /_stub/audit, GET /_stub/calendar/availability');
});

// graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT received, exiting');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('SIGTERM received, exiting');
  process.exit(0);
});
