import { useCallback } from 'react';
import { toast } from 'sonner';

export interface ErrorDetails {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export function useErrorHandler() {
  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ): ErrorDetails => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    let errorDetails: ErrorDetails;

    // Parse different types of errors
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        details: error.stack,
      };
    } else if (typeof error === 'string') {
      errorDetails = {
        message: error,
      };
    } else if (error && typeof error === 'object') {
      const errorObj = error as any;
      errorDetails = {
        message: errorObj.message || errorObj.error || fallbackMessage,
        code: errorObj.code,
        statusCode: errorObj.statusCode || errorObj.status,
        details: errorObj.details,
      };
    } else {
      errorDetails = {
        message: fallbackMessage,
      };
    }

    // Log error if enabled
    if (logError) {
      console.error('Error handled:', errorDetails, error);
    }

    // Show toast notification if enabled
    if (showToast) {
      toast.error(errorDetails.message);
    }

    return errorDetails;
  }, []);

  const handleApiError = useCallback(async (
    response: Response,
    options: ErrorHandlerOptions = {}
  ): Promise<ErrorDetails> => {
    let errorMessage = 'An error occurred';
    let errorDetails: any = {};

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorDetails = errorData.details || {};
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    const error = {
      message: errorMessage,
      statusCode: response.status,
      details: errorDetails,
    };

    return handleError(error, options);
  }, [handleError]);

  const handleAsyncError = useCallback(<T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ) => {
    return async (): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error, options);
        return null;
      }
    };
  }, [handleError]);

  return {
    handleError,
    handleApiError,
    handleAsyncError,
  };
}

// Specific error handlers for common scenarios
export function useFormErrorHandler() {
  const { handleError } = useErrorHandler();

  const handleValidationError = useCallback((
    errors: Record<string, any>,
    options: ErrorHandlerOptions = {}
  ) => {
    const errorMessages = Object.values(errors)
      .flat()
      .map((error: any) => error.message || error)
      .join(', ');

    return handleError(
      { message: `Validation failed: ${errorMessages}` },
      { ...options, showToast: options.showToast ?? true }
    );
  }, [handleError]);

  const handleSubmissionError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    return handleError(error, {
      ...options,
      fallbackMessage: 'Failed to submit form. Please try again.',
      showToast: options.showToast ?? true,
    });
  }, [handleError]);

  return {
    handleValidationError,
    handleSubmissionError,
  };
}

export function useNetworkErrorHandler() {
  const { handleError } = useErrorHandler();

  const handleNetworkError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    let message = 'Network error occurred';

    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        message = 'Unable to connect to server. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        message = 'Request timed out. Please try again.';
      }
    }

    return handleError(
      { message },
      { ...options, showToast: options.showToast ?? true }
    );
  }, [handleError]);

  const handleOfflineError = useCallback((
    options: ErrorHandlerOptions = {}
  ) => {
    return handleError(
      { message: 'You appear to be offline. Please check your internet connection.' },
      { ...options, showToast: options.showToast ?? true }
    );
  }, [handleError]);

  return {
    handleNetworkError,
    handleOfflineError,
  };
}

// Error boundary hook for functional components
export function useErrorBoundary() {
  const { handleError } = useErrorHandler();

  const captureError = useCallback((
    error: unknown,
    errorInfo?: { componentStack?: string }
  ) => {
    const errorDetails = handleError(error, { showToast: false });
    
    // Log additional error boundary info
    console.error('Error boundary captured:', {
      ...errorDetails,
      componentStack: errorInfo?.componentStack,
    });

    // You can integrate with error monitoring services here
    // e.g., Sentry.captureException(error, { extra: errorInfo });

    return errorDetails;
  }, [handleError]);

  return { captureError };
}
