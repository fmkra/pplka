import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { BookOpen, Database, GraduationCap, ArrowRight } from "lucide-react";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { licenses } from "~/server/db/license";
import { notFound } from "next/navigation";
import { metadataBuilder } from "../seo";
import { PwaInstallBanner } from "../_components/pwa-install-banner";
import { EXAM, LEARN, QUESTIONS } from "../links";

export const generateMetadata = metadataBuilder((url, name) => ({
  title: `${name.short} - Nauka do egzaminu teoretycznego`,
  description: `Przygotuj się do egzaminu teoretycznego na licencję ${name.short} - ${name.long}. Nauka, baza pytań egzaminacyjnych i egzaminy próbne.`,
  image: `/img/license/${url}.png`,
}));

export default async function HomePage({
  params,
}: {
  params: Promise<{ license: string }>;
}) {
  const { license } = await params;
  const licenseData = await db.query.licenses.findFirst({
    where: eq(licenses.url, license),
  });

  if (!licenseData) {
    notFound();
  }

  return (
    <>
      <PwaInstallBanner />
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Witaj na PPLka.pl</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
          Opanuj materiał do egzaminu na licencję PPL(A) z naszą interaktywną
          platformą. Ucz się, ćwicz i sprawdzaj swoją wiedzę.      
        </p>
      </div>
      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <BookOpen className="mb-4 h-12 w-12 text-blue-600" />   
            <CardTitle>Nauka</CardTitle>
            <CardDescription>
              Przechodź przez wszystkie pytania, a system zapamięta Twoje
              odpowiedzi i postępy w nauce.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href={`/${license}/${LEARN}`}>
              <Button className="w-full">
                Rozpocznij naukę <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <Database className="mb-4 h-12 w-12 text-green-600" /> 
            <CardTitle>Baza Pytań</CardTitle>
            <CardDescription>
              Przeglądaj i filtruj całą bazę pytań po kategoriach, tagach oraz
              wyszukuj po treści.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href={`/${license}/${QUESTIONS}`}>
              <Button className="w-full bg-transparent" variant="outline">
                Zobacz pytania
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <GraduationCap className="mb-4 h-12 w-12 text-purple-600" />       
                <CardTitle>Egzamin</CardTitle>
            <CardDescription>
              Sprawdź swoją wiedzę w realistycznych warunkach, korzystając z
              naszego symulatora egzaminu.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href={`/${license}/${EXAM}`}>
              <Button className="w-full" variant="secondary">
                Podejdź do egzaminu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-semibold">Informacje o egzaminie</h2>
        <div className="text-muted-foreground mb-6 flex flex-col gap-4 text-justify">
          <p>
            Po ukończeniu kursu teoretycznego, kandydat musi zdać wszystkie 9
            przedmiotów w ciągu 18 miesięcy. Egzamin podzielony jest na sesje
            trwające kilka dni. Ilość sesji, w których można wziąć udział nie
            jest ogarniczona, natomiast do każdego przedmiotu można podejść w
            sumie maksymalnie 4 razy i maksymalnie raz w ciągu jednej sesji.
          </p>
          <p>
            Każde pytanie jest zamknięte i ma 4 możliwe odpowiedzi, z których
            tylko jedna jest poprawna. Końcowy wynik to stosunek ilości
            poprawnych odpowiedzi do ilości wszystkich pytań (nie ma ujemnych
            punktów za błędne odpowiedzi). Aby zdać, kandydat musi uzyskać 75%
            lub więcej poprawnych odpowiedzi. Pytania są przydzielane losowo, a
            ich ilość jest stała i zależna od przedmiotu. Ograniczenie czasowe
            dotyczy długości jednego egzaminu (jednego przedmiotu) i jest
            zależne od przedmiotu. Dokładną ilość pytań i czas trwania egzaminu
            można znaleźć w sekcji{" "}
            <Link className="underline" href={`${license}/${EXAM}`}>
              Egzamin
            </Link>
            . Do pytań można powracać i modyfikować odpowiedzi, a egzamin kończy
            się dopiero po kliknięciu &quot;Zakończ egzamin&quot; lub po upływie
            czasu.
          </p>
          <p>
            Dane na dzień 23.01.2026
            <br />
            Żródła:
            <br />
            <Link
              className="underline"
              href="https://ulc.gov.pl/personel-lotniczy/komisja-egzaminacyjna/plan-sesji-egzaminacyjnej"
              target="_blanc"
            >
              https://ulc.gov.pl/personel-lotniczy/komisja-egzaminacyjna/plan-sesji-egzaminacyjnej
            </Link>
            <br />
            <Link
              className="underline"
              href="https://ulc.gov.pl/_download/lke/czas_liczba_pytan_kbp.pdf"
              target="_blanc"
            >
              https://ulc.gov.pl/_download/lke/czas_liczba_pytan_kbp.pdf
            </Link>
          </p>
        </div>
        <Link href={`/${license}/${LEARN}`}>
           <Button size="lg">Rozpocznij naukę</Button>
        </Link>
      </div>
    </>
  );
}

export async function generateStaticParams() {
  const licenses = await db.query.licenses.findMany();
  return licenses.map((license) => ({
    license: license.url,
  }));
}
