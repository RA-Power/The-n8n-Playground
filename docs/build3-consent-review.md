# Build 3 (keep-in-touch): consent design review, before any real contact

Status: reviewed 2026-10-30 against the sandbox build. Nothing here authorizes contacting a real person.
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

## Recommendation
Keep Build 3 draft-and-approve only for the first client pilot. Do not enable automatic sending. Close gaps 1, 2, 4, 6 and 9 and get the client's written confirmation on 5 before the first real contact.
