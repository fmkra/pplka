# PPLka.pl

**Darmowa, otwarta platforma do nauki do egzaminów na licencje pilota.**

[README in English](README.md)

[PPLka.pl](https://www.pplka.pl) to interaktywna aplikacja webowa pomagająca przyszłym pilotom przygotować się do egzaminu teoretycznego na licencję pilota. Wierzymy, że wiedza powinna być darmowa i łatwo dostępna — dlatego udostępniamy ten projekt jako open source.

## Funkcje

- **Tryb nauki** — Przeglądaj wszystkie pytania egzaminacyjne. System zapamiętuje Twoje odpowiedzi i śledzi postępy, pokazując tylko te pytania, które wymagają jeszcze powtórki.
- **Baza pytań** — Przeglądaj i filtruj całą bazę pytań po kategoriach, tagach oraz wyszukuj po treści.
- **Egzamin próbny** — Sprawdź swoją wiedzę w realistycznych warunkach, z ograniczeniem czasowym i losowym doborem pytań, tak jak na prawdziwym egzaminie.
- **Wyjaśnienia odpowiedzi** — Do wybranych pytań dostępne są szczegółowe wyjaśnienia poprawnych odpowiedzi.

## Obsługiwane licencje

- **PPL(A)** — Licencja pilota turystycznego samolotowego
- **SPL** — Licencja pilota szybowcowego
- **BPL** — Licencja pilota balonowego
- **PPL(H)** — Licencja pilota turystycznego śmigłowcowego

## Stack technologiczny

- [Next.js](https://nextjs.org) — Framework React
- [TypeScript](https://www.typescriptlang.org) — Typowany JavaScript
- [Tailwind CSS](https://tailwindcss.com) — Stylowanie
- [Drizzle ORM](https://orm.drizzle.team) — ORM dla bazy danych
- [PostgreSQL](https://www.postgresql.org) — Baza danych
- [tRPC](https://trpc.io) — Type-safe API

## Uruchomienie lokalne

### Wymagania

- [Node.js](https://nodejs.org) (v20+)
- [Bun](https://bun.sh) lub npm/yarn/pnpm
- [PostgreSQL](https://www.postgresql.org) (lub Docker)

### Instalacja

1. Sklonuj repozytorium:

```bash
git clone https://github.com/fmkra/pplka.git
cd pplka
```

2. Zainstaluj zależności:

```bash
bun install
```

3. Skopiuj plik `.env.example` do `.env` i uzupełnij zmienne środowiskowe:

```bash
cp .env.example .env
```

4. Uruchom bazę danych (opcjonalnie z Docker):

```bash
./start-database.sh
```

5. Zastosuj migracje:

```bash
bun run db:migrate
```

6. Uruchom serwer deweloperski:

```bash
bun run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000).

## Skrypty

| Skrypt | Opis |
|--------|------|
| `bun run dev` | Uruchamia serwer deweloperski |
| `bun run build` | Buduje aplikację do produkcji |
| `bun run start` | Uruchamia zbudowaną aplikację |
| `bun run db:generate` | Generuje migracje Drizzle |
| `bun run db:migrate` | Stosuje migracje do bazy |
| `bun run db:studio` | Otwiera Drizzle Studio |
| `bun run lint` | Sprawdza kod linterem |
| `bun run format:write` | Formatuje kod Prettierem |

## Wyjaśnienia do pytań

Wyjaśnienia do pytań wraz ze skryptami generującymi zapytania SQL dodające je do bazy danych dostępne są w osobnym repozytorium:

[github.com/fmkra/pplka-explanations](https://github.com/fmkra/pplka-explanations)

## Licencje

- **Kod źródłowy**: [GNU General Public License v3.0](LICENSE)
- **Wyjaśnienia do pytań**: [Creative Commons BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/) — dostępne w [osobnym repozytorium](https://github.com/fmkra/pplka-explanations)

## Autor

Stworzone przez [Filipa Krawczyka](https://github.com/fmkra).

---

*Lataj bezpiecznie!*
