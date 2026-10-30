# Builds 3 and 4: live test results (2026-10-30, synthetic data, sends to Michael only)

Run log (Method F): approval envelope given by Michael in chat. Cap 8 side-effecting runs, 7 used.
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
Not tested live: Decline path after the edit (earlier build tested it), already-handled tap, needs_new_times branch with the calendar nodes, calendar failure mid-run (error workflow is set but not triggered), time zone other than +08:00.

## Build 3: keep-in-touch
| Check | Result |
|---|---|
| 4 fresh synthetic contacts drafted, one per contact after fix | PASS |
| Capped send: 4 approved, 3 sent to Michael, 1 deferred by run cap | PASS |
| Touch counts and last-contacted updated for the 3 sent | PASS |
| Inbox watcher read Michael's real STOP reply (read-only) and wrote an inbound row | PASS |
| Reply Intake matched the sender, set Synthetic Self to opted_out, logged it | PASS |
| Send-time guard blocked an approved nudge for an opted-out contact; no email | PASS |
| Watcher re-run added no duplicate row | PASS |
Not tested live: plain (non-STOP) reply through the watcher; replies from a different mail client; touch-cap block at send time; watcher against real client volume.

## Defects found and fixed during the loop
1. Keep in Touch created duplicate drafts (8 rows for 4 contacts): the contacts lookup ran once per existing draft row. Fixed with run-once setting and a per-run dedupe; re-run produced no extra rows.
2. Approved-but-unsent drafts did not block a new draft. Fixed: pending or approved both block.
3. Watcher's quoted-text cut-off missed Gmail's long "On ... wrote:" line, so the original footer text could reach the STOP matcher. Fixed with a longer match; tested on the real snippet and a constructed non-STOP reply.
4. Reply Intake cancelled only pending nudges; now cancels approved-unsent ones too (edit built; the guard test covers the send-time backstop).
