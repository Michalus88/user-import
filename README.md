# Panel administratora — import użytkowników

Aplikacja pozwalająca administratorowi dodawać użytkowników pojedynczo przez formularz oraz importować większą grupę z pliku CSV.

Stack: NestJS + Prisma + PostgreSQL na backendzie, React + Vite + Tailwind + TanStack Query na frontendzie. Monorepo pnpm.

Główny dokument dla osoby oceniającej: [`ANALIZA.md`](./ANALIZA.md) — kontekst biznesowo-techniczny, decyzje, ograniczenia CSV i mitygacje.

## Wymagania

- Node.js 22+
- pnpm 10+
- Docker (PostgreSQL)

Minimum jest zadeklarowane w `engines` w `package.json`, nie pinujemy konkretnej wersji — to recruitment scope. W produkcji wersja runtime byłaby zamrożona przez Docker image w CI.

## Uruchomienie

```bash
pnpm install                                    # zależności
cp apps/backend/.env.example apps/backend/.env  # config
docker compose up -d                            # baza
pnpm db:migrate:deploy                          # migracje
pnpm dev                                        # backend :3000 + frontend :5173
```

## Testy

```bash
pnpm test           # backend + frontend
pnpm test:be        # tylko backend
pnpm test:fe        # tylko frontend
```

## Przykładowe pliki CSV

W katalogu `samples/` są dwa pliki do testu importu:

- `users-valid.csv` — 5 poprawnych wierszy (happy path).
- `users-mixed.csv` — 15 wierszy pokazujących wszystkie typy błędów per wiersz i filtry w raporcie (zła nazwa, zły format emaila, duplikat w pliku, duplikat względem bazy). Najpierw zaimportuj `users-valid.csv`, żeby aktywować filtr „już istnieje".

## Struktura

```
apps/
  backend/        NestJS + Prisma
  frontend/       React + Vite + Tailwind
packages/
  types/          współdzielone typy DTO/odpowiedzi (source-only, bez buildu)
  constants/      współdzielone stałe runtime (np. regex walidacji loginu) — build przez tsc
ANALIZA.md        analiza biznesowo-techniczna, decyzje
CLAUDE.md         entry point dla agenta
context/
  specs/          feature specs (workflow)
  rules*.md       reguły pracy agenta
```

## Konwencje

- Dokumentacja produktowa i projektowa (`README`, `ANALIZA`, `CLAUDE`) — po polsku
- Dokumentacja workflow agenta (`context/specs`, `context/rules*.md`) — po angielsku
- Kod, nazwy plików, identyfikatory — po angielsku
- Commit messages — Conventional Commits po angielsku
- Kody błędów API — po angielsku (`USER_ALREADY_EXISTS`)
- Teksty UI dla użytkownika — po polsku
