const crypto = require('node:crypto');

const HANDOFF_TTL_MS = 15 * 60 * 1000;
const JOB_TTL_MS = 24 * 60 * 60 * 1000;

function sign(secret, id, expiresAt) {
  return crypto.createHmac('sha256', secret).update(`${id}:${expiresAt}`).digest('base64url');
}

function sameSignature(actual, expected) {
  const left = Buffer.from(actual || '');
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function createJobStore(secret) {
  const jobs = new Map();

  function createJob(spec, now = Date.now()) {
    const id = crypto.randomUUID();
    const handoffExpiresAt = now + HANDOFF_TTL_MS;
    const handoffToken = `${handoffExpiresAt}.${sign(secret, id, handoffExpiresAt)}`;
    jobs.set(id, { spec, createdAt: now, handoffExpiresAt, completedAt: null });
    return { id, handoffToken, expiresAt: now + JOB_TTL_MS };
  }

  function readJob(id, handoffToken, now = Date.now()) {
    const job = jobs.get(id);
    if (!job) return { ok: false, code: 'UNKNOWN_JOB' };
    if (now > job.createdAt + JOB_TTL_MS) return { ok: false, code: 'EXPIRED_JOB' };
    const [expiry, signature] = String(handoffToken).split('.', 2);
    if (Number(expiry) !== job.handoffExpiresAt || !sameSignature(signature, sign(secret, id, job.handoffExpiresAt))) {
      return { ok: false, code: 'INVALID_HANDOFF' };
    }
    if (now > job.handoffExpiresAt) return { ok: false, code: 'EXPIRED_JOB' };
    if (job.completedAt !== null) return { ok: false, code: 'COMPLETED_JOB' };
    return { ok: true, job: { id, spec: job.spec, expiresAt: job.createdAt + JOB_TTL_MS } };
  }

  function completeJob(id, handoffToken, now = Date.now()) {
    const result = readJob(id, handoffToken, now);
    if (!result.ok) return result;
    jobs.get(id).completedAt = now;
    return { ok: true };
  }

  function purgeExpired(now = Date.now()) {
    let removed = 0;
    for (const [id, job] of jobs) {
      if (now > job.createdAt + JOB_TTL_MS) {
        jobs.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  return { createJob, readJob, completeJob, purgeExpired };
}

module.exports = { createJobStore };
