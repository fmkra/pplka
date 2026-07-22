import type { Metadata } from "next";

const title = "Baza wiedzy lotniczej";
const description =
  "Uniwersalne materiały edukacyjne, notatki i wyjaśnienia pomagające przygotować się do egzaminów lotniczych.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://www.pplka.pl/baza-wiedzy",
  },
  openGraph: {
    title: `${title} | PPLka.pl`,
    description,
    url: "https://www.pplka.pl/baza-wiedzy",
  },
};

export default function KnowledgeBasePage() {
  return null;
}
