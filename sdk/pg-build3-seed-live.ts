const CONTACTS = '8WAw5aHyrB4ah2il';
const trig = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Manual Trigger' } });
const build = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Synthetic live-test contacts', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [
  { json: { contact_key: 'michael.henry.miller@remote-advisor.com', email: 'michael.henry.miller@remote-advisor.com', name: 'Synthetic Self', last_contacted: '2026-03-01', status: 'active', touches_12m: '1' } },
  { json: { contact_key: 'syn.live2@example.com', email: 'syn.live2@example.com', name: 'Synthetic Live Two', last_contacted: '2026-03-01', status: 'active', touches_12m: '1' } },
  { json: { contact_key: 'syn.live3@example.com', email: 'syn.live3@example.com', name: 'Synthetic Live Three', last_contacted: '2026-03-01', status: 'active', touches_12m: '0' } },
  { json: { contact_key: 'syn.live4@example.com', email: 'syn.live4@example.com', name: 'Synthetic Live Four', last_contacted: '2026-03-01', status: 'active', touches_12m: '0' } }
];` } } });
const ins = node({ type: 'n8n-nodes-base.dataTable', version: 1.1, config: { name: 'Insert contact', parameters: {
  resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: CONTACTS },
  columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
    contact_key: expr('{{ $json.contact_key }}'), email: expr('{{ $json.email }}'), name: expr('{{ $json.name }}'),
    last_contacted: expr('{{ $json.last_contacted }}'), status: expr('{{ $json.status }}'), touches_12m: expr('{{ $json.touches_12m }}') } } } } });
export default workflow('pg-seed-b3-live', 'PG - Seed Build 3 Live Test (helper)').add(trig).to(build).to(ins);
