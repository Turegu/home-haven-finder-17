import { useState, useCallback } from "react";

/**
 * Hook for form field validation with scroll-to-error and red highlight.
 * 
 * Usage:
 * 1. const { fieldErrors, validate, clearError } = useFieldValidation();
 * 2. Wrap fields with data-field="fieldName"
 * 3. Add hasError("fieldName") for conditional styling
 * 4. Call validate(rules) on publish
 */
export interface ValidationRule {
  field: string;
  check: boolean; // true = error (field is invalid)
  message: string;
}

export function useFieldValidation() {
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());

  const validate = useCallback((rules: ValidationRule[]): boolean => {
    const errors = new Set<string>();
    let firstMessage = "";

    for (const rule of rules) {
      if (rule.check) {
        errors.add(rule.field);
        if (!firstMessage) firstMessage = rule.message;
      }
    }

    setFieldErrors(errors);

    if (errors.size > 0) {
      // Scroll to first error field
      const firstField = rules.find(r => r.check)?.field;
      if (firstField) {
        setTimeout(() => {
          const el = document.querySelector(`[data-field="${firstField}"]`) as HTMLElement;
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 50);
      }
      // Show toast for first error
      return false;
    }

    return true;
  }, []);

  const clearError = useCallback((field: string) => {
    setFieldErrors(prev => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }, []);

  const hasError = useCallback((field: string) => fieldErrors.has(field), [fieldErrors]);

  const errorClass = useCallback(
    (field: string) => fieldErrors.has(field) ? "ring-2 ring-destructive/70 rounded-md" : "",
    [fieldErrors]
  );

  return { fieldErrors, validate, clearError, hasError, errorClass };
}
