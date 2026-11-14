// Místní převod obrázků bez stahování a bez mazání originálů.
// Spuštění: node scripts/optimize-images.mjs. Vyžaduje sharp 0.34.5.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let sharp;
try { sharp=require('sharp'); } catch { console.error('Chybí sharp. Nainstaluj sharp@0.34.5 nebo nastav NODE_PATH na složku s touto knihovnou.'); process.exit(1); }
const walk=async directory=>{const files=[];for(const item of await fs.readdir(directory,{withFileTypes:true})){if(item.name==='optimized')continue;const full=path.join(directory,item.name);if(item.isDirectory())files.push(...await walk(full));else if(/\.(jpe?g|png|webp|avif)$/i.test(full))files.push(full);}return files;};
const output=path.join(root,'images','optimized');await fs.mkdir(output,{recursive:true});const manifest={};
for(const file of await walk(path.join(root,'images'))){const source=path.relative(root,file).split(path.sep).join('/');const buffer=await fs.readFile(file);const hash=createHash('sha256').update(buffer).digest('hex').slice(0,16);const image=sharp(buffer).rotate();const metadata=await image.metadata();const rotated=[5,6,7,8].includes(metadata.orientation);const width=rotated?metadata.height:metadata.width,height=rotated?metadata.width:metadata.height;const widths=[...new Set([320,640,960].map(size=>Math.min(size,width)))];const entry={width,height,avif:[],webp:[]};
for(const format of ['webp','avif'])for(const size of widths){const filename=hash+'-'+size+'.'+format;const target=path.join(output,filename);try{await fs.access(target);}catch{await sharp(buffer).rotate().resize({width:size,withoutEnlargement:true})[format]({quality:format==='avif'?48:78}).toFile(target);}entry[format].push({src:'images/optimized/'+filename,width:size});}manifest[source]=entry;
}
await fs.writeFile(path.join(root,'data','image-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.join(root,'js','image-manifest.js'),'// Generováno scripts/optimize-images.mjs; neupravovat ručně.\nexport default '+JSON.stringify(manifest)+';\n');
console.log('Převedeno '+Object.keys(manifest).length+' obrázků. Originály zachovány.');
