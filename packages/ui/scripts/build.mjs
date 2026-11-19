import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
execFileSync("tsc", ["-p", "tsconfig.build.json"], { stdio: "inherit" });
writeFileSync(
  "dist/styles.css",
  '@import "@alot-web-develop/design/tailwind.css";\n@import "tw-animate-css";\n@source "./";\n@layer base {\n  * { @apply border-border outline-ring/50; }\n  body { @apply bg-background text-foreground; }\n}\n',
);
