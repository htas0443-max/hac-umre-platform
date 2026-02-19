import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    /** Image source URL (required) */
    src: string;
    /** Alt text for accessibility (required) */
    alt: string;
    /** Optional fallback image URL on error */
    fallbackSrc?: string;
    /** Optional CSS class for the wrapper */
    wrapperClassName?: string;
}

export default function LazyImage({
    src,
    alt,
    fallbackSrc,
    wrapperClassName,
    className,
    style,
    ...rest
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = imgRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.unobserve(el);
                }
            },
            { rootMargin: '200px' } // Start loading 200px before entering viewport
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handleLoad = () => setIsLoaded(true);
    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    const imageSrc = hasError && fallbackSrc ? fallbackSrc : src;

    return (
        <div
            ref={imgRef}
            className={wrapperClassName}
            style={{
                position: 'relative',
                overflow: 'hidden',
                ...(!isLoaded
                    ? {
                        backgroundColor: 'var(--bg-tertiary)',
                        minHeight: '120px',
                    }
                    : {}),
            }}
        >
            {/* Skeleton placeholder */}
            {!isLoaded && (
                <div
                    className="skeleton"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 1,
                    }}
                />
            )}

            {/* Actual image — only rendered when in viewport */}
            {isInView && (
                <img
                    src={imageSrc}
                    alt={alt}
                    loading="lazy"
                    onLoad={handleLoad}
                    onError={handleError}
                    className={className}
                    style={{
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                        display: 'block',
                        width: '100%',
                        ...style,
                    }}
                    {...rest}
                />
            )}
        </div>
    );
}
