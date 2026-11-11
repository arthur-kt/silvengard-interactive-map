// Silvengard · v46 — leitura da história das cidades para dar caráter ao lugar.
// O arquivo history-archive.json já é servido ao leitor de histórias; aqui só indexamos
// o texto de cada cidade e tiramos dele alguns traços (porto, muralhas, neve, mina…).

const clean=s=>String(s??'')
 .replace(/<!--[\s\S]*?-->/g,' ')
 .replace(/\[([^\]]+)\]\([^)]*\)/g,'$1')
 .replace(/[*_#>`]+/g,'')
 .replace(/\s+/g,' ')
 .trim();

/** Escolhe o trecho narrativo (história local), não a ficha técnica. */
function narrative(raw){
 const t=String(raw??'').replace(/<!--[\s\S]*?-->/g,' ');
 const m=t.match(/\*\*\s*Hist[oó]ria local[^*]*\*\*\s*([\s\S]*?)(?:\n\s*\n|\n\s*\*\*|$)/i);
 if(m)return m[1].replace(/\*\*/g,'').trim();
 const paras=t.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean);
 const hist=paras.find(p=>/hist[oó]ria local|institui[cç][oõ]es|acontecimentos/i.test(p));
 const pick=hist||paras.filter(p=>!/^(\*\*)?\s*(Localiza|Cultura|Tradi)/i.test(p)).join('\n\n')||paras.join('\n\n');
 return pick.replace(/^\*\*\s*[^*]{0,80}\*\*\s*/,'').replace(/\*\*/g,'').trim();
}

export function firstSentence(text,max=240){
 const t=clean(text);if(!t)return '';
 const m=t.match(/^.{20,}?[.!?](?:\s|$)/);
 const s=(m?m[0]:t).trim();
 return s.length>max?s.slice(0,max-1).trimEnd()+'…':s;
}

const R={
 port:/\bporto\b|\bcais\b|\bnavios?\b|mar[ií]tim|\bancoradouro\b|\barsenal\b|\bpesca\b/,
 walls:/\bmuralhas?\b|\bcidadela\b|\bfortaleza\b|fortifica|\bbasti[aã]o\b|\bcastelo\b/,
 dwarven:/\ban[ãa]s?\b|\bdwarven\b|\bminas?\b|\bforjas?\b|subterr[aâ]ne/,
 arcane:/escola de magia|torre de magia|\bmagos?\b|\barcan[oa]s?\b|feiticeir/,
 snow:/\bneve\b|nevad|\bgelo\b|\binverno\b|\bfrio\b|geada/,
 desert:/\bdeserto\b|[aá]rid|\bareias?\b|\bdunas?\b/,
 forest:/\bflorestas?\b|\bbosques?\b|\bselvas?\b|mata fechada/,
 lake:/\blagos?\b|\blagoas?\b/,
 river:/\brios?\b|ribeir|\bponte\b|\bfoz\b/,
 mountain:/\bmontanhas?\b|\bserras?\b|\bpicos?\b|cordilheira/,
 temple:/\btemplos?\b|\bcatedral\b|\bigrejas?\b|\bsantu[aá]rio\b|mosteiro/,
 ruins:/\bru[ií]nas?\b/,
 swamp:/\bp[aâ]ntanos?\b|p[aâ]ntan|\blama\b|\bbrejo\b/,
 market:/\bmercados?\b|\bfeiras?\b|com[eé]rcio|caravana/
};

/** Traços de cenário deduzidos do texto da cidade. */
export function traitsFromText(text){
 const t=clean(text).toLowerCase();
 const out={};
 for(const [k,rx] of Object.entries(R))out[k]=rx.test(t);
 return out;
}

/** Indexa o arquivo de histórias por id de cidade. */
export function indexLore(archive){
 const sections=new Map();
 for(const s of archive?.sections||[])sections.set(s.id,s);
 const byCity=new Map();
 for(const r of archive?.records||[]){
  if(r.kind!=='city')continue;
  const id=r.target?.id;
  if(id==null)continue;
  const parts=[r.intro];
  for(const sid of r.sections||[]){const sec=sections.get(sid);if(sec?.markdown)parts.push(sec.markdown)}
  for(const sid of r.chapters||[]){const sec=sections.get(sid);if(sec?.markdown)parts.push(sec.markdown)}
  const raw=parts.filter(Boolean).join('\n\n');
  const text=clean(raw);
  byCity.set(id,{name:r.name||'',text,quote:firstSentence(narrative(raw)),traits:traitsFromText(text)});
 }
 return {byCity,size:byCity.size};
}

export function loreForCity(index,id){
 return index?.byCity?.get(id)||null;
}
