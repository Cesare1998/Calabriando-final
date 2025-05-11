import React, { useState, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  width = '100%',
  height = '100%'
}: OptimizedImageProps) {
  const [localSrc, setLocalSrc] = useState(src);

  useEffect(() => {
    setLocalSrc(src);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalSrc('/images/placeholder.jpg');
  };

  return (
    <LazyLoadImage
      alt={alt}
      src={localSrc}
      onError={handleError}
      effect="blur"
      className={className}
      width={width}
      height={height}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
      }}
      wrapperClassName="w-full h-full"
      threshold={100}
      placeholderSrc="/images/placeholder.jpg"
    />
  );
}
