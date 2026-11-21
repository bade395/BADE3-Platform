import Link from "next/link";

const LOGO = "https://i.postimg.cc/9X9srHCR/w-removebg-preview-removebg-preview.png";

export default function HomePage() {
  return <main className="bade3-home" dir="rtl">
    <header className="home-header"><Link href="/" className="home-logo"><img src={LOGO} alt="BADE3" /></Link><nav><Link href="/platform/login" className="home-login">دخول مالك المنصة ↗</Link></nav></header>
    <section className="home-hero">
      <div className="hero-copy"><p className="eyebrow">BADE3 · SAAS CONTROL PLANE</p>
      <h1>منصة واحدة،<br/><span>وأعمال بلا حدود.</span></h1>
      <p className="hero-description">المركز الرئيسي لإدارة الشركات المستأجرة، الفروع، الاشتراكات والخدمات الرقمية. مساحة تحكم واضحة مصممة لتكبر مع أعمالك.</p>
      <div className="hero-actions"><Link href="/platform/login" className="gold-button">دخول مالك المنصة ↗</Link><Link href="/platform" className="secondary-button">مركز التحكم</Link></div>
      <div className="hero-proof"><span>◈ إدارة مركزية</span><span>◈ تحليلات متقدمة</span><span>◈ بنية متعددة الشركات</span></div></div>
      <div className="hero-visual" aria-label="منصة BADE3"><img className="hero-reference" src="https://i.postimg.cc/prhPhSXP/0QWqp-PSj-XSKCEKnah213SEhytwx-F-Dn-LVv-MQe2qw-VSmm-IJe-ZKjo-X4RHrxde4p2km-X20ex-E3Oc6Cw-Ig-D7By3oii7.jpg" alt="تصميم مرجعي لواجهة منصة BADE3"/><div className="hero-orbit"></div><div className="hero-logo-glass"><img src={LOGO} alt="BADE3 logo"/></div></div>
    </section>
    <section className="home-capabilities"><article><span>01</span><h3>إدارة المستأجرين</h3><p>مساحات مستقلة لكل شركة، تحت رؤية مركزية.</p></article><article><span>02</span><h3>الفروع والفرق</h3><p>إدارة الفروع والصلاحيات والوصول.</p></article><article><span>03</span><h3>الاشتراكات</h3><p>الباقات وحالة الاشتراك ونمو العملاء.</p></article></section>
    <section className="home-showcase"><div className="showcase-copy"><p className="eyebrow">BUILT FOR CLARITY</p><h2>كل التفاصيل.<br/>في مكانها الصحيح.</h2><p>لوحة تحكم مصممة لتمنحك رؤية واضحة عن الشركات، النشاط، الأداء، والنمو—من غير ضوضاء.</p></div><img src="https://i.postimg.cc/3N434qJ7/j3o003z-Eoi-Nle-Jnr7USKZ1oi-Pp-PZFKmd0eh8H0Dz-v-KTx-GZ7RBn-B4TJ7p20se-O-AYcd-Dh6wj-LPZLk54DGTDzu-EM.jpg" alt="مرجع مرئي لتصميم لوحة BADE3"/></section>
    <footer className="home-footer"><img src={LOGO} alt="BADE3"/><span>BADE3 · Platform Owner · © {new Date().getFullYear()}</span></footer>
  </main>;
}
