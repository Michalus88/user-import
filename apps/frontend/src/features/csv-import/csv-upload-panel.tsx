import { useState, useRef, type DragEvent, type ChangeEvent, type KeyboardEvent } from 'react';
import { Upload, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ImportResultTable } from './import-result-table';
import { useCsvImport } from './use-csv-import';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface CsvUploadPanelProps {
  onImported: () => void;
}

export function CsvUploadPanel({ onImported }: CsvUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate, isPending, result, reset } = useCsvImport({ onImported });

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    if (!dropped.name.toLowerCase().endsWith('.csv')) {
      toast.error('Tylko pliki .csv są obsługiwane');
      return;
    }
    setFile(dropped);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
    e.target.value = '';
  }

  function handleZoneKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if ((e.key === 'Enter' || e.key === ' ') && !file) {
      inputRef.current?.click();
    }
  }

  function handleChangeFile() {
    reset();
    setFile(null);
  }

  if (result) {
    return (
      <div className="flex flex-col gap-3">
        {/* Compact file bar */}
        <div className="flex items-center justify-between gap-2.5 rounded-[10px] border border-border bg-background px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
            <div className="min-w-0">
              <div className="truncate font-mono text-xs font-medium text-foreground">
                {file?.name ?? ''}
              </div>
              <div className="text-[10px] text-subtle">
                {file ? formatFileSize(file.size) : ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleChangeFile}
            className="shrink-0 rounded-lg border border-primary-mid px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft"
          >
            Zmień plik
          </button>
        </div>

        <ImportResultTable result={result} />
      </div>
    );
  }

  const dropZoneClass = file
    ? 'border-emerald-500 bg-emerald-50'
    : isDragging
      ? 'border-primary bg-primary-soft'
      : 'border-border bg-muted/40 hover:border-primary hover:bg-primary-soft';

  return (
    <div className="flex flex-col gap-3.5">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upuść plik CSV tutaj lub kliknij, aby wybrać"
        className={cn(
          'relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all',
          dropZoneClass,
        )}
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleZoneKeyDown}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
          data-testid="csv-file-input"
        />

        {file ? (
          <div className="flex flex-col items-center gap-1.5">
            <FileText className="h-7 w-7 text-emerald-500" aria-hidden />
            <div className="text-sm font-semibold text-emerald-700">{file.name}</div>
            <div className="text-xs text-emerald-600">{formatFileSize(file.size)}</div>
            <button
              type="button"
              aria-label="Usuń plik"
              className="mt-1 text-[11px] text-subtle underline underline-offset-2 hover:text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            >
              Usuń
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Upload
              className={cn(
                'h-7 w-7',
                isDragging ? 'text-primary' : 'text-subtle',
              )}
              aria-hidden
            />
            <div className="text-sm font-semibold text-foreground">Upuść plik CSV tutaj</div>
            <div className="text-xs text-subtle">lub kliknij, aby wybrać</div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
        <div>
          <span className="text-[11px] font-semibold text-amber-800">Wymagane kolumny</span>
          <span className="ml-1 font-mono text-[11px] text-amber-700">email, username</span>
        </div>
      </div>

      <button
        type="button"
        disabled={!file || isPending}
        onClick={() => file && mutate(file)}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-[10px] py-[11px] font-syne text-sm font-semibold text-primary-foreground transition-all',
          file && !isPending
            ? 'cursor-pointer bg-primary hover:bg-primary-hover'
            : 'cursor-not-allowed bg-primary opacity-40',
        )}
      >
        <Upload className="h-3.5 w-3.5" aria-hidden />
        {isPending ? 'Importowanie...' : 'Importuj użytkowników'}
      </button>
    </div>
  );
}
