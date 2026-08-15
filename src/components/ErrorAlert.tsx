import { AlertCircle } from 'lucide-react';

export function ErrorAlert({ message, light }: { message: string; light?: boolean }) {
  return (
    <div
      className={
        light
          ? 'flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
          : 'flex items-start gap-2 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300'
      }
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
