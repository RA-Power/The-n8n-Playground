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

## Update: real estate template + HTTP checks (2026-10-30)
- Decision webhook published for test, then unpublished with intake. Real HTTP: invalid decision 400, unknown lead 404, no key 403, wrong key 403 (both webhooks), approve on a real pending draft 200 `approved_not_sent`. All as expected. Wrong-key case now tested for intake too.
- Draft template now routes by inquiry type with deterministic keyword rules (buyer, seller, renter, general). 4 synthetic leads each got the matching draft (PASS). Wording is generic test copy, written by Claude, not reviewed by a real agent. Drafts use a `[Your name]` placeholder.
- Gmail credential created in PG-Sandbox by Michael (default name "Gmail account 2"). No send step built or run yet.
- Intake and decision webhooks are currently unpublished (publish/unpublish is a one-call toggle).

## AI draft test (2026-10-30, synthetic only)

- Workflow: PG - AI Draft Test (yu3Zk4buk31K7IjG), manual trigger, 3 fixed synthetic leads (buyer, seller, renter), Basic LLM Chain + Anthropic model on n8n Gateway credits, Claude Haiku 5.5, max 300 tokens. Nothing stored, nothing sent.
- First run via the connector errored before any model call (balance unchanged); cause not captured. Model default was Sonnet 4.5, switched to Haiku 5.5 and re-run from the editor.
- Result: 3 of 3 drafts returned, 955 tokens total, 4.1 s. Drafts stayed generic, invented no prices or listings, ended with a call suggestion and [Your name].
- Cost: Gateway balance still displayed $1.99 afterward, so under one cent for three drafts. The dashboard shows whole cents only; exact per-draft cost not observed.
- Not proven: draft quality for a real agent's voice, behavior on messy real inquiries, cost at volume.
