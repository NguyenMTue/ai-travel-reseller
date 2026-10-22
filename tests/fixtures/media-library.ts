import { readLibrary, type LibraryItem, type LibraryQuery, type LibraryRequest } from "../../src/lib/merchant/media-library.ts";
export type MediaScenario="ready"|"empty"|"loading"|"error"|"network"|"malformed"|"session"|"forbidden"|"slow";
export function mediaItems(context="A"):LibraryItem[]{
  return Array.from({length:8},(_,i)=>({
    id:`44444444-4444-4444-4444-${String(i+1).padStart(12,"0")}`,
    merchantId:"11111111-1111-1111-1111-111111111111",
    title:i===0?`Hành trình ${context} · Những trải nghiệm ven biển và ${"cảm hứng địa phương ".repeat(9)}`:`${i===6?"Khám phá Hội An":"Một ngày bên biển"} ${context} · ${i+1}`,
    videoUrl:"https://example.invalid/video.mp4",thumbnailUrl:i===1?"https://example.invalid/broken.jpg":i===2?null:"https://example.invalid/coast.svg",
    platform:i%2?"reels":"tiktok",duration:i===2?null:15+i*5,styleTags:i===0?["X".repeat(50),"Khám phá","Ẩm thực"]:i===2?[]:["Gia đình"],
    analysisMetadata:{},createdAt:"2026-10-22T01:00:00Z",updatedAt:"2026-10-22T01:00:00Z",
  }));
}
export function mediaFixtureRequest(scenario:MediaScenario,context:string,onRead?:(query:LibraryQuery)=>void,assetOrigin?:string):LibraryRequest{
  return async(query,signal)=>{
    onRead?.(query);
    if(scenario==="loading")return new Promise((_,reject)=>signal.addEventListener("abort",()=>reject(new Error("fixture aborted")),{once:true}));
    // Slow deliberately ignores AbortSignal: the consumer must reject a late result.
    if(scenario==="slow")await new Promise(resolve=>setTimeout(resolve,1500));
    const send:typeof fetch=async()=>{
      if(scenario==="network")throw new TypeError("fixture offline");
      if(scenario==="session")return Response.json({success:false},{status:401});
      if(scenario==="forbidden")return Response.json({success:false},{status:403});
      if(scenario==="error")return Response.json({success:false},{status:500});
      if(scenario==="malformed")return Response.json({success:true,data:null});
      let items=scenario==="empty"?[]:mediaItems(context);
      if(assetOrigin)items=items.map(item=>({...item,thumbnailUrl:item.thumbnailUrl?new URL(item.thumbnailUrl.endsWith("broken.jpg")?"/fixture-missing-thumbnail.jpg":"/coast.svg",assetOrigin).href:null}));
      items=items.filter(item=>(!query.platform||item.platform===query.platform)&&item.title.toLocaleLowerCase("vi").includes(query.search.toLocaleLowerCase("vi")));
      return Response.json({success:true,data:items.slice((query.page-1)*query.limit,query.page*query.limit),pagination:{page:query.page,limit:query.limit,total:items.length,totalPages:Math.max(1,Math.ceil(items.length/query.limit))}});
    };
    return readLibrary(query,signal,send);
  };
}
