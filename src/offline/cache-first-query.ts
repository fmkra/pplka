"use client";

import { useEffect, useRef, useState } from "react";

export type CacheLookupResult<T> = { hit: true; data: T } | { hit: false };

type UseCacheFirstDataOptions<T> = {
  cacheKey: string;
  enabled?: boolean;
  getCachedData: () => Promise<CacheLookupResult<T>>;
};

export function useCacheFirstData<T>({
  cacheKey,
  enabled = true,
  getCachedData,
}: UseCacheFirstDataOptions<T>) {
  const getCachedDataRef = useRef(getCachedData);
  getCachedDataRef.current = getCachedData;

  const [cachedData, setCachedData] = useState<T | undefined>(undefined);
  const [isCheckingCache, setIsCheckingCache] = useState(enabled);
  const [hasCacheHit, setHasCacheHit] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsCheckingCache(false);
      setHasCacheHit(false);
      setCachedData(undefined);
      return;
    }

    let cancelled = false;
    setIsCheckingCache(true);
    setHasCacheHit(false);
    setCachedData(undefined);

    void getCachedDataRef.current()
      .then((cacheResult) => {
        if (cancelled) return;
        if (cacheResult.hit) {
          setCachedData(cacheResult.data);
          setHasCacheHit(true);
        } else {
          setCachedData(undefined);
          setHasCacheHit(false);
        }
      })
      .finally(() => {
        if (!cancelled) setIsCheckingCache(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, enabled]);

  return {
    cachedData,
    hasCacheHit,
    isCheckingCache,
    shouldEnableQuery: enabled && !isCheckingCache && !hasCacheHit,
  };
}

type CreateCacheFirstQueryHookOptions<TInput, TOutput> = {
  getCacheKey: (input: TInput) => string;
  getCachedData: (input: TInput) => Promise<CacheLookupResult<TOutput>>;
  useServerQuery: (
    input: TInput,
    options: { enabled: boolean },
  ) => { data: TOutput | undefined; isLoading: boolean };
};

export function createCacheFirstQueryHook<TInput, TOutput>({
  getCacheKey,
  getCachedData,
  useServerQuery,
}: CreateCacheFirstQueryHookOptions<TInput, TOutput>) {
  return function useCacheFirstQuery(
    input: TInput,
    options?: { enabled?: boolean },
  ) {
    const isEnabled = options?.enabled ?? true;
    const cacheKey = getCacheKey(input);
    const cacheState = useCacheFirstData({
      cacheKey,
      enabled: isEnabled,
      getCachedData: () => getCachedData(input),
    });

    const query = useServerQuery(input, { enabled: cacheState.shouldEnableQuery });

    return {
      data: cacheState.hasCacheHit ? cacheState.cachedData : query.data,
      isLoading:
        cacheState.isCheckingCache ||
        (cacheState.shouldEnableQuery && query.isLoading),
    };
  };
}
