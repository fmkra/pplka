import { type Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { db } from "~/server/db";
import { getIcon } from "~/lib/get-icon";
import { selectLicense } from "./actions";
import { Footer } from "./_components/footer";

export const metadata: Metadata = {
  title: "Wybierz typ licencji",
  description:
    "Wybierz typ licencji pilota i rozpocznij naukę do egzaminu teoretycznego. Dostępne licencje: PPL(A) - samolot, SPL - szybowiec, BPL - balon, PPL(H) - helikopter.",
  openGraph: {
    title: "Wybierz typ licencji | PPLka.pl",
    description:
      "Wybierz typ licencji pilota i rozpocznij naukę do egzaminu teoretycznego. PPL(A), SPL, BPL, PPL(H).",
  },
};

export default async function LearnPage() {
  const licenses = await db.query.licenses.findMany({
    orderBy: (license, { asc }) => [asc(license.id)],
  });

  return (
    <>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold">Wybierz swój typ licencji</h1>
          <p className="text-muted-foreground">
            Kompleksowe materiały przygotowujące do egzaminu teoretycznego na
            licencję pilota turystycznego na samolot, szybowiec, balon lub śmigłowiec.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {licenses.map((license) => {
            const icon = getIcon(license.icon);
            return (
              <Card
                key={license.id}
                className="transition-shadow hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        {icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {license.name}
                        </CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex h-full flex-col">
                  <CardDescription className="mb-4 text-sm">
                    {license.description}
                  </CardDescription>

                  <form action={selectLicense.bind(null, license.url)}>
                    <Button className="mt-auto w-full">Wybierz licencję</Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <Footer license="ppla" />
    </>
  );
}
