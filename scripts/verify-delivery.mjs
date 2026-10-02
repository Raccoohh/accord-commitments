import {readFile,readdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
const files=execFileSync('git',['-c','safe.directory='+process.cwd().replaceAll('\\','/'),'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const secret=process.env.OPENAI_API_KEY;
if(!secret)throw Error('Cannot perform exact secret scan without configured environment.');
const leaked=[];for(const file of files){const data=await readFile(file);if(data.includes(Buffer.from(secret)))leaked.push(file);}
if(files.includes('.env.local')||leaked.length)throw Error('Secret verification failed; file paths only: '+leaked.join(', '));
const broken=[];
for(const file of files.filter(f=>f.endsWith('.md'))){
  const content=await readFile(file,'utf8');
  for(const match of content.matchAll(/\]\(([^)]+)\)/g)){
    const target=match[1];if(/^(https?:|#|mailto:)/.test(target))continue;
    try{await readFile(resolve(dirname(file),target.split('#')[0]));}catch(e){if(e.code!=='EISDIR')broken.push({file,target});}
  }
}
if(broken.length)throw Error('Broken local document links: '+JSON.stringify(broken));
const output={checkedAt:new Date().toISOString(),trackedFileCount:files.length,envLocalTracked:false,exactSecretMatches:0,brokenLocalMarkdownLinks:0,scope:'Current tracked delivery files; no plaintext secret emitted'};
await writeFile('reports/delivery-verification.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output));
