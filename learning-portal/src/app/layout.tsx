import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { FloatingAiTutor } from "@/components/shared/FloatingAiTutor";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Aura Learning | Premium E-Learning Platform",
  description: "Master new skills with our AI-powered e-learning platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-full flex flex-col`}>
        <AuthProvider>
          {children}
          <FloatingAiTutor />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}

