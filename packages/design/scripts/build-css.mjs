import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderNativewindCss,
  renderTailwindCss,
  renderTokensCss,
  themes,
} from "../dist/index.js";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

const write = (file, content) => {
  const target = join(dist, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
  console.log(`wrote dist/${file}`);
};

write("tailwind.css", renderTailwindCss(themes.default));
write("nativewind.css", renderNativewindCss(themes.default));
write("tokens.css", renderTokensCss(themes.default));
