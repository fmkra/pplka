# PPLka.pl

**Free, open-source platform for pilot license exam preparation.**

[README po polsku](README_pl.md)

[PPLka.pl](https://www.pplka.pl) is an interactive web application helping future pilots prepare for the theoretical pilot license exam. We believe that knowledge should be free and easily accessible — that's why we're releasing this project as open source.

## Features

- **Learning Mode** — Go through all exam questions. The system remembers your answers and tracks your progress, showing only the questions that still need review.
- **Question Database** — Browse and filter the entire question database by categories, tags, and search by content.
- **Mock Exam** — Test your knowledge under realistic conditions, with time limits and random question selection, just like the real exam.
- **Answer Explanations** — Detailed explanations of correct answers are available for selected questions.

## Supported Licenses

- **PPL(A)** — Private Pilot License (Aeroplane)
- **SPL** — Sailplane Pilot License
- **BPL** — Balloon Pilot License
- **PPL(H)** — Private Pilot License (Helicopter)

## Tech Stack

- [Next.js](https://nextjs.org) — React Framework
- [TypeScript](https://www.typescriptlang.org) — Typed JavaScript
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Drizzle ORM](https://orm.drizzle.team) — Database ORM
- [PostgreSQL](https://www.postgresql.org) — Database
- [tRPC](https://trpc.io) — Type-safe API

## Local Development

### Requirements

- [Node.js](https://nodejs.org) (v20+)
- [Bun](https://bun.sh) or npm/yarn/pnpm
- [PostgreSQL](https://www.postgresql.org) (or Docker)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/fmkra/pplka.git
cd pplka
```

2. Install dependencies:

```bash
bun install
```

3. Copy `.env.example` to `.env` and fill in the environment variables:

```bash
cp .env.example .env
```

4. Start the database (optionally with Docker):

```bash
./start-database.sh
```

5. Apply migrations:

```bash
bun run db:migrate
```

6. Start the development server:

```bash
bun run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Starts the development server |
| `bun run build` | Builds the application for production |
| `bun run start` | Runs the built application |
| `bun run db:generate` | Generates Drizzle migrations |
| `bun run db:migrate` | Applies migrations to the database |
| `bun run db:studio` | Opens Drizzle Studio |
| `bun run lint` | Runs the linter |
| `bun run format:write` | Formats code with Prettier |

## Question Explanations

Question explanations along with scripts generating SQL queries to add them to the database are available in a separate repository:

[github.com/fmkra/pplka-explanations](https://github.com/fmkra/pplka-explanations)

## Licenses

- **Source Code**: [GNU General Public License v3.0](LICENSE)
- **Question Explanations**: [Creative Commons BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/) — available in a [separate repository](https://github.com/fmkra/pplka-explanations)

## Author

Created by [Filip Krawczyk](https://github.com/fmkra).

---

*Fly safe!*
