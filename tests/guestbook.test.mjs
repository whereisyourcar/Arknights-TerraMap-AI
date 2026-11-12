import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,stat,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createGuestbookStore,validateGuestbookMessage,GUESTBOOK_AVATARS} from '../guestbook-store.mjs';
import {createGuestbookLimiter} from '../guestbook-http.mjs';
import {createServer} from '../server.mjs';
import {escapeGuestbookText} from '../dist/guestbook-page.js';

const draft={avatar:'amiya',nickname:'博士',message:'愿这片大地多一些美好的相遇。'};
async function withDirectory(fn){const dir=await mkdtemp(path.join(os.tmpdir(),'terramap-guestbook-'));try{return await fn(dir);}finally{await rm(dir,{recursive:true,force:true});}}
async function withServer(fn,options={}){return withDirectory(async dir=>{const server=createServer({visitorFile:path.join(dir,'visitors.json'),guestbookFile:path.join(dir,'guestbook.json'),...options});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;try{return await fn({base,dir});}finally{await new Promise(r=>server.close(r));}});}
const post=(base,value=draft,extra={})=>fetch(base+'/api/guestbook',{method:'POST',headers:{Origin:base,'Content-Type':'application/json',...extra},body:JSON.stringify(value)});

test('guestbook accepts all ten local avatar IDs and multilingual Unicode without treating markup as HTML',()=>{
 assert.equal(GUESTBOOK_AVATARS.length,10);assert.equal(new Set(GUESTBOOK_AVATARS).size,10);
 for(const avatar of GUESTBOOK_AVATARS)assert.equal(validateGuestbookMessage({...draft,avatar}).avatar,avatar);
 const entry=validateGuestbookMessage({avatar:'w',nickname:'  博士 👩🏽‍💻 دكتور  ',message:'中文 繁體 日本語 English العربية 한국어\n<script>alert(1)</script> & "'});
 assert.equal(entry.nickname,'博士 👩🏽‍💻 دكتور');assert.match(entry.message,/中文 繁體 日本語 English العربية 한국어/);assert.match(entry.message,/<script>/);
 assert.equal(escapeGuestbookText('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
 assert.equal(validateGuestbookMessage({...draft,nickname:'e\u0301'}).nickname,'é');
 assert.equal(validateGuestbookMessage({...draft,nickname:'🦊'.repeat(24),message:'🎉'.repeat(1000)}).message.length,2000);
});

test('guestbook rejects blank, long, control, external-avatar and unknown input fields',()=>{
 for(const value of [null,[],{...draft,avatar:'https://example.com/a.svg'},{...draft,avatar:'../../file'},{...draft,nickname:' '},{...draft,nickname:'x'.repeat(25)},{...draft,nickname:'a\nb'},{...draft,message:'x'.repeat(1001)},{...draft,message:'\u0000'},{...draft,message:'\ud800'},{...draft,nickname:42},{...draft,ip:'127.0.0.1'},{...draft,id:'forged'}])assert.throws(()=>validateGuestbookMessage(value));
});

test('guestbook atomic writes survive concurrent store instances, restart, and stable cursor pagination',()=>withDirectory(async dir=>{
 const file=path.join(dir,'guestbook.json'),a=createGuestbookStore(file,{now:()=>1234567890000}),b=createGuestbookStore(file,{now:()=>1234567890000});
 assert.deepEqual(await a.list(),{messages:[],total:0,nextCursor:null});
 await Promise.all(Array.from({length:37},(_,i)=>(i%2?a:b).add({...draft,nickname:'博士'+i,message:'Message '+i})));
 const fresh=createGuestbookStore(file),first=await fresh.list({limit:10});assert.equal(first.total,37);assert.equal(first.messages.length,10);assert.equal(first.messages[0].message,'Message 36');
 await fresh.add({...draft,message:'New arrival after page one'});
 const second=await fresh.list({before:first.nextCursor,limit:10});assert.equal(second.messages[0].message,'Message 26');assert.equal(second.total,38);
 const third=await fresh.list({before:second.nextCursor,limit:10}),last=await fresh.list({before:third.nextCursor,limit:10});
 assert.equal(last.messages.length,7);assert.equal(last.nextCursor,null);
 const all=[...first.messages,...second.messages,...third.messages,...last.messages];assert.equal(new Set(all.map(m=>m.id)).size,37);
 for(const m of all){assert.deepEqual(Object.keys(m).sort(),['avatar','createdAt','id','message','nickname']);assert.equal(m.createdAt,'2009-02-13T23:31:30.000Z');}
 const raw=await readFile(file,'utf8');assert(!raw.includes('127.0.0.1'));assert(!raw.includes('remoteAddress'));assert(!raw.includes('secret'));
 assert.equal((await stat(file)).mode&0o777,0o600);assert.deepEqual(await readdir(dir),['guestbook.json']);
 await assert.rejects(()=>fresh.list({limit:51}));await assert.rejects(()=>fresh.list({limit:0}));await assert.rejects(()=>fresh.list({before:'00000000-0000-0000-0000-000000000000'}));
}));

test('guestbook never silently replaces corrupt persisted data and recovers its queue after a failure',()=>withDirectory(async dir=>{
 const file=path.join(dir,'guestbook.json'),store=createGuestbookStore(file);await writeFile(file,'broken data');
 await assert.rejects(()=>store.add(draft));await assert.rejects(()=>store.list());assert.equal(await readFile(file,'utf8'),'broken data');
 await writeFile(file,JSON.stringify({schema:1,messages:[]}));await store.add(draft);assert.equal((await store.list()).total,1);
}));

test('guestbook HTTP checks origin, content type, schema, bytes and public response fields',()=>withServer(async({base,dir})=>{
 let r=await fetch(base+'/api/guestbook');assert.equal(r.status,200);assert.deepEqual(await r.json(),{messages:[],total:0,nextCursor:null});assert.equal(r.headers.get('cache-control'),'no-store');
 for(const origin of ['https://attacker.example',base+'/',base.replace('http:','https:'),'null']){r=await post(base,draft,{Origin:origin});assert.equal(r.status,403);}
 r=await fetch(base+'/api/guestbook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});assert.equal(r.status,403);
 r=await post(base,draft,{'Sec-Fetch-Site':'cross-site'});assert.equal(r.status,403);
 r=await post(base,draft,{'Content-Type':'text/plain'});assert.equal(r.status,415);
 r=await post(base,draft,{'Content-Encoding':'gzip'});assert.equal(r.status,415);
 r=await post(base,{...draft,message:'x'.repeat(9000)});assert.equal(r.status,413);
 r=await fetch(base+'/api/guestbook',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{malformed'});assert.equal(r.status,400);
 r=await post(base,{...draft,avatar:'evil.svg'});assert.equal(r.status,400);
 const unsafe='<script>alert(document.cookie)</script>';
 r=await post(base,{avatar:'texas',nickname:'テキサス',message:unsafe});assert.equal(r.status,201);const posted=(await r.json()).message;assert.equal(posted.message,unsafe);assert.deepEqual(Object.keys(posted).sort(),['avatar','createdAt','id','message','nickname']);
 r=await fetch(base+'/api/guestbook?limit=1');assert.equal(r.status,200);assert.equal((await r.json()).messages[0].id,posted.id);
 for(const query of ['limit=0','limit=51','limit=2.5','before=oops','limit=1&limit=2','private=1']){r=await fetch(base+'/api/guestbook?'+query);assert.equal(r.status,400);}
 r=await fetch(base+'/api/guestbook',{method:'DELETE'});assert.equal(r.status,405);assert.equal(r.headers.get('allow'),'GET, POST');
 r=await fetch(base+'/var/guestbook.json');assert.equal(r.status,404);assert(!await readFile(path.join(dir,'guestbook.json'),'utf8').then(s=>s.includes('127.0.0.1')));
},{guestbookRateLimit:()=>({allowed:true})}));

test('chunked bodies cannot bypass guestbook byte limits',()=>withServer(async({base})=>{
 const response=await new Promise((resolve,reject)=>{const request=http.request(base+'/api/guestbook',{method:'POST',headers:{Origin:base,'Content-Type':'application/json','Transfer-Encoding':'chunked'}},response=>{response.resume();response.on('end',()=>resolve(response.statusCode));});request.on('error',reject);request.write('{"message":"');request.write('x'.repeat(5000));request.end('x'.repeat(5000)+'"}');});assert.equal(response,413);
}));

test('rate limiting uses expiring private buckets and returns Retry-After without persisting addresses',async()=>{
 let now=1000;const rate=createGuestbookLimiter({now:()=>now,windowMs:1000,limit:2,maxKeys:2});
 assert.equal(rate('10.0.0.1').allowed,true);assert.equal(rate('10.0.0.1').allowed,true);assert.deepEqual(rate('10.0.0.1'),{allowed:false,retryAfter:1});assert.equal(rate('10.0.0.2').allowed,true);assert.equal(rate('10.0.0.3').allowed,false);now+=1000;assert.equal(rate('10.0.0.1').allowed,true);
 await withServer(async({base})=>{for(let i=0;i<5;i++)assert.equal((await post(base)).status,201);const r=await post(base);assert.equal(r.status,429);assert(Number(r.headers.get('retry-after'))>0);assert.equal((await r.json()).error,'rate_limited');const list=await fetch(base+'/api/guestbook');assert.equal((await list.json()).total,5);});
});

test('configured public HTTPS origin works behind a reverse proxy and rejects host-only mismatches',()=>withServer(async({base})=>{
 assert.equal((await post(base,draft,{Origin:'https://terra.example'})).status,201);
 assert.equal((await post(base)).status,403);
 assert.equal((await post(base,draft,{Origin:'http://terra.example'})).status,403);
},{publicOrigin:'https://terra.example'}));
