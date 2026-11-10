from finish_v40_runtime import edit,B

edit('economy-policy.js',"(D.localTradeAgreements||[]).find(a=>a.states.includes(sellerState)&&a.states.includes(buyerState))?.rate??RELATION_RATES[relation]??1", "(RELATION_RATES[relation]??1)*((D.localTradeAgreements||[]).find(a=>a.states.includes(sellerState)&&a.states.includes(buyerState))?.rate??1)")
p=B/'tools/export_hierarchy_economy.mjs';s=p.read_text(encoding='utf-8')
s=s.replace("import {createMarkets,atWar}","import {economicNodes} from '../dist/economy-rural.js';\nimport {createMarkets,atWar}")
s=s.replace('null,provinces,pm.provinceAt),last','null,provinces,pm.provinceAt,{instant:true}),last')
s=s.replace("const idsForProvince=p=>[provKey(p),...citiesOf(p).map(cityKey)];", "const nodes=economicNodes(W,data,model,provinces,pm.provinceAt);const idsForProvince=p=>[...[...nodes.values()].filter(n=>n.province?.i===p.i).map(n=>n.id),...citiesOf(p).map(cityKey)];")
s=s.replace("const idsForState=s=>[...W.cities.filter(b=>b.state===s.i).map(cityKey),...provinces.filter(p=>p.state===s.i).map(provKey)];", "const idsForState=s=>[...nodes.values()].filter(n=>n.state===s.i).map(n=>n.id);")
s=s.replace("8 de novembro de 2026","9 de novembro de 2026")
a=s.index('for(const p of provinces){const hub=citiesOf(p)');z=s.index('for(const m of [...markets.regions]',a)
s=s[:a]+"for(const n of nodes.values())if(n.province){accountMarket.set(n.id,n.market);accountState.set(n.id,n.state);}\n"+s[z:]
s=s.replace('Para agregar o setor rural, utiliza-se o mercado da maior cidade da província, o mesmo centro de acesso usado na simulação.', 'Os sítios e as comunidades rurais seguem o mercado de sua posição, com acesso terrestre ao núcleo local, sem transferir toda a produção para a maior cidade.')
p.write_text(s,encoding='utf-8')
