import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {regions} from '../dist/data.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/events.json',import.meta.url)));
const source=JSON.parse(fs.readFileSync(new URL('../material/event-source-snapshot.json',import.meta.url)));
test('event catalogue covers every currently opened activity story in the source snapshot, without duplicates or future entries',()=>{
 const expected=source.reviews.filter(r=>r.startShowTime>0&&r.startShowTime<=source.cutoff&&(r.endShowTime<0||r.endShowTime>source.cutoff)).map(r=>r.id).sort();
 assert.deepEqual(data.events.map(e=>e.id).sort(),expected);assert.equal(new Set(data.events.map(e=>e.id)).size,data.events.length);
 assert(data.events.some(e=>e.title==='月行水上'));assert(data.events.some(e=>e.title==='昨日海'));assert(!data.excluded.some(e=>e.title==='月行水上'));
 assert(!data.events.some(e=>e.title==='时间啊，向前！'));
 assert(data.activeEvents.some(e=>e.title==='时间啊，向前！'&&e.start<=source.cutoff&&e.end>source.cutoff&&e.reviewStart>source.cutoff));
});
test('permanent stages are independently justified by the game retro table',()=>{
 for(const e of data.events){const match=Object.values(source.retroActList).find(r=>r.linkedActId.includes(e.id)&&r.startTime<=source.cutoff);assert.equal(e.stageAvailable,Boolean(match),e.title);if(match)assert.equal(e.retroId,match.retroId);}
});
test('country and organization filters have valid links and preserve the requested story families',()=>{
 const cats=new Set(data.categories.map(c=>c.id));const lines=new Set(data.lines.map(l=>l.id));
 for(const e of data.events){assert(cats.has(e.primary));assert(lines.has(e.line));assert(e.related.every(id=>cats.has(id)));assert(!e.related.includes(e.primary));assert(e.summary.length>10);assert(e.sources.length>=2);}
 for(const c of data.categories)if(c.region)assert(regions.some(r=>r.id===c.region));
 assert(data.events.filter(e=>e.line==='RL').every(e=>e.primary==='babel'));
 assert.deepEqual(data.events.filter(e=>e.primary==='kjerag').map(e=>e.title),['风雪过境','银心湖列车','雪山降临1101']);
 assert.equal(data.events.find(e=>e.title==='水晶箭行动').primary,'bolivar');
 assert.equal(data.events.find(e=>e.title==='无忧梦呓').primary,'victoria');
 assert.equal(data.events.filter(e=>e.collaboration).length,4);
});

test('every activity guide has distinct sourced prose and linked characters with biographies and images',()=>{
 const bios=JSON.parse(fs.readFileSync(new URL('../dist/biographies.json',import.meta.url)));
 const assets=JSON.parse(fs.readFileSync(new URL('../dist/assets.json',import.meta.url)));
 const aliases=JSON.parse(fs.readFileSync(new URL('../dist/portrait-aliases.json',import.meta.url))).aliases;
 const operators=JSON.parse(fs.readFileSync(new URL('../dist/operators.json',import.meta.url))).operators;
 for(const e of [...data.events,...data.activeEvents]){
  assert.equal(e.synopsis.length,2,e.title);assert.equal(new Set([e.summary,...e.synopsis]).size,3,e.title);
  assert(e.characters.length>=1&&e.characters.length<=4,e.title);
  for(const name of e.characters){
   assert(bios.people[name]||bios.people[bios.aliases[name]],`${e.title}: biography ${name}`);
   const key=aliases[name]||name;const asset=assets[name]||assets[key]||assets[key+'05.png'];const image=asset?.path||operators.find(o=>o.name===name||o.name===key)?.image;
   assert(image&&fs.existsSync(new URL('../dist/'+image,import.meta.url)),`${e.title}: image ${name}`);
  }
  assert(e.sources.some(s=>s.url.includes('/gamedata/story/')||s.url.includes('wiki.biligame.com')),e.title);
 }
});
