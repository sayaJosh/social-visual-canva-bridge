const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

test('the Skill hands off only after a result is selected', () => {
  const skill = readFileSync('skill/social-visual-canva/SKILL.md', 'utf8');
  assert.match(skill, /使用者選定一個方案後/);
});

test('example environment contains names only, not credentials', () => {
  assert.match(readFileSync('.env.example', 'utf8'), /^BRIDGE_HANDOFF_SECRET=$/m);
});
