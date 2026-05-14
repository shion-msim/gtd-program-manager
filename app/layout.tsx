import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MainChrome } from "@/components/main-chrome";
import { SearchParamsToast } from "@/components/search-params-toast";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Kernie", template: "%s | Kernie" },
  description: "Kernie — プログラム・プロジェクト・タスク管理（GTD 型）",
  applicationName: "Kernie",
  appleWebApp: { title: "Kernie" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          storage="local"
        >
          <MainChrome>{children}</MainChrome>
          <Suspense fallback={null}>
            <SearchParamsToast />
          </Suspense>
          <div data-testid="app-toaster">
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
