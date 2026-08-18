import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "CivicLens — Grievance intelligence for the city",
    template: "%s · CivicLens",
  },
  description:
    "Multilingual AI that classifies, prioritises, and routes citizen complaints to the department that can actually fix them.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="dark"
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#0a0a0b" />
      </head>
      <body className="min-h-screen noise-overlay">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
