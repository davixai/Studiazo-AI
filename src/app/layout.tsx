import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin", "latin-ext"], display: "swap" });

// Toate paginile depind de sesiune sau de configurarea de la rulare: nu se prerandează nimic
// (evită ca o pagină privată sau o stare de configurare să fie „înghețată” la build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Studiazo AI", template: "%s · Studiazo AI" },
  description: "Al doilea creier al studentului ieșean: program, materii și un asistent care te ajută să înveți.",
  applicationName: "Studiazo AI",
  appleWebApp: { capable: true, title: "Studiazo", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#080b1a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
