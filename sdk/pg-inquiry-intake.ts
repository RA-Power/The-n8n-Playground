import { workflow, node, trigger, sticky, expr, ifElse } from '@n8n/workflow-sdk';

const webhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook',
    position: [-200, 0],
    parameters: { httpMethod: 'POST', path: 'pg-inquiry-intake', authentication: 'headerAuth', responseMode: 'responseNode', options: {} },
    credentials: { httpHeaderAuth: { id: '079p9QBOgk299kHt', name: 'PG Webhook Secret' } }
  }
});

const validate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validate',
    position: [40, 0],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `// PG intake validation. Deterministic: no AI, no external calls.
const body = $json.body || {};
const clean = (v, max) => String(v == null ? '' : v).replace(/[\\u0000-\\u001F\\u007F]/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, max);
// TEST HOOK: proves the error workflow works. Remove before any client delivery.
if (body.source === 'pg-force-error') { throw new Error('PG test hook: forced error'); }
const errors = [];
const rawMessage = String(body.message == null ? '' : body.message);
const name = clean(body.name, 120);
const email = clean(body.email, 200).toLowerCase();
const phone = clean(body.phone, 40);
const source = clean(body.source || 'unknown', 60);
const message = clean(rawMessage, 2000);
if (!name) errors.push('name_required');
if (!email) errors.push('email_required');
else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) errors.push('email_invalid');
if (!message) errors.push('message_required');
if (rawMessage.length > 2000) errors.push('message_too_long');
const leadKey = email + '|' + message.toLowerCase().slice(0, 80);
return { json: { valid: errors.length === 0, errors: errors, lead_key: leadKey, name: name, email: email, phone: phone, source: source, message: message, received_at: new Date().toISOString() } };`
    }
  }
});

const isValid = ifElse({
  version: 2.2,
  config: {
    name: 'Valid?',
    position: [280, 0],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.valid }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const checkDup = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Check duplicate',
    position: [520, -120],
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: { __rl: true, mode: 'id', value: 'iijIMiobQTzj0pwh' },
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'lead_key', condition: 'eq', keyValue: expr('{{ $json.lead_key }}') }] },
      returnAll: false,
      limit: 1
    }
  }
});

const isDup = ifElse({
  version: 2.2,
  config: {
    name: 'Is duplicate?',
    position: [760, -120],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.id !== undefined && $json.id !== null }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const insertLead = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Insert lead',
    position: [1000, -60],
    parameters: {
      resource: 'row',
      operation: 'insert',
      dataTableId: { __rl: true, mode: 'id', value: 'iijIMiobQTzj0pwh' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          lead_key: expr("{{ $('Validate').item.json.lead_key }}"),
          name: expr("{{ $('Validate').item.json.name }}"),
          email: expr("{{ $('Validate').item.json.email }}"),
          phone: expr("{{ $('Validate').item.json.phone }}"),
          source: expr("{{ $('Validate').item.json.source }}"),
          message: expr("{{ $('Validate').item.json.message }}"),
          status: 'new',
          received_at: expr("{{ $('Validate').item.json.received_at }}")
        },
        matchingColumns: [],
        schema: []
      }
    }
  }
});

const outCreated = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Outcome: created',
    position: [1240, -60],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'a1', name: 'outcome', value: 'lead_created', type: 'string' },
        { id: 'a2', name: 'http_code', value: 200, type: 'number' },
        { id: 'a3', name: 'response_json', value: expr("{{ JSON.stringify({ status: 'received' }) }}"), type: 'string' },
        { id: 'a4', name: 'lead_key', value: expr("{{ $('Validate').item.json.lead_key }}"), type: 'string' },
        { id: 'a5', name: 'detail', value: expr("{{ 'source=' + $('Validate').item.json.source }}"), type: 'string' }
      ] }
    }
  }
});

const outDup = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Outcome: duplicate',
    position: [1000, -220],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'b1', name: 'outcome', value: 'duplicate_ignored', type: 'string' },
        { id: 'b2', name: 'http_code', value: 200, type: 'number' },
        { id: 'b3', name: 'response_json', value: expr("{{ JSON.stringify({ status: 'duplicate_ignored' }) }}"), type: 'string' },
        { id: 'b4', name: 'lead_key', value: expr("{{ $('Validate').item.json.lead_key }}"), type: 'string' },
        { id: 'b5', name: 'detail', value: expr("{{ 'source=' + $('Validate').item.json.source }}"), type: 'string' }
      ] }
    }
  }
});

const outRejected = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Outcome: rejected',
    position: [520, 140],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'c1', name: 'outcome', value: 'rejected_invalid', type: 'string' },
        { id: 'c2', name: 'http_code', value: 400, type: 'number' },
        { id: 'c3', name: 'response_json', value: expr("{{ JSON.stringify({ status: 'rejected', errors: $json.errors }) }}"), type: 'string' },
        { id: 'c4', name: 'lead_key', value: expr('{{ $json.lead_key }}'), type: 'string' },
        { id: 'c5', name: 'detail', value: expr("{{ $json.errors.join(',') }}"), type: 'string' }
      ] }
    }
  }
});

const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.4,
  config: {
    name: 'Respond to Webhook',
    position: [1500, 0],
    parameters: {
      respondWith: 'text',
      responseBody: expr('{{ $json.response_json }}'),
      options: { responseCode: expr('{{ $json.http_code }}'), responseHeaders: { entries: [{ name: 'Content-Type', value: 'application/json' }] } }
    }
  }
});

const logAction = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Log action',
    position: [1740, 0],
    parameters: {
      resource: 'row',
      operation: 'insert',
      dataTableId: { __rl: true, mode: 'id', value: 'Mokhl3J3DiBVad0D' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          logged_at: expr('{{ $now.toISO() }}'),
          workflow: 'PG - Inquiry Intake',
          outcome: expr("{{ $('Respond to Webhook').item.json.outcome }}"),
          lead_key: expr("{{ $('Respond to Webhook').item.json.lead_key }}"),
          detail: expr("{{ $('Respond to Webhook').item.json.detail }}")
        },
        matchingColumns: [],
        schema: []
      }
    }
  }
});

const note = sticky('## PG - Inquiry Intake (synthetic sandbox)\nNo AI, no sends. Error workflow: PG - Error Logger. The pg-force-error check in Validate is a test hook: remove before client delivery.', [], { name: 'Note: setup', position: [-720, -80], color: 5 });

export default workflow('pg-inquiry-intake', 'PG - Inquiry Intake')
  .add(webhook)
  .to(validate)
  .to(isValid
    .onTrue(checkDup.to(isDup
      .onTrue(outDup.to(respond.to(logAction)))
      .onFalse(insertLead.to(outCreated.to(respond)))))
    .onFalse(outRejected.to(respond)))
  .add(note);
