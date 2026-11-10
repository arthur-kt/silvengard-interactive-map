export function applyMarketTerritories(D,field,features,marketIds,provinceAt){
 const corridors=(features?.corridors||[]).map(c=>({...c,a:D.cities.find(b=>b.i===c.fromCity),b:D.cities.find(b=>b.i===c.toCity)})).filter(c=>c.a&&c.b&&marketIds.has(c.market)&&c.radius>0);
 for(const cell of D.cells){
  if(features?.excludedStates?.includes(cell.state)){field[cell.i]=0;continue;}
  if(cell.h<20||cell.state===17)continue;
  const wholeState=features?.stateMarkets?.[cell.state];
  if(marketIds.has(wholeState)){field[cell.i]=wholeState;continue;}
  for(const c of corridors){
   if(cell.state!==c.state||c.excludeProvinces?.includes(provinceAt(cell.i)?.i))continue;
   const dx=c.b.x-c.a.x,dy=c.b.y-c.a.y,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((cell.p[0]-c.a.x)*dx+(cell.p[1]-c.a.y)*dy)/length)):0;
   if((cell.p[0]-c.a.x-dx*t)**2+(cell.p[1]-c.a.y-dy*t)**2<=c.radius*c.radius)field[cell.i]=c.market;
  }
 }
}
