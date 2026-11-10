import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMarkdown,eraEvents} from '../../app/dist/history-core.js';

test('authored prose renders tables, emphasis and lists without executing HTML',()=>{
 const html=renderMarkdown('**Memória** de *Silvengard*.\n\n| Data | Evento |\n|---|---|\n| 1277 | Presente |\n\n- Uma tradição\n\n<script>alert(1)</script>\n<img src=x onerror=alert(2)>');
 assert.match(html,/<strong>Memória<\/strong>/);assert.match(html,/<em>Silvengard<\/em>/);
 assert.match(html,/<table>/);assert.match(html,/<li>Uma tradição<\/li>/);
 assert.doesNotMatch(html,/<script|<img/);assert.match(html,/&lt;script&gt;/);
});
test('editorial comments and file provenance are not printed as player-facing prose',()=>{
 const html=renderMarkdown('<!-- atlas_cidade=Gugacon -->\n**Fonte original:** `source.md`.\n\nUma lenda ainda não confirmada.');
 assert.doesNotMatch(html,/atlas_cidade|source.md/);assert.match(html,/ainda não confirmada/);
});
test('timeline orders intervals by their beginning without changing date labels',()=>{
 const events=[{id:1,era:4,date:'1256 AQD'},{id:2,era:4,date:'c. 1252–1260 AQD'},{id:3,era:4,date:'1251–1255 AQD'},{id:4,era:1,date:'Tempo mítico'}];
 assert.deepEqual(eraEvents(events,4).map(e=>e.id),[3,2,1]);
 assert.equal(eraEvents(events,4)[1].date,'c. 1252–1260 AQD');
});
