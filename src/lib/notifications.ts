import { toast } from 'sonner';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export class NotificationManager {
  static show(
    type: NotificationType,
    message: string,
    options: NotificationOptions = {}
  ): string | number {
    const {
      title,
      description,
      duration,
      action,
      dismissible = true,
    } = options;

    const toastOptions = {
      duration: duration || (type === 'error' ? 6000 : 4000),
      dismissible,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    };

    switch (type) {
      case 'success':
        return toast.success(title || message, {
          description: title ? message : description,
          ...toastOptions,
        });

      case 'error':
        return toast.error(title || message, {
          description: title ? message : description,
          ...toastOptions,
        });

      case 'warning':
        return toast.warning(title || message, {
          description: title ? message : description,
          ...toastOptions,
        });

      case 'info':
        return toast.info(title || message, {
          description: title ? message : description,
          ...toastOptions,
        });

      case 'loading':
        return toast.loading(title || message, {
          description: title ? message : description,
          duration: Infinity, // Loading toasts don't auto-dismiss
        });

      default:
        return toast(title || message, {
          description: title ? message : description,
          ...toastOptions,
        });
    }
  }

  static success(message: string, options?: NotificationOptions) {
    return this.show('success', message, options);
  }

  static error(message: string, options?: NotificationOptions) {
    return this.show('error', message, options);
  }

  static warning(message: string, options?: NotificationOptions) {
    return this.show('warning', message, options);
  }

  static info(message: string, options?: NotificationOptions) {
    return this.show('info', message, options);
  }

  static loading(message: string, options?: NotificationOptions) {
    return this.show('loading', message, options);
  }

  static dismiss(toastId: string | number) {
    toast.dismiss(toastId);
  }

  static dismissAll() {
    toast.dismiss();
  }

  // Specialized notifications for common scenarios
  static async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: NotificationOptions
  ): Promise<T> {
    toast.promise(promise, {
      loading: messages.loading,
      success: (data) => {
        return typeof messages.success === 'function'
          ? messages.success(data)
          : messages.success;
      },
      error: (error) => {
        return typeof messages.error === 'function'
          ? messages.error(error)
          : messages.error;
      },
      ...options,
    });
    return promise;
  }

  static formSuccess(action: string, entity?: string) {
    const message = entity 
      ? `${entity} ${action} successfully`
      : `${action} successful`;
    return this.success(message);
  }

  static formError(action: string, entity?: string, error?: string) {
    const baseMessage = entity 
      ? `Failed to ${action.toLowerCase()} ${entity}`
      : `${action} failed`;
    const message = error ? `${baseMessage}: ${error}` : baseMessage;
    return this.error(message);
  }

  static networkError(action?: string) {
    const message = action 
      ? `Network error while ${action}. Please check your connection.`
      : 'Network error. Please check your connection.';
    return this.error(message, {
      duration: 6000,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    });
  }

  static validationError(errors: string[] | string) {
    const message = Array.isArray(errors) 
      ? errors.join(', ')
      : errors;
    return this.error(`Validation failed: ${message}`);
  }

  static permissionError(action?: string) {
    const message = action 
      ? `You don't have permission to ${action}`
      : 'Permission denied';
    return this.error(message);
  }

  static notFound(entity?: string) {
    const message = entity 
      ? `${entity} not found`
      : 'Resource not found';
    return this.error(message);
  }

  static serverError(message?: string) {
    return this.error(
      message || 'Server error occurred. Please try again later.',
      {
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        },
      }
    );
  }

  static maintenance() {
    return this.warning(
      'System maintenance in progress. Some features may be unavailable.',
      {
        duration: 8000,
      }
    );
  }

  static updateAvailable() {
    return this.info(
      'A new version is available',
      {
        duration: 10000,
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload(),
        },
      }
    );
  }

  static offline() {
    return this.warning(
      'You are currently offline. Some features may not work.',
      {
        duration: Infinity,
      }
    );
  }

  static online() {
    return this.success('Connection restored');
  }

  static sessionExpired() {
    return this.warning(
      'Your session has expired. Please sign in again.',
      {
        duration: 8000,
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = '/auth/signin',
        },
      }
    );
  }

  static confirmAction(
    message: string,
    onConfirm: () => void,
    options?: NotificationOptions
  ) {
    return this.warning(message, {
      ...options,
      duration: 8000,
      action: {
        label: 'Confirm',
        onClick: onConfirm,
      },
    });
  }
}

// Export convenience functions
export const notify = NotificationManager;

// React hook for notifications
export function useNotifications() {
  return {
    notify: NotificationManager,
    success: NotificationManager.success,
    error: NotificationManager.error,
    warning: NotificationManager.warning,
    info: NotificationManager.info,
    loading: NotificationManager.loading,
    dismiss: NotificationManager.dismiss,
    dismissAll: NotificationManager.dismissAll,
    promise: NotificationManager.promise,
  };
}
