export const mapFrame={x:0,y:140,width:1200,height:504};
export const baseMaps={
 nations:{label:'诸国地图',path:'assets/terra-official-exploration.jpg',source:'https://wiki.biligame.com/arknights/文件:泰拉地图2.jpg',caption:'官方泰拉地图画面 · BWIKI收录',x:0,y:140,width:1200,height:504},
 terra:{label:'三探泰拉 · 大陆全貌',path:'assets/terra-official-3.png',source:'https://www.bilibili.com/video/BV17W4y1E7hK/',caption:'《三探泰拉》官方PV · 04:09',x:0,y:32,width:1200,height:675}
};
// Hotspots reference the names printed in the official image, not invented borders.
export const nationLabels={columbia:[530,184],bolivar:[295,197],sami:[738,71],kazimierz:[809,163],ursus:[1100,107],victoria:[875,295],leithanien:[1050,223],kazdel:[1320,213],yan:[1530,170],higashi:[1580,79],siracusa:[1180,263],minos:[560,339],kjerag:[712,226],laterano:[1130,342],iberia:[1054,483],sargon:[388,426],rim:[1390,359]};
export function regionPoint(id){const p=nationLabels[id];return p?[p[0]*1200/1830,p[1]*1200/1830+140]:null;}
export const chapterRegions=['ursus','ursus','yan','yan','ursus','yan','yan','ursus','ursus','victoria','victoria','victoria','victoria','victoria','victoria',null,'ursus','ursus'];
export function chapterAnchor(id){return regionPoint(chapterRegions[id])||[600,350];}
