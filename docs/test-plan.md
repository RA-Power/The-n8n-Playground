# Build 1 + 5 acceptance tests

Run date: 2026-10-30. T1-T4 and T6 were manual executions through the n8n connector (logic and table writes only; HTTP codes and the key check are not exercised in manual mode). T5, T7 and T8 were real HTTP calls from PG - Test Sender to the published webhook. Synthetic data only; nothing was emailed.

| Case | What is sent | Expected HTTP | Expected status | pg_leads | pg_action_log outcome | Result |
|---|---|---|---|---|---|---|
| T1 | Valid synthetic lead | 200 | received | +1 row | lead_created | PASS (manual run: lead row + log lead_created) |
| T2 | Same lead again | 200 | duplicate_ignored | no new row | duplicate_ignored | PASS (manual run: no 2nd lead row, log duplicate_ignored) |
| T3 | Email missing | 400 | rejected | none | rejected_invalid (email_required) | PASS (manual run: not stored, log email_required) |
| T4 | Email malformed | 400 | rejected | none | rejected_invalid (email_invalid) | PASS (manual run: not stored, log email_invalid) |
| T5 | Message over 2000 chars | 400 | rejected | none | rejected_invalid (message_too_long) | PASS (real HTTP via Test Sender: 400 rejected, log message_too_long) |
| T6 | Injection-style text in message | 200 | received | +1 row, text stored as plain text | lead_created | PASS (manual run: stored as plain text, log lead_created) |
| T7 | Forced error (`source=pg-force-error`) | 500 | n/a | none | workflow_error (from Error Logger) | PASS (real HTTP: 500, error workflow logged workflow_error) |
| T8 | No key header | 403 | n/a | none | no row (request never reaches workflow) | PASS (real HTTP: 403 without key) |

## Also check by eye

- `pg_leads` has exactly 2 rows after a clean first run (T1, T6). Re-running the sender adds 2 new rows because each run uses a fresh stamp.
- No email arrived anywhere (Email alert is disabled).
- Cadence workflows are still Active and unchanged.

## Known gaps to report honestly

- The workflows were rebuilt through the n8n SDK and are the source of truth in PG-Sandbox. The older `workflows/*.json` paste-import files are superseded and were never imported.
- Not yet tested: a request with a wrong (not missing) key; the Error Logger records "unknown node" instead of the failing node name (cosmetic, fix pending).
- The `pg-force-error` hook is test-only and must be removed before any client delivery.
- Header Auth proves a shared-secret check only. It is not a full security review.
