/** Extract user-facing source strings without changing internal Chinese data keys. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const parserSource=process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'];
if(!parserSource)throw Error('This extraction script needs Node.js with its bundled Acorn parser.');
const box={exports:{},module:{}};vm.runInNewContext(parserSource,box);const {parse}=box.exports;
const strings=new Map();
const hasHan=s=>/[\u3400-\u9fff]/u.test(s);
const decode=s=>s.replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g,(_,x)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'",nbsp:' '})[x]);
function add(value,source,force=false){
 if(typeof value!=='string')return;
 let text=decode(value).trim();
 if(!text||(!hasHan(text)&&!force)||/^https?:|^data:|\.(png|jpg|webp|svg|json|txt)(?:\?|$)/i.test(text))return;
 if(/^[{\d}\s·/／→↗★＋−⌖|:—–-]+$/.test(text))return;
 const keys=new Map();text=text.replace(/\{\d+\}/g,k=>{if(!keys.has(k))keys.set(k,`{${keys.size}}`);return keys.get(k);});
 if(!strings.has(text))strings.set(text,new Set());strings.get(text).add(source);
}
function markup(text,source){
 for(const tag of text.matchAll(/<meta\b[^>]*>/gi))if(/name=["']description["']/i.test(tag[0])){const value=tag[0].match(/content=(["'])([\s\S]*?)\1/i);if(value)add(value[2],source,true);}
 // Attribute selectors and HTML attributes never become identity/URL translations.
 for(const m of text.matchAll(/(?:title|alt|aria-label|placeholder)\s*=\s*(["'])([\s\S]*?)\1/g))add(m[2],source,true);
 const without=text.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<!--[^]*?-->/g,'');
 for(const m of without.matchAll(/(?:^|>)([^<>]*)(?=<|$)/g))if(m[1].trim())add(m[1],source,true);
}
function candidate(text,source,force=false){if(/<[a-z/!][^>]*>/i.test(text))markup(text,source);else add(text,source,force);}
const skipKeys=new Set(['id','key','source','url','path','gameSource','image','filename','file','titleFile','portraitFile','portraitQuery','portraitQueryId','checked','checkedAt','checkedDate','dimensions','focusBox','bbox','point','labelPoint','position','coords','rarity','start','end','date','profession','rights','identityEvidence','hash','color','sourceKind','mapKind','coverage','method']);
const displayEnglishKeys=new Set(['name','en','label','title','subtitle','summary','description','note','role','period','origin','race','sex','birthday','basis','kind','locationNote','evidence','text','type','chapter','place','status','code','team','caption','warning','availability','access']);
function jsonWalk(value,where,field=''){
 if(typeof value==='string'){if(!skipKeys.has(field))candidate(value,where,displayEnglishKeys.has(field));if(field==='role')add(value.split(/[；，、]/)[0],where+':rank');return;}
 if(Array.isArray(value)){value.forEach((v,i)=>jsonWalk(v,`${where}[${i}]`,field));return;}
 if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))if(!skipKeys.has(k))jsonWalk(v,`${where}.${k}`,k);
}
function expressionParts(node){
 if(node.type==='Literal'&&typeof node.value==='string')return [node.value];
 if(node.type==='TemplateLiteral')return node.quasis.flatMap((q,i)=>[q.value.cooked||q.value.raw,...(i<node.expressions.length?[null]:[])]);
 if(node.type==='BinaryExpression'&&node.operator==='+')return [...expressionParts(node.left),...expressionParts(node.right)];
 return [null];
}
function jsWalk(node,file,parent){
 if(!node||typeof node!=='object')return;
 if(file==='data.js'&&node.type==='Property'&&['description','leader','detailStatus','cities'].includes(node.key?.name||node.key?.value))return;
 if(file==='data.js'&&node.type==='VariableDeclarator'&&node.id?.name==='sources')return;
 const source=`${file}:${node.loc?.start.line||1}`;
 if(node.type==='Literal'&&typeof node.value==='string'){
  const force=parent?.type==='Property'&&parent.value===node&&displayEnglishKeys.has(parent.key?.name||parent.key?.value);
  candidate(node.value,source,force||/^[A-Z][A-Z /&-]{2,}$/.test(node.value));
 }
 if(node.type==='TemplateLiteral'||node.type==='BinaryExpression'&&node.operator==='+'){
  let n=0;candidate(expressionParts(node).map(p=>p===null?`{${n++}}`:p).join(''),source);
 }
 for(const [k,v]of Object.entries(node)){if(['loc','start','end','raw'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>jsWalk(x,file,node));else if(v&&typeof v==='object')jsWalk(v,file,node);}
}
// Project exactly the fields consumed by the current page renderers. Raw data
// downloads retain metadata and old archive excerpts, but those are not UI copy.
const pick=(object,keys)=>Object.fromEntries(keys.filter(k=>object?.[k]!==undefined).map(k=>[k,object[k]]));
function visibleData(filename,data){
 if(filename==='operators.json')return {cutoffEvent:data.cutoffEvent,operators:data.operators.map(o=>pick(o,['name','origin','race','sex','birthday','originLabel','birthdayLabel','newEvent']))};
 if(filename==='biographies.json')return Object.fromEntries(Object.entries(data.people).map(([name,p])=>[name,{sentences:p.sentences}]));
 if(filename==='chapters.json')return data.chapters.map(c=>({...pick(c,['title','place','summary','chronologyNote']),nodes:c.nodes.map(n=>pick(n,['title','stage','stageName','place','summary','time','sources']))}));
 if(filename==='governance.json')return data.regions.map(r=>pick(r,['name','summary','people','operators']));
 if(filename==='cities.json')return data.cities.map(c=>pick(c,['name','aliases','kind','summary','locationNote','sources','operators','people']));
 if(filename==='city-geography.json')return data.cities.map(c=>pick(c,['name','label','basis']));
 if(filename==='map-assets.json')return data.map(m=>({label:m.label.replace('官方选关图','场景')}));
 if(filename==='story-spatial.json')return data.chapters.map(c=>({setting:c.setting,places:c.places.map(p=>pick(p,['label','basis','accuracy'])),nodes:c.nodes.map(n=>({placements:n.placements.map(p=>pick(p,['name','characters','sourceLocation','note']))}))}));
 return data;
}
for(const filename of fs.readdirSync(dist)){
 const full=path.join(dist,filename);if(!fs.statSync(full).isFile())continue;
 if(filename.endsWith('.html'))markup(fs.readFileSync(full,'utf8'),filename);
 else if(filename.endsWith('.js')&&!['i18n.js','atlas.js'].includes(filename))jsWalk(parse(fs.readFileSync(full,'utf8'),{ecmaVersion:'latest',sourceType:'module',locations:true}),filename);
 else if(filename.endsWith('.json')&&!['assets.json','portrait-aliases.json','art-provenance.json'].includes(filename))jsonWalk(visibleData(filename,JSON.parse(fs.readFileSync(full,'utf8'))),filename);
}
// These format templates are generated from composited text nodes and labels.
const templates=['第{0}章 {1}','第{0}章 · {1}','{0} 条档案','{0} 位干员','{0} 个干员条目','{0} 条','{0} 个故事','访客 {0} · 访问 {1}','阅读{0}的站内介绍','{0}：打开地区档案','{0}：查看{1}资料','{0}游戏头像','{0}官方立绘','{0}图片暂不可用','{0}肖像仍待核对','查看{0}出身的干员','查看{0}干员','查看{0}地区档案','◉ {0} · 查看地图','《{0}》版本收录','截至《{0}》','国服档案核对：{0} · 截至《{1}》','{0} 国服快照。','{0}月{1}日','打开{0}档案','打开{0}独立档案','正在定位 · {0} {1}','定位 {0}','CITY ARCHIVE / {0}档案','{0} · 治理与地方势力','来源 {0}','{0} · 来源 {1} ↗'];
templates.forEach(x=>add(x,'runtime-templates'));
const corrections=path.join(dist,'locales/manual-corrections.json');
if(fs.existsSync(corrections))Object.keys(JSON.parse(fs.readFileSync(corrections,'utf8')).en||{}).forEach(x=>add(x,'browser-runtime-review',true));
const output=[...strings].map(([text,files])=>({text,sources:[...files]})).sort((a,b)=>a.text.localeCompare(b.text,'zh-CN'));
fs.mkdirSync(path.join(root,'material/i18n'),{recursive:true});fs.mkdirSync(path.join(dist,'locales'),{recursive:true});
fs.writeFileSync(path.join(root,'material/i18n/source-strings.json'),JSON.stringify(output,null,2)+'\n');
fs.writeFileSync(path.join(dist,'locales/source.json'),JSON.stringify(Object.fromEntries(output.map(x=>[x.text,x.text])),null,2)+'\n');
console.log(`Extracted ${output.length} source strings into material/i18n/source-strings.json and dist/locales/source.json.`);
