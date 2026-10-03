import test from 'node:test';
import assert from 'node:assert/strict';
import {localExtract} from '../src/local-provider.mjs';
import {calculateCost} from '../src/cost.mjs';
import {readFile} from 'node:fs/promises';

test('local extraction only addresses loopback Ollama and preserves schema/data boundary',async t=>{
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.equal(url,'http://127.0.0.1:11435/api/chat');assert.equal('Authorization'in options.headers,false);
    const payload=JSON.parse(options.body);assert.equal(payload.model,'qwen2.5:7b');assert.equal(payload.stream,false);assert.ok(payload.messages[1].content.endsWith('[s0] unknown: "Example input"'));
    if(!payload.format)return new Response(JSON.stringify({message:{content:'No tasks.'},prompt_eval_count:2,eval_count:1,done_reason:'stop'}));
    assert.equal(payload.format.additionalProperties,false);
    assert.deepEqual(payload.format.properties.tasks.items.properties.evidence.items.properties.segmentId.enum,['s0']);
    assert.deepEqual(payload.format.properties.speakers.items.properties.introductionSegmentId.enum,['s0',null]);
    assert.deepEqual(payload.format.properties.openQuestions.items.properties.segmentIds.items.enum,['s0']);
    assert.equal(payload.format.properties.tasks.items.properties.task.enum,undefined);
    assert.equal(payload.format.properties.speakers.items.properties.name.enum,undefined);
    assert.equal(payload.format.properties.tasks.items.properties.reason.enum,undefined);
    // Ollama's decoding grammar alone does not tell the model what fields mean.
    assert.ok(payload.messages[0].content.includes(JSON.stringify(payload.format)));
    return new Response(JSON.stringify({message:{content:JSON.stringify({speakers:[],tasks:[],openQuestions:[],warnings:[],recordingStatus:'readable'})},prompt_eval_count:2,eval_count:1,done_reason:'stop'}));
  });const trace={calls:[]};assert.deepEqual((await localExtract([{id:'s0',text:'Example input'}],trace)).items,[]);assert.equal(trace.calls[0].provider,'local');assert.equal(trace.calls[0].usage.output_tokens,1);
});
test('local costs distinguish no API fees from unmeasured local compute',()=>{const c=calculateCost({provider:'local',audioSeconds:60,calls:[]});assert.equal(c.apiChargesUsd,0);assert.equal(c.localComputeCostUsd,null);});
test('active pipeline has no paid provider import or fallback',async()=>{const source=await readFile('src/pipeline.mjs','utf8');assert.ok(source.includes("from './local-provider.mjs'"));assert.ok(!source.includes("from './provider.mjs'"));assert.ok(!source.includes('OPENAI_API_KEY'));});
