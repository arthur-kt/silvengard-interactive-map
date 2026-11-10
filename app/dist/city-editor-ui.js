import {slaveTradeAllowed} from './economy-labor.js?v=43.1';
import {CITY_FLAGS,CITY_CLASSES,cleanCityEdit,applyCityEdit} from './city-editor-core.js?v=43.1';
import {SOCIAL_CLASSES,defaultSocialProfile} from './economy-income.js?v=43.1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={port:'Porto',majorPort:'Porto principal',citadel:'Cidadela',walls:'Muralhas',temple:'Templo',plaza:'Praça',shanty:'Arrabaldes',magicSchool:'Escola de magia',dwarvenFortress:'Fortaleza anã'};
export function cityEditorHTML(b,D,biomes){
 const options=(list,id)=>list.map(r=>`<option value="${r.i}" ${r.i===id?'selected':''}>${esc(r.name)}</option>`).join('');
 return `<section class="cityEditorFields"><h3>Editar cidade</h3><label>População<input id="cityPopulation" type="number" min="0" max="10000000000" step="1" value="${b.demographics?.population??Math.round(b.population*D.settings.populationRate*D.settings.urbanization)}" required></label><label>Cultura<select id="cityCulture">${options(D.cultures,b.culture)}</select></label><label>Tipo de localidade<select id="cityClass">${CITY_CLASSES.map(c=>`<option ${b.settlementClass===c?'selected':''}>${c}</option>`).join('')}</select></label><label>Religião<select id="cityReligion">${options(D.religions,b.faith?.i??0)}</select></label><label>Divindade<input id="cityDeity" value="${esc(b.faith?.deity||'—')}" readonly aria-readonly="true"></label><label>Bioma do local<select id="cityBiome">${biomes.map((name,i)=>i?`<option value="${i}" ${D.cells[b.cell]?.biome===i?'selected':''}>${esc(name)}</option>`:'').join('')}</select></label><p class="source">O bioma altera o terreno desta célula. Para uma área maior, use o pincel de biomas.</p><details class="socialEditor"><summary>Composição social e renda estimada</summary><p>Percentuais da população da cidade e de seu entorno. Estimativa inicial editável; a soma deve ser 100%.</p>${SOCIAL_CLASSES.map(c=>`<label>${c.name} · %<input data-social-class="${c.id}" type="number" min="0" max="100" step="0.1" value="${(b.socialProfile||defaultSocialProfile(b)).shares[c.id]}"></label>`).join('')}<label>Pessoas por unidade familiar de renda<input id="socialHouseholdSize" type="number" min="1" max="12" step="0.1" value="${(b.socialProfile||defaultSocialProfile(b)).householdSize}"></label>${slaveTradeAllowed(b)?`<label>População escravizada · % incluído nos trabalhadores comuns<input id="cityForcedLaborShare" type="number" min="0" max="100" step="0.1" value="${b.forcedLaborShare||0}"></label><p>Estimativa de cenário. Sem salário próprio; participa da demanda alimentar. Estoques e transferências são registrados na simulação.</p>`:''}</details><fieldset><legend>Características</legend>${CITY_FLAGS.map(k=>`<label><input type="checkbox" data-city-feature="${k}" ${(b[k]??b.originalFeatures?.[k])?'checked':''}>${names[k]}</label>`).join('')}</fieldset></section>`;
}
export function bindCityEditor(D){
 const $=s=>document.querySelector(s);
 $('#cityReligion').onchange=()=>{$('#cityDeity').value=D.religions.find(r=>r.i===+$('#cityReligion').value)?.deity||'—';};
 $('[data-city-feature="majorPort"]').onchange=e=>{if(e.target.checked)$('[data-city-feature="port"]').checked=true;};
 $('[data-city-feature="port"]').onchange=e=>{if(!e.target.checked)$('[data-city-feature="majorPort"]').checked=false;};
}
export function readCityEditor(D,b){
 const $=s=>document.querySelector(s),features=Object.fromEntries([...document.querySelectorAll('[data-city-feature]')].map(el=>[el.dataset.cityFeature,el.checked]));
 const input=$('#cityPopulation');if(!input.value.trim())throw Error('Informe o número de habitantes.');
 const socialProfile={shares:Object.fromEntries([...document.querySelectorAll('[data-social-class]')].map(el=>[el.dataset.socialClass,Number(el.value)])),householdSize:Number($('#socialHouseholdSize').value),estimated:false};
 const edit=cleanCityEdit({socialProfile,...($('#cityForcedLaborShare')?{forcedLaborShare:Number($('#cityForcedLaborShare').value)}:{}),inhabitants:Number(input.value),culture:+$('#cityCulture').value,religion:+$('#cityReligion').value,settlementClass:$('#cityClass').value,features},D);
 const trial=applyCityEdit(structuredClone(b),edit,D);
 if(b.harbor&&!trial.harbor&&D.routes.some(r=>r.kind==='sea'&&(r.fromCity===b.i||r.toCity===b.i||r.stops?.includes(b.i))))throw Error('Este porto recebe rotas marítimas. Ajuste essas rotas antes de remover o porto.');
 return edit;
}
