# Analiza

> Tok rozumowania, założenia i decyzje stojące za rozwiązaniem zadania.

## 1. Kontekst — co właściwie jest problemem

Zadanie nazywa się „import użytkowników z CSV", ale to opis rozwiązania, nie problemu. Pod spodem leży coś prostszego: dostęp do panelu nadawany jest grupom, nie pojedynczym osobom. Typowy scenariusz to nowa grupa klientów po podpisaniu umowy z działem sprzedaży, klasa uczniów, kohorta szkolenia. Ktoś inny — sprzedawca, HR, ktoś z biura — zebrał już tę listę zanim trafiła do admina. Admin nie tworzy danych, on je tylko przenosi do systemu.

Bez importu admin musi te 20-50 osób wprowadzać ręcznie, jedna po drugiej. Czas to najmniejszy problem — pół godziny klikania da się przeżyć. Większy problem to literówki — błąd admina (zły adres, zła nazwa) jest praktycznie niewykrywalny aż do momentu, gdy ktoś nie może się zalogować albo mailing trafia w pustkę. Import z pliku eliminuje tę klasę błędów — bo źródłowe dane są takie, jakie były w arkuszu, plus walidator może wyłapać oczywiste rzeczy zanim trafią do bazy.

Zakładam, że administratorem panelu jest osoba zarządzająca kontami, niekoniecznie techniczna. Specyfikacja jej nie precyzuje — to moja interpretacja, ale wpływa na decyzje projektowe (np. raport błędów musi być zrozumiały dla nie-programisty).

## 2. Dlaczego CSV

Wybór CSV nie jest oczywisty — to świadoma decyzja, nie default. Trzy powody, dla których wygrywa z alternatywami:

Uniwersalność. CSV jest wspierany przez wszystko, z czego dane realnie pochodzą: Excel, Google Sheets, eksporty z CRM, systemów HR, dzienników. Eksport do CSV jest w każdym z tych narzędzi dostępny w jednym kliknięciu, bez konwersji ani dodatkowego oprogramowania.

Lekkość parsowania. CSV to czysty tekst. Node parsuje go bez ciężkich bibliotek — csv-parse/sync to kilkanaście kB i zerowa konfiguracja. Format xlsx wymaga exceljs czy sheetjs, plus obsługi arkuszy, formuł, scalonych komórek — nadmiarowość bez wartości, kiedy kolumny to dosłownie username i email.

Przewidywalność struktury. CSV ma jasny kontrakt: header + wiersze, koniec. Pliki xlsx mogą mieć wiele arkuszy, ukryte kolumny, formuły — system nigdy nie wie, który zakres wziąć.

## 3. Ograniczenia CSV i co z nich wynika

CSV jako format wejścia ma kilka strukturalnych braków, które trzeba pokryć po stronie systemu.

Brak walidacji wewnątrz pliku. Excel i Sheets niczego nie wymuszają, więc admin może wgrać plik z pustymi polami, niepoprawnym formatem adresu, brakującymi kolumnami. Plik przychodzi w całości, bez okazji do walidacji rekord po rekordzie. Walidacja musi być po stronie systemu, per rekord, i błąd w jednym wierszu nie może blokować reszty.

Duplikaty w obrębie pliku się zdarzają. Cicha deduplikacja byłaby gorsza niż błąd, bo admin nie zauważy, że rekord zniknął. Pierwsze wystąpienie zostaje, kolejne raportujemy jako duplikat z odniesieniem do wiersza-oryginału.

Kodowanie znaków w CSV nie jest ustandaryzowane, więc parser akceptuje wyłącznie UTF-8 i usuwa BOM. Plik w innym kodowaniu odrzucamy jeszcze przed parsowaniem, żeby uniknąć zapisu zniekształconych danych. W produkcji warto dodać detekcję kodowania i transkodowanie do UTF-8 z ręcznym potwierdzeniem, ale tutaj zostaje twardy wymóg UTF-8.

Separator także bywa różny. W wielu lokalnych ustawieniach Excel eksportuje CSV ze średnikiem zamiast przecinka. Dlatego parser wybiera separator na podstawie pierwszej linii: bierze dominujący znak z zestawu przecinek/średnik/tab, a przy remisie używa przecinka. To daje przewidywalne działanie i minimalizuje ryzyko cichego błędu.

Podgląd przed zapisem jest poza zakresem. Sama detekcja kodowania i walidacja wierszy nie gwarantują, że dane wyglądają dokładnie tak, jak oczekuje admin. Docelowo warto mieć etap podglądu kilku pierwszych rekordów i dopiero potem potwierdzenie importu, ale to wymaga dwuetapowego API i przechowania pliku między requestami.

Po przesłaniu pliku admin nie dostaje natychmiastowego feedbacku. W formularzu pojedynczego usera błąd pokazuje się przy polu od razu; przy CSV ten loop trzeba odtworzyć dopiero po imporcie — raport per wiersz z liczbą zapisanych, pominiętych, oraz listą błędów (numer linii, pole, powód). Bez tego admin nie wie, czy import się udał, ani co poprawić.

Rozmiar i liczba wierszy też nie są ograniczone w samym formacie. Nic nie powstrzymuje admina przed wgraniem 500 MB albo 200 000 wierszy — przez nieuwagę albo złośliwie. System ma jawne limity rozmiaru i liczby wierszy; powyżej nich zwraca błąd z czytelnym komunikatem. Sama wartość liczbowa to detal implementacyjny; obecność limitu jest deklaracją skali, w której to narzędzie ma działać.

## 4. Decyzje implementacyjne

Partial success zamiast all-or-nothing. Kiedy plik ma 100 wierszy a 20 jest niepoprawnych, zapisujemy 80 poprawnych i raportujemy 20 z opisem błędu — zamiast odrzucać cały import. Bez tego jedna literówka unieważnia cały plik; admin wraca do arkusza i wgrywa ponownie. Cena leży w warstwie aplikacyjnej: walidacja i śledzenie wyniku per wiersz, mapowanie błędów na kody. Same wstawienia do bazy nadal idą jednym batchem, więc nie jest to koszt w SQL.

Preflight SELECT + filtered batch INSERT zamiast INSERT z ON CONFLICT DO NOTHING. Najpierw jedna kwerenda SELECT po wszystkich emailach z importu, potem filtrujemy te już istniejące, na koniec batch INSERT pozostałych. Alternatywa -insert wszystko, baza milcząco pominie konflikty, wymaga porównania wysłanego z wstawionym, żeby ustalić co zostało odrzucone. Preflight kosztuje jeden dodatkowy SELECT, ale daje gotowy raport per wiersz bez post-processingu.

Response shape. Endpoint zwraca 200 z body opisującym wynik importu — liczbę zapisanych, pominiętych oraz listę błędów per wiersz — zarówno dla pełnego sukcesu, jak i partial success. Status 422 ma sens dopiero wtedy, gdy żaden rekord nie został zapisany, bo wtedy operacja nie przyniosła żadnego użytecznego efektu. Status 400 zostaje dla nieparsowalnego CSV, a 413 dla przekroczenia limitu rozmiaru lub liczby wierszy. Rozważałem 207 Multi-Status, bo dobrze oddaje mieszany wynik operacji, ale ten kod najczęściej pojawia się w kontekście WebDAV i nie jest typowym wyborem dla zwykłych endpointów REST. W praktyce 200 z przewidywalnym, ustrukturyzowanym body jest prostsze dla klienta, czytelniejsze w logach i mniej zaskakujące przy integracji.

Prisma zamiast TypeORM. Schema w pliku schema.prisma jest jedynym źródłem prawdy modelu danych — z niej generują się typy używane wprost w serwisie, bez duplikowania jako Entity i interfejs odpowiedzi. Migracje przez prisma migrate dev są krótsze proceduralnie niż TypeORM CLI. Cena: kilka linii PrismaService extends PrismaClient z OnModuleInit, co jest mniej Nest-native niż @nestjs/typeorm, ale w zamian dostajemy end-to-end type-safety na zapytaniach.

Walidacja danych użytkownika wpisywanych przez admina jako wspólna reguła dla obu stron. Regex dla pola username trzymam w packages/constants i używam go i na backendzie (DTO + class-validator), i na frontendzie (walidacja przed wysyłką). Dzięki temu zasada jest dokładnie ta sama w obu miejscach i minimalizujemy wystąpienie tego błędu.

TanStack Query zamiast ręcznego useState + refetch. Lista użytkowników odświeża się po każdej mutacji (single-user POST, CSV import) przez queryClient.invalidateQueries — jedna linia zamiast ręcznego wołania refetch po sukcesie. Loading, error i refetch state przychodzą gotowe z useQuery, bez trzech useState na zapytanie. Koszt: dodatkowa zależność ~13 kB gzip i jednorazowy setup QueryClientProvider w main.tsx; w zamian wbudowana cache invalidation (jedno wywołanie zamiast własnej logiki refetch) i mniej miejsc, w których można zapomnieć odświeżyć dane.

Paginacja jako element podstawowego kontraktu listy. GET /users zwraca {users, total, page, pageSize}, frontend używa ShadCN Pagination + queryKey z page w TanStack Query. Bez tego lista po imporcie tysięcy wierszy zalewa DOM.

Limity rozmiaru pliku i liczby wierszy jako dwa niezależne guardy. Multer odrzuca upload powyżej 2 MB jeszcze przed parsowaniem, dzięki czemu nie zużywamy zasobów na pliki wykraczające poza założoną skalę. Po sparsowaniu odrzucamy plik z więcej niż 10 000 wierszami, bo nawet niewielki plik może zawierać bardzo krótkie, gęsto upakowane rekordy. To dwa różne ograniczenia i każde adresuje inny koszt operacyjny. Powyżej tej skali import nadal może być technicznie wykonalny przez sync HTTP, ale przestaje być dobrym kontraktem dla przewidywalnej operacji administracyjnej. Wtedy lepszym kierunkiem staje się streaming albo przetwarzanie asynchroniczne przez kolejkę.

## 5. Skala

W obecnym zadaniu świadomie zostaję przy imporcie synchronicznym: plik jest wczytywany w pamięć, parsowany przez csv-parse/sync, a jeden request HTTP zwraca od razu raport wyniku. To wystarcza dla administracyjnych importów rzędu dziesiątek, setek czy kilku tysięcy rekordów i dobrze pasuje do wymagań zadania, gdzie najważniejsze są prostota rozwiązania oraz czytelny feedback per wiersz.

Gdyby skala realnie rosła, pierwszym krokiem nie byłaby od razu kolejka, tylko parsowanie strumieniowe i inserty batchami. Taki wariant ogranicza zużycie pamięci i lepiej znosi większe pliki, a nadal zachowuje prosty model jednego requestu i jednej odpowiedzi.

Kolejka i osobny worker mają sens dopiero wtedy, gdy import staje się operacją długą, podatną na timeouty albo częścią większego workflow, który musi przeżyć restart aplikacji i wspierać ponawianie. To sensowny kierunek rozwoju, ale na potrzeby tego zadania byłby przedwczesną komplikacją.

## 6. Co świadomie zostawiam poza scope

Autentykacja i autoryzacja. W realnym systemie byłyby konieczne, ale nie wpływają na ocenę samego mechanizmu importu użytkowników.

Edycja i usuwanie użytkowników. To osobny obszar funkcjonalny, niezwiązany bezpośrednio z problemem masowego onboardingu.

Parsowanie strumieniowe, kolejka i idempotencja. To sensowne kierunki rozwoju przy większej skali lub długotrwałym przetwarzaniu, ale na potrzeby tego zadania byłyby przedwczesną komplikacją.

Throttling importu jest poza scope: bez auth limitowanie po IP w aplikacji jest mało skuteczne, a właściwa ochrona powinna być na poziomie reverse proxy lub WAF. W tym zadaniu ryzyko ograniczają limity rozmiaru pliku i liczby wierszy.

Testy E2E. W tym zadaniu większą wartość dają testy jednostkowe walidacji i logiki importu. Pełne E2E zwiększyłoby koszt przygotowania środowiska bardziej niż realnie podniosło pewność najważniejszych elementów rozwiązania.

Zamiast bootstrapować TestingModule, testy jednostkowe tworzą kontrolery, serwisy i filtry bezpośrednio przez new. To szybsze i czytelniej pokazuje, co jest mockowane. Minusem jest brak weryfikacji konfiguracji NestJS (DI i dekoratory, np. UseFilters czy HttpCode). Te elementy powinny sprawdzać testy E2E z supertest, ale są poza zakresem zadania, więc świadomie akceptuję ten kompromis.
