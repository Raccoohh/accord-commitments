import http from 'node:http';
import {readFile,appendFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import {LOCAL_MODELS} from './local-provider.mjs';
import {analyze} from './pipeline.mjs';
import {MAX_BYTES} from './audio.mjs';

const port=Number(process.env.PORT??3000),jobs=new Map();let busy=false;
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(new URL('../logs/',import.meta.url),{recursive:true});
const staticFiles=new Map([['/',['public/index.html','text/html; charset=utf-8']],['/app.js',['public/app.js','text/javascript; charset=utf-8']],['/styles.css',['public/styles.css','text/css; charset=utf-8']]]);
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}

const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; media-src 'self' blob:; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  const localHosts=new Set([`127.0.0.1:${port}`,`localhost:${port}`,`[::1]:${port}`]);
  if(!localHosts.has(req.headers.host)){send(res,403,{error:'Local requests only.'});return;}
  if(req.headers.origin&&!new Set([...localHosts].map(h=>`http://${h}`)).has(req.headers.origin)){send(res,403,{error:'Cross-origin requests are not allowed.'});return;}
  const pathname=new URL(req.url,'http://localhost').pathname;
  try{
    if(req.method==='GET'&&staticFiles.has(pathname)){
      const [file,type]=staticFiles.get(pathname);res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(await readFile(root+file));return;
    }
    if(req.method==='GET'&&pathname==='/api/health'){
      let modelReady=false;
      try{const data=await(await fetch('http://127.0.0.1:11435/api/tags',{signal:AbortSignal.timeout(1000)})).json();modelReady=data.models?.some(m=>m.name===LOCAL_MODELS.extraction)??false;}catch{}
      send(res,200,{ready:existsSync(root+'.runtime/local-ready.json')&&modelReady,provider:'local',models:LOCAL_MODELS,limits:{seconds:180,sourceBytes:20_000_000},privacy:'Audio and transcript processed locally. Metrics without audio/transcript written to logs.'});return;
    }
    if(req.method==='POST'&&pathname==='/api/jobs'){
      if(busy){send(res,429,{error:'Another recording is being processed. Please wait until it finishes.'});return;}
      if(req.headers['content-type']?.split(';')[0]!=='audio/wav'){send(res,415,{error:'Use the audio uploader to send a WAV recording.'});return;}
      if(Number(req.headers['content-length'])>MAX_BYTES){send(res,413,{error:'Converted audio is too large. Maximum duration is 3 minutes.'});return;}
      busy=true;let accepted=false;
      try{
        const uploadStart=performance.now();let size=0;const chunks=[];
        for await(const chunk of req){size+=chunk.length;if(size>MAX_BYTES){send(res,413,{error:'Audio upload exceeds the size limit.'});return;}chunks.push(chunk);}
        const audio=Buffer.concat(chunks),id=randomUUID();
        const job={id,status:'validating',createdAt:Date.now()};jobs.set(id,job);accepted=true;
        send(res,202,{id});
        void analyze(audio,{id,uploadMs:Math.round(performance.now()-uploadStart),onStage:stage=>job.status=stage,onMetrics:metrics=>{
          job.metrics=metrics;
          appendFile(root+'logs/runs.jsonl',JSON.stringify(metrics)+'\n').catch(()=>console.error('Could not write run metrics.'));
        }}).then(result=>{job.result=result;job.status='done';}).catch(error=>{job.error=error.message;job.status='error';}).finally(()=>{job.completedAt=Date.now();busy=false;});
      }finally{if(!accepted)busy=false;}
      return;
    }
    const match=pathname.match(/^\/api\/jobs\/([a-f0-9-]{36})$/);
    if(req.method==='GET'&&match){const job=jobs.get(match[1]);send(res,job?200:404,job??{error:'This result expired. Please upload the recording again.'});return;}
    if(req.method==='DELETE'&&match){const job=jobs.get(match[1]);if(job&&!job.completedAt){send(res,409,{error:'Wait for processing to finish before clearing this result.'});return;}jobs.delete(match[1]);send(res,200,{deleted:true});return;}
    send(res,404,{error:'Not found.'});
  }catch{if(!res.headersSent)send(res,500,{error:'The server could not process the request. Please try another recording.'});else res.end();}
});
server.requestTimeout=30_000;
server.headersTimeout=15_000;
setInterval(()=>{for(const [id,j]of jobs)if(j.completedAt&&Date.now()-j.completedAt>30*60_000)jobs.delete(id);},60_000).unref();
server.listen(port,'127.0.0.1',()=>console.log(`Final Commitments: http://127.0.0.1:${port} | Local inference only`));
