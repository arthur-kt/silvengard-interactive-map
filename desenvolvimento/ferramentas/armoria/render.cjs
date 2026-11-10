// Local-only wrapper around Azgaar's MIT-licensed Armoria renderer.
const fs=require('node:fs'),path=require('node:path');
process.chdir(__dirname);
const draw=require('./app/renderer.js'),{colors}=require('./app/dataModel.js');
const input=JSON.parse(fs.readFileSync('input.json','utf8')),index={...input.native};
const output=path.resolve('../../dist/heraldry');
(async()=>{const errors=[];for(const entry of input.items){const id=entry.kind+'-'+entry.id;try{
 const svg=await draw(id,entry.coa,256,colors);
 if(/undefined|NaN/.test(svg))throw Error('Unresolved heraldic shape or coordinate');
 fs.writeFileSync(path.join(output,id+'.svg'),svg);index[entry.kind+':'+entry.id]='heraldry/'+id+'.svg';
 }catch(e){errors.push({id,error:e.message});}}
 fs.writeFileSync(path.join(output,'index.json'),JSON.stringify(index,null,2));
 fs.writeFileSync(path.join(output,'render-report.json'),JSON.stringify({rendered:Object.keys(index).length,errors},null,2));
 console.log(JSON.stringify({rendered:Object.keys(index).length,errors}));
})();
