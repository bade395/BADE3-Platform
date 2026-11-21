"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LOGO = "https://i.postimg.cc/9X9srHCR/w-removebg-preview-removebg-preview.png";
const SHOWCASE = "https://i.postimg.cc/prhPhSXP/0QWqp-PSj-XSKCEKnah213SEhytwx-F-Dn-LVv-MQe2qw-VSmm-IJe-ZKjo-X4RHrxde4p2km-X20ex-E3Oc6Cw-Ig-D7By3oii7.jpg";

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/platform/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "تعذّر تسجيل الدخول.");
      router.replace("/platform"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذّر تسجيل الدخول."); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell auth-shell-premium" dir="rtl">
    <section className="auth-story">
      <div className="auth-reference-image"><img src={SHOWCASE} alt="BADE3 platform design reference"/></div>
      <div className="auth-story-overlay"><p className="story-kicker">BADE3 · SAAS CONTROL PLANE</p><h2>كل أعمالك الرقمية،<br/><span>في رؤية واحدة.</span></h2><p>منصة التحكم المركزية لإدارة الشركات، الفروع، الاشتراكات والخدمات—بوضوح، وأمان، وبساطة تليق بنمو أعمالك.</p><div className="story-bottom"><span>◈ تحكم مركزي</span><span>◈ بيئة آمنة</span><span>◈ جاهزة للتوسع</span></div></div>
    </section>
    <section className="auth-card auth-card-premium">
      <Link href="/" className="auth-logo" aria-label="BADE3"><img src={LOGO} alt="BADE3 logo"/></Link>
      <p className="eyebrow">PLATFORM OWNER ACCESS</p><h1>أهلًا بعودتك</h1><p className="muted">سجّل الدخول لمتابعة وإدارة منصتك.</p>
      <form onSubmit={submit} className="auth-form">
        <label>البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" placeholder="name@company.com" required /></label>
        <label>كلمة المرور<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••••••" required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={busy}>{busy ? "جارٍ تأمين الدخول..." : "دخول لوحة المنصة  →"}</button>
      </form>
      <p className="muted small">هذه مساحة خاصة بمالك BADE3، منفصلة عن حسابات الشركات والعملاء.</p>
    </section>
  </main>;
}
