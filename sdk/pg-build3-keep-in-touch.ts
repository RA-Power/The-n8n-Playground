const LOG = 'Mokhl3J3DiBVad0D';
const CONTACTS = '8WAw5aHyrB4ah2il';
const NUDGES = 'Ssk60r4bQd30sUpD';

const trig = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Manual Trigger' } });

const getNudges = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Get nudges', alwaysOutputData: true, parameters: {
    resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: NUDGES }, returnAll: true } }
});

const getContacts = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Get contacts', executeOnce: true, parameters: {
    resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: CONTACTS }, returnAll: true } }
});

const decide = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Decide', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const today = new Date().toISOString().slice(0, 10);
const MIN_DAYS = 90;
const MAX_TOUCHES = 3;
const pending = {};
$('Get nudges').all().forEach(function (i) { if (i.json && i.json.contact_key && (i.json.status === 'pending' || i.json.status === 'approved')) { pending[i.json.contact_key] = true; } });
function daysSince(d) { return Math.floor((new Date(today) - new Date(d)) / 86400000); }
const out = [];
const done = {};
$input.all().forEach(function (i) {
  const c = i.json;
  let action = 'draft';
  let reason = 'eligible';
  if (!c.contact_key) { return; }
  if (done[c.contact_key]) { return; }
  done[c.contact_key] = true;
  if (c.status !== 'active') { action = 'skip'; reason = 'status_' + c.status; }
  else if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(String(c.email || ''))) { action = 'skip'; reason = 'bad_email'; }
  else if (Number(c.touches_12m || 0) >= MAX_TOUCHES) { action = 'skip'; reason = 'touch_cap_reached'; }
  else if (c.last_contacted && daysSince(c.last_contacted) < MIN_DAYS) { action = 'skip'; reason = 'contacted_within_90_days'; }
  else if (pending[c.contact_key]) { action = 'skip'; reason = 'draft_already_pending'; }
  const first = String(c.name || 'there').split(' ')[0];
  const subject = 'Checking in';
  const body = 'Hi ' + first + ',\\n\\nIt has been a little while, so I wanted to check in and see how things are going. If anything about your plans has changed, I am happy to chat.\\n\\nIf you would rather not get these notes, just reply STOP and I will take you off the list.\\n\\n[Your name]\\n\\n[DRAFT - NOT SENT - requires human approval]';
  out.push({ json: { action: action, reason: reason, contact_key: c.contact_key, name: c.name, email: c.email, draft_subject: subject, draft_body: body, created_at: new Date().toISOString() } });
});
return out;` } }
});

const isDraft = ifElse({ version: 2.2, config: { name: 'Draft?', parameters: { conditions: {
  options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
  conditions: [{ leftValue: expr('{{ $json.action }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'draft' }],
  combinator: 'and' } } } });

const insertNudge = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Insert nudge draft', parameters: {
    resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: NUDGES },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
      contact_key: expr('{{ $json.contact_key }}'), name: expr('{{ $json.name }}'), email: expr('{{ $json.email }}'),
      draft_subject: expr('{{ $json.draft_subject }}'), draft_body: expr('{{ $json.draft_body }}'),
      status: 'pending', created_at: expr('{{ $json.created_at }}') } } } }
});

const logDraft = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Log draft', parameters: {
    resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: LOG },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
      logged_at: expr('{{ $now.toISO() }}'), workflow: 'PG - Keep in Touch Drafts', outcome: 'nudge_draft_created',
      lead_key: expr('{{ $(\'Decide\').item.json.contact_key }}'), detail: 'status=pending, not sent' } } } }
});

const logSkip = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Log skip', parameters: {
    resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: LOG },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
      logged_at: expr('{{ $now.toISO() }}'), workflow: 'PG - Keep in Touch Drafts', outcome: 'nudge_skipped',
      lead_key: expr('{{ $json.contact_key }}'), detail: expr('{{ $json.reason }}') } } } }
});

export default workflow('pg-keep-in-touch', 'PG - Keep in Touch Drafts')
  .add(trig).to(getNudges).to(getContacts).to(decide)
  .to(isDraft.onTrue(insertNudge.to(logDraft)).onFalse(logSkip));
