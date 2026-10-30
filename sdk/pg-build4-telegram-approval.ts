const SHOW = '6lpDzAPx8d0I9RqA';
const LOG = 'Mokhl3J3DiBVad0D';

const trig = trigger({
  type: 'n8n-nodes-base.telegramTrigger', version: 1.2,
  config: { name: 'Button tap', parameters: { updates: ['callback_query'], additionalFields: {} } }
});

const parse = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Parse tap', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const cq = $input.first().json.callback_query;
const parts = String(cq.data || '').split(':');
const ok = String(cq.message.chat.id) === '9097756794' && (parts[0] === 'approve' || parts[0] === 'decline') && /^\\d+$/.test(parts[1] || '');
return [{ json: { allowed: ok, act: parts[0], row_id: Number(parts[1]), qid: cq.id, chat_id: cq.message.chat.id, message_id: cq.message.message_id } }];` } }
});

const allowed = ifElse({ version: 2.2, config: { name: 'Owner tap?', parameters: { conditions: {
  options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
  conditions: [{ leftValue: expr('{{ $json.allowed }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }],
  combinator: 'and' } } } });

const getShowings = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Get showings', parameters: {
    resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: SHOW }, returnAll: true } }
});

const decide = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Decide', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const tap = $('Parse tap').first().json;
const rows = $input.all().map(function (i) { return i.json; });
const row = rows.find(function (r) { return Number(r.id) === tap.row_id; });
const base = { chat_id: tap.chat_id, message_id: tap.message_id, qid: tap.qid };
if (!row) { return [{ json: Object.assign({}, base, { write: false, answer: 'Request not found', text: 'Request not found. Nothing changed.' }) }]; }
if (row.status !== 'awaiting_approval') { return [{ json: Object.assign({}, base, { write: false, answer: 'Already handled', text: row.name + ': already ' + row.status + '. Nothing changed.' }) }]; }
if (tap.act === 'decline') { return [{ json: Object.assign({}, base, { write: true, request_key: row.request_key, status: 'declined', held_slot: '', answer: 'Declined', text: 'DECLINED: ' + row.name + '. No hold made.' }) }]; }
const held = {};
rows.forEach(function (r) { if (r.status === 'hold_confirmed' && r.held_slot) { held[r.held_slot] = true; } });
const pick = String(row.proposed_slots || '').split(' | ').filter(function (s) { return s; }).find(function (s) { return !held[s]; });
if (!pick) { return [{ json: Object.assign({}, base, { write: true, request_key: row.request_key, status: 'needs_new_times', held_slot: '', answer: 'No free time', text: 'NO FREE TIME for ' + row.name + '. Ask for new times.' }) }]; }
return [{ json: Object.assign({}, base, { write: true, request_key: row.request_key, status: 'hold_confirmed', held_slot: pick, answer: 'Approved', text: 'APPROVED: ' + row.name + '. Held ' + pick + ' (table row only, no calendar event, nothing sent).' }) }];` } }
});

const needsWrite = ifElse({ version: 2.2, config: { name: 'Write change?', parameters: { conditions: {
  options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
  conditions: [{ leftValue: expr('{{ $json.write }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }],
  combinator: 'and' } } } });

const save = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Save decision', parameters: {
    resource: 'row', operation: 'update', dataTableId: { __rl: true, mode: 'id', value: SHOW },
    matchType: 'allConditions',
    filters: { conditions: [{ keyName: 'request_key', condition: 'eq', keyValue: expr('{{ $json.request_key }}') }] },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
      status: expr('{{ $json.status }}'), held_slot: expr('{{ $json.held_slot }}') } } } }
});

const log = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Log decision', parameters: {
    resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: LOG },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
      workflow: 'PG - Showing Approval (Telegram)',
      lead_key: expr("{{ $('Decide').item.json.request_key }}"),
      outcome: expr("{{ 'showing_' + $('Decide').item.json.status }}"),
      detail: expr("{{ $('Decide').item.json.held_slot }}"),
      logged_at: expr('{{ $now.toISO() }}') } } } }
});

const answer = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Answer tap', parameters: {
    resource: 'callback', operation: 'answerQuery',
    queryId: expr("{{ $('Decide').item.json.qid }}"),
    additionalFields: { text: expr("{{ $('Decide').item.json.answer }}") } } }
});

const answerNoWrite = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Answer tap (no change)', parameters: {
    resource: 'callback', operation: 'answerQuery',
    queryId: expr('{{ $json.qid }}'),
    additionalFields: { text: expr('{{ $json.answer }}') } } }
});

const edit = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Update message', parameters: {
    resource: 'message', operation: 'editMessageText',
    chatId: expr("{{ $('Decide').item.json.chat_id }}"),
    messageId: expr("{{ $('Decide').item.json.message_id }}"),
    text: expr("{{ $('Decide').item.json.text }}"),
    additionalFields: {} } }
});

export default workflow('pg-build4-telegram-approval', 'PG - Showing Approval (Telegram)')
  .add(trig.to(parse.to(allowed
    .onTrue(getShowings.to(decide.to(needsWrite
      .onTrue(save.to(log.to(answer.to(edit))))
      .onFalse(answerNoWrite)))))));
