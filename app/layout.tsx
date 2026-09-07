import { Nunito, Quicksand } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const chumSans = Nunito({
  subsets: ["latin"],
  variable: "--font-chum-sans",
  display: "swap",
});

const chumDisplay = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-chum-display",
  display: "swap",
});

export const metadata = {
  title: "SFXA Finance",
  description: "Parish finance management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${chumSans.variable} ${chumDisplay.variable} h-full antialiased`}
    >
      <body className="chum-app student-chum flex min-h-full flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
