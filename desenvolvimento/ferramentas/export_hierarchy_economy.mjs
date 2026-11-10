import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createProvinceModel} from '../../app/dist/province-core.js';
import {createEconomy} from '../../app/dist/economy-core.js';
import {simulateEconomy} from '../../app/dist/economy-simulation.js';
import {economicNodes} from '../../app/dist/economy-rural.js';
import {createMarkets,atWar} from '../../app/dist/economy-trade.js';

const base=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,base),'utf8'));
const W=read('dist/world.json'),data=read('dist/economy-source.json'),proposal=read('dist/province-proposal.json');
const before=JSON.stringify(W),pm=createProvinceModel(W,proposal);if(W.defaultProvinceEdits)pm.importData(W.defaultProvinceEdits);pm.pruneEmpty();
const provinces=pm.data.provinces,states=W.states.filter(s=>s.i),edits={...W.economyEdits,cycleDays:30},model=createEconomy(W,data,edits),markets=createMarkets(W,data,model,{provinces,provinceAt:pm.provinceAt});
const scenario=simulateEconomy(W,data,edits,null,provinces,pm.provinceAt,{instant:true}),last=scenario.last;
const collator=new Intl.Collator('pt-BR'),byName=(a,b)=>collator.compare(a.name.trim(),b.name.trim());
const num=n=>Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:2}),gold=n=>Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+' PO';
const esc=v=>String(v??'—').replace(/\r?\n/g,' ').replaceAll('|','\\|').replaceAll('<','&lt;').replaceAll('>','&gt;');
const sn=id=>W.states.find(s=>s.i===id)?.name.trim()||'Sem estado',cityKey=b=>'city:'+b.i,provKey=p=>'province:'+p.i;
const production=id=>new Map(Object.entries(last.production[id]||{}).map(([g,n])=>[+g,n]));
const sum=maps=>{const rows=new Map();for(const map of maps)for(const [g,n]of map)rows.set(g,(rows.get(g)||0)+n);return rows;};
const value=rows=>[...rows].reduce((s,[g,n])=>s+n*model.price(g),0);
const cityReports=new Map(W.cities.map(b=>[b.i,model.city(b)])),provinceReports=new Map(provinces.map(p=>[p.i,model.province(p.i,pm.provinceAt)]));
const citiesOf=p=>W.cities.filter(b=>pm.provinceAt(b.cell)?.i===p.i).sort(byName);
const unassigned=W.cities.filter(b=>!pm.provinceAt(b.cell));
const nodes=economicNodes(W,data,model,provinces,pm.provinceAt);const idsForProvince=p=>[...[...nodes.values()].filter(n=>n.province?.i===p.i).map(n=>n.id),...citiesOf(p).map(cityKey)];
const idsForState=s=>[...nodes.values()].filter(n=>n.state===s.i).map(n=>n.id);
const actual=ids=>sum(ids.map(production));
function tradeBalance(ids){const set=new Set(ids);let imports=0,exports=0;for(const t of last.trades){if(set.has(t.to)&&!set.has(t.from))imports+=t.coins;if(set.has(t.from)&&!set.has(t.to))exports+=t.coins;}return {imports:imports/100,exports:exports/100};}
function stateCapacity(s){return sum([...W.cities.filter(b=>b.state===s.i).map(b=>cityReports.get(b.i).production),...provinces.filter(p=>p.state===s.i).map(p=>provinceReports.get(p.i).rural)]);}
function table(out,headers,rows){out.push('| '+headers.map(esc).join(' | ')+' |','| '+headers.map(()=>'---').join(' | ')+' |');for(const r of rows)out.push('| '+r.map(esc).join(' | ')+' |');out.push('');}
function goodsTable(out,rows,limit=8,market=null){const sorted=[...rows].filter(([g,n])=>n>1e-8).sort((a,b)=>b[1]*model.price(b[0])-a[1]*model.price(a[0]));if(!sorted.length){out.push('Sem produção estimada neste recorte.','');return;}table(out,['Bem','Quantidade / 30 dias','Valor produzido · preços-base',...(market?['Preço local por unidade']:[])],sorted.slice(0,limit).map(([g,n])=>[model.goods.get(g).name,`${num(n)} ${model.goods.get(g).unit}`,gold(n*model.price(g)),...(market?[gold(markets.price(market.center,g))]:[])]));if(sorted.length>limit)out.push(`Outros ${sorted.length-limit} bens estão incluídos no valor total.`,'');}
function summaries(out,capacity,rows,ids){const balance=tradeBalance(ids);out.push(`- **Valor produzido estimado / 30 dias:** ${gold(value(rows))}.`,`- **Capacidade bruta / 30 dias:** ${gold(value(capacity))}.`,`- **Compras externas estimadas:** ${gold(balance.imports)}.`,`- **Vendas externas estimadas:** ${gold(balance.exports)}.`,'');}
const date='9 de novembro de 2026',summary=`${states.length} estados · ${provinces.length} províncias · ${W.cities.length} cidades e localidades`;

const hierarchy=['# Silvengard — Estados, províncias e cidades','',`Atualizado em ${date}.`,`**${summary}.**`,'','Nomes e vínculos da edição padrão atual do Atlas. Estados, províncias e cidades estão em ordem alfabética. Localidades desabitadas também constam da relação. Uma província sem cidade é indicada expressamente.',''];
const seen=new Set();
for(const s of [...states].sort(byName)){
 const ps=provinces.filter(p=>p.state===s.i).sort(byName);hierarchy.push('## '+s.name.trim(),'');
 for(const p of ps){hierarchy.push('### '+p.name,'');const cities=citiesOf(p);for(const b of cities){assert.equal(b.state,s.i);assert.ok(!seen.has(b.i));seen.add(b.i);hierarchy.push('- '+b.name);}if(!cities.length)hierarchy.push('Sem cidades ou localidades urbanas cadastradas.');hierarchy.push('');}
 const extra=unassigned.filter(b=>b.state===s.i);if(extra.length){hierarchy.push('### Localidades sem província atribuída','');for(const b of extra.sort(byName)){seen.add(b.i);hierarchy.push('- '+b.name);}hierarchy.push('');}
 if(!ps.length&&!extra.length)hierarchy.push('Sem províncias ou cidades cadastradas.','');
}
assert.equal(seen.size,W.cities.length,'Every city must appear once in the hierarchy');

const economy=['# Silvengard — Economia dos estados, províncias, cidades e mercados','',`Atualizado em ${date}.`,`**${summary} · ${markets.regions.length} mercados regionais · ${data.goods.length} bens.**`,'','## Como ler os valores','','Este documento apresenta o panorama estimado de **30 dias**, calculado com os parâmetros, relações diplomáticas e rotas da edição padrão atual. A consulta não avança ciclos, não modifica o mapa e não utiliza estoques de um ciclo futuro.','',
'- **Valor produzido estimado:** soma dos bens efetivamente produzidos no cálculo de referência, após as compras de insumos disponíveis.','- **Capacidade bruta:** o que as oficinas e áreas rurais poderiam produzir com toda a capacidade registrada; não garante insumos ou compradores.','- Todos os totais de produção usam os **mesmos preços-base em PO**, permitindo somar cidades e províncias. Os preços regionais aparecem separadamente nos mercados.','- Quantidades de bens diferentes não são somadas: cargas, lingotes, cabeças e outras unidades permanecem separados.','- A produção estadual reúne cidades e extração rural uma vez. A provincial reúne suas cidades e seu setor rural. Não se deve somar novamente os subtotais às cidades.','- Compras e vendas externas consideram apenas transações que atravessam o limite do estado, província ou cidade; comércio interno não é contado como venda externa. Não são valores de lucro, impostos ou PIB.','- Valar permanece sem atividade. Localidades sem habitantes não produzem; Adhuc Vivere não produz alimentos ou recursos rurais.','- Preços, capacidades, consumo e fretes são parâmetros de cenário. Tarifas aduaneiras, pirataria, embargos, bloqueios de portos e preços por escassez são calculados. As populações incluem a cidade e o entorno rural, sem censo adicional. Os perfis sociais estimam renda familiar e trocas em espécie; não creditam moedas automaticamente. Inflação monetária e contracheques individuais não são modelados.','',
'**Moedas:** 1 PO = 10 PP = 100 PC; 1 PL = 10 PO.','',
'## Panorama mundial',''];
const globalCapacity=sum(states.map(stateCapacity)),globalActual=actual(Object.keys(last.production));
economy.push(`- **Valor produzido estimado:** ${gold(value(globalActual))}.`,`- **Capacidade bruta:** ${gold(value(globalCapacity))}.`,`- **Compras e vendas realizadas no cenário:** ${gold(last.trades.reduce((s,t)=>s+t.coins,0)/100)} em ${num(last.trades.length)} transferências.`,`- **Tarifas arrecadadas no cenário:** ${gold(scenario.history.at(-1).tariffs||0)}.`,`- **Perdas por pirataria, a preços-base:** ${gold(scenario.history.at(-1).lostValue||0)}.`,`- **Localidades urbanas economicamente ativas:** ${W.cities.filter(b=>b.state!==17&&b.demographics?.population>0).length}.`,'');
table(economy,['Estado','Províncias','Cidades','Valor produzido estimado / 30 dias','Capacidade bruta / 30 dias'],[...states].sort(byName).map(s=>[sn(s.i),provinces.filter(p=>p.state===s.i).length,W.cities.filter(b=>b.state===s.i).length,gold(value(actual(idsForState(s)))),gold(value(stateCapacity(s)))]));
economy.push('## Economia por estado, província e cidade','');
const economicSeen=new Set();
function describeCity(b){const r=cityReports.get(b.i),rows=production(cityKey(b)),market=b.state!==17&&b.demographics.population>0?markets.cityMarket(b):null;economicSeen.add(b.i);economy.push('##### '+b.name,'',`**Habitantes:** ${num(b.demographics?.population)}. **Mercado:** ${market?.name||'Sem atividade comercial'}.`,'');if(r.note)economy.push(r.note,'');summaries(economy,r.production,rows,[cityKey(b)]);const gids=[...new Set([...r.production.keys(),...rows.keys()])].sort((a,b)=>(rows.get(b)||0)*model.price(b)-(rows.get(a)||0)*model.price(a));if(gids.length)table(economy,['Bem','Produção estimada / 30 dias','Valor produzido · preços-base','Capacidade / 30 dias'],gids.map(g=>[model.goods.get(g).name,`${num(rows.get(g))} ${model.goods.get(g).unit}`,gold((rows.get(g)||0)*model.price(g)),`${num(r.production.get(g))} ${model.goods.get(g).unit}`]));else economy.push('Sem produção ativa.','');if(r.inputs.size)economy.push('**Principais insumos de fabricação na capacidade completa:** '+[...r.inputs].sort((a,b)=>b[1]*model.price(b[0])-a[1]*model.price(a[0])).slice(0,5).map(([g,n])=>`${model.goods.get(g).name} (${num(n)} ${model.goods.get(g).unit})`).join('; ')+'.','');}
for(const s of [...states].sort(byName)){
 economy.push('### '+s.name.trim(),'');const ps=provinces.filter(p=>p.state===s.i).sort(byName),bs=W.cities.filter(b=>b.state===s.i);economy.push(`**${ps.length} províncias · ${bs.length} cidades e localidades.**`,'');summaries(economy,stateCapacity(s),actual(idsForState(s)),idsForState(s));economy.push('**Principais bens produzidos no estado:**','');goodsTable(economy,actual(idsForState(s)));
 for(const p of ps){const r=provinceReports.get(p.i),cities=citiesOf(p);economy.push('#### '+p.name,'',`**${cities.length} cidades e localidades.**`,'');summaries(economy,r.production,actual(idsForProvince(p)),idsForProvince(p));economy.push('**Principais bens da província, incluindo suas cidades:**','');goodsTable(economy,actual(idsForProvince(p)),6);const rural=production(provKey(p));economy.push('**Setor rural / extração da província:**','');if(rural.size)goodsTable(economy,rural,Infinity);else economy.push('Sem produção rural estimada.','');for(const b of cities)describeCity(b);if(!cities.length)economy.push('Sem cidades ou localidades urbanas cadastradas.','');}
 const extra=unassigned.filter(b=>b.state===s.i);if(extra.length){economy.push('#### Localidades sem província atribuída','');for(const b of extra.sort(byName))describeCity(b);}
}
assert.equal(economicSeen.size,W.cities.length);

economy.push('## Mercados regionais','','Mercados são agrupamentos comerciais independentes das fronteiras políticas. Um estado pode conter cidades de vários mercados, e um mercado pode reunir cidades de vários estados. Os vínculos e preços seguem a edição atual do Atlas. O estado de uma sede não representa todo o território do mercado.','',
'As províncias não são transferidas integralmente para um mercado: as cidades conservam seus vínculos. Os sítios e as comunidades rurais seguem o mercado de sua posição, com acesso terrestre ao núcleo local, sem transferir toda a produção para a maior cidade. Setores sem sede urbana acessível são identificados à parte.','',
'A guerra bloqueia compras bilaterais e o trânsito terrestre por território inimigo. Embargos bloqueiam os bens escolhidos; bloqueios navais fecham acessos marítimos. A pirataria pode causar perdas de carga, especialmente perto de Goblinburgo e Drácon. Amizade concede 5% e aliança 10% de desconto, respeitando o piso de custo; desconfiança acrescenta 15%. O comprador compara preço na origem e frete: inicialmente '+num(model.edits.landFreight*100)+'% por km em terra e '+num(model.edits.seaFreight*100)+'% por km no mar.','');
const accountMarket=new Map(),accountState=new Map();
for(const b of W.cities){if(b.state===17||!(b.demographics?.population>0))continue;accountMarket.set(cityKey(b),markets.cityMarket(b)?.i);accountState.set(cityKey(b),b.state);}
for(const n of nodes.values())if(n.province){accountMarket.set(n.id,n.market);accountState.set(n.id,n.state);}
for(const m of [...markets.regions].sort(byName)){
 const cities=W.cities.filter(b=>accountMarket.get(cityKey(b))===m.i).sort(byName),ids=[...accountMarket].filter(([id,market])=>market===m.i).map(([id])=>id),rows=actual(ids),balance=tradeBalance(ids),represented=[...new Set(ids.map(id=>accountState.get(id)))].filter(i=>i!==17&&i!=null).map(id=>({id,ids:ids.filter(key=>accountState.get(key)===id),cities:cities.filter(b=>b.state===id)}));
 represented.sort((a,b)=>value(actual(b.ids))-value(actual(a.ids))||b.cities.length-a.cities.length);
 economy.push('### '+m.name,'',`**Sede:** ${m.center.name}, em ${sn(m.center.state)}. **${cities.length} cidades ativas · ${represented.length} estados participantes.**`,'',`- **Valor produzido estimado pelos participantes:** ${gold(value(rows))}, a preços-base.`,`- **Valor da mesma produção a preços locais de referência:** ${gold([...rows].reduce((s,[g,n])=>s+n*markets.price(m.center,g),0))}.`,`- **Compras de outros mercados:** ${gold(balance.imports)}.`,`- **Vendas para outros mercados:** ${gold(balance.exports)}.`,'','**Estados participantes, ordenados pela produção vinculada a este mercado:**','');
 table(economy,['Estado','Cidades no mercado','Valor produzido vinculado / 30 dias'],represented.map(s=>[sn(s.id),s.cities.length,gold(value(actual(s.ids)))]));
 economy.push('**Principais produtos dos participantes:**','');goodsTable(economy,rows,10,m);
 economy.push('**Cidades participantes por estado:**','');for(const s of represented)economy.push('- **'+sn(s.id)+'**: '+s.cities.map(b=>b.name).join('; ')+'.');economy.push('');
 const blocked=[];for(let i=0;i<represented.length;i++)for(let j=i+1;j<represented.length;j++)if(atWar(W,model.edits,represented[i].id,represented[j].id))blocked.push(sn(represented[i].id)+' × '+sn(represented[j].id));if(blocked.length)economy.push('**Compras bilaterais bloqueadas por guerra entre participantes:** '+blocked.join('; ')+'.','');
}
const orphanIds=[...Object.keys(last.production)].filter(id=>accountMarket.get(id)==null);if(orphanIds.length)economy.push('### Produção sem vínculo a um mercado ativo','',`Valor estimado: ${gold(value(actual(orphanIds)))}. Setores rurais sem cidade de acesso: ${orphanIds.map(id=>provinces.find(p=>provKey(p)===id)?.name||id).join('; ')}.`,'');
const marketValue=markets.regions.reduce((total,m)=>total+value(actual([...accountMarket].filter(([id,market])=>market===m.i).map(([id])=>id))),0)+value(actual(orphanIds));
assert.ok(Math.abs(marketValue-value(globalActual))<1e-6,'Market totals must reconcile without duplicate rural output');
const provincialActual=states.reduce((s,state)=>s+value(actual(idsForState(state))),0);assert.ok(Math.abs(provincialActual-value(globalActual))<1e-6);assert.equal(JSON.stringify(W),before,'Export must not modify the canonical world');
fs.writeFileSync(new URL('Silvengard-Estados-Provincias-Cidades.md',base),hierarchy.join('\n')+'\n');
fs.writeFileSync(new URL('Silvengard-Economia-e-Mercados.md',base),economy.join('\n')+'\n');
console.log(JSON.stringify({states:states.length,provinces:provinces.length,cities:seen.size,unassigned:unassigned.length,markets:markets.regions.length,capacity:value(globalCapacity),estimatedProduction:value(globalActual),trade:last.trades.reduce((s,t)=>s+t.coins,0)/100,lines:[hierarchy.length,economy.length],verified:'All cities unique, state and market totals reconcile; canonical world unchanged'}));
