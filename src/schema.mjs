const text={type:'string'}, nullable={type:['string','null']};
const array=items=>({type:'array',items});
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const choice=(...values)=>({type:'string',enum:values});
export const evidenceSchema=object({segmentId:text,quote:text,role:choice('proposal','acceptance','change','cancellation','context','question','identity')});
export const extractionSchema=object({
  outcome:choice('complete','partial','unusable'),
  message:text,
  speakers:array(object({speakerId:text,name:nullable,confidence:choice('supported','uncertain'),evidence:array(evidenceSchema)})),
  items:array(object({
    id:text,task:text,status:choice('confirmed','proposed_not_accepted','cancelled','unresolved'),
    source:choice('commitment','participant_question','clarification'),reason:text,
    owner:nullable,ownerSpeakerId:nullable,
    deadlineOriginal:nullable,deadlineNormalized:nullable,dateContextQuote:nullable,
    uncertainties:array(text),evidence:array(evidenceSchema),
    history:array(object({field:choice('deadline','owner','status'),previousValue:text,replacementValue:text,evidence:array(evidenceSchema)}))
  })),
  warnings:array(text)
});

// Validates exactly the JSON Schema subset used above; no permissive coercion.
export function validateSchema(value,schema=extractionSchema,path='$') {
  const type=value===null?'null':Array.isArray(value)?'array':typeof value;
  const types=Array.isArray(schema.type)?schema.type:[schema.type];
  if(!types.includes(type))throw new Error(`Invalid structured result at ${path}: expected ${types.join('|')}.`);
  if(schema.enum&&!schema.enum.includes(value))throw new Error(`Invalid enum at ${path}.`);
  if(type==='object'){
    for(const key of schema.required||[])if(!Object.hasOwn(value,key))throw new Error(`Missing field ${path}.${key}.`);
    for(const key of Object.keys(value)){
      if(!Object.hasOwn(schema.properties,key))throw new Error(`Unexpected field ${path}.${key}.`);
      validateSchema(value[key],schema.properties[key],`${path}.${key}`);
    }
  }
  if(type==='array'){
    if(value.length>300)throw new Error(`Too many elements at ${path}.`);
    value.forEach((v,i)=>validateSchema(v,schema.items,`${path}[${i}]`));
  }
  if(type==='string'&&value.length>30000)throw new Error(`Field too long at ${path}.`);
  return value;
}
