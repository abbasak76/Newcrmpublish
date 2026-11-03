import { useEffect, useState } from 'react';
/** Debounces fast-changing search input without delaying the controlled input itself. */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), Math.max(0, delayMs));
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
