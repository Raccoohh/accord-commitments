const r=await fetch('http://127.0.0.1:11435/api/pull',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:process.argv[2]??'qwen2.5:7b',stream:true})});
if(!r.ok)throw Error(`Model download failed (${r.status})`);
const decoder=new TextDecoder();let pending='',lastTime=0;
for await(const chunk of r.body){pending+=decoder.decode(chunk,{stream:true});let end;while((end=pending.indexOf('\n'))!==-1){const line=pending.slice(0,end);pending=pending.slice(end+1);if(!line.trim())continue;const event=JSON.parse(line);if(event.error)throw Error(event.error);if(Date.now()-lastTime>15000||event.status==='success'){console.log(JSON.stringify({status:event.status,completed:event.completed,total:event.total}));lastTime=Date.now();}}}
