import React from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  isHero?: boolean; // If true, eager loads; otherwise lazy loads
  aspectRatioClassName?: string; // e.g., 'aspect-[4/3]'
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
  
  // Helper to dynamically transform cloud-served URLs into responsive, webp formats
  const getOptimizedUrl = (originalSrc: string, width: number): string => {
    if (!originalSrc) return '';
    
    // Google User Content CDN Optimization
    if (originalSrc.includes('lh3.googleusercontent.com')) {
      const baseUrl = originalSrc.split('=')[0];
      // =w{width}-rw serves highly compressed WebP format at target width
      return `${baseUrl}=w${width}-rw`; 
    }
    
    // Picsum Photos CDN Optimization
    if (originalSrc.includes('picsum.photos')) {
      try {
        const url = new URL(originalSrc);
        const segments = url.pathname.split('/');
        
        // Find dimensions and replace with optimized size + webp
        let foundWidthIndex = -1;
        let foundHeightIndex = -1;
        
        for (let i = 0; i < segments.length; i++) {
          if (/^\d+$/.test(segments[i])) {
            if (foundWidthIndex === -1) {
              foundWidthIndex = i;
            } else {
              foundHeightIndex = i;
              break;
            }
          }
        }
        
        if (foundWidthIndex !== -1 && foundHeightIndex !== -1) {
          segments[foundWidthIndex] = String(width);
          // Standard 4:3 aspect ratio
          segments[foundHeightIndex] = String(Math.round(width * 0.75));
          url.pathname = segments.join('/');
        }
        
        // Ensure webp format is loaded
        if (!url.pathname.endsWith('.webp')) {
          url.pathname += '.webp';
        }
        
        return url.toString();
      } catch (e) {
        return originalSrc;
      }
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
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-all duration-500 hover:scale-[1.03]`}
        {...rest}
      />
    </div>
  );
}
