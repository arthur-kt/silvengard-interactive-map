import {escapeHTML as esc,normalize,renderMarkdown,descendants} from './history-core.js?v=35';

function paragraphs(text){return String(text||'').split(/\n\s*\n/).map(s=>s.trim()).filter(s=>s&&!/^(?:#|\||[-*] |\d+\. |<!--)/.test(s));}
function excerpt(text,limit=1100){
 if(text.length<=limit)return text;
 const part=text.slice(0,limit),ends=[...part.matchAll(/[.!?](?:\*\*)?(?=\s|$)/g)],end=ends.at(-1);
 let result=end&&end.index>250?part.slice(0,end.index+end[0].length):part.slice(0,part.lastIndexOf(' '))+'…';
 if(result.split('**').length%2===0)result=result.replaceAll('**','');return result;
}
// Previews use the same sanitized prose as the full reader; no invented summaries.
export function historyFact(data,kind,id,{stateId}={}){
 const r=data.records.find(r=>r.id===kind+':'+id);if(!r)return null;
 const sections=new Map(data.sections.map(s=>[s.id,s]));
 let text=(kind==='state'?paragraphs(r.intro):[]),context=null;
 if(!text.length)text=(r.chapters||[]).flatMap(id=>paragraphs(sections.get(id)?.displayMarkdown));
 if(!text.length&&r.contexts?.length){
  const region=r.contexts.find(c=>c.stateId===stateId)||r.contexts[0];
  const candidates=descendants(region.section,sections).filter(s=>!s.displayHidden&&!s.displayTransparent);
  const visible=s=>{for(let p=s;p;p=sections.get(p.parent))if(p.displayHidden)return false;return true;};
  const all=candidates.filter(visible).flatMap(s=>paragraphs(s.displayMarkdown));
  const terms=[r.name.replace(/\s*\(.*$/,''),r.deity?.split(',')[0]].filter(Boolean).map(normalize);
  const matching=all.filter(p=>terms.some(t=>normalize(p).includes(t)));
  text=matching.length?matching:all;context=region.name;
 }
 const chosen=[];let length=0;
 for(const p of text){if(chosen.includes(p))continue;const value=excerpt(p,Math.max(380,1100-length));chosen.push(value);length+=value.length;if(chosen.length===1||length>=850)break;}
 return {record:r,paragraphs:chosen,context};
}

export function createHistoryFacts({getData,open}){
 function decorate(container,kind,id,context={}){
  if(!container||container.querySelector('[data-history-facts]'))return;
  const section=document.createElement('section');section.className='historyFacts profileSection';section.dataset.historyFacts=kind+':'+id;
  const heading=kind==='culture'?'Sobre esta cultura':kind==='religion'?'Crenças e tradições':'História';
  section.innerHTML=`<h3>${heading}</h3><div class="historyFactsText" aria-live="polite"><span class="historyFactsLoading">Carregando história…</span></div><button type="button" data-history-entry>Ver ${['culture','religion'].includes(kind)?'informações':'história'} completa${['culture','religion'].includes(kind)?'s':''} ↗</button>`;
  section.querySelector('[data-history-entry]').onclick=()=>open(kind,id);
  const profile=container.querySelector('.profileSection'),firstHeading=container.querySelector('h3');
  if(kind==='city'&&profile)profile.after(section);else if(kind==='state'&&profile)profile.before(section);else if(firstHeading)firstHeading.before(section);else container.append(section);
  getData().then(data=>{
   if(!section.isConnected)return;
   const value=historyFact(data,kind,id,context),body=section.querySelector('.historyFactsText');
   body.innerHTML=value?`${value.context?`<small class="historyFactsContext">${esc(value.context)}</small>`:''}${value.paragraphs.map(p=>renderMarkdown(p)).join('')}`:'';
   if(!value?.paragraphs.length)section.querySelector('h3').hidden=true;
  }).catch(()=>{if(section.isConnected)section.querySelector('.historyFactsText').textContent='Não foi possível carregar a história agora.';});
 }
 return {decorate};
}
