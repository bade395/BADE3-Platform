import Link from "next/link";

export default function HomePage() {
  return <main style={{maxWidth:1220,margin:"0 auto",padding:"clamp(28px,6vw,76px) 24px",position:"relative",zIndex:1}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:18,borderBottom:"1px solid rgba(255,255,255,.1)",paddingBottom:22}}>
      <div className="brand-mark">BADE3<span>◆</span></div>
      <Link href="/platform/login" style={{border:"1px solid rgba(214,181,116,.45)",borderRadius:10,padding:"11px 17px",fontSize:13,color:"#e2c993",transition:"all .2s"}}>دخول مالك المنصة ↗</Link>
    </header>
    <section style={{padding:"clamp(65px,11vw,135px) 0 70px",maxWidth:940}}>
      <p className="eyebrow">BADE3 · SAAS CONTROL PLANE</p>
      <h1 style={{fontSize:"clamp(44px,8vw,94px)",lineHeight:1.12,letterSpacing:"-.045em",margin:"22px 0 26px",fontWeight:600}}>منصة واحدة،<br/><span style={{background:"linear-gradient(100deg,#fff,#d8b878)",backgroundClip:"text",color:"transparent"}}>وأعمال بلا حدود.</span></h1>
      <p style={{color:"#aab4c8",fontSize:"clamp(15px,2vw,19px)",maxWidth:650,lineHeight:2}}>المركز الرئيسي لإدارة الشركات المستأجرة، الفروع، الاشتراكات والخدمات الرقمية. مساحة تحكم واضحة مصممة لتكبر مع أعمالك.</p>
      <div style={{display:"flex",gap:13,marginTop:34,flexWrap:"wrap"}}>
        <Link href="/platform/login" style={{background:"linear-gradient(110deg,#c9a665,#ead29c)",color:"#151a24",padding:"14px 23px",borderRadius:12,fontWeight:700}}>دخول مالك المنصة ↗</Link>
        <Link href="/platform" style={{border:"1px solid rgba(255,255,255,.15)",padding:"14px 23px",borderRadius:12}}>مركز التحكم</Link>
      </div>
    </section>
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:15}}>
      {[["01","إدارة المستأجرين","مساحات مستقلة لكل شركة"],["02","الفروع والفرق","متابعة الفروع والصلاحيات"],["03","الاشتراكات","الباقات وحالة الاشتراك"]].map(([n,title,desc])=><article key={n} style={{border:"1px solid rgba(255,255,255,.09)",borderRadius:16,background:"rgba(15,21,35,.75)",padding:22,transition:"transform .2s,border-color .2s"}}><span style={{fontFamily:"Manrope",color:"#d8b878",fontSize:12,letterSpacing:".2em"}}>{n}</span><h3 style={{fontSize:18,margin:"14px 0 8px"}}>{title}</h3><p style={{color:"#9ca9c2",fontSize:13,margin:0,lineHeight:1.8}}>{desc}</p></article>)}
    </section>
    <footer style={{borderTop:"1px solid rgba(255,255,255,.09)",marginTop:70,paddingTop:22,color:"#758198",fontSize:12}}>BADE3 · Platform Owner · © {new Date().getFullYear()}</footer>
  </main>;
}
