const test = require('node:test');
const assert = require('node:assert/strict');

const { createHttpServer } = require('../src/http-server');
const { createJobStore } = require('../src/job-store');

function validSpec() {
  return { metadata: { version: '1', conceptId: 'c', name: '設計' }, canvas: { width: 1080, height: 1080 }, assets: [], elements: [] };
}

async function withServer(run) {
  const server = createHttpServer({ jobStore: createJobStore('test-secret'), handoffBaseUrl: 'https://bridge.example.com/handoff' });
  await new Promise((resolve) => server.listen(0, resolve));
  try { return await run(`http://127.0.0.1:${server.address().port}`); } finally { await new Promise((resolve) => server.close(resolve)); }
}

test('POST creates a job without echoing customer design data', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/v1/design-jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validSpec()) });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.match(body.handoffUrl, /handoff=/);
    assert.equal('elements' in body, false);
  });
});

test('invalid design data returns the safe Chinese error', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/v1/design-jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ canvas: {} }) });
    assert.deepEqual(await response.json(), { error: '設計資料不完整，請重新選擇方案後再試。' });
  });
});
