import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const packagesRoot = join(repoRoot, "packages");

const run = (command, args, { cwd, env, capture = false } = {}) => {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited ${result.status}`);
  }
  return result.stdout ?? "";
};

const pnpmStore = () =>
  process.env.PNPM_STORE_DIR ||
  process.env.npm_config_store_dir ||
  run("pnpm", ["store", "path"], { cwd: repoRoot, capture: true }).trim();

// Builds and packs the real workspace packages as `alot-<name>.tgz` in `dir`.
const packKit = (names, dir) => {
  mkdirSync(dir, { recursive: true });
  const tarballs = {};
  for (const name of names) {
    const pkg = join(packagesRoot, name);
    run("pnpm", ["--dir", pkg, "build"]);
    const file = join(dir, `alot-${name}.tgz`);
    run("pnpm", ["--dir", pkg, "pack", "--out", file]);
    tarballs[`@alot-web-develop/${name}`] = file;
  }
  return tarballs;
};

// Points every kit dependency (direct and transitive) at the packed tarball.
const useTarballs = (fixture, tarballs, devOnly = []) => {
  const file = join(fixture, "package.json");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  manifest.dependencies ??= {};
  manifest.devDependencies ??= {};
  const overrides = [];
  for (const [pkg, tgz] of Object.entries(tarballs)) {
    const local = `alot-${pkg.split("/")[1]}.tgz`;
    cpSync(tgz, join(fixture, local));
    const spec = `file:./${local}`;
    overrides.push(`  "${pkg}": ${spec}`);
    if (devOnly.includes(pkg)) manifest.devDependencies[pkg] = spec;
    else if (pkg in manifest.devDependencies)
      manifest.devDependencies[pkg] = spec;
    else if (pkg in manifest.dependencies) manifest.dependencies[pkg] = spec;
  }
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  const workspace = join(fixture, "pnpm-workspace.yaml");
  if (!existsSync(workspace)) {
    writeFileSync(workspace, `overrides:\n${overrides.join("\n")}\n`);
  }
};

const install = (fixture, extra = []) =>
  run(
    "pnpm",
    [
      "install",
      "--store-dir",
      pnpmStore(),
      "--package-import-method",
      process.env.PNPM_PACKAGE_IMPORT_METHOD || "hardlink",
      "--ignore-scripts",
      ...extra,
    ],
    { cwd: fixture },
  );

// Runs the INSTALLED alot-gen bin; returns the paths it reports as created.
const createGen = (fixture) => {
  const bin = join(fixture, "node_modules/.bin/alot-gen");
  if (!existsSync(bin)) throw new Error(`alot-gen bin not installed: ${bin}`);
  return (args) => {
    const output = run(bin, args, { cwd: fixture, capture: true });
    process.stdout.write(output);
    return output;
  };
};

const createdPaths = (output) =>
  output
    .split("\n")
    .filter((line) => line.startsWith("created "))
    .map((line) => line.slice("created ".length));

export {
  createdPaths,
  createGen,
  install,
  packKit,
  pnpmStore,
  repoRoot,
  run,
  useTarballs,
};
