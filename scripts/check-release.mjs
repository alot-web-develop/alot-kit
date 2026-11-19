import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const releaseCoverage = (root, since) => {
  if (!since || since.startsWith("-"))
    throw new Error("provide --since <last released Git ref>");
  const git = (args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git(["rev-parse", "--verify", `${since}^{commit}`]);
  const changed = new Set(
    [
      ...git(["diff", "--name-only", since, "--", "packages/"]).split("\n"),
      ...git([
        "ls-files",
        "--others",
        "--exclude-standard",
        "--",
        "packages/",
      ]).split("\n"),
    ]
      .filter(Boolean)
      .map((file) => file.split("/")[1]),
  );
  const entries = [...changed].flatMap((directory) => {
    const file = join(root, "packages", directory, "package.json");
    if (!existsSync(file))
      throw new Error(
        `changed package ${directory} has no manifest; review its release manually`,
      );
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    return manifest.private ? [] : [{ directory, manifest }];
  });
  const packages = entries.map(({ manifest }) => manifest.name);
  const changesets = join(root, ".changeset");
  const covered = new Set(
    existsSync(changesets)
      ? readdirSync(changesets)
          .filter((file) => file.endsWith(".md") && file !== "README.md")
          .flatMap((file) => {
            const text = readFileSync(join(changesets, file), "utf8");
            const frontmatter =
              /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)?.[1] ?? "";
            return [
              ...frontmatter.matchAll(
                /^\s*["']?(@?[^\s"':]+(?:\/[^\s"':]+)?)["']?:\s*(?:patch|minor|major)\s*$/gm,
              ),
            ].map((match) => match[1]);
          })
      : [],
  );
  const readAt = (ref, path) => {
    try {
      return JSON.parse(git(["show", `${ref}:${path}`]));
    } catch {
      return undefined;
    }
  };
  const newer = (current, previous) => {
    if (typeof current !== "string" || !/^\d+\.\d+\.\d+$/.test(current))
      return false;
    if (previous === undefined) return true;
    if (typeof previous !== "string" || !/^\d+\.\d+\.\d+$/.test(previous))
      return false;
    const left = current.split(".").map(Number),
      right = previous.split(".").map(Number);
    for (let i = 0; i < 3; i++)
      if (left[i] !== right[i]) return left[i] > right[i];
    return false;
  };
  const versioned = entries
    .filter(({ directory, manifest }) => {
      const path = `packages/${directory}/package.json`;
      if (!newer(manifest.version, readAt(since, path)?.version)) return false;
      const changelog = join(root, "packages", directory, "CHANGELOG.md");
      if (
        !existsSync(changelog) ||
        !new RegExp(
          `^##\\s+${manifest.version.replaceAll(".", "\\.")}\\s*$`,
          "m",
        ).test(readFileSync(changelog, "utf8"))
      )
        return false;
      let versionCommit;
      for (const commit of git([
        "log",
        "--format=%H",
        `${since}..HEAD`,
        "--",
        path,
      ])
        .split("\n")
        .filter(Boolean)) {
        if (readAt(commit, path)?.version !== manifest.version) break;
        versionCommit = commit;
      }
      if (!versionCommit) return false;
      return (
        !git([
          "diff",
          "--name-only",
          versionCommit,
          "--",
          `packages/${directory}/`,
        ]) &&
        !git([
          "ls-files",
          "--others",
          "--exclude-standard",
          "--",
          `packages/${directory}/`,
        ])
      );
    })
    .map(({ manifest }) => manifest.name);
  const missing = packages.filter(
    (name) => !covered.has(name) && !versioned.includes(name),
  );
  return { packages, versioned, missing };
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const { values } = parseArgs({ options: { since: { type: "string" } } });
    const result = releaseCoverage(process.cwd(), values.since);
    console.log(JSON.stringify(result));
    if (result.missing.length) {
      console.error(
        `Release blocked: missing changesets for ${result.missing.join(", ")}. Implementation checks do not require a release.`,
      );
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

export { releaseCoverage };
