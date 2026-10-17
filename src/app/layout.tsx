import type { Metadata, Viewport } from "next";
import { Geist, Newsreader } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"], display: "swap" });

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  display: "swap",
});

// Toate paginile depind de sesiune sau de configurarea de la rulare: nu se prerandează nimic
// (evită ca o pagină privată sau o stare de configurare să fie „înghețată” la build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "StudIA", template: "%s · StudIA" },
  description: "Al doilea creier al studentului ieșean: program, materii și un asistent care te ajută să înveți.",
  applicationName: "StudIA",
  appleWebApp: { capable: true, title: "StudIA", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#f7f6f3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${geist.variable} ${newsreader.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
