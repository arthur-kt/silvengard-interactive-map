// Nearest inhabited city over connected land, independently within each state.
// No province-wide assignments or demographic percentages are inferred.
export function societyField(D,source=null){
 const count=D.cells.length,owner=new Int32Array(count).fill(-1),dist=new Float64Array(count).fill(Infinity),heap=[];
 const cities=D.cities.filter(b=>!b.excluded&&b.visible!==false&&(b.demographics?.population??b.population??0)>0);
 function push(v){heap.push(v);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p][0]<=v[0])break;heap[i]=heap[p];i=p;}heap[i]=v;}
 function pop(){const root=heap[0],tail=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let k=i*2+1;if(k+1<heap.length&&heap[k+1][0]<heap[k][0])k++;if(heap[k][0]>=tail[0])break;heap[i]=heap[k];i=k;}heap[i]=tail;}return root;}
 cities.forEach((b,i)=>{const c=D.cells[b.cell];if(c?.h>=20&&c.state===b.state&&dist[b.cell]!==0){owner[b.cell]=i;dist[b.cell]=0;push([0,b.cell,i]);}});
 while(heap.length){const [d,i,town]=pop();if(d!==dist[i]||owner[i]!==town)continue;const c=D.cells[i];for(const j of c.c){const n=D.cells[j];if(n.h<20||n.state!==c.state)continue;const value=d+Math.hypot(c.p[0]-n.p[0],c.p[1]-n.p[1]);if(value<dist[j]){dist[j]=value;owner[j]=town;push([value,j,town]);}}}
 const culture=new Int32Array(count).fill(-1),religion=new Int32Array(count).fill(-1),automaticCulture=new Int32Array(count).fill(-1),automaticReligion=new Int32Array(count).fill(-1),cultureIds=new Set(D.cultures.map(c=>c.i)),religionIds=new Set(D.religions.map(r=>r.i));
 const sourceValid=source?.culture?.length===count&&source?.religion?.length===count&&source?.revision===D.revision;
 for(const c of D.cells){if(c.h<20)continue;const b=cities[owner[c.i]],ci=b?.culture??(sourceValid?source.culture[c.i]:c.culture),ri=b?.faith?.i??(sourceValid?source.religion[c.i]:-1);automaticCulture[c.i]=cultureIds.has(ci)?ci:-1;automaticReligion[c.i]=religionIds.has(ri)?ri:-1;culture[c.i]=c.cultureOverride>=0&&cultureIds.has(c.cultureOverride)?c.cultureOverride:automaticCulture[c.i];religion[c.i]=c.religionOverride>=0&&religionIds.has(c.religionOverride)?c.religionOverride:automaticReligion[c.i];}
 return {culture,religion,automaticCulture,automaticReligion,owner,cities};
}
export function societyColor(kind,id){if(id<0||kind==='culture'&&id===0)return '#879998';const hue=((id*137.508)+(kind==='religion'?34:0))%360;return `hsl(${hue}, 46%, 64%)`;}
export function societyCategory(D,kind,id){return (kind==='culture'?D.cultures:D.religions).find(v=>v.i===id)||{i:-1,name:'Sem informação'};}
