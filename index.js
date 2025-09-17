// Simple MCP stub server for staging/testing
// Endpoints:
// POST  /_stub/call                -> simulate a call
// POST  /_stub/sms                 -> simulate an SMS
// POST  /_stub/crm                 -> simulate CRM write (stub)
// GET   /_stub/calendar/availability?days=2  -> return 3 available slots
// POST  /_stub/audit               -> append an audit event
// GET   /_stub/audit               -> return last audit events
//
// Usage: node index.js
// NOTE: This is for local/staging testing only. No production credentials.

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const AUDIT_FILE = path.join(__dirname, 'audit.log.json');

function writeAudit(event) {
  let arr = [];
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const raw = fs.readFileSync(AUDIT_FILE, 'utf8') || '[]';
      arr = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading audit file:', e);
    arr = [];
  }
  arr.push(event);
  try {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(arr, null, 2));
  } catch (e) {
    console.error('Failed writing audit file:', e);
  }
}

app.post('/_stub/call', (req, res) => {
  const id = 'call_' + Date.now();
  const payload = { call_simulation_id: id, received: req.body || null };
  writeAudit({ action: 'call', id, timestamp: new Date().toISOString(), payload });
  return res.json(payload);
});

app.post('/_stub/sms', (req, res) => {
  const id = 'sms_' + Date.now();
  const payload = { sms_simulation_id: id, received: req.body || null };
  writeAudit({ action: 'sms', id, timestamp: new Date().toISOString(), payload });
  return res.json(payload);
});

app.post('/_stub/crm', (req, res) => {
  const id = 'crm_' + Date.now();
  const payload = { crm_id: id, received: req.body || null };
  writeAudit({ action: 'crm_write', id, timestamp: new Date().toISOString(), payload });
  return res.json(payload);
});

app.get('/_stub/calendar/availability', (req, res) => {
  // Basic deterministic slots for testing within business hours (09:00-17:00)
  const days = parseInt(req.query.days || '2', 10);
  const slots = [];
  const now = new Date();
  for (let d = 0; d < Math.max(1, Math.min(7, days)); d++) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);
    // create up to 3 deterministic times: 10:00, 13:00, 15:30
    const dateOnly = day.toISOString().split('T')[0];
    slots.push({ slot: `${dateOnly}T10:00:00`, display: `${dateOnly} 10:00` });
    slots.push({ slot: `${dateOnly}T13:00:00`, display: `${dateOnly} 13:00` });
    slots.push({ slot: `${dateOnly}T15:30:00`, display: `${dateOnly} 15:30` });
    if (slots.length >= 3) break;
  }
  writeAudit({ action: 'calendar_availability', timestamp: new Date().toISOString(), query: req.query, result_count: slots.length });
  return res.json({ available: slots.slice(0, 3) });
});

app.post('/_stub/audit', (req, res) => {
  const evt = req.body || { note: 'manual_audit_post' };
  evt.timestamp = new Date().toISOString();
  writeAudit(evt);
  return res.json({ status: 'ok', saved: evt });
});

app.get('/_stub/audit', (req, res) => {
  try {
    if (!fs.existsSync(AUDIT_FILE)) {
      return res.json([]);
    }
    const raw = fs.readFileSync(AUDIT_FILE, 'utf8') || '[]';
    const arr = JSON.parse(raw);
    return res.json(arr);
  } catch (e) {
    console.error('Failed reading audit file:', e);
    return res.status(500).json({ error: 'failed_reading_audit' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP stub server running on port ${PORT}`);
  console.log('Endpoints: POST /_stub/call, /_stub/sms, /_stub/crm, POST/GET /_stub/audit, GET /_stub/calendar/availability');
});
