# Analiza

> Tok rozumowania, założenia i decyzje stojące za rozwiązaniem zadania.

## 1. Kontekst — co właściwie jest problemem

„Import użytkowników z CSV” to nazwa rozwiązania, nie problemu. Problem jest prosty: trzeba szybko dodać do panelu całe grupy użytkowników, nie pojedyncze osoby. Lista zwykle powstaje wcześniej (sprzedaż, HR, biuro), a admin tylko przenosi ją do systemu.

Bez importu admin wpisuje 20-50 osób ręcznie. To zabiera czas i zwiększa ryzyko literówek. Taki błąd często wychodzi dopiero przy logowaniu albo wysyłce maila. Import z CSV ogranicza ten problem, bo dane są brane z gotowej listy, a walidacja wyłapuje podstawowe błędy przed zapisem.

Zakładam, że admin panelu nie musi być osobą techniczną. Specyfikacja tego nie narzuca, ale to założenie wpływa na projekt: raport błędów ma być prosty i czytelny.

## 2. Dlaczego CSV

CSV to świadomy wybór. Powód jest prosty: format jest powszechny, lekki i przewidywalny.

CSV lepiej pasuje do tego scenariusza niż JSON, bo JSON jest wygodniejszy głównie w integracjach system-system, a nie przy ręcznym przygotowaniu pliku przez admina.

Uniwersalność. CSV eksportują Excel, Google Sheets, CRM i systemy HR bez dodatkowych narzędzi.

Lekkość parsowania. To zwykły tekst, więc parsowanie jest proste. Dla xlsx potrzebne są cięższe biblioteki i więcej obsługi.

Przewidywalność struktury. CSV ma prosty układ: header i wiersze. W xlsx dochodzą arkusze, ukryte kolumny i inne elementy, które komplikują import.

## 3. Ograniczenia CSV i co z nich wynika

CSV ma ograniczenia, więc część reguł musi egzekwować system.

Brak walidacji w pliku. Excel i Sheets nie pilnują wymaganych pól ani formatu danych. Dlatego walidacja jest po stronie systemu, per rekord, a błąd jednego wiersza nie blokuje reszty.

Duplikaty w pliku raportujemy jako błąd. Pierwszy rekord zostaje, kolejne dostają informację o duplikacie i numerze wiersza źródłowego.

Email, który już istnieje w bazie, traktujemy jako „rekord już istnieje”. Import nie aktualizuje danych. Import dodaje nowe konta, a edycja to osobny endpoint poza zakresem.

Kodowanie CSV nie jest jednolite, więc parser akceptuje tylko UTF-8 i usuwa BOM. Inne kodowanie odrzucamy przed parsowaniem, żeby uniknąć zapisu zniekształconych danych. W produkcji warto dodać detekcję kodowania i transkodowanie do UTF-8 z ręcznym potwierdzeniem, ale tutaj zostaje twardy wymóg UTF-8.

Separator też bywa różny. Parser wykrywa go z pierwszej linii (przecinek, średnik, tab), a przy remisie wybiera przecinek. To daje przewidywalne działanie i minimalizuje ryzyko cichego błędu.

Podgląd przed zapisem jest poza zakresem. Sama detekcja kodowania i walidacja wierszy nie gwarantują, że dane wyglądają dokładnie tak, jak oczekuje admin. Docelowo warto mieć etap podglądu kilku pierwszych rekordów i dopiero potem potwierdzenie importu, ale to wymaga dwuetapowego API i przechowania pliku między requestami.

Po przesłaniu pliku admin nie dostaje natychmiastowego feedbacku. W formularzu pojedynczego usera błąd pokazuje się przy polu od razu; przy CSV nformację zwrotną dostajemy dopiero po imporcie — raport per wiersz z liczbą zapisanych, pominiętych, oraz listą błędów (numer linii, pole, powód). Bez tego admin nie wie, czy import się udał, ani co poprawić.

Format CSV nie ogranicza rozmiaru pliku ani liczby wierszy. Nic nie powstrzymuje admina przed wgraniem 500 MB albo 200 000 wierszy — przez nieuwagę albo złośliwie. Dlatego system ma jawne limity i zwraca błąd po ich przekroczeniu.

## 4. Decyzje implementacyjne

Partial success zamiast all-or-nothing. Celem jest uniknięcie sytuacji, w której jeden błędny wiersz blokuje cały import. Poprawne rekordy zapisujemy, a błędne zwracamy w raporcie per wiersz. Koszt tej decyzji jest w logice aplikacji (walidacja i raportowanie), nie w SQL, bo insert nadal idzie batchem.

Pole skipped obejmuje wszystkie wiersze, które nie trafiły do bazy: błędy walidacji, duplikaty w pliku, duplikaty względem bazy i konflikty równoległych zapisów. Dla każdego wyniku obowiązuje niezmiennik inserted + skipped = total. Szczegóły per wiersz są w polu errors.

Preflight SELECT + filtered batch INSERT zamiast INSERT z ON CONFLICT DO NOTHING: najpierw sprawdzamy istniejące emaile, potem wstawiamy tylko pozostałe rekordy. To upraszcza raport per wiersz i eliminuje porównywanie wejścia z wynikiem insertu. Ryzyko wyścigu między SELECT i INSERT obsługujemy przez skipDuplicates oraz dodatkowy SELECT tylko wtedy, gdy liczba faktycznie wstawionych rekordów jest mniejsza od oczekiwanej.

Response shape. Dla sukcesu pełnego i częściowego endpoint zwraca 200 z tym samym body: inserted, skipped i errors. Dzięki temu klient ma jeden prosty kontrakt odpowiedzi. Status 422 ma sens tylko wtedy, gdy nie zapisano żadnego rekordu. Status 400 zostaje dla nieparsowalnego CSV, a 413 dla przekroczenia limitu pliku lub liczby wierszy. 207 Multi-Status pomijamy, bo to mniej typowe w REST i nie upraszcza integracji.

Prisma zamiast TypeORM. Schema prisma jest jednym źródłem prawdy modelu i typów, więc nie duplikujemy struktur danych. Migracje w tym setupie są prostsze. Koszt: własny PrismaService jest mniej Nest-native niż @nestjs/typeorm. Zysk: pełne type-safety zapytań end-to-end.

Walidacja danych użytkownika wpisywanych przez admina jako wspólna reguła dla obu stron. Regex dla pola username trzymam w packages/constants i używam go i na backendzie (DTO + class-validator), i na frontendzie (walidacja przed wysyłką). Dzięki temu zasada jest dokładnie ta sama w obu miejscach i minimalizujemy wystąpienie tego błędu.

TanStack Query zamiast ręcznego useState + refetch. Po mutacjach odświeżamy listę przez invalidateQueries, więc klient ma jeden prosty mechanizm aktualizacji danych. useQuery daje od razu loading/error bez dodatkowego stanu lokalnego. Koszt: dodatkowa zależność i jednorazowy setup QueryClientProvider.

Paginacja jako element podstawowego kontraktu listy. GET /users zwraca {users, total, page, pageSize}, frontend używa ShadCN Pagination + queryKey z page w TanStack Query. Dzięki temu strony listy są cache'owane per queryKey i powrót na wcześniej otwartą stronę nie wymaga ponownego ładowania od zera. Bez paginacji lista po imporcie tysięcy wierszy zalewa DOM.

Limity rozmiaru pliku i liczby wierszy to dwa niezależne guardy. Multer odrzuca pliki powyżej 2 MB przed parsowaniem, a parser odrzuca pliki powyżej 10 000 wierszy po parsowaniu. Każdy limit chroni inny koszt operacyjny. Import strumieniowy albo asynchroniczny ma sens dopiero przy dużo większej skali, gdy import nie mieści się w czasie requestu lub obecnych limitach.

## 5. Decyzje architektoniczne

Repository jest jedyną warstwą stykającą się z ORM. Service trzyma logikę domenową i nie wywołuje Prismy bezpośrednio. Zmiana ORM albo dodanie cache zamyka się w jednym miejscu na moduł.

DomainError + globalny ExceptionFilter + statyczna mapa wyjątku -> HttpStatus. Kontroler rzuca błędy domenowe, a mapowanie HTTP jest w jednym miejscu. Nieobsłużone przypadki wpadają w 500 i są logowane.

Multer filter jest osobno od DomainExceptionFilter. Błędy uploadu (LIMIT_FILE_SIZE i podobne) powstają przed parserem i pochodzą z middleware, więc nie trafiają do hierarchii DomainError.

CSV import jest w module users, nie w osobnym module. To część tej samej domeny i używa tego samego UsersRepository. Osobny moduł miałby sens dopiero przy kolejnych typach importu.

packages/constants to wspólne źródło limitów i stałych. Te same reguły walidacji i limity działają na backendzie i frontendzie.

Używam domyślnego Nest Logger zamiast pino/winston. Na ten zakres wystarcza, a kluczowe miejsca są logowane (500, odrzucony upload, podsumowanie importu).

Brak globalnego state managera na froncie. TanStack Query obsługuje dane z API i invalidacje, a useState wystarcza na stan UI. Redux/Zustand byłyby tu nadmiarem.

Limit pliku to dwa niezależne guardy. Multer pilnuje rozmiaru bajtów przed parsowaniem, parser pilnuje liczby wierszy po parsowaniu. Każdy chroni inny koszt operacyjny.

## 6. Skala

W tym zadaniu zostaję przy imporcie synchronicznym, bo przy przyjętych limitach to najprostszy i wystarczający model. Jeśli skala wzrośnie, naturalny kolejny krok to parsowanie strumieniowe i batch insert, żeby ograniczyć pamięć. Kolejka i osobny worker mają sens dopiero wtedy, gdy import przekracza czas requestu albo wymaga retry i odporności na restart.

## 7. Co świadomie zostawiam poza scope

Autentykacja i autoryzacja. W realnym systemie byłyby konieczne, ale nie wpływają na ocenę samego mechanizmu importu użytkowników.

Edycja i usuwanie użytkowników. To osobny obszar funkcjonalny, niezwiązany bezpośrednio z problemem masowego onboardingu.

Parsowanie strumieniowe, kolejka i idempotencja. To sensowne kierunki rozwoju przy większej skali lub długotrwałym przetwarzaniu, ale na potrzeby tego zadania byłyby przedwczesną komplikacją.

Throttling importu jest poza scope: bez auth limitowanie po IP w aplikacji jest mało skuteczne, a właściwa ochrona powinna być na poziomie reverse proxy lub WAF. W tym zadaniu ryzyko ograniczają limity rozmiaru pliku i liczby wierszy.

Testy E2E. W tym zadaniu większą wartość dają testy jednostkowe walidacji i logiki importu. Pełne E2E zwiększyłoby koszt przygotowania środowiska bardziej niż realnie podniosło pewność najważniejszych elementów rozwiązania.

Zamiast bootstrapować TestingModule, testy jednostkowe tworzą kontrolery, serwisy i filtry bezpośrednio przez new. To szybsze i czytelniej pokazuje, co jest mockowane. Minusem jest brak weryfikacji konfiguracji NestJS (DI i dekoratory, np. UseFilters czy HttpCode). Te elementy powinny sprawdzać testy E2E z supertest, ale są poza zakresem zadania, więc świadomie akceptuję ten kompromis.
