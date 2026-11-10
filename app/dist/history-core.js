export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function inlineMarkdown(text){
 const codes=[];let s=String(text).replace(/`([^`]+)`/g,(_,code)=>`\u0000${codes.push('<code>'+escapeHTML(code)+'</code>')-1}\u0000`);
 s=escapeHTML(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
 // URLs are displayed as text: archival Markdown cannot inject executable links.
 return s.replace(/\u0000(\d+)\u0000/g,(_,i)=>codes[+i]||'');
}
export function renderMarkdown(markdown){
 const lines=String(markdown).replace(/<!--[\s\S]*?-->/g,'').split(/\r?\n/),html=[];let paragraph=[],list=null;
 const flush=()=>{if(paragraph.length){html.push('<p>'+inlineMarkdown(paragraph.join('\n')).replace(/\n/g,'<br>')+'</p>');paragraph=[];}if(list){html.push(`</${list}>`);list=null;}};
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();if(!line){flush();continue;}
  if(/^\*\*(Fonte(?: original)?|Arquivos relacionados):\*\*/.test(line))continue;
  if(line.startsWith('|')&&/^\|?[\s:|-]+\|/.test(lines[i+1]?.trim()||'')){
   flush();const cells=s=>s.trim().replace(/^\||\|$/g,'').split('|').map(t=>t.trim());
   const headers=cells(line);i++;const rows=[];while(lines[i+1]?.trim().startsWith('|'))rows.push(cells(lines[++i]));
   html.push('<div class="loreTable"><table><thead><tr>'+headers.map(c=>'<th>'+inlineMarkdown(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+inlineMarkdown(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>');continue;
  }
  const item=line.match(/^(?:([-*])|\d+\.)\s+(.+)/);if(item){if(paragraph.length){html.push('<p>'+inlineMarkdown(paragraph.join(' '))+'</p>');paragraph=[];}const tag=item[1]?'ul':'ol';if(list!==tag){if(list)html.push(`</${list}>`);html.push(`<${tag}>`);list=tag;}html.push('<li>'+inlineMarkdown(item[2])+'</li>');continue;}
  if(line.startsWith('>')){flush();html.push('<blockquote>'+inlineMarkdown(line.replace(/^>\s?/,''))+'</blockquote>');continue;}
  const heading=line.match(/^#{1,6}\s+(.+)/);if(heading){flush();html.push('<h3>'+inlineMarkdown(heading[1])+'</h3>');continue;}
  if(/^---+$/.test(line)){flush();html.push('<hr>');continue;}if(list){html.push(`</${list}>`);list=null;}paragraph.push(line);
 }flush();return html.join('');
}
export function descendants(root,sections){const s=sections.get(root);return s?[s,...s.children.flatMap(id=>descendants(id,sections))]:[];}
export function eraEvents(events,era){return events.filter(e=>e.era===era).map((e,i)=>({e,i})).sort((a,b)=>{
 if(era===1)return a.i-b.i;const year=e=>Number((e.date.replace(/^c\.\s*/, '').replace(/^II[I]?-/, '').match(/\d+/)||[Infinity])[0]);return year(a.e)-year(b.e)||a.i-b.i;
}).map(x=>x.e);}
