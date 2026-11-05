const test = require('node:test');
const assert = require('node:assert/strict');

const { validateDesignSpec } = require('../src/design-spec');

function validSpec(overrides = {}) {
  return {
    metadata: { version: '1', conceptId: 'celestial-card', name: '天同坐命' },
    canvas: { width: 1080, height: 1080 },
    assets: [{
      id: 'background',
      role: 'background',
      url: 'https://assets.example.com/background.png',
      x: 0, y: 0, width: 1080, height: 1080, zIndex: 0, locked: true,
    }],
    elements: [{
      id: 'headline', kind: 'text', text: '溫柔，不等於沒力量',
      x: 80, y: 120, width: 920, height: 150, zIndex: 1,
    }],
    ...overrides,
  };
}

test('accepts a 1080 square spec with editable text and image assets', () => {
  const result = validateDesignSpec(validSpec());
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.canvas, { width: 1080, height: 1080 });
});

test('rejects a customer identifier', () => {
  assert.deepEqual(validateDesignSpec(validSpec({ customerId: 'customer-1' })), {
    ok: false,
    code: 'INVALID_SPEC',
  });
});

test('rejects a non-image asset URL', () => {
  const spec = validSpec({ assets: [{
    ...validSpec().assets[0],
    url: 'https://assets.example.com/background.svg',
  }] });
  assert.deepEqual(validateDesignSpec(spec), { ok: false, code: 'INVALID_SPEC' });
});
