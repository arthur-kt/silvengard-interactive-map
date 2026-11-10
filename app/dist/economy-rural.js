import {applyMarketTerritories} from './market-territories.js?v=43.1';
import {residentPopulation,economicPopulation,landDensity} from './economy-society.js?v=43.1';
import {createRouter} from './travel-core.js?v=24';
// One territorial assignment, shared by accounts, scarcity, maps and quotations.
export function ruralAllocation(D,data,provinces,provinceAt,model){
 const active=D.cities.filter(b=>residentPopulation(b)>0&&![0,17].includes(b.state)),field=new Uint16Array(D.cells.length),valid=new Set((data.markets||[]).map(m=>m.i));
 const nearest=(p,filter=()=>true)=>{let best=null,dist=Infinity;for(const b of active){if(!filter(b))continue;const d=(p[0]-b.x)**2+(p[1]-b.y)**2;if(d<dist||d===dist&&b.i<best.i){dist=d;best=b;}}return best;};
 for(const c of D.cells){if(c.h<20||[0,17].includes(c.state))continue;const b=nearest(c.p);field[c.i]=data.cityMarkets[b?.i]||0;}
 applyMarketTerritories(D,field,data.authorMarketDefaults?.territories,valid,provinceAt);
 for(const b of active)field[b.cell]=data.cityMarkets[b.i]||0;
 const components=new Int32Array(D.cells.length).fill(-1);let part=0;for(const c of D.cells){if(c.h<20||[0,17].includes(c.state)||components[c.i]>=0)continue;const queue=[c.i];components[c.i]=part;for(let j=0;j<queue.length;j++)for(const id of D.cells[queue[j]].c||[])if(D.cells[id].h>=20&&![0,17].includes(D.cells[id].state)&&components[id]<0){components[id]=part;queue.push(id);}part++;}
 const groups=new Map(),reports=new Map(provinces.map(p=>[p.i,model.provinceBase(p.i,provinceAt)]));
 function group(c,p){const market=field[c.i];if(!market||p.state===17||reports.get(p.i)?.cities.some(b=>b.i===2001))return null;const key=p.i+':'+market+':'+components[c.i],same=b=>components[b.cell]===components[c.i]&&data.cityMarkets[b.i]===market;if(!groups.has(key)){const hub=nearest(c.p,b=>same(b)&&provinceAt(b.cell)?.i===p.i)||nearest(c.p,b=>same(b)&&b.state===p.state)||nearest(c.p,same);if(!hub)return null;groups.set(key,{province:p,market,component:components[c.i],hub:'city:'+hub.i,cityReference:{...hub,x:c.p[0],y:c.p[1],state:p.state},state:p.state,population:0,rural:new Map(),ruralSites:0});}return groups.get(key);}
 const areaScale=(D.settings?.distanceScale||1)**2,urbanCells=new Set(D.cities.map(b=>b.cell));
 for(const c of D.cells){const density=data.calibration?.populationScope==='city-and-hinterland'?0:landDensity(c);if(!density||urbanCells.has(c.i))continue;const p=provinceAt(c.i);if(!p)continue;const row=group(c,p);if(row){const people=density*(c.area||D.grid.stepX*D.grid.stepY)*areaScale;row.population+=people;if(c.h<45&&[3,4,5,6,7,8].includes(c.biome))row.subsistencePeople=(row.subsistencePeople||0)+people;}}
 for(const site of data.ruralSites){const p=provinceAt(site.cell),c=D.cells[site.cell];if(!p||!model.eligible(c,site.goodId))continue;const row=group(c,p);if(row){row.rural.set(site.goodId,(row.rural.get(site.goodId)||0)+site.units*model.edits.ruralScale*model.edits.cycleDays/data.baseCycleDays);row.ruralSites++;}}
 const router=createRouter({...D,cells:D.cells.map(c=>[0,17].includes(c.state)?{...c,h:10}:c)});
 const seen=new Set();for(const row of groups.values()){row.id=seen.has(row.province.i)?'rural:'+row.province.i+':'+row.market+':'+row.component:'province:'+row.province.i;seen.add(row.province.i);const hub=active.find(b=>'city:'+b.i===row.hub);try{const points=router.trace([[row.cityReference.x,row.cityReference.y],[hub.x,hub.y]],'road');row.connection={km:points.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-points[i][0],p[1]-points[i][1])*D.settings.distanceScale,0),states:[...new Set(points.map(p=>router.nearest(p).state))]};}catch{row.connection=null;row.hub=null;}row.population=Math.round(row.population);row.subsistence=0;if(data.calibration?.ruralSubsistence){const need=(row.subsistencePeople||0)/1000*model.edits.foodPer1000*model.edits.cycleDays/30*.85,existing=[...row.rural].reduce((n,[g,q])=>n+q*(model.goods.get(g)?.demandCoverage?.food||0),0);row.subsistence=Math.max(0,need-existing);if(row.subsistence)row.rural.set(9,(row.rural.get(9)||0)+row.subsistence);}row.report={rural:row.rural,production:row.rural,inputs:new Map(),jobs:[],ruralSites:row.ruralSites,cities:reports.get(row.province.i).cities};}
 return {field,groups:[...groups.values()],reports};
}
export function economicNodes(D,data,model,provinces,provinceAt){
 const nodes=new Map();for(const b of D.cities)if(residentPopulation(b)>0&&![0,17].includes(b.state))nodes.set('city:'+b.i,{id:'city:'+b.i,state:b.state,city:b,population:economicPopulation(b),report:model.city?.(b)||{production:new Map(),inputs:new Map()}});
 if(provinces.length){for(const row of model.ruralAccounts(provinceAt))if(provinces.some(p=>p.i===row.province.i))nodes.set(row.id,{...row,report:{...row.report}});}return nodes;
}
