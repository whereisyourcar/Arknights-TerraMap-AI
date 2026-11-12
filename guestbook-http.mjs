import {createHmac,randomBytes} from 'node:crypto';
import {GuestbookError,GUESTBOOK_LIMITS,validateGuestbookMessage} from './guestbook-store.mjs';

// Keys are ephemeral keyed hashes; addresses never enter the persistent message file.
export function createGuestbookLimiter({now=Date.now,windowMs=10*60*1000,limit=5,maxKeys=10000}={}){
 const secret=randomBytes(32),buckets=new Map();
 return address=>{
  const time=now();for(const [key,value] of buckets)if(value.reset<=time)buckets.delete(key);
  const key=createHmac('sha256',secret).update(address||'unknown').digest('hex');let bucket=buckets.get(key);
  if(!bucket){if(buckets.size>=maxKeys)return {allowed:false,retryAfter:60};bucket={count:0,reset:time+windowMs};buckets.set(key,bucket);}
  if(bucket.count>=limit)return {allowed:false,retryAfter:Math.max(1,Math.ceil((bucket.reset-time)/1000))};
  bucket.count++;return {allowed:true};
 };
}
function sameOrigin(req,publicOrigin){
 try{
  const actual=new URL(req.headers.origin);
  if(!['http:','https:'].includes(actual.protocol)||actual.origin!==req.headers.origin||req.headers['sec-fetch-site']==='cross-site')return false;
  const expected=publicOrigin?new URL(publicOrigin).origin:`${req.socket.encrypted?'https':'http'}://${req.headers.host}`;
  return actual.origin===expected;
 }catch{return false;}
}
function readJSON(req){
 return new Promise((resolve,reject)=>{
  let bytes=0,chunks=[],settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);req.off('data',data);req.off('end',end);req.off('error',fail);req.off('aborted',abort);if(error){req.resume();reject(error);}else resolve(value);};
  const data=chunk=>{bytes+=chunk.length;if(bytes>GUESTBOOK_LIMITS.bodyBytes){finish(new GuestbookError('body_too_large',413));return;}chunks.push(chunk);};
  const end=()=>{try{finish(null,JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{finish(new GuestbookError('invalid_json'));}};
  const fail=()=>finish(new GuestbookError('request_failed',400)),abort=()=>finish(new GuestbookError('request_aborted',400));
  const timer=setTimeout(()=>finish(new GuestbookError('request_timeout',408)),15000);timer.unref();
  req.on('data',data);req.on('end',end);req.on('error',fail);req.on('aborted',abort);
 });
}
export function createGuestbookHandler({store,publicOrigin=process.env.PUBLIC_ORIGIN,rateLimit=createGuestbookLimiter()}={}){
 return async(req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,value)=>{res.writeHead(status).end(JSON.stringify(value));};
  try{
   if(req.method==='GET'){
    const params=new URL(req.url,'http://localhost').searchParams;
    if([...params.keys()].some(k=>!['before','limit'].includes(k))||params.getAll('before').length>1||params.getAll('limit').length>1)throw new GuestbookError('invalid_pagination');
    const limitText=params.get('limit');if(limitText!==null&&!/^[1-9]\d?$/.test(limitText))throw new GuestbookError('invalid_pagination');
    send(200,await store.list({before:params.get('before'),limit:limitText===null?GUESTBOOK_LIMITS.pageSize:Number(limitText)}));return;
   }
   if(req.method!=='POST'){res.setHeader('Allow','GET, POST');send(405,{error:'method_not_allowed'});return;}
   if(!sameOrigin(req,publicOrigin)){req.resume();send(403,{error:'same_origin_required'});return;}
   if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')){req.resume();send(415,{error:'json_required'});return;}
   if(req.headers['content-encoding']&&req.headers['content-encoding']!=='identity'){req.resume();send(415,{error:'unsupported_encoding'});return;}
   if(Number(req.headers['content-length'])>GUESTBOOK_LIMITS.bodyBytes){req.resume();send(413,{error:'body_too_large'});return;}
   const allowance=rateLimit(req.socket.remoteAddress);
   if(!allowance.allowed){req.resume();res.setHeader('Retry-After',String(allowance.retryAfter));send(429,{error:'rate_limited',retryAfter:allowance.retryAfter});return;}
   const input=validateGuestbookMessage(await readJSON(req));
   send(201,{message:await store.add(input)});
  }catch(e){if(res.destroyed||res.headersSent)return;send(e instanceof GuestbookError?e.status:503,{error:e instanceof GuestbookError?e.code:'guestbook_unavailable'});}
 };
}
