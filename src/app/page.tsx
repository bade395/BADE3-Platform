import Link from "next/link";

export default function HomePage() {
  return <main style={{maxWidth: 1040, margin: "0 auto", padding: "12vh 24px"}}>
    <p style={{color:"#d8b878",letterSpacing:".22em",fontSize:12}}>BADE3 · SAAS CONTROL PLANE</p>
    <h1 style={{fontSize:"clamp(42px,7vw,76px)",lineHeight:1.05,margin:"18px 0"}}>منصة واحدة،<br/>وأعمال بلا حدود.</h1>
    <p style={{color:"#9aa9c2",fontSize:18,maxWidth:650,lineHeight:1.9}}>BADE3 هي المنصة الأم لإدارة العملاء والاشتراكات والفروع والخدمات الرقمية متعددة المستأجرين.</p>
    <div style={{display:"flex",gap:12,marginTop:36,flexWrap:"wrap"}}>
      <Link href="/platform/login" style={{background:"#d8b878",color:"#111827",padding:"13px 22px",borderRadius:10,textDecoration:"none",fontWeight:700}}>دخول مالك المنصة</Link>
      <Link href="/platform" style={{border:"1px solid #34435f",padding:"13px 22px",borderRadius:10,textDecoration:"none"}}>لوحة التحكم</Link>
    </div>
  </main>;
}
