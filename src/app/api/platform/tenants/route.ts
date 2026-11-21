import { NextResponse } from "next/server";
import { appwriteRequest, verifyPlatformOwner, writePlatformAudit } from "@/lib/platform-auth";
export const runtime = "nodejs";
const db = process.env.BADE3_CORE_DATABASE_ID ?? "";
type Row = { $id: string; data?: Record<string, unknown> } & Record<string, unknown>;
type Rows = { rows?: Row[] };
const value = (r: Row) => r.data && typeof r.data === "object" ? r.data : Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith("$") && k !== "data"));
async function rows() { const q=encodeURIComponent(JSON.stringify({method:"limit",values:[500]})); const r=await appwriteRequest<Rows>(`/tablesdb/${encodeURIComponent(db)}/tables/tenants/rows?queries[]=${q}`); return r.rows??[]; }
function originOK(r:Request){const o=r.headers.get("origin");return !!o&&o===new URL(r.url).origin;}
export async function POST(request:Request){
 try{
  if(!originOK(request))return NextResponse.json({error:"طلب غير صالح."},{status:403});
  const actor=await verifyPlatformOwner();if(!actor)return NextResponse.json({error:"غير مصرح."},{status:401});
  const b=await request.json() as {name?:unknown;slug?:unknown}; const name=typeof b.name==="string"?b.name.trim():""; const slug=typeof b.slug==="string"?b.slug.trim().toLowerCase():"";
  if(name.length<2||name.length>128)return NextResponse.json({error:"اسم الشركة يجب أن يكون بين حرفين و128 حرفًا."},{status:400});
  if(!/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/.test(slug))return NextResponse.json({error:"المعرّف يجب أن يتكون من 3 إلى 64 حرفًا إنجليزيًا صغيرًا أو رقمًا أو شرطة."},{status:400});
  const all=await rows();if(all.some(r=>String(value(r).slug??"").toLowerCase()===slug))return NextResponse.json({error:"معرّف الشركة مستخدم بالفعل."},{status:409});
  const id=crypto.randomUUID().replace(/-/g,"");const data={name,slug,status:"pending",created_at:new Date().toISOString()};
  await appwriteRequest(`/tablesdb/${encodeURIComponent(db)}/tables/tenants/rows`,{method:"POST",body:JSON.stringify({rowId:id,data,permissions:[]})});await writePlatformAudit(actor,{action:"tenant.created",resource_type:"tenant",resource_id:id,details:{name,slug}});
  return NextResponse.json({success:true,tenant:{id,...data}},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"تعذّر إنشاء الشركة."},{status:500});}
}
export async function PATCH(request:Request){
 try{
  if(!originOK(request))return NextResponse.json({error:"طلب غير صالح."},{status:403});
  if(!await verifyPlatformOwner())return NextResponse.json({error:"غير مصرح."},{status:401});
  const b=await request.json() as {id?:unknown;name?:unknown;slug?:unknown;status?:unknown};const id=typeof b.id==="string"?b.id.trim():"";
  if(!id||id.length>36)return NextResponse.json({error:"معرّف الشركة غير صالح."},{status:400});
  const all=await rows();const current=all.find(r=>r.$id===id);if(!current)return NextResponse.json({error:"الشركة غير موجودة."},{status:404});
  const data:Record<string,unknown>={...value(current)};
  if(b.name!==undefined){if(typeof b.name!=="string"||b.name.trim().length<2||b.name.trim().length>128)return NextResponse.json({error:"اسم الشركة غير صالح."},{status:400});data.name=b.name.trim();}
  if(b.slug!==undefined){if(typeof b.slug!=="string")return NextResponse.json({error:"المعرّف غير صالح."},{status:400});const slug=b.slug.trim().toLowerCase();if(!/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/.test(slug))return NextResponse.json({error:"المعرّف غير صالح."},{status:400});if(all.some(r=>r.$id!==id&&String(value(r).slug??"").toLowerCase()===slug))return NextResponse.json({error:"معرّف الشركة مستخدم بالفعل."},{status:409});data.slug=slug;}
  if(b.status!==undefined){if(!["active","suspended","pending"].includes(String(b.status)))return NextResponse.json({error:"حالة الشركة غير مسموح بها."},{status:400});data.status=b.status;}
  await appwriteRequest(`/tablesdb/${encodeURIComponent(db)}/tables/tenants/rows/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify({data})});await writePlatformAudit(actor,{action:"tenant.updated",resource_type:"tenant",resource_id:id,details:{changed_fields:Object.keys(b).filter(k=>k!=="id")}});
  return NextResponse.json({success:true,tenant:{id,...data}},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"تعذّر تحديث الشركة."},{status:500});}
}