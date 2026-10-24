import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { CursorEffects } from "@/components/layout/cursor-effects";
import { THEME_COLOR } from "@/lib/theme/theme";
import { getTheme } from "@/lib/theme/server";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin", "latin-ext"], display: "swap" });
// Serif expresiv, doar pentru citatul „Gândul zilei” (Acasă) și cardul de citat de la autentificare, ambele italice.
// Doar varianta italică și fără preîncărcare: fișierele (~250 KB) se descarcă numai pe paginile care afișează citatul.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin", "latin-ext"], style: ["italic"], axes: ["opsz", "SOFT"], display: "swap", preload: false });
// Geometric, cu cifre de lățime egală, doar pentru ceasul din meniu
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin", "latin-ext"], display: "swap" });

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

export async function generateViewport(): Promise<Viewport> {
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    interactiveWidget: "resizes-content",
    themeColor: THEME_COLOR[await getTheme()],
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Tema vine din cookie, deci pagina sosește direct în tema aleasă (Profil → Temă).
  const theme = await getTheme();
  return (
    <html lang="ro" data-theme={theme} className={`${jakarta.variable} ${fraunces.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <CursorEffects />
      </body>
    </html>
  );
}
