import "~/styles/globals.css";
import "katex/dist/katex.min.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

import Navbar from "~/app/_components/navbar/navbar";
import { SessionProvider } from "next-auth/react";
import { Notifications } from "./_components/notifications";
import RedirectionManager from "./redirection-manager";
import { SerwistProvider } from "./serwist/provider";
import PwaContextProvider from "./_components/pwa-context";
import deploymentContent from "~/deployment_content.json";

export const metadata: Metadata = {
  title: {
    default: "PPLka.pl - Przygotowanie do egzaminu na licencję pilota",
    template: "%s | PPLka.pl",
  },
  description:
    "Kompleksowe materiały przygotowujące do egzaminu teoretycznego na licencję pilota turystycznego. Nauka, baza pytań i egzaminy próbne dla PPL(A), SPL, BPL i PPL(H).",
  keywords: [
    "PPL",
    "PPL(A)",
    "licencja pilota",
    "egzamin teoretyczny",
    "pilot turystyczny",
    "szkolenie lotnicze",
    "ULC",
    "SPL",
    "szybowiec",
    "BPL",
    "balon",
    "PPL(H)",
    "helikopter",
    "pytania egzaminacyjne",
    "nauka do PPL",
  ],
  authors: [{ name: deploymentContent.creator }],
  creator: deploymentContent.creator,
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "https://pplka.pl",
    siteName: "PPLka.pl",
    title: "PPLka.pl - Przygotowanie do egzaminu na licencję pilota",
    description:
      "Kompleksowe materiały przygotowujące do egzaminu teoretycznego na licencję pilota turystycznego. Nauka, baza pytań i egzaminy próbne.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PwaContextProvider>
      <html lang="pl" className={`${geist.variable}`}>
        <body className="flex min-h-screen flex-col">
          <SessionProvider>
            <TRPCReactProvider>
              <Navbar />
              <main className="container mx-auto flex-1 p-4">{children}</main>
              <Notifications />
              <RedirectionManager />
            </TRPCReactProvider>
          </SessionProvider>
        </body>
      </html>
    </PwaContextProvider>
  );
}
