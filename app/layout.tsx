import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Internship Simulator",
  description: "Turn your course material into a simulated internship design challenge.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ink text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
