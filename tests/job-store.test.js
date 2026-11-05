const test = require('node:test');
const assert = require('node:assert/strict');

const { createJobStore } = require('../src/job-store');

function validSpec(overrides = {}) {
  return {
    metadata: { version: '1', conceptId: 'celestial-card', name: '天同坐命' },
    canvas: { width: 1080, height: 1080 },
    assets: [{
      id: 'background', role: 'background', url: 'https://assets.example.com/background.png',
      x: 0, y: 0, width: 1080, height: 1080, zIndex: 0, locked: true,
    }],
    elements: [],
    ...overrides,
  };
}

test('a signed handoff reads only its own unexpired job', () => {
  const store = createJobStore('test-secret');
  const first = store.createJob(validSpec(), 0);
  const second = store.createJob(validSpec({ metadata: { version: '1', conceptId: 'second', name: '第二張' } }), 0);

  assert.equal(store.readJob(first.id, first.handoffToken, 1).ok, true);
  assert.deepEqual(store.readJob(second.id, first.handoffToken, 1), { ok: false, code: 'INVALID_HANDOFF' });
});

test('an expired handoff cannot read a job', () => {
  const store = createJobStore('test-secret');
  const job = store.createJob(validSpec(), 0);
  assert.deepEqual(store.readJob(job.id, job.handoffToken, 901000), { ok: false, code: 'EXPIRED_JOB' });
});

test('cleanup removes jobs after twenty-four hours', () => {
  const store = createJobStore('test-secret');
  const job = store.createJob(validSpec(), 0);
  assert.equal(store.purgeExpired(86400001), 1);
  assert.deepEqual(store.readJob(job.id, job.handoffToken, 1), { ok: false, code: 'UNKNOWN_JOB' });
});
