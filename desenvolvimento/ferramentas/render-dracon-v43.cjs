const fs=require('node:fs'),path=require('node:path');
process.chdir(path.join(__dirname,'armoria'));
const draw=require('./armoria/app/renderer.js'),{colors}=require('./armoria/app/dataModel.js');
(async()=>{const root=path.resolve('../..'),config=JSON.parse(fs.readFileSync(path.join(root,'scenario-defaults.json'),'utf8')),svg=await draw('author-state-20',config.heraldry['20'],512,colors);if(/undefined|NaN/.test(svg))throw Error('Invalid Dracon emblem');for(const base of [root,path.join(root,'../silvengard-atlas v2')])fs.writeFileSync(path.join(base,'dist/heraldry/author-state-20-v19.svg'),svg);console.log('Exact wyvern / sanguine / perPile arched / horsehead2 emblem rendered');})();
