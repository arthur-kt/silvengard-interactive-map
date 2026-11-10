import fs from 'node:fs';
import {simplify} from '../../app/dist/network-core.js';
export function buildSwapEdition(W){
 const vir=W.cities.find(b=>b.name==='Vir'&&b.state===47),lirion=W.cities.find(b=>b.name==='Lirion'&&b.state===47);if(!vir||!lirion)throw Error('Vir e Lirion não encontradas em Vitravion.');
 const swap=id=>id===vir.i?lirion.i:id===lirion.i?vir.i:id;
 const routes=W.routes.filter(r=>[r.fromCity,r.toCity,...(r.stops||[])].some(i=>i===vir.i||i===lirion.i)).map(r=>({...r,fromCity:swap(r.fromCity),toCity:swap(r.toCity),stops:r.stops?.map(swap)||[],name:r.name.replace(/\b(Vir|Lirion)\b/g,n=>n==='Vir'?'Lirion':'Vir'),controls:r.controls||simplify(r.points,3)}));
 return {format:'silvengard-atlas-v1',exportedAt:new Date().toISOString(),edits:{cities:{[vir.i]:{position:[lirion.x,lirion.y],settlementClass:'Forte élfico',features:{citadel:true,walls:true}},[lirion.i]:{position:[vir.x,vir.y],settlementClass:'Cidade',features:{citadel:false,walls:false}}},states:{}},networkEdits:{format:'silvengard-network-v1',baseVersion:W.networkDefaults.version,routes,deleted:[]}};
}
if(process.argv[2]==='--prepare'){
 const base=new URL('../',import.meta.url),W=JSON.parse(fs.readFileSync(new URL('dist/world.json',base))),edition=buildSwapEdition(W);
 fs.writeFileSync(new URL('backups/v27-vitravion-swap-edition.json',base),JSON.stringify({baseId:W.savedDefaults.id,edition,beforeCities:W.cities.filter(b=>['Vir','Lirion'].includes(b.name)&&b.state===47)}));
 console.log('Prepared: Vir ↔ Lirion, fortress flags and '+edition.networkEdits.routes.length+' road connections.');
}
