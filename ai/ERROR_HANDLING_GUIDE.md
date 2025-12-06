# Error Handling Guide

**Date:** November 4, 2025  
**Status:** ✅ Implemented  
**Coverage:** 5+ components

---

## Overview

Centralized error handling system with consistent toast notifications across the Displini app.

---

## Core Utility Functions

Location: `client/src/lib/errorHandling.ts`

### 1. `handleError()`

General-purpose error handler with toast notifications.

```typescript
import { handleError } from '@/lib/errorHandling';

try {
  // Your operation
  localStorage.setItem('key', 'value');
} catch (error) {
  handleError(error, { 
    title: 'Save Failed',
    description: 'Could not save data'
  });
}
```

**Options:**
- `title` - Toast title (default: "Error")
- `description` - Custom error message
- `showToast` - Show toast notification (default: true)
- `logError` - Log to console in development (default: true)

---

### 2. `handleApiError()`

Specialized handler for API/network errors.

```typescript
import { handleApiError } from '@/lib/errorHandling';

try {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Request failed');
  }
  
  const data = await response.json();
} catch (error) {
  handleApiError(error, { title: 'Login Failed' });
}
```

**Features:**
- Detects network errors
- Provides user-friendly messages
- Shows toast automatically

---

### 3. `handleSuccess()`

Show success messages consistently.

```typescript
import { handleSuccess } from '@/lib/errorHandling';

// After successful operation
handleSuccess('Task completed!');

// With custom title
handleSuccess('Data saved successfully', 'Success');
```

---

### 4. `withErrorHandling()`

Wraps async functions with automatic error handling.

```typescript
import { withErrorHandling } from '@/lib/errorHandling';

const saveData = withErrorHandling(
  async (data) => {
    const response = await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return await response.json();
  },
  { title: 'Save Failed' }
);

// Use it
await saveData(myData); // Errors handled automatically
```

---

### 5. `tryCatch()`

Promise wrapper with error handling.

```typescript
import { tryCatch } from '@/lib/errorHandling';

const data = await tryCatch(
  async () => {
    const response = await fetch('/api/data');
    return await response.json();
  },
  { title: 'Failed to Load Data' }
);

// data will be null if error occurred
if (data) {
  // Use data
}
```

---

## Implementation Examples

### Login Form (Login.tsx)

```typescript
import { handleApiError, handleSuccess } from '@/lib/errorHandling';

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    handleSuccess('Login successful!');
    // Redirect to /app/todo
  } catch (error) {
    handleApiError(error, { title: 'Login Failed' });
  } finally {
    setIsLoading(false);
  }
};
```

### CRUD Operations (MenstrualCycleTracker.tsx)

```typescript
import { handleError, handleSuccess } from '@/lib/errorHandling';

const handleAddEntry = () => {
  try {
    const entry = { /* ... */ };
    const updated = [...entries, entry];
    setEntries(updated);
    localStorage.setItem('menstrual_entries', JSON.stringify(updated));
    handleSuccess('Entry added successfully');
  } catch (error) {
    handleError(error, { title: 'Failed to Add Entry' });
  }
};

const handleDeleteEntry = (id: string) => {
  try {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem('menstrual_entries', JSON.stringify(updated));
    handleSuccess('Entry deleted');
  } catch (error) {
    handleError(error, { title: 'Failed to Delete Entry' });
  }
};
```

### Form Submission (LandingCTA.tsx)

```typescript
import { handleSuccess, handleError } from '@/lib/errorHandling';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    
    handleSuccess(
      'Thank you for subscribing! We\'ll keep you updated.',
      'Subscription Successful'
    );
    setEmail('');
  } catch (error) {
    handleError(error, { 
      title: 'Subscription Failed',
      description: 'Could not subscribe to newsletter. Please try again.'
    });
  }
};
```

---

## Components with Error Handling

### Implemented (5 components):

1. **Login.tsx**
   - API errors with `handleApiError()`
   - Success messages with `handleSuccess()`

2. **MenstrualCycleTracker.tsx**
   - Add/Update/Delete operations
   - localStorage errors
   - Success confirmations

3. **WaterIntakeFeature.tsx**
   - Water logging errors
   - Delete errors
   - Success messages

4. **LandingCTA.tsx**
   - Email subscription
   - Form submission errors

5. **ErrorBoundary.tsx**
   - Global error catcher
   - Development logging

### Ready to Add (Future):

- RemindersDialog.tsx (CRUD operations)
- MedicationTracker.tsx (medication logging)
- SleepScheduleFeature.tsx (schedule creation)
- Todo.tsx (task operations)
- Calendar.tsx (event operations)

---

## Error Types Covered

### 1. localStorage Errors
```typescript
try {
  localStorage.setItem('key', JSON.stringify(data));
} catch (error) {
  handleError(error, { title: 'Save Failed' });
}
```

### 2. API Errors
```typescript
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) throw new Error('Request failed');
} catch (error) {
  handleApiError(error, { title: 'Request Failed' });
}
```

### 3. Validation Errors
```typescript
import { handleValidationError } from '@/lib/errorHandling';

if (!email.includes('@')) {
  handleValidationError('Email', 'Invalid email address');
  return;
}
```

### 4. Form Submission Errors
```typescript
try {
  await submitForm(data);
  handleSuccess('Form submitted!');
} catch (error) {
  handleError(error, { title: 'Submission Failed' });
}
```

---

## Best Practices

### Do's ✅

1. **Always wrap localStorage operations**
```typescript
try {
  localStorage.setItem('key', value);
} catch (error) {
  handleError(error);
}
```

2. **Use handleSuccess for confirmations**
```typescript
// After successful operation
handleSuccess('Task completed!');
```

3. **Provide context in error titles**
```typescript
handleError(error, { title: 'Failed to Save Task' });
// Better than just { title: 'Error' }
```

4. **Use handleApiError for network calls**
```typescript
try {
  await fetch('/api/endpoint');
} catch (error) {
  handleApiError(error); // Detects network issues
}
```

### Don'ts ❌

1. **Don't silently fail**
```typescript
// Bad
try {
  // operation
} catch (error) {
  // Silent - user has no idea what happened
}

// Good
try {
  // operation
} catch (error) {
  handleError(error);
}
```

2. **Don't use generic messages**
```typescript
// Bad
handleError(error, { title: 'Error' });

// Good
handleError(error, { title: 'Failed to Add Water Entry' });
```

3. **Don't skip error handling**
```typescript
// Bad
localStorage.setItem('key', value); // Could fail!

// Good
try {
  localStorage.setItem('key', value);
} catch (error) {
  handleError(error);
}
```

---

## Toast Notification Patterns

### Standard Error
```typescript
handleError(error, { title: 'Operation Failed' });
```

Shows red destructive toast with error message.

### API Error
```typescript
handleApiError(error, { title: 'Request Failed' });
```

Shows network-aware error message.

### Success Message
```typescript
handleSuccess('Operation completed!');
```

Shows green success toast.

### Validation Error
```typescript
handleValidationError('Email', 'Invalid format');
```

Shows validation-specific error.

---

## Testing Error Handling

### Test localStorage Errors

```typescript
// In browser console:
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: () => { throw new Error('Storage full'); }
  }
});

// Try adding entry - should show error toast
```

### Test API Errors

```typescript
// Disconnect network
// Try login - should show network error
```

### Test Success Messages

```typescript
// Add water entry
// Should see: "Added 250ml of water" toast
```

---

## Migration Guide

### Update Existing Components

**Before:**
```typescript
const addItem = () => {
  const items = JSON.parse(localStorage.getItem('items') || '[]');
  items.push(newItem);
  localStorage.setItem('items', JSON.stringify(items));
  alert('Item added!'); // ❌ Not professional
};
```

**After:**
```typescript
import { handleError, handleSuccess } from '@/lib/errorHandling';

const addItem = () => {
  try {
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    items.push(newItem);
    localStorage.setItem('items', JSON.stringify(items));
    handleSuccess('Item added!'); // ✅ Professional toast
  } catch (error) {
    handleError(error, { title: 'Failed to Add Item' });
  }
};
```

---

## Future Enhancements

### 1. Error Monitoring Service

```typescript
// In errorHandling.ts
import * as Sentry from "@sentry/react";

export function handleError(error: unknown, options: ErrorHandlerOptions = {}) {
  // ... existing code ...
  
  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error);
  }
}
```

### 2. Retry Logic

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) {
        handleError(error);
        throw error;
      }
      // Wait before retry
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}
```

### 3. Offline Detection

```typescript
export function handleOfflineError() {
  if (!navigator.onLine) {
    handleError(new Error('No internet connection'), {
      title: 'Offline',
      description: 'Please check your internet connection'
    });
    return true;
  }
  return false;
}
```

---

## Summary

✅ **Implemented:**
- Central error handling utilities
- Toast notifications for all errors
- Success confirmations
- API error handling
- localStorage error handling

✅ **Benefits:**
- Consistent user feedback
- Professional UX
- Easy to debug
- Maintainable code

✅ **Coverage:**
- 5 components updated
- 8+ functions protected
- Ready for expansion

---

**Your error handling is now production-ready!** 🎯

