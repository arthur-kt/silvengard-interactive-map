import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRouter} from '../../app/dist/travel-core.js';
import {simplify} from '../../app/dist/network-core.js';
import {routeReport} from '../../app/dist/route-info.js';
const main=fileURLToPath(new URL('../',import.meta.url));
for(const base of [main,path.join(path.dirname(main),'silvengard-atlas v2')]){
 const file=path.join(base,'dist/world.json'),D=JSON.parse(fs.readFileSync(file)),towns=new Map(D.cities.map(b=>[b.i,b]));
 if(D.economicReview.routesApplied)continue;
 const router=createRouter({...D,cells:D.cells.map(c=>[0,17].includes(c.state)&&c.h>=20?{...c,h:10}:c)}),fixes=[];
 for(const r of D.routes){
  const before=routeReport(D,r),ids=[...new Set([r.fromCity,...(r.stops||before.stops.map(s=>s.id)),r.toCity].filter(i=>towns.has(i)&&towns.get(i).demographics.population>0))];
  if(ids.length<2){r.tradeUse=false;r.routeClass='local-path';r.majorRoute=false;r.stops=ids;r.stopMode='explicit';fixes.push({id:r.id,action:'Caminho interno preservado, sem ligação comercial fictícia.'});continue;}
  if(before.stops.length<2&&r.kind==='road'&&r.fromCity!==r.toCity){
   const a=towns.get(r.fromCity),b=towns.get(r.toCity);if(a&&b){const points=router.trace([[a.x,a.y],[b.x,b.y]],'road');r.points=points;r.controls=simplify(points,2);fixes.push({id:r.id,action:'Ancoragens reparadas até as cidades reais.'});}
  }
  r.stops=ids;r.stopMode='explicit';r.tradeUse=true;
  if(r.kind==='sea'&&before.km<260)r.majorRoute=false;
 }
 function add(id,name,ids,kind='road'){
  if(D.routes.some(r=>r.id===id))return;
  const cities=ids.map(i=>towns.get(i));if(cities.some(b=>!b||!b.demographics.population))throw Error('Invalid corridor city '+id);
  const controls=cities.map(b=>kind==='sea'?b.harbor?.waterPoint:[b.x,b.y]);if(controls.some(p=>!p))return;
  const points=router.trace(controls,kind);D.routes.push({id,name,kind,group:kind==='sea'?'searoutes':'roads',majorRoute:true,enabled:true,points,controls:simplify(points,2),fromCity:ids[0],toCity:ids.at(-1),stops:ids,stopMode:'explicit',tradeUse:true,authorConnection:true,stateIds:[...new Set(cities.map(b=>b.state))]});fixes.push({id,action:'Corredor de abastecimento registrado.'});
 }
 add('review-amestris','Caminho das Caravanas de Amestris',[9,12,183]);
 add('review-veniun','Caminho das Guildas',[184,134,4003,6]);
 add('review-metals','Rota das Forjas',[238,127,214,9,36,45]);
 add('review-dragonfall-supply','Caminho do Abastecimento do Norte',[4,3,23,10,120]);
 add('review-horse-fairs','Caminho das Feiras e Cavalos',[179,140,143,36]);
 add('review-allanan-sahtalys','Travessia de Sahtalys',[61,4002],'sea');
 add('review-sarandir','Travessia Vulcânica',[18,10002,33],'sea');
 D.tradeCorridors=[{name:'Academias do Mar',cities:[226,168],goods:[49,50,51,77],useExistingRoutes:true},{name:'Portos Livres',cities:[224,56,30],goods:[9,11,48,53,64],voluntary:true},{name:'Salões e Forjas',cities:[238,127,214,9,36,45],goods:[4,5,6,7,8,58,76]}];
 D.economicReview.routesApplied=true;D.economicReview.routeChanges=fixes;D.activeWars=[[20,49],[20,47],[20,31]];
 fs.writeFileSync(file,JSON.stringify(D));fs.writeFileSync(path.join(base,'revisao-rotas-aplicadas.json'),JSON.stringify(fixes,null,2));console.log(JSON.stringify({base,routes:D.routes.length,fixes}));
}
