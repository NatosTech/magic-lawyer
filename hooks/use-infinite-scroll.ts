"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isEnabled: boolean;
  shouldUseLoader?: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

export function useInfiniteScroll({ hasMore, isEnabled, shouldUseLoader = true, onLoadMore, threshold = 0.1 }: UseInfiniteScrollOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading && isEnabled) {
        setIsLoading(true);
        onLoadMore();
      }
    },
    [hasMore, isLoading, isEnabled, onLoadMore]
  );

  useEffect(() => {
    if (!isEnabled) return;

    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, isEnabled, threshold]);

  useEffect(() => {
    if (isLoading) {
      // Simular delay para evitar muitas requisições
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return [elementRef, isLoading] as const;
}
