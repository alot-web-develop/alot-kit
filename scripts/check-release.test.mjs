import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { releaseCoverage } from "./check-release.mjs";

test("release coverage rejects an uncovered package change and accepts its changeset", () => {
  const root = mkdtempSync(join(tmpdir(), "release-check-"));
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, stdio: "pipe" });
  try {
    git("init", "-q");
    mkdirSync(join(root, "packages/utils"), { recursive: true });
    writeFileSync(
      join(root, "packages/utils/package.json"),
      '{"name":"@alot-web-develop/utils","version":"0.1.0"}',
    );
    git("add", ".");
    git(
      "-c",
      "user.name=Release fixture",
      "-c",
      "user.email=fixture@example.test",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-qm",
      "baseline",
    );
    writeFileSync(
      join(root, "packages/utils/guards.ts"),
      "export const isDefined = () => true;\n",
    );
    assert.deepEqual(releaseCoverage(root, "HEAD").missing, [
      "@alot-web-develop/utils",
    ]);
    mkdirSync(join(root, ".changeset"));
    writeFileSync(
      join(root, ".changeset/guards.md"),
      '---\n"@alot-web-develop/utils": minor\n---\n\nNew guards.\n',
    );
    assert.deepEqual(releaseCoverage(root, "HEAD").missing, []);
    const baseline = git("rev-parse", "HEAD").toString().trim();
    rmSync(join(root, ".changeset/guards.md"));
    writeFileSync(
      join(root, "packages/utils/package.json"),
      '{"name":"@alot-web-develop/utils","version":"0.2.0"}',
    );
    writeFileSync(
      join(root, "packages/utils/CHANGELOG.md"),
      "# Utils\n\n## 0.2.0\n\nNew guards.\n",
    );
    git("add", ".");
    git(
      "-c",
      "user.name=Release fixture",
      "-c",
      "user.email=fixture@example.test",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-qm",
      "version packages",
    );
    assert.deepEqual(releaseCoverage(root, baseline).missing, []);
    assert.deepEqual(releaseCoverage(root, baseline).versioned, [
      "@alot-web-develop/utils",
    ]);
    writeFileSync(
      join(root, "packages/utils/guards.ts"),
      "export const isDefined = () => false;\n",
    );
    assert.deepEqual(releaseCoverage(root, baseline).missing, [
      "@alot-web-develop/utils",
    ]);
    assert.throws(() => releaseCoverage(root, "--help"), /provide --since/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
