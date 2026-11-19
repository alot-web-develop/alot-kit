import { type ChangeEvent, useCallback, useEffect, useState } from 'react';

const SEARCH_DEBOUNCE_MS = 300;

const useOrderSearchInput = (search: string, onSearchChange: (search: string) => void) => {
  const [value, setValue] = useState(search);

  useEffect(() => {
    setValue(search);
  }, [search]);

  useEffect(() => {
    if (value === search) return;
    const timeout = setTimeout(() => onSearchChange(value), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [value, search, onSearchChange]);

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value), []);

  return { value, onChange };
};

export { useOrderSearchInput };
