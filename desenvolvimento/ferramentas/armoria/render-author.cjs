// Author's heraldry uses the same local shield renderer as the original emblems.
const fs=require('node:fs'),path=require('node:path');
process.chdir(__dirname);
const draw=require('./app/renderer.js'),{colors}=require('./app/dataModel.js');
const config=JSON.parse(fs.readFileSync('../../scenario-defaults.json','utf8'));
(async()=>{for(const [id,coa] of Object.entries(config.heraldry)){
 const svg=await draw('author-state-'+id,coa,512,colors);
 if(/undefined|NaN/.test(svg))throw Error('Invalid crest '+id);
 fs.writeFileSync(path.resolve('../../dist/heraldry/author-state-'+id+'-v19.svg'),svg);
}console.log('Rendered four author crests');})();
