# Builds 3 and 4: live test results (2026-10-30, synthetic data, sends to Michael only)

Run log (Method F): approval envelope given by Michael in chat. Cap 8 side-effecting runs (runs that email, write to the calendar, post to Telegram or read the inbox), 8 used (the 8th sent nothing). Table-only helper runs (seeding, staging, drafting, Reply Intake) were not counted against the cap; there were roughly a dozen of them, listed in the cleanup note below.

## How to read this document: what the evidence is
- Every PASS below rests on **n8n run logs and table rows read back after each run** (pg_action_log and the data tables) plus, for the calendar, the log of the event read-back. It does not rest on reading the code.
- The live definitions are in n8n. The repo is a copy and was behind during the loop. It was brought up to date afterwards: `sdk/pg-build3-keep-in-touch.ts`, `sdk/pg-build3-inbox-watcher.ts`, `sdk/pg-build3-send-nudges.ts`, `exports/reply-intake.json`, and for Build 4 the exact edit that was applied to n8n, saved as `sdk/pg-build4-calendar-edit.ops.json`. `exports/keep-in-touch-drafts.json` and the other exports were **not** refreshed, and the Build 4 approval workflow has no full SDK source in the repo, only that edit. Do not treat the older exports as the current behavior.
- The calendar write, TEST label, attendee count, read-back, delete and confirmation-draft rows are therefore verified from logs, not from code in this repo.
Envelope: tap handler published for the test window then unpublished; one TEST calendar event on Michael's own calendar, deleted; Gmail read limited to subjects starting "Re: [PG TEST"; at most 4 test emails, all to Michael.

## Build 4: showing scheduler (Telegram approval, calendar write, confirmation draft)
| Check | Result |
|---|---|
| Request seeded, proposed 3 slots, Telegram message with Approve/Decline buttons | PASS |
| Michael tapped Approve: row hold_confirmed at 2026-11-21 13:00 | PASS |
| TEST event written to Michael's own calendar inside the approval step | PASS (event id logged) |
| Event read back: confirmed, summary labeled TEST HOLD (synthetic), attendees=0 | PASS |
| Event deleted afterward | PASS (delete logged success) |
| Confirmation draft created as pending, not sent | PASS |
| Draft approved, sent through the existing send step to Michael's inbox only | PASS (1 email; draft marked sent_test) |
| Tap handler unpublished after the test | PASS (inactive) |
Not tested live: Decline path after the edit (it passed before the edit, so it is not evidence for the new flow), wrong-chat tap, row-not-found, Telegram answer/edit failures, two requests competing for the same slot after the edit, already-handled tap, needs_new_times branch with the calendar nodes, calendar failure mid-run (error workflow is set but not triggered), time zone other than +08:00.

## Build 3: keep-in-touch
| Check | Result |
|---|---|
| 4 fresh synthetic contacts drafted, one per contact after fix | PASS for one re-run (no extra rows); this shows the symptom is gone, not that every cause is closed |
| Capped send: 4 approved, 3 sent to Michael, 1 deferred by run cap | PASS, one run; the cap is per run and order is by draft id |
| Touch counts and last-contacted updated for the 3 sent | PASS |
| Inbox watcher read Michael's real STOP reply (read-only) and wrote an inbound row | PASS |
| Reply Intake matched the sender, set Synthetic Self to opted_out, logged it | PASS |
| Send-time guard blocked an approved nudge for an opted-out contact; no email | PASS, one case only (the not-active branch) |
| Watcher re-run added no duplicate row | PASS |
Not tested live: plain (non-STOP) reply through the watcher; STOP matching is a keyword match anywhere in the text, so a phrase like "please don't stop by" would opt a contact out; watcher reads at most 10 messages from the last 3 days with a subject starting "Re: [PG TEST", so older, more numerous or retitled replies are missed; unknown-sender inbound; bad-email, 90-day-gap and empty last-contacted skips beyond the original seeded cases; touch counts and dates ran on seeded values only; sending to a real recipient (the send step is hard-wired to Michael's address); replies from a different mail client; touch-cap block at send time; watcher against real client volume.

## Second round after blind review (table-only tests plus run 8)
| Check | Result |
|---|---|
| Opted-out contact replies "thanks": stays opted_out, logged contact_reply_still_opted_out | PASS (1 case, synthetic row) |
| "Please don't email me again" and "Take me off your list" set opted_out | PASS (2 phrases, synthetic rows) |
| Ordinary reply sets replied | PASS |
| Rewritten send guard ran without error; touch-capped contact blocked, opted-out contact blocked, no email | PASS (run 8; 2 branches only) |
Built but not run: one-per-contact-per-run, in-run touch counting, 90-day gap at send, suppression by email address.

## Defects found and fixed during the loop
1. Keep in Touch created duplicate drafts (8 rows for 4 contacts): the contacts lookup ran once per existing draft row. Fixed with run-once setting and a per-run dedupe; re-run produced no extra rows.
2. Approved-but-unsent drafts did not block a new draft. Fixed: pending or approved both block.
3. Watcher's quoted-text cut-off missed Gmail's long "On ... wrote:" line, so the original footer text could reach the STOP matcher. Fixed with a longer match; tested on the real snippet and a constructed non-STOP reply.
4. Reply Intake cancelled only pending nudges; now cancels approved-unsent ones too. The edit is built but has no PASS of its own: the STOP reply came after Self's nudge was already sent, so the cancel-approved path was not exercised; the send-time guard is the tested backstop.

## Helper runs not counted against the cap
Seed Build 3 live contacts, Keep in Touch drafts (3 runs: first drafts, fix check, none sent), Approve Nudges helper, Seed Telegram test, Showing Proposals, Reply Intake (1), Stage Live Tests helper. All wrote only to sandbox tables. Helper workflows remain in the sandbox and must be deleted before any client delivery.

## Known limits found by blind review that were NOT fixed (decisions or later builds)
- The inbox watcher only sees subjects starting "Re: [PG TEST". A real reply to "Checking in" would not be captured. This is test scope; real use needs a broader search and Michael's or the client's approval for the mailbox scope.
- Replies wait at processed=no until Reply Intake is run; the send step does not look at unprocessed inbound rows.
- Send order is email, then mark nudge, then count the touch; a failure between steps could re-send on the next run. Approval is a status flip with no approver, time or expiry, and the body can be edited after approval.
- Duplicate contacts with the same email, plus-address replies, bounces, complaints, unknown-sender opt-outs and owner notification on replies are not handled.
