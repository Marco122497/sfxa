import { AuthBackground } from "@/components/auth/auth-background";
import { AuthSplashGate } from "@/components/auth/splash-screen";
import { ModeToggle } from "@/components/mode-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthSplashGate>
      <div className="relative flex min-h-full flex-1 flex-col">
        <div className="absolute top-4 right-4 z-20">
          <ModeToggle />
        </div>
        <AuthBackground />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="mb-8 flex flex-col items-center text-center">
            <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              SFXA Finance
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Parish financial management
            </p>
          </div>
          {children}
        </div>
      </div>
    </AuthSplashGate>
  );
}
