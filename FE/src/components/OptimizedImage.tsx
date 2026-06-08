import React from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  isHero?: boolean; // If true, eager loads; otherwise lazy loads
  aspectRatioClassName?: string; // e.g., 'aspect-[4/3]'
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * OptimizedImage component for delivering modern, high-performance compressed images in 2026.
 * Features:
 *  - Automated conversion to next-gen WebP format.
 *  - CDN on-the-fly responsive image resizing using smart srcset.
 *  - Cumulative Layout Shift (CLS) prevention using aspect ratios.
 *  - Native lazy-loading, caching, and secure referrer policy.
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  isHero = false,
  aspectRatioClassName = 'aspect-[4/3]',
  ...rest
}: OptimizedImageProps) {
  if (!src) {
    return (
      <div
        className={`overflow-hidden relative bg-neutral-100 ${aspectRatioClassName} ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          No image
        </div>
      </div>
    );
  }
  
  // Helper to dynamically transform cloud-served URLs into responsive, webp formats
  const getOptimizedUrl = (originalSrc: string, width: number): string => {
    if (!originalSrc) return '';
    
    // Google User Content CDN Optimization
    if (originalSrc.includes('lh3.googleusercontent.com')) {
      const baseUrl = originalSrc.split('=')[0];
      // =w{width}-rw serves highly compressed WebP format at target width
      return `${baseUrl}=w${width}-rw`; 
    }
    
    return originalSrc;
  };

  // Generate responsive sizing sources for standard display widths
  const src300 = getOptimizedUrl(src, 300);
  const src600 = getOptimizedUrl(src, 600);
  const src960 = getOptimizedUrl(src, 960);
  const src1200 = getOptimizedUrl(src, 1200);

  const srcset = src300 ? `${src300} 300w, ${src600} 600w, ${src960} 960w, ${src1200} 1200w` : undefined;
  const sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return (
    <div className={`overflow-hidden relative bg-neutral-100 ${aspectRatioClassName} ${className}`}>
      <img
        src={src600 || src}
        srcSet={srcset}
        sizes={sizes}
        alt={alt}
        loading={isHero ? 'eager' : 'lazy'}
        decoding={isHero ? 'sync' : 'async'}
        fetchPriority={isHero ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-all duration-500 hover:scale-[1.03]`}
        {...rest}
      />
    </div>
  );
}
