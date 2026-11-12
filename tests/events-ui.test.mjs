import test from 'node:test';
import assert from 'node:assert/strict';
import {createEventsPage} from '../dist/events-page.js';

// A render sink exercises the page controller without requiring a browser or
// external DOM package. Layout and browser-native <details> stay in visual QA.
class RenderSink {
 constructor(){this.html='';this.handlers={};this.nodes=new Map();this.focused=null;this.scrolled=null;}
 set innerHTML(html){this.html=html;this.nodes.clear();}
 get innerHTML(){return this.html;}
 addEventListener(type,handler){this.handlers[type]=handler;}
 querySelectorAll(){return [];}
 querySelector(selector){
  if(selector.startsWith('#event-')&&!['#event-count','#event-selection','#event-results','#event-search','#event-access'].includes(selector)){
   const id=selector.slice(1),markup=this.nodes.get('#event-results')?.innerHTML||'';
   if(!markup.includes(`id="${id}"`))return null;
   if(!this.nodes.has(selector)){
    const guide={open:false};this.nodes.set(selector,{guide,querySelector:()=>guide,focus:()=>{this.focused=id;},scrollIntoView:()=>{this.scrolled=id;}});
   }
  }
  if(!this.nodes.has(selector))this.nodes.set(selector,{innerHTML:'',textContent:'',value:'',scrollIntoView:()=>{this.scrolled=selector;}});
  return this.nodes.get(selector);
 }
 click(dataset){const button={dataset,hasAttribute:name=>Object.hasOwn(dataset,name.replace(/^data-/, '').replace(/-([a-z])/g,(_,x)=>x.toUpperCase()))};this.handlers.click({target:{closest:()=>button}});}
 input(value){this.handlers.input({target:{id:'event-search',value}});}
 access(value){this.handlers.change({target:{id:'event-access',value}});}
 get cards(){return this.querySelector('#event-results').innerHTML;}
}

const fixture={
 checked:'2026-11-12',scope:'Scope',excluded:[],sources:[],activeEvents:[],
 categories:[{id:'a',name:'Country A',kind:'国家／地区',description:'A',region:'map-a'},{id:'b',name:'Country B',kind:'国家／地区',description:'B',region:'map-b'}],
 lines:[{id:'official',title:'Official cycle',official:true},{id:'supplement',title:'Supplement',official:false}],
 events:[
  {id:'first',title:'First story',primary:'a',related:[],line:'official',lineTitle:'Official cycle',order:0,summary:'First premise',synopsis:['First guide.','Other guide.'],characters:['Hero <&"'],stageAvailable:true,firstStart:1,storyCount:2,basis:'Sources agree',sources:[]},
  {id:'next',title:'Next story',primary:'b',related:['a'],line:'official',lineTitle:'Official cycle',order:1,summary:'Second premise',synopsis:['An Étoile arrives.','Other guide.'],characters:['Second hero'],stageAvailable:false,firstStart:1,storyCount:2,basis:'Sources agree',sources:[]},
  {id:'extra',title:'Extra story',primary:'b',related:[],line:'supplement',lineTitle:'Supplement',order:0,summary:'Third premise',synopsis:['An additional guide.','Other guide.'],characters:['Third hero'],stageAvailable:true,firstStart:1,storyCount:2,basis:'Sources agree',sources:[]}
 ]
};

async function setup(t){
 const saved=new Map(['document','fetch','matchMedia','CSS'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 Object.assign(globalThis,{document:new EventTarget(),fetch:async()=>({ok:true,json:async()=>structuredClone(fixture)}),matchMedia:()=>({matches:true}),CSS:{escape:value=>value}});
 t.after(()=>{for(const [key,descriptor] of saved)descriptor?Object.defineProperty(globalThis,key,descriptor):delete globalThis[key];});
 const root=new RenderSink(),maps=[];
 await createEventsPage(root,{portrait:()=>'<img src="local-portrait.png">',onRegion:id=>maps.push(id)})();
 return {root,maps};
}
const ids=root=>[...root.cards.matchAll(/<article class="event-card" id="event-([^"]+)"/g)].map(match=>match[1]);

test('event controller combines affiliation, access and Unicode text filters, and reset restores the catalogue',async t=>{
 const {root}=await setup(t);
 assert.deepEqual(ids(root),['first','next','extra']);
 root.click({eventCategory:'a'});assert.deepEqual(ids(root),['first','next'],'related-country stories remain discoverable');
 root.access('story');assert.deepEqual(ids(root),['next'],'only story review is distinct from permanent stages');
 root.input('éTOILE');assert.deepEqual(ids(root),['next'],'search includes guide prose and normalizes case');
 root.input('absent');assert.deepEqual(ids(root),[]);assert.match(root.cards,/没有找到符合条件的故事/);
 root.click({eventReset:''});assert.deepEqual(ids(root),['first','next','extra']);
 assert.equal(root.querySelector('#event-search').value,'');assert.equal(root.querySelector('#event-access').value,'all');
});

test('reading navigation reaches a filtered-out next story and opens its guide; supplements are not presented as a cycle',async t=>{
 const {root}=await setup(t);
 root.click({eventCategory:'a'});root.access('stages');
 assert.deepEqual(ids(root),['first']);
 assert.match(root.cards,/data-event-jump="next"/,'next entry remains reachable even when its access type is filtered out');
 root.click({eventJump:'next'});
 assert.deepEqual(ids(root),['first','next','extra']);
 assert.equal(root.querySelector('#event-next').guide.open,true);
 assert.equal(root.focused,'event-next');assert.equal(root.scrolled,'event-next');
 const extra=root.cards.split('id="event-extra"')[1];
 assert.doesNotMatch(extra,/data-event-jump=/,'unofficial supplemental stories do not invent official reading links');
});

test('character buttons keep escaped canonical identity for the global profile handler and map navigation uses the region callback',async t=>{
 const {root,maps}=await setup(t);
 assert.match(root.cards,/<button data-person="Hero &lt;&amp;&quot;"/);
 assert.match(root.cards,/aria-label="阅读Hero &lt;&amp;&quot;的站内介绍"/);
 assert.doesNotMatch(root.cards,/<a[^>]*data-person=/,'a portrait is an in-site action, not an external biography link');
 const before=root.cards;root.click({person:'Hero <&"'});assert.equal(root.cards,before,'page filtering does not consume profile actions');
 root.click({eventMap:'map-a'});assert.deepEqual(maps,['map-a']);
});
