import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildShoreField,shapeRelief,shapeNorthernRange} from '../../app/dist/terrain-shape.js';

const D=JSON.parse(fs.readFileSync(caminho('dist/world.json')));
const height=h=>h<20?-2:1.4+Math.pow((h-18)/82,1.65)*115;
const heights=()=>D.vertices.map(v=>{const cs=v.c.map(i=>D.cells[i]);return cs.some(c=>c.h<20)?-.2:cs.reduce((s,c)=>s+height(c.h),0)/cs.length});

test('visual relief preserves world data and keeps Ask a modest highest connected summit',()=>{
 const before=JSON.stringify(D),vh=heights();
 const stats=shapeRelief({D,vertexH:vh,field:buildShoreField(D),height,keepNear:D.cities.filter(b=>!b.excluded).map(b=>[b.x,b.y])});
 assert.equal(JSON.stringify(D),before);
 assert.ok(vh.every(Number.isFinite));
 const summit=stats.northernRange;
 assert.ok(summit.changed>500);
 assert.ok(summit.finalSummit>summit.nextHighest);
 assert.ok(summit.finalSummit<summit.nextHighest*1.06);
 let askMax=0,otherMax=0,peak;
 for(let i=0;i<vh.length;i++)if(D.vertices[i].c.some(j=>D.cells[j].region==='Ask-Lozard')){if(vh[i]>askMax){askMax=vh[i];peak=D.vertices[i].p}}else otherMax=Math.max(otherMax,vh[i]);
 assert.ok(askMax>otherMax&&askMax<otherMax*1.06);
 const p=D.landmarks.find(l=>l.name==='Ask-Lozard').point;
 assert.ok(Math.hypot(peak[0]-p[0],peak[1]-p[1])<8);
});

test('regional ridge shaping leaves vertices outside Ask and all water untouched',()=>{
 const original=heights(),vh=[...original];shapeNorthernRange(D,vh);
 for(let i=0;i<vh.length;i++)if(!D.vertices[i].c.some(j=>D.cells[j].region==='Ask-Lozard')||D.vertices[i].c.some(j=>D.cells[j].h<20))assert.equal(vh[i],original[i]);
});

test('integrated shell retains current tools, ports and dwarf models',()=>{
 const app=fs.readFileSync(caminho('dist/app.js'),'utf8');
 const features=fs.readFileSync(caminho('dist/features.js'),'utf8');
 const html=fs.readFileSync(caminho('dist/index.html'),'utf8');
 for(const name of ['createJourneys','createPainting','createRouteEditor','harborModel','dwarvenModel'])assert.ok(app.includes(name));
 for(const name of ['export function harborModel','export function dwarvenModel','riverMaterial','treeGeometries'])assert.ok(features.includes(name));
 for(const id of ['routesBtn','journeysBtn','editorBtn','shadowToggle','waterToggle'])assert.ok(html.includes(`id="${id}"`));
 assert.ok(app.includes('return SEA_LEVEL;'));
});
