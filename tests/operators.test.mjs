import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../dist/'+p,import.meta.url)));
const data=read('operators.json'), assets=read('assets.json');
test('all obtainable operator records have local PNG portraits, archive fields and source identity',()=>{
 assert.equal(data.operators.length,438);assert.equal(new Set(data.operators.map(o=>o.id)).size,438);
 for(const o of data.operators){assert.ok(o.origin&&o.race&&o.description&&o.gameSource);const file=new URL('../dist/'+o.image,import.meta.url);assert.ok(existsSync(file),o.name);assert.equal(readFileSync(file).subarray(1,4).toString(),'PNG',o.name);assert.ok(Object.values(assets).some(a=>a.path===o.image&&a.identityEvidence),o.name);}
});
test('latest event identity and undisclosed species remain faithful to game archives',()=>{
 const by=n=>data.operators.find(o=>o.name===n);for(const n of ['塔露拉','冻河','国度','怒潮凛冬','奥尔佳','镜匠'])assert.equal(by(n).newEvent,'时间啊，向前！');assert.equal(by('国度').race,'未公开');assert.equal(by('塔露拉').race,'德拉克');assert.equal(by('Lancet-2').origin,'哥伦比亚');assert.equal(by('Lancet-2').originLabel,'产地');
});
test('Ursus distinguishes post-revolution government and historical imperial offices',()=>{
 const u=read('governance.json').regions.find(r=>r.id==='ursus');assert.ok(u.people.some(p=>p.name.includes('米拉娜')&&p.evidence.includes('新政府')));assert.ok(!u.people.some(p=>p.role.includes('现任皇帝')));assert.ok(u.people.find(p=>p.name.includes('维特')).role.includes('行政顾问'));
});
