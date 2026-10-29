# Build 1 + 5 acceptance tests

Run **PG - Test Sender** after setup (see README). Mark results from the real run only. Until then every row is `Not run`.

| Case | What is sent | Expected HTTP | Expected status | pg_leads | pg_action_log outcome | Result |
|---|---|---|---|---|---|---|
| T1 | Valid synthetic lead | 200 | received | +1 row | lead_created | Not run |
| T2 | Same lead again | 200 | duplicate_ignored | no new row | duplicate_ignored | Not run |
| T3 | Email missing | 400 | rejected | none | rejected_invalid (email_required) | Not run |
| T4 | Email malformed | 400 | rejected | none | rejected_invalid (email_invalid) | Not run |
| T5 | Message over 2000 chars | 400 | rejected | none | rejected_invalid (message_too_long) | Not run |
| T6 | Injection-style text in message | 200 | received | +1 row, text stored as plain text | lead_created | Not run |
| T7 | Forced error (`source=pg-force-error`) | 500 | n/a | none | workflow_error (from Error Logger) | Not run |
| T8 | No key header | 403 | n/a | none | no row (request never reaches workflow) | Not run |

## Also check by eye

- `pg_leads` has exactly 2 rows after a clean first run (T1, T6). Re-running the sender adds 2 new rows because each run uses a fresh stamp.
- No email arrived anywhere (Email alert is disabled).
- Cadence workflows are still Active and unchanged.

## Known gaps to report honestly

- Files were authored without running n8n: node parameter shapes (Data table nodes especially) may need a fix after first import.
- The `pg-force-error` hook is test-only and must be removed before any client delivery.
- Header Auth proves a shared-secret check only. It is not a full security review.
