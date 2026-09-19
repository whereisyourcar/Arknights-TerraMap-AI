const counter=document.querySelector('#visitor-counter');
if(counter){
 try{
  const response=await fetch('api/visits',{method:'POST',credentials:'same-origin'});
  if(!response.ok)throw Error('Unavailable');
  const data=await response.json();
  if(!Number.isSafeInteger(data.visitors)||!Number.isSafeInteger(data.visits))throw Error('Invalid counts');
  counter.textContent=`访客 ${data.visitors.toLocaleString('zh-CN')} · 访问 ${data.visits.toLocaleString('zh-CN')}`;
  counter.title='匿名浏览器累计数；同一浏览器30分钟内连续访问算一次。清除Cookie或换设备会重新计数，不记录IP。';
 }catch{counter.textContent='访问统计暂不可用';}
}
