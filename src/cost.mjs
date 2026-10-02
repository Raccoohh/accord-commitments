// Rates are documented in docs/COSTS.md. Estimates are never labelled billed totals.
export const RATES={checkedOn:'2026-10-02',asrPerMinute:0.006,inputPerMillion:0.40,cachedInputPerMillion:0.10,outputPerMillion:1.60};
export function calculateCost(trace){
  let measuredTokenCost=0,estimatedAsrCost=0,unknown=false;
  for(const call of trace.calls){
    if(call.stage==='asr'){
      if(call.status>=200&&call.status<300)estimatedAsrCost+=trace.audioSeconds/60*RATES.asrPerMinute;
      else unknown=true;
    }else if(call.usage){
      const u=call.usage,cached=u.input_tokens_details?.cached_tokens??0;
      if(!Number.isFinite(u.input_tokens)||!Number.isFinite(u.output_tokens))unknown=true;
      else measuredTokenCost+=((u.input_tokens-cached)*RATES.inputPerMillion+cached*RATES.cachedInputPerMillion+u.output_tokens*RATES.outputPerMillion)/1e6;
    }else unknown=true;
  }
  const estimatedKnownUsd=measuredTokenCost+estimatedAsrCost;
  return {currency:'USD',estimatedKnownUsd,measuredTokenCost,estimatedAsrCost,totalVariableOperationUsd:unknown?null:estimatedKnownUsd,costPerAudioMinute:unknown?null:estimatedKnownUsd/(trace.audioSeconds/60),unknownChargesPossible:unknown,basis:'ASR duration estimate plus measured extraction token usage; not a provider invoice',rates:RATES,ttsApiCost:0,paidIntermediaries:0,separateDiarizationCost:0,hosting:'Local compute/electricity and machine/OS costs excluded'};
}
