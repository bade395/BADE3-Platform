import { redirect } from "next/navigation";
import { verifyPlatformOwner } from "@/lib/platform-auth";
import PlatformDashboard from "./platform-dashboard";

export const dynamic = "force-dynamic";
export default async function PlatformPage() {
  const owner = await verifyPlatformOwner();
  if (!owner) redirect("/platform/login");
  return <PlatformDashboard owner={{ name: owner.name, email: owner.email }} />;
}
