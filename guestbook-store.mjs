import {readFile,mkdir,open,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

export const GUESTBOOK_AVATARS=Object.freeze(['amiya','kaltsit','chen','texas','exusiai','skadi','silverash','surtr','eyjafjalla','w']);
export const GUESTBOOK_LIMITS=Object.freeze({nickname:24,message:1000,bodyBytes:8192,pageSize:20,maxPageSize:50});
const queues=new Map();
export class GuestbookError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;}}
const length=value=>[...value].length;
export function validateGuestbookMessage(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['avatar','nickname','message'].includes(k)))throw new GuestbookError('invalid_fields');
 if(!GUESTBOOK_AVATARS.includes(input.avatar))throw new GuestbookError('invalid_avatar');
 const result={avatar:input.avatar};
 for(const field of ['nickname','message']){
  if(typeof input[field]!=='string')throw new GuestbookError('invalid_'+field);
  const value=input[field].normalize('NFC').trim();
  // Preserve Unicode scripts, emoji and message line breaks, while rejecting control characters.
  if(!value||length(value)>GUESTBOOK_LIMITS[field]||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\uD800-\uDFFF]/u.test(value)||(field==='nickname'&&/[\r\n\t]/u.test(value)))throw new GuestbookError('invalid_'+field);
  result[field]=value;
 }
 return result;
}
function publicMessage(m){return {id:m.id,avatar:m.avatar,nickname:m.nickname,message:m.message,createdAt:m.createdAt};}
function validRecord(m){
 if(!m||typeof m.id!=='string'||!/^[-a-f0-9]{36}$/.test(m.id)||typeof m.createdAt!=='string'||!Number.isFinite(Date.parse(m.createdAt)))return false;
 try{validateGuestbookMessage({avatar:m.avatar,nickname:m.nickname,message:m.message});return true;}catch{return false;}
}
export function createGuestbookStore(file,{now=Date.now}={}){
 const key=path.resolve(file);
 function run(task){const next=(queues.get(key)||Promise.resolve()).then(task);const tail=next.catch(()=>{});queues.set(key,tail);tail.finally(()=>{if(queues.get(key)===tail)queues.delete(key);});return next;}
 async function read(){
  try{const s=JSON.parse(await readFile(file,'utf8'));if(s.schema!==1||!Array.isArray(s.messages)||!s.messages.every(validRecord)||new Set(s.messages.map(m=>m.id)).size!==s.messages.length)throw new Error('Invalid guestbook store');return s;}
  catch(e){if(e.code!=='ENOENT')throw e;return {schema:1,messages:[]};}
 }
 async function save(s){
  await mkdir(path.dirname(file),{recursive:true,mode:0o700});
  const temporary=`${file}.${randomUUID()}.tmp`;let handle;
  try{handle=await open(temporary,'wx',0o600);await handle.writeFile(JSON.stringify(s));await handle.sync();await handle.close();handle=null;await rename(temporary,file);}
  finally{await handle?.close();await unlink(temporary).catch(e=>{if(e.code!=='ENOENT')throw e;});}
 }
 return {
  list:({before=null,limit=GUESTBOOK_LIMITS.pageSize}={})=>run(async()=>{
   if(!Number.isInteger(limit)||limit<1||limit>GUESTBOOK_LIMITS.maxPageSize||before!==null&&(typeof before!=='string'||!/^[-a-f0-9]{36}$/.test(before)))throw new GuestbookError('invalid_pagination');
   const s=await read();let end=s.messages.length;
   if(before!==null){end=s.messages.findIndex(m=>m.id===before);if(end<0)throw new GuestbookError('invalid_cursor');}
   const start=Math.max(0,end-limit),messages=s.messages.slice(start,end).reverse().map(publicMessage);
   return {messages,total:s.messages.length,nextCursor:start>0?messages.at(-1).id:null};
  }),
  add:input=>run(async()=>{
   const clean=validateGuestbookMessage(input),s=await read();
   const record={id:randomUUID(),...clean,createdAt:new Date(now()).toISOString()};
   s.messages.push(record);await save(s);return publicMessage(record);
  })
 };
}
