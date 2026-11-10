"""Targeted UI migration: route inspector first, edit actions always visible."""
from pathlib import Path
p=Path(__file__).resolve().parent.parent.parent/'app/dist'
file=p/'route-editor.js';s=file.read_text(encoding='utf-8')
s=s.replace("import * as THREE from 'three';", "import * as THREE from 'three';\nimport {routeReport} from './route-info.js?v=16';")
s=s.replace('beforeDrag}){','beforeDrag,title=b=>b.name,scale=()=>D.settings.distanceScale}){')
s=s.replace("showLocal=false;", "showLocal=false,pace='normal',dayHours=8,shipSpeed=4.5;",1)
s=s.replace(" const panel=document.createElement", " const panel=document.createElement",1)
at=s.index(' function dispose()')
helper=''' function overview(){
  if(!draft?.points?.length)return '<p class="source">Marque pelo menos dois pontos no mapa ou adicione cidades abaixo para criar o percurso.</p>';
  const r=routeReport(D,draft,{scale:scale(),pace,hours:dayHours,shipSpeed}),n=x=>x.toLocaleString('pt-BR',{maximumFractionDigits:1}),time=h=>`${Math.floor(h)} h ${Math.round((h%1)*60)} min`;
  return `<section class="routeOverview" aria-label="Informações da rota"><div class="routeStats"><div><strong>${n(r.km)} km</strong><small>EXTENSÃO DO TRAÇADO</small></div><div><strong>${time(r.moving)}</strong><small>TEMPO EM MOVIMENTO</small></div><div><strong>${r.days} dia${r.days===1?'':'s'}</strong><small>COM ${dayHours} H DE VIAGEM/DIA</small></div><div><strong>${r.averageLegHours===null?'—':time(r.averageLegHours)}</strong><small>MÉDIA ENTRE LOCALIDADES</small></div></div><div class="routeEstimateControls">${draft.kind==='sea'?`<label>Velocidade do navio · km/h<input id="inspectShipSpeed" type="number" min="0.1" max="100" step="0.5" value="${shipSpeed}"></label>`:`<label>Ritmo de viagem<select id="inspectPace"><option value="normal" ${pace==='normal'?'selected':''}>Normal · 4,5 km/h</option><option value="fast" ${pace==='fast'?'selected':''}>Rápido · 6 km/h</option><option value="slow" ${pace==='slow'?'selected':''}>Lento · 3 km/h</option></select></label>`}<label>Horas por dia<input id="inspectDayHours" type="number" min="1" max="24" value="${dayHours}"></label></div><h3>Localidades do percurso</h3>${r.stops.length?`<table class="routeStopTable"><thead><tr><th>Cidade / porto</th><th>Desde o início</th><th>Trecho anterior</th></tr></thead><tbody>${r.stops.map((stop,i)=>`<tr><td>${esc(title(D.cities.find(b=>b.i===stop.id)))}</td><td>${n(stop.along)} km</td><td>${i?n(stop.legKm)+' km<br>'+time(stop.legHours):'Início da sequência'}</td></tr>`).join('')}</tbody></table>`:'<p class="source">Nenhuma cidade junto a este traçado. Você pode criar rotas por pontos livres.</p>'}<p class="source">Distâncias medidas ao longo da rota, na escala de ${n(scale())} km/unidade. Localidades a até ${n(scale()*6)} km do traçado. Estradas e rotas marítimas usam terreno normal; a estimativa considera ${n(r.speed)} km/h e não inclui paradas ou encontros. Use Jornadas para uma simulação detalhada.</p></section>`;
 }
'''
s=s[:at]+helper+s[at:]
s=s.replace("draw();render();focus(...r.points", "draw();render();$('.routeBody').scrollTop=0;focus(...r.points",1)
s=s.replace("error='Adicione pelo menos dois pontos.';draw();render();", "error='Adicione pelo menos dois pontos.';draw();render();$('.routeBody').scrollTop=0;",1)
s=s.replace('<div class="routeBody"><div class="editorActions">','<div class="routeBody"><div class="routeBrowse" ${draft?\'hidden\':\'\'}><div class="editorActions">',1)
old="</p>${draft?`<section class=\"routeDraft\"><h3>${unsaved?'Edição não salva':'Traçado selecionado'}</h3>"
new="""</p></div>${draft?`<section class="routeDraft"><button id="backToRoutes">← Todas as rotas</button><h3>${esc(draft.name)}</h3><div class="routeToolbar"><button id="editRouteMap">${editing?'Concluir pontos':'Editar pontos no mapa'}</button><button id="quickSaveRoute" ${unsaved?'':'disabled'}>Salvar alterações</button></div>${unsaved?'<p class="routeNotice">Alterações ainda não salvas.</p>':''}${picking?`<p class="routeNotice">${picking.action==='move'?'Clique no novo lugar do ponto.':'Clique no mapa para acrescentar um ponto.'} ${draft.kind==='sea'?'Escolha água ou um porto.':'Escolha terra.'}<button id="stopRoutePick">Concluir marcação</button></p>`:''}${overview()}"""
assert old in s;s=s.replace(old,new,1)
old='''<div class="editorActions"><button id="editRouteMap">${editing?'Concluir pontos':'Editar pontos no mapa'}</button><button id="journeyRoute">Usar na jornada</button></div>${picking?`<p class="routeNotice">${picking.action==='move'?'Clique no novo lugar do ponto selecionado.':'Clique no mapa para acrescentar um ponto.'} ${draft.kind==='sea'?'Escolha água ou um porto.':'Escolha terra.'}<button id="stopRoutePick">Concluir marcação</button></p>`:''}<ol class="routePointList">'''
new='''<div class="editorActions"><button id="journeyRoute">Usar na jornada</button></div><div class="routePointEditor" ${editing?'':'hidden'}><ol class="routePointList">'''
assert old in s;s=s.replace(old,new,1)
s=s.replace('<button id="addRoutePort">Adicionar ao traçado</button>${error?', '<button id="addRoutePort">Adicionar ao traçado</button></div>${error?',1)
s=s.replace("if(draft){$('#routeNameEdit')", "if(draft){$('#backToRoutes').onclick=()=>{if(unsaved)return toast('Salve ou descarte as alterações antes de voltar.');draft=null;editing=false;picking=null;draw();render();$('.routeBody').scrollTop=0;};$('#quickSaveRoute').onclick=save;if($('#inspectPace'))$('#inspectPace').onchange=e=>{pace=e.target.value;render();};if($('#inspectShipSpeed'))$('#inspectShipSpeed').onchange=e=>{shipSpeed=Math.max(.1,Math.min(100,+e.target.value||4.5));render();};if($('#inspectDayHours'))$('#inspectDayHours').onchange=e=>{dayHours=Math.max(1,Math.min(24,+e.target.value||8));render();};$('#routeNameEdit')",1)
s=s.replace("draft.name=e.target.value;unsaved=true;", "draft.name=e.target.value;unsaved=true;$('#quickSaveRoute').disabled=false;",1)
s=s.replace("r.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))", "(r.name+' '+routeReport(D,r).stops.map(p=>p.name).join(' ')).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))")
s=s.replace("get dragging(){return drag!==null;}", "get editing(){return !panel.hidden&&editing;},get dragging(){return drag!==null;}")
file.write_text(s,encoding='utf-8')
print('Route inspector and direct editing integrated')
