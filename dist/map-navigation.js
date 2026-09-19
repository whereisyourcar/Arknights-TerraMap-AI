import {baseMaps,regionPoint} from './atlas-v3.js';
export const storyWorld=baseMaps.painted;
export const overview={x:600,y:342,scale:1};
export const overviewCamera=height=>({...overview,scale:Math.max(.01,Math.min(1,(Math.max(1,height)-30)/504))});
// Navigation anchors refer to the official initial-exploration image's regional labels.
// These are regional reading anchors, never surveyed city coordinates.
const chapterRegion=['ursus','ursus','yan','yan','ursus','yan','yan','ursus','ursus','victoria','victoria','victoria','victoria','victoria','victoria',null,'ursus','ursus'];
let cityPoints=new Map();
export function configureDestinations(geography){cityPoints=new Map(geography.cities.filter(c=>c.point).map(c=>[c.name,c.point]));}
export function destination(id){const region=chapterRegion[id],city=id<=1||[4,7,8].includes(id)?'切尔诺伯格':[2,3,5,6].includes(id)?'龙门':id===9?'小丘郡':id>=10&&id<=14?'伦蒂尼姆':null;return region?{region,city,point:cityPoints.get(city)||regionPoint(region)}:null;}
export const sceneSize=.14;
export function sceneTransform(point,width=1200,height=740){return `translate(${point[0]} ${point[1]}) scale(${sceneSize}) translate(${-width/2} ${-height/2})`;}
export function focusCamera(id,viewportHeight,compact=false){const d=destination(id);if(!d)return {...overview};const width=compact?720:1200;return {x:d.point[0],y:d.point[1],scale:1200/((width+36)*sceneSize)};}
export function interpolateCamera(start,end,t){const e=t*t*(3-2*t);return {x:start.x+(end.x-start.x)*e,y:start.y+(end.y-start.y)*e,scale:Math.exp(Math.log(start.scale)+(Math.log(end.scale)-Math.log(start.scale))*e)};}
