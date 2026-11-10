from pathlib import Path
import re,shutil
B=Path(__file__).resolve().parents[2]
def edit(name,fn):
 p=B/'app/dist'/name;s=p.read_text(encoding='utf-8');p.write_text(fn(s),encoding='utf-8')
def simulation(s):
 s="import {consumptionPlan} from './economy-consumption.js?v=43';\n"+s
 s=s.replace('arrivals:[],newCapital:0,', 'arrivals:[],householdConsumption:{},newCapital:0,')
 s=s.replace('function procure(buyer,g,required){', 'function procure(buyer,g,required,maxSpend=Infinity){')
 s=s.replace('buyer.account.coins/(q.shippedPrice*100)', 'Math.min(buyer.account.coins,maxSpend*100)/(q.shippedPrice*100)')
 s=s.replace('buyer.account.coins-=paid;', 'buyer.account.coins-=paid;maxSpend=Math.max(0,maxSpend-paid/100);')
 needle=' for(const n of nodes.values())for(const [g,units]of Object.entries(n.account.assets))'
 init=''' for(const n of nodes.values())if(data.calibration?.socialConsumption&&n.city?.socialProfile){
  n.household=consumptionPlan(n.city,model.edits.cycleDays);n.householdRemaining={food:n.household.basicBudget*.16,utilities:n.household.basicBudget*.04};
  const classWeights={peasant:1,modest:1.2,comfortable:1.6,wealthy:2,aristocratic:2.5};demands.get(n.id).utilities=n.household.classes.reduce((v,r)=>v+r.residents*classWeights[r.id],0)/1000*scale*.1;
  demands.get(n.id).luxury=0;last.householdConsumption[n.id]={basicBudget:n.household.basicBudget,basicSpent:0,luxuryBudget:n.household.luxuryBudget,luxurySpent:0,classes:n.household.classes.map(r=>({...r,luxurySpent:0,goods:{}}))};
 }
 function spendHousehold(n,g,wanted,budget,localOnly=false){
  const unit=Math.max(price(n,g),stock(n,g)>0?cost(n,g)/stock(n,g):0,.000001),own=Math.min(wanted,stock(n,g),budget/unit);let spent=own*unit,used=own;
  if(own){take(n,g,own);bump(last.consumption,n.id,g,own);}
  if(!localOnly&&wanted-used>1e-8&&budget-spent>1e-8){const before=n.account.coins;procure(n,g,Math.min(wanted-used,(budget-spent)/unit),budget-spent);spent+=(before-n.account.coins)/100;const arrived=Math.min(stock(n,g),wanted-used);if(arrived){take(n,g,arrived);bump(last.consumption,n.id,g,arrived);used+=arrived;}}
  return {used,spent};
 }
 function consumeLuxury(n){if(!n.household)return;const report=last.householdConsumption[n.id];for(const r of report.classes){const basket=r.basket.filter(([id])=>model.goods.has(id)&&!model.goods.get(id).inactive),weight=basket.reduce((n,[,w])=>n+w,0);for(const [id,w]of basket){const budget=r.luxuryBudget*w/weight;if(budget<=0)continue;const result=spendHousehold(n,id,budget/Math.max(.000001,price(n,id)),budget);r.luxurySpent+=result.spent;r.goods[id]=result.used;report.luxurySpent+=result.spent;}}}
'''
 assert needle in s;s=s.replace(needle,init+needle)
 needle='for(const g of options){if(left<1e-8)break;'
 s=s.replace(needle,"for(const g of options){if(left<1e-8)break;if(n.household&&['food','utilities'].includes(category)&&!g.good.durable){const result=spendHousehold(n,g.id,left/g.coverage,n.householdRemaining[category],localOnly);n.householdRemaining[category]=Math.max(0,n.householdRemaining[category]-result.spent);last.householdConsumption[n.id].basicSpent+=result.spent;left-=result.used*g.coverage;continue;}")
 s=s.replace("for(const n of foodOrder){for(const category of ['armor'", "for(const n of foodOrder){consumeLuxury(n);for(const category of ['armor'")
 p=B/'app/dist/economy-simulation.js';return s
edit('economy-simulation.js',simulation)
def scarcity(s):
 s="import {luxuryDemand,consumptionPlan} from './economy-consumption.js?v=43';\n"+s
 needle='  const available=new Map(supply);'
 s=s.replace(needle,"  if(data.calibration?.socialConsumption)for(const n of scope.members)if(n.city?.socialProfile)for(const [g,q]of luxuryDemand(n.city,data,model.edits.cycleDays))add(demand,g,q);\n"+needle)
 s=s.replace('luxury:s*.03', 'luxury:data.calibration?.socialConsumption&&scope.members.every(n=>!n.city||n.city.socialProfile)?0:s*.03')
 return s
edit('economy-scarcity.js',scarcity)
def ledger(s):
 marker=' function incomeHTML(cities)'
 fn=''' function consumptionHTML(c,cities){const reports=cities.map(b=>c.state.last.householdConsumption?.['city:'+b.i]).filter(Boolean);if(!reports.length)return '';const rows=['peasant','modest','comfortable','wealthy','aristocratic'].map(id=>reports.flatMap(r=>r.classes).filter(r=>r.id===id)).filter(r=>r.length);return `<details class="ledgerConsumption"><summary>Consumo por classe social</summary><p>Camponeses priorizam subsistência e não recebem orçamento de luxo. As compras de luxo usam parte da renda disponível de cada estrato, limitada pelo caixa real, estoques e acesso. Moradia, tributos e a maior parte da subsistência ficam abstraídos.</p><table class="ledgerTable"><thead><tr><th>Estrato</th><th>Orçamento de luxo</th><th>Gasto / reservado</th></tr></thead><tbody>${rows.map(list=>`<tr><td>${esc(list[0].name)}</td><td>${money(list.reduce((n,r)=>n+r.luxuryBudget,0))}</td><td>${money(list.reduce((n,r)=>n+r.luxurySpent,0))}</td></tr>`).join('')}</tbody></table><p>Parte dos pagamentos pode corresponder a cargas ainda em trânsito. Não há criação de moedas para financiar o orçamento.</p></details>`;}
'''
 assert marker in s;s=s.replace(marker,fn+marker).replace('${incomeHTML(r.cities)}','${incomeHTML(r.cities)}${consumptionHTML(c,r.cities)}')
 s=s.replace('Alimentos são atendidos antes das oficinas.', 'Alimentos comerciais são atendidos antes das oficinas. Só 5% da oferta e da necessidade básica de alimentos entram neste balanço; 95% ficam abstraídos como subsistência local.')
 return s
edit('economy-ledger.js',ledger)
def profile(s):return s.replace('Camponeses destinam cerca de 99% da renda estimada à subsistência.', 'Camponeses destinam cerca de 99% da renda estimada à subsistência e não têm orçamento de luxo. O consumo comercial usa renda e composição social.')
edit('profile-ui.js',profile)
for p in (B/'app/dist').glob('*.js'):p.write_text(re.sub(r'\?v=42\b','?v=43',p.read_text(encoding='utf-8')),encoding='utf-8')
p=B/'app/dist/index.html';p.write_text(p.read_text(encoding='utf-8').replace('app.js?v=42','app.js?v=43'),encoding='utf-8')
for p in (B/'app/dist').glob('*.js'):shutil.copy2(p,B.parent/'silvengard-atlas v2/dist'/p.name)
shutil.copy2(B/'app/dist/index.html',B.parent/'silvengard-atlas v2/dist/index.html')
