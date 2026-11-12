import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {regions as baseRegions} from '../dist/data.js';
const read=f=>JSON.parse(readFileSync(new URL('../dist/'+f,import.meta.url),'utf8'));
const bios=read('biographies.json');
const resolve=name=>bios.people[bios.aliases[name]||name];
const operators=read('operators.json').operators;
const government=read('governance.json').regions;
const chapters=read('chapters.json').chapters;
const cities=read('cities.json');

test('every existing operator, leader, city character and story character has a three-sentence profile',()=>{
 const cityRecords=Array.isArray(cities)?cities:cities.cities;
 const names=new Set([
  ...operators.map(o=>o.name),
  ...government.flatMap(r=>[...r.people.map(p=>p.name),...(r.operators||[])]),
  ...baseRegions.flatMap(r=>r.operators||[]),
  ...chapters.flatMap(c=>c.nodes.flatMap(n=>n.factions.flatMap(f=>f.characters||[]))),
  ...cityRecords.flatMap(c=>[...(c.operators||[]),...(c.people||[]).map(p=>typeof p==='string'?p:p.name)])
 ]);
 for(const name of names){
  const p=resolve(name);assert.ok(p,`Missing profile: ${name}`);
  assert.equal(p.sentences.length,3,name);
 }
 for(const op of operators)assert.equal(resolve(op.name).operatorId,op.id,op.name);
});

test('sentence structure and source URLs pass structural checks (semantic review remains manual)',()=>{
 for(const [name,p] of Object.entries(bios.people)){
  assert.equal(p.sentences.length,3,name);
  assert.equal(new Set(p.sentences).size,3,`Duplicate sentence: ${name}`);
  for(const sentence of p.sentences){
   assert.ok(sentence.length>=8,`Empty fragment: ${name}`);
   assert.match(sentence,/[。！？][”’」』]?$/,name);
   const prose=sentence.replace(/《[^》]+》/g,'');
   assert.equal((prose.match(/[。！？]/g)||[]).length,1,`Expected one complete sentence: ${name}`);
   assert.doesNotMatch(sentence,/…|【|】|undefined|null|待补充/,name);
   assert.equal((sentence.match(/“/g)||[]).length,(sentence.match(/”/g)||[]).length,`Broken quote: ${name}`);
  }
  assert.ok(p.sources.length>0,name);
  for(const source of p.sources){const u=new URL(source);assert.equal(u.protocol,'https:',name);}
 }
});

test('identity aliases resolve without merging separate people or alternate operator records',()=>{
 for(const [alias,name] of Object.entries(bios.aliases))assert.ok(bios.people[name],alias);
 assert.equal(resolve('恩雅·希瓦艾什'),resolve('初雪'));
 assert.equal(resolve('费奥多尔·弗拉基米罗维奇'),resolve('冻河'));
 assert.equal(resolve('Raidian'),resolve('电弧'));
 assert.equal(resolve('Mantra'),resolve('真言'));
 assert.equal(resolve('别乔克'),resolve('折桠'));
 assert.equal(resolve('斯乔帕'),resolve('维伊'));
 assert.equal(resolve('爱布拉娜'),resolve('死芒'));
 assert.equal(resolve('米拉娜 / 伊凡·图林'),resolve('米拉娜'));
 assert.notEqual(resolve('图林'),resolve('米拉娜'));
 assert.notEqual(resolve('国度'),resolve('雷尔金'));
 assert.notEqual(resolve('德克萨斯'),resolve('缄默德克萨斯'));
});

test('bios preserve event changes, uncertain identities, and institutions as institutions',()=>{
 const text=n=>resolve(n).sentences.join('');
 assert.match(text('塔露拉'),/革命结束后.*离开组织/);
 assert.match(text('冻河'),/圣骏堡革命前.*皇帝/);
 assert.match(text('伊斯拉姆·维特'),/行政顾问/);
 assert.match(text('国度'),/不对任何乌萨斯官方机构负责/);
 assert.match(text('虎狼丸'),/据称/);
 assert.match(text('Lancet-2'),/医疗.*|消毒/);
 assert.match(text('CONFESS-47'),/听取告解/);
 assert.match(text('娜迦'),/圣愚.*已故娜迦/);
 assert.match(text('浊心斯卡蒂'),/可能未来.*并非主线已经发生/);
 assert.match(text('魔王'),/封存人事档案/);
 assert.match(text('天空盒'),/高登·谭农.*总长官.*探员总管/);
 for(const name of ['监正会','国民院','商业联合会','各部族雪祀'])assert.equal(resolve(name).kind,'institution',name);
});

test('known subordinate-clause regressions cannot return as standalone sentences',()=>{
 const fragments=['且能够在复杂的战场环境下。','利用种族带来的抗打击能力。','驻留罗德岛维多利亚南部办事处期间。','照这个方向发展下去，就不会有人关心她究竟是什么了。'];
 for(const [name,p] of Object.entries(bios.people))
  for(const sentence of p.sentences)assert.ok(!fragments.includes(sentence),name);
});

test('published text is exactly the reviewed editorial source, without generated filler',()=>{
 const editorial=JSON.parse(readFileSync(new URL('../material/biographies-editorial.json',import.meta.url),'utf8'));
 assert.deepEqual(bios.people,editorial.people);
 assert.deepEqual(bios.aliases,editorial.aliases);
});
