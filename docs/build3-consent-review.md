# Build 3 (keep-in-touch): consent design review, before any real contact

Status: reviewed 2026-10-30 against the sandbox build, then revised after a blind review.

**Bottom line: not ready for real contact.** The tested guards work on synthetic data, but see gaps 13-19 below. Nothing here authorizes contacting a real person.
Not legal advice. Which rules apply (CAN-SPAM in the US, plus any state rules and the client's own policy) must be confirmed for each client before launch.

## What the build enforces today (tested on synthetic data)
| Control | How it works | Tested |
|---|---|---|
| Human approval before any send | Drafts are created `pending`; only `approved` drafts are eligible to send | Yes (approve helper, then send) |
| STOP / opt-out words | Reply Intake matches stop, unsubscribe, opt out, remove me, do not contact, no more emails, leave me alone; sets contact `opted_out` | Yes: synthetic rows and one real reply from Michael's inbox |
| Any reply pauses outreach | A non-STOP reply sets `replied`; the contact is no longer `active` | Synthetic rows only (not live) |
| Pending AND approved-unsent drafts cancelled on reply/STOP | Reply Intake cancels both statuses | Cancel-pending yes; cancel-approved edit built, not exercised on its own |
| Re-check at send time | Send step re-reads the contact; only `active` contacts are sent | Yes: approved nudge for an opted-out contact was blocked, nothing sent |
| Touch cap | 3 per contact per 12 months, plus 90-day minimum gap | Draft stage yes; send-stage cap path not exercised |
| Per-run cap | Max 3 sends per run; the rest are logged as deferred | Yes (3 sent, 1 deferred) |
| One draft per contact | Contacts read once per run; pending or approved draft blocks a new one | Yes after fix (see defects) |
| Test redirect | Test send forces recipient to Michael's inbox | Yes |

## Gaps that must close before any real contact (decisions for Michael or the client)
1. **Opt-out channel coverage.** The watcher reads one Gmail inbox only. Replies by SMS, phone, a different address, or to a different inbox are not seen. A contact who opts out elsewhere must be marked by a human.
2. **Opt-out word list is English, keyword-based.** "Please stop emailing" matches; "I'm not interested, don't write again" may not. Misses are the risky direction. Decide whether unclear replies pause outreach and go to a human (recommended) rather than only matching keywords.
3. **Quoted text risk.** The watcher cuts quoted original text so the footer's "reply STOP" is not read as an opt-out. Tested on one real reply (STOP) and one constructed snippet; other mail clients quote differently (Outlook "From:" blocks). Needs checking against the client's real mail clients.
4. **Bounce and complaint handling is not built.** Hard bounces and spam complaints should set the contact to `do_not_contact`.
5. **Lawful basis and list source.** Who these contacts are and how they gave their details is a client fact, not a workflow property. No import of real contacts until the client confirms source and permission.
6. **Required message content.** US commercial email needs sender identity, a working opt-out, and a physical postal address in each message. The current template has opt-out text only; address and sender identity are not included.
7. **Sender reputation.** The send path uses a personal Gmail credential in the sandbox. A client send needs the client's own sending domain and limits.
8. **Retention.** How long inbound reply text and contact records are kept is undecided.
9. **Human review of replies.** A reply sets a status but nobody is notified. A real build should alert the owner on any reply.

10. **Opt-out matching is a substring match.** "stop" anywhere in a reply counts, so a harmless sentence can opt someone out (safe direction, but loses a real conversation), while phrasing without the listed words is missed (unsafe direction). Route unclear replies to a human.
11. **Watcher limits.** It reads at most 10 messages from the last 3 days and only subjects starting "Re: [PG TEST". A real build needs its own search rule, paging and a miss alarm.
12. **Cancel-approved-on-reply is unproven on its own.** The send-time re-check is the tested backstop.

13. **The watcher cannot see real replies.** Its search is limited to subjects starting "Re: [PG TEST". A real reply to "Checking in" would be missed, the contact would stay active, and the next nudge could go out. Test scope only.
14. **Manual ordering.** Captured replies are not acted on until Reply Intake runs, and the send step does not check unprocessed replies. Real use needs capture and intake as one step before any send.
15. **Send is not idempotent.** Order is email, mark nudge, count touch; a failure between steps can re-send.
16. **Approval is weak.** A status flip, no approver or expiry, and the body can change after approval. Real use should freeze the approved text.
17. **Matching by exact contact key and email.** Duplicate contacts and plus-addresses can escape suppression. The send guard now also suppresses by email address and one-per-contact-per-run, but this is built, not tested live.
18. **Unknown senders** who say STOP are only logged, never suppressed.
19. **Fixed after the review (table-tested):** an opted-out contact can no longer be downgraded to replied by a later message; opt-out phrases widened ("don't email me", "take me off", "unsubscribed"). Phrase matching is still keyword-based and English only.

## Recommendation
Keep Build 3 draft-and-approve only for the first client pilot. Do not enable automatic sending. Before the first real contact close gaps 1, 2, 4, 6, 9, 13, 14, 15 and 16, and get the client's written confirmation on 5.
