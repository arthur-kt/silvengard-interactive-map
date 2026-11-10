import {incomeReport} from './economy-income.js?v=43.1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:0});
const field=(id,label,value,placeholder='',long=false)=>`<label class="noteLabel" for="${id}">${label}</label>${long?`<textarea id="${id}" maxlength="20000" placeholder="${esc(placeholder)}">${esc(value||'')}</textarea>`:`<input id="${id}" type="text" maxlength="150" value="${esc(value||'')}" placeholder="${esc(placeholder)}">`}`;
const fact=(name,value)=>`<div class="fact"><span>${name}</span><b>${esc(value||'Não informado')}</b></div>`;

export const governmentName=s=>s.government?.designation||s.formName||'Não informado';
export const populationLabel=()=> 'HABITANTES';
export const citySourceHTML=()=> '';

export function cityProfileHTML(b,e){
 const income=incomeReport(b);
 const social=`<details class="socialComposition"><summary>Composição social · consultar</summary><p>População da cidade e entorno. Percentuais iniciais estimados e editáveis.</p>${income.rows.map(r=>fact(r.name,Number(r.share).toLocaleString('pt-BR')+'% · '+number(r.residents)+' pessoas')).join('')}<p>Camponeses destinam cerca de 99% da renda estimada à subsistência e não têm orçamento de luxo. O consumo comercial usa renda e composição social. A maior parte é autoconsumo e trocas em espécie.</p>${b.forcedLaborShare?fact('Trabalho escravizado · incluído na população',number(b.forcedLaborShare)+'%'):''}</details>`;
 const features={plaza:'Praça',shanty:'Arrabaldes',temple:'Templo',citadel:'Cidadela',walls:'Muralhas'};
 const original=Object.entries(features).filter(([k])=>b.originalFeatures?.[k]).map(([,name])=>name).join(' · ');
 return `<section class="profileSection"><h3>Cultura e sociedade</h3>${social}${fact('População considerada','Cidade e entorno rural')}${b.demographics?.populationKnown===false?'':fact('Renda monetária estimada / mês',number(income.cash)+' PO')+fact('Sobra estimada após despesas básicas',number(income.disposable)+' PO')}${b.demographics?.populationKnown===false?fact('População','Desconhecida'):''}${b.demographics?.itinerantPopulation?fact('Comunidades itinerantes vinculadas',number(b.demographics.itinerantPopulation)):''}${b.seasonalVisitors?fact('Visitantes sazonais · pico estimado',number(b.seasonalVisitors)):''}${fact('Religião',b.faith?.name||'Não informada')}${b.faith?.deity?fact('Divindade',b.faith.deity):''}${original?fact('Estruturas',original):''}</section>`;
}

export function stateProfileHTML(s,e,D){
 const g=s.government;if(!g)return '';
 const title=id=>D.states.find(x=>x.i===id)?.name.trim()||'Estado '+id;
 const sovereignty=s.i===12?'Reino independente':g.overlords.length?'Vassalo de '+g.overlords.map(title).join(', '):'Independente';
 return `<section class="profileSection">${fact('Situação política atual',sovereignty)}<details class="sourceFields"><summary>${g.monarchy?'Governante e família reinante':'Governo e informações do estado'}</summary>${g.monarchy?field('editRuler','GOVERNANTE ATUAL',e.ruler??g.ruler,'Nome do governante')+field('editDynasty','FAMÍLIA OU DINASTIA',e.dynasty??g.dynasty,'Família ou dinastia'):''}${fact('Moradores das localidades',number(D.cities.filter(b=>b.state===s.i).reduce((n,b)=>n+(b.demographics?.populationKnown===false?0:b.demographics?.population||0),0)))}</details><details class="profileDiplomacy" open><summary>Relações diplomáticas · ${s.diplomacy.length}</summary><button id="editStateDiplomacy">Editar relações diplomáticas</button><div class="diplomacyGrid">${s.diplomacy.map(r=>`<button type="button" data-diplomacy-state="${r.state}"><span>${esc(title(r.state))}</span><b class="relation ${esc(r.relation.toLowerCase())}">${esc(r.label)}</b></button>`).join('')}</div></details><details class="profileHistory"><summary>História</summary>${field('editHistory','HISTÓRIA DO ESTADO',e.history??s.history,'História do estado…',true)}</details></section>`;
}
