# The n8n Playground

Synthetic-only practice area for Michael's n8n builds. Nothing here touches a real client, real contact, or real inbox.

## Status (honest labels)

| Item | State |
|---|---|
| PG - Inquiry Intake, PG - Error Logger, PG - Test Sender (in n8n PG-Sandbox) | **Built, tested, published (sandbox only).** 8 of 8 acceptance tests PASS on synthetic data, 2026-10-30. Not commercially validated. Source: `sdk/`. |
| Build 2: PG - Draft Replies, PG - Draft Decision (draft-then-approve, no send) | **Built and tested by manual runs only** (7 of 7 PASS, `docs/build2-test-results.md`). Decision webhook not published. No send, no AI. |
| `workflows/*.json` | **Superseded** early paste-import drafts, never imported. |
| Acceptance tests (`docs/test-plan.md`) | **Run.** Results recorded; scope limits noted there. |

## Approved envelope (Michael, 2026-10-30)

- **Where:** n8n workspace `rapower.app.n8n.cloud`, project **PG-Sandbox** only.
- **Data:** synthetic only (`example.com` addresses, made-up text). No real contacts, no client data.
- **Sends:** none. The only possible send is the Error Logger email alert to `michael.henry.miller@remote-advisor.com`, disabled until Michael creates a Gmail credential inside PG-Sandbox.
- **AI / paid calls:** none in this round (Build 1 + 5 are deterministic). Build 2 will need an Anthropic key with a low spend cap, approved separately.
- **GoHighLevel:** not used. No GHL reads or writes.
- **Credentials:** created by Michael inside PG-Sandbox. Never pasted into chat, files, or this repo. The only secret this round is the webhook key (`PG Webhook Secret`, Header Auth).
- **Do not touch:** any Cadence/FRC workflow or credential. Originals stay Active and unchanged.

## What Build 1 + 5 proves (and does not)

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
