export const inhabitants=(D,b)=>b.demographics?.populationKnown===false?0:Math.max(0,b.demographics?.population??Math.round((b.population||0)*D.settings.populationRate*D.settings.urbanization));
// City counts are known; surrounding heat is an illustration, not a rural census.
export function populationField(D){
 const field=new Float32Array(D.cells.length),component=new Int32Array(D.cells.length);let group=0;
 for(const c of D.cells){if(c.h<20||component[c.i])continue;group++;const queue=[c.i];component[c.i]=group;for(let j=0;j<queue.length;j++)for(const n of D.cells[queue[j]].c)if(D.cells[n].h>=20&&!component[n]){component[n]=group;queue.push(n);}}
 const g=D.grid;let max=0;
 for(const b of D.cities.filter(b=>b.visible&&!b.excluded)){const count=inhabitants(D,b);max=Math.max(max,count);if(!count)continue;const radius=48,sigma=15;
  for(let y=Math.max(0,Math.floor((b.y-radius)/g.stepY));y<=Math.min(g.rows-1,Math.floor((b.y+radius)/g.stepY));y++)for(let x=Math.max(0,Math.floor((b.x-radius)/g.stepX));x<=Math.min(g.columns-1,Math.floor((b.x+radius)/g.stepX));x++){
   const c=D.cells[y*g.columns+x];if(!component[c.i]||component[c.i]!==component[b.cell])continue;const d=Math.hypot(c.p[0]-b.x,c.p[1]-b.y);if(d>radius)continue;field[c.i]=Math.max(field[c.i],count*Math.exp(-d*d/(2*sigma*sigma)));
  }
 }return {field,max};
}
export function populationColor(value,max){
 const t=max>0?Math.min(1,Math.log1p(value)/Math.log1p(max)):0;
 const stops=[[.77,.81,.73],[.99,.89,.58],[.96,.49,.25],[.65,.06,.09]],n=t*3,i=Math.min(2,Math.floor(n)),f=n-i;
 return stops[i].map((v,j)=>v+(stops[i+1][j]-v)*f);
}
