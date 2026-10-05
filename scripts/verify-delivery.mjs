import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
const gitArgs=['-c','safe.directory='+process.cwd().replaceAll('\\','/')];
const files=execFileSync('git',[...gitArgs,'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const secrets=[process.env.OPENAI_API_KEY,process.env.HF_TOKEN,process.env.NGROK_AUTHTOKEN].filter(Boolean);
try{const demo=JSON.parse((await readFile('.runtime/demo/config.json','utf8')).replace(/^\uFEFF/,''));if(demo.password)secrets.push(demo.password);}catch(e){if(e.code!=='ENOENT')throw e;}
if(!secrets.length)throw Error('Cannot perform exact secret scan without configured environment.');
const patterns=secrets.flatMap(secret=>[Buffer.from(secret),Buffer.from(secret,'utf16le')]);
const leaked=[];for(const file of files){const data=await readFile(file);if(patterns.some(pattern=>data.includes(pattern)))leaked.push(file);}
if(files.includes('.env.local')||leaked.length)throw Error('Secret verification failed; file paths only: '+leaked.join(', '));
const objects=execFileSync('git',[...gitArgs,'rev-list','--objects','--all'],{encoding:'utf8'}).trim().split('\n');
if(objects.some(line=>/ \.env(?:\.local)?$/.test(line)))throw Error('A secret env file appears in repository history.');
const ids=objects.map(line=>line.split(' ')[0]);
const metadata=execFileSync('git',[...gitArgs,'cat-file','--batch-check=%(objectname) %(objecttype)'],{input:ids.join('\n')+'\n',encoding:'utf8'}).trim().split('\n');
let historyBlobsChecked=0;
for(const line of metadata){
  const [id,type]=line.split(' ');if(type!=='blob')continue;
  const data=execFileSync('git',[...gitArgs,'cat-file','blob',id],{maxBuffer:30_000_000});historyBlobsChecked++;
  if(patterns.some(pattern=>data.includes(pattern)))throw Error('Secret verification failed in repository history; no secret emitted.');
}
const broken=[];
for(const file of files.filter(f=>f.endsWith('.md'))){
  const content=await readFile(file,'utf8');
  for(const match of content.matchAll(/\]\(([^)]+)\)/g)){
    const target=match[1];if(/^(https?:|#|mailto:)/.test(target))continue;
    try{await readFile(resolve(dirname(file),target.split('#')[0]));}catch(e){if(e.code!=='EISDIR')broken.push({file,target});}
  }
}
if(broken.length)throw Error('Broken local document links: '+JSON.stringify(broken));
const output={checkedAt:new Date().toISOString(),trackedFileCount:files.length,historyBlobsChecked,envLocalTracked:false,exactSecretMatches:0,brokenLocalMarkdownLinks:0,scope:'Current tracked files and all reachable Git history blobs; exact configured secrets scanned as UTF-8 and UTF-16LE; no plaintext secret emitted'};
await writeFile('reports/delivery-verification.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output));
