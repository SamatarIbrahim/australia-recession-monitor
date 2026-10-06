export type Point = { period: string; value: number };
export const GDP_URL = 'https://data.api.abs.gov.au/rest/data/ABS,ANA_AGG/M1.GPM+GPM_PCA.20.AUS.Q?startPeriod=2018';
export const LF_URL = 'https://data.api.abs.gov.au/rest/data/ABS,LF/M13.3.1599.20.AUS.M?startPeriod=2018';
export function csvRows(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const split = (s:string) => s.match(/(?:"(?:[^"]|"")*"|[^,]*)(?:,|$)/g)?.filter(Boolean).map(v=>v.replace(/,$/,'').replace(/^"|"$/g,'').replace(/""/g,'"')) || [];
  const headers=split(lines[0]);
  if(!headers.includes('OBS_VALUE') || !headers.includes('TIME_PERIOD')) throw new Error('Unexpected ABS response');
  return lines.slice(1).map(l=>Object.fromEntries(split(l).map((v,i)=>[headers[i],v])));
}
export function series(rows:ReturnType<typeof csvRows>, item?:string):Point[] {
  const points=rows.filter(r=>(!item || r.DATA_ITEM===item) && r.OBS_VALUE!=='' && Number.isFinite(Number(r.OBS_VALUE)) && !['q','s','t','u','v','z'].includes(r.OBS_STATUS)).map(r=>({period:r.TIME_PERIOD,value:Number(r.OBS_VALUE)})).sort((a,b)=>a.period.localeCompare(b.period));
  if(new Set(points.map(p=>p.period)).size!==points.length) throw new Error('Duplicate observations');
  return points;
}
function ordinal(p:string) {const [y,m]=p.split('-'); return Number(y)*(m.startsWith('Q')?4:12)+Number(m.replace('Q',''))-1;}
export function growth(points:Point[]):Point[] {return points.slice(1).filter((p,i)=>ordinal(p.period)===ordinal(points[i].period)+1 && points[i].value>0).map(p=>{const i=points.indexOf(p);return {period:p.period,value:(p.value/points[i-1].value-1)*100};});}
export function consecutiveNegative(points:Point[]):boolean|null {if(points.length<2)return null; const a=points.at(-2)!,b=points.at(-1)!;return ordinal(b.period)!==ordinal(a.period)+1?null:a.value<0&&b.value<0;}
export function sahm(points:Point[]):Point[] {
 const avgs=points.slice(2).map((p,i)=>({period:p.period,value:(points[i].value+points[i+1].value+p.value)/3,valid:ordinal(p.period)===ordinal(points[i].period)+2&&ordinal(points[i+1].period)===ordinal(points[i].period)+1}));
 return avgs.slice(12).flatMap((p,i)=>{const prior=avgs.slice(i,i+12);if(!p.valid||prior.some(v=>!v.valid)||ordinal(p.period)!==ordinal(prior[0].period)+12)return [];return [{period:p.period,value:p.value-Math.min(...prior.map(v=>v.value))}];});
}
export function periodEnd(p:string) {const [y,m]=p.split('-');return new Date(Date.UTC(Number(y),m.startsWith('Q')?Number(m.slice(1))*3:Number(m),0));}
export function stale(p:string, days:number) {return Date.now()-periodEnd(p).getTime()>days*86400000;}
export async function fetchABS(url:string) {const r=await fetch(url,{headers:{Accept:'text/csv','User-Agent':'AustraliaRecessionMonitor/1.0'},signal:AbortSignal.timeout(25000)});if(!r.ok)throw new Error(`ABS HTTP ${r.status}: ${(await r.text()).slice(0,500)}`);return csvRows(await r.text());}

export const WPI_URL='https://data.api.abs.gov.au/rest/data/ABS,WPI/1.THRPEB.7.TOT.10.AUS.Q?startPeriod=2019';
export const LCI_URL='https://data.api.abs.gov.au/rest/data/ABS,LCI/1.10001+131278.P1.50.Q?startPeriod=2019';
export const RENT_URL='https://data.api.abs.gov.au/rest/data/ABS,CPI/1.115522.10.50.Q?startPeriod=2019';
export const UNDER_URL='https://data.api.abs.gov.au/rest/data/ABS,LF_UNDER/M23.3.1599.20.AUS.M?startPeriod=2019';
export function changeSince(points:Point[],end:string,base:string):number|null {
 const a=points.find(p=>p.period===base),b=points.find(p=>p.period===end);
 return a&&b&&a.value>0?(b.value/a.value-1)*100:null;
}
export function priorYear(period:string) {return `${Number(period.slice(0,4))-1}${period.slice(4)}`;}
export function purchasingPower(wages:Point[],costs:Point[]) {
 const common=wages.filter(w=>costs.some(c=>c.period===w.period));
 const period=common.at(-1)?.period;
 if(!period||stale(period,180))return null;
 const wageAnnual=changeSince(wages,period,priorYear(period)),costAnnual=changeSince(costs,period,priorYear(period));
 const wageLong=changeSince(wages,period,'2019-Q4'),costLong=changeSince(costs,period,'2019-Q4');
 const relative=(w:number|null,c:number|null)=>w===null||c===null?null:((1+w/100)/(1+c/100)-1)*100;
 return {period,wageAnnual,costAnnual,annual:relative(wageAnnual,costAnnual),since2019:relative(wageLong,costLong),wageSince2019:wageLong,costSince2019:costLong};
}
export function costReading(points:Point[]) {
 const p=points.at(-1);if(!p||stale(p.period,180))return null;
 return {period:p.period,annual:changeSince(points,p.period,priorYear(p.period)),since2019:changeSince(points,p.period,'2019-Q4')};
}
export function underReading(points:Point[]) {
 const p=points.at(-1);if(!p||stale(p.period,75))return null;
 const prev=points.find(v=>v.period===priorYear(p.period));
 return {period:p.period,rate:p.value,annualChange:prev?p.value-prev.value:null};
}
