#!/usr/bin/env node
/**
 * Build an offline, research-only three-case time-machine prototype.
 * No network, no Astro routes, no production files. Output in .astro.
 */
import fs from 'node:fs';
import path from 'node:path';
import {loadData,validateData,selectAsOf} from './critical-visibility-core.mjs';

const errors=validateData(loadData());
if(errors.length)throw new Error('Evidence integrity failed:\n'+errors.join('\n'));
const data=loadData();
const templateFile='research/critical-inquiry/prototypes/three-case-time-machine-template-v01.html';
const template=fs.readFileSync(templateFile,'utf8');
const placeholder='__EMBEDDED_CASE_DATA__';
if(template.split(placeholder).length!==2)throw Error('Template must contain the dataset placeholder exactly once');
if(!template.includes('noindex,nofollow,noarchive'))throw Error('Research-only robots policy missing');
if(!template.includes('不能倒灌为当时已知'))throw Error('Retrospective isolation label missing');

for(const c of data.cases)for(const k of c.checkpoints){
  const view=selectAsOf(data,c.id,k.id);
  if(view.known.some(o=>Date.parse(o.observed_at)>Date.parse(k.at)))throw Error('Lookahead violation: '+k.id);
}
// Replace with script-escaped JSON; data is serialized safely for an inert application/json node.
const payload=JSON.stringify(data).replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('&','\\u0026');
const html=template.replace(placeholder,payload);
if(/<script[^>]+src\s*=/.test(html))throw Error('External scripts are forbidden in offline research viewer');
if(!html.includes('schema_version'))throw Error('Missing embedded data');
const outFile=path.resolve('.astro/critical-inquiry-research/three-case-time-machine.html');
fs.mkdirSync(path.dirname(outFile),{recursive:true});
fs.writeFileSync(outFile,html);
console.log(JSON.stringify({
 status:'BUILT_RESEARCH_ONLY',
 output:outFile,
 case_count:data.cases.length,
 checkpoint_count:data.cases.reduce((n,c)=>n+c.checkpoints.length,0),
 observation_count:data.cases.reduce((n,c)=>n+c.observations.length,0),
 size_bytes:Buffer.byteLength(html)
},null,2));
