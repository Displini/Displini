/**
 * Centralized Error Handling Utilities
 * 
 * Provides consistent error handling across the app with toast notifications
 */

import { toast } from "@/hooks/use-toast";

interface ErrorHandlerOptions {
  title?: string;
  description?: string;
  showToast?: boolean;
  logError?: boolean;
}

/**
 * Handle errors consistently across the app
 * @param error - The error object
 * @param options - Configuration for error handling
 */
export function handleError(error: unknown, options: ErrorHandlerOptions = {}) {
  const {
    title = "Error",
    description,
    showToast = true,
    logError = process.env.NODE_ENV === 'development'
  } = options;

  // Log error in development
  if (logError) {
    console.error('Error caught:', error);
  }

  // Extract error message
  let errorMessage = description;
  
  if (!errorMessage) {
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = 'An unexpected error occurred';
    }
  }

  // Show toast notification
  if (showToast) {
    toast({
      title,
      description: errorMessage,
      variant: "destructive",
    });
  }

  return errorMessage;
}

/**
 * Handle API errors specifically
 */
export function handleApiError(error: unknown, options: ErrorHandlerOptions = {}) {
  const {
    title = "Request Failed",
    showToast = true,
  } = options;

  let message = "Failed to connect to server";

  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      message = "Network error. Please check your connection.";
    } else {
      message = error.message;
    }
  }

  return handleError(error, {
    title,
    description: message,
    showToast,
  });
}

/**
 * Handle form validation errors
 */
export function handleValidationError(field: string, message: string) {
  toast({
    title: "Validation Error",
    description: `${field}: ${message}`,
    variant: "destructive",
  });
}

/**
 * Handle success messages
 */
export function handleSuccess(message: string, title = "Success") {
  toast({
    title,
    description: message,
  });
}

/**
 * Async error wrapper - wraps async functions with automatic error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: ErrorHandlerOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      throw error; // Re-throw so caller can handle if needed
    }
  }) as T;
}

/**
 * Try-catch wrapper with toast
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, options);
    return null;
  }
}

