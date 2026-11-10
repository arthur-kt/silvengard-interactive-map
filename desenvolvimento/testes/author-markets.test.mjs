import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEconomy} from '../../app/dist/economy-core.js';
import {createMarkets,atWar} from '../../app/dist/economy-trade.js';
const read=p=>JSON.parse(fs.readFileSync(caminho(p),'utf8'));
const D=read('dist/world.json'),data=read('dist/economy-source.json'),audit=read('market-author-defaults.json');
const model=createEconomy(D,data,D.economyEdits),markets=createMarkets(D,data,model);

test('authored seats and every membership match the supplied Markdown',()=>{
 const text=fs.readFileSync(caminho('Silvengard_Mercados_Atualizado.md'),'utf8');
 const counts={'Asgorath':13,'Alqa':14,'Porto do Álamo':21,'Grenolk':24,'Ros Leones':13,'Khegosla':15,'Allanan':6,'Elucitor':17,'Loueixo':19,'Velaffeld':9};
 assert.equal(markets.regions.length,10);assert.equal(audit.rows.length,152);assert.equal(new Set(audit.rows.map(r=>r.city)).size,152);
 let current=null,seen=0;
 for(const line of text.split(/\r?\n/)){
  const heading=line.match(/^### Mercado de (.+?) \(/);if(heading)current=heading[1];else if(line.startsWith('### Sem mercado'))current=null;
  if(!line.startsWith('|'))continue;const row=line.trim().replace(/^\||\|$/g,'').split('|').map(s=>s.trim());
  if(row.length!==4||['Estado','---'].includes(row[0]))continue;
  const b=D.cities.find(b=>b.name===row[2]&&D.states.find(s=>s.i===b.state)?.name.trim()===row[0]);assert.ok(b,row[2]);
  assert.equal(markets.cityMarket(b)?.center.name??null,current,row[2]);seen++;
 }
 assert.equal(seen,152);
 for(const m of audit.markets){assert.equal(m.cities.length,counts[m.name]);assert.equal(markets.regions.find(r=>r.i===m.i).center.name,m.name);}
});
test('approved economy preserves authored market seats, prices, geography and identities',()=>{
 const before=read('backups/v40-before-approved-economy/dist/economy-source.json'),world=read('backups/v42-before-social-goods/dist/world.json');
 assert.deepEqual(data.markets.map(m=>[m.i,m.centerCity]),before.markets.map(m=>[m.i,m.centerCity]));for(const m of data.markets)for(const id of [4,9])assert.ok(m.prices[id]>0);
 // Pontos criados pelo mestre (id poi-user-*) são acréscimos dele, não canon do autor.
 const canon=p=>!(p&&String(p.id).startsWith('poi-user-'));
 for(const k of ['cells','vertices','geography','defaultProvinceEdits','landmarks','cultures','religions'])assert.deepEqual(k==='landmarks'?D[k].filter(canon):D[k],k==='landmarks'?world[k].filter(canon):world[k],k);
 for(const b of D.cities)for(const k of ['name','culture','faith','emblem','x','y','state','magicSchool','dwarvenFortress','majorPort'])assert.deepEqual(b[k],world.cities.find(n=>n.i===b.i)[k],b.name+' '+k);
});
test('uninhabited Nilhelm remains assigned without production and Valar has no market',()=>{
 const nilhelm=D.cities.find(b=>b.name==='Nilhelm'),valar=D.cities.find(b=>b.state===17);
 assert.equal(markets.cityMarket(nilhelm).center.name,'Asgorath');assert.equal(nilhelm.demographics.population,0);
 assert.equal(model.city(nilhelm).production.size,0);assert.equal(markets.cityMarket(valar),undefined);
});
test('sharing a market does not override war or create a political merger',()=>{
 assert.equal(markets.cityMarket(D.cities.find(b=>b.i===22)).i,markets.cityMarket(D.cities.find(b=>b.i===30)).i);
 assert.equal(atWar(D,{diplomacy:{'20:47':'War'}},20,47),true);
 assert.equal(D.cities.find(b=>b.i===22).state,20);assert.equal(D.cities.find(b=>b.i===30).state,47);
});
test('latest seat changes and all requested transfers are preserved',()=>{
 const expected={96:'Velaffeld',77:'Velaffeld',220:'Velaffeld',61:'Allanan',4002:'Allanan',4003:'Alqa',24:'Elucitor',62:'Ros Leones',2001:'Ros Leones',119:'Khegosla',159:'Grenolk',202:'Allanan',1239:'Ros Leones',184:'Alqa',134:'Alqa',120:'Alqa'};
 for(const [id,name] of Object.entries(expected))assert.equal(markets.cityMarket(D.cities.find(b=>b.i===+id)).center.name,name,id);
 assert.equal(markets.regions.find(m=>m.i===8).center.i,36);
 assert.equal(markets.regions.find(m=>m.i===9).center.i,61);
 assert.equal(markets.cityMarket(D.cities.find(b=>b.name==='Arenor')).center.name,'Ros Leones');
});
