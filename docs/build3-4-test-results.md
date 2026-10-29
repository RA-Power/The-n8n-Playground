# Builds 3 and 4: test results (2026-10-30, synthetic only, nothing sent)

## Build 3: PG - Keep in Touch Drafts (draft-only)
Workflow XZqZCholnAJh48TA. Tables pg_contacts, pg_nudges. 6 synthetic contacts.
| Case | Expected | Result |
|---|---|---|
| Active, last contact April | draft created | PASS |
| Active, never contacted | draft created | PASS |
| Contacted 20 days ago | skip contacted_within_90_days | PASS |
| opted_out | skip status_opted_out | PASS |
| replied | skip status_replied | PASS |
| 3 touches already | skip touch_cap_reached | PASS |
| Re-run: contacts with a pending draft | skip draft_already_pending, no new rows | PASS (still 2 drafts) |
Not built: sending, and the STOP-reply detector (a reply must set status=replied or opted_out; today that is a manual or future-trigger step). No referral/review ask in the copy by design.

## Build 4: showing scheduler without calendar
Workflows: Showing Proposals CEbUg0XIPJ31tZas, Showing Hold 77vuye5ePY2cP20N, test helper q67baENTMvnRhzH5 (stands in for the human approval click). Table pg_showings.
| Case | Expected | Result |
|---|---|---|
| Valid date + afternoon | 3 slots + draft reply (not sent) | PASS |
| Vague date ("whenever") | needs_info, no slots | PASS |
| Two approved requests for same slots | first holds 13:00, second holds 14:30 (no double booking) | PASS |
Not built: Telegram approval, Google Calendar hold. The "hold" is a table row, not a calendar event. Needs Telegram bot token (Michael creates) and a Calendar credential.
