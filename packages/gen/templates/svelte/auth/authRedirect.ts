const getRedirectTarget = (value: string | null, origin: string): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  try {
    const target = new URL(value, origin);
    return target.origin === origin ? target.pathname + target.search + target.hash : '/';
  } catch {
    return '/';
  }
};

export { getRedirectTarget };
