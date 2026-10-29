# Build 2 (draft, then human approve) - results

Run 2026-10-30 in PG-Sandbox. Synthetic data only. Nothing sent. No credentials beyond the existing webhook key, no AI, no paid calls.
Workflows: PG - Draft Replies (manual), PG - Draft Decision (webhook, NOT published, so only manual runs so far). Tables: pg_drafts plus existing pg_leads, pg_action_log.

| Case | Action | Observed | Result |
|---|---|---|---|
| D1 | Run Draft Replies with 2 new leads | 2 pending drafts, both leads set to `drafted`, 2 `draft_created` log rows | PASS |
| D2 | Run Draft Replies again | No new drafts, no new log rows (duplicate protection) | PASS |
| D3 | Approve a pending draft | Status `approved_not_sent`, decided_at and note recorded, log `draft_approved_not_sent` | PASS |
| D4 | Reject a pending draft | Status `rejected`, log `draft_rejected` | PASS |
| D5 | Decide the same draft again | Refused (`decision_no_pending_draft`), original approval unchanged | PASS |
| D6 | Invalid decision value | Refused, log `decision_rejected_invalid` | PASS |
| D7 | Unknown lead_key | Refused, log `decision_no_pending_draft` | PASS |

Also fixed and verified: Error Logger now names the failing node (`Validate: PG test hook...`).

## Not tested / limits
- Decision webhook HTTP codes and key check: not exercised (workflow unpublished, manual runs only).
- Drafts are one fixed template. The injection-style lead received the same draft, so message text does not steer the draft. No AI drafting is tested.
- "Approved" means recorded only. There is no send step. A real send needs a Gmail credential and fresh approval.
- Drafts use only the first-name field. Wording is generic, not tuned for real estate.
