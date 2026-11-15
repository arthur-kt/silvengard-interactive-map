// Silvengard v12 — paisagismo imperial e geografia local (matematica pura).
// Os perfis modificam apenas as cenas locais, nao o mapa politico.
export const IMPERIAL_V12_M=2.2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export function castamorHillHeight(site,x,z){
 const hill=site?.imperialV12?.citadelHill;
 if(!hill)return 0;
 const r=Math.hypot(x-(hill.x||0),z-(hill.z||0));
 const plateau=hill.plateauM||78,edge=hill.radiusM||275;
 return (hill.heightM||78)*(1-smooth(plateau,edge,r));
}
export function miningPassPoint(site,forwardM,acrossM=0){
 const a=site?.imperialV12?.miningPass?.angle||0;
 return {x:Math.cos(a)*forwardM-Math.sin(a)*acrossM,
         z:Math.sin(a)*forwardM+Math.cos(a)*acrossM};
}
export function miningRidgeHeight(site,x,z){
 const mine=site?.imperialV12?.miningPass;
 if(!mine)return 0;
 const a=mine.angle||0,forward=x*Math.cos(a)+z*Math.sin(a),across=-x*Math.sin(a)+z*Math.cos(a);
 const center=mine.centerM||188,span=mine.spreadM||116,half=mine.halfLengthM||520;
 const profile=Math.exp(-Math.pow((forward-center)/span,2));
 const taper=1-smooth(half*.76,half*1.15,Math.abs(across));
 // Desfiladeiro baixo e caminhavel, ladeado por paredes rochosas de verdade.
 const low=smooth((mine.passageHalfM||12)*.72,(mine.passageHalfM||12)*3,Math.abs(across));
 return Math.max(0,(mine.heightM||95)*profile*taper*low);
}
export function makeCastamorAccessRoad({radiusM=275,plateauM=78,angle=0,M=IMPERIAL_V12_M}={}){
 const pts=[];const loops=1.7,outer=radiusM*.92/M,inner=plateauM*.76/M;
 // Aproximacao ao centro em espiral: sem uma escada vertical impossivel de caminhar.
 for(let i=0;i<=240;i++){
  const t=i/240,r=outer+(inner-outer)*t,a=angle+loops*2*Math.PI*t;
  pts.push([Math.cos(a)*r,Math.sin(a)*r]);
 }
 return {pts,w:2.5,main:true,access:true,a:angle};
}
export function rimaeRampartLine(angle,startM=230,endM=1500,stepM=46){
 const points=[];for(let m=startM;m<endM;m+=stepM){points.push({x:Math.cos(angle)*m,z:Math.sin(angle)*m,m});}
 points.push({x:Math.cos(angle)*endM,z:Math.sin(angle)*endM,m:endM});
 return points;
}
export function cityImperialRole(cityId){
 const ids={1240:'castamor',20:'lorvus',1244:'alia',27:'tramor',15:'rimae-fort',17:'rimae-fort',28:'rimae-fort',161:'rimae-market'};
 return ids[Number(cityId)]||null;
}
