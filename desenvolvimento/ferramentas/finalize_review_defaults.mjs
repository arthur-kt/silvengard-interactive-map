import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {routeReport} from '../../app/dist/route-info.js';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const base of [root,path.join(path.dirname(root),'silvengard-atlas v2')]){
 const read=p=>JSON.parse(fs.readFileSync(path.join(base,p))),write=(p,d)=>fs.writeFileSync(path.join(base,p),JSON.stringify(d));
 const D=read('dist/world.json'),old=read('backups/v40-before-approved-economy/dist/world.json'),source=read('dist/economy-source.json');
 // Named roads keep their intended intermediate calls. Sea calls remain author-selected.
 for(const r of D.routes){const prior=old.routes.find(n=>n.id===r.id);if(r.kind==='road'&&r.majorRoute&&prior&&!prior.stops?.length){r.stops=routeReport(old,{...prior,stopMode:undefined}).stops.map(s=>s.id);r.stopMode='explicit';}}
 D.networkReview={version:40,priorRoutes:old.routes};D.authorAtlasDefaults.id=D.savedDefaults.id;
 const snapshots={cities:{},states:{}};for(const b of old.cities){const now=D.cities.find(n=>n.i===b.i);if(now&&JSON.stringify(now.demographics)!==JSON.stringify(b.demographics))snapshots.cities[b.i]={inhabitants:b.demographics.population};}
 D.authorAtlasDefaults.acceptedEditHistory=[...(D.authorAtlasDefaults.acceptedEditHistory||[]),snapshots];
 D.networkDefaults.localPaths=D.routes.filter(r=>r.kind==='road'&&r.majorRoute===false).length;
 const facts={version:40,demographics:Object.fromEntries(D.cities.filter(b=>snapshots.cities[b.i]).map(b=>[b.i,{population:b.population,demographics:b.demographics,seasonalVisitors:b.seasonalVisitors}])),economyEdits:D.economyEdits,economicReview:D.economicReview,activeWars:D.activeWars,localTradeAgreements:D.localTradeAgreements,routes:D.routes};
 write('economic-review-defaults.json',facts);write('economy-review-source.json',source);write('dist/world.json',D);
 console.log(base+' baseline persisted');
}
