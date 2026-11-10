export function mixedParts(D,points){
 const g=D.grid,cell=p=>D.cells[Math.max(0,Math.min(g.rows-1,Math.floor(p[1]/g.stepY)))*g.columns+Math.max(0,Math.min(g.columns-1,Math.floor(p[0]/g.stepX)))];
 const parts=[];for(let i=1;i<points.length;i++){
  const a=points[i-1].slice(0,2),b=points[i].slice(0,2);if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8)continue;
  const kind=cell(a).h<20||cell(b).h<20?'sea':'road',last=parts.at(-1);
  if(last?.kind===kind)last.points.push(b);else parts.push({kind,points:[a,b]});
 }return parts;
}
export function flattenParts(parts){return parts.flatMap((p,i)=>i?p.points.slice(1):p.points);}
export function routePieces(route){return route.kind==='mixed'?(route.parts||[]):[{kind:route.kind==='sea'?'sea':'road',points:route.points}];}
