const SHOW = '6lpDzAPx8d0I9RqA';
const TG = 'P0XlBJwKSJIwkmzL';

const trig = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Manual Trigger' } });

const getChat = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Get chat', parameters: {
    resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: TG }, returnAll: false, limit: 1 } }
});

const getShowings = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Get showings', parameters: {
    resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: SHOW }, returnAll: true } }
});

const build = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Build messages', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const chat = $('Get chat').first().json.chat_id;
const out = [];
$input.all().forEach(function (i) {
  const r = i.json;
  if (r.status !== 'proposed') { return; }
  const slots = String(r.proposed_slots || '').split(' | ').join(', ');
  const text = 'TEST showing request (synthetic)\\n' + r.name + '\\n' + r.property + '\\nPreferred: ' + r.pref_date + ' ' + r.pref_period + '\\nOffered times: ' + slots + '\\n\\nApprove to hold the first free time. Nothing is sent to the client.';
  out.push({ json: { chat_id: chat, text: text, row_id: r.id, request_key: r.request_key } });
});
return out;` } }
});

const send = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Send approval buttons', parameters: {
    resource: 'message', operation: 'sendMessage',
    chatId: expr('{{ $json.chat_id }}'),
    text: expr('{{ $json.text }}'),
    replyMarkup: 'inlineKeyboard',
    inlineKeyboard: { rows: [ { row: { buttons: [
      { text: 'Approve', additionalFields: { callback_data: expr('{{ "approve:" + $json.row_id }}') } },
      { text: 'Decline', additionalFields: { callback_data: expr('{{ "decline:" + $json.row_id }}') } } ] } } ] },
    additionalFields: { appendAttribution: false } } }
});

const mark = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Mark awaiting approval', parameters: {
    resource: 'row', operation: 'update', dataTableId: { __rl: true, mode: 'id', value: SHOW },
    matchType: 'allConditions',
    filters: { conditions: [{ keyName: 'request_key', condition: 'eq', keyValue: expr("{{ $('Build messages').item.json.request_key }}") }] },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: { status: 'awaiting_approval' } } } }
});

export default workflow('pg-build4-telegram-notify', 'PG - Showing Telegram Notify')
  .add(trig.to(getChat.to(getShowings.to(build.to(send.to(mark))))));
