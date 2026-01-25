import Link from "next/link";
import { Mail, Github, GraduationCap } from "lucide-react";

const navigation = [
  { name: "PPL(A)", href: "/ppla" },
  { name: "SPL", href: "/spl" },
  { name: "BPL", href: "/bpl" },
  { name: "PPL(H)", href: "/pplh" },
];

const resources = [
  { name: "Nauka", href: (l: string) => `/${l}/learn` },
  { name: "Baza pytań", href: (l: string) => `/${l}/questions` },
  { name: "Egzamin próbny", href: (l: string) => `/${l}/exam` },
];

export function Footer({ license }: { license: string }) {
  return (
    <footer className="bg-card mt-12 border-t">
      <div className="container mx-auto py-8 sm:px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Logo & Description */}
          <div className="col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              <span className="text-lg font-semibold">PPLka.pl</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Kompleksowe materiały przygotowujące do egzaminu teoretycznego na
              licencję pilota turystycznego na samolot, szybowiec, balon lub śmigłowiec.
            </p>
          </div>

          {/* Navigation */}
          <div className="max-[18rem]:col-span-2">
            <h3 className="mb-4 font-semibold">Licencje</h3>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="max-[18rem]:col-span-2">
            <h3 className="mb-4 font-semibold">Zasoby</h3>
            <ul className="space-y-2">
              {resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href(license)}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2">
            <h3 className="mb-4 font-semibold">Kontakt</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Znalazłeś jakiś błąd albo chciałbyś zmienić coś na stronie? A może
              znasz dobre wyjaśnienie poprawnej odpowiedzi na któreś z pytań?
              Napisz do nas. Chętnie usłyszymy Twoją opinię.
            </p>
            <a
              href="mailto:pplka@fkrawczyk.pl?subject=Pomoc w ulepszeniu strony"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
            >
              <Mail className="h-4 w-4" />
              pplka@fkrawczyk.pl
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex items-center justify-between gap-4 border-t pt-8">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Filip Krawczyk.
            <br />
            Kod źródłowy strony oparty na licencji GNU General Public License
            v3.0.
            <br />
            Wyjaśnienia do pytań udostępniane są na licencji Creative Commons
            BY-NC-ND 4.0.
            <br />
            Wszelkie prawa do pozostałych materiałów zastrzeżone.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/fmkra/pplka"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
