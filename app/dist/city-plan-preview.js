// Silvengard Atlas: uma planta legivel da MESMA malha que alimenta o modelo 3D.
// Nao e o SVG gerado pelo Medieval Fantasy City Generator (Watabou).
import {wallRadiusAt} from './city-plan-core.js?v=64';

const M=2.2;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const rand32=n=>{
 let s=(n>>>0)||1;
 return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296};
};
const variants={
 'imperial-grid':'#b4b4a1','elfic-organic':'#8daea1','forest-settlement':'#8ea98b',
 'dwarven-terraces':'#888783','fortress':'#969a9a','harbor-front':'#b9a88a',
 'desert-medina':'#c2b083','marsh-causeways':'#768f83','volcanic':'#857d77',
 'steppe-camp':'#b2a279','ruins':'#9f9e8b','capital-fan':'#a99a8a',
 'trading-town':'#b2a28c','organic-town':'#b09e84'
};

export function drawCityPlan(canvas,{lay,site,field,blueprint}){
 const ctx=canvas.getContext('2d');if(!ctx||!lay||!field)return;
 const W=canvas.width=720,H=canvas.height=720;
 const island=site.island;
 const half=Math.max(lay.Rt*1.35+26,island?Math.max(island.radiusEastWestM,island.radiusNorthSouthM)/M*1.35:0);
 const unit=W/(half*2),cv=u=>W/2+u*unit,cz=v=>H/2+v*unit;
 const X=(px)=>((px-W/2)/unit)*M,Z=(py)=>((py-H/2)/unit)*M;
 const f=blueprint?.pattern||'organic-town';
 const bg=variants[f]||variants['organic-town'];
 ctx.fillStyle='#d5c5a7';ctx.fillRect(0,0,W,H);
 // Raster de solo/agua: utiliza diretamente o campo de alturas do modo 3D.
 const tile=4;
 for(let y=0;y<H;y+=tile)for(let x=0;x<W;x+=tile){
  const sh=field.shoreM(X(x+tile/2),Z(y+tile/2));
  ctx.fillStyle=sh<0?'#4c8199':sh<16?'#bbac83':sh<42?'#b9b499':bg;
  ctx.fillRect(x,y,tile+.6,tile+.6);
 }
 // Relevo e declividade sutilmente representados por curvas de altura.
 ctx.strokeStyle='#4a4d4524';ctx.lineWidth=1;
 for(let z=-half*.92;z<half*.95;z+=Math.max(18,half/10)){
  ctx.beginPath();let started=false;
  for(let u=-half;u<=half;u+=Math.max(6,half/95)){
   const hm=field.heightM(u*M,z*M);
   if(hm<=0)continue;
   const v=z+Math.sin(u*.025+hm*.02)*Math.min(8,Math.abs(hm)*.19);
   if(!started){ctx.moveTo(cv(u),cz(v));started=true}else ctx.lineTo(cv(u),cz(v));
  }
  ctx.stroke();
 }
 // Quarteiroes simplificados, alinhados com as ruas. Nao simula pegadas individuais de Watabou.
 if(f!=='ruins'&&f!=='steppe-camp'){
  const rand=rand32((blueprint?.seed||37)^0xa4930db3);
  const count=clamp(Math.round(lay.Rt*lay.Rt/70),80,1250);
  ctx.fillStyle=f==='elfic-organic'||f==='forest-settlement'?'#eef0d4':f==='imperial-grid'?'#e4d4ae':'#e5d3b6';
  for(let i=0;i<count;i++){
   const a=rand()*TAU,r=Math.sqrt(rand())*lay.Rt*.94;
   const u=Math.cos(a)*r,v=Math.sin(a)*r;
   if(r<lay.plaza+6||field.shoreM(u*M,v*M)<8)continue;
   const sz=clamp((2+rand()*3)*unit,1.3,10),sx=clamp((2+rand()*3.3)*unit,1.4,10);
   ctx.save();ctx.translate(cv(u),cz(v));ctx.rotate((rand()-.5)*.44);
   ctx.fillRect(-sx/2,-sz/2,sx,sz);ctx.restore();
  }
 }
 // Ruas sao exatamente os segmentos usados pelo construtor da cidade.
 for(const rd of lay.roads){
  if(!rd?.pts?.length)continue;
  ctx.beginPath();rd.pts.forEach(([u,v],i)=>i?ctx.lineTo(cv(u),cz(v)):ctx.moveTo(cv(u),cz(v)));
  const px=clamp((rd.w||1.5)*unit*2.1,1.4,12);
  ctx.lineWidth=px+2;ctx.strokeStyle=rd.main?'#78684f':'#8b8066';ctx.stroke();
  ctx.lineWidth=px;ctx.strokeStyle=rd.main?'#e9dabb':'#ddd0b2';ctx.stroke();
 }
 // Muralha segue o mesmo perimetro do modelo 3D, inclusive as seções quadradas.
 if(lay.walled){
  ctx.beginPath();const segments=240;
  for(let i=0;i<=segments;i++){
   const a=i/segments*TAU,r=wallRadiusAt(lay,a,lay.Rt*1.02);
   if(!i)ctx.moveTo(cv(Math.cos(a)*r),cz(Math.sin(a)*r));
   else ctx.lineTo(cv(Math.cos(a)*r),cz(Math.sin(a)*r));
  }
  ctx.lineWidth=clamp(unit*2.3,2,7);ctx.strokeStyle='#4c5047';ctx.stroke();
  for(const a of lay.gates||[]){const r=wallRadiusAt(lay,a,lay.Rt*1.02),u=Math.cos(a)*r,v=Math.sin(a)*r;
   ctx.beginPath();ctx.arc(cv(u),cz(v),clamp(unit*3,2.5,7),0,TAU);ctx.fillStyle='#4e4132';ctx.fill();
  }
 }
 if(f==='ruins'){
  const rand=rand32(blueprint?.seed||123);
  for(let i=0;i<65;i++){const a=rand()*TAU,r=Math.sqrt(rand())*lay.Rt*.88,u=Math.cos(a)*r,v=Math.sin(a)*r;
   if(field.shoreM(u*M,v*M)<4)continue;
   ctx.save();ctx.translate(cv(u),cz(v));ctx.rotate(a);ctx.strokeStyle='#655f4b';ctx.lineWidth=2;
   ctx.strokeRect(-3,-2,4+rand()*8,3+rand()*7);ctx.restore();}
 }
 if(f==='steppe-camp'){
  const rand=rand32(blueprint?.seed||333);
  for(let i=0;i<160;i++){const a=rand()*TAU,r=Math.sqrt(rand())*lay.Rt*.92,u=Math.cos(a)*r,v=Math.sin(a)*r;
   ctx.beginPath();ctx.moveTo(cv(u),cz(v)-3);ctx.lineTo(cv(u)-3,cz(v)+2);ctx.lineTo(cv(u)+3,cz(v)+2);ctx.closePath();ctx.fillStyle='#816c4f';ctx.fill();}
 }
 // Cidadela, praca e zonas historicas.
 if(f!=='ruins'&&f!=='steppe-camp'){
  ctx.beginPath();ctx.arc(W/2,H/2,clamp(lay.plaza*unit,4,34),0,TAU);ctx.fillStyle='#efe2bb';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#887759';ctx.stroke();
 }
 const hasCitadel=blueprint?.features?.citadel||lay.fort;
 if(hasCitadel){const r=clamp(lay.Rt*unit*.07,9,25),u=cv(lay.Rt*.18),v=cz(-lay.Rt*.14);
  ctx.fillStyle='#676760';ctx.strokeStyle='#353b3a';ctx.lineWidth=2.2;ctx.fillRect(u-r,v-r,r*2,r*2);ctx.strokeRect(u-r,v-r,r*2,r*2);
  ctx.fillStyle='#e1d7bf';ctx.fillRect(u-4,v-4,8,8);
 }
 ctx.fillStyle='#eae2cfdd';ctx.fillRect(W*.245,7,W*.51,54);ctx.strokeStyle='#79796888';ctx.lineWidth=1.2;ctx.strokeRect(W*.245,7,W*.51,54);
 ctx.fillStyle='#2e3a37';ctx.font='bold 20px system-ui,Arial';ctx.textAlign='center';
 ctx.fillText(blueprint?.name||site.name||'Cidade',W/2,32);
 ctx.font='12px system-ui,Arial';ctx.fillStyle='#40504a';
 ctx.fillText(blueprint?.patternLabel||'Planta urbana procedural',W/2,51);
 ctx.font='bold 13px system-ui,Arial';ctx.textAlign='left';ctx.fillText('N',W-37,33);
 ctx.beginPath();ctx.moveTo(W-32,39);ctx.lineTo(W-38,57);ctx.lineTo(W-26,57);ctx.closePath();ctx.fillStyle='#324f56';ctx.fill();
 const sc=80,scMetres=Math.round(sc/unit*M/50)*50;
 const scalepx=scMetres/M*unit;
 ctx.lineWidth=2;ctx.strokeStyle='#344b50';ctx.beginPath();ctx.moveTo(26,H-30);ctx.lineTo(26+scalepx,H-30);ctx.moveTo(26,H-36);ctx.lineTo(26,H-24);ctx.moveTo(26+scalepx,H-36);ctx.lineTo(26+scalepx,H-24);ctx.stroke();
 ctx.font='12px system-ui,Arial';ctx.fillStyle='#263a3c';ctx.fillText(`${scMetres.toLocaleString('pt-BR')} m`,26,H-39);
 return {landPixelsW:W,planWidthMeters:Math.round(half*2*M)};
}
