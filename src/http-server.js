const http = require('node:http');
const { validateDesignSpec } = require('./design-spec');

const INVALID_SPEC_MESSAGE = '設計資料不完整，請重新選擇方案後再試。';
const EXPIRED_JOB_MESSAGE = '這份設計已過期，請重新送到 Canva。';

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (part) => {
      body += part;
      if (Buffer.byteLength(body) > 262144) reject(new Error('BODY_TOO_LARGE'));
    });
    request.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('INVALID_JSON')); }
    });
    request.on('error', reject);
  });
}

function createHttpServer({ jobStore, handoffBaseUrl }) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const match = url.pathname.match(/^\/v1\/design-jobs\/([^/]+)(?:\/complete)?$/);
    try {
      if (request.method === 'POST' && url.pathname === '/v1/design-jobs') {
        const spec = await readJson(request);
        const checked = validateDesignSpec(spec);
        if (!checked.ok) return send(response, 400, { error: INVALID_SPEC_MESSAGE });
        const job = jobStore.createJob(checked.value);
        return send(response, 201, { id: job.id, handoffUrl: `${handoffBaseUrl}?job=${encodeURIComponent(job.id)}&handoff=${encodeURIComponent(job.handoffToken)}` });
      }
      if (match && request.method === 'GET') {
        const result = jobStore.readJob(match[1], url.searchParams.get('handoff'));
        return result.ok ? send(response, 200, result.job) : send(response, 404, { error: EXPIRED_JOB_MESSAGE });
      }
      if (match && url.pathname.endsWith('/complete') && request.method === 'POST') {
        const result = jobStore.completeJob(match[1], url.searchParams.get('handoff'));
        return result.ok ? send(response, 200, { ok: true }) : send(response, 404, { error: EXPIRED_JOB_MESSAGE });
      }
      return send(response, 404, { error: '找不到功能。' });
    } catch {
      return send(response, 400, { error: INVALID_SPEC_MESSAGE });
    }
  });
}

module.exports = { createHttpServer };
