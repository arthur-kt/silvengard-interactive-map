// Silvengard · v35 — gerador de localidades (ruas orgânicas, lotes, marcos, quintas, muralhas) e pontos de interesse do ermo.
import * as THREE from 'three';
import {Mesher,STYLES,addBuilding,addChurch2,addTownHall,addKeepHall,addFountain,addFence,addWell,addStall,addBarrel,addCrate,addLamp,addTower,addFort,addHaystack,addTent,addPillar,addLog,addWallSegment,addBanner,addHouse,tc,PAL} from './settlements.js?v=35';

const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
const vh=(x,y)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
const vn=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=vh(ix,iy),b=vh(ix+1,iy),c=vh(ix,iy+1),d=vh(ix+1,iy+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
const CLIMATE={1:'arid',2:'arid',3:'arid',4:'temperate',5:'tropical',6:'temperate',7:'tropical',8:'temperate',9:'cold',10:'cold',11:'cold',12:'wet'};
export const CLIMATE_NAME={arid:'clima árido',tropical:'clima tropical',temperate:'clima temperado',cold:'clima frio',alpine:'terras altas',wet:'terras alagadiças'};
export function climateOf(cell){if(!cell)return'temperate';if(cell.h>52)return'alpine';return CLIMATE[cell.biome]||'temperate'}

/* ---------- traçado ---------- */
export function makeLayout({pop,capital,village,fort,rand}){
 const N=Math.max(capital?30:8,Math.min(150,Math.round(pop/(capital?200:380)))),Rt=10+3.1*Math.sqrt(N),plaza=fort?0:capital?7.5:village?3.8:5.6,a0=rand()*Math.PI,roads=[];
 const poly=(a,r0,r1,steps,amp,ph,ox=0,oy=0)=>{const pts=[];for(let k=0;k<=steps;k++){const r=r0+(r1-r0)*k/steps,w=(vn(k*.55,ph)-.5)*amp*smooth(0,3,k);pts.push([ox+Math.cos(a)*r-Math.sin(a)*w,oy+Math.sin(a)*r+Math.cos(a)*w])}return pts};
 const reach=Rt+24;
 roads.push({pts:poly(a0,plaza*.8,reach,10,5,rand()*9),w:1.55,a:a0,main:true});roads.push({pts:poly(a0+Math.PI,plaza*.8,reach,10,5,rand()*9),w:1.55,a:a0+Math.PI,main:true});
 const nCross=capital?3:village?1:2;
 for(let i=0;i<nCross;i++){const s=(i+1)/(nCross+1)*Rt*.9+plaza,ox=Math.cos(a0)*s*(i%2?-1:1),oy=Math.sin(a0)*s*(i%2?-1:1);for(const sgn of[1,-1]){roads.push({pts:poly(a0+sgn*Math.PI/2+(rand()-.5)*.35,0,Rt*.85+rand()*8,7,4,rand()*9,ox,oy),w:1.25,a:a0+sgn*Math.PI/2,main:true,cross:true})}}
 if(plaza>0){const pts=[];for(let k=0;k<=24;k++){const a=k/24*Math.PI*2;pts.push([Math.cos(a)*(plaza+2.2),Math.sin(a)*(plaza+2.2)])}roads.push({pts,w:1.1,a:0,main:false,ring:true})}
 if(N>36){const pts=[],r0=Rt*.66;for(let k=0;k<=36;k++){const a=k/36*Math.PI*2;pts.push([Math.cos(a)*(r0+(vn(k*.4,5)-.5)*4),Math.sin(a)*(r0+(vn(k*.4,5)-.5)*4)])}roads.push({pts,w:1,a:0,main:false})}
 const nl=N>25?6:N>12?4:2;for(let i=0;i<nl;i++){const a=a0+Math.PI/4+i*Math.PI*2/nl+(rand()-.5)*.5;roads.push({pts:poly(a,plaza+3.2,Rt+10,6,3,rand()*9),w:.9,a,main:false})}
 return{pop,N,Rt,plaza,capital,village,fort,roads,a0};
}
const pointsAlong=(pts)=>{const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return{cum,total:cum[cum.length-1],at(s){s=Math.max(0,Math.min(cum[cum.length-1]-1e-6,s));let i=1;while(i<cum.length-1&&cum[i]<s)i++;const L=cum[i]-cum[i-1]||1,f=(s-cum[i-1])/L,a=pts[i-1],b=pts[i];return{x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,tx:(b[0]-a[0])/L,ty:(b[1]-a[1])/L}}}};
const axes=r=>[[Math.cos(r),-Math.sin(r)],[Math.sin(r),Math.cos(r)]];
function rectsOverlap(a,b,pad=.2){const A=axes(a.r),B=axes(b.r),dx=b.x-a.x,dz=b.z-a.z;for(const ax of[...A,...B]){const ra=a.hw*Math.abs(ax[0]*A[0][0]+ax[1]*A[0][1])+a.hd*Math.abs(ax[0]*A[1][0]+ax[1]*A[1][1]),rb=b.hw*Math.abs(ax[0]*B[0][0]+ax[1]*B[0][1])+b.hd*Math.abs(ax[0]*B[1][0]+ax[1]*B[1][1]);if(Math.abs(dx*ax[0]+dz*ax[1])>ra+rb+pad)return false}return true}

/* ---------- construção da localidade ---------- */
export function buildTownV2(env){
 const{b,cx,cy,lay,rand,climate,color,G,landAt,toW,addSolid,pathAt,footprintY,special}=env,style=STYLES[climate]||STYLES.temperate;
 const m=new Mesher(),placed=[],smoke=[],fields=[],lamps=[],people=[],counts={shop:0,tavern:0,smithy:0};let windmill=null;
 const world=(u,v)=>toW(cx+u,cy+v),flat=(u,v,r)=>{let lo=1e9,hi=-1e9;for(const[dx,dy]of[[0,0],[r,0],[-r,0],[0,r],[0,-r]]){const g=G(cx+u+dx,cy+v+dy);lo=Math.min(lo,g);hi=Math.max(hi,g)}return hi-lo};
 const free=(rc,pad)=>{for(const p of placed)if(rectsOverlap(rc,p,pad))return false;return true};
 const solid=(rc)=>{const long=Math.max(rc.hw,rc.hd),short=Math.min(rc.hw,rc.hd),n=Math.max(1,Math.ceil(long/short*.5)),ax=rc.hw>=rc.hd?axes(rc.r)[0]:axes(rc.r)[1];for(let i=0;i<n;i++){const t=n===1?0:(i/(n-1)-.5)*2*(long-short);addSolid(cx+rc.x+ax[0]*t,cy+rc.z+ax[1]*t,short*.92)}};
 const okPath=(rc)=>{for(const[sx,sz]of[[0,0],[1,1],[1,-1],[-1,1],[-1,-1]]){const ax=axes(rc.r),u=rc.x+ax[0][0]*sx*rc.hw+ax[1][0]*sz*rc.hd,v=rc.z+ax[0][1]*sx*rc.hw+ax[1][1]*sz*rc.hd,[d,c]=pathAt(u,v);if(d>.3||c>.3)return false;if(!landAt(cx+u,cy+v))return false}return true};
 const put=(type,u,v,rot,w,d,floors,opts={})=>{const rc={x:u,z:v,r:rot,hw:w/2,hd:d/2};if(!free(rc,opts.pad??.25)||!okPath(rc)||flat(u,v,Math.min(w,d)/2)>1.5)return false;
  const[x,z]=world(u,v),y=footprintY(cx+u,cy+v,Math.min(w,d)/2)+.05;
  addBuilding(m,{at:[x,y,z],rot,w,d,floors,type,style,R:rand,smoke,gableFront:opts.gableFront});placed.push(rc);solid(rc);return true};
 // ----- marcos centrais
 if(special){placed.push({x:0,z:0,r:0,hw:9,hd:9})}
 else if(lay.fort){const[x,z]=world(0,0);addFort(m,{at:[x,footprintY(cx,cy,9)+.15,z],size:20,flag:color,R:rand});placed.push({x:0,z:0,r:0,hw:12,hd:12});for(let t=-10;t<=10;t+=1.6)for(const[ux,uv]of[[t,-10],[t,10],[-10,t],[10,t]]){if(uv===10&&Math.abs(ux)<2)continue;addSolid(cx+ux,cy+uv,.9)}}
 else{
  const P=lay.plaza,[x0,z0]=world(0,0),gy=G(cx,cy);
  addFountain(m,{at:[x0,gy+.05,z0]});addSolid(cx,cy,1.8);
  const slots=lay.capital?[['hall',0],['church',2.1],['tavern',-2.1],['market',Math.PI]]:[['church',0],['hall',lay.village?-9:2.4],['tavern',-2.2],['market',Math.PI]];
  for(const[kind,ang]of slots){if(lay.village&&kind==='hall')continue;const a=lay.a0+ang+(lay.a0>1.5?.3:-.3),big=kind==='hall'?6:kind==='church'?5:3.6,dist=P+2.6+big*.75,u=Math.cos(a)*dist,v=Math.sin(a)*dist,rot=Math.atan2(-Math.cos(a),-Math.sin(a)),[x,z]=world(u,v),y=footprintY(cx+u,cy+v,3)+.05;
   if(kind==='market'){for(let i=0;i<(lay.capital?5:lay.village?1:3);i++){const aa=a+(i-1.5)*.5,uu=Math.cos(aa)*(P*.62),vv=Math.sin(aa)*(P*.62),[xx,zz]=world(uu,vv);addStall(m,{at:[xx,G(cx+uu,cy+vv)+.05,zz],rot:-aa+Math.PI/2,R:rand});addSolid(cx+uu,cy+vv,.9)}continue}
   const rc={x:u,z:v,r:rot,hw:kind==='hall'?3.6:kind==='church'?3:2.4,hd:kind==='hall'?2.4:kind==='church'?5.5:2.6};if(!free(rc,.3)||!landAt(cx+u,cy+v))continue;
   if(kind==='church')addChurch2(m,{at:[x,y,z],rot,R:rand,style});
   else if(kind==='hall'){lay.capital?addKeepHall(m,{at:[x,y,z],flag:color,R:rand}):addTownHall(m,{at:[x,y,z],rot,flag:color,R:rand})}
   else addBuilding(m,{at:[x,y,z],rot,w:5,d:5.2,floors:2,type:'tavern',style,R:rand,smoke,gableFront:false});
   placed.push(rc);solid(rc);if(kind==='church'||kind==='hall')lay.landmarks=(lay.landmarks||[]).concat([[u,v]])}
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3,u=Math.cos(a)*(P*.95),v=Math.sin(a)*(P*.95),[x,z]=world(u,v);addLamp(m,{at:[x,G(cx+u,cy+v)+.05,z]});lamps.push([x,G(cx+u,cy+v)+1.7,z])}
 }
 // ----- lotes ao longo das ruas (quarteirões compactos no centro, quintais fora)
 let count=placed.length;const target=lay.N,limit=lay.Rt*1.08;
 const order=lay.roads.slice().sort((a,c)=>(c.ring?3:c.main?2:c.cross?1:0)-(a.ring?3:a.main?2:a.cross?1:0));
 for(const rd of order){if(count>=target)break;const pp=pointsAlong(rd.pts);
  for(const side of[1,-1]){if(rd.ring&&side===1)continue;let s=rd.ring?0:lay.plaza*.9+3;
   while(s<pp.total-2&&count<target){const q=pp.at(s),r=Math.hypot(q.x,q.y);if(r>limit){s+=4;continue}
    const core=r<lay.Rt*.38,mid=r<lay.Rt*.75,w=(core?3.2:2.8)+rand()*(core?2.2:1.6),d=(core?4.4:3.8)+rand()*2.2,nx=-q.ty,ny=q.tx;
    const setback=rd.w+(core?.5:mid?1.5:2.8)+d/2,sd=rd.ring?-1:side;
    const u=q.x+nx*sd*setback,v=q.y+ny*sd*setback,rot=Math.atan2(-nx*sd,-ny*sd);
    let type='house',floors=core?2+(rand()<.4?1:0):1+(rand()<.4?1:0);
    if(rand()<(core?.26:.05)&&counts.shop<14){type='shop';counts.shop++}else if(!core&&!mid&&rand()<.05&&counts.smithy<2){type='smithy';counts.smithy++;floors=1}else if(core&&rand()<.04&&counts.tavern<2){type='tavern';counts.tavern++}
    if(put(type,u,v,rot,w,d,floors,{pad:core?.12:.5})){count++;if(!core&&rand()<.55){const[x,z]=world(u+nx*sd*(d/2+2.2),v+ny*sd*(d/2+2.2));if(landAt(cx+u+nx*sd*(d/2+2.2),cy+v+ny*sd*(d/2+2.2))&&rand()<.4)addHaystack(m,{at:[x,G(cx+u+nx*sd*(d/2+2.2),cy+v+ny*sd*(d/2+2.2))+.05,z],s:.8})}}
    s+=w+(core?.15+rand()*.25:mid?.8+rand()*1.2:2.2+rand()*3.2)}}}
 // ----- bairros soltos e quintas
 for(let tries=0;count<target&&tries<500;tries++){const a=rand()*6.28,r=lay.Rt*(.5+rand()*.6),u=Math.cos(a)*r,v=Math.sin(a)*r;if(put('house',u,v,Math.atan2(-Math.cos(a),-Math.sin(a))+(rand()-.5)*.7,2.8+rand()*1.4,3.6+rand()*1.6,1+(rand()<.3?1:0)))count++}
 if(!lay.fort&&!special&&climate!=='arid'||climate==='arid'){const nf=lay.village?2:lay.capital?4:3;
  for(let i=0,k=0;i<nf&&k<80;k++){const a=rand()*6.28,r=lay.Rt*(1.15+rand()*.5),u=Math.cos(a)*r,v=Math.sin(a)*r,rot=Math.atan2(-Math.cos(a),-Math.sin(a));
   if(!put('barn',u,v,rot,4.2,6.2,1,{pad:1.5,gableFront:true}))continue;i++;
   if(put('house',u+Math.cos(a+1.57)*7,v+Math.sin(a+1.57)*7,rot,3,3.8,1+(rand()<.3?1:0),{pad:1})){}
   const fw=9+rand()*5,fd=7+rand()*5,fu=u-Math.cos(a)*10,fv=v-Math.sin(a)*10,fr={x:fu,z:fv,r:rot,hw:fw/2,hd:fd/2};
   if(free(fr,.5)&&landAt(cx+fu,cy+fv)&&flat(fu,fv,5)<1.8){placed.push(fr);fields.push({x:fu,y:fv,w:fw,d:fd,rot,hue:rand()});
    const ax=axes(rot),c4=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sz])=>world(fu+ax[0][0]*sx*fw/2+ax[1][0]*sz*fd/2,fv+ax[0][1]*sx*fw/2+ax[1][1]*sz*fd/2));
    for(let j=0;j<4;j++){const p=c4[j],q=c4[(j+1)%4];addFence(m,{a:p,b:q,y0:G(cx+fu,cy+fv),R:rand})}}}
 }
 // ----- moinho no ponto mais alto próximo
 {let best=null;for(let t=0;t<40;t++){const a=rand()*6.28,r=lay.Rt*(1.1+rand()*.7),u=Math.cos(a)*r,v=Math.sin(a)*r;if(!landAt(cx+u,cy+v))continue;const g=G(cx+u,cy+v),rc={x:u,z:v,r:0,hw:2.4,hd:2.4};if(free(rc,2)&&(!best||g>best.g))best={u,v,g,rc,a}}
  if(best&&!lay.fort&&!lay.village){placed.push(best.rc);addSolid(cx+best.u,cy+best.v,2.4);const[x,z]=world(best.u,best.v);windmill={x,z,y:footprintY(cx+best.u,cy+best.v,2)+.05,rot:Math.PI/3+(rand()-.5)}}}
 // ----- muralhas
 let wallR=0;const mm=new Mesher();
 if(lay.walled){wallR=lay.Rt*1.08+8;const segs=Math.max(48,Math.round(wallR*1.1)),gates=lay.roads.filter(r=>r.main&&!r.ring).map(r=>r.a),pts=[];
  for(let i=0;i<=segs;i++){const a=i/segs*Math.PI*2;pts.push([cx+Math.cos(a)*wallR,cy+Math.sin(a)*wallR,a])}
  for(let i=0;i<segs;i++){const a=pts[i],c=pts[i+1],mid=(a[2]+c[2])/2;if(gates.some(g=>Math.abs(Math.atan2(Math.sin(mid-g),Math.cos(mid-g)))<.07))continue;if(!landAt(a[0],a[1])||!landAt(c[0],c[1]))continue;
   const[ax,az]=toW(a[0],a[1]),[bx,bz]=toW(c[0],c[1]);addWallSegment(mm,{a:[ax,az],b:[bx,bz],y:Math.min(G(a[0],a[1]),G(c[0],c[1])),h:2.8,t:.9});addSolid((a[0]+c[0])/2,(a[1]+c[1])/2,wallR*Math.PI*2/segs*.55)}
  for(let i=0;i<segs;i+=Math.max(6,Math.round(segs/12))){if(!landAt(pts[i][0],pts[i][1]))continue;const[tx,tz]=toW(pts[i][0],pts[i][1]);addTower(mm,{at:[tx,G(pts[i][0],pts[i][1]),tz],r:1.3,h:4.4,sides:9,cap:'roof',capH:2.3,tint:tc(PAL.stone,.95),slits:true});addSolid(pts[i][0],pts[i][1],1.4)}
  for(const g of gates){const gx=cx+Math.cos(g)*wallR,gy=cy+Math.sin(g)*wallR;if(!landAt(gx,gy))continue;const[tx,tz]=toW(gx,gy);for(const s of[-1,1]){const px=gx+Math.cos(g+Math.PI/2)*s*2.3,py=gy+Math.sin(g+Math.PI/2)*s*2.3,[ux,uz]=toW(px,py);addTower(mm,{at:[ux,G(px,py),uz],r:1.1,h:4.8,sides:8,cap:'roof',capH:2.1,tint:tc(PAL.stone,.97),slits:true});addSolid(px,py,1.2)}}}
 // ----- lampiões nas ruas principais
 for(const rd of lay.roads.filter(r=>r.main)){const pp=pointsAlong(rd.pts);for(let s=lay.plaza+4;s<Math.min(pp.total,lay.Rt+6);s+=9){const q=pp.at(s),u=q.x-q.ty*(rd.w+.9),v=q.y+q.tx*(rd.w+.9),[x,z]=world(u,v),y=G(cx+u,cy+v);addLamp(m,{at:[x,y+.02,z]});lamps.push([x,y+1.7,z])}}
 // ----- moradores
 const npc=Math.min(34,Math.round(lay.N*.5)+4);for(let i=0;i<npc;i++){const rd=lay.roads[Math.floor(rand()*lay.roads.length)],p=rd.pts;people.push({path:p,rd,t:rand()*(p.length-1),dir:rand()<.5?1:-1,sp:.5+rand()*.7,off:(rand()-.5)*rd.w*1.2,col:new THREE.Color(['#8c4f3a','#4b6a7a','#7b7a52','#a27a4f','#5d4f6e','#6e6a5a','#9a5a5a'][i%7]),ph:rand()*6.28})}
 const groups=[m.group()];if(Object.keys(mm.k).length)groups.push(mm.group());
 return{groups,people,fields,windmill,smoke,lamps,wallR,placed};
}

/* ---------- pontos de interesse do ermo (cada lugar tem os seus) ---------- */
export function buildWildFeatures(env){
 const{cx,cy,R,rand,climate,G,landAt,toW,addSolid,steep}=env,m=new Mesher(),lamps=[],style=STYLES[climate]||STYLES.temperate,used=[],list=[];
 const spot=(minD,maxD)=>{for(let t=0;t<60;t++){const a=rand()*6.28,r=minD+rand()*(maxD-minD),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(!landAt(x,y)||steep(x,y))continue;if(used.some(p=>Math.hypot(p[0]-x,p[1]-y)<26))continue;used.push([x,y]);return[x,y,a]}return null};
 const W=(x,y)=>toW(x,y);
 const kinds={
  camp:(x,y)=>{const[wx,wz]=W(x,y),g=G(x,y)+.03;m.cyl('stone',.75,.8,.18,9,{at:[wx,g,wz],tint:tc('#5a5750')});m.cyl('wood',.12,.1,.5,5,{at:[wx,g+.1,wz],tint:tc('#4a3a2c')});m.box('glass',.22,.34,.22,{at:[wx,g+.16,wz]});lamps.push([wx,g+.6,wz]);
   for(let i=0;i<2;i++){const a=i*2.6+rand(),tx=x+Math.cos(a)*3.2,ty=y+Math.sin(a)*3.2,[ux,uz]=W(tx,ty);addTent(m,{at:[ux,G(tx,ty)+.02,uz],rot:a,color:i?'#b6483c':'#6f8a5e'});addSolid(tx,ty,1.2)}
   for(let i=0;i<3;i++){const a=3.5+i*.7,lx=x+Math.cos(a)*1.9,ly=y+Math.sin(a)*1.9,[ux,uz]=W(lx,ly);addLog(m,{from:[ux-.5,G(lx,ly),uz-.2],to:[ux+.5,G(lx,ly),uz+.3]})}addSolid(x,y,1.1)},
  ruins:(x,y)=>{for(let i=0;i<9;i++){const a=i/9*Math.PI*2,rx=x+Math.cos(a)*6,ry=y+Math.sin(a)*6;if(!landAt(rx,ry))continue;const[ux,uz]=W(rx,ry);if(i%3===0)addPillar(m,{at:[ux,G(rx,ry),uz],h:2+rand()*1.2,broken:rand()<.5});else{const[vx,vz]=W(x+Math.cos(a+.35)*6,y+Math.sin(a+.35)*6);addWallSegment(m,{a:[ux,uz],b:[vx,vz],y:G(rx,ry),h:.8+rand()*1.4,t:.8,crenel:false})}addSolid(rx,ry,1)}
   const[ux,uz]=W(x,y);m.box('stone',1.6,.9,.9,{at:[ux,G(x,y),uz],tint:tc(PAL.stone,.8)});addSolid(x,y,1.3)},
  stones:(x,y)=>{for(let i=0;i<8;i++){const a=i/8*Math.PI*2,sx=x+Math.cos(a)*5,sy=y+Math.sin(a)*5;if(!landAt(sx,sy))continue;const[ux,uz]=W(sx,sy),h=2.2+rand()*1.3;m.box('stone',.8,h,.5,{at:[ux,G(sx,sy)-.2,uz],rot:-a,tint:tc('#9a968a',.9+rand()*.2)});addSolid(sx,sy,.6)}
   const[ux,uz]=W(x,y);m.box('stone',1.6,.8,1.6,{at:[ux,G(x,y),uz],tint:tc('#8f8b80')});m.box('glass',.3,.2,.3,{at:[ux,G(x,y)+.8,uz]});addSolid(x,y,1.4)},
  hut:(x,y)=>{const[ux,uz]=W(x,y),rot=rand()*6.28;addBuilding(m,{at:[ux,G(x,y)+.05,uz],rot,w:3,d:3.6,floors:1,type:'house',style,R:rand});addSolid(x,y,2.1);
   for(let i=0;i<3;i++){const a=rot+2+i*.5,bx=x+Math.cos(a)*3.2,by=y+Math.sin(a)*3.2,[vx,vz]=W(bx,by);addBarrel(m,{at:[vx,G(bx,by)+.03,vz]})}},
  tower:(x,y)=>{const[ux,uz]=W(x,y),g=G(x,y);addTower(m,{at:[ux,g,uz],r:1.7,h:7,sides:9,cap:'roof',capH:2.8,tint:tc(PAL.stone,.9),slits:true,crenel:false});addBanner(m,{at:[ux,g+9.8,uz],h:1.6,color:'#8a3a3a',scale:.8});addSolid(x,y,2)}
 };
 const menu={temperate:['camp','ruins','hut','stones'],tropical:['camp','hut','ruins'],arid:['ruins','camp','stones','tower'],cold:['camp','hut','stones','tower'],alpine:['tower','camp','stones','hut'],wet:['hut','camp','ruins']}[climate]||['camp','ruins','hut','stones'];
 const n=3+Math.floor(rand()*2);for(let i=0;i<n;i++){const s=spot(30,R*.8);if(!s)continue;const k=menu[(i+Math.floor(rand()*3))%menu.length];kinds[k](s[0],s[1]);list.push(k)}
 return{group:m.group(),lamps,list};
}
