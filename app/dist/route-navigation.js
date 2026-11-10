import {routeReport} from './route-info.js?v=40';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createRouteNavigation({D,focus,title=b=>b.name}){
 let key=null,index=-1,route=null,stops=[];
 function sync(r){const next=r?.id??JSON.stringify(r?.points?.[0]);if(next!==key){key=next;index=-1;}route=r;stops=r?routeReport(D,r).stops:[];index=Math.min(index,stops.length-1);}
 function html(r){sync(r);if(!r?.points?.length)return '';return `<section class="routeNavigation" aria-label="Percorrer rota no mapa"><div class="routeNavButtons"><button data-tour="start">Início da rota</button><button data-tour="previous" ${index<0?'disabled':''}>← Anterior</button><button data-tour="next" ${index>=stops.length-1?'disabled':''}>Próxima cidade →</button></div><p data-tour-label>${index>=0?esc(title(D.cities.find(b=>b.i===stops[index].id)))+' · '+(index+1)+' / '+stops.length:'Explore as '+stops.length+' localidades do percurso.'}</p><small>Move apenas a visão do mapa; a posição do grupo permanece igual.</small></section>`;}
 function bind(panel){
  const update=()=>{const box=panel.querySelector('.routeNavigation');if(!box)return;box.querySelector('[data-tour-label]').textContent=index>=0?title(D.cities.find(b=>b.i===stops[index].id))+' · '+(index+1)+' / '+stops.length:'Início da rota';box.querySelector('[data-tour="previous"]').disabled=index<0;box.querySelector('[data-tour="next"]').disabled=index>=stops.length-1;};
  panel.querySelectorAll('[data-tour]').forEach(el=>el.onclick=()=>{if(!route)return;if(el.dataset.tour==='start'){index=-1;focus(...route.points[0].slice(0,2),230);}else if(el.dataset.tour==='previous'&&index<=0){index=-1;focus(...route.points[0].slice(0,2),230);}else{index=Math.max(0,Math.min(stops.length-1,index+(el.dataset.tour==='next'?1:-1)));const b=D.cities.find(b=>b.i===stops[index]?.id);if(b)focus(b.x,b.y,190);}update();});
 }
 return {html,bind};
}
