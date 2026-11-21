"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  return <main className="auth-shell"><section className="auth-card">
    <Link href="/" className="brand-mark">BADE3<span>◆</span></Link>
    <p className="eyebrow">PLATFORM OWNER ACCESS</p><h1>مرحبًا بك في BADE3</h1>
    <p className="muted">دخول آمن ومخصص لمالك المنصة الأم.</p>
    <form onSubmit={submit} className="auth-form">
      <label>البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required /></label>
      <label>كلمة المرور<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button disabled={busy}>{busy ? "جارٍ التحقق..." : "دخول لوحة المنصة"}</button>
    </form>
    <p className="muted small">صلاحية المنصة مستقلة عن حسابات موظفي وعملاء المستأجرين.</p>
  </section></main>;
}
