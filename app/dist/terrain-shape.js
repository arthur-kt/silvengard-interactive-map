// Pure geometry helpers (no WebGL): shore distance field and relief shaping.
// Everything here is visual only: it never touches cell data, ids, rivers or routes.
export const SEA_LEVEL=-.05;
const hash=(x,y)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
function vnoise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);const a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
const fbm=(x,y)=>.55*vnoise(x,y)+.3*vnoise(x*2.1+7.3,y*2.1-3.1)+.15*vnoise(x*4.3-5.2,y*4.3+9.7);

function chamfer(seed,cols,rows){const INF=1e9,d=new Float32Array(cols*rows);for(let i=0;i<d.length;i++)d[i]=seed[i]?0:INF;const D=1.4142;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x;let v=d[i];if(x>0)v=Math.min(v,d[i-1]+1);if(y>0){v=Math.min(v,d[i-cols]+1);if(x>0)v=Math.min(v,d[i-cols-1]+D);if(x<cols-1)v=Math.min(v,d[i-cols+1]+D)}d[i]=v}
 for(let y=rows-1;y>=0;y--)for(let x=cols-1;x>=0;x--){const i=y*cols+x;let v=d[i];if(x<cols-1)v=Math.min(v,d[i+1]+1);if(y<rows-1){v=Math.min(v,d[i+cols]+1);if(x<cols-1)v=Math.min(v,d[i+cols+1]+D);if(x>0)v=Math.min(v,d[i+cols-1]+D)}d[i]=v}
 return d}
function blur(a,cols,rows,passes){let src=a,dst=new Float32Array(a.length);for(let p=0;p<passes;p++){for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let s=0,w=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=Math.min(cols-1,Math.max(0,x+dx)),yy=Math.min(rows-1,Math.max(0,y+dy)),k=dx===0&&dy===0?2:1;s+=src[yy*cols+xx]*k;w+=k}dst[y*cols+x]=s/w}[src,dst]=[dst,src]}return src}

// Signed distance to the shore in cell units: positive over water, negative inland.
export function buildShoreField(D){
 const cols=D.grid.columns,rows=D.grid.rows,n=cols*rows,land=new Uint8Array(n),water=new Uint8Array(n);
 for(const c of D.cells){const l=c.h>=20;land[c.i]=l?1:0;water[c.i]=l?0:1}
 const toWater=chamfer(water,cols,rows),toLand=chamfer(land,cols,rows),raw=new Float32Array(n);
 for(let i=0;i<n;i++)raw[i]=land[i]?-(Math.min(toWater[i],12)-.5):Math.min(toLand[i],40)-.5;
 const sd=blur(raw,cols,rows,3),stepX=D.grid.stepX,stepY=D.grid.stepY;
 const data=new Uint8Array(n);for(let i=0;i<n;i++)data[i]=Math.round((Math.max(-8,Math.min(24,sd[i]))+8)/32*255);
 function sample(x,y){const gx=Math.max(0,Math.min(cols-1.001,x/stepX-.5)),gy=Math.max(0,Math.min(rows-1.001,y/stepY-.5)),ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,i=iy*cols+ix;return sd[i]*(1-fx)*(1-fy)+sd[i+1]*fx*(1-fy)+sd[i+cols]*(1-fx)*fy+sd[i+cols+1]*fx*fy}
 return {cols,rows,sd,data,sample,stepX,stepY,width:cols*stepX,height:rows*stepY}
}

// Connected land bodies smaller than this keep their original heights (tiny isles stay put).
function protectedVertices(D,minCells,keepNear){
 const cols=D.grid.columns,rows=D.grid.rows,comp=new Int32Array(D.cells.length).fill(-1),size=[];let id=0;
 for(const c of D.cells){if(c.h<20||comp[c.i]>=0)continue;let n=0;const stack=[c.i];comp[c.i]=id;while(stack.length){const i=stack.pop();n++;const x=i%cols,y=(i/cols)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=cols||yy>=rows)continue;const j=yy*cols+xx;if(comp[j]<0&&D.cells[j].h>=20){comp[j]=id;stack.push(j)}}}size.push(n);id++}
 const keep=new Set();
 for(const c of D.cells){if(c.h<20)continue;if(size[comp[c.i]]<minCells)for(const v of c.v)keep.add(v)}
 for(const [x,y] of keepNear){const col=Math.floor(x/D.grid.stepX),row=Math.floor(y/D.grid.stepY);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=col+dx,yy=row+dy;if(xx<0||yy<0||xx>=cols||yy>=rows)continue;for(const v of D.cells[yy*cols+xx].v)keep.add(v)}}
 return keep
}

// Mutates vertexH: smooths stair-steps, adds organic micro-relief and carves soft beaches
// that follow the smoothed shoreline. Returns stats for verification.
export function shapeRelief({D,vertexH,field,height,keepNear=[]}){
 const northernRange=shapeNorthernRange(D,vertexH);
 const verts=D.vertices,n=verts.length,adj=Array.from({length:n},()=>new Set()),coast=new Uint8Array(n),landCount=new Uint8Array(n),trueH=new Float32Array(n);
 for(const c of D.cells){const l=c.h>=20,hh=l?height(c.h):0;for(const v of c.v){if(l){landCount[v]++;trueH[v]+=hh}}for(let k=0;k<c.v.length;k++){const a=c.v[k],b=c.v[(k+1)%c.v.length];adj[a].add(b);adj[b].add(a)}}
 for(let v=0;v<n;v++){const total=verts[v].c.length;coast[v]=landCount[v]>0&&landCount[v]<total?1:0;if(landCount[v])trueH[v]/=landCount[v]}
 const keep=protectedVertices(D,14,keepNear);
 const base=Float32Array.from(vertexH);
 for(let v=0;v<n;v++)if(coast[v]&&landCount[v])base[v]=trueH[v];
 const interior=v=>landCount[v]>0&&!coast[v]&&!keep.has(v);
 // 1. Laplacian smoothing, gentler on summits so peaks keep their character.
 let cur=Float32Array.from(base);
 for(let it=0;it<2;it++){const next=Float32Array.from(cur);for(let v=0;v<n;v++){if(!interior(v))continue;let s=0,k=0;for(const u of adj[v])if(landCount[u]){s+=cur[u];k++}if(!k)continue;const a=.6*(1-smooth(22,72,cur[v]));next[v]=cur[v]+(s/k-cur[v])*a}cur=next}
 // 2. Organic micro-relief, stronger inland and on slopes.
 for(let v=0;v<n;v++){if(!interior(v)||cur[v]<2)continue;const [x,y]=verts[v].p,amp=(.3+.011*cur[v])*Math.min(1,(cur[v]-2)/6);cur[v]+=(fbm(x*.045,y*.045)-.5)*2*amp*(1-smooth(70,95,cur[v])*.6)}
 // 3. Beaches that follow the smoothed shoreline distance field.
 let lowered=0,raised=0;
 for(let v=0;v<n;v++){
  if(!landCount[v])continue;
  if(keep.has(v)){vertexH[v]=coast[v]?Math.min(vertexH[v],-.2):cur[v];continue}
  const [x,y]=verts[v].p,t=-Math.min(.8,field.sample(x,y)),beach=-.2+1.15*t;
  const w=1-smooth(1,2.2,t);let h=cur[v]*(1-w)+Math.min(cur[v],beach)*w;if(coast[v]&&h<-.2)lowered++;if(coast[v]&&h>-.2)raised++;
  vertexH[v]=Math.max(-.9,h)
 }
 // Grid sampling and smoothing lower a narrow summit. Keep Ask only slightly
 // above the next highest mountain after those operations, rather than a huge dome.
 if(northernRange.changed){
  const isAsk=v=>v.c.some(i=>D.cells[i]?.region==='Ask-Lozard');let askMax=0,otherMax=0;
  for(let i=0;i<n;i++)if(isAsk(verts[i]))askMax=Math.max(askMax,vertexH[i]);else otherMax=Math.max(otherMax,vertexH[i]);
  const target=otherMax*1.035,scale=(target-20)/Math.max(1,askMax-20);
  for(let i=0;i<n;i++)if(isAsk(verts[i])&&vertexH[i]>20)vertexH[i]=20+(vertexH[i]-20)*scale;
  northernRange.finalSummit=target;northernRange.nextHighest=otherMax;
 }
 const platforms=shapeSettlementPlatforms(D,vertexH);
 return {lowered,raised,protectedVertices:keep.size,northernRange,platforms}
}

// A small rocky terrace supports each academy's complete footprint. Sampling just
// its centre used to put the Solitary Tower below the uphill side of the mountain.
export function shapeSettlementPlatforms(D,vertexH){
 const stats=[];
 for(const b of D.cities.filter(b=>b.settlementPlatform&&!b.excluded)){
  const nearby=[];let top=0;
  for(let i=0;i<D.vertices.length;i++){
   const v=D.vertices[i],distance=Math.hypot(v.p[0]-b.x,v.p[1]-b.y);
   if(distance>15||!v.c.every(j=>D.cells[j]?.h>=20))continue;
   nearby.push([i,distance]);if(distance<=8)top=Math.max(top,vertexH[i]);
  }
  if(!nearby.length)continue;
  const level=top+.45;
  for(const [i,d] of nearby){const w=1-smooth(8.5,15,d);vertexH[i]+=(level-vertexH[i])*w;}
  stats.push({city:b.i,level});
 }
 return stats;
}

// A connected, asymmetric alpine spine replaces the four isolated Gaussian domes.
// This is a display-height adjustment only: political paint, routes and cell ids stay intact.
export function shapeNorthernRange(D,vertexH){
 const summit=D.landmarks?.find(l=>l.name==='Ask-Lozard')?.point;
 if(!summit)return {changed:0};
 const [cx,cy]=summit;
 const spine=[[-51,26,.70],[-38,18,.82],[-28,18,.67],[-17,7,.88],[-9,10,.75],[0,0,1],
  [10,7,.77],[22,13,.92],[31,22,.72],[43,25,.87],[53,34,.69],[65,40,.82],[76,53,.62],[91,63,.70],[109,72,.42]];
 const branches=[[[0,0,1],[-8,-13,.75],[-26,-22,.56]],[[22,13,.92],[27,-5,.73],[41,-13,.45]],
  [[43,25,.87],[35,44,.64],[25,57,.37]],[[65,40,.82],[81,29,.58],[94,30,.38]]];
 const paths=[spine,...branches].map(p=>p.map(([x,y,h])=>[x+cx,y+cy,h]));
 const affected=v=>v.c.some(i=>D.cells[i]?.region==='Ask-Lozard');
 let otherMax=0;for(let i=0;i<vertexH.length;i++)if(!affected(D.vertices[i]))otherMax=Math.max(otherMax,vertexH[i]);
 const summitHeight=otherMax*1.045;
 let changed=0;
 for(let i=0;i<D.vertices.length;i++){
  const v=D.vertices[i];if(!affected(v)||!v.c.every(j=>D.cells[j]?.h>=20))continue;
  const [x,y]=v.p;let distance=Infinity,profile=0;
  for(const path of paths)for(let k=1;k<path.length;k++){
   const a=path[k-1],b=path[k],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
   const d=Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy),crest=a[2]+t*(b[2]-a[2]);distance=Math.min(distance,d);
   const width=27+(fbm(x*.035,y*.035)-.5)*8;
   const flanks=Math.pow(Math.max(0,1-d/width),1.3);
   profile=Math.max(profile,15*Math.exp(-d*d/1100)+(summitHeight*crest-15)*flanks);
  }
  const blend=1-smooth(28,44,distance);if(!blend)continue;
  let protection=1;for(const b of D.cities)if(!b.excluded&&Math.abs(b.x-x)<12&&Math.abs(b.y-y)<12)protection=Math.min(protection,smooth(5,12,Math.hypot(b.x-x,b.y-y)));
  const roughness=(fbm(x*.17+11,y*.17)-.5)*4*smooth(5,18,profile);
  vertexH[i]+=(Math.max(2,profile+roughness)-vertexH[i])*blend*protection;changed++;
 }
 return {changed,summitHeight,otherMax};
}
export {fbm,smooth};
