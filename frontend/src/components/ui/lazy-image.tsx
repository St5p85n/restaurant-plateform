import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

export function LazyImage({
  src,
  alt,
  className = '',
  placeholderClassName = '',
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Créer un Intersection Observer pour détecter quand l'image entre dans le viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Commencer à charger 50px avant que l'image soit visible
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* Placeholder pendant le chargement */}
      {!isLoaded && (
        <div
          className={`absolute inset-0 bg-muted flex items-center justify-center ${placeholderClassName}`}
        >
          <ImageIcon className="w-8 h-8 text-muted-foreground animate-pulse" />
        </div>
      )}

      {/* Image réelle */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* Message d'erreur si l'image ne charge pas */}
      {hasError && (
        <div
          className={`absolute inset-0 bg-muted flex flex-col items-center justify-center ${placeholderClassName}`}
        >
          <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Image non disponible</p>
        </div>
      )}
    </div>
  );
}
