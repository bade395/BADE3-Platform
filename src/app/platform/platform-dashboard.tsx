"use client";

import { useCallback, useEffect, useState } from "react";

type Tenant = { id: string; name: string; slug: string; status: string; branchCount: number; domains: {domain:string;primary:boolean}[]; plan: string; subscriptionStatus: string; currency: string; timezone: string };
type Overview = { stats: {tenants:number;activeTenants:number;suspendedTenants:number;branches:number;activeSubscriptions:number}; tenants: Tenant[] };
const labels: Record<string,string> = { active:"نشط", suspended:"موقوف", pending:"قيد الإعداد", trial:"تجريبي", cancelled:"ملغي", expired:"منتهي", none:"بدون اشتراك" };

export default function PlatformDashboard({owner}:{owner:{name:string;email:string}}) {
  const [data,setData] = useState<Overview|null>(null);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(true);
  const [search,setSearch] = useState("");
  const load = useCallback(async()=> {
    setLoading(true); setError("");
    try { const response=await fetch("/api/platform/overview",{cache:"no-store"}); if(!response.ok) throw new Error(response.status===401?"انتهت الجلسة، سجّل الدخول مجددًا.":"تعذّر تحميل بيانات المنصة."); setData(await response.json()); }
    catch(cause){setError(cause instanceof Error?cause.message:"حدث خطأ غير متوقع.");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);
  async function logout(){await fetch("/api/platform/logout",{method:"POST"});window.location.assign("/platform/login");}
  const filtered=(data?.tenants??[]).filter(t=>[t.name,t.slug,t.id,...t.domains.map(d=>d.domain)].join(" ").toLowerCase().includes(search.toLowerCase()));
  const stats=data?.stats;
  return <main className="dashboard">
    <header className="dash-header"><div><div className="brand-mark">BADE3<span>◆</span></div><p className="muted">مركز التحكم بالمنصة الأم</p></div><div className="owner-box"><span>{owner.name||owner.email}</span><button className="ghost-button" onClick={logout}>تسجيل الخروج</button></div></header>
    <section className="welcome"><div><p className="eyebrow">PLATFORM CONTROL CENTER</p><h1>نظرة عامة على المنصة</h1><p className="muted">إدارة المستأجرين والاشتراكات والفروع من مكان واحد.</p></div><button className="gold-button" onClick={()=>void load()} disabled={loading}>{loading?"جارٍ التحديث...":"تحديث البيانات ↻"}</button></section>
    {error&&<div className="error-panel" role="alert">{error}</div>}
    <section className="stats-grid">
      {[["إجمالي العملاء",stats?.tenants],["العملاء النشطون",stats?.activeTenants],["الفروع النشطة",stats?.branches],["الاشتراكات النشطة",stats?.activeSubscriptions]].map(([label,value])=><article className="stat-card" key={String(label)}><p>{label}</p><strong>{loading?"—":value??0}</strong></article>)}
    </section>
    <section className="tenant-section"><div className="section-heading"><div><h2>العملاء والمستأجرون</h2><p className="muted">كل شركة تعمل كمساحة مستقلة داخل BADE3.</p></div><input className="search" placeholder="ابحث باسم العميل أو النطاق..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="table-wrap"><table><thead><tr><th>العميل</th><th>الحالة</th><th>الفروع</th><th>النطاقات الموثقة</th><th>الباقة</th><th>الاشتراك</th></tr></thead><tbody>
        {loading&&!data?<tr><td colSpan={6}>جارٍ تحميل البيانات...</td></tr>:filtered.map(t=><tr key={t.id}><td><strong>{t.name}</strong><small>{t.slug} · {t.id}</small></td><td><span className={`status status-${t.status}`}>{labels[t.status]??t.status}</span></td><td>{t.branchCount}</td><td>{t.domains.length?t.domains.map(d=><small key={d.domain}>{d.domain}{d.primary?" · أساسي":""}</small>):"—"}</td><td>{t.plan}</td><td>{labels[t.subscriptionStatus]??t.subscriptionStatus}</td></tr>)}
        {!loading&&filtered.length===0&&<tr><td colSpan={6}>لا توجد نتائج مطابقة.</td></tr>}
      </tbody></table></div>
    </section>
    <footer className="dash-footer">BADE3 © {new Date().getFullYear()} · لوحة مالك المنصة</footer>
  </main>;
}
