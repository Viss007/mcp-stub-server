// index.js
// MCP stub server — minimal health endpoints + method hints
// Ready-to-commit: adds GET / status and safer GET handlers for debug.

const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Configuration
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const APP_NAME = process.env.APP_NAME || "MCP Stub Server (staging)";

// Utility: list of known stub endpoints
const STUB_ENDPOINTS = [
  { method: "POST", path: "/_stub/call", desc: "simulate outbound call" },
  { method: "POST", path: "/_stub/sms", desc: "simulate SMS" },
  { method: "POST", path: "/_stub/crm", desc: "simulate CRM write" },
  { method: "POST", path: "/_stub/audit", desc: "append audit event" },
  { method: "GET",  path: "/_stub/audit", desc: "read audit events" },
  { method: "GET",  path: "/_stub/calendar/availability", desc: "calendar avail (stub)" }
];

// Root status page — useful for healthchecks and debugging
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    app: APP_NAME,
    port: PORT,
    message: "This is a stub server. Use POST on the stub endpoints in staging. See endpoints list.",
    endpoints: STUB_ENDPOINTS
  });
});

// Optional simple health endpoint used by some platforms
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

// For stub endpoints that are intended to be POST only,
// provide helpful responses for accidental GETs in browser.
app.get("/_stub/call", (req, res) => {
  res.status(405).json({
    error: "method_not_allowed",
    message: "Use POST /_stub/call to simulate a call. GET is not supported here."
  });
});
app.get("/_stub/sms", (req, res) => {
  res.status(405).json({
    error: "method_not_allowed",
    message: "Use POST /_stub/sms to simulate an SMS. GET is not supported here."
  });
});
app.get("/_stub/crm", (req, res) => {
  res.status(405).json({
    error: "method_not_allowed",
    message: "Use POST /_stub/crm to simulate a CRM write. GET is not supported here."
  });
});

// Keep existing POST handlers (minimal stubs) — adapt to your logic
app.post("/_stub/call", (req, res) => {
  // echo back request and write audit if desired
  const payload = req.body || {};
  // TODO: actual simulation logic / audit write
  res.status(200).json({
    simulated: "call",
    received: payload,
    note: "This is a stub response (POST /_stub/call)."
  });
});

app.post("/_stub/sms", (req, res) => {
  const payload = req.body || {};
  res.status(200).json({
    simulated: "sms",
    received: payload,
    note: "This is a stub response (POST /_stub/sms)."
  });
});

app.post("/_stub/crm", (req, res) => {
  const payload = req.body || {};
  res.status(200).json({
    simulated: "crm",
    received: payload,
    note: "This is a stub response (POST /_stub/crm)."
  });
});

// Audit endpoints (simple file-backed or in-memory — adapt as needed)
const auditStore = [];
app.post("/_stub/audit", (req, res) => {
  const event = {
    ts: new Date().toISOString(),
    payload: req.body || {}
  };
  auditStore.push(event);
  res.status(201).json({ stored: true, event });
});
app.get("/_stub/audit", (req, res) => {
  res.status(200).json({ count: auditStore.length, items: auditStore });
});

// Calendar availability stub (simple fixed response)
app.get("/_stub/calendar/availability", (req, res) => {
  // simple example: next 3 slots
  const now = new Date();
  const slots = [1,2,3].map(n => {
    const d = new Date(now.getTime() + n * 60 * 60 * 1000);
    return d.toISOString();
  });
  res.status(200).json({ slots });
});

// Fallback for unknown routes — helpful debugging message
app.use((req, res) => {
  res.status(404).json({
    error: "not_found",
    path: req.originalUrl,
    message: "Unknown endpoint. Visit GET / for a list of known stub endpoints."
  });
});

app.listen(PORT, () => {
  // keep logs friendly for Railway / deploy logs
  /* eslint-disable no-console */
  console.info(`${APP_NAME} running on port ${PORT}`);
  console.info("Available endpoints:", STUB_ENDPOINTS.map(e => `${e.method} ${e.path}`).join(", "));
});
