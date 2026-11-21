import { NextResponse } from "next/server";
import { appwriteRequest, verifyPlatformOwner } from "@/lib/platform-auth";
export const runtime = "nodejs";
const db = process.env.BADE3_CORE_DATABASE_ID ?? "";
type Row = { $id:string; data?:Record<string,unknown> } & Record<string,unknown>;
async function read(table:string){
 const q=encodeURIComponent(JSON.stringify({method:"limit",values:[500]}));
 const r=await appwriteRequest<{rows?:Row[]}>(`/tablesdb/${encodeURIComponent(db)}/tables/${encodeURIComponent(table)}/rows?queries[]=${q}`);
 return (r.rows??[]).map(x=>({id:x.$id,...(x.data??Object.fromEntries(Object.entries(x).filter(([k])=>!k.startsWith("$")&&k!=="data")))}));
}
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  if(!await verifyPlatformOwner())return NextResponse.json({error:"غير مصرح."},{status:401});
  const {id}=await params;
  const [tenants,branches,subscriptions,plans,members,domains,access]=await Promise.all(["tenants","branches","subscriptions","plans","tenant_members","tenant_domains","branch_staff_access"].map(read));
  const tenant=tenants.find(x=>x.id===id);
  if(!tenant)return NextResponse.json({error:"الشركة غير موجودة."},{status:404});
  const planMap=new Map(plans.map(x=>[x.id,x]));
  const tenantSubscriptions=subscriptions.filter(x=>x.tenant_id===id).map(x=>({...x,plan:planMap.get(String(x.plan_id))??null}));
  const branchRows=branches.filter(x=>x.tenant_id===id);
  const branchIds=new Set(branchRows.map(x=>x.id));
  return NextResponse.json({tenant,branches:branchRows,subscriptions:tenantSubscriptions,members:members.filter(x=>x.tenant_id===id),domains:domains.filter(x=>x.tenant_id===id),branchAccess:access.filter(x=>x.tenant_id===id||branchIds.has(String(x.branch_id)))},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"تعذّر تحميل ملف الشركة."},{status:503,headers:{"Cache-Control":"no-store"}});}
}