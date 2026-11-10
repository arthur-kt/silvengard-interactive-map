export const LANDMARK_FORMAT='silvengard-landmarks-v1';
export function landmarkFields(raw){
 if(!raw||typeof raw.id!=='string'||!/^poi-[a-zA-Z0-9-]{1,100}$/.test(raw.id)||typeof raw.name!=='string'||!raw.name.trim()||raw.name.trim().length>100||typeof raw.kind!=='string'||!raw.kind.trim()||raw.kind.length>60||typeof(raw.description??'')!=='string'||(raw.description||'').length>20000)throw Error('Nome, tipo ou descrição do ponto inválidos.');
 if(!Array.isArray(raw.point)||raw.point.length!==2||!raw.point.every(Number.isFinite)||raw.point[0]<0||raw.point[0]>1920||raw.point[1]<0||raw.point[1]>937)throw Error('Escolha uma posição dentro do mapa.');
 return {id:raw.id,name:raw.name.trim(),kind:raw.kind.trim(),description:raw.description||'',point:[...raw.point]};
}
export function normalizeLandmarks(D){return (D.landmarks||[]).map((l,i)=>({...l,id:l.id||'poi-original-'+i,description:l.description||''}));}
export function cleanLandmarkEdits(raw){
 if(raw?.format!==LANDMARK_FORMAT||!Array.isArray(raw.items)||!Array.isArray(raw.deleted)||raw.items.length>5000||raw.deleted.length>5000)throw Error('Edição de pontos de interesse inválida.');
 const items=raw.items.map(landmarkFields),deleted=raw.deleted,ids=new Set();for(const l of items){if(ids.has(l.id))throw Error('Ponto duplicado.');ids.add(l.id);}
 for(const id of deleted){if(typeof id!=='string'||!/^poi-[a-zA-Z0-9-]{1,100}$/.test(id)||ids.has(id))throw Error('Ponto excluído inválido ou duplicado.');ids.add(id);}
 const archive=(raw.archive||[]).map(landmarkFields),archived=new Set();for(const l of archive){if(archived.has(l.id)||items.some(p=>p.id===l.id))throw Error('Arquivo de pontos excluídos inválido.');archived.add(l.id);}
 return {format:LANDMARK_FORMAT,items,deleted:[...deleted],archive};
}
export function applyLandmarkEdits(D,raw){
 const clean=cleanLandmarkEdits(raw),landmarks=normalizeLandmarks(D),archive=structuredClone(D.landmarkArchive||{}),byId=new Map(landmarks.map(l=>[l.id,l]));
 for(const l of clean.archive)archive[l.id]={...(archive[l.id]||{}),...l};
 for(const id of clean.deleted){const l=byId.get(id);if(l){archive[id]={...l,...(clean.archive.find(a=>a.id===id)||{})};byId.delete(id);}}
 for(const edit of clean.items){byId.set(edit.id,{...(byId.get(edit.id)||archive[edit.id]||{}),...edit});delete archive[edit.id];}
 return {landmarks:[...byId.values()],landmarkArchive:archive};
}
export function createLandmarkModel(D){
 const base={landmarks:normalizeLandmarks(D),landmarkArchive:structuredClone(D.landmarkArchive||{})};Object.assign(D,structuredClone(base));const original=new Map(base.landmarks.map(l=>[l.id,landmarkFields(l)]));
 const replace=raw=>Object.assign(D,applyLandmarkEdits(base,raw));
 return {save(raw){const l=landmarkFields(raw);Object.assign(D,applyLandmarkEdits(D,{format:LANDMARK_FORMAT,items:[l],deleted:[]}));return l;},remove(id){Object.assign(D,applyLandmarkEdits(D,{format:LANDMARK_FORMAT,items:[],deleted:[id]}));},restore(id){const l=D.landmarkArchive?.[id];if(l)this.save(l);},exportData(){return {format:LANDMARK_FORMAT,items:D.landmarks.filter(l=>JSON.stringify(landmarkFields(l))!==JSON.stringify(original.get(l.id))).map(landmarkFields),deleted:base.landmarks.filter(l=>!D.landmarks.some(n=>n.id===l.id)).map(l=>l.id),archive:Object.values(D.landmarkArchive||{}).map(landmarkFields)};},importData:replace};
}
