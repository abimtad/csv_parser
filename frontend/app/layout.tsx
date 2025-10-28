import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/toaster";
import { ThemeToggle } from "@/components/theme-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CSV Parser",
  description: "Upload and process CSV files",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Set theme to system or saved before paint to avoid flashes */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "!function(){try{var t=localStorage.getItem('theme');var d=t?t:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(d==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}}();",
          }}
        />
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
