interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 32, className = '' }: AvatarProps) {
  const initial = name?.charAt(0).toUpperCase() ?? '?';

  return (
    <div
      className={`rounded-full overflow-hidden bg-brand-100 flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-brand-700" style={{ fontSize: size * 0.45 }}>
          {initial}
        </span>
      )}
    </div>
  );
}
