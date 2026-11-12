const response=await fetch('biographies.json');
if(!response.ok)throw new Error('Unable to load character biographies');
const data=await response.json();
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function biographyFor(name){return data.people[name]||data.people[data.aliases?.[name]];}
export function biographyHTML(name){const bio=biographyFor(name);return bio?`<section class="character-biography"><h3>${bio.kind==='institution'?'机构概览':'人物小传'}</h3><div class="biography-sentences">${bio.sentences.map(sentence=>`<p>${escape(sentence)}</p>`).join('')}</div><div class="biography-sources">${bio.sources.map((url,i)=>`<a class="source-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">小传原文 ${i+1} ↗</a>`).join('')}</div></section>`:'';}
