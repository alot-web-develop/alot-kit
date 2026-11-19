/** Local scalar check keeps this module (and package) free of dependencies. */
function isScalar(value: unknown): value is string | number | boolean {
  return ["string", "number", "boolean"].includes(typeof value);
}

/** Appends a single query value, repeating the key for array entries. */
function appendQueryValue(url: URL, key: string, value: unknown): void {
  const items = Array.isArray(value) ? value : [value];
  for (const item of items) {
    if (item == null) continue;
    if (!isScalar(item)) {
      throw new TypeError(
        `Query parameter '${key}' must contain scalar values`,
      );
    }
    url.searchParams.append(key, String(item));
  }
}

/**
 * Applies query parameters to a URL, repeating keys for array values and
 * omitting nullish entries.
 */
function applyQuery(url: URL, query: object | undefined): void {
  if (query === undefined) return;
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue;
    url.searchParams.delete(key);
    appendQueryValue(url, key, value);
  }
}

/** Joins the base URL's prefix pathname with the requested resource path. */
function resourceUrl(base: URL, path: string): URL {
  const prefix = base.pathname.replace(/\/+$/, "");
  const suffix = path.replace(/^\/+/, "");
  return new URL(`${base.origin}${prefix}/${suffix}`);
}

/**
 * Builds the target URL for a request by combining the configured base URL's
 * pathname with the requested path, then merging query parameters.
 */
function requestUrl(base: URL, path: string, query?: object): URL {
  const url = new URL(base);
  const resource = resourceUrl(base, path);
  url.pathname = resource.pathname;
  url.hash = resource.hash;

  // Preserve any query values already present on the resource path.
  for (const key of new Set(resource.searchParams.keys())) {
    url.searchParams.delete(key);
    for (const value of resource.searchParams.getAll(key)) {
      url.searchParams.append(key, value);
    }
  }

  applyQuery(url, query);
  return url;
}

export { requestUrl };
