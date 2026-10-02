import {readFile,writeFile,mkdir} from 'node:fs/promises';
const source=process.argv[2]||'fixtures/cases.json';
const {cases}=JSON.parse(await readFile(source,'utf8'));
for(const c of cases){
  const base=c.baseCase?cases.find(b=>b.id===c.baseCase):c;
  const turns=structuredClone(base.turns),expected=structuredClone(base.expected);
  if(c.replaceTurn)turns[c.replaceTurn.index].text=c.replaceTurn.text;
  if(c.expectedOverride)Object.assign(expected.find(e=>e.key===c.expectedOverride.key),c.expectedOverride);
  await mkdir(`fixtures/${c.id}`,{recursive:true});
  await writeFile(`fixtures/${c.id}/script.txt`,`${c.id}: ${c.title}\nSYNTHETIC FICTIONAL DIALOGUE\n\n`+(turns.length?turns.map(t=>`${t.speaker}: ${t.text}`).join('\n\n'):`${c.silenceSeconds} seconds of silence.`)+'\n');
  await writeFile(`fixtures/${c.id}/expected.json`,JSON.stringify({caseId:c.id,source:`Independent expectations from ${source}; frozen before analysis and expanded without content changes.`,items:expected,clarifications:base.clarifications??[],outcome:c.expectedOutcome??'complete',reason:c.reason??null},null,2)+'\n');
}
