// Smoke sem WebGL: cria geometrias da v7 com THREE real do mesmo vendor do navegador.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {siteFor,createField,M_PER_UNIT as M} from '../../app/dist/local-field.js';
import {makeLayout,buildTownV2,climateOf} from '../../app/dist/town.js';
import {applyCityBlueprint,applyBlueprintTerrain} from '../../app/dist/city-plan-core.js';
import {planUrbanV7Site} from '../../app/dist/urban-v7-core.js';
import {rng,STYLES} from '../../app/dist/settlements.js';
const D=JSON.parse(fs.readFileSync(new URL('../../app/dist/world.json',import.meta.url)));
const B=JSON.parse(fs.readFileSync(new URL('../../app/dist/city-blueprints.json',import.meta.url))).cities;
const grid=D.grid;
const cellAt=(x,y)=>D.cells[Math.max(0,Math.min(grid.rows-1,Math.floor(y/grid.stepY)))*grid.columns+Math.max(0,Math.min(grid.columns-1,Math.floor(x/grid.stepX)))];
const H=h=>h<20?-2:1.4+Math.pow((h-18)/82,1.65)*115;
const surface=(x,y)=>H(cellAt(x,y).h);
export function makeCity(id){
 const c=D.cities.find(c=>c.i===id),b=B[id];
 assert.ok(c&&b,`cidade ${id} nao existe`);
 const pop=c.demographics?.population??(c.population||10)*2000;
 const site=siteFor({D,point:[c.x,c.y],cellAt,surface,population:pop,city:c});
 applyBlueprintTerrain(site,b);
 const field=createField(site),rand=rng(b.seed);
 const fortress=c.settlementClass?.startsWith('Forte')&&pop<5000&&!c.capital;
 const kind=b.pattern==='ruins'?'ruins':b.pattern==='steppe-camp'?'camp':fortress?'fort':c.capital?'capital':site.port?'port':'town';
 const lay=makeLayout({pop,capital:!!c.capital,village:false,fort:fortress,rand,port:site.port,kind});
 lay.cx=c.x;lay.cy=c.y;lay.walled=!!(c.walls||c.capital||c.citadel);
 applyCityBlueprint(lay,b,site);planUrbanV7Site(site,lay,b);
 const G=(mx,my)=>field.heightM((mx-c.x)*M,(my-c.y)*M)/M;
 const isLand=(mx,my)=>field.heightM((mx-c.x)*M,(my-c.y)*M)>.55;
 const result=buildTownV2({b:c,cx:c.x,cy:c.y,lay,rand,climate:climateOf(cellAt(c.x,c.y)),color:'#345678',G,
  landAt:isLand,toW:(mx,my)=>[mx-c.x,my-c.y],addSolid:()=>{},pathAt:()=>[0,0],
  footprintY:(mx,my)=>G(mx,my),special:false,field,site,blueprint:b,blocked:()=>false,style:STYLES.temperate,production:[]});
 assert.ok(result.groups.length>0);
 assert.ok(result.groups.every(g=>g.isObject3D));
 return {c,b,site,field,lay,result};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const ids=process.argv.slice(2).map(Number);if(!ids.length)ids.push(7,3,1,223,19);
 for(const id of ids){
  const {c,site,lay,result}=makeCity(id);
  let meshes=0,triangles=0;
  for(const group of result.groups){group.traverse(obj=>{if(obj.isMesh){meshes++;triangles+=Math.round((obj.geometry?.index?.count||obj.geometry?.attributes?.position?.count||0)/3)}})}
  console.log(JSON.stringify({id,name:c.name,pat:lay.pattern,cityR:site.cityR,trees:result.v7?.treeHomes,palaces:result.v7?.palaces,bridges:result.v7?.bridges,stilts:result.v7?.stiltHouses,meshes,triangles}));
  for(const group of result.groups)group.traverse(o=>o.geometry?.dispose?.());
 }
}
