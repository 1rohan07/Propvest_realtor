import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Founder OS — Personal Brand Manager",
  description: "AI-powered founder operating system. Build yourself like a company.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-text-primary antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
