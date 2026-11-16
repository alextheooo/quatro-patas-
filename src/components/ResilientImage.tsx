import { useState } from 'react';
import { PawPrint } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ResilientImage({ src, alt, className = '' }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F3EDE3] to-[#E7DFD3] text-[#8C7B6E] ${className}`}
        role="img"
        aria-label={alt}
      >
        <PawPrint className="h-8 w-8 opacity-60 mb-2" aria-hidden="true" />
        <span className="text-xs px-4 text-center line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
