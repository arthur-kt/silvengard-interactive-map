from finish_v40_runtime import edit,B
from apply_approved_economy import ROOT,read,write

# Imported hostility is retained. Historical conquest does not identify a current
# declared war with every member of a port pact.
for base in [ROOT,ROOT.parent/'silvengard-atlas v2']:
 w=read(base/'app/dist/world.json');d=read(base/'app/dist/economy-source.json');w['activeWars']=[];d['activeWars']=[];w['localTradeAgreements']=d['localTradeAgreements'];d['calibration']['ruralSubsistence']=True
 for r in w['routes']:
  if r['id'] in ['land-19','land-35','land-45','land-52','land-53','land-76','land-aleravum'] or r['id'].startswith('review-'):r['authorConnection']=True;r['authorModified']=True
 config=read(base/'scenario-defaults.json')
 for b in w['cities']:
  if b['i'] in [14,75,138,140,143,149,179]:config['populations'][str(b['i'])]={'raw':b['population'],'inhabitants':b['demographics']['population'],'pairedCity':b['i']}
 write(base/'scenario-defaults.json',config);write(base/'app/dist/world.json',w);write(base/'app/dist/economy-source.json',d)

edit('economy-trade.js','!b||b.demographics?.populationKnown===false||b.state===17||','!b||b.state===17||')
edit('economy-simulation.js','function consumeCategory(n,category){const need=demands.get(n.id);let left=need[category];','function consumeCategory(n,category,portion=1,localOnly=false){const need=demands.get(n.id),original=need[category];let left=original*portion;')
edit('economy-simulation.js','procure(n,g.id,left/g.coverage);const amount=', 'if(!localOnly)procure(n,g.id,left/g.coverage);const amount=')
edit('economy-simulation.js','need[category]=Math.max(0,left);','need[category]=Math.max(0,original*(1-portion)+left);')
edit('economy-simulation.js',"for(const n of foodOrder)consumeCategory(n,'food');", "for(const n of foodOrder)consumeCategory(n,'food',1,true);for(let pass=0;pass<8;pass++)for(const n of foodOrder)consumeCategory(n,'food',1/(8-pass));")
edit('economy-simulation.js',' last.trades=[...trades.values()];',''' // Logistics and service wages return part of receipts to the local economy.
 for(const [id,a]of Object.entries(state.accounts)){if(!id.startsWith('carrier:')&&!id.startsWith('service:'))continue;const [kind,key]=id.split(':'),city=kind==='service'?nodes.get('city:'+key):null,recipients=city?[city]:[...nodes.values()].filter(n=>n.city&&n.state===+key),total=recipients.reduce((s,n)=>s+n.population,0);if(!total)continue;const budget=Math.floor(a.coins*.75);for(const n of recipients)serviceTransfer(a,n.id,Math.floor(budget*n.population/total),'service-wages',{payer:id});}
 last.trades=[...trades.values()];''')
edit('economy-simulation.js',"military:s*(b&&(b.citadel||b.settlementClass?.startsWith('Forte'))?.12:.025)","military:s*(b&&(b.citadel||b.settlementClass?.startsWith('Forte'))?.12:.025)*(b?.i===25&&Math.floor(start/90)%2===0?1.25:1)")
edit('economy-policy.js','multiplier=sellerState===buyerState?1:RELATION_RATES[relation]??1','multiplier=sellerState===buyerState?1:(D.localTradeAgreements||[]).find(a=>a.states.includes(sellerState)&&a.states.includes(buyerState))?.rate??RELATION_RATES[relation]??1')
edit('economy-ui.js',"<h4>Caixa e estoques por localidade</h4>","<p>Frete e serviços no ciclo: ${money(summary?.services||0)} em transferências, incluindo salários de transportadores e prestadores. Esses valores não são somados à produção de bens.</p><h4>Caixa e estoques por localidade</h4>")
edit('economy-ledger.js','const state=basis===', 'const state=basis===') if False else None
# Also include the non-exported subsistence lots in provincial capacity totals.
edit('economy-ledger.js',"provReports=new Map(ps.map(p=>[p.i,model.province(p.i,provinceAt)]));", "provReports=new Map(ps.map(p=>[p.i,model.province(p.i,provinceAt)]));const ruralNodes=economicNodes(D,data,model,ps,provinceAt);for(const p of ps){const r=provReports.get(p.i),rural=new Map();for(const n of ruralNodes.values())if(n.province?.i===p.i)for(const [g,q]of n.report.rural)rural.set(g,(rural.get(g)||0)+q);r.rural=rural;r.production=new Map(rural);for(const b of r.cities)for(const [g,q]of model.city(b).production)r.production.set(g,(r.production.get(g)||0)+q);}")
