import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { runCli } from "../src/run.js";

interface TResult {
  code: number;
  out: string[];
  err: string[];
}

let dir = "";
const gen = (argv: string[], cwd = dir): TResult => {
  const out: string[] = [];
  const err: string[] = [];
  const code = runCli(argv, {
    cwd,
    out: (l) => out.push(l),
    err: (l) => err.push(l),
  });
  return { code, out, err };
};
const config = (value: object): void =>
  writeFileSync(join(dir, "alot.config.json"), JSON.stringify(value));
const read = (path: string): string => readFileSync(join(dir, path), "utf8");
const fastify = (db = "mongodb-native"): void =>
  config({ framework: "fastify", role: "api", db, schema: "zod" });

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "alot-gen-test-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("help, list, config", () => {
  test("help works without a config", () => {
    const result = gen(["--help"]);
    expect(result.code).toBe(0);
    expect(result.out[0]).toMatch(/Usage/);
  });

  test("list shows the kinds of the config framework", () => {
    fastify();
    const result = gen(["list"]);
    expect(result.code).toBe(0);
    expect(result.out.join("\n")).toMatch(/^resource\s/m);
    expect(result.out.join("\n")).not.toMatch(/^page\s/m);
  });

  test("missing or invalid config is an error", () => {
    expect(gen(["list"]).err[0]).toMatch(/alot.config.json not found/);
    writeFileSync(join(dir, "alot.config.json"), "{");
    expect(gen(["list"]).err[0]).toMatch(/not valid JSON/);
    config({ framework: "fastify", schema: "typebox" });
    expect(gen(["list"]).err[0]).toMatch(/only zod/);
  });
});

describe("generation", () => {
  test("creates files, expands placeholders and is non-destructive", () => {
    fastify();
    expect(gen(["server-entry", "App"]).code).toBe(0);
    const first = gen(["resource", "OrderItem"]);
    expect(first.code).toBe(0);
    expect(first.out).toContain("created src/routes/order-items.ts");
    expect(read("src/routes/order-items.ts")).not.toMatch(/__[A-Za-z]+__/);
    writeFileSync(join(dir, "src/routes/order-items.ts"), "custom");
    const second = gen(["resource", "OrderItem"]);
    expect(second.out).toContain("skip (exists) src/routes/order-items.ts");
    expect(read("src/routes/order-items.ts")).toBe("custom");
    gen(["resource", "OrderItem", "--force"]);
    expect(read("src/routes/order-items.ts")).not.toBe("custom");
  });

  test("dry-run writes nothing", () => {
    fastify();
    const result = gen(["resource", "Order", "--dry-run"]);
    expect(result.out[0]).toMatch(/^would create/);
    expect(existsSync(join(dir, "src"))).toBe(false);
  });

  test("selects the db variant from the config", () => {
    fastify("mongoose");
    gen(["model", "Customer"]);
    expect(read("src/models/customer.ts")).toMatch(/mongoose/);
  });

  test("wiring is applied once and chains across resources", () => {
    fastify();
    gen(["server-entry", "App"]);
    gen(["db", "App"]);
    gen(["resource", "Order"]);
    gen(["resource", "Order", "--force"]);
    gen(["resource", "Invoice"]);
    const routes = read("src/routes/protected.ts");
    expect(routes.match(/orderRoutes, \{/g)).toHaveLength(1);
    expect(routes.match(/import \{ orderRoutes \}/g)).toHaveLength(1);
    expect(routes).toMatch(/invoiceRoutes, \{/);
    const models = read("src/models/index.ts");
    expect(models.match(/ensureOrderIndexes/g)).toHaveLength(2);
    expect(models).toMatch(/ensureInvoiceIndexes/);
  });

  test("missing wire target reports a todo and keeps going", () => {
    fastify();
    const result = gen(["resource", "Order"]);
    expect(result.code).toBe(0);
    expect(result.out.some((l) => l.startsWith("todo wire"))).toBe(true);
  });

  test("persist flag selects the persisted store", () => {
    config({ framework: "react-native", role: "app" });
    expect(gen(["store", "Cart", "--feature", "cart"]).code).toBe(0);
    const plain = read("src/features/cart/store/useCartStore.ts");
    rmSync(join(dir, "src"), { recursive: true });
    gen(["store", "Cart", "--feature", "cart", "--persist"]);
    expect(read("src/features/cart/store/useCartStore.ts")).not.toBe(plain);
  });

  test("react variants", () => {
    config({ framework: "react", role: "app" });
    expect(
      gen(["store", "Cart", "--feature", "cart", "--variant", "persist"]).code,
    ).toBe(0);
    expect(
      gen(["store", "Cart", "--variant", "nope", "--feature", "cart"]).err[0],
    ).toMatch(/unknown variant/);
  });
});

describe("validation", () => {
  test("canonical form and hook names preserve existing application logic", () => {
    config({ framework: "react", role: "app" });
    expect(gen(["form", "RecipeForm", "--feature", "recipes"]).code).toBe(0);
    expect(read("src/features/recipes/components/RecipeForm.tsx")).toContain(
      "const RecipeForm =",
    );
    expect(
      gen(["form", "recipe-form", "--feature", "recipes"]).out[0],
    ).toContain("skip (exists)");
    expect(
      existsSync(
        join(dir, "src/features/recipes/components/RecipeFormForm.tsx"),
      ),
    ).toBe(false);
    const hook = ["hook", "usePhotoUploads", "--feature", "photos"];
    expect(gen(hook).code).toBe(0);
    const file = "src/features/photos/hooks/usePhotoUploads.ts";
    expect(read(file)).toContain("const usePhotoUploads =");
    writeFileSync(join(dir, file), "domain implementation");
    expect(
      gen(["hook", "PhotoUploads", "--feature", "photos"]).out[0],
    ).toContain("skip (exists)");
    expect(read(file)).toBe("domain implementation");
    expect(
      gen(["hook", "use-photo-uploads", "--feature", "photos"]).out[0],
    ).toContain("skip (exists)");
  });

  test("parent resources generate scoped collections and keep globally addressed details", () => {
    config({ framework: "react", role: "app" });
    for (const kind of ["service", "query-keys", "query", "mutation"]) {
      expect(gen([kind, "Variant", "--parent", "Recipe"]).code).toBe(0);
    }
    expect(read("src/api/services/variant.ts")).toContain(
      "encodeURIComponent(recipeId)",
    );
    expect(read("src/api/services/variant.ts")).toContain(
      "const BASE = '/variants'",
    );
    expect(read("src/api/queries/useListVariants.ts")).toContain(
      "variantKeys.list(recipeId, query)",
    );
    expect(read("src/api/queries/useGetVariant.ts")).toContain(
      "variantKeys.detail(id)",
    );
    expect(read("src/api/mutations/useCreateVariant.ts")).toContain(
      "variantKeys.scope(recipeId)",
    );
    expect(read("src/api/mutations/useUpdateVariant.ts")).toContain(
      "variantKeys.lists()",
    );
  });

  test("parent is validated before any writes and unsupported kinds reject it", () => {
    config({ framework: "react", role: "app" });
    expect(gen(["service", "Variant", "--parent", "../Recipe"]).err[0]).toMatch(
      /--parent/,
    );
    expect(existsSync(join(dir, "src"))).toBe(false);
    expect(
      gen(["form", "Recipe", "--feature", "recipes", "--parent", "Account"])
        .err[0],
    ).toMatch(/does not support --parent/);
    fastify();
    expect(gen(["resource", "Variant", "--parent", "Recipe"]).err[0]).toMatch(
      /does not support --parent/,
    );
  });

  test.each([
    [["nope", "Order"], /unknown kind/],
    [["../x", "Order"], /unknown kind/],
    [["resource", "../evil"], /invalid name/],
    [["resource", "/abs"], /invalid name/],
    [["resource", "Order", "--bogus"], /unknown flag/],
    [["resource", "Order", "--feature"], /requires a value/],
    [["resource", "Order", "--persist"], /does not support --persist/],
    [["resource", "Order", "--variant", "x"], /unknown variant/],
    [["resource", "Order", "--feature", "a/b"], /--feature/],
    [["resource"], /usage/],
  ])("rejects %j", (argv, message) => {
    fastify();
    const result = gen(argv);
    expect(result.code).toBe(1);
    expect(result.err[0]).toMatch(message);
    expect(existsSync(join(dir, "src"))).toBe(false);
  });

  test("role mismatch", () => {
    config({ framework: "react", role: "app" });
    const result = gen(["primitive", "Chip"]);
    expect(result.code).toBe(1);
    expect(result.err[0]).toMatch(/not available for role/);
  });

  test("required feature and entity", () => {
    config({ framework: "react", role: "app" });
    expect(gen(["page", "Order"]).err[0]).toMatch(/requires --feature/);
    expect(
      gen(["subcomponent", "OrderSummary", "--feature", "orders"]).err[0],
    ).toMatch(/requires --entity/);
  });

  test("configured paths cannot leave the project", () => {
    config({
      framework: "fastify",
      role: "api",
      paths: { schemas: "../outside" },
    });
    const result = gen(["schema", "Order"]);
    expect(result.code).toBe(1);
    expect(result.err[0]).toMatch(/unsafe destination/);
    config({ framework: "fastify", role: "api", paths: { schemas: "/tmp/x" } });
    expect(gen(["schema", "Order"]).err[0]).toMatch(/unsafe destination/);
  });

  test("symlinks escaping the project are refused before any write", () => {
    fastify();
    const outside = mkdtempSync(join(tmpdir(), "alot-gen-outside-"));
    try {
      mkdirSync(join(dir, "src"), { recursive: true });
      symlinkSync(outside, join(dir, "src/models"));
      const result = gen(["resource", "Order"]);
      expect(result.code).toBe(1);
      expect(result.err[0]).toMatch(/escapes the project/);
      expect(existsSync(join(dir, "src/schemas"))).toBe(false);
      expect(existsSync(join(outside, "order.ts"))).toBe(false);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  test("a symlinked destination file is refused", () => {
    fastify();
    const outside = mkdtempSync(join(tmpdir(), "alot-gen-outside-"));
    try {
      writeFileSync(join(outside, "target.ts"), "keep");
      mkdirSync(join(dir, "src/schemas"), { recursive: true });
      symlinkSync(
        join(outside, "target.ts"),
        join(dir, "src/schemas/order.ts"),
      );
      const result = gen(["schema", "Order", "--force"]);
      expect(result.code).toBe(1);
      expect(readFileSync(join(outside, "target.ts"), "utf8")).toBe("keep");
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });
});

describe("fastify modules", () => {
  test("identity drives init output and ambiguous resource plurals require an explicit choice", () => {
    config({
      framework: "fastify",
      identity: { name: "acme-portal", title: "Acme Portal" },
    });
    expect(gen(["env", "App"]).code).toBe(0);
    expect(gen(["server-entry", "App"]).code).toBe(0);
    expect(read(".env.example")).toContain("/acme-portal");
    expect(read("src/app.ts")).toContain("Acme Portal API");
    expect(gen(["resource", "Contacts"]).err[0]).toMatch(/singular base name/);
    expect(gen(["resource", "Status"]).code).toBe(0);
    expect(gen(["resource", "Contacts", "--plural", "Contacts"]).code).toBe(0);
  });
  const generate = (modules?: unknown): void => {
    config({
      framework: "fastify",
      role: "api",
      db: "mongodb-native",
      schema: "zod",
      ...(modules === undefined ? {} : { modules }),
    });
    for (const kind of ["env", "auth"]) {
      expect(gen([kind, "App"]).code).toBe(0);
    }
  };
  const output = (): string =>
    [
      read("src/config/env.ts"),
      read(".env.example"),
      read("src/lib/auth.ts"),
    ].join("\n");

  test("absent modules key enables both and matches explicit modules", () => {
    generate();
    const absent = output();
    expect(absent).toMatch(/@better-auth\/expo/);
    expect(absent).toMatch(/MOBILE_APP_SCHEME/);
    expect(absent).toMatch(/R2_BUCKET/);
    rmSync(join(dir, "src"), { recursive: true });
    rmSync(join(dir, ".env.example"));
    generate(["mobile", "uploads"]);
    expect(output()).toBe(absent);
  });

  test("empty modules emits no mobile or uploads options", () => {
    generate([]);
    expect(output()).not.toMatch(
      /better-auth\/expo|expo\(\)|MOBILE_APP_SCHEME|R2_|optionalString/,
    );
    expect(read("src/config/env.ts")).not.toMatch(/blankToUndefined/);
  });

  test("each module is selected independently", () => {
    generate(["mobile"]);
    expect(output()).toMatch(/MOBILE_APP_SCHEME/);
    expect(output()).not.toMatch(/R2_/);
    rmSync(join(dir, "src"), { recursive: true });
    rmSync(join(dir, ".env.example"));
    generate(["uploads"]);
    expect(output()).toMatch(/R2_BUCKET/);
    expect(output()).not.toMatch(
      /better-auth\/expo|expo\(\)|MOBILE_APP_SCHEME/,
    );
  });

  test("unknown or malformed modules are rejected", () => {
    config({ framework: "fastify", modules: ["mobile", "push"] });
    expect(gen(["list"]).err[0]).toMatch(/unknown: push/);
    config({ framework: "fastify", modules: "mobile" });
    expect(gen(["list"]).err[0]).toMatch(/must be an array/);
  });
});

describe("snippets", () => {
  test("writes valid snippet JSON once", () => {
    fastify();
    expect(gen(["snippets"]).code).toBe(0);
    const snippets: Record<string, { body: string[]; prefix: string }> =
      JSON.parse(read(".vscode/alot.code-snippets"));
    const resource = snippets["alot-fastify-resource"];
    expect(resource?.body.join("\n")).toMatch(/\$\{1:\$\{TM_FILENAME_BASE\}\}/);
    expect(gen(["snippets"]).out[0]).toMatch(/skip \(exists\)/);
    expect(gen(["snippets", "--dry-run", "--force"]).out[0]).toMatch(
      /would create/,
    );
  });
});
