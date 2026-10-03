const $=id=>document.getElementById(id);
const audio=$('audio');let selectedFile,objectUrl,jobId,busy=false,result,clipEnd=null,clipTimer=null;
const stageOrder=['preparing','transcribing','analyzing','checking_evidence'];
const stageLabels={preparing:'Preparing your recording…',validating:'Validating the audio…',transcribing:'Transcribing and identifying speakers…',analyzing:'Resolving the final commitments…',checking_evidence:'Checking quotes and timestamps…'};
const escape=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=value=>`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
const human=s=>s.replaceAll('_',' ');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function error(message){$('error').textContent=message;$('error').hidden=false;}
function setBusy(value){busy=value;$('file').disabled=value;$('analyze').disabled=value||!selectedFile;$('reset').hidden=value||!selectedFile;}
function stage(name){$('progress').hidden=false;$('progress-label').textContent=stageLabels[name]??'Processing…';const index=stageOrder.indexOf(name==='validating'?'preparing':name);document.querySelectorAll('[data-stage]').forEach((el,i)=>{el.className=i===index?'active':i<index?'complete':'';});}
function stopClip(){clipEnd=null;clearTimeout(clipTimer);clipTimer=null;}
async function select(file){
  if(busy)return;
  $('error').hidden=true;
  if(!file)return;
  if(file.size>20_000_000){error('This file exceeds 20 MB. Upload a smaller recording.');return;}
  if(!/\.(wav|mp3|m4a|ogg|webm)$/i.test(file.name)){error('Choose a WAV, MP3, M4A, OGG or WebM audio file.');return;}
  if(jobId)fetch(`/api/jobs/${jobId}`,{method:'DELETE'}).catch(()=>{});
  jobId=null;result=null;stopClip();audio.pause();if(objectUrl)URL.revokeObjectURL(objectUrl);
  selectedFile=file;objectUrl=URL.createObjectURL(file);audio.src=objectUrl;audio.hidden=false;
  $('filename').textContent=file.name;$('file-detail').textContent=`${(file.size/1e6).toFixed(2)} MB · ready to analyze`;$('file-info').hidden=false;
  $('empty').hidden=false;$('results').hidden=true;$('progress').hidden=true;$('result-status').textContent='READY TO ANALYZE';$('playback-state').textContent='';setBusy(false);
}
$('file').addEventListener('change',e=>select(e.target.files[0]));
$('dropzone').addEventListener('dragover',e=>{e.preventDefault();if(!busy)$('dropzone').classList.add('drag');});
$('dropzone').addEventListener('dragleave',()=>$('dropzone').classList.remove('drag'));
$('dropzone').addEventListener('drop',e=>{e.preventDefault();$('dropzone').classList.remove('drag');if(e.dataTransfer.files.length!==1){error('Choose one recording at a time.');return;}select(e.dataTransfer.files[0]);});
$('reset').addEventListener('click',async()=>{if(busy)return;if(jobId)await fetch(`/api/jobs/${jobId}`,{method:'DELETE'}).catch(()=>{});jobId=null;selectedFile=null;result=null;stopClip();audio.pause();audio.removeAttribute('src');audio.load();if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;audio.hidden=true;$('file').value='';$('file-info').hidden=true;$('results').hidden=true;$('empty').hidden=false;$('error').hidden=true;$('progress').hidden=true;$('playback-state').textContent='';$('result-status').textContent='AWAITING AUDIO';setBusy(false);$('file').focus();});

async function prepareAudio(file){
  const context=new AudioContext();let decoded;
  try{decoded=await context.decodeAudioData(await file.arrayBuffer());}catch{throw Error('This audio could not be decoded. Try a PCM WAV or MP3 recording.');}finally{await context.close();}
  if(decoded.duration<0.5||decoded.duration>180)throw Error('Recordings must be between 0.5 seconds and 3 minutes.');
  const offline=new OfflineAudioContext(1,Math.ceil(decoded.duration*16000),16000),source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();
  const rendered=await offline.startRendering(),samples=rendered.getChannelData(0),buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
  const text=(offset,value)=>[...value].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));
  text(0,'RIFF');view.setUint32(4,36+samples.length*2,true);text(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,samples.length*2,true);
  samples.forEach((sample,i)=>view.setInt16(44+i*2,Math.max(-1,Math.min(1,sample))*(sample<0?32768:32767),true));
  return {buffer,duration:decoded.duration};
}

$('analyze').addEventListener('click',async()=>{
  if(!selectedFile||busy)return;
  setBusy(true);$('error').hidden=true;$('results').hidden=true;$('empty').hidden=false;audio.pause();stopClip();
  const started=performance.now();stage('preparing');
  try{
    const prepared=await prepareAudio(selectedFile),preparationMs=Math.round(performance.now()-started);
    $('file-detail').textContent=`${time(prepared.duration)} · ${(selectedFile.size/1e6).toFixed(2)} MB · English`;
    const response=await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'audio/wav'},body:prepared.buffer,signal:AbortSignal.timeout(35000)});
    const created=await response.json();if(!response.ok)throw Error(created.error??'Could not upload audio.');jobId=created.id;
    while(true){
      const poll=await fetch(`/api/jobs/${jobId}`,{signal:AbortSignal.timeout(15000)}),job=await poll.json();
      if(!poll.ok)throw Error(job.error??'Could not read the result.');
      if(job.status==='error')throw Error(job.error);
      if(job.status==='done'){
        result=job.result;job.metrics.client={preparationMs,uploadToUsefulResultMs:Math.round(performance.now()-started)};
        render(result,job.metrics);break;
      }
      stage(job.status);await delay(650);
    }
  }catch(e){error(e.name==='TimeoutError'?'The connection timed out. The server may still be processing this recording. Wait before retrying.':e.message);$('result-status').textContent='NEEDS ATTENTION';}
  finally{$('progress').hidden=true;setBusy(false);}
});

function speakerName(id){const person=result?.speakers.find(s=>s.speakerId===id);return person?.name??`Speaker ${id} (name uncertain)`;}
function evidenceHtml(e){return `<div class="evidence"><div class="evidence-meta"><span>${escape(speakerName(e.speakerId))}</span><span>· ${time(e.start)}–${time(e.end)}</span><span>· ${escape(e.role)}</span><button class="play" data-start="${e.start}" data-end="${e.end}">▷ Play evidence</button></div><blockquote>“${escape(e.quote)}”</blockquote></div>`;}
function card(item){return `<article class="commitment" data-status="${item.status}"><div class="card-top"><div class="card-title-row"><span class="check">${item.status==='confirmed'?'✓':'○'}</span><h3>${escape(item.task)}</h3><span class="badge ${item.status}">${escape(human(item.status))}</span></div><div class="fields"><div class="field"><small>OWNER</small><span>${escape(item.owner??'Owner not assigned')}</span></div><div class="field"><small>FINAL DEADLINE</small><span>${escape(item.deadlineOriginal??'Deadline not agreed')}${item.deadlineNormalized?` <span class="small">(${escape(item.deadlineNormalized)})</span>`:''}</span></div></div>${item.uncertainties.length?`<p class="uncertainty">${item.uncertainties.map(x=>escape(human(x))).join(' · ')}</p>`:''}<p class="reason">${escape(item.reason)}</p></div>${item.evidence.length?`<div class="evidence-list">${item.evidence.map(evidenceHtml).join('')}</div>`:'<div class="evidence-list small">No verified evidence is available for this clarification.</div>'}${item.history.length?`<details class="history"><summary>Change history (${item.history.length})</summary>${item.history.map(h=>`<p>${escape(h.field)}: <s>${escape(h.previousValue)}</s> → ${escape(h.replacementValue)}</p>${h.evidence.map(evidenceHtml).join('')}`).join('')}</details>`:''}</article>`;}
function render(data,metrics){
  $('empty').hidden=true;$('results').hidden=false;$('result-status').textContent=data.outcome.toUpperCase();
  $('result-heading').innerHTML=`<h2>${data.outcome==='unusable'?'A clearer recording is needed.':data.outcome==='partial'?'Some decisions need a closer look.':'Here’s where the conversation landed.'}</h2><p>${escape(data.message)}</p>`;
  $('warnings').innerHTML=data.warnings.map(w=>`<p class="warning">${escape(w)}</p>`).join('');
  const active=data.items.filter(i=>i.status==='confirmed'),inactive=data.items.filter(i=>['cancelled','proposed_not_accepted'].includes(i.status)),questions=data.items.filter(i=>i.status==='unresolved'&&i.source==='participant_question'),clarifications=data.items.filter(i=>i.status==='unresolved'&&i.source!=='participant_question');
  $('summary').innerHTML=[[active.length,'confirmed'],[questions.length,'open questions'],[inactive.length,'not active']].map(([n,label])=>`<div class="stat"><strong>${n}</strong><span>${label}</span></div>`).join('');
  $('confirmed').innerHTML=active.map(card).join('')||'<p class="empty-list">No confirmed commitments were found.</p>';
  $('unresolved-section').hidden=!questions.length;$('unresolved').innerHTML=questions.map(card).join('');
  $('clarifications-section').hidden=!data.clarifications.length&&!clarifications.length;$('clarifications').innerHTML=data.clarifications.map(c=>`<div class="clarification">${escape(c.text)}</div>`).join('')+clarifications.map(card).join('');
  $('inactive-section').hidden=!inactive.length;$('inactive-label').textContent=`Not in the active list (${inactive.length})`;$('inactive').innerHTML=inactive.map(card).join('');
  $('speakers').innerHTML=data.speakers.map(s=>`<span class="speaker-chip">${escape(s.speakerId)} → ${escape(s.name??'Name uncertain')} · ${escape(s.confidence)}</span>`).join('');
  $('transcript').innerHTML=data.segments.map(s=>`<div class="transcript-row"><div class="transcript-label">${escape(speakerName(s.speakerId))}<br><button class="play" data-start="${s.start}" data-end="${s.end}">${time(s.start)} ▷</button></div><p>${escape(s.text)}</p></div>`).join('')||'<p class="empty-list">No reliable transcript.</p>';
  $('metrics').textContent=JSON.stringify(metrics,null,2);
}

document.addEventListener('click',async event=>{
  const button=event.target.closest('button[data-start]');if(!button)return;
  stopClip();audio.pause();const start=Math.max(0,Number(button.dataset.start)-0.2),end=Math.min(audio.duration,Number(button.dataset.end)+0.2);clipEnd=end;
  try{audio.currentTime=start;await audio.play();$('playback-state').textContent=`Playing evidence · ${time(start)}–${time(end)}`;clipTimer=setTimeout(()=>{audio.pause();stopClip();$('playback-state').textContent='Evidence playback complete.';},Math.max(0,(end-audio.currentTime)/audio.playbackRate*1000));}catch{stopClip();error('Audio playback could not start. Use the audio controls or choose the recording again.');}
});
audio.addEventListener('timeupdate',()=>{if(clipEnd!==null&&audio.currentTime>=clipEnd){audio.pause();stopClip();$('playback-state').textContent='Evidence playback complete.';}});
audio.addEventListener('pause',()=>{if(clipEnd!==null&&audio.currentTime<clipEnd){stopClip();$('playback-state').textContent='Playback paused.';}});
audio.addEventListener('ratechange',()=>{if(clipEnd!==null){clearTimeout(clipTimer);clipTimer=setTimeout(()=>{audio.pause();stopClip();},Math.max(0,(clipEnd-audio.currentTime)/audio.playbackRate*1000));}});
fetch('/api/health').then(r=>r.json()).then(h=>{if(!h.ready)error('Local speech models and Ollama must finish setup before audio analysis is available.');}).catch(()=>error('The local server is unavailable. Restart it and reload this page.'));
