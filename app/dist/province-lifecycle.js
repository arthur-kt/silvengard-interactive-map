export const PROVINCE_FORMAT='silvengard-province-edits-v1';
const nameOf=name=>{if(typeof name!=='string'||!name.trim()||name.trim().length>100)throw Error('Nome de província inválido.');return name.trim();};
function definition(raw,D){
 if(!Number.isSafeInteger(raw?.i)||raw.i<=0||raw.i>2147483647||!D.states.some(s=>s.i===raw.state&&s.i!==0)||!/^#[0-9a-f]{6}$/i.test(raw.color||''))throw Error('Província criada inválida.');
 const point=raw.labelPoint;if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)||point[0]<0||point[0]>1920||point[1]<0||point[1]>937)throw Error('Posição da província inválida.');
 return {i:raw.i,state:raw.state,number:Number.isInteger(raw.number)&&raw.number>0?raw.number:1,name:nameOf(raw.name),seat:null,seed:null,note:'',color:raw.color,labelPoint:[...point],cells:0,area:0,cities:[]};
}
export function cleanProvinceEdits(raw,D,proposal){
 if(raw?.format!==PROVINCE_FORMAT||raw.base!==(proposal.version||'proposal-v25'))throw Error('Edição de províncias incompatível.');
 if(raw.created!==undefined&&!Array.isArray(raw.created)||raw.deleted!==undefined&&!Array.isArray(raw.deleted)||(raw.created?.length||0)>1000)throw Error('Lista de províncias inválida.');
 const byId=new Map(proposal.provinces.map(p=>[p.i,p])),created=[],deleted=[],names={},cells=[],seen=new Set();
 for(const item of raw.created||[]){const p=definition(item,D);if(byId.has(p.i))throw Error('Província duplicada.');byId.set(p.i,p);created.push(p);}
 for(const id of raw.deleted||[]){if(!Number.isInteger(id)||!byId.has(id)||deleted.includes(id))throw Error('Província excluída inválida.');deleted.push(id);}
 for(const [id,name]of Object.entries(raw.names||{})){if(!byId.has(+id)||deleted.includes(+id))throw Error('Nome de província inválido.');names[id]=nameOf(name);}
 if(!Array.isArray(raw.cells)||raw.cells.length>D.cells.length)throw Error('Células de províncias inválidas.');
 for(const v of raw.cells){const c=D.cells[v.i],p=byId.get(v.province);if(!Number.isInteger(v.i)||!c||!p||deleted.includes(p.i)||seen.has(v.i)||c.h<20||c.state!==p.state)throw Error('A província deve permanecer em terra, dentro do seu estado.');seen.add(v.i);cells.push({i:v.i,province:v.province});}
 if(deleted.length){const assignments=proposal.cellProvinces.slice();for(const c of cells)assignments[c.i]=c.province;for(const c of D.cells)if(c.h>=20&&deleted.includes(assignments[c.i])&&byId.get(assignments[c.i])?.state===c.state)throw Error('Transfira o território da província antes de excluí-la.');}
 return {format:PROVINCE_FORMAT,base:proposal.version||'proposal-v25',names,cells,...(created.length?{created}:{}),...(deleted.length?{deleted}: {})};
}
export function createProvinceModel(D,proposal){
 const data=structuredClone(proposal),originals=new Map(proposal.provinces.map(p=>[p.i,p])),byId=new Map(data.provinces.map(p=>[p.i,p])),undo=[],redo=[];let stroke=null;
 const provinceAt=id=>{const c=D.cells[id],p=byId.get(data.cellProvinces[id]);return c?.h>=20&&c.state===p?.state?p:null;};
 function snapshot(){return {provinces:structuredClone(data.provinces),cells:data.cellProvinces.slice()};}
 function restore(s){data.provinces=structuredClone(s.provinces);data.cellProvinces=s.cells.slice();byId.clear();for(const p of data.provinces)byId.set(p.i,p);}
 function begin(){if(!stroke)stroke=snapshot();}
 function end(){if(!stroke)return false;const before=stroke;stroke=null;if(JSON.stringify(before)===JSON.stringify(snapshot()))return false;undo.push(before);if(undo.length>30)undo.shift();redo.length=0;return true;}
 function paint(x,y,radius,id){const p=byId.get(id);if(!p||!Number.isFinite(radius)||radius<=0)return 0;const g=D.grid;let n=0;
  for(let row=Math.max(0,Math.floor((y-radius)/g.stepY));row<=Math.min(g.rows-1,Math.floor((y+radius)/g.stepY));row++)for(let col=Math.max(0,Math.floor((x-radius)/g.stepX));col<=Math.min(g.columns-1,Math.floor((x+radius)/g.stepX));col++){const c=D.cells[row*g.columns+col];if(c.h<20||c.state!==p.state||Math.hypot(c.p[0]-x,c.p[1]-y)>radius||data.cellProvinces[c.i]===id)continue;data.cellProvinces[c.i]=id;n++;}return n;
 }
 function stats(id){const p=byId.get(id);if(!p)return {cities:[],points:[],population:0,count:0,area:0,center:[960,468],ports:0};
  const cities=D.cities.filter(b=>provinceAt(b.cell)?.i===id);let area=0,count=0,x=0,y=0;
  for(const c of D.cells)if(provinceAt(c.i)?.i===id){area+=c.area;count++;x+=c.p[0];y+=c.p[1];}
  const center=count?[x/count,y/count]:p.labelPoint;let best=null,dist=Infinity;for(const c of D.cells)if(provinceAt(c.i)?.i===id){const d=Math.hypot(c.p[0]-center[0],c.p[1]-center[1]);if(d<dist){best=c.p;dist=d;}}
  p.labelPoint=best||center;p.cells=count;p.cities=cities.map(b=>b.i);
  const g=D.grid,points=(D.landmarks||[]).filter(l=>provinceAt(Math.min(g.rows-1,Math.floor(l.point[1]/g.stepY))*g.columns+Math.min(g.columns-1,Math.floor(l.point[0]/g.stepX)))?.i===id);
  return {cities,points,population:cities.reduce((sum,b)=>sum+(b.demographics?.population||0),0),area,count,center:p.labelPoint,ports:cities.filter(b=>b.majorPort).length};
 }
 function exportData(){const created=data.provinces.filter(p=>!originals.has(p.i)).map(p=>definition(p,D)),deleted=proposal.provinces.filter(p=>!byId.has(p.i)).map(p=>p.i);return {format:PROVINCE_FORMAT,base:proposal.version||'proposal-v25',names:Object.fromEntries(data.provinces.filter(p=>originals.has(p.i)&&p.name!==originals.get(p.i).name).map(p=>[p.i,p.name])),cells:data.cellProvinces.flatMap((p,i)=>p!==proposal.cellProvinces[i]&&provinceAt(i)?[{i,province:p}]:[]),...(created.length?{created}:{}),...(deleted.length?{deleted}: {})};}
 function importData(raw){const clean=cleanProvinceEdits(raw,D,proposal);begin();restore({provinces:proposal.provinces.filter(p=>!clean.deleted?.includes(p.i)).concat(clean.created||[]),cells:proposal.cellProvinces});for(const p of data.provinces)p.name=clean.names[p.i]||p.name;for(const c of clean.cells)data.cellProvinces[c.i]=c.province;end();}
 function create(state,name){name=nameOf(name);if(!D.states.some(s=>s.i===state&&state!==0))throw Error('Escolha um estado.');const id=Math.max(...originals.keys(),...byId.keys())+1,cell=D.cells.find(c=>c.h>=20&&c.state===state),number=Math.max(0,...data.provinces.filter(p=>p.state===state).map(p=>p.number))+1;
  const hue=(id*.61803398875)%1,channel=n=>{const k=(n+hue*12)%12;return Math.round(255*(.66-.2*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0');};
  const p=definition({i:id,state,number,name,color:'#'+channel(0)+channel(8)+channel(4),labelPoint:cell?.p||[960,468]},D);begin();data.provinces.push(p);byId.set(id,p);end();return p;
 }
 function remove(id){const s=stats(id);if(!byId.has(id))throw Error('Província desconhecida.');if(s.count||s.cities.length||s.points.length)throw Error('Transfira o território e as localidades antes de excluir a província.');begin();data.provinces=data.provinces.filter(p=>p.i!==id);byId.delete(id);end();}
 function pruneEmpty(){const assigned=new Set();for(const c of D.cells){const p=provinceAt(c.i);if(p)assigned.add(p.i);}const removed=data.provinces.filter(p=>!assigned.has(p.i));if(!removed.length)return [];begin();data.provinces=data.provinces.filter(p=>assigned.has(p.i));for(const p of removed)byId.delete(p.i);end();return removed.map(p=>p.i);}
 return {data,provinceAt,stats,paint,begin,end,exportData,importData,create,remove,pruneEmpty,rename(id,name){name=nameOf(name);if(!byId.has(id))throw Error('Província desconhecida.');begin();byId.get(id).name=name;end();},undo(){if(!undo.length)return false;redo.push(snapshot());restore(undo.pop());return true;},redo(){if(!redo.length)return false;undo.push(snapshot());restore(redo.pop());return true;},get canUndo(){return !!undo.length;},get canRedo(){return !!redo.length;}};
}
