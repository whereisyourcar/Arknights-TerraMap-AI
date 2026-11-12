// Labels may move to avoid translated text collisions; geographic anchors never move.
export function labelWidth(text,size=12){return [...text].reduce((n,c)=>n+(/[\u2e80-\u9fff\u3040-\u30ff]/u.test(c)?size:size*.62),0)+8;}
export function placeCityLabels(items,obstacles=[]){
 const used=[...obstacles];
 const overlaps=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 const positions=new Map();
 for(const item of [...items].sort((a,b)=>labelWidth(b.label)-labelWidth(a.label))){
  const width=labelWidth(item.label),height=19,candidates=[];
  for(const dy of [0,-20,20,-40,40,-60,60,-80,80,-100,100])for(const side of [1,-1])for(const extra of [0,18,36]){
   const x=Math.min(1180-width,Math.max(12,item.point[0]+(side===1?12+extra:-width-12-extra))),y=Math.min(585,Math.max(96,item.point[1]-11+dy));
   const box={x,y,width,height};const distance=Math.abs(dy)+extra+(side===-1?5:0);candidates.push({...box,score:used.reduce((n,b)=>n+overlaps(box,b),0)*1000+distance});
  }
  candidates.sort((a,b)=>a.score-b.score);const chosen=candidates[0];used.push(chosen);
  positions.set(item,{...item,box:chosen,x:chosen.x+4,y:chosen.y+14});
 }
 return items.map(item=>positions.get(item));
}
