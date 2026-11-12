/** Local dictionaries only. UI translation never changes data identities or visitor content. */
export const LANGUAGES=Object.freeze({'zh-CN':'简体中文','zh-TW':'繁體中文',en:'English',ja:'日本語'});
export const LANGUAGE_KEY='terramap.language';
const hasHan=value=>/[\u3400-\u9fff]/u.test(value);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const cnLabels={'TERRA / GUESTBOOK':'泰拉 / 留言簿','EXPLORE TERRA':'探索泰拉','MAIN THEME':'主线剧情','EDITORIAL & SOURCE ARCHIVE':'编辑说明与资料来源','FACTION INDEX':'势力索引','OPERATOR ARCHIVE':'干员档案','RHODES ISLAND / OPERATOR':'罗德岛 / 干员','TERRA GEOGRAPHIC ARCHIVE':'泰拉地理档案','REGION ARCHIVE / 地区档案':'地区档案','CITY ARCHIVE / 城邦档案':'城邦档案','GOVERNANCE / 权力机构':'权力机构','LEADER / 势力人物':'势力人物','CHARACTER / 相关人物':'相关人物','ORIGINS / 出身地':'出身地','RACES / 种族':'种族','MAIN THEME / 剧情行迹':'主线行迹','TERRA / 地区档案':'地区档案','COUNTRY / REGION':'国家 / 地区','EVENT STORY ARCHIVE':'活动故事档案'};
const cnRegionLabels={COLUMBIA:'哥伦比亚','BOLÍVAR':'玻利瓦尔',SAMI:'萨米',KAZIMIERZ:'卡西米尔',URSUS:'乌萨斯',LEITHANIEN:'莱塔尼亚',VICTORIA:'维多利亚',KJERAG:'谢拉格',SARGON:'萨尔贡',IBERIA:'伊比利亚',LATERANO:'拉特兰',SIRACUSA:'叙拉古',MINOS:'米诺斯','RIM BILLITON':'雷姆必拓',KAZDEL:'卡兹戴尔',YAN:'炎',HIGASHI:'东国','ÆGIR':'阿戈尔',DURIN:'杜林',REGION:'地区',FACTION:'势力','CITY FILE':'城邦档案','PEOPLE & POWER':'人物与权力','STORY DIRECTORY':'故事目录','TERRA / STORIES BEYOND THE MAIN THEME':'泰拉 / 主线之外的故事'};
Object.assign(cnLabels,cnRegionLabels,{'PEOPLE & POWER / {0}':'人物与权力 / {0}','EPISODE {0}':'第{0}章','CITY ARCHIVE / {0}档案':'{0}档案'});
function patternFor(key){
 const slots=[];let previous=0,pattern='^',staticLength=0;
 for(const match of key.matchAll(/\{(\d+)\}/g)){
  const literal=key.slice(previous,match.index);staticLength+=literal.length;pattern+=escapeRegex(literal);slots.push(match[1]);pattern+='([\\s\\S]+?)';previous=match.index+match[0].length;
 }
 if(!slots.length)return null;
 const tail=key.slice(previous);pattern+=escapeRegex(tail)+'$';staticLength+=tail.length;
 // A lone placeholder is not a translation rule.
 return staticLength?{key,slots,pattern:new RegExp(pattern,'u'),staticLength}:null;
}
/** Pure translation core; also used by coverage audits and tests. */
export function createTranslator(dictionary={}, {locale='en',onMissing=()=>{}}={}){
 const catalog=locale==='zh-CN'?{...cnLabels,...dictionary}:{...dictionary};
 const templates=Object.keys(catalog).map(patternFor).filter(Boolean).sort((a,b)=>b.staticLength-a.staticLength);
 function core(source,depth=0,report=true){
  if(own(catalog,source))return catalog[source];
  const decorated=source.match(/^(.+?)(\s*[↗→])$/u);
  if(decorated&&own(catalog,decorated[1]))return catalog[decorated[1]]+decorated[2];
  if(depth<8){
   for(const entry of templates){
    const match=source.match(entry.pattern);if(!match)continue;
    if(entry.key==='第{0}'&&!/^\d+$/.test(match[1]))continue;
    const captures=Object.fromEntries(entry.slots.map((key,i)=>[key,core(match[i+1],depth+1,report)]));
    return catalog[entry.key].replace(/\{(\d+)\}/g,(literal,key)=>captures[key]??literal);
   }
   // A line may combine independently rendered names with neutral separators.
   const parts=source.split(/(\s+[·/／|]\s+|\s*↗\s*|\s*→\s*|\s*\n\s*)/u);
   if(parts.length>1)return parts.map((part,i)=>i%2?part:core(part,depth+1,report)).join('');
  }
  if(report&&locale!=='zh-CN'&&hasHan(source))onMissing(source);
  return source;
 }
 const translate=(value,{report=true}={})=>{
  const source=String(value??'');if(!source.trim()||/^https?:\/\//i.test(source.trim()))return source;
  const leading=source.match(/^\s*/u)[0],trailing=source.match(/\s*$/u)[0];
  return leading+core(source.trim(),0,report)+trailing;
 };
 return {translate,templates:templates.length};
}
let locale='zh-CN',dictionary={},translator=createTranslator({}, {locale}),instance=null;
export const currentLanguage=()=>locale;
export const localize=value=>translator.translate(value);
export function searchable(value,query){
 const normalized=String(query??'').trim().normalize('NFKC').toLocaleLowerCase(locale);if(!normalized)return true;
 const values=Array.isArray(value)?value:[value];
 return values.some(v=>[String(v??''),localize(v)].some(text=>text.normalize('NFKC').toLocaleLowerCase(locale).includes(normalized)));
}
const notices={
 'zh-CN':{label:'语言',failed:'语言文件加载失败，请重试。',missing:'部分文字缺少翻译，已保留原文。',loading:'正在切换语言…'},
 'zh-TW':{label:'語言',failed:'語言檔案載入失敗，請重試。',missing:'部分文字缺少翻譯，已保留原文。',loading:'正在切換語言…'},
 en:{label:'Language',failed:'The language file could not be loaded. Please retry.',missing:'Some text has no translation and is shown in the original language.',loading:'Changing language…'},
 ja:{label:'言語',failed:'言語ファイルを読み込めませんでした。もう一度お試しください。',missing:'一部の文章に翻訳がないため、原文を表示しています。',loading:'言語を切り替えています…'}
};
export function initI18n({root=document.documentElement,select=document.querySelector('#language-select'),status=document.querySelector('#language-status'),fetcher=fetch}={}){
 if(instance)return instance;
 const originals=new WeakMap(),attributes=new WeakMap(),cache=new Map([['zh-CN',{}]]),missing=new Set();
 let observer,queued=false,changeToken=0;
 const ignored=element=>!element||!!element.closest('script,style,code,pre,textarea,input,[data-no-translate],[translate="no"]');
 const report=source=>{if(missing.has(source))return;missing.add(source);root.dataset.i18nMissing=String(missing.size);if(status){status.hidden=false;status.textContent=notices[locale].missing;status.dataset.missing=JSON.stringify([...missing]);}document.dispatchEvent(new CustomEvent('terramap-i18n-missing',{detail:{locale,source}}));};
 function text(node){
  if(ignored(node.parentElement))return;
  const previous=originals.get(node),current=node.nodeValue;
  const source=previous&&current===previous.rendered?previous.source:current;
  const rendered=translator.translate(source);originals.set(node,{source,rendered});if(current!==rendered)node.nodeValue=rendered;
 }
 function attribute(element,name){
  if(!element||element.closest('script,style,code,pre,[data-no-translate],[translate="no"]'))return;const current=element.getAttribute(name);if(current===null)return;
  let map=attributes.get(element);if(!map){map=new Map();attributes.set(element,map);}
  const previous=map.get(name),source=previous&&current===previous.rendered?previous.source:current;
  const rendered=translator.translate(source);map.set(name,{source,rendered});if(current!==rendered)element.setAttribute(name,rendered);
 }
 function apply(branch=root){
  if(branch.nodeType===3){text(branch);return;}if(branch.nodeType!==1&&branch.nodeType!==9)return;
  if(branch.nodeType===1&&ignored(branch))return;
  const walker=document.createTreeWalker(branch,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  const visit=node=>{if(node.nodeType===3)text(node);else for(const name of ['title','aria-label','placeholder','alt'])attribute(node,name);};
  visit(branch);let node;while((node=walker.nextNode()))visit(node);
  const description=root.querySelector('meta[name="description"]');if(description)attribute(description,'content');
 }
 function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});}
 function chrome(){if(select){select.value=locale;select.setAttribute('aria-label',notices[locale].label);const label=document.querySelector('#language-label');if(label)label.textContent=notices[locale].label;}root.lang=locale;root.dataset.language=locale;}
 async function change(next,{persist=true}={}){
  if(!own(LANGUAGES,next))next='zh-CN';const token=++changeToken;
  if(select)select.disabled=true;if(status){status.hidden=false;status.textContent=notices[next].loading;}
  try{
   if(!cache.has(next)){
    const response=await fetcher(`locales/${next}.json`);if(!response.ok)throw Error(`Locale ${next}: HTTP ${response.status}`);
    const data=await response.json();if(!data||Array.isArray(data)||typeof data!=='object'||Object.values(data).some(v=>typeof v!=='string'))throw Error('Invalid translation dictionary');
    cache.set(next,data);
   }
   if(token!==changeToken)return false;
   locale=next;dictionary=cache.get(next);missing.clear();root.dataset.i18nMissing='0';translator=createTranslator(dictionary,{locale,onMissing:report});
   chrome();if(status){status.hidden=true;delete status.dataset.missing;}apply();
   if(persist)try{localStorage.setItem(LANGUAGE_KEY,locale);}catch{}
   document.dispatchEvent(new CustomEvent('terramap-language',{detail:{locale}}));return true;
  }catch(error){
   if(token===changeToken){if(select)select.value=locale;if(status){status.hidden=false;status.textContent=notices[locale].failed;}document.dispatchEvent(new CustomEvent('terramap-i18n-error',{detail:{locale:next,message:String(error)}}));}return false;
  }finally{if(token===changeToken&&select)select.disabled=false;}
 }
 observer=new MutationObserver(records=>{if(records.some(r=>r.type==='childList'||r.type==='characterData'||['title','aria-label','placeholder','alt','content'].includes(r.attributeName)))schedule();});
 observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','alt','content']});
 select?.addEventListener('change',event=>change(event.target.value));
 let preferred='zh-CN';try{preferred=localStorage.getItem(LANGUAGE_KEY)||preferred;}catch{}
 instance={change,apply,getMissing:()=>[...missing],getLanguage:()=>locale,destroy:()=>{observer.disconnect();instance=null;},ready:null};
 instance.ready=change(preferred,{persist:false});window.terraMapI18n=instance;return instance;
}
