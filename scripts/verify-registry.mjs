import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const names = ["design", "ui", "utils", "api", "server", "gen"];
const manifest = (name) =>
  JSON.parse(
    readFileSync(join(root, "packages", name, "package.json"), "utf8"),
  );
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} failed (${result.status ?? result.signal})`);
  return result.stdout;
};

const dependencies = Object.fromEntries(
  names.map((name) => {
    const pkg = manifest(name);
    if (
      pkg.private ||
      pkg.publishConfig?.registry !== undefined ||
      pkg.publishConfig?.access !== "public"
    ) {
      throw new Error(
        `Invalid public npm release configuration for ${pkg.name}`,
      );
    }
    return [pkg.name, pkg.version];
  }),
);

// Match tested peer versions; runtime packages themselves always come from the registry.
for (const [owner, peer] of [
  ["ui", "react"],
  ["ui", "react-dom"],
  ["server", "fastify"],
  ["server", "zod"],
]) {
  dependencies[peer] = JSON.parse(
    readFileSync(
      join(root, "packages", owner, "node_modules", peer, "package.json"),
      "utf8",
    ),
  ).version;
}

const dir = mkdtempSync(join(tmpdir(), "alot-registry-"));
try {
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ private: true, type: "module", dependencies }, null, 2)}\n`,
  );
  writeFileSync(
    join(dir, "pnpm-workspace.yaml"),
    'minimumReleaseAgeExclude:\n  - "@alot-web-develop/*"\n',
  );
  const store =
    process.env.PNPM_STORE_DIR ||
    run("pnpm", ["store", "path"], {
      cwd: root,
      stdio: ["ignore", "pipe", "inherit"],
      encoding: "utf8",
    }).trim();
  run(
    "pnpm",
    [
      "install",
      "--store-dir",
      store,
      "--package-import-method",
      process.env.PNPM_PACKAGE_IMPORT_METHOD || "auto",
      "--ignore-scripts",
      "--prefer-offline",
    ],
    {
      cwd: dir,
    },
  );
  writeFileSync(
    join(dir, "smoke.mjs"),
    `
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Fastify from 'fastify';
import { Button } from '@alot-web-develop/ui/button';
import { formatDate, formatNumber } from '@alot-web-develop/utils';
import { createFetcher, unwrap, ApiError } from '@alot-web-develop/api';
import { ok, errorHandler, badRequest } from '@alot-web-develop/server';
await access(new URL(import.meta.resolve('@alot-web-develop/design/tailwind.css')));
assert.match(renderToStaticMarkup(createElement(Button, null, 'Registry ready')), /Registry ready/);
assert.equal(formatDate('2026-01-02', 'it', {pattern:'YYYY-MM-DD'}), '2026-01-02');
assert.equal(formatNumber(1234, 'en'), '1,234');
const app = Fastify();
app.setErrorHandler(errorHandler);
app.get('/api/ready', () => ok({ready:true}));
app.get('/api/rejected', () => {throw badRequest('Rejected', {field:'title'});});
try {
  const address = await app.listen({host:'127.0.0.1',port:0});
  const client = createFetcher({baseUrl:address+'/api'});
  assert.deepEqual(await unwrap(client.get('/ready')), {ready:true});
  await assert.rejects(unwrap(client.get('/rejected')), error => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status,400);
    assert.deepEqual(error.errorDetails.details,{field:'title'});
    return true;
  });
} finally {await app.close();}
console.log('Registry packages: UI/design, utils and real API/server HTTP passed');
`,
  );
  run(process.execPath, ["smoke.mjs"], { cwd: dir });
  run(join(dir, "node_modules/.bin/alot-gen"), ["--help"], { cwd: dir });
  console.log(
    `Registry install passed: ${names.map((name) => `${manifest(name).name}@${manifest(name).version}`).join(", ")}`,
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
