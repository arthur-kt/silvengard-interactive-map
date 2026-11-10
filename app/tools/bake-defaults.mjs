import fs from 'node:fs';
import crypto from 'node:crypto';
import {cleanCityEdit,applyCityEdit} from '../dist/city-editor-core.js?v=24';
import {newCity,planCityDeletion,repairCapitals} from '../dist/city-lifecycle.js?v=24';
import {cleanNetwork} from '../dist/network-core.js?v=24';
import {validateMapEdits} from '../dist/editor-core.js';
import {cleanJourneys} from '../dist/travel-core.js?v=24';
import {cleanProvinceEdits} from '../dist/province-core.js';
import {applyLandmarkEdits} from '../dist/landmark-core.js';
import {applyEconomicDiplomacy} from '../dist/economy-trade.js';
import {cleanEconomyEdits} from '../dist/economy-core.js';
import {cleanEconomyState} from '../dist/economy-simulation.js';

export function bakeEdition(world,edition){
 const D=structuredClone(world);
 if(edition?.format!=='silvengard-atlas-v1'||!edition.edits?.cities||!edition.edits?.states)throw Error('Edição do Atlas inválida.');
 const patches=edition.mapEdits?validateMapEdits(edition.mapEdits,D).cells:[];
 for(const p of patches){const {i,...values}=p;Object.assign(D.cells[i],values);}
 D.defaultCityArchive??={};
 for(const [key,raw]of Object.entries(edition.edits.cities)){
  const id=Number(key);if(!Number.isSafeInteger(id)||!raw||typeof raw!=='object')throw Error('Ficha inválida.');
  const edit=cleanCityEdit(raw,D);let b=D.cities.find(b=>b.i===id);
  if(!b&&raw.deleted)continue;
  if(!b&&D.defaultCityArchive[id]){b=structuredClone(D.defaultCityArchive[id].city);D.cities.push(b);}
  if(!b&&raw.created){b=newCity(D,id,raw);D.cities.push(b);}
  if(!b){if(raw.visible===false)continue;throw Error('Cidade desconhecida: '+key);}
  const before=structuredClone(b);applyCityEdit(b,edit,D);
  if(typeof raw.name==='string'&&raw.name.trim()){if(raw.name.length>100)throw Error('Nome muito longo.');if(b.name!==raw.name.trim())b.aliases=[...new Set([...(b.aliases||[]),b.name])];b.name=raw.name.trim();}
  if(typeof raw.notes==='string')b.notes=raw.notes.slice(0,20000);
  if(raw.deleted){
   const plan=planCityDeletion(D,id);D.defaultCityArchive[id]={city:before,edit:{...raw,restoreRoutes:raw.restoreRoutes||D.routes.filter(r=>plan.routes.find(n=>n.id===r.id)!==r)}};
   D.cities=plan.cities;D.routes=plan.routes;
  }else delete D.defaultCityArchive[id];
 }
 for(const b of D.cities)b.state=D.cells[b.cell].state;
 for(const [id,e]of Object.entries(edition.edits.states)){
  const s=D.states.find(s=>s.i===+id);if(!s)continue;
  for(const k of ['name','notes','ruler','dynasty','history'])if(typeof e[k]==='string')s[k]=e[k].slice(0,['notes','history'].includes(k)?20000:150);
  if(s.government){if(typeof e.ruler==='string')s.government.ruler=e.ruler;if(typeof e.dynasty==='string')s.government.dynasty=e.dynasty;}
 }
 if(edition.networkEdits){
  const clean=cleanNetwork(edition.networkEdits,D),over=new Map(clean.routes.map(r=>[r.id,r])),deleted=new Set(clean.deleted);
  D.routes=D.routes.filter(r=>!deleted.has(r.id)).map(r=>over.has(r.id)?{...r,...over.get(r.id),authorModified:true,...(r.kind==='road'?{authorConnection:true}:{})}:r);
  for(const r of clean.routes)if(!D.routes.some(n=>n.id===r.id))D.routes.push({...r,authorModified:true,...(r.kind==='road'?{authorConnection:true}:{})});
 }
 repairCapitals(D);
 if(patches.length)for(const s of D.states){const cs=D.cells.filter(c=>c.h>=20&&c.state===s.i);s.area=cs.reduce((n,c)=>n+c.area,0);if(cs.length&&(!s.pole||D.cells[Math.floor(s.pole[1]/D.grid.stepY)*D.grid.columns+Math.floor(s.pole[0]/D.grid.stepX)].state!==s.i))s.pole=cs[Math.floor(cs.length/2)].p;}
 if(edition.journeys&&(!D.savedDefaults||edition.includeJourneysAsDefault===true))D.defaultJourneys=cleanJourneys(edition.journeys);
 if(edition.provinceEdits){const proposal=JSON.parse(fs.readFileSync(new URL('../dist/province-proposal.json',import.meta.url),'utf8'));D.defaultProvinceEdits=cleanProvinceEdits(edition.provinceEdits,D,proposal);}
 if(edition.landmarkEdits)Object.assign(D,applyLandmarkEdits(D,edition.landmarkEdits));
 if(edition.economyEdits){const data=JSON.parse(fs.readFileSync(new URL('../dist/economy-source.json',import.meta.url),'utf8'));D.economyEdits=cleanEconomyEdits(edition.economyEdits,D,data);applyEconomicDiplomacy(D,D.economyEdits);}
 if(edition.economyState){const data=JSON.parse(fs.readFileSync(new URL('../dist/economy-source.json',import.meta.url),'utf8'));D.economyState=cleanEconomyState(edition.economyState,data);}
 D.networkDefaults.majorPorts=D.cities.filter(b=>b.majorPort).map(b=>b.i).sort((a,b)=>a-b);
 D.networkDefaults.localPaths=D.routes.filter(r=>r.kind==='road'&&r.majorRoute===false).length;
 D.citySelection.cities=D.cities.length;
 const id=crypto.createHash('sha256').update(JSON.stringify(edition)).digest('hex');
 const prior=D.authorAtlasDefaults||{};
 D.authorAtlasDefaults={...prior,id,acceptedEdits:edition.edits,acceptedEditHistory:[...(prior.acceptedEditHistory||[prior.acceptedEdits].filter(Boolean)),edition.edits]};
 D.savedDefaults={id,savedAt:edition.exportedAt||'',version:24};
 return D;
}
if(process.argv[2]){
 const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));let world=input.world;
 for(const edition of input.editions)world=bakeEdition(world,edition);
 fs.writeFileSync(process.argv[3],JSON.stringify(world));
}
