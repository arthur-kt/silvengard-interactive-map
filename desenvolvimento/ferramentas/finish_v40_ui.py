from pathlib import Path
from finish_v40_runtime import edit,replace_body,B

edit('economy-trade.js','!b||b.state===17||','!b||b.demographics?.populationKnown===false||b.state===17||')
edit('economy-ledger.js',"function owner(account){const [kind,id]=account.split(':');return kind==='state'?+id:kind==='city'?", "function owner(account){const [kind,id]=account.split(':');return ['state','carrier'].includes(kind)?+id:['city','service'].includes(kind)?")
edit('economy-ledger.js',"new Set(['province:'+view.id,...current().provReports.get(view.id).cities.map(b=>'city:'+b.i)])", "new Set([...Object.keys(current().state.accounts).filter(k=>k==='province:'+view.id||k.startsWith('rural:'+view.id+':')),...current().provReports.get(view.id).cities.map(b=>'city:'+b.i)])")
edit('economy-ledger.js','${num(b.demographics.population)} habitantes','${esc(populationDescription(b))}')
edit('economy-ledger.js','${num(b.demographics.population)} hab.','${esc(populationDescription(b))}')
replace_body('economy-ledger.js','  if(!c.quoteNodes){','  return \'<table class="ledgerTable"><thead><tr><th>Mercado</th>',"  if(!c.quoteNodes){c.quoteNodes=economicNodes(D,data,c.model,provinces(),provinceAt);for(const n of c.quoteNodes.values())n.city??=n.cityReference;const graph=tradeGraph(D,c.quoteNodes,c.edits);c.quotePaths=graph.paths;c.waterQuotePaths=graph.waterPaths;}\n")
edit('economy-ledger.js',"path=c.quotePaths.get('city:'+m.center.i)?.get(id)","path=(g.transport?c.waterQuotePaths:c.quotePaths).get('city:'+m.center.i)?.get(id)")
edit('economy-ledger.js',"<option value=\"Enemy\">Em guerra</option>","<option value=\"Rival\">Rivalidade</option><option value=\"Enemy\">Inimizade</option><option value=\"War\">Em guerra</option>")
edit('economy-ledger.js',"'Estimativa de 30 dias, sem avançar o tempo.","'Estimativa de 30 dias, sem avançar o tempo.") if False else None
edit('economy-ledger.js','<h3>Estados</h3>${sorted(D.states', '<details><summary>População e abastecimento</summary><p>${num(c.state.last.population?.residents)} moradores permanentes · ${num(c.state.last.population?.itinerants)} itinerantes · ${num(c.state.last.population?.rural)} moradores rurais estimados. Visitantes deste período: ${num(c.state.last.population?.visitors)}.</p><p>Rural: estimativa de densidade por área habitável, não censo histórico. Alimentos são atendidos antes das oficinas. O panorama é uma taxa mensal acessível; os ciclos salvos registram chegadas e cargas em trânsito.</p></details><h3>Estados</h3>${sorted(D.states')
edit('economy-ledger.js','Lotes sem peso padronizado.','Pesos e cobertura alimentar definidos na ficha do produto; valores de referência do cenário.')
edit('economy-ledger.js','<h3>Insumos por unidade</h3>','<p class="muted">${g.massTonnes?num(g.massTonnes)+\' t por unidade · \':\'\'}${g.foodPeopleDays?num(g.foodPeopleDays)+\' pessoas-dia de alimentação · \':\'\'}${g.durable?\'Bem durável: estoque instalado e desgaste anual, sem consumo integral mensal.\':\'\'}</p><h3>Insumos por unidade</h3>')
edit('economy-ledger.js','${productRows(production,c)}<details>', '${productRows(production,c)}${serviceHTML(c,ids)}<details>')
edit('economy-ledger.js',' function goodsHTML(c){', ''' function serviceHTML(c,ids){const rows=(c.state.last.services||[]).filter(r=>ids.has(r.payer)||ids.has(r.receiver));return rows.length?'<details><summary>Serviços e transporte · '+money(rows.reduce((s,r)=>s+r.coins,0)/100)+'</summary><p>Pagamentos entre contas; não entram no valor bruto dos bens.</p>'+rows.slice(0,50).map(r=>'<p>'+esc(an(r.payer||''))+' → '+esc(an(r.receiver))+' · '+money(r.coins/100)+'</p>').join('')+'</details>':'';}
 function goodsHTML(c){''')
# Names for auxiliary accounts and rural market shares remain intelligible.
edit('economy-ledger.js',"an=id=>id.startsWith('state:')?", "an=id=>id.startsWith('carrier:')?'Transportadores · '+sn(+id.split(':')[1]):id.startsWith('service:')?'Serviços · '+title(D.cities.find(b=>b.i===+id.split(':')[1])||{name:'Localidade'}):id.startsWith('state:')?")
edit('economy-ledger.js',"nav(r.id.split(':')[0],+r.id.split(':')[1]", "nav(r.id.startsWith('rural:')?'province':r.id.split(':')[0],+r.id.split(':')[1]")
edit('economy-price-comparison.js'," const nodes=new Map();for(const b of D.cities.filter(b=>b.state!==17&&b.demographics?.population>0))nodes.set('city:'+b.i,{id:'city:'+b.i,state:b.state,city:b});", " const nodes=economicNodes(D,c.model.data,c.model,provinces,c.provinceAt||(()=>null));for(const n of nodes.values())n.city??=n.cityReference;")
# Replace the old province/hub reconstruction; provinceAt is carried by the ledger context.
replace_body('economy-price-comparison.js',' for(const p of provinces){',' const {paths}=tradeGraph', ' ')
edit('economy-price-comparison.js','const {paths}=tradeGraph','const {paths,waterPaths}=tradeGraph')
edit('economy-price-comparison.js',"const path=paths.get('city:'+buyer.i)?.get(id)","const path=(c.model.goods.get(goodId)?.transport?waterPaths:paths).get('city:'+buyer.i)?.get(id)")
edit('economy-ledger.js','cache={edits,model,markets,','cache={provinceAt,edits,model,markets,')
# Bind every rural account to its own territorial market and aggregate it once.
replace_body('economy-map-core.js',' for(const p of provinces){const r=c.provReports','  const rows=new Map();', ''' const ruralNodes=economicNodes(D,c.model.data,c.model,provinces,provinceAt);
 for(const n of ruralNodes.values())if(n.province){bind(n.id,n.state,n.market);const m=marketInfo.get(n.market);if(m&&!m.provinces.some(p=>p.i===n.province.i))m.provinces.push(n.province);if(m&&!m.provinceParticipants.has(n.province.i))m.provinceParticipants.set(n.province.i,{province:n.province,cities:[]});}
 for(const p of provinces){const r=c.provReports.get(p.i);
''')
edit('economy-map-core.js',"['province:'+p.i,...(r?.cities||[]).map(b=>'city:'+b.i)]", "[...[...ruralNodes.values()].filter(n=>n.province?.i===p.i).map(n=>n.id),...(r?.cities||[]).map(b=>'city:'+b.i)]")
edit('profile-ui.js',"${fact('Religião',b.faith?.name", "${b.demographics?.populationKnown===false?fact('População','Desconhecida'):''}${b.demographics?.itinerantPopulation?fact('Comunidades itinerantes vinculadas',number(b.demographics.itinerantPopulation)):''}${b.seasonalVisitors?fact('Visitantes sazonais · pico estimado',number(b.seasonalVisitors)):''}${fact('Religião',b.faith?.name")
edit('profile-ui.js',"${fact('População',number(s.originalPopulation?.total))}","${fact('Moradores das localidades',number(D.cities.filter(b=>b.state===s.i).reduce((n,b)=>n+(b.demographics?.populationKnown===false?0:b.demographics?.population||0),0)))}")
edit('economy-policy-ui.js','rivalidade: +20%.','rivalidade: +20%; inimizade: +35%.')
edit('economy-ui.js','recebidos pelo fornecedor; compras entre inimigos','recebidos por transportadores; compras entre estados em guerra')
edit('economy-ui.js','<h4>Caixa e estoques por localidade</h4>','<details><summary>Cargas em trânsito · ${state.shipments.length}</summary>${state.shipments.map(t=>`<p>${esc(names(t.from))} → ${esc(names(t.to))}: ${num(t.units)} ${esc(model.goods.get(t.good)?.name)} · chegada em ${num(Math.max(0,t.arrivalDay-state.elapsedDays))} dias</p>`).join(\'\')||\'<p>Nenhuma carga pendente.</p>\'}</details><h4>Caixa e estoques por localidade</h4>')
edit('economy-ui.js',"return kind==='state'?'Alfândega", "return kind==='carrier'?'Transportadores · '+(D.states.find(s=>s.i===+key)?.name.trim()||key):kind==='service'?'Serviços · '+cityName(+key):kind==='state'?'Alfândega")
edit('economy-ui.js',"||'—'}</td><td>${last?.demand", "||'—'}${Object.keys(a.assets||{}).length?'<small>Instalado: '+Object.entries(a.assets).map(([g,n])=>esc(model.goods.get(+g)?.name)+': '+num(n)).join(' · ')+'</small>':''}</td><td>${last?.demand")
edit('economy-ui.js','Os lotes não têm peso padronizado.','Pesos e cobertura alimentar são referências de calibração do cenário; a ficha de cada bem mostra suas unidades.')
edit('economy-ui.js',"research:'Pesquisa arcana'", "research:'Pesquisa arcana',fleet:'Frota marítima',inlandFleet:'Frota fluvial/lacustre'")
