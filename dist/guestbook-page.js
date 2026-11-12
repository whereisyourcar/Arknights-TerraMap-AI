const AVATARS=[['amiya','阿米娅'],['kaltsit','凯尔希'],['chen','陈'],['texas','德克萨斯'],['exusiai','能天使'],['skadi','斯卡蒂'],['silverash','银灰'],['surtr','史尔特尔'],['eyjafjalla','艾雅法拉'],['w','W']];
const avatarPath=id=>`assets/guestbook/avatar-${AVATARS.some(a=>a[0]===id)?id:'amiya'}.svg`;
export const escapeGuestbookText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const count=value=>[...value.normalize('NFC').trim()].length;
const ERRORS={invalid_nickname:'昵称需要 1—24 个字符，且不能换行。',invalid_message:'留言需要 1—1000 个字符。',invalid_avatar:'请选择一个头像。',body_too_large:'留言过长，请缩短后重试。',rate_limited:'留言太频繁，请稍后再试。',same_origin_required:'页面地址与服务设置不一致，请刷新页面后重试。',guestbook_unavailable:'留言服务暂时不可用，请稍后重试。'};

export function createGuestbookPage(root,{locale='zh-CN',translate=s=>s}={}){
 let avatar='amiya',nickname='',message='',messages=[],nextCursor=null,total=0,loaded=false,loading=false,sending=false,status='',statusError=false,requestNumber=0;
 const t=s=>translate(s),esc=escapeGuestbookText;
 function render(){
  root.setAttribute('data-no-translate','');root.setAttribute('aria-label',t('留言板'));
  root.innerHTML=`<div class="guestbook-wrap"><header class="guestbook-header"><div><span class="eyebrow">${esc(t('TERRA / GUESTBOOK'))}</span><h1>${esc(t('沿途留言'))}</h1><p>${esc(t('在这片大地留下你的足迹，与其他博士打个招呼。'))}</p></div><div class="guestbook-emblem" aria-hidden="true">✦</div></header><div class="guestbook-layout"><form class="guestbook-compose"><h2>${esc(t('写一则留言'))}</h2><fieldset class="guestbook-avatars"><legend>${esc(t('选择头像'))}</legend><div class="guestbook-avatar-grid">${AVATARS.map(([id,name])=>`<label title="${esc(t(name))}"><input type="radio" name="avatar" value="${id}" ${id===avatar?'checked':''}><span><img src="${avatarPath(id)}" alt="" width="72" height="72"><small>${esc(t(name))}</small></span></label>`).join('')}</div></fieldset><p class="guestbook-avatar-note">${esc(t('原创简化的同人头像，非游戏官方素材。'))}</p><label class="guestbook-field">${esc(t('昵称'))}<input name="nickname" type="text" autocomplete="nickname" maxlength="96" required placeholder="${esc(t('你的名字或代号'))}" value="${esc(nickname)}" dir="auto" translate="no" data-no-translate></label><label class="guestbook-field">${esc(t('留言'))}<textarea name="message" rows="6" maxlength="4000" required placeholder="${esc(t('任何语言都欢迎。分享感想，也请尊重彼此。'))}" dir="auto" translate="no" data-no-translate>${esc(message)}</textarea></label><div class="guestbook-compose-footer"><span class="guestbook-length" aria-live="off"></span><button type="submit" class="guestbook-submit">${esc(t(sending?'正在发布…':'发布留言'))}</button></div><p class="guestbook-privacy">${esc(t('昵称和留言会公开展示，请勿填写个人隐私。留言保留原文，不随页面语言翻译。'))}</p><p class="guestbook-status" role="status" aria-live="polite"></p></form><section class="guestbook-feed" aria-labelledby="guestbook-feed-title"><header><div><span class="eyebrow">${esc(t('来自旅途的回响'))}</span><h2 id="guestbook-feed-title">${esc(t('大家的留言'))}</h2></div><button type="button" class="guestbook-refresh">${esc(t('刷新'))}</button></header><p class="guestbook-total"></p><div class="guestbook-messages" aria-busy="false"></div><button type="button" class="guestbook-more" hidden>${esc(t('加载更多留言'))}</button></section></div></div>`;
  const form=root.querySelector('form');form.addEventListener('submit',submit);
  form.querySelector('[name=nickname]').addEventListener('input',e=>{nickname=e.target.value;});
  form.querySelector('[name=message]').addEventListener('input',e=>{message=e.target.value;updateLength();});
  form.querySelectorAll('[name=avatar]').forEach(input=>input.addEventListener('change',()=>{avatar=input.value;}));
  root.querySelector('.guestbook-refresh').onclick=()=>load(false);
  root.querySelector('.guestbook-more').onclick=()=>load(true);
  updateLength();renderMessages();renderStatus();updateBusy();if(!loaded&&!loading)load(false);
 }
 function updateLength(){const n=count(message);const el=root.querySelector('.guestbook-length');if(el){el.textContent=`${n} / 1000`;el.classList.toggle('over-limit',n>1000);}}
 function renderStatus(){const el=root.querySelector('.guestbook-status');if(el){el.textContent=t(status);el.classList.toggle('is-error',statusError);}}
 function updateBusy(){
  if(!root.querySelector('form'))return;
  root.querySelector('.guestbook-submit').disabled=sending;
  root.querySelector('.guestbook-submit').textContent=t(sending?'正在发布…':'发布留言');
  root.querySelectorAll('form input,form textarea').forEach(el=>el.disabled=sending);
  root.querySelector('.guestbook-refresh').disabled=loading;
  root.querySelector('.guestbook-more').disabled=loading;
  root.querySelector('.guestbook-messages').setAttribute('aria-busy',String(loading));
 }
 function renderMessages(){
  const list=root.querySelector('.guestbook-messages');if(!list)return;list.replaceChildren();
  root.querySelector('.guestbook-total').textContent=loaded?`${t('留言总数')}: ${total}`:t('正在读取留言…');
  if(!messages.length){const p=document.createElement('p');p.className='guestbook-empty';p.textContent=t(loaded?'还没有留言，来留下第一声问候吧。':'正在读取留言…');list.append(p);}
  for(const m of messages){
   const article=document.createElement('article');article.className='guestbook-message';
   const img=document.createElement('img');img.src=avatarPath(m.avatar);img.alt='';img.width=64;img.height=64;img.loading='lazy';
   const body=document.createElement('div'),header=document.createElement('header'),name=document.createElement('strong'),text=document.createElement('p'),time=document.createElement('time');
   for(const el of [name,text]){el.setAttribute('translate','no');el.setAttribute('data-no-translate','');el.dir='auto';}
   name.textContent=m.nickname;text.textContent=m.message;
   const date=new Date(m.createdAt);time.dateTime=Number.isNaN(date.getTime())?'':date.toISOString();
   time.textContent=Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(date);
   time.setAttribute('translate','no');time.setAttribute('data-no-translate','');header.append(name,time);body.append(header,text);article.append(img,body);list.append(article);
  }
  root.querySelector('.guestbook-more').hidden=!nextCursor;
 }
 async function load(append){
  if(loading)return;loading=true;const request=++requestNumber;updateBusy();
  try{
   const response=await fetch(`api/guestbook?limit=20${append&&nextCursor?'&before='+encodeURIComponent(nextCursor):''}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('load_failed');const data=await response.json();if(request!==requestNumber)return;
   if(!Array.isArray(data.messages)||!Number.isSafeInteger(data.total))throw Error('load_failed');
   messages=append?[...messages,...data.messages.filter(m=>!messages.some(old=>old.id===m.id))]:data.messages;nextCursor=data.nextCursor;total=data.total;loaded=true;renderMessages();
   const failed=root.querySelector('.guestbook-load-error');failed?.remove();
  }catch{
   if(request!==requestNumber)return;root.querySelector('.guestbook-total').textContent=t('暂时无法读取留言。');
   if(!root.querySelector('.guestbook-load-error')){const p=document.createElement('p');p.className='guestbook-load-error';p.setAttribute('role','alert');p.textContent=t('连接未成功，请点击“刷新”重试。');root.querySelector('.guestbook-feed').append(p);}
   if(!messages.length)root.querySelector('.guestbook-messages').replaceChildren();
  }finally{if(request===requestNumber){loading=false;updateBusy();}}
 }
 async function submit(event){
  event.preventDefault();if(sending)return;statusError=true;
  if(count(nickname)<1||count(nickname)>24||/[\r\n\t]/u.test(nickname)){status=ERRORS.invalid_nickname;renderStatus();return;}
  if(count(message)<1||count(message)>1000){status=ERRORS.invalid_message;renderStatus();return;}
  sending=true;status='';renderStatus();updateBusy();
  try{
   const response=await fetch('api/guestbook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({avatar,nickname,message}),signal:AbortSignal.timeout(20000)});
   const data=await response.json();if(!response.ok){status=ERRORS[data.error]||'发布失败，请保留内容并稍后重试。';renderStatus();return;}
   const posted=data.message;if(!posted?.id)throw Error('invalid_response');
   // Keep the acknowledgement visible even if a refresh is already in flight.
   requestNumber++;loading=false;messages=[posted,...messages.filter(m=>m.id!==posted.id)];total++;loaded=true;message='';root.querySelector('[name=message]').value='';updateLength();renderMessages();status='留言已发布，谢谢你的分享！';statusError=false;renderStatus();await load(false);
  }catch{status='未能确认发布结果，请先刷新留言列表，避免重复发布。';statusError=true;renderStatus();}
  finally{sending=false;updateBusy();}
 }
 return {render,refresh:()=>load(false),setLocale(next){locale=next;if(root.childElementCount)render();}};
}
