import { WPI_URL,LCI_URL,RENT_URL,UNDER_URL,purchasingPower,costReading,underReading,GDP_URL,LF_URL,fetchABS,series,growth,sahm,consecutiveNegative,stale } from '../../../lib/indicators';
export async function GET() {
 const results=await Promise.allSettled([
  fetchABS(GDP_URL).then(rows=>({gdp:series(rows,'GPM'),perCapita:series(rows,'GPM_PCA')})),
  fetchABS(LF_URL).then(rows=>series(rows)),
  fetchABS(WPI_URL).then(rows=>series(rows)),
  fetchABS(LCI_URL).then(rows=>({costs:series(rows.filter(r=>r.INDEX==='10001')),mortgage:series(rows.filter(r=>r.INDEX==='131278'))})),
  fetchABS(RENT_URL).then(rows=>series(rows)),
  fetchABS(UNDER_URL).then(rows=>series(rows))
 ]);
 for (const result of results) if(result.status==='rejected') console.error('ABS retrieval failed',result.reason);
 const gdp=results[0].status==='fulfilled'?results[0].value.gdp:[];
 const perCapita=results[0].status==='fulfilled'?results[0].value.perCapita:[];
 const unemployment=results[1].status==='fulfilled'?results[1].value:[];
 const wages=results[2].status==='fulfilled'?results[2].value:[];
 const livingCosts=results[3].status==='fulfilled'?results[3].value.costs:[];
 const mortgage=results[3].status==='fulfilled'?results[3].value.mortgage:[];
 const rents=results[4].status==='fulfilled'?results[4].value:[];
 const underemployment=results[5].status==='fulfilled'?results[5].value:[];
 const workers={pay:purchasingPower(wages,livingCosts),rent:costReading(rents),mortgage:costReading(mortgage),underemployment:underReading(underemployment),output:costReading(perCapita)};
 const gdpGrowth=growth(gdp), perCapitaGrowth=growth(perCapita), sahmSeries=sahm(unemployment);
 const gdpLatest=gdpGrowth.at(-1),pcLatest=perCapitaGrowth.at(-1),sLatest=sahmSeries.at(-1);
 const gdpStale=!gdpLatest||stale(gdpLatest.period,180),lfStale=!sLatest||stale(sLatest.period,75);
 const technical=gdpStale||gdpLatest?.period!==gdp.at(-1)?.period?null:consecutiveNegative(gdpGrowth);
 const pc=pcLatest&&!stale(pcLatest.period,180)&&pcLatest.period===perCapita.at(-1)?.period?consecutiveNegative(perCapitaGrowth):null;
 const labourValid=!lfStale&&sLatest?.period===unemployment.at(-1)?.period;
 return Response.json({fetchedAt:new Date().toISOString(),workers,technical,perCapita:pc,sahmAU:labourValid?sLatest!.value>=.75:null,sahmOriginal:labourValid?sLatest!.value>=.5:null,gdpGrowth,perCapitaGrowth,unemployment,sahmSeries,gdpStale,lfStale,errors:results.map((r,i)=>r.status==='rejected'?`${['National accounts','Labour force','Wages','Living costs','Rents','Underemployment'][i]} could not be retrieved from ABS. Try refreshing.`:null).filter(Boolean),sources:{gdp:GDP_URL,labour:LF_URL,wages:WPI_URL,costs:LCI_URL,rent:RENT_URL,underemployment:UNDER_URL}}, {headers:{'Cache-Control':'no-store'}});
}
