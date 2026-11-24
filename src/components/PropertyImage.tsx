import { useState } from 'react';
import { Home } from 'lucide-react';

interface PropertyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function PropertyImage({ src, alt, className = '' }: PropertyImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-500 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Home className="w-8 h-8 mb-2 stroke-[1.5]" aria-hidden="true" />
        <span className="text-xs font-medium max-w-[200px] leading-snug">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
