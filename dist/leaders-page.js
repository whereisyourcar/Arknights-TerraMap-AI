import {biographyHTML} from './biography.js';
import {searchable,localize,currentLanguage} from './i18n.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createLeadersPage(root,{regions,chapters,portrait,entities,onRegion}){
 const records=regions.flatMap(r=>(r.people||[]).map(p=>({...p,region:r})));
 const isEntity=p=>entities.includes(p.portraitQuery||p.name);
 const dialog=document.createElement('dialog');dialog.className='leader-dialog';dialog.setAttribute('aria-labelledby','leader-title');document.body.append(dialog);
 let previousFocus;
 dialog.addEventListener('close',()=>{document.body.classList.remove('person-open');previousFocus?.focus();});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 function open(name){
  let matches=records.filter(p=>[p.name,p.portraitQuery].includes(name));
  const p=matches[0];const related=p?[...new Map(matches.map(x=>[x.region.id,x.region])).values()]:regions.filter(r=>(r.operators||[]).includes(name));
  const aliases=[name,...matches.flatMap(p=>[p.name,p.portraitQuery]).filter(Boolean)];
  const appearances=chapters.filter(c=>c.nodes.some(n=>aliases.some(a=>JSON.stringify(n.factions||n).includes(a))));
  if(!dialog.open)previousFocus=document.activeElement;
  dialog.innerHTML=`<button class="leader-close" aria-label="关闭人物介绍">×</button><div class="leader-profile"><div class="leader-art">${portrait(p?.portraitFile||p?.portraitQuery||name)}</div><div><span class="eyebrow">${p?(isEntity(p)?'GOVERNANCE / 权力机构':'LEADER / 势力人物'):'CHARACTER / 相关人物'}</span><h2 id="leader-title">${esc(p?.name||name)}</h2>${p?.portraitQuery&&p.portraitQuery!==p.name?`<p class="leader-alias">${esc(p.portraitQuery)}</p>`:''}<p class="leader-role">${esc(p?.role||'与下列地区有关的角色')}</p><p class="tiny">含剧情剧透 · 身份与职务以所列故事阶段为准</p></div></div><div class="leader-body">${biographyHTML(p?.name||name)}${matches.length?matches.map(m=>`<section><h3>${esc(m.region.name)} · 身份档案</h3>${m.evidence&&m.evidence!==m.role?`<p>${esc(m.evidence)}</p>`:''}<dl><dt>职务 / 权力范围</dt><dd>${esc(m.role)}</dd><dt>对应时期</dt><dd>${esc(m.period||'原资料未明确具体任职起止时间')}</dd></dl><h4>所在地区与势力背景</h4><p>${esc(m.region.summary||m.region.description)}</p></section>`).join(''):'<p>关联地区见下方地图入口；相关人物不等同于地方领袖。</p>'}${p?`<section><h3>同地区其他人物与机构</h3><div class="leader-region-links">${records.filter(x=>related.some(r=>r.id===x.region.id)&&x.name!==p.name).filter((x,i,a)=>a.findIndex(y=>y.name===x.name)===i).map(x=>`<button data-related-person="${esc(x.name)}">${esc(x.name)} →</button>`).join('')}</div></section>`:''}<section><h3>地图中的关联地区</h3><div class="leader-region-links">${related.map(r=>`<button data-profile-region="${esc(r.id)}">◉ ${esc(r.name)} · 查看地图</button>`).join('')}</div></section>${appearances.length?`<section><h3>本站收录的主线出场</h3><p>${appearances.map(c=>`第${c.id}章 · ${esc(c.title)}`).join(' ／ ')}</p><p class="tiny">按本站关键节点索引匹配，不代表完整出场列表。</p></section>`:''}<section><h3>资料依据</h3><p class="tiny">以上为站内已有资料的整理摘要。只有主动点击下方来源才会打开外站。</p>${[...new Set(matches.map(m=>m.source).filter(Boolean).concat(p?[]:[`https://wiki.biligame.com/arknights/${encodeURIComponent(name)}`]))].map((url,i)=>`<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${url.includes('biligame')?'BWIKI':url.includes('moegirl')?'萌娘百科':'资料原文'} · 来源 ${i+1} ↗</a>`).join('')}</section></div>`;
  dialog.querySelector('.leader-close').onclick=()=>dialog.close();
  dialog.querySelectorAll('[data-related-person]').forEach(b=>b.onclick=()=>open(b.dataset.relatedPerson));
  dialog.querySelectorAll('[data-profile-region]').forEach(b=>b.onclick=()=>{dialog.close();onRegion(b.dataset.profileRegion);});
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;document.body.classList.add('person-open');
 }
 const affiliations={
 '恩雅·希瓦艾什':'喀兰宗教','耶拉冈德':'喀兰宗教','恩希欧迪斯·希瓦艾什':'希瓦艾什家族 / 喀兰贸易','诺希斯·埃德怀斯':'谢拉格议会','菈塔托丝·布朗陶':'布朗陶家族','阿克托斯·佩尔罗契':'佩尔罗契家族',
 '特雷西斯':'卡兹戴尔军事委员会','特蕾西娅':'巴别塔','维什戴尔':'巴别塔','阿米娅':'罗德岛','爱布拉娜':'深池','克洛维希娅':'伦蒂尼姆市民自救军','维娜·维多利亚':'伦蒂尼姆议会',
 '歌蕾蒂娅':'深海猎人','乌尔比安':'深海猎人','魏彦吾':'龙门','左宣辽':'镇岳军','西西里夫人':'西西里家族','贝纳尔多·贝洛内':'贝洛内家族','阿尔贝托·萨卢佐':'萨卢佐家族'
 };
 const faction=p=>affiliations[p.name]||(p.region.id==='victoria'&&p.name.includes('公爵')?'维多利亚公爵势力':p.region.name+' · 治理与地方势力');
 const ranks={'阿米娅':'罗德岛公开领袖','维什戴尔':'重建巴别塔的领导者','耶拉冈德':'谢拉格神明 / 建国者','威灵顿公爵':'维多利亚公爵','高多汀公爵':'公爵 / 维多利亚议员','温德米尔公爵':'维多利亚公爵','歌蕾蒂娅':'技术执政官 / 第二大队长','乌尔比安':'第三大队长 / 原执政官'};
 const rank=p=>ranks[p.name]||p.role?.split(/[；，、]/)[0]||'身份未明确';
 const organizations=[...new Set(Object.values(affiliations))];
 let selection='region:kjerag',query='';
 const inSelection=p=>selection.startsWith('region:')?p.region.id===selection.slice(7):faction(p)===selection.slice(4);
 const distinct=list=>list.filter((p,i,a)=>a.findIndex(x=>x.name===p.name)===i);
 function render(){root.innerHTML=`<div class="leaders-wrap leaders-layout"><aside class="leader-sidebar" aria-label="势力列表"><span class="eyebrow">FACTION INDEX</span><h1>势力领袖</h1><p>选择势力，查看权力与人物。</p><h2>国家与地区</h2>${[...regions].sort((a,b)=>localize(a.name).localeCompare(localize(b.name),currentLanguage())).map(r=>`<button data-leader-selection="region:${esc(r.id)}"><span>${esc(r.name)}</span><small>${(r.people||[]).length}</small></button>`).join('')}<h2>组织与地方势力</h2>${[...organizations].sort((a,b)=>localize(a).localeCompare(localize(b),currentLanguage())).map(f=>`<button data-leader-selection="org:${esc(f)}"><span>${esc(f)}</span><small>${distinct(records.filter(p=>faction(p)===f)).length}</small></button>`).join('')}</aside><div class="leader-main"><header id="leader-selection-heading"></header><div class="leader-filters"><label>人物检索 <input type="search" aria-label="搜索当前势力人物" placeholder="在当前势力中搜索姓名、代号、职位…" value="${esc(query)}"></label><span id="leader-count" aria-live="polite"></span></div><div class="leader-groups"></div></div></div>`;
 root.querySelectorAll('[data-leader-selection]').forEach(b=>b.onclick=()=>{selection=b.dataset.leaderSelection;query='';root.querySelector('input').value='';update();root.querySelector('.leader-main').scrollIntoView({block:'start',behavior:'instant'});});root.querySelector('input').oninput=e=>{query=e.target.value;update();};update();}
 function update(){
 const region=selection.startsWith('region:')?regions.find(r=>r.id===selection.slice(7)):null;
 const title=region?.name||selection.slice(4);
 root.querySelectorAll('[data-leader-selection]').forEach(b=>{const active=b.dataset.leaderSelection===selection;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 root.querySelector('#leader-selection-heading').innerHTML=`<span class="eyebrow">PEOPLE & POWER / ${region?'REGION':'FACTION'}</span><h2>${esc(title)}</h2><p>${esc(region?.summary||region?.description||'按本站已有治理档案整理的组织与地方势力人物。')}</p><small>职务以所列剧情时期为准，历史人物不等同于现任领导者。</small>`;
 const found=distinct(records.filter(p=>inSelection(p)&&searchable([p.name,p.portraitQuery,p.role],query)));
 root.querySelector('#leader-count').textContent=`${found.length} 条档案`;
 const groups=[...new Set(found.map(faction))].sort((a,b)=>localize(a).localeCompare(localize(b),currentLanguage()));
 root.querySelector('.leader-groups').innerHTML=groups.length?groups.map(g=>`<section class="leader-faction-group"><h3>${esc(g)}<span>${found.filter(p=>faction(p)===g).length} 条档案</span></h3><div class="leader-catalog">${found.filter(p=>faction(p)===g).map(p=>`<button class="leader-tile" data-person="${esc(p.name)}"><strong class="leader-rank">${esc(rank(p))}</strong><div class="leader-tile-content"><div class="leader-tile-art">${portrait(p.portraitFile||p.portraitQuery||p.name)}</div><div class="leader-tile-copy"><span class="eyebrow">${esc(p.region.name)} / ${isEntity(p)?'机构':'人物'}</span><h2>${esc(p.name)}</h2>${p.portraitQuery&&p.portraitQuery!==p.name?`<span class="leader-alias">${esc(p.portraitQuery)}</span>`:''}<p>${esc(p.role)}</p><small>${esc(p.period||'时期未注明')}</small><span class="leader-read">阅读档案 →</span></div></div></button>`).join('')}</div></section>`).join(''):'<p class="fact-note">当前势力没有匹配的人物，请更换关键词或在左侧选择其他势力。</p>';
 }
 document.addEventListener('terramap-language',()=>{if(!root.hidden&&root.childElementCount)render();});
 return {render,open};
}
