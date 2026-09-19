import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,createHmac,createHash,timingSafeEqual} from 'node:crypto';

// Anonymous browser counts, not people or IP addresses. Runtime data stays private.
export function createVisitorStore(file,{now=Date.now}={}){
 let queue=Promise.resolve();
 const sign=(id,secret)=>createHmac('sha256',secret).update(id).digest('hex');
 const valid=(token,secret)=>{if(!/^[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token||''))return false;const [id,signature]=token.split('.');return timingSafeEqual(Buffer.from(signature),Buffer.from(sign(id,secret)));};
 async function read(){try{const s=JSON.parse(await readFile(file,'utf8'));if(s.schema!==1||typeof s.secret!=='string'||!Number.isSafeInteger(s.visits)||s.visits<0||!s.browsers||typeof s.browsers!=='object'||Array.isArray(s.browsers))throw Error('Invalid visitor store');return s;}catch(e){if(e.code!=='ENOENT')throw e;return {schema:1,secret:randomBytes(32).toString('hex'),visits:0,browsers:{}};}}
 const result=s=>({visitors:Object.keys(s.browsers).length,visits:s.visits});
 function run(task){const next=queue.then(task);queue=next.catch(()=>{});return next;}
 return {
  get:()=>run(async()=>result(await read())),
  record:token=>run(async()=>{
   const s=await read();let fresh=false;
   if(!valid(token,s.secret)){const id=randomBytes(16).toString('hex');token=id+'.'+sign(id,s.secret);fresh=true;}
   const key=createHash('sha256').update(token.split('.')[0]).digest('hex'),time=now();
   if(!Object.hasOwn(s.browsers,key)||time-s.browsers[key]>=30*60*1000)s.visits++;
   s.browsers[key]=time;
   await mkdir(path.dirname(file),{recursive:true,mode:0o700});
   const temporary=file+'.tmp';await writeFile(temporary,JSON.stringify(s),{mode:0o600});await rename(temporary,file);
   return {...result(s),cookie:fresh?token:null};
  })
 };
}
