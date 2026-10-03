// Only explicit English dates with a year are normalized. No clock or timezone input.
export function normalizeExplicitDate(phrase){
  if(!phrase)return null;
  const cleaned=phrase.replace(/(\d)(st|nd|rd|th)\b/gi,'$1').trim();
  const iso=cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const named=cleaned.match(/^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}),? (\d{4})$/i);
  if(!iso&&!named)return null;
  const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
  const year=Number(iso?.[1]??named[3]),month=iso?Number(iso[2])-1:months.indexOf(named[1].toLowerCase()),day=Number(iso?.[3]??named[2]);
  const date=new Date(Date.UTC(year,month,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month||date.getUTCDate()!==day)return null;
  return date.toISOString().slice(0,10);
}
