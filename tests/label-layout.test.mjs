import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {regions} from '../dist/data.js';
import {regionPoint,specialPoints} from '../dist/atlas-v3.js';
import {labelWidth,placeCityLabels} from '../dist/label-layout.js';
const geography=JSON.parse(fs.readFileSync(new URL('../dist/city-geography.json',import.meta.url))).cities;
test('all four map languages retain geographic anchors while avoiding city and country label collisions',()=>{
 for(const locale of ['zh-CN','en','ja','zh-TW']){
  const dictionary=locale==='zh-CN'?{}:JSON.parse(fs.readFileSync(new URL(`../dist/locales/${locale}.json`,import.meta.url)));
  const translate=s=>dictionary[s]||s;
  const occupied=regions.map(r=>{const p=regionPoint(r.id)||specialPoints[r.id],width=labelWidth(translate(r.name),18);return p?{x:p[0]-width/2,y:p[1]-22,width,height:27}:null;}).filter(Boolean);
  const items=geography.filter(c=>c.point||c.labelPoint).map(c=>({name:c.name,point:c.point||c.labelPoint,label:translate(c.label||c.name)}));
  const before=structuredClone(items),placed=placeCityLabels(items,occupied);
  assert.deepEqual(items,before);assert.equal(placed.length,20);
  for(const [i,item] of placed.entries()){
   const a=item.box;assert.deepEqual(item.point,before[i].point,`${locale}: geographic point moved`);
   assert.ok(a.x>=0&&a.x+a.width<=1200&&a.y>=0&&a.y+a.height<=610);
   assert.ok(!occupied.some(b=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),`${locale}: overlapping label ${item.name}`);
   occupied.push(a);
  }
 }
});
