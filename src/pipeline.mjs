import {readWav} from './audio.mjs';
import {localTranscribe as transcribe,localExtract as extract,LOCAL_MODELS as MODELS} from './local-provider.mjs';
import {normalizeSegments,validateExtraction} from './validate.mjs';
import {calculateCost} from './cost.mjs';

export async function analyze(audio,{onStage=()=>{},onMetrics=()=>{},id,uploadMs=0}={}){
  const started=performance.now();
  const trace={id,startedAt:new Date().toISOString(),provider:'local',models:MODELS,audioSeconds:null,uploadMs,stages:{},calls:[],retries:0};
  try{
    onStage('validating');let stage=performance.now();
    const info=readWav(audio);trace.audioSeconds=info.duration;trace.stages.validationMs=Math.round(performance.now()-stage);
    if(info.peak<0.0001){
      trace.outcome='unusable';
      return {outcome:'unusable',message:'No audible speech was detected. Please upload a new recording with two clearly audible speakers.',items:[],speakers:[],segments:[],warnings:[],clarifications:[],timingPrecision:'segment'};
    }
    onStage('transcribing');stage=performance.now();
    const transcript=await transcribe(audio,trace);
    trace.stages.transcriptionMs=Math.round(performance.now()-stage);
    const segments=normalizeSegments(transcript.segments,info.duration);
    if(!segments.length){trace.outcome='unusable';return {outcome:'unusable',message:'No reliable speech was transcribed. Please upload a clearer recording.',items:[],speakers:[],segments:[],warnings:[],clarifications:[],timingPrecision:'segment'};}
    onStage('analyzing');stage=performance.now();
    const extracted=await extract(segments,trace);trace.stages.extractionMs=Math.round(performance.now()-stage);
    onStage('checking_evidence');stage=performance.now();
    const result=validateExtraction(extracted,segments);trace.stages.evidenceValidationMs=Math.round(performance.now()-stage);trace.outcome=result.outcome;
    return {...result,segments,timingPrecision:'segment'};
  }catch(error){trace.outcome='error';trace.errorCode=error.code??'validation_or_internal';throw error;}
  finally{
    trace.processingMs=Math.round(performance.now()-started);trace.totalServerMs=trace.processingMs+uploadMs;
    trace.cost=trace.audioSeconds?calculateCost(trace):null;
    onMetrics(trace);
  }
}
