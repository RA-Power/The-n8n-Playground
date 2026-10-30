const INBOUND = '0AuP5h55XvnsQbfD';
const LOG = 'Mokhl3J3DiBVad0D';
const trig = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Manual Trigger' } });
const mail = node({ type: 'n8n-nodes-base.gmail', version: 2.2, config: { name: 'Read matching mail', alwaysOutputData: true, parameters: {
  resource: 'message', operation: 'getAll', returnAll: false, limit: 10, simple: true,
  filters: { q: 'subject:"Re: [PG TEST" in:inbox newer_than:3d' } } } });
const seen = node({ type: 'n8n-nodes-base.dataTable', version: 1.1, config: { name: 'Get inbound rows', executeOnce: true, alwaysOutputData: true, parameters: {
  resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: INBOUND }, returnAll: true } } });
const parse = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Keep new replies only', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const seen = {};
$input.all().forEach(function (i) { const m = /\\[gid:([^\\]]+)\\]/.exec(String(i.json.message || '')); if (m) { seen[m[1]] = true; } });
const out = [];
$('Read matching mail').all().forEach(function (i) {
  const j = i.json;
  const id = j.id;
  if (!id || seen[id]) { return; }
  const subject = String(j.Subject || j.subject || '');
  if (!/^re:/i.test(subject)) { return; }
  const fromRaw = String(j.From || j.from || '');
  const am = /<([^>]+)>/.exec(fromRaw);
  const email = (am ? am[1] : fromRaw).trim().toLowerCase();
  if (!email) { return; }
  const text = String(j.snippet || '').split(/\\s*On .{0,250}?wrote:/)[0].trim().slice(0, 300);
  out.push({ json: { from_email: email, message: '[gid:' + id + '] ' + text } });
  seen[id] = true;
});
return out;` } } });
const ins = node({ type: 'n8n-nodes-base.dataTable', version: 1.1, config: { name: 'Insert inbound', parameters: {
  resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: INBOUND },
  columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
    from_email: expr('{{ $json.from_email }}'), message: expr('{{ $json.message }}'), processed: 'no', received_at: expr('{{ $now.toISO() }}') } } } } });
const log = node({ type: 'n8n-nodes-base.dataTable', version: 1.1, config: { name: 'Log captured reply', parameters: {
  resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: LOG },
  columns: { mappingMode: 'defineBelow', matchingColumns: [], schema: [], value: {
    logged_at: expr('{{ $now.toISO() }}'), workflow: 'PG - Inbox Watcher', outcome: 'inbox_reply_captured',
    lead_key: expr('{{ $json.from_email }}'), detail: 'read-only; processed=no, handled by Reply Intake' } } } } });
export default workflow('pg-inbox-watcher', 'PG - Inbox Watcher').add(trig).to(mail).to(seen).to(parse).to(ins).to(log);
