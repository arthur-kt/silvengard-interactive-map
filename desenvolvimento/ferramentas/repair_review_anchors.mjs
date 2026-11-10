import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {routeReport} from '../../app/dist/route-info.js';import {createRouter} from '../../app/dist/travel-core.js';import {simplify} from '../../app/dist/network-core.js';
const root=fileURLToPath(new URL('../',import.meta.url));for(const base of [root,path.join(path.dirname(root),'silvengard-atlas v2')]){
 const file=path.join(base,'dist/world.json'),D=JSON.parse(fs.readFileSync(file)),router=createRouter({...D,cells:D.cells.map(c=>[0,17].includes(c.state)&&c.h>=20?{...c,h:10}:c)});
 for(const r of D.routes.filter(r=>r.kind==='road'&&r.tradeUse!==false)){
  const report=routeReport(D,{...r,stopMode:'explicit'});for(const s of report.stops.filter(s=>s.offset>9)){const b=D.cities.find(b=>b.i===s.id);if(r.fromCity===s.id){r.points=[...router.trace([[b.x,b.y],r.points[0]],'road').slice(0,-1),...r.points];}else if(r.toCity===s.id){r.points=[...r.points,...router.trace([r.points.at(-1),[b.x,b.y]],'road').slice(1)];}else throw Error('Unanchored intermediate call '+r.id);r.controls=simplify(r.points,2);r.authorConnection=true;r.authorModified=true;D.economicReview.routeChanges.push({id:r.id,action:'Acesso reparado para '+b.name});}
 }
 fs.writeFileSync(file,JSON.stringify(D));
}
