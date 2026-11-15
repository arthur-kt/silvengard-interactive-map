// Render de QA: converte as chamadas Canvas2D reais da planta urbana em SVG.
// Evita alterar a logica de drawCityPlan e nao depende de browser/WebGL.
import fs from 'node:fs';
import {makeCity} from './v7-cities-smoke.mjs';
import {drawCityPlan} from '../../app/dist/city-plan-preview.js';
class SvgContext {
 constructor(){this.parts=[];this.fillStyle='#000';this.strokeStyle='#000';this.lineWidth=1;this.font='12px Arial';this.textAlign='left';this.transform='';this.stack=[];this.path=''}
 attrColor(value,kind){
  const s=String(value);
  if(/^#[0-9a-f]{8}$/i.test(s))return `${kind}="#${s.slice(1,7)}" ${kind}-opacity="${(parseInt(s.slice(7),16)/255).toFixed(3)}"`;
  return `${kind}="${s}"`;
 }
 trans(){return this.transform?` transform="${this.transform.trim()}"`:''}
 fillRect(x,y,w,h){this.parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" ${this.attrColor(this.fillStyle,'fill')}${this.trans()}/>`)}
 strokeRect(x,y,w,h){this.parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke-width="${this.lineWidth}" ${this.attrColor(this.strokeStyle,'stroke')}${this.trans()}/>`)}
 beginPath(){this.path=''}
 moveTo(x,y){this.path+=` M ${x.toFixed(2)} ${y.toFixed(2)}`}
 lineTo(x,y){this.path+=` L ${x.toFixed(2)} ${y.toFixed(2)}`}
 arc(x,y,r,a0,a1){
  if(r<=0)return;
  const full=Math.abs(a1-a0)>=Math.PI*1.999;
  const sx=x+Math.cos(a0)*r,sy=y+Math.sin(a0)*r;
  this.path+=` M ${sx.toFixed(2)} ${sy.toFixed(2)}`;
  if(full){const ex=x-Math.cos(a0)*r,ey=y-Math.sin(a0)*r;
   this.path+=` A ${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${ex.toFixed(2)} ${ey.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${sx.toFixed(2)} ${sy.toFixed(2)}`;
  }else {const ex=x+Math.cos(a1)*r,ey=y+Math.sin(a1)*r;this.path+=` A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${Math.abs(a1-a0)>Math.PI?1:0} 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`}
 }
 closePath(){this.path+=' Z'}
 fill(){if(this.path)this.parts.push(`<path d="${this.path}" stroke="none" ${this.attrColor(this.fillStyle,'fill')}${this.trans()}/>`)}
 stroke(){if(this.path)this.parts.push(`<path d="${this.path}" fill="none" stroke-linejoin="round" stroke-width="${this.lineWidth}" ${this.attrColor(this.strokeStyle,'stroke')}${this.trans()}/>`)}
 translate(x,y){this.transform+=` translate(${x},${y})`}
 rotate(rad){this.transform+=` rotate(${rad*180/Math.PI})`}
 save(){this.stack.push([this.fillStyle,this.strokeStyle,this.lineWidth,this.font,this.textAlign,this.transform])}
 restore(){[this.fillStyle,this.strokeStyle,this.lineWidth,this.font,this.textAlign,this.transform]=this.stack.pop()}
 fillText(value,x,y){
  const esc=String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const size=(/([0-9.]+)px/.exec(this.font)||[])[1]||12;
  const anchor=this.textAlign==='center'?'middle':this.textAlign==='right'?'end':'start';
  this.parts.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${this.font.includes('bold')?'bold':'normal'}" ${this.attrColor(this.fillStyle,'fill')}${this.trans()}>${esc}</text>`)
 }
 svg(w=720,h=720){return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${this.parts.join('')}</svg>`}
}
class Canvas{constructor(){this.width=720;this.height=720;this.ctx=new SvgContext()}getContext(){return this.ctx}}
for(const id of process.argv.slice(2).map(Number)){
 const obj=makeCity(id),canvas=new Canvas();
 const r=drawCityPlan(canvas,{lay:obj.lay,site:obj.site,field:obj.field,blueprint:obj.b});
 const file=new URL(`../../amostras-dragonfall-v14/${id}-${obj.c.name.replaceAll(' ','-')}-v14.svg`,import.meta.url);
 fs.writeFileSync(file,canvas.ctx.svg(canvas.width,canvas.height));
 console.log(JSON.stringify({id,name:obj.c.name,svgElements:canvas.ctx.parts.length,file,planWidthMeters:r.planWidthMeters}));
 for(const group of obj.result.groups)group.traverse(o=>o.geometry?.dispose?.());
}
