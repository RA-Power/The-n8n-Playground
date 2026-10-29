# The n8n Playground

Synthetic-only practice area for Michael's n8n builds. Nothing here touches a real client, real contact, or real inbox.

## Status (honest labels, 2026-10-30)

All work is in n8n project **PG-Sandbox**, on synthetic data. "Tested" means observed behavior in the sandbox, not commercial results.

| Build | Workflows | State |
|---|---|---|
| 1 Secure intake | PG - Inquiry Intake | **Built and tested.** 8/8 acceptance tests, plus real-HTTP wrong-key, no-key and bad-input checks. Webhook currently unpublished. |
| 2 Draft then approve | PG - Draft Replies, PG - Draft Decision | **Built and tested.** Deterministic real estate template (buyer/seller/renter/general). Approval link tested through the real webhook with the stored key. Webhook currently unpublished. |
| 2b AI drafting | PG - AI Draft Test | **Tested once.** 3 synthetic leads, Claude Haiku 5.5 on Gateway credits, 955 tokens, cost under one cent (balance still $1.99). Not wired into Draft Replies. |
| 2c Send step | PG - Send Approved (test) | **Tested.** 5 emails to Michael's own inbox only (address hard-coded, max 5 per run, subject tagged). No lead address is ever used. |
| 3 Keep-in-touch | PG - Keep in Touch Drafts | **Built and tested, draft-only.** Guards: opted-out/replied, 90-day gap, 3-touch cap, no duplicate pending draft. No send, no reply detector. |
| 4 Showing scheduler | PG - Showing Proposals, PG - Showing Hold | **Built and tested without Telegram or Calendar.** Hold is a table row, double-booking guard works. |
| 5 Action log + errors | pg_action_log, PG - Error Logger | **Built and tested.** Every outcome logged; crashes logged by the error workflow. |
| Test helpers | Test Sender, Test Sender 2, Batch Approve, Test Decision Link, Approve Showings, Seed Builds 3-4 | Synthetic only. Delete before any client delivery. |

Superseded: `workflows/*.json` (early paste-import drafts, never imported).

## Approved envelope (Michael, 2026-10-30)

- **Where:** `rapower.app.n8n.cloud`, project **PG-Sandbox** only.
- **Data:** synthetic only (`example.com` addresses, made-up text).
- **Sends:** only to michael.henry.miller@remote-advisor.com, only through PG - Send Approved (test), each batch approved by Michael first.
- **AI:** limited tests on n8n Gateway credits (balance $1.99; no top-up bought).
- **GoHighLevel:** not used.
- **Credentials:** created by Michael inside PG-Sandbox (PG Webhook Secret, Gmail). Never in chat, files, or this repo.
- **Do not touch:** Cadence/FRC workflows and credentials.

## Known gaps

- Draft wording is Claude-written test copy, not reviewed by a real agent.
- No real website form connected; no real inbox watching.
- Build 3 has no reply/STOP detector; Build 4 has no Telegram approval or Calendar write.
- Full source for several workflows lives only in n8n (SDK source saved here for Intake and Build 3).
- `pg-force-error` test hook in Intake must be removed before client delivery.
- n8n licensing for client delivery is unverified (client workflows should run on the client's own instance; ask license@n8n.io).
- Header Auth is a shared-secret check, not a security review.

## What Builds 1 + 5 prove (and do not)

Proves, once tested: a front-door that refuses callers without the key, rejects bad input, ignores duplicates, stores good leads, logs every outcome, and logs crashes through a separate error workflow.

Does not prove: a real website form connection, email delivery, AI drafting, approval flows, or anything about a real estate business. Those are Build 2 and later.

## Setup (Michael, in n8n, about 10 minutes)

1. In **PG-Sandbox**, create two Data tables (all columns Text):
   - `pg_leads`: `lead_key`, `name`, `email`, `phone`, `source`, `message`, `status`, `received_at`
   - `pg_action_log`: `logged_at`, `workflow`, `outcome`, `lead_key`, `detail`
2. Create a **Header Auth** credential in PG-Sandbox named `PG Webhook Secret`: Name `X-PG-Key`, Value = a long random string you make up (a password-manager generated one is fine). Do not share it.
3. Import the three files (Workflows > top-right menu > Import from file, or paste JSON). Import **PG - Error Logger** first.
4. In each Data table node, re-pick the table. In **Webhook** and **Send with key**, pick `PG Webhook Secret`.
5. In **PG - Inquiry Intake** > Settings > Error workflow, pick **PG - Error Logger**.
6. Activate **PG - Inquiry Intake** (the webhook only answers production calls when active).
7. Run **PG - Test Sender** with Execute workflow. Fill the results into `docs/test-plan.md`.

## Cleanup / rollback

Deactivate **PG - Inquiry Intake**; delete the three workflows, two Data tables, and the credential from PG-Sandbox. Nothing outside PG-Sandbox is changed by this repo.

## Regenerating files

`python3 tools/build_workflows.py` rewrites `workflows/` deterministically and re-runs the static checks.
