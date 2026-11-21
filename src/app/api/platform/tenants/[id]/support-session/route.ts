import { NextResponse } from "next/server";
import { createHmac, randomUUID } from "node:crypto";
import { appwriteRequest, verifyPlatformOwner, writePlatformAudit } from "@/lib/platform-auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type TenantRow={ $id:string; data?:{name?:string;slug?:string;status?:string} } & Record<string,unknown>;
function encode(value:unknown){return Buffer.from(JSON.stringify(value)).toString("base64url");}
export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const actor=await verifyPlatformOwner();
  if(!actor)return NextResponse.json({error:"غير مصرح."},{status:401});
  const {id}=await params;
  if(!/^[A-Za-z0-9._-]{1,36}$/.test(id))return NextResponse.json({error:"معرّف الشركة غير صالح."},{status:400});
  const db=process.env.BADE3_CORE_DATABASE_ID??"";
  const row=await appwriteRequest<TenantRow>(`/tablesdb/${encodeURIComponent(db)}/tables/tenants/rows/${encodeURIComponent(id)}`);
  const tenant=row.data??row as unknown as {name?:string;slug?:string;status?:string};
  if(tenant.status!=="active")return NextResponse.json({error:"لا يمكن فتح شركة غير نشطة."},{status:409});
  const secret=process.env.BADE3_SUPPORT_SIGNING_SECRET;
  if(!secret||secret.length<48)return NextResponse.json({error:"خدمة الدخول الإداري غير مهيأة."},{status:503});
  const now=Math.floor(Date.now()/1000);
  const payload={iss:"bade3-platform",aud:"bella-roses",sub:actor.id,tenantId:id,tenantSlug:tenant.slug??"",iat:now,exp:now+90,jti:randomUUID()};
  const encoded=encode(payload);
  const signature=createHmac("sha256",secret).update(encoded).digest("base64url");
  const token=encoded+"."+signature;
  await writePlatformAudit(actor,{action:"tenant.support_session.issued",resource_type:"tenant",resource_id:id,tenant_id:id,details:{expires_in_seconds:90}});
  return NextResponse.json({url:"https://bella-roses.bade3.com/api/platform/support/enter?token="+encodeURIComponent(token),expiresIn:90},{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"تعذّر إنشاء جلسة الدعم الإداري."},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}