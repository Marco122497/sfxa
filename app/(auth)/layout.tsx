import { AuthLayoutFrame } from "@/components/auth/auth-layout-frame";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayoutFrame>{children}</AuthLayoutFrame>;
}
