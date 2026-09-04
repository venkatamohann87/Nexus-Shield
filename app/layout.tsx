import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "HumanShield AI | Trust Infrastructure", description: "Privacy-preserving trust and AI security controls." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
