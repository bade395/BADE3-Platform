import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BADE3 | Platform Control Center",
  description: "BADE3 SaaS platform control center",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
