from pathlib import Path
import re
B=Path(__file__).resolve().parents[2]
def edit(name,old,new):
 p=B/'app/dist'/name;s=p.read_text(encoding='utf-8')
 if old not in s:
  if new in s:return
  raise ValueError((name,old[:90]))
 p.write_text(s.replace(old,new),encoding='utf-8')

# The hinterland still produces, but its residents are already in the city census.
edit('economy-rural.js',"const density=landDensity(c);if(!density", "const density=data.calibration?.populationScope==='city-and-hinterland'?0:landDensity(c);if(!density")
edit('city-editor-core.js',"export const CITY_FLAGS=", "import {cleanSocialProfile} from './economy-income.js?v=41';\nexport const CITY_FLAGS=")
edit('city-editor-core.js'," const e={};", " const e={};if(raw.socialProfile!==undefined)e.socialProfile=cleanSocialProfile(raw.socialProfile);")
edit('city-editor-core.js'," if(e.culture!==undefined)b.culture=e.culture;", " if(e.socialProfile!==undefined)b.socialProfile=e.socialProfile;\n if(e.culture!==undefined)b.culture=e.culture;")
edit('city-editor-ui.js',"const esc=", "import {SOCIAL_CLASSES,defaultSocialProfile} from './economy-income.js?v=41';\nconst esc=")
edit('city-editor-ui.js','<fieldset><legend>Características</legend>', '''<details class="socialEditor"><summary>Composição social e renda estimada</summary><p>Percentuais da população da cidade e de seu entorno. Estimativa inicial editável; a soma deve ser 100%.</p>${SOCIAL_CLASSES.map(c=>`<label>${c.name} · %<input data-social-class="${c.id}" type="number" min="0" max="100" step="0.1" value="${(b.socialProfile||defaultSocialProfile(b)).shares[c.id]}"></label>`).join('')}<label>Pessoas por unidade familiar de renda<input id="socialHouseholdSize" type="number" min="1" max="12" step="0.1" value="${(b.socialProfile||defaultSocialProfile(b)).householdSize}"></label></details><fieldset><legend>Características</legend>''')
edit('city-editor-ui.js',"const edit=cleanCityEdit({inhabitants:", "const socialProfile={shares:Object.fromEntries([...document.querySelectorAll('[data-social-class]')].map(el=>[el.dataset.socialClass,Number(el.value)])),householdSize:Number($('#socialHouseholdSize').value),estimated:false};\n const edit=cleanCityEdit({socialProfile,inhabitants:")
edit('profile-ui.js',"const esc=", "import {incomeReport} from './economy-income.js?v=41';\nconst esc=")
edit('profile-ui.js'," const features={", " const income=incomeReport(b);\n const features={")
edit('profile-ui.js','<h3>Cultura e sociedade</h3>','<h3>Cultura e sociedade</h3>${fact(\'População considerada\',\'Cidade e entorno rural\')}${b.demographics?.populationKnown===false?\'\':fact(\'Renda monetária estimada / mês\',number(income.cash)+\' PO\')+fact(\'Sobra estimada após despesas básicas\',number(income.disposable)+\' PO\')}')
edit('profile-ui.js','<summary>Relações diplomáticas · ${s.diplomacy.length}</summary>', '<summary>Relações diplomáticas · ${s.diplomacy.length}</summary><button id="editStateDiplomacy">Editar relações diplomáticas</button>')
edit('app.js',"$$('[data-diplomacy-state]').forEach(el=>el.onclick=()=>selectState(+el.dataset.diplomacyState,true));", "$$('[data-diplomacy-state]').forEach(el=>el.onclick=()=>economy?.open({diplomacyStateId:id,diplomacyTargetId:+el.dataset.diplomacyState}));$('#editStateDiplomacy').onclick=()=>economy?.open({diplomacyStateId:id});")
edit('economy-ledger.js',"const esc=", "import {incomeReport,aggregateIncome} from './economy-income.js?v=41';\nimport {tradeRelation} from './economy-policy.js?v=41';\nconst esc=")
edit('economy-ledger.js',"${productRows(production,c)}${serviceHTML(c,ids)}", "${incomeHTML(r.cities)}${productRows(production,c)}${serviceHTML(c,ids)}")
edit('economy-ledger.js',' function serviceHTML(c,ids){', ''' function incomeHTML(cities){const a=aggregateIncome(cities);return `<details class="ledgerIncome" open><summary>Composição social e poder de compra · estimativa</summary><p>A população inclui a cidade e o entorno rural. Renda por unidade familiar; não se atribui salário a cada dependente. Percentuais e tamanho familiar são editáveis na ficha da cidade.</p>${metrics([[money(a.gross),'Renda total de referência / mês'],[money(a.cash),'Parcela em moeda estimada'],[money(a.disposable),'Sobra após despesas básicas']])}<p class="muted">Inclui ${money(a.nonCash)} de valor estimado em espécie, autoconsumo e trocas. Esses valores não são receita do estado nem crédito automático ao caixa.</p>${cities.length===1?`<table class="ledgerTable"><thead><tr><th>Estrato</th><th>População</th><th>Parcela</th><th>Renda em moeda</th></tr></thead><tbody>${incomeReport(cities[0]).rows.map(r=>`<tr><td>${r.name}</td><td>${num(r.residents)}</td><td>${num(r.share)}%</td><td>${money(r.cash)}</td></tr>`).join('')}</tbody></table>`:''}</details>`;}
 function serviceHTML(c,ids){''')
edit('economy-ledger.js','${num(c.state.last.population?.rural)} moradores rurais estimados.', 'entorno rural incluído nos totais das localidades.')
edit('economy-ledger.js','Rural: estimativa de densidade por área habitável, não censo histórico.', 'Cada localidade representa a cidade e suas redondezas. Não há um segundo censo rural.')
edit('economy-ledger.js',"function open(target={}){", "function open(target={}){") if False else None
edit('economy-ledger.js',"panel.hidden=false;section=target.marketId?", "panel.hidden=false;if(target.diplomacyStateId){diploA=target.diplomacyStateId;diploB=target.diplomacyTargetId||D.states.find(s=>s.i&&s.i!==17&&s.i!==diploA)?.i;diploRelation=tradeRelation(D,work.exportData(),diploA,diploB);}section=target.diplomacyStateId?'diplomacy':target.marketId?")
edit('economy-ledger.js',"diploA=a;diploB=b;$('#econRelationNow')", "diploA=a;diploB=b;diploRelation=tradeRelation(D,c.edits,a,b);$('#econRelation').value=diploRelation;$('#econRelationNow')")
# Reference costs use specified work, with a compatibility fallback for uncalibrated goods.
edit('economy-policy.js',"if(!good?.recipes?.length)return base*.5;", "const labour=(good?.labourHours||0)*.25+(good?.unskilledHours||0)*.025;if(!good?.recipes?.length)return labour||base*.5;")
edit('economy-policy.js','return Math.min(...recipes)+base*.15;', 'return Math.min(...recipes)+(labour||base*.15);')
# Only actual private liquidity is seeded. Reference incomes are never minted every cycle.
edit('economy-simulation.js',"import {seasonalVisitors}", "import {incomeReport} from './economy-income.js?v=41';\nimport {seasonalVisitors}")
edit('economy-simulation.js','const account=(id,pop=0)=>{if(!state.accounts[id]){const coins=Math.round(pop*model.edits.initialGoldPerResident*100);', "const account=(id,pop=0)=>{if(!state.accounts[id]){const n=nodes.get(id),income=data.calibration?.useSocialLiquidity&&n?.city?incomeReport(n.city):null;const coins=Math.round((income?income.cash*(data.calibration.liquidityMonths??.25)*model.edits.initialGoldPerResident:pop*model.edits.initialGoldPerResident)*100);")
edit('economy-simulation.js',"if(!j.recipe.length)produce(n,j.good,j.capacity);", "if(!j.recipe.length&&!Object.keys(model.goods.get(j.good)?.catalysts||{}).length)produce(n,j.good,j.capacity);")
edit('economy-simulation.js',"for(const r of j.recipe)procure(j.node,r.good,target*r.units);let amount=target", "for(const [g,units]of Object.entries(model.goods.get(j.good)?.catalysts||{})){procure(j.node,+g,j.capacity*units);target=Math.min(target,Math.max(0,((j.node.account.stock[g]||0)+(j.node.account.assets[g]||0))/units-j.done));}if(target<1e-8)continue;for(const r of j.recipe)procure(j.node,r.good,target*r.units);let amount=target")
edit('economy-simulation.js',"for(const n of foodOrder){for(const category of ['food'", "for(const n of foodOrder){for(const category of ['armor','food'")
edit('economy-simulation.js',"last.demand[n.id]={};}", "demands.get(n.id).armor=(demands.get(n.id).military||0)*.35;last.demand[n.id]={};}")
# Show the interpretation of income and cash settings; never call it a personal salary.
edit('economy-ui.js','Caixa inicial por habitante · PO','${data.calibration?.useSocialLiquidity?\'Multiplicador do capital de giro social\':\'Caixa inicial por habitante · PO\'}')
edit('economy-ui.js','as áreas rurais têm uma demanda operacional simplificada.', 'as pessoas do entorno rural já estão incluídas na população das localidades.')
edit('economy-ui.js',"inlandFleet:'Frota fluvial/lacustre'", "inlandFleet:'Frota fluvial/lacustre',armor:'Armaduras'")
for p in (B/'app/dist').glob('*.js'):
 s=p.read_text(encoding='utf-8');s=re.sub(r'((?:economy-[a-z-]+|city-editor-[a-z]+|profile-ui|city-manager|market-territories)\.js)\?v=\d+',r'\1?v=41',s);p.write_text(s,encoding='utf-8')
p=B/'app/dist/index.html';p.write_text(p.read_text(encoding='utf-8').replace('app.js?v=40','app.js?v=41'),encoding='utf-8')
