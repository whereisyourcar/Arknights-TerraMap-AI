import {regionPoint as officialPoint,baseMaps as originals} from './atlas.js';
export const baseMaps={painted:{label:'地理绘卷',path:'assets/terra-painted-v3.png',source:'art-provenance.json',caption:'依《初探泰拉》相对布局绘制 · 非官方地理示意',x:0,y:90,width:1200,height:504},nations:{...originals.nations,label:'初探原图',y:90},terra:{...originals.terra,label:'三探原图'}};
export const regionPoint=id=>{const p=officialPoint(id);return p?[p[0],p[1]-50]:null;};
// Compatibility list: only sourced relative-region anchors. See city-geography.json for uncertainty and index labels.
export const citySeeds=[
 [
  "切尔诺伯格",
  null,
  840,
  180
 ],
 [
  "龙门",
  null,
  925,
  188
 ],
 [
  "玉门",
  null,
  965,
  162
 ],
 [
  "尚蜀",
  null,
  1015,
  242
 ],
 [
  "汐斯塔",
  null,
  610,
  358
 ],
 [
  "阿卡胡拉",
  null,
  405,
  395
 ],
 [
  "格兰法洛",
  null,
  693,
  494
 ]
];
export const specialPoints={aegir:[1000,555],durin:[460,560]};
export const removedCityAliases=new Set(['特雷蒙']);
