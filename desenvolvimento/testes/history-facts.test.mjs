import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {historyFact} from '../../app/dist/history-facts.js';
const data=JSON.parse(fs.readFileSync(caminho('dist/history-archive.json'),'utf8'));

test('city sheet shows its own historical prose, distinguishing the two Gugacon',()=>{
 const a=historyFact(data,'city',33),b=historyFact(data,'city',14);
 assert.match(a.paragraphs.join(' '),/Arvanthir|Queda Infernal/);
 assert.equal(a.record.stateId,12);assert.equal(b.record.stateId,47);
 assert.notDeepEqual(a.paragraphs,b.paragraphs);
});
test('province preview is independent from the cities directory',()=>{
 const value=historyFact(data,'province',1);
 assert.ok(value.paragraphs.length);assert.equal(value.record.name,'Ducado de Asgorath');
 assert.doesNotMatch(value.paragraphs.join(' '),/Localização e perfil|Cidade:|Província:/);
});
test('culture and religion cards receive narrative content without opening the reader',()=>{
 assert.match(historyFact(data,'culture',15).paragraphs.join(' '),/Thur'rumdomir|anões/);
 assert.match(historyFact(data,'religion',43).paragraphs.join(' '),/Gavanon/);
 for(const record of data.records.filter(r=>['culture','religion'].includes(r.kind)&&(r.chapters.length||r.contexts.length))){
  const value=historyFact(data,record.kind,+record.id.split(':')[1]);
  assert.ok(value.paragraphs.length,record.name);
  assert.doesNotMatch(value.paragraphs.join(' '),/OBSERVAÇÃO EDITORIAL|PONTOS A CONFIRMAR/);
 }
});
test('regional fallback follows the state of the selected terrain',()=>{
 const record=data.records.find(r=>r.id==='culture:18');
 assert.ok(record.contexts.length>1);
 // Exercise regional fallback only when a culture has no authored global chapter.
 const chosen=record.contexts.at(-1),fallback={...data,records:data.records.map(r=>r===record?{...r,chapters:[]}:r)},value=historyFact(fallback,'culture',18,{stateId:chosen.stateId});
 assert.equal(value.context,chosen.name);assert.ok(value.paragraphs.length);
});
test('unknown entities do not acquire fictional history',()=>assert.equal(historyFact(data,'city',999999),null));
