import { lstatSync, realpathSync } from "node:fs";
import { isAbsolute, join, sep } from "node:path";

const isInside = (root: string, target: string): boolean =>
  target === root || target.startsWith(root + sep);

const resolveInside = (root: string, relative: string): string => {
  if (
    relative === "" ||
    relative.includes("\0") ||
    relative.includes("\\") ||
    isAbsolute(relative)
  ) {
    throw new Error(`unsafe destination "${relative}"`);
  }
  const segments = relative.split("/");
  if (segments.some((s) => s === ".." || s === "" || s === ".")) {
    throw new Error(`unsafe destination "${relative}"`);
  }
  const realRoot = realpathSync(root);
  let current = realRoot;
  for (const [index, segment] of segments.entries()) {
    const next = join(current, segment);
    try {
      lstatSync(next);
    } catch {
      return join(current, ...segments.slice(index));
    }
    let real: string;
    try {
      real = realpathSync(next);
    } catch {
      throw new Error(`unsafe destination "${relative}": broken symlink`);
    }
    if (!isInside(realRoot, real)) {
      throw new Error(`unsafe destination "${relative}": escapes the project`);
    }
    current = real;
  }
  return current;
};

export { resolveInside };
