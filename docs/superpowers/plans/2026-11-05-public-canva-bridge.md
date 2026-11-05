# Public Canva Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, locally testable foundation which turns a chosen social-visual DesignSpec into ordered Canva editing operations.

**Architecture:** A dependency-free Node 22 HTTP API validates and stores short-lived DesignSpec jobs behind a signed handoff. A separate pure compiler creates ordered native Canva image, shape, line, and text operations; a fake SDK proves it locally without Canva credentials.

**Tech Stack:** Node 22, CommonJS, `node:test`, `node:assert/strict`, JSON Schema, vanilla HTML/JavaScript Canva-app seam.

**Spec:** `docs/superpowers/specs/2026-11-05-public-canva-bridge-design.md`

## Global Constraints

- Use Node `>=22` with no runtime npm dependencies.
- Canvas is exactly `1080 × 1080`; all text is native editable text unless marked as a special-title PNG.
- Use `crypto.randomUUID()`, HMAC-SHA-256 handoffs valid for `900` seconds, and job expiry at `86400000` milliseconds.
- Store no raw prompt, customer identifier, Canva OAuth token, or request-body logs.
- Accept only HTTPS `.png`, `.jpg`, `.jpeg`, or `.webp` asset URLs.
- Create a new design only; never edit, publish, overwrite, or delete an existing Canva design.
- Browser-visible errors are Traditional Chinese and do not expose internal errors.

## File Structure

- `package.json`: test and local-start scripts.
- `shared/design-spec.schema.json`, `src/design-spec.js`: portable contract and validator.
- `src/job-store.js`, `src/http-server.js`: expiring signed design job API.
- `src/canva-operations.js`, `canva-app/src/app.js`: pure layer compiler and injected Canva SDK executor.
- `skill/social-visual-canva/SKILL.md`: downloadable Skill.
- `tests/*.test.js`: complete offline behavior checks.
- `.env.example`, `.gitignore`, `README.md`: safe public distribution.

---

### Task 1: DesignSpec validation

**Files:** Create `package.json`, `shared/design-spec.schema.json`, `src/design-spec.js`, `tests/design-spec.test.js`.

**Interfaces:** Produces `validateDesignSpec(spec) -> { ok: true, value } | { ok: false, code: 'INVALID_SPEC' }`.

- [ ] **Step 1: Write the failing test**

```js
test('accepts an editable square design', () => {
  assert.equal(validateDesignSpec(validSpec()).ok, true);
});
test('rejects customer data and non-image URLs', () => {
  assert.deepEqual(validateDesignSpec({ ...validSpec(), customerId: 'x' }), { ok: false, code: 'INVALID_SPEC' });
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/design-spec.test.js`

Expected: `../src/design-spec` module missing.

- [ ] **Step 3: Implement minimum validator**

```js
function validateDesignSpec(spec) {
  if (spec?.canvas?.width !== 1080 || spec.canvas.height !== 1080) return { ok: false, code: 'INVALID_SPEC' };
  return { ok: true, value: spec };
}
module.exports = { validateDesignSpec };
```

Extend only for required metadata, finite geometry, allowed kinds, allowed image URLs, z-index/lock fields, and forbidden keys.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/design-spec.test.js`

Expected: all contract tests pass.

- [ ] **Step 5: Commit**

```powershell
git add package.json shared/design-spec.schema.json src/design-spec.js tests/design-spec.test.js
git commit -m "feat: validate portable design specs"
```

### Task 2: Signed expiring job store

**Files:** Create `src/job-store.js`, `tests/job-store.test.js`.

**Interfaces:** Consumes `validateDesignSpec`. Produces `createJobStore(secret)` with `createJob(spec, now)`, `readJob(id, token, now)`, `completeJob(id, token, now)`, and `purgeExpired(now)`.

- [ ] **Step 1: Write the failing test**

```js
test('a handoff reads its own unexpired job only', () => {
  const store = createJobStore('test-secret');
  const first = store.createJob(validSpec(), 0);
  const second = store.createJob(validSpec({ conceptId: 'two' }), 0);
  assert.equal(store.readJob(first.id, first.handoffToken, 1).ok, true);
  assert.equal(store.readJob(second.id, first.handoffToken, 1).ok, false);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/job-store.test.js`

Expected: `../src/job-store` module missing.

- [ ] **Step 3: Implement minimum job store**

```js
function createJobStore(secret) {
  const jobs = new Map();
  return { createJob, readJob, completeJob, purgeExpired };
}
```

Use UUID job IDs, HMAC over `jobId:handoffExpiry`, timing-safe comparison, and remove records after 24 hours.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/job-store.test.js`

Expected: tests cover invalid, expired, cross-job, completed, and cleanup behavior.

- [ ] **Step 5: Commit**

```powershell
git add src/job-store.js tests/job-store.test.js
git commit -m "feat: add expiring signed design jobs"
```

### Task 3: HTTP bridge API

**Files:** Create `src/http-server.js`, `tests/http-server.test.js`.

**Interfaces:** Consumes `createJobStore`. Produces `createHttpServer({ jobStore, handoffBaseUrl })`. Routes: `POST /v1/design-jobs`, `GET /v1/design-jobs/:id?handoff=...`, `POST /v1/design-jobs/:id/complete`.

- [ ] **Step 1: Write the failing test**

```js
test('POST creates a job without echoing customer design data', async () => {
  const response = await request(server, 'POST', '/v1/design-jobs', validSpec());
  assert.equal(response.status, 201);
  assert.match(response.body.handoffUrl, /handoff=/);
  assert.equal('elements' in response.body, false);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/http-server.test.js`

Expected: `../src/http-server` module missing.

- [ ] **Step 3: Implement minimum API**

```js
function createHttpServer({ jobStore, handoffBaseUrl }) {
  return http.createServer(async (request, response) => { /* three routes only */ });
}
```

Cap JSON body size at `262144` bytes. Invalid data returns `{ error: '設計資料不完整，請重新選擇方案後再試。' }`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/http-server.test.js`

Expected: all endpoints work locally without network access.

- [ ] **Step 5: Commit**

```powershell
git add src/http-server.js tests/http-server.test.js
git commit -m "feat: expose design job bridge API"
```

### Task 4: Editable Canva layer compiler

**Files:** Create `src/canva-operations.js`, `canva-app/src/app.js`, `tests/canva-operations.test.js`.

**Interfaces:** Produces `compileCanvaOperations(spec) -> CanvaOperation[]` and `applyOperations(sdk, operations) -> Promise<void>`.

- [ ] **Step 1: Write the failing test**

```js
test('orders layers and keeps titles native text', () => {
  const operations = compileCanvaOperations(validSpec());
  assert.deepEqual(operations.map((item) => item.type), ['image', 'shape', 'text']);
  assert.equal(operations.at(-1).text, '溫柔，不等於沒力量');
});
test('preserves special title artwork as PNG', () => {
  assert.equal(compileCanvaOperations(validSpecWithSpecialTitle()).find((x) => x.role === 'special-title').type, 'image');
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/canva-operations.test.js`

Expected: `../src/canva-operations` module missing.

- [ ] **Step 3: Implement minimum compiler**

```js
function compileCanvaOperations(spec) {
  return [...spec.assets, ...spec.elements].sort((a, b) => a.zIndex - b.zIndex).map(toCanvaOperation);
}
```

The executor invokes injected `sdk.addImage`, `sdk.addShape`, `sdk.addLine`, and `sdk.addText` only; it never calls Magic Layers.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/canva-operations.test.js`

Expected: fake SDK records ordered editable operations.

- [ ] **Step 5: Commit**

```powershell
git add src/canva-operations.js canva-app/src/app.js tests/canva-operations.test.js
git commit -m "feat: compile editable Canva layer operations"
```

### Task 5: Public package and release guardrails

**Files:** Create `skill/social-visual-canva/SKILL.md`, `.env.example`, `.gitignore`, `README.md`, `tests/public-package.test.js`; modify `package.json`.

**Interfaces:** Produces a cloneable package with no credentials and a downloadable Skill.

- [ ] **Step 1: Write the failing package test**

```js
test('the Skill only hands off after a result is selected', () => {
  assert.match(readFileSync('skill/social-visual-canva/SKILL.md', 'utf8'), /使用者選定一個方案後/);
});
test('example environment has no credential values', () => {
  assert.match(readFileSync('.env.example', 'utf8'), /^BRIDGE_HANDOFF_SECRET=$/m);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/public-package.test.js`

Expected: missing public files.

- [ ] **Step 3: Add public files**

README gives exact local commands, states the Canva developer-app/OAuth/public-review requirement, says real Canva E2E is not locally verified, and states the 24-hour data policy. `.gitignore` ignores `.env`, `node_modules/`, coverage, and local assets.

- [ ] **Step 4: Verify GREEN and release safety**

Run: `npm test && git diff --check && git grep -nE "AIza|sk-|client_secret|refresh_token"`

Expected: all tests pass, no whitespace errors, and no secret matches.

- [ ] **Step 5: Commit**

```powershell
git add skill .env.example .gitignore README.md package.json tests/public-package.test.js
git commit -m "docs: package public social visual Canva bridge"
```

## Plan self-review

- Each spec requirement maps to one task: contract, signed job access, API, editable Canva layers, and public delivery.
- Real Canva creation remains explicitly outside local verification until a registered Canva app and user authorization exist.
- No placeholders: external GitHub ownership, deployment, and Canva account registration are deliberately user-controlled after the codebase is complete.
