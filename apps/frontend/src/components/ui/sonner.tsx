import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      duration={4000}
      richColors
      closeButton
    />
  );
}
