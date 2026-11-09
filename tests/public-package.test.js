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

test('the package includes its runnable PPTX builder', async () => {
  const {validateManifest}=await import('../skill/social-visual-canva/scripts/build-editable.mjs');
  const spec={width:1080,height:1080,images:[{path:'bg.png',x:0,y:0,width:1080,height:1080}],texts:[{text:'預約體驗',x:50,y:950,width:900,height:60,fontSize:32,fontFamily:'Arial',color:'#443322',align:'center'}]};
  assert.equal(validateManifest(spec),spec);
  assert.throws(()=>validateManifest({...spec,texts:[{...spec.texts[0],x:1000}]}),/outside canvas/);
  assert.throws(()=>validateManifest({...spec,width:0,height:0}),/positive square/);
});
