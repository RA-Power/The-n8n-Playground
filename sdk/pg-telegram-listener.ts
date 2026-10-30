const TG = 'P0XlBJwKSJIwkmzL';

const trig = trigger({
  type: 'n8n-nodes-base.telegramTrigger', version: 1.2,
  config: { name: 'Telegram Message', parameters: { updates: ['message'], additionalFields: {} } }
});

const save = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Save chat id', parameters: {
    resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: TG },
    columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
      chat_id: expr('{{ String($json.message.chat.id) }}'),
      first_name: expr('{{ $json.message.from.first_name }}'),
      seen_at: expr('{{ new Date().toISOString() }}'),
      last_text: expr('{{ $json.message.text }}') } } } }
});

const reply = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Reply connected', parameters: {
    resource: 'message', operation: 'sendMessage',
    chatId: expr("{{ $('Telegram Message').item.json.message.chat.id }}"),
    text: 'Connected. This is the RA Power test bot (sandbox, synthetic data only).',
    additionalFields: { appendAttribution: false } } }
});

export default workflow('pg-telegram-listener', 'PG Telegram Listener (test)')
  .add(trig.to(save.to(reply)));
