import { OpsLayout } from "@/components/ops-layout";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <OpsLayout>{children}</OpsLayout>;
}
