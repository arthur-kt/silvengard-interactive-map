export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function inlineMarkdown(text){
 const codes=[];let s=String(text).replace(/`([^`]+)`/g,(_,code)=>`\u0000${codes.push('<code>'+escapeHTML(code)+'</code>')-1}\u0000`);
 s=escapeHTML(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
 // URLs are displayed as text: archival Markdown cannot inject executable links.
 return s.replace(/\u0000(\d+)\u0000/g,(_,i)=>codes[+i]||'');
}
export function renderMarkdown(markdown){
 const lines=String(markdown).replace(/<!--[\s\S]*?-->/g,'').split(/\r?\n/),html=[];let paragraph=[];
 const flush=()=>{if(paragraph.length){html.push('<p>'+inlineMarkdown(paragraph.join('\n')).replace(/\n/g,'<br>')+'</p>');paragraph=[];}};
 const listHTML=items=>{
  const root={children:[]},stack=[{indent:-1,node:root}];
  for(const item of items){while(stack.length>1&&item.indent<=stack[stack.length-1].indent)stack.pop();const node={...item,children:[]};stack[stack.length-1].node.children.push(node);stack.push({indent:item.indent,node});}
  const render=nodes=>{const ordered=Boolean(nodes[0]?.ordered),tag=ordered?'ol':'ul';return `<${tag}>`+nodes.map(node=>`<li>${inlineMarkdown(node.text)}${node.children.length?render(node.children):''}</li>`).join('')+`</${tag}>`;};
  return render(root.children);
 };
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();if(!line){flush();continue;}
  if(line.startsWith('```')){flush();const block=[];i++;while(i<lines.length&&!lines[i].trim().startsWith('```')){block.push(lines[i]);i++;}html.push('<pre class="loreCode"><code>'+escapeHTML(block.join('\n'))+'</code></pre>');continue;}
  if(/^\*\*(Fonte(?: original)?|Arquivos relacionados):\*\*/.test(line))continue;
  if(line.startsWith('|')&&/^\|?[\s:|-]+\|/.test((lines[i+1]||'').trim())){
   flush();const cells=value=>value.trim().replace(/^\||\|$/g,'').split('|').map(cell=>cell.trim());
   const headers=cells(line);i++;const rows=[];while((lines[i+1]||'').trim().startsWith('|'))rows.push(cells(lines[++i]));
   html.push('<div class="loreTable"><table><thead><tr>'+headers.map(cell=>'<th>'+inlineMarkdown(cell)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(cell=>'<td>'+inlineMarkdown(cell)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>');continue;
  }
  const item=line.match(/^(\s*)(?:([-*])|(\d+)\.)\s+(.+)/);
  if(item){
   flush();const items=[];let current=item;
   do{items.push({indent:Math.floor(current[1].replace(/\t/g,'  ').length/2),ordered:!current[2],text:current[4]});current=(lines[i+1]||'').match(/^(\s*)(?:([-*])|(\d+)\.)\s+(.+)/);if(current)i++;}while(current);
   html.push(listHTML(items));continue;
  }
  if(line.startsWith('>')){flush();html.push('<blockquote>'+inlineMarkdown(line.replace(/^>\s?/,''))+'</blockquote>');continue;}
  const heading=line.match(/^#{1,6}\s+(.+)/);if(heading){flush();html.push('<h3>'+inlineMarkdown(heading[1])+'</h3>');continue;}
  if(/^---+$/.test(line)){flush();html.push('<hr>');continue;}paragraph.push(line);
 }flush();return html.join('');
}
export function descendants(root,sections){const s=sections.get(root);return s?[s,...s.children.flatMap(id=>descendants(id,sections))]:[];}
export function eraEvents(events,era){return events.filter(e=>e.era===era).map((e,i)=>({e,i})).sort((a,b)=>{
 if(era===1)return a.i-b.i;const year=e=>Number((e.date.replace(/^c\.\s*/, '').replace(/^II[I]?-/, '').match(/\d+/)||[Infinity])[0]);return year(a.e)-year(b.e)||a.i-b.i;
}).map(x=>x.e);}
