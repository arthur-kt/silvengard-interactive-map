import test from 'node:test';
import assert from 'node:assert/strict';
import {indexLore,loreForCity,traitsFromText,firstSentence} from '../../app/dist/local-lore.js';

const archive={
 sections:[
  {id:'s1',markdown:"<!-- atlas_cidade=Teste; atlas_estado=Reino -->\n\n**Localização e perfil:** Teste é uma localidade portuária.\n**Cultura registrada no Atlas:** Nortenhos.\n**História local, instituições e acontecimentos:** Fundada como forte de pedra, cresceu com o porto e as muralhas. A antiga catedral domina a praça."},
  {id:'s2',markdown:'Texto de outra seção sem interesse.'}
 ],
 records:[
  {kind:'city',name:'Teste',target:{kind:'city',id:42},sections:['s1'],chapters:[]},
  {kind:'state',name:'Reino',target:{kind:'state',id:7},sections:['s2']}
 ]
};

test('a história indexa por cidade e ignora fichas de estado',()=>{
 const idx=indexLore(archive);
 assert.equal(idx.size,1);
 const l=loreForCity(idx,42);
 assert.equal(l.name,'Teste');
 assert.ok(l.quote.startsWith('Fundada como forte de pedra'),l.quote);
 assert.ok(!/atlas_cidade|Localização e perfil/.test(l.quote));
 assert.equal(loreForCity(idx,7),null);
});

test('traços vêm de palavras inteiras (sem falso positivo dentro de outra palavra)',()=>{
 const t=traitsFromText('associada aos antigos dominadores élficos e às muralhas do porto');
 assert.equal(t.dwarven,false,'“dominadores” não é mina');
 assert.equal(t.walls,true);
 assert.equal(t.port,true);
 const d=traitsFromText('salão anão de forjas e minas profundas');
 assert.equal(d.dwarven,true);
});

test('primeira frase é curta e limpa',()=>{
 const s=firstSentence('**Uma história longa** com markdown e um ponto final. Segunda frase aqui.');
 assert.equal(s,'Uma história longa com markdown e um ponto final.');
 assert.ok(firstSentence('x'.repeat(400),80).length<=80);
});
