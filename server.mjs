import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createVisitorStore} from './visitor-store.mjs';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
export function createServer({visitorFile=process.env.VISITOR_DATA_FILE||fileURLToPath(new URL('./var/visitors.json',import.meta.url))}={}){
const visitors=createVisitorStore(visitorFile);
return http.createServer(async(req,res)=>{
 if(req.url?.split('?')[0]==='/api/visits'){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','POST'].includes(req.method)){res.writeHead(405).end();return;}
  try{
   if(req.method==='GET'){res.end(JSON.stringify(await visitors.get()));return;}
   let origin;try{origin=new URL(req.headers.origin);}catch{res.writeHead(403).end();return;}
   if(origin.host!==req.headers.host||!['http:','https:'].includes(origin.protocol)){res.writeHead(403).end();return;}
   const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('terramap_visitor='))?.slice(17);
   const {cookie:issued,...counts}=await visitors.record(cookie);
   if(issued)res.setHeader('Set-Cookie',`terramap_visitor=${issued}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${process.env.PUBLIC_ORIGIN?.startsWith('https:')?'; Secure':''}`);
   res.end(JSON.stringify(counts));
  }catch{res.writeHead(503).end(JSON.stringify({error:'Visitor statistics temporarily unavailable'}));}
  return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root)){res.writeHead(403).end();return;}const content=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:content);}catch{res.writeHead(404).end('Not found');}
});
}
export const server=createServer();
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT||4185);server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`TerraMap: http://127.0.0.1:${port}`));}
