# CLAUDE.md

Entry point dla agenta. Czytaj zanim cokolwiek zaimplementujesz. Tok rozumowania → `ANALIZA.md`. Aktualny spec featuru → `specs/NN-*.md`.

## 1. Co budujemy

Panel administratora pozwalający zarządzać użytkownikami w systemie. Admin może dodać pojedynczego użytkownika przez formularz lub zaimportować większą grupę z pliku CSV.

W scope:
- Dodawanie pojedynczego użytkownika (username + email)
- Import użytkowników z pliku CSV (kolumny: username, email)
- Walidacja per rekord + raport błędów per wiersz
- Lista użytkowników

Świadomie poza scope:
- Autentykacja / autoryzacja
- Edycja i usuwanie użytkowników
- Streaming parsing / async queue / idempotencja
- E2E testy

Pełne uzasadnienie scope i wycięć → `ANALIZA.md`.

## 2. Stack

| Warstwa | Technologia |
|---|---|
| Frontend | React 19 + Vite + Tailwind + ShadCN/ui |
| Data fetching | TanStack Query |
| Backend | NestJS + Prisma |
| Baza | PostgreSQL (Docker Compose) |
| Walidacja | class-validator (backend), HTML5 + ręczna (frontend) |
| Parsing & upload | `csv-parse/sync`, `multer` |
| Monorepo | pnpm workspaces |

## 3. Layout repo

```
apps/
  backend/
    prisma/schema.prisma   — model danych, single source of truth
    src/                   — kod Nesta
  frontend/                — React + Vite
docker-compose.yml         — Postgres dla lokalnego dev
ANALIZA.md                 — tok rozumowania, decyzje
specs/                     — feature specy (per implementacja)
README.md                  — quick start
```

Jeśli powstaną typy współdzielone (DTO request/response) — `packages/shared/`. Decyzja per potrzeba; nie tworzymy z góry.

## 4. Backend (NestJS + Prisma)

Layout aplikacji backendu:
```
apps/backend/
  prisma/
    schema.prisma           — model danych, single source of truth
    migrations/             — wygenerowane przez prisma migrate
  src/
    main.ts, app.module.ts
    config/                 — AppConfig + ConfigModule (walidacja env)
    database/               — DatabaseModule + DatabaseService (extends PrismaClient)
    modules/                — feature modules
      users/
        dto/
        users.module.ts
        users.controller.ts
        users.service.ts    — business logic
        users.repository.ts — jedyny punkt styku z DatabaseService
```

Reguły:
- Każdy feature module żyje w `src/modules/<feature>/`. Plik repository jest obowiązkowy — service NIE wywołuje `DatabaseService` bezpośrednio, tylko przez repository. To jedyna warstwa stykająca się z ORM.
- Dane wejściowe walidowane przez DTO z `class-validator` + globalny `ValidationPipe`.
- Mapowanie błędów: Prisma `P2002` (unique constraint) → `ConflictException` z czytelnym `code` w body. Nie sprawdzać istnienia przed `INSERT` (race condition).
- Migracje: `prisma migrate dev` w trybie dev; schema żyje w `apps/backend/prisma/schema.prisma`.
- Typy odpowiedzi: korzystamy z auto-generowanych typów Prismy (`User` z `@prisma/client`); nie duplikujemy ich jako interfejsów.
- Endpoint `GET /users` zwraca `{ users, total, page, pageSize }`, nie samą tablicę — wymagane do UI paginacji. Default `pageSize = 50`.
- ESLint blokuje `any` i floating promises jako błąd. Konfiguracja w `apps/backend/eslint.config.mjs`.
- Testy: unit testy serwisu i walidatora. Fixtures CSV w `apps/backend/test/fixtures/`.

## 5. Frontend (React)

Struktura — feature-based (colocation):
```
src/
  features/
    users/                    — single-user add + lista
      add-user-form.tsx
      users-list.tsx
      api.ts                  — wywołania POST /users, GET /users
      use-users.ts            — TanStack Query hooks
    csv-import/
      csv-upload-panel.tsx
      import-result-table.tsx
      api.ts
      use-csv-import.ts
  components/
    ui/                       — komponenty ShadCN
  lib/
    api-client.ts             — wspólny fetcher + base URL
  app.tsx
  main.tsx
```

Reguły:
- Komponenty, hooks i wywołania API dotyczące jednego featuru żyją razem w `src/features/<feature>/`.
- Komponenty współdzielone (między featurami) → `src/components/`. Komponenty ShadCN → `src/components/ui/`, nie modyfikowane bez powodu.
- Named exports zamiast default (wyjątek: entry pointy — `app.tsx`, `main.tsx`).
- Walidacja po obu stronach — formularz waliduje przed wysłaniem, nie polega tylko na 400 z backendu.
- Data fetching i cache przez TanStack Query. Lokalny `useState` tylko dla stanu UI (form fields, modale). Bez globalnego state managera (Redux/Zustand) — TanStack pokrywa potrzebę cache + invalidacji.
- Exhaustive dependency arrays w `useMemo` / `useCallback` / `useEffect`. Nigdy nie wyciszać lintera `react-hooks/exhaustive-deps`.
- `useCallback` tylko gdy tożsamość referencji ma znaczenie: (a) funkcja używana w dependency array innego hooka, lub (b) prop do komponentu owiniętego `React.memo`. Nie owijać callbacków „dla optymalizacji" — to noise bez benefitu.
- Paginacja listy: ShadCN `Pagination` w UI, stan strony w lokalnym `useState`, dane przez TanStack Query z `queryKey: ['users', { page }]` + `placeholderData: keepPreviousData` żeby UI nie migało przy zmianie strony.
- ESLint blokuje `react-hooks/exhaustive-deps` i `any` jako błąd. Konfiguracja w `apps/frontend/eslint.config.js`.

## 6. Reguły nienaruszalne

- Bez typu `any`. TypeScript strict mode.
- Bez auth i autoryzacji — poza scope.
- Bez przedwczesnych abstrakcji — trzy podobne linie są lepsze niż abstrakcja „na wszelki wypadek".
- Bez nowych ORM-ów, HTTP clientów, bibliotek bez konsultacji.
- Bez streaming parsing, kolejek, jobów w tle.
- Bez commitów i pushy bez wyraźnej prośby.
- Przed implementacją: przeczytaj odpowiedni spec w `specs/`.
- Bez `as` castów do naprawiania niezgodności typów. Cast = sygnał, że typ upstream jest zły — naprawiać źródło, nie miejsce użycia. Wyjątek: mocki i partial doubles w testach (`*.spec.ts`).
- Typy płyną naturalnie przez system. Jeśli funkcja/komponent produkuje `TypeA`, callbacki i konsumenci przyjmują `TypeA`, nie węższy typ wymagający kastowania po stronie wywołania.
- Dokumentacja odbija stan zaimplementowany, nie aspiracyjny. Po zakończeniu featuru usuwać markery „TODO", „planowane", niedziałające komendy z README. Stałe nieaktualne docsy są gorsze niż brak.

## 7. Gdzie szukać kontekstu

- Dlaczego coś robimy → `ANALIZA.md`
- Co konkretnie buduję teraz → `specs/NN-*.md`
 