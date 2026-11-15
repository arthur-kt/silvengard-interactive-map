import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {materialPreset,resolveMaterialPreset} from '../../app/dist/material-presets.js';
import {CC0_SLOTS,cc0Uniforms,cc0Counts} from '../../app/dist/cc0-textures.js';
const dist=new URL('../../app/dist/',import.meta.url);
test('sete slots da biblioteca de materiais externos estao definidos',()=>{
 assert.deepEqual(Object.keys(CC0_SLOTS).sort(),['ground','mud','paving','rock','roofing','stone','wood']);
 for(const name of Object.keys(CC0_SLOTS)){
  const u=cc0Uniforms(name);
  assert.ok(u.uCC0Map.value);
  assert.equal(u.uCC0Mix.value,0);
 }
});
test('presets da v9 continuam ativos e Elucitor mantém estilos por distrito',()=>{
 assert.equal(resolveMaterialPreset({cityName:'Elucitor',districtKey:'market'}).id,'elucitor-market');
 assert.equal(resolveMaterialPreset({cityName:'Elucitor',districtKey:'harbour'}).id,'elucitor-harbour');
 assert.equal(materialPreset('default').id,'default');
});
test('fontes do shader aceitam mapa CC0 e possuem fallback',()=>{
 for(const file of ['town.js','settlements.js','local-scene.js','street.js']){
  const src=fs.readFileSync(new URL(file,dist),'utf8');
  assert.match(src,/cc0/i,`${file} sem material CC0`);
 }
 assert.ok(fs.existsSync(new URL('textures/cc0/LEIA-ME.txt',dist)));
 assert.equal(Object.keys(cc0Counts()).length,7);
});
