/** Static completeness audit. Usage: node scripts/audit-i18n.mjs [source.json] [locale:path.json ...] */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),sourcePath=args.shift()||path.join(project,'dist/locales/source.json');
const source=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
const entries=Array.isArray(source)?source.map(x=>typeof x==='string'?x:x.text):Object.keys(source);
const targets=args.length?args.map(x=>{const i=x.indexOf(':');if(i<0)throw Error('Use locale:path.json for each target');return[x.slice(0,i),x.slice(i+1)];}):['en','ja','zh-TW'].map(l=>[l,path.join(project,'dist/locales',l+'.json')]);
// Language choices intentionally retain their native names in every locale.
const autonyms=new Set(['简体中文','繁體中文','日本語']);
const han=s=>/[\u3400-\u9fff]/u.test(s),slots=s=>[...s.matchAll(/\{(\d+)\}/g)].map(m=>m[1]).sort().join(',');
const patterns={unknownToken:/<\s*unk\s*>|\[UNK\]|�/giu,protectionToken:/\[\s*[7-9]\d{2,}\s*\]|\[\s*(?:TERM|TOKEN|PH|PLACEHOLDER)[_\s-]*\d+\s*\]|\b(?:ZXQ|ZXZ|QZX|ZZZ|TOKEN_|TERM_|PLACEHOLDER_|XQZ)[A-Z_\d]*\b|__[^\s_]+\d+__/giu,modelControl:/<\|[^>]+\|>|<\/?(?:s|pad|eos|bos)>|\b(?:eng_Latn|jpn_Jpan|zho_Hans|zho_Hant)\b/gu};
const report={checked:new Date().toISOString(),source:path.relative(project,sourcePath),totalSourceStrings:entries.length,locales:{}};
let defects=0;
for(const [locale,file]of targets){
 const data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
 const result={file:path.relative(project,file),missing:[],invalid:[],sameValue:[],suspiciousSameValue:[],placeholderMismatch:[],unrestoredTokens:[],unknownTokens:[],modelControlTokens:[],residualChinese:[],extraKeys:Object.keys(data).filter(k=>!entries.includes(k))};
 for(const key of entries){
  if(!Object.prototype.hasOwnProperty.call(data,key)){result.missing.push(key);continue;}
  const value=data[key];if(typeof value!=='string'||!value.trim()){result.invalid.push({source:key,value});continue;}
  if(key===value){result.sameValue.push(key);if(locale==='en'&&han(key)&&!autonyms.has(key))result.suspiciousSameValue.push(key);}
  if(slots(key)!==slots(value))result.placeholderMismatch.push({source:key,translation:value});
  for(const [name,pattern]of Object.entries(patterns)){
   const found=[...value.matchAll(pattern)].map(m=>m[0]).filter(token=>!key.includes(token));
   if(found.length)result[{unknownToken:'unknownTokens',protectionToken:'unrestoredTokens',modelControl:'modelControlTokens'}[name]].push({source:key,translation:value,tokens:found});
  }
  if(locale==='en'&&han(value)&&!(autonyms.has(key)&&value===key))result.residualChinese.push({source:key,translation:value});
 }
 const hardDefects=result.missing.length+result.invalid.length+result.placeholderMismatch.length+result.unrestoredTokens.length+result.unknownTokens.length+result.modelControlTokens.length+result.residualChinese.length;
 result.summary=Object.fromEntries(Object.entries(result).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length]));result.summary.hardDefects=hardDefects;defects+=hardDefects;
 report.locales[locale]=result;console.log(locale,JSON.stringify(result.summary));
}
report.note='Same-value entries are reported for review: Japanese and Traditional Chinese can legitimately share names or wording with the source. Missing values, broken placeholders, leftover protection/model tokens, and Chinese text in English are hard defects. This audit does not establish semantic translation quality.';
const output=path.join(project,'material/i18n/coverage-report.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log('Report:',output);process.exitCode=defects?1:0;
