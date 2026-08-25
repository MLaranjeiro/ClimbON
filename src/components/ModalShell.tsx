import { X } from 'lucide-react';
import { useEffect, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
  headerExtra?: ReactNode;
}

export function ModalShell({ title, onClose, children, maxWidthClass = 'max-w-2xl', headerExtra }: ModalShellProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function stop(e: MouseEvent) {
    e.stopPropagation();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div className={`w-full ${maxWidthClass} rounded-xl bg-white shadow-xl`} onClick={stop}>
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {headerExtra}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
