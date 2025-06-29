import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

export interface LoadingOptions {
  initialLoading?: boolean;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export function useLoading(options: LoadingOptions = {}) {
  const {
    initialLoading = false,
    timeout = 30000, // 30 seconds
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearLoadingTimeout();
    setIsLoading(false);
  }, [clearLoadingTimeout]);

  const execute = useCallback(async <T>(
    asyncFunction: (signal?: AbortSignal) => Promise<T>,
    options: { showError?: boolean; resetData?: boolean } = {}
  ): Promise<T | null> => {
    const { showError = true, resetData = true } = options;

    // Reset state
    setIsLoading(true);
    setError(null);
    if (resetData) {
      setData(null);
    }

    // Create abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Set timeout
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        abort();
        if (showError) {
          setError('Request timed out');
        }
      }, timeout);
    }

    try {
      const result = await asyncFunction(signal);
      
      if (!signal.aborted) {
        setData(result);
        setRetryAttempts(0);
        return result;
      }
      
      return null;
    } catch (err) {
      if (!signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        
        if (showError) {
          setError(errorMessage);
        }

        // Retry logic
        if (retryAttempts < retryCount && !signal.aborted) {
          setRetryAttempts(prev => prev + 1);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Retry the operation
          return execute(asyncFunction, options);
        }
      }
      
      return null;
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
        clearLoadingTimeout();
      }
    }
  }, [timeout, retryCount, retryDelay, retryAttempts, abort, clearLoadingTimeout]);

  const reset = useCallback(() => {
    abort();
    setError(null);
    setData(null);
    setRetryAttempts(0);
  }, [abort]);

  const retry = useCallback(() => {
    setRetryAttempts(0);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abort();
    };
  }, [abort]);

  return {
    isLoading,
    error,
    data,
    retryAttempts,
    execute,
    reset,
    retry,
    abort,
  };
}

// Specialized hook for API calls
export function useApiCall<T = any>(
  url?: string,
  options: LoadingOptions & {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    autoExecute?: boolean;
  } = {}
) {
  const {
    method = 'GET',
    headers = {},
    body,
    autoExecute = false,
    ...loadingOptions
  } = options;

  const { execute, ...loadingState } = useLoading(loadingOptions);

  const makeRequest = useCallback(async (
    requestUrl?: string,
    requestOptions?: {
      method?: string;
      headers?: Record<string, string>;
      body?: any;
    }
  ): Promise<T | null> => {
    const finalUrl = requestUrl || url;
    if (!finalUrl) {
      throw new Error('URL is required');
    }

    const finalOptions = {
      method: requestOptions?.method || method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...requestOptions?.headers,
      },
      ...(requestOptions?.body || body ? {
        body: JSON.stringify(requestOptions?.body || body)
      } : {}),
    };

    return execute(async (signal) => {
      const response = await fetch(finalUrl, {
        ...finalOptions,
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }, [url, method, headers, body, execute]);

  // Auto-execute on mount if enabled
  useEffect(() => {
    if (autoExecute && url) {
      makeRequest();
    }
  }, [autoExecute, url, makeRequest]);

  return {
    ...loadingState,
    makeRequest,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const getError = useCallback((key: string) => {
    return errors[key] || null;
  }, [errors]);

  const clearError = useCallback((key: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const execute = useCallback(async <T>(
    key: string,
    asyncFunction: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(key, true);
    setError(key, null);

    try {
      const result = await asyncFunction();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(key, errorMessage);
      return null;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading, setError]);

  return {
    isLoading,
    getError,
    setLoading,
    setError,
    clearError,
    clearAllErrors,
    execute,
  };
}
