// Smoke test sem navegador, usando DOM/API mínima para verificar rendering/refresh.
import assert from 'node:assert/strict';
import {createCampaigns} from '../../app/dist/campaigns.js';

class Node {
  constructor(tag) {this.tag=tag;this.hidden=false;this.listeners={};this.innerHTML='';this.style={};}
  setAttribute() {}
  addEventListener(type, fn) {this.listeners[type]=fn;}
  querySelector() {return null;}
}
const nodes=[];
globalThis.document={
  createElement(tag){const element=new Node(tag);nodes.push(element);return element;},
  body:{append(){}},
  addEventListener(){},
};
globalThis.localStorage={getItem(){return null;},setItem(){}};
globalThis.window={confirm(){return true;}};
let rev=1;
let campaign={id:'campanha-teste',title:'Silvengard',subtitle:'',status:'Em andamento',year:'1277 AQD',region:'Dragonfall',premise:'Em 1277 AQD',summary:'Pela estrada',
  party:{name:'Companhia',journeyPartyId:'grp1',members:[{id:'m1',name:'',sheetId:'char1',role:'Batedor',notes:''}]},
  npcs:[{id:'npc1',name:'Arthur Dragonbane',role:'Rei',affiliation:'Casa Dragonbane',location:'Asgorath',description:'Soberano.'}],
  events:[{id:'evt1',title:'Partida',when:'1277 AQD',session:'Sessão 1',chapter:'',place:'Asgorath',body:'A aventura começa.',type:'event'}],
  _revision:String(rev),createdAt:'2026-11-15T00:00:00Z',updatedAt:'2026-11-15T00:00:00Z'};
let writes=0;
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>structuredClone(body)});
globalThis.fetch=async (url,options={})=>{
  if(url==='/api/campaigns')return response({campaigns:[{id:campaign.id,title:campaign.title,status:campaign.status,year:campaign.year,_revision:campaign._revision,updatedAt:campaign.updatedAt}],errors:[]});
  if(url==='/api/campaigns/campanha-teste'&&(!options.method||options.method==='GET'))return response(campaign);
  if(url==='/api/campaigns/campanha-teste'&&options.method==='PUT'){
    assert.equal(options.headers['If-Match'],String(rev));
    campaign={...JSON.parse(options.body),_revision:String(++rev)};writes++;return response(campaign);
  }
  return response({error:'not found'},404);
};
const journeys={
  getParty(id){return id==='grp1'?{id,name:'Grupo',location:{label:'Asgorath'},showOnMap:true,history:[{name:'Asgorath–Ereth',distance:200,from:'Asgorath',to:'Ereth',date:'2026-11-15T00:00:00Z'}]}:null;},
  listParties(){return [{id:'grp1',name:'Grupo'}];},
};
const chars={listSheets:async()=>[{id:'char1',name:'Lia',level:5,classLine:'Ladina 5',race:{name:'Humana'}}]};
const campaigns=createCampaigns({characters:chars,journeys});
await campaigns.open();
const html=campaigns.panel.innerHTML;
for(const expected of ['Contexto da campanha','Lia','Jornada pelo continente','Arthur Dragonbane','História da campanha','Partida','Asgorath–Ereth']) {
  assert.ok(html.includes(expected),`Faltou seção/dado ${expected}`);
}
// Atualização externa: mudança na revisão força releitura da narrativa.
campaign={...campaign,title:'Campanha alterada fora do Atlas',_revision:String(++rev)};
await campaigns.reload();
assert.ok(campaigns.panel.innerHTML.includes('Campanha alterada fora do Atlas'));
// Ações via delegação de eventos: remoção grava com a revisão vigente.
await campaigns.panel.listeners.click({target:{closest(selector){return selector==='[data-action]'?{dataset:{action:'remove-npc',id:'npc1'}}:null;}}});
assert.equal(writes,1);
assert.equal(campaign.npcs.length,0);
campaigns.close();campaigns.dispose();
console.log('PASS: painel, campanha, fichas, trajetos, NPCs, história, atualização externa e gravação');
