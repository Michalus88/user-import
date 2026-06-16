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

Kodowanie znaków też nie ma standardu. Plik z Excela na Windows bywa w Windows-1250, z Google Sheets w UTF-8, sam plik tej informacji w sobie nie nosi. Wymagam UTF-8 — inne kodowanie daje czytelny komunikat zamiast zniekształconych polskich znaków w bazie.

Po przesłaniu pliku admin nie dostaje natychmiastowego feedbacku. W formularzu pojedynczego usera błąd pokazuje się przy polu od razu; przy CSV ten loop trzeba odtworzyć dopiero po imporcie — raport per wiersz z liczbą zapisanych, pominiętych, oraz listą błędów (numer linii, pole, powód). Bez tego admin nie wie, czy import się udał, ani co poprawić.

Rozmiar i liczba wierszy też nie są ograniczone w samym formacie. Nic nie powstrzymuje admina przed wgraniem 500 MB albo 200 000 wierszy — przez nieuwagę albo złośliwie. System ma jawne limity rozmiaru i liczby wierszy; powyżej nich zwraca błąd z czytelnym komunikatem. Sama wartość liczbowa to detal implementacyjny; obecność limitu jest deklaracją skali, w której to narzędzie ma działać.
