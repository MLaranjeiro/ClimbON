import type { ComponentType, InputHTMLAttributes, ReactNode } from 'react';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ComponentType<{ className?: string }>;
  trailing?: ReactNode;
}

export function AuthField({ icon: Icon, trailing, ...inputProps }: AuthFieldProps) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-300 focus-within:border-brand-600 pb-2 transition-colors">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <input className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none" {...inputProps} />
      {trailing}
    </div>
  );
}
