import type { Metadata } from "next";
import deploymentContent from "~/deployment_content.json";
import { Footer } from "../_components/footer";

export const metadata: Metadata = {
  title: "Regulamin serwisu",
  description:
    "Regulamin serwisu PPLka.pl – zasady korzystania z serwisu, prawa autorskie, konto użytkownika i dane osobowe.",
};

export default function RegulaminPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl space-y-10 pb-12">
        <header className="border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Regulamin serwisu PPLka
          </h1>
        </header>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            § 1. Postanowienia ogólne
          </h2>
          <ol className="text-muted-foreground list-inside list-decimal space-y-3">
            <li>
              Niniejszy Regulamin określa zasady korzystania z serwisu
              internetowego PPLka, dostępnego pod adresem{" "}
              <a
                href={deploymentContent.url}
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                {deploymentContent.url}
              </a>
              .
            </li>
            <li>
              Właścicielem i administratorem serwisu jest{" "}
              {deploymentContent.admin}. Kontakt z Administratorem możliwy jest
              pod adresem e-mail:{" "}
              <a
                href={`mailto:${deploymentContent.contact}`}
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                {deploymentContent.contact}
              </a>
              .
            </li>
            <li>
              Celem serwisu jest pomoc w nauce do egzaminów lotniczych na
              licencje PPL(A), PPL(H), SPL oraz BPL.
            </li>
            <li>Dostęp do serwisu jest bezpłatny.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">§ 2. Definicje</h2>
          <p className="text-muted-foreground mb-4">
            Użyte w niniejszym Regulaminie pojęcia oznaczają:
          </p>
          <ol className="text-muted-foreground list-inside list-decimal space-y-3">
            <li>
              <strong>Regulamin</strong> – niniejszy dokument.
            </li>
            <li>
              <strong>Serwis</strong> – serwis internetowy dostępny pod adresem{" "}
              <a
                href={deploymentContent.url}
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                {deploymentContent.url}
              </a>
              , służący do nauki do egzaminów lotniczych.
            </li>
            <li>
              <strong>Administrator</strong> – podmiot zarządzający i prowadzący
              Serwis, o którym mowa w § 1 ust. 2.
            </li>
            <li>
              <strong>Użytkownik</strong> – każda osoba korzystająca z Serwisu
              zgodnie z Regulaminem.
            </li>
            <li>
              <strong>Dostawca Uwierzytelniania</strong> – podmiot zewnętrzny
              (np. Google w ramach usługi Google OAuth) lub wewnętrzny system
              informatyczny Serwisu, umożliwiający weryfikację tożsamości
              Użytkownika i bezpieczne logowanie do Konta. Aktualna lista
              obsługiwanych metod logowania dostępna jest na stronie logowania
              Serwisu.
            </li>
            <li>
              <strong>Konto</strong> – oznaczona indywidualną nazwą (loginem) i
              zabezpieczona hasłem lub innym sposobem uwierzytelniania
              wydzielona część Serwisu, utworzona po dokonaniu autoryzacji za
              pośrednictwem Dostawcy Uwierzytelniania, w której gromadzone są
              dane Użytkownika oraz informacje o jego działaniach w Serwisie.
            </li>
            <li>
              <strong>Baza Pytań</strong> – treści przykładowych pytań
              egzaminacyjnych udostępniane przez Urząd Lotnictwa Cywilnego pod
              adresem{" "}
              <a
                href="https://ulc.gov.pl/personel-lotniczy/komisja-egzaminacyjna/egzaminy-teoretyczne/przykladowe-pytania-egzaminacyjne"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                ulc.gov.pl/…/przykladowe-pytania-egzaminacyjne
              </a>
              .
            </li>
            <li>
              <strong>Materiały Edukacyjne</strong> – wszelkie treści
              udostępniane w Serwisie i repozytorium{" "}
              <a
                href="https://github.com/fmkra/pplka-explanations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                github.com/fmkra/pplka-explanations
              </a>{" "}
              przez Administratora, w szczególności wyjaśnienia do pytań,
              schematy, grafiki oraz opisy, z wyłączeniem pytań pochodzących z
              Bazy Pytań.
            </li>
            <li>
              <strong>Treści Użytkownika</strong> – wszelkie treści zamieszczane
              w Serwisie przez Użytkownika, w szczególności komentarze, sugestie
              wyjaśnień pytań, uwagi do działania Serwisu.
            </li>
            <li>
              <strong>Licencja CC BY-NC-ND</strong> – licencja Creative Commons
              Uznanie autorstwa-Użycie niekomercyjne-Bez utworów zależnych 4.0
              Międzynarodowa (Attribution-NonCommercial- NoDerivatives, CC
              BY-NC-ND 4.0),{" "}
              <a
                href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                creativecommons.org/licenses/by-nc-nd/4.0/deed.pl
              </a>
              .
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            § 3. Prawa autorskie i licencje
          </h2>
          <ol className="text-muted-foreground list-inside list-decimal space-y-3">
            <li>
              <strong>Kod źródłowy serwisu:</strong> Oprogramowanie tworzące
              Serwis jest udostępnione na licencji GNU General Public License
              v3.0 (GPLv3) pod adresem{" "}
              <a
                href="https://github.com/fmkra/pplka"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                github.com/fmkra/pplka
              </a>
              . Użytkownik ma prawo do korzystania z kodu, jego modyfikacji i
              rozpowszechniania zgodnie z warunkami tej licencji.
            </li>
            <li>
              <strong>Baza pytań:</strong> Pytania egzaminacyjne prezentowane w
              Serwisie pochodzą z publicznie dostępnej bazy przykładowych pytań
              Urzędu Lotnictwa Cywilnego (ULC).
            </li>
            <li>
              <strong>Materiały Edukacyjne:</strong> Autorskie wyjaśnienia
              odpowiedzi, schematy i opisy edukacyjne stworzone przez
              Administratora są chronione prawem autorskim i udostępniane na
              Licencji CC BY-NC-ND w Serwisie oraz w repozytorium pod adresem{" "}
              <a
                href="https://github.com/fmkra/pplka-explanations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                github.com/fmkra/pplka-explanations
              </a>
              .
              <ul className="mt-2 ml-6 list-disc space-y-1">
                <li>
                  Użytkownik może kopiować i rozpowszechniać wyjaśnienia jedynie
                  w celach niekomercyjnych, pod warunkiem oznaczenia autora
                  (PPLka) i bez dokonywania w nich zmian.
                </li>
                <li>
                  Zabrania się kopiowania treści serwisu w celach komercyjnych,
                  w tym w celu stworzenia płatnego produktu lub serwisu
                  konkurencyjnego naruszającego warunki licencji CC BY-NC-ND.
                </li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            § 4. Usługi świadczone drogą elektroniczną
          </h2>
          <ol className="text-muted-foreground list-inside list-decimal space-y-3">
            <li>
              W ramach serwisu Administrator świadczy usługi polegające na:
              <ol className="mt-2 ml-6 list-inside list-[lower-latin] space-y-1">
                <li>
                  Udostępnianiu Bazy Pytań, Materiałów Edukacyjnych oraz
                  niektórych Treści Użytkownika (dostępne dla wszystkich).
                </li>
                <li>
                  Umożliwieniu śledzenia postępów nauki i zapisywania wyników
                  egzaminów próbnych (wymaga logowania).
                </li>
                <li>
                  Umożliwieniu dodawania komentarzy i innych Treści Użytkownika
                  (wymaga logowania).
                </li>
              </ol>
            </li>
            <li>
              Do korzystania z serwisu niezbędne jest urządzenie z dostępem do
              Internetu oraz przeglądarka internetowa obsługująca pliki cookies.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            § 5. Konto Użytkownika i Dane Osobowe
          </h2>
          <ol className="text-muted-foreground list-inside list-decimal space-y-3">
            <li>
              Dostęp do funkcji śledzenia postępów oraz komentowania wymaga
              zalogowania się za pośrednictwem wybranego Dostawcy
              Uwierzytelniania, co jest równoznaczne z założeniem Konta w
              Serwisie.
            </li>
            <li>
              Logując się, Użytkownik akceptuje niniejszy Regulamin, w tym
              wyraża zgodę na przetwarzanie przez Serwis danych niezbędnych do
              obsługi Konta, przekazanych przez Dostawcę Uwierzytelniania (w
              szczególności: adres e-mail, imię i nazwisko/nazwa użytkownika
              oraz unikalny identyfikator).
            </li>
            <li>
              Dane te, wraz z historią nauki, wynikami testów oraz Treściami
              Użytkownika, są przechowywane w bazie danych Serwisu.
            </li>
            <li>
              Administratorem danych osobowych jest Administrator serwisu. Dane
              przetwarzane są wyłącznie w celu realizacji usługi (utrzymanie
              konta, autoryzacja, zapisywanie postępów).
            </li>
            <li>
              Użytkownik ma prawo wglądu do swoich danych, ich sprostowania oraz
              żądania ich usunięcia (co jest równoznaczne z usunięciem konta).
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            § 6. Treści Użytkownika
          </h2>
          <ol className="text-muted-foreground list-inside list-decimal space-y-3">
            <li>
              Użytkownik, zamieszczając w serwisie jakiekolwiek treści (w
              szczególności komentarze, sugestie wyjaśnień), oświadcza, że
              posiada do nich pełne prawa autorskie.
            </li>
            <li>
              Z chwilą zamieszczenia, Użytkownik udziela Administratorowi
              nieodpłatnej, niewyłącznej, nieograniczonej czasowo i
              terytorialnie licencji na korzystanie z tych treści.
            </li>
            <li>
              Licencja, o której mowa w pkt 2, obejmuje prawo do:
              <ol className="mt-2 ml-6 list-[lower-latin] space-y-1">
                <li>
                  Używania, utrwalania, zwielokrotniania, publicznego
                  udostępniania, wyświetlania treści, a także moderowania (w tym
                  usuwania) w ramach Serwisu.
                </li>
                <li>
                  Tworzenia opracowań, modyfikacji, skracania i redagowania
                  treści (prawa zależne).
                </li>
                <li>
                  Wykorzystania treści (w tym ich modyfikacji) do tworzenia
                  Materiałów Edukacyjnych udostępnianych na Licencji CC
                  BY-NC-ND.
                </li>
                <li>
                  Udzielania sublicencji w zakresie koniecznym do udostępnienia
                  treści na Licencji CC BY-NC-ND.
                </li>
              </ol>
            </li>
            <li>
              W przypadku wykorzystania Treści Użytkownika do stworzenia lub
              uzupełnienia Materiałów Edukacyjnych, Administrator zobowiązuje
              się do umieszczenia informacji o autorstwie (np. w sekcji
              &quot;Podziękowania&quot; lub przy danym pytaniu), posługując się
              imieniem i nazwiskiem lub nickiem Użytkownika widocznym w
              serwisie.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">§ 7. Pliki Cookies</h2>
          <ol className="text-muted-foreground list-inside list-decimal space-y-3">
            <li>
              Serwis wykorzystuje pliki cookies (ciasteczka) wyłącznie w celach
              niezbędnych do poprawnego działania strony.
            </li>
            <li>
              Stosowane są pliki cookies:
              <ol className="mt-2 ml-6 list-[lower-latin] space-y-1">
                <li>
                  <strong>Sesyjne/Autoryzacyjne:</strong> Służące do utrzymania
                  sesji zalogowanego Użytkownika.
                </li>
                <li>
                  <strong>Preferencyjne:</strong> Służące do zapamiętywania
                  ustawień (np. automatyczne przekierowania, wybór licencji).
                </li>
              </ol>
            </li>
            <li>
              Serwis nie wykorzystuje plików cookies w celach reklamowych,
              śledzących ani analitycznych (brak Google Analytics itp.).
            </li>
            <li>
              Użytkownik może w każdej chwili zmienić ustawienia dotyczące
              plików cookies w swojej przeglądarce internetowej, co może jednak
              spowodować niewłaściwe funkcjonowanie serwisu.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            § 8. Odpowiedzialność i Zastrzeżenia
          </h2>
          <ol className="text-muted-foreground list-inside list-decimal space-y-3">
            <li>
              Materiały dostępne w serwisie mają charakter wyłącznie edukacyjny
              i pomocniczy.
            </li>
            <li>
              Administrator dokłada wszelkich starań, aby wyjaśnienia były
              rzetelne, jednak nie ponosi odpowiedzialności za ewentualne błędy
              merytoryczne, nieaktualność bazy pytań względem oficjalnych
              egzaminów państwowych, ani za wynik egzaminu państwowego
              Użytkownika.
            </li>
            <li>
              Administrator zastrzega sobie prawo do usuwania niemerytorycznych
              komentarzy, w tym wulgarnych, obraźliwych, naruszających prawo lub
              niezwiązanych z tematyką lotniczą.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            § 9. Postanowienia końcowe
          </h2>
          <ol className="text-muted-foreground list-inside list-decimal space-y-3">
            <li>Regulamin wchodzi w życie z dniem publikacji na stronie.</li>
            <li>
              Administrator zastrzega sobie prawo do zmiany Regulaminu. O
              zmianach Użytkownicy zostaną poinformowani komunikatem na stronie
              serwisu lub mailowo.
            </li>
            <li>
              W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie
              mają przepisy prawa polskiego. Ewentualne spory powinny być
              rozstrzygane polubownie. W przypadku niemożności polubownego
              rozwiązania sporu, sądem właściwym dla rozstrzygnięcia sporu
              będzie sąd powszechny właściwy miejscowo dla siedziby
              Administratora.
            </li>
          </ol>
        </section>
      </article>
      <Footer license="ppla" />
    </>
  );
}
