import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import { DEMO } from "@/lib/demo";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Side Quest — Meet your people in Auckland",
  description:
    "New to Auckland? An AI concierge matches you into a small group for one fun activity each week. Come as you are.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = DEMO ? <>{children}</> : <ClerkProvider>{children}</ClerkProvider>;

  return (
    <html lang="en" className={`${jakarta.variable} ${bricolage.variable} ${spaceMono.variable}`}>
      <body>{body}</body>
    </html>
  );
}
