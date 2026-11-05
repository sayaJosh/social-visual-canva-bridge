const test = require('node:test');
const assert = require('node:assert/strict');

const { compileCanvaOperations } = require('../src/canva-operations');

function validSpec() {
  return {
    metadata: { version: '1', conceptId: 'c', name: '設計' }, canvas: { width: 1080, height: 1080 },
    assets: [{ id: 'background', role: 'background', url: 'https://assets.example.com/background.png', x: 0, y: 0, width: 1080, height: 1080, zIndex: 0, locked: true }],
    elements: [
      { id: 'card', kind: 'shape', x: 80, y: 400, width: 920, height: 180, zIndex: 1 },
      { id: 'title', kind: 'text', text: '溫柔，不等於沒力量', x: 80, y: 120, width: 920, height: 150, zIndex: 2 },
    ],
  };
}

test('orders layers and keeps titles native text', () => {
  const operations = compileCanvaOperations(validSpec());
  assert.deepEqual(operations.map((item) => item.type), ['image', 'shape', 'text']);
  assert.equal(operations.at(-1).text, '溫柔，不等於沒力量');
});

test('preserves special title artwork as PNG', () => {
  const spec = validSpec();
  spec.assets.push({ id: 'gold-title', role: 'special-title', url: 'https://assets.example.com/gold-title.png', x: 100, y: 100, width: 880, height: 180, zIndex: 3, locked: false });
  const special = compileCanvaOperations(spec).find((item) => item.role === 'special-title');
  assert.equal(special.type, 'image');
  assert.equal(special.label, '特殊主標 PNG（保真）');
});
