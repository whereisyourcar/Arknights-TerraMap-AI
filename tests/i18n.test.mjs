import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createTranslator,LANGUAGES,LANGUAGE_KEY} from '../dist/i18n.js';
const sample={'乌萨斯':'Ursus','塔露拉':'Talulah','苦难摇篮':'The Birth of Tragedy','第{0}章 {1}':'Episode {0}: {1}','{0} 位干员':'{0} operators','访客 {0} · 访问 {1}':'Visitors {0} · Visits {1}','查看{0}出身的干员':'View operators from {0}','{0}：打开地区档案':'{0}: open region profile','搜索干员':'Search operators'};
test('localization uses exact dictionaries and recursively translates explicit dynamic templates',()=>{
 const t=createTranslator(sample).translate;
 assert.equal(t('乌萨斯'),'Ursus');assert.equal(t('查看乌萨斯出身的干员'),'View operators from Ursus');
 assert.equal(t('第7章 苦难摇篮'),'Episode 7: The Birth of Tragedy');assert.equal(t('438 位干员'),'438 operators');
 assert.equal(t('访客 1,234 · 访问 2,345'),'Visitors 1,234 · Visits 2,345');assert.equal(t('乌萨斯：打开地区档案'),'Ursus: open region profile');
 assert.equal(t('  塔露拉\n'),'  Talulah\n');assert.equal(t('乌萨斯 / 塔露拉'),'Ursus / Talulah');
});
test('missing translations are reported rather than replaced with fabricated text, URLs remain intact',()=>{
 const missing=[];const t=createTranslator(sample,{onMissing:s=>missing.push(s)}).translate;
 assert.equal(t('尚未翻译的介绍'),'尚未翻译的介绍');assert.deepEqual(missing,['尚未翻译的介绍']);
 assert.equal(t('https://wiki.biligame.com/arknights/塔露拉'),'https://wiki.biligame.com/arknights/塔露拉');
 assert.equal(t('https://example.com/?query=乌萨斯'),'https://example.com/?query=乌萨斯');assert.equal(t('12F'),'12F');
});
test('Chinese restoration and translator instances do not mutate source dictionaries or identity keys',()=>{
 const original={...sample};const en=createTranslator(sample).translate;const zh=createTranslator({}, {locale:'zh-CN'}).translate;
 assert.equal(en('塔露拉'),'Talulah');assert.equal(zh('塔露拉'),'塔露拉');assert.deepEqual(sample,original);
 assert.deepEqual(Object.keys(LANGUAGES),['zh-CN','zh-TW','en','ja']);assert.equal(LANGUAGE_KEY,'terramap.language');
});
test('language selector exposes all four choices; dynamic content, opt-out and DOM sources have explicit protection',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),runtime=readFileSync(new URL('../dist/i18n.js',import.meta.url),'utf8');
 for(const key of Object.keys(LANGUAGES))assert.ok(html.includes(`value="${key}"`));
 assert.match(runtime,/WeakMap/);assert.match(runtime,/MutationObserver/);assert.match(runtime,/data-no-translate/);assert.match(runtime,/translate="no"/);assert.match(runtime,/attributeFilter/);
 assert.doesNotMatch(runtime,/setAttribute\(['"](?:href|src|value|data-person|data-region)/);assert.doesNotMatch(runtime,/translate\.google|mymemory|libretranslate/);
});
test('available locale dictionaries preserve all interpolation placeholders and non-empty string values',()=>{
 const slots=s=>[...s.matchAll(/\{(\d+)\}/g)].map(m=>m[1]).sort();
 for(const language of ['en','ja','zh-TW']){
  const file=new URL(`../dist/locales/${language}.json`,import.meta.url);if(!existsSync(file))continue;
  const catalog=JSON.parse(readFileSync(file,'utf8'));assert.ok(Object.keys(catalog).length>100);
  for(const [source,translated]of Object.entries(catalog)){assert.equal(typeof translated,'string',`${language}: ${source}`);assert.ok(translated.trim(),`${language}: ${source}`);assert.deepEqual(slots(source),slots(translated),`${language}: ${source}`);}
 }
});

test('all shipped locales cover every extracted source string',()=>{
 const source=JSON.parse(readFileSync(new URL('../dist/locales/source.json',import.meta.url),'utf8'));
 for(const language of ['en','ja','zh-TW']){
  const catalog=JSON.parse(readFileSync(new URL(`../dist/locales/${language}.json`,import.meta.url),'utf8'));
  const missing=Object.keys(source).filter(key=>!Object.hasOwn(catalog,key));
  assert.deepEqual(missing,[],`${language}: untranslated source content`);
 }
});

test('source-link decorations preserve complete dictionary labels before generic templates',()=>{
 const missing=[];const t=createTranslator({'萌娘百科 · 炎(明日方舟)':'Moegirl · Yan (Arknights)','{0} · {1} ↗':'{0} · {1} ↗'},{onMissing:s=>missing.push(s)}).translate;
 assert.equal(t('萌娘百科 · 炎(明日方舟) ↗'),'Moegirl · Yan (Arknights) ↗');assert.deepEqual(missing,[]);
});

test('numeric ordinal templates cannot consume faction names in composite labels',()=>{
 const missing=[];const t=createTranslator({'第{0}':'No. {0}','第四集团军所属行动线':'Fourth Army operation route','当前地点':'Current location'},{onMissing:s=>missing.push(s)}).translate;
 assert.equal(t('第四集团军所属行动线 · 当前地点'),'Fourth Army operation route · Current location');assert.deepEqual(missing,[]);assert.equal(t('第7'),'No. 7');
});

test('all story-node faction labels and trace descriptions localize without missing fragments',()=>{
 const spatial=JSON.parse(readFileSync(new URL('../dist/story-spatial.json',import.meta.url),'utf8'));
 for(const locale of ['en','ja','zh-TW']){
  const missing=[];const t=createTranslator(JSON.parse(readFileSync(new URL(`../dist/locales/${locale}.json`,import.meta.url),'utf8')),{locale,onMissing:s=>missing.push(s)}).translate;
  const relations={present:'当前地点',remote:'远程／场外',memory:'回忆场景',nonphysical:'非物理空间'};
  for(const chapter of spatial.chapters)for(const node of chapter.nodes)for(const placement of node.placements){
   const place=chapter.places.find(p=>p.id===placement.locationId);
   t(`${placement.name} · ${place.label} · ${relations[placement.relation]}`);
   for(const name of placement.characters.length?placement.characters:[placement.name])t(name+'的剧情出现顺序；不代表道路或确切移动时刻');
  }
  assert.deepEqual([...new Set(missing)],[],`${locale}: dynamic story text`);
 }
});
