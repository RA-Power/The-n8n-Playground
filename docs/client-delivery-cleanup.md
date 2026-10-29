# Cleanup before any client delivery

Done 2026-10-30: `pg-force-error` test hook removed from PG - Inquiry Intake (T7 forced-error test can no longer be reproduced; the error workflow itself was verified earlier).

Still to do per client delivery:
1. Build the client's workflows fresh in the client's own n8n (or your own instance if the client only receives outputs, see license note below). Do not ship the PG test helpers: Test Sender, Test Sender 2, Batch Approve, Test Decision Link, Approve Showings helper, Seed Builds 3-4, Seed Inbound, Send Approved (test).
2. Replace the hard-coded test address in Send Approved with the real, approved sending rule and add reply-stop to the send step.
3. Create new credentials and a new webhook key for the client; never reuse the sandbox ones.
4. Replace synthetic data tables; confirm no example.com rows remain.
5. Re-run acceptance tests against the client's copy and record results.
6. Get written consent for any message sent in the client's name.

License (checked 2026-10-30, official n8n license FAQ + community thread): building and running workflows for clients on an instance you operate, and charging for that work, is allowed so long as clients only receive outputs and never access the n8n instance or its logic. Hosting n8n as a service where clients build their own workflows is not. The FAQ says it does not cover n8n Cloud, which has its own terms, so get written confirmation from license@n8n.io before relying on Cloud for client work. This corrects the earlier summary that said client workflows must run on the client's own instance.
