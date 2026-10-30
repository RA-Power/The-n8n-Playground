const NUDGES = 'Ssk60r4bQd30sUpD';
const CONTACTS = '8WAw5aHyrB4ah2il';
const LOG = 'Mokhl3J3DiBVad0D';
const trig = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Manual Trigger' } });
const getN = node({ type: 'n8n-nodes-base.dataTable', version: 1.1, config: { name: 'Get approved nudges', alwaysOutputData: true, parameters: {
  resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: NUDGES }, returnAll: true,
  filters: { conditions: [{ keyName: 'status', condition: 'eq', keyValue: 'approved' }] }, matchType: 'allConditions' } } });
const getC = node({ type: 'n8n-nodes-base.dataTable', version: 1.1, config: { name: 'Get contacts now', executeOnce: true, parameters: {
  resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: CONTACTS }, returnAll: true } } });
const guard = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Consent check and cap', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const MAX = 3;
const MAX_TOUCHES = 3;
const MIN_DAYS = 90;
const TEST_TO = 'michael.henry.miller@remote-advisor.com';
const today = new Date().toISOString().slice(0, 10);
function daysSince(d) { return Math.floor((new Date(today) - new Date(d)) / 86400000); }
const contacts = {};
const suppressed = {};
$input.all().forEach(function (i) {
  const c = i.json;
  if (!c || !c.contact_key) { return; }
  const prev = contacts[c.contact_key];
  if (!prev || c.status !== 'active') { contacts[c.contact_key] = c; }
  if (c.status !== 'active' && c.email) { suppressed[String(c.email).toLowerCase()] = true; }
});
const nudges = $('Get approved nudges').all().map(function (i) { return i.json; }).filter(function (n) { return n && n.id; }).sort(function (a, b) { return Number(a.id) - Number(b.id); });
let sent = 0;
const sentBy = {};
return nudges.map(function (n) {
  const c = contacts[n.contact_key];
  let action = 'send';
  let outcome = 'nudge_sent_test';
  const already = sentBy[n.contact_key] || 0;
  if (!c || c.status !== 'active') { action = 'block'; outcome = 'nudge_blocked_not_active'; }
  else if (suppressed[String(n.email || '').toLowerCase()]) { action = 'block'; outcome = 'nudge_blocked_suppressed_email'; }
  else if (Number(c.touches_12m || 0) + already >= MAX_TOUCHES) { action = 'block'; outcome = 'nudge_blocked_touch_cap'; }
  else if (c.last_contacted && daysSince(c.last_contacted) < MIN_DAYS) { action = 'block'; outcome = 'nudge_blocked_90_day_gap'; }
  else if (already >= 1) { action = 'block'; outcome = 'nudge_deferred_one_per_contact'; }
  else if (sent >= MAX) { action = 'block'; outcome = 'nudge_deferred_run_cap'; }
  else { sent += 1; sentBy[n.contact_key] = already + 1; }
  return { json: { action: action, outcome: outcome, id: n.id, contact_key: n.contact_key, original_to: n.email, to: TEST_TO,
    subject: '[PG TEST - synthetic] ' + n.draft_subject,
    body: 'SANDBOX TEST. This would have gone to: ' + n.email + '\\n----------\\n\\n' + String(n.draft_body).replace('[DRAFT - NOT SENT - requires human approval]', ''),
    new_touches: String(Number(c ? c.touches_12m : 0) + 1), today: today } };
});` } } });
const isSend = ifElse({ version: 2.2, config: { name: 'Send?', parameters: { conditions: {
  options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
  conditions: [{ leftValue: expr('{{ $json.action }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'send' }],
  combinator: 'and' } } } });
const gm = node({ type: 'n8n-nodes-base.gmail', version: 2.2, config: { name: 'Send test email to Michael', parameters: {
  resource: 'message', operation: 'send', emailType: 'text', sendTo: expr('{{ $json.to }}'), subject: expr('{{ $json.subject }}'),
  message: expr('{{ $json.body }}'), options: { appendAttribution: false } } } });
const markN = node({ type: 'n8n-nodes-base.dataTable', version: 1.1, config: { name: 'Mark nudge sent_test', parameters: {
  resource: 'row', operation: 'update', dataTableId: { __rl: true, mode: 'id', value: NUDGES },
  filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr("{{ $('Consent check and cap').item.json.id }}") }] }, matchType: 'allConditions',
  columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: { status: 'sent_test' } } } } });
const markC = node({ type: 'n8n-nodes-base.dataTable', version: 1.1, config: { name: 'Count the touch', parameters: {
  resource: 'row', operation: 'update', dataTableId: { __rl: true, mode: 'id', value: CONTACTS },
  filters: { conditions: [{ keyName: 'contact_key', condition: 'eq', keyValue: expr("{{ $('Consent check and cap').item.json.contact_key }}") }] }, matchType: 'allConditions',
  columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
    touches_12m: expr("{{ $('Consent check and cap').item.json.new_touches }}"), last_contacted: expr("{{ $('Consent check and cap').item.json.today }}") } } } } });
const logSent = node({ type: 'n8n-nodes-base.dataTable', version: 1.1, config: { name: 'Log sent', parameters: {
  resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: LOG },
  columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
    logged_at: expr('{{ $now.toISO() }}'), workflow: 'PG - Send Nudges (test)', outcome: 'nudge_sent_test',
    lead_key: expr("{{ $('Consent check and cap').item.json.contact_key }}"), detail: 'sent to Michael inbox only; real recipient not contacted' } } } } });
const logBlock = node({ type: 'n8n-nodes-base.dataTable', version: 1.1, config: { name: 'Log not sent', parameters: {
  resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: LOG },
  columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
    logged_at: expr('{{ $now.toISO() }}'), workflow: 'PG - Send Nudges (test)', outcome: expr('{{ $json.outcome }}'),
    lead_key: expr('{{ $json.contact_key }}'), detail: 'not sent' } } } } });
export default workflow('pg-send-nudges', 'PG - Send Nudges (test)')
  .add(trig).to(getN).to(getC).to(guard)
  .to(isSend.onTrue(gm.to(markN).to(markC).to(logSent)).onFalse(logBlock));
