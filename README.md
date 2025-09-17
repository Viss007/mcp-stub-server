# MCP Stub Server (staging/testing)

This small Node.js project provides stub endpoints useful for testing `Speed-to-Lead` flows
in a staging environment. It intentionally **does not** connect to real telephony, SMS, CRM or calendar services.
Instead, it simulates responses and writes audit events to `audit.log.json`.

## Files included
- `index.js` - the server
- `package.json` - npm metadata
- `README.md` - this file
- `audit.log.json` - created at runtime when audit events are posted

## Endpoints
- `POST /_stub/call`         -> simulate a call, returns `{ call_simulation_id }`
- `POST /_stub/sms`          -> simulate an SMS, returns `{ sms_simulation_id }`
- `POST /_stub/crm`          -> simulate CRM write, returns `{ crm_id }`
- `GET /_stub/calendar/availability?days=2` -> returns up to 3 deterministic slots
- `POST /_stub/audit`        -> append a custom audit event
- `GET  /_stub/audit`        -> fetch stored audit events

## Run locally (staging)
1. Install Node.js (>=18 recommended).
2. Extract the zip and `cd` into the folder.
3. Run `npm install`
4. Run `npm start`
5. Server runs on port 3000 by default: `http://localhost:3000`

## Notes & safety
- Only use in local or isolated staging environments.
- Audit file `audit.log.json` is stored in the same folder and is used for simple testing inspection.
- Do **not** use real production credentials with this stub.

## Example curl
```bash
curl -X POST "http://localhost:3000/_stub/call" -H "Content-Type: application/json" -d '{"name":"Jonas","phone":"+37060000001"}'
```

## License
MIT
