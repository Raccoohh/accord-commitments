import {extractionSchema} from './schema.mjs';
import {extractionInstructions} from './prompt.mjs';
export const MODELS={asr:'gpt-4o-transcribe-diarize',extraction:'gpt-4.1-mini-2025-04-14'};

export class ProviderError extends Error {
  constructor(message,code){super(message);this.code=code;}
}

async function request(path,init,trace,stage){
  const started=performance.now();
  const call={stage,model:MODELS[stage],attempt:1,startedAt:new Date().toISOString(),usage:null,status:null};
  trace.calls.push(call);
  try{
    const response=await fetch(`https://api.openai.com/v1/${path}`,{
      ...init,headers:{...init.headers,Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},signal:AbortSignal.timeout(120_000)
    });
    call.status=response.status;
    call.requestId=response.headers.get('x-request-id');
    const data=await response.json().catch(()=>null);
    if(!response.ok){
      const code=data?.error?.code;
      call.errorCode=code??null;
      // Error metadata only; never persist a provider message or request content.
      call.errorType=data?.error?.type??null;
      call.retryAfter=response.headers.get('retry-after');
      const message=String(data?.error?.message??'');
      call.zeroLimit=/limit\s*:?\s*0\b/i.test(message);
      call.quotaRelated=/quota|billing|credits|balance/i.test(message);
      if(response.status===401)throw new ProviderError('The server API key was rejected. Check the local server configuration.','authentication');
      if(code==='insufficient_quota'||call.quotaRelated)throw new ProviderError('The API project has no available quota. Check API billing and project limits, then try again.','quota');
      if(call.zeroLimit)throw new ProviderError('The API project has a zero limit for this model. Check the project model permissions and rate limits.','zero_model_limit');
      if(response.status===429)throw new ProviderError('The audio service is rate limited. Wait a moment and try again.','rate_limit');
      throw new ProviderError(`The ${stage==='asr'?'transcription':'analysis'} service failed (HTTP ${response.status}). Try again later.`,'upstream');
    }
    if(!data)throw new ProviderError('The service returned an empty or invalid response.','empty_response');
    call.usage=data.usage??null;
    call.returnedModel=data.model??null;
    return data;
  }catch(error){
    if(error instanceof ProviderError)throw error;
    throw new ProviderError(error.name==='TimeoutError'?'Processing timed out. Try a shorter or clearer recording.':'Could not reach the audio service. Check the server connection and try again.','network_or_timeout');
  }finally{call.ms=Math.round(performance.now()-started);}
}

export async function transcribe(audio,trace){
  const form=new FormData();
  // Deliberately generic filename: no fixture IDs or metadata reach the analyzer.
  form.append('file',new Blob([audio],{type:'audio/wav'}),'recording.wav');
  form.append('model',MODELS.asr);form.append('response_format','diarized_json');
  form.append('chunking_strategy','auto');form.append('language','en');
  return request('audio/transcriptions',{method:'POST',body:form},trace,'asr');
}

export async function extract(segments,trace){
  const response=await request('responses',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:MODELS.extraction,store:false,temperature:0,
      instructions:extractionInstructions,
      input:JSON.stringify({untrustedTranscriptSegments:segments}),
      max_output_tokens:7000,
      text:{format:{type:'json_schema',name:'final_commitments',strict:true,schema:extractionSchema}}
    })
  },trace,'extraction');
  if(response.status!=='completed')throw new ProviderError('Analysis did not complete. Please retry with a shorter recording.','incomplete');
  const chunks=(response.output??[]).flatMap(o=>o.content??[]);
  if(chunks.some(c=>c.type==='refusal'))throw new ProviderError('The service could not analyze this recording. Try another project conversation.','refusal');
  const content=chunks.filter(c=>c.type==='output_text').map(c=>c.text).join('');
  if(!content)throw new ProviderError('The analysis service returned no structured result.','empty_response');
  try{return JSON.parse(content);}catch{throw new ProviderError('The analysis service returned invalid structured data.','invalid_json');}
}
