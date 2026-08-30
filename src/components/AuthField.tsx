import type { ComponentType, InputHTMLAttributes, ReactNode } from 'react';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ComponentType<{ className?: string }>;
  trailing?: ReactNode;
}

export function AuthField({ icon: Icon, trailing, ...inputProps }: AuthFieldProps) {
  return (
    <div className="flex items-center gap-3 bg-gray-100/75 border border-transparent rounded-lg pl-4 pr-3.5 py-2.5 transition-colors focus-within:bg-white focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <input className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none" {...inputProps} />
      {trailing}
    </div>
  );
}
