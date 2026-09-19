import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {regions} from '../dist/data.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/events.json',import.meta.url)));
const source=JSON.parse(fs.readFileSync(new URL('../material/event-source-snapshot.json',import.meta.url)));
test('event catalogue covers every currently opened activity story in the source snapshot, without duplicates or future entries',()=>{
 const expected=source.reviews.filter(r=>r.startShowTime>0&&r.startShowTime<=source.cutoff&&(r.endShowTime<0||r.endShowTime>source.cutoff)).map(r=>r.id).sort();
 assert.deepEqual(data.events.map(e=>e.id).sort(),expected);assert.equal(new Set(data.events.map(e=>e.id)).size,data.events.length);
 assert(!data.events.some(e=>e.title==='月行水上'));assert(data.excluded.some(e=>e.title==='月行水上'));
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
 assert.equal(data.events.filter(e=>e.collaboration).length,3);
});
