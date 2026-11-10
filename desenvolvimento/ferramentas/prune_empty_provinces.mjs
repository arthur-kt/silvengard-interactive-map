import fs from 'node:fs';
import {createProvinceModel} from '../../app/dist/province-core.js';
const base=new URL('../',import.meta.url),W=JSON.parse(fs.readFileSync(new URL('dist/world.json',base))),P=JSON.parse(fs.readFileSync(new URL('dist/province-proposal.json',base))),m=createProvinceModel(W,P);
if(W.defaultProvinceEdits)m.importData(W.defaultProvinceEdits);
const original=m.data.cellProvinces.slice(),names=new Map(m.data.provinces.map(p=>[p.i,p.name])),removed=m.pruneEmpty().map(i=>({i,name:names.get(i)}));
if(original.some((v,i)=>m.data.cellProvinces[i]!==v))throw Error('A limpeza não pode alterar território.');
const edition={format:'silvengard-atlas-v1',exportedAt:new Date().toISOString(),edits:{cities:{},states:{}},provinceEdits:m.exportData()};
fs.writeFileSync(new URL('backups/v27-empty-provinces-edition.json',base),JSON.stringify({baseId:W.savedDefaults.id,edition,removed}));
console.log(JSON.stringify({removed,remaining:m.data.provinces.length}));
