import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationOptions<T> {
  schema?: z.ZodSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  options: FormValidationOptions<T> = {}
) {
  const {
    schema,
    validateOnChange = false,
    validateOnBlur = true,
    debounceMs = 300,
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Debounced validation
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout>();

  const validateField = useCallback((
    field: string,
    value: any,
    showError = true
  ): string | null => {
    if (!schema) return null;

    try {
      // Try to validate the entire object with just this field changed
      const testValues = { ...values, [field]: value };
      schema.parse(testValues);

      if (showError) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }

      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Find error for this specific field
        const fieldError = error.errors.find(err =>
          err.path.length > 0 && err.path[0] === field
        );

        if (fieldError) {
          const errorMessage = fieldError.message;

          if (showError) {
            setErrors(prev => ({ ...prev, [field]: errorMessage }));
          }

          return errorMessage;
        }
      }

      return null;
    }
  }, [schema, values]);

  const validateAll = useCallback((
    valuesToValidate = values,
    showErrors = true
  ): ValidationError[] => {
    if (!schema) return [];

    try {
      schema.parse(valuesToValidate);
      
      if (showErrors) {
        setErrors({});
        setIsValid(true);
      }
      
      return [];
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        if (showErrors) {
          const errorMap: Record<string, string> = {};
          validationErrors.forEach(({ field, message }) => {
            errorMap[field] = message;
          });
          setErrors(errorMap);
          setIsValid(false);
        }

        return validationErrors;
      }
      
      return [];
    }
  }, [schema, values]);

  const setValue = useCallback((
    field: string,
    value: any,
    options: { validate?: boolean; touch?: boolean } = {}
  ) => {
    const { validate = validateOnChange, touch = true } = options;

    setValues(prev => ({ ...prev, [field]: value }));

    if (touch) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }

    if (validate) {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }

      const timeout = setTimeout(() => {
        validateField(field, value, touched[field] || touch);
      }, debounceMs);

      setValidationTimeout(timeout);
    }
  }, [validateOnChange, validateField, touched, debounceMs, validationTimeout]);

  const setMultipleValues = useCallback((
    newValues: Partial<T> | ((prev: T) => T),
    options: { validate?: boolean; touch?: boolean } = {}
  ) => {
    const { validate = false, touch = false } = options;

    if (typeof newValues === 'function') {
      setValues(prev => {
        const updated = newValues(prev);
        if (validate) {
          setTimeout(() => validateAll(updated), debounceMs);
        }
        return updated;
      });
    } else {
      setValues(prev => {
        const updated = { ...prev, ...newValues };
        if (validate) {
          setTimeout(() => validateAll(updated), debounceMs);
        }
        return updated;
      });
    }

    if (touch) {
      const fieldsToTouch = typeof newValues === 'function'
        ? Object.keys(values)
        : Object.keys(newValues);

      setTouched(prev => {
        const newTouched = { ...prev };
        fieldsToTouch.forEach(field => {
          newTouched[field] = true;
        });
        return newTouched;
      });
    }
  }, [validateAll, debounceMs, values]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (validateOnBlur) {
      validateField(field, values[field]);
    }
  }, [validateOnBlur, validateField, values]);

  const handleSubmit = useCallback(async <R>(
    onSubmit: (values: T) => Promise<R> | R,
    options: { validateBeforeSubmit?: boolean } = {}
  ): Promise<R | null> => {
    const { validateBeforeSubmit = true } = options;

    setIsSubmitting(true);

    try {
      // Mark all fields as touched
      const allFields = Object.keys(values);
      setTouched(prev => {
        const newTouched = { ...prev };
        allFields.forEach(field => {
          newTouched[field] = true;
        });
        return newTouched;
      });

      // Validate if required
      if (validateBeforeSubmit) {
        const validationErrors = validateAll(values, true);
        if (validationErrors.length > 0) {
          return null;
        }
      }

      const result = await onSubmit(values);
      return result;
    } catch (error) {
      // Handle submission errors
      if (error instanceof Error) {
        setErrors(prev => ({ ...prev, _form: error.message }));
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateAll]);

  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues ? { ...initialValues, ...newValues } : initialValues;
    setValues(resetValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsValid(true);
  }, [initialValues]);

  const clearErrors = useCallback((fields?: string[]) => {
    if (fields) {
      setErrors(prev => {
        const newErrors = { ...prev };
        fields.forEach(field => {
          delete newErrors[field];
        });
        return newErrors;
      });
    } else {
      setErrors({});
    }
  }, []);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  // Update validity when errors change
  useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;
    setIsValid(!hasErrors);
  }, [errors]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setValues: setMultipleValues,
    handleBlur,
    handleSubmit,
    validateField,
    validateAll,
    reset,
    clearErrors,
    setFieldError,
    // Helper functions
    getFieldProps: (field: string) => ({
      value: values[field] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        setValue(field, e.target.value),
      onBlur: () => handleBlur(field),
      error: touched[field] ? errors[field] : undefined,
    }),
    hasError: (field: string) => Boolean(touched[field] && errors[field]),
    getError: (field: string) => touched[field] ? errors[field] : undefined,
  };
}
