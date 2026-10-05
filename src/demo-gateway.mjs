// Optional authenticated ingress. The inference app remains bound to loopback.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import {MAX_BYTES} from './audio.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const digest=value=>createHash('sha256').update(value).digest();
const samples=new Set(['A','B','C','D']);
const jobPath=/^\/api\/jobs\/([a-f0-9-]{36})$/;
const notice=`<div class="recording-tips"><h3>Reviewer demo</h3><p>Password-protected, temporary demo hosted on the author's computer. Use fictional or shareable recordings. Uploads pass through the tunnel service to that computer for local analysis.</p><p>Download a sample: <a href="/demo/A.wav" download>A: commitments</a> · <a href="/demo/B.wav" download>B: changed date</a> · <a href="/demo/C.wav" download>C: ambiguity</a> · <a href="/demo/D.wav" download>D: silence</a>. Then select the downloaded file below.</p><p>English · two speakers · up to 3 minutes. Please allow a few minutes for analysis. Results belong to this browser session and expire.</p></div>`;

export function createDemoGateway({getConfig,upstream='http://127.0.0.1:3000',port=3100,read=readFile}={}){
  const ownership=new Map(),failedAuth=new Map();
  const upstreamUrl=new URL(upstream);
  if(!['127.0.0.1','localhost','[::1]'].includes(upstreamUrl.hostname))throw Error('Demo upstream must be loopback.');
  function send(res,status,message){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:message}));}
  const server=http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Robots-Tag','noindex, nofollow');
    try{
      const config=await getConfig();
      if(!config.username||typeof config.password!=='string'||config.password.length<20){send(res,503,'Demo access is not configured.');return;}
      const localOrigins=[`http://127.0.0.1:${port}`,`http://localhost:${port}`];
      const origins=new Set(localOrigins);
      if(config.publicOrigin){const u=new URL(config.publicOrigin);if(u.protocol!=='https:'||u.origin!==config.publicOrigin)throw Error('Invalid public origin');origins.add(u.origin);}
      if(![...origins].some(o=>new URL(o).host===req.headers.host)){send(res,403,'Unexpected demo host.');return;}
      if(config.publicOrigin&&req.headers.host===new URL(config.publicOrigin).host&&req.headers['x-forwarded-proto']==='http'){
        res.writeHead(308,{Location:config.publicOrigin+new URL(req.url,'http://localhost').pathname});res.end();return;
      }
      if(req.headers.origin&&!origins.has(req.headers.origin)){send(res,403,'Cross-origin requests are not allowed.');return;}
      if(req.headers['sec-fetch-site']==='cross-site'&&req.method!=='GET'){send(res,403,'Cross-site changes are not allowed.');return;}
      const ip=req.headers['cf-connecting-ip']??req.socket.remoteAddress,now=Date.now();
      for(const [key,value]of failedAuth)if(now-value.start>60_000)failedAuth.delete(key);
      const attempts=failedAuth.get(ip);
      if(attempts?.count>=30){res.setHeader('Retry-After','60');send(res,429,'Please wait before trying the password again.');return;}
      const expected='Basic '+Buffer.from(config.username+':'+config.password).toString('base64');
      if(!timingSafeEqual(digest(req.headers.authorization??''),digest(expected))){
        if(failedAuth.size>=1000)failedAuth.delete(failedAuth.keys().next().value);
        failedAuth.set(ip,{start:attempts?.start??now,count:(attempts?.count??0)+1});
        res.setHeader('WWW-Authenticate','Basic realm="Accord reviewer demo", charset="UTF-8"');send(res,401,'Enter the reviewer credentials supplied with the submission.');return;
      }
      failedAuth.delete(ip);
      const pathname=new URL(req.url,'http://localhost').pathname,match=pathname.match(jobPath);
      const allowed=(req.method==='GET'&&['/','/app.js','/styles.css','/api/health'].includes(pathname))||(req.method==='POST'&&pathname==='/api/jobs')||(match&&['GET','DELETE'].includes(req.method));
      const sample=pathname.match(/^\/demo\/([A-D])\.wav$/);
      if(req.method==='GET'&&sample&&samples.has(sample[1])){
        const data=await read(root+`fixtures/audio/${sample[1]}.wav`);res.writeHead(200,{'Content-Type':'audio/wav','Content-Disposition':`attachment; filename="${sample[1]}.wav"`,'Content-Length':data.length});res.end(data);return;
      }
      if(!allowed){send(res,404,'Not found.');return;}
      const sessionName='accord_review_session';
      let session=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(sessionName+'='))?.slice(sessionName.length+1);
      if(!/^[a-f0-9]{64}$/.test(session??'')){
        session=randomBytes(32).toString('hex');
        const secure=!localOrigins.some(o=>new URL(o).host===req.headers.host);
        res.setHeader('Set-Cookie',`${sessionName}=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=7200${secure?'; Secure':''}`);
      }
      for(const [id,entry]of ownership)if(now-entry.created>60*60_000)ownership.delete(id);
      if(match&&ownership.get(match[1])?.session!==session){send(res,404,'Result not available in this browser session.');return;}
      let body;
      if(req.method==='POST'){
        if(req.headers['content-type']?.split(';')[0]!=='audio/wav'){send(res,415,'Upload WAV through the audio uploader.');return;}
        if(Number(req.headers['content-length'])>MAX_BYTES){send(res,413,'Audio exceeds the demo upload limit.');return;}
        const chunks=[];let size=0;
        for await(const chunk of req){size+=chunk.length;if(size>MAX_BYTES){send(res,413,'Audio exceeds the demo upload limit.');return;}chunks.push(chunk);}
        body=Buffer.concat(chunks);
      }
      const response=await fetch(new URL(pathname,upstreamUrl),{method:req.method,headers:{...(body?{'Content-Type':'audio/wav'}:{}),Origin:upstreamUrl.origin},body,signal:AbortSignal.timeout(35_000),redirect:'error'});
      let data=Buffer.from(await response.arrayBuffer());
      if(pathname==='/'&&response.ok){
        data=Buffer.from(data.toString().replace('<div class="section-label"><span>01</span> YOUR RECORDING</div>',notice+'<div class="section-label"><span>01</span> YOUR RECORDING</div>').replace('Audio and transcript are processed on this computer by local speech and language models.','Audio and transcript are processed by local models on the demo host computer. Uploaded audio travels through the tunnel service; do not upload confidential recordings to this shared demo.'));
      }
      if(req.method==='POST'&&response.status===202){const result=JSON.parse(data);if(!/^[a-f0-9-]{36}$/.test(result.id))throw Error('Unexpected job id');ownership.set(result.id,{session,created:now});}
      if(req.method==='DELETE'&&match&&response.ok)ownership.delete(match[1]);
      for(const header of ['content-type','content-security-policy'])if(response.headers.has(header))res.setHeader(header,response.headers.get(header));
      res.writeHead(response.status);res.end(data);
    }catch{if(!res.headersSent)send(res,503,'The demo is temporarily unavailable. Please retry shortly.');else res.end();}
  });
  server.requestTimeout=30_000;server.headersTimeout=15_000;
  return server;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const configPath=root+'.runtime/demo/config.json';
  const getConfig=async()=>JSON.parse((await readFile(configPath,'utf8')).replace(/^\uFEFF/,''));
  const server=createDemoGateway({getConfig});
  server.listen(3100,'127.0.0.1',()=>console.log('Reviewer gateway ready on loopback port 3100.'));
}
