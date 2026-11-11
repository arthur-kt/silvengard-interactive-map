import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMarkdown} from '../../app/dist/history-core.js';
import {renderLineageTree,renderSuccessionRuler,treeStats} from '../../app/dist/history-lineage.js';

test('nested markdown lists keep their hierarchy',()=>{
 const html=renderMarkdown('- Casa A\n  - Rei B\n    - Herdeiro C\n- Casa D');
 assert.match(html,/<ul><li>Casa A<ul><li>Rei B<ul><li>Herdeiro C<\/li><\/ul><\/li><\/ul><\/li><li>Casa D<\/li><\/ul>/);
});

test('fenced archival blocks are escaped and never executed',()=>{
 const html=renderMarkdown('```\n<script>alert(1)</script>\n```');
 assert.match(html,/<pre class="loreCode"><code>/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
});

test('lineage tree exposes roles, consorts and generational gaps',()=>{
 const html=renderLineageTree({id:'lineage:12:7',house:'Casa Teste',seat:'Asgorath',type:'Casa real',note:'Nota.',
  roots:[{name:'Rei Fundador',role:'rei',years:'1–2',note:'',spouse:'Rainha',children:[{name:'Herdeiro',role:'herdeiro',years:'n. 3',note:'',spouse:'',children:[]}]},
         {name:'⋯',role:'gerações intermediárias',years:'',note:'A crônica não registra todos os reinos.',spouse:'',children:[]}]});
 assert.match(html,/Casa Teste/);assert.match(html,/Rei Fundador/);assert.match(html,/⚭ Rainha/);
 assert.match(html,/loreGapCard/);assert.match(html,/data-toggle-node/);
 assert.match(html,/data-tree-search/);
});

test('tree statistics count names and generations',()=>{
 const stats=treeStats({roots:[{name:'A',children:[{name:'B',children:[{name:'C',children:[]}]}]},{name:'D',children:[]}]});
 assert.deepEqual(stats,{nodes:4,generations:3});
});

test('succession ruler positions reigns by year and groups houses',()=>{
 const html=renderSuccessionRuler({id:'succession:12:0',title:'Rei ou rainha',house:'Casa X',entries:[
  {name:'Primeiro',house:'Casa X',start:100,end:150,ongoing:false,label:'100–150',note:'Fundação'},
  {name:'Segundo',house:'Casa Y',start:150,end:200,ongoing:true,label:'150–presente',note:'Guerra'}]},{present:200});
 assert.match(html,/RÉGUA DE SUCESSÃO · 100–200/);
 assert.match(html,/data-house="Casa X"/);assert.match(html,/data-house="Casa Y"/);
 assert.match(html,/data-house-filter="Casa X"/);assert.match(html,/is-ongoing/);
 assert.match(html,/Segundo/);
});
