import type { Metadata, Viewport } from "next";
import { Heebo, Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const title = "Sala — Emplois & Opportunités en République du Congo";
const description =
  "Plateforme d'aide à l'emploi et aux opportunités pour les jeunes en République du Congo par l'ONG Sala (Brazzaville, Pointe-Noire).";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title,
  description,
  keywords: "emploi congo, stage brazzaville, pointe-noire, recrutement congo, cv gratuit",
  manifest: "/manifest.json",
  icons: { icon: "/img/logo_100.png" },
  openGraph: {
    title,
    description,
    siteName: "Sala",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${heebo.variable} ${inter.variable}`}>
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
