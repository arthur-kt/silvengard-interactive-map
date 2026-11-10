from pathlib import Path
import shutil
B=Path(__file__).resolve().parents[2]
p=B/'app/dist/ui-v33.css';s=p.read_text(encoding='utf-8')
s+='\n@media(max-width:700px){body #sidebar:not(.collapsed){top:calc(var(--top) + 90px);bottom:calc(var(--foot) + 8px);height:auto;max-height:none}body #sidebar:not(.collapsed) #results{min-height:72px;overflow:auto}}\n'
p.write_text(s,encoding='utf-8')
p=B/'app/dist/index.html';s=p.read_text(encoding='utf-8').replace('ui-v33.css?v=33','ui-v33.css?v=42');p.write_text(s,encoding='utf-8')
p=B/'app/dist/app.js';s=p.read_text(encoding='utf-8');s=s.replace("$('#economicMap').onchange=e=>{if(e.target.value)","$('#economicMap').onchange=e=>{if(!economy){e.target.value='';return toast('Aguarde o carregamento da economia.');}if(e.target.value)");p.write_text(s,encoding='utf-8')
for name in ['ui-v33.css','index.html','app.js']:shutil.copy2(B/'app/dist'/name,B.parent/'silvengard-atlas v2/dist'/name)
shutil.copy2(B/'history_archive.py',B.parent/'silvengard-atlas v2/history_archive.py')
