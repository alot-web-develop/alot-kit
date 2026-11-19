import { describe, expect, test, vi } from "vitest";
import {
  createFilePreview,
  getFileExtension,
  matchesFileAccept,
  toFormData,
  validateFile,
  validateFiles,
} from "../src/files.js";
import { formatBytes, formatPercent } from "../src/format.js";

describe("file metadata", () => {
  test.each([
    ["report.PDF", "pdf"],
    ["archive.tar.gz", "gz"],
    [".env", ""],
    ["name.", ""],
    ["name", ""],
    [".config.JSON", "json"],
    ["dir.with.dots/noext", ""],
    ["C:\\dir\\file.PNG", "png"],
  ])("extracts the last lowercase extension: %s", (name, extension) => {
    expect(getFileExtension(name)).toBe(extension);
  });

  test("matches accept alternatives without inferring MIME from extensions", () => {
    const file = { name: "Photo.PNG", type: "image/png" };
    expect(matchesFileAccept(file, " .pdf, IMAGE/* ")).toBe(true);
    expect(matchesFileAccept(file, [".PNG"])).toBe(true);
    expect(matchesFileAccept(file, "image/png")).toBe(true);
    expect(matchesFileAccept(file, "application/pdf")).toBe(false);
    expect(matchesFileAccept(file, "")).toBe(true);
    expect(matchesFileAccept({ name: "photo.png", type: "" }, "image/*")).toBe(
      false,
    );
    expect(matchesFileAccept({ name: "photo.png", type: "" }, ".png")).toBe(
      true,
    );
    expect(matchesFileAccept({ name: "photo.png.exe", type: "" }, ".png")).toBe(
      false,
    );
    expect(
      matchesFileAccept({ name: "archive.tar.GZ", type: "" }, ".tar.gz"),
    ).toBe(true);
    expect(() => matchesFileAccept(file, "png")).toThrow(RangeError);
  });

  test("validates size/type/count with inclusive limits and structured indexed issues", () => {
    const files = [
      new File(["1234"], "good.txt", { type: "text/plain" }),
      new File(["12345"], "bad.png", { type: "image/png" }),
    ];
    expect(
      validateFile(files[0], { minSize: 4, maxSize: 4, accept: ".txt" }),
    ).toEqual({ valid: true, issues: [] });
    expect(validateFile(new File([], "zero.txt"), { maxSize: 0 }).valid).toBe(
      true,
    );
    expect(
      validateFiles(files, { maxFiles: 1, maxSize: 4, accept: "text/plain" }),
    ).toEqual({
      valid: false,
      issues: [
        { code: "too_many", limit: 1 },
        { code: "too_large", limit: 4, fileIndex: 1 },
        { code: "invalid_type", fileIndex: 1 },
      ],
    });
    expect(validateFile({ name: "x", type: "", size: -1 }).issues).toEqual([
      { code: "invalid_size" },
    ]);
    expect(validateFile(files[0], { minSize: 5 }).issues).toEqual([
      { code: "too_small", limit: 5 },
    ]);
    expect(validateFiles([], { maxFiles: 0 }).valid).toBe(true);
    expect(validateFiles(files, { maxFiles: 0 }).valid).toBe(false);
  });

  test("validates rules even for an empty list", () => {
    expect(() => validateFiles([], { minSize: 2, maxSize: 1 })).toThrow(
      RangeError,
    );
    expect(() => validateFiles([], { maxFiles: -1 })).toThrow(RangeError);
    expect(() => validateFiles([], { maxSize: Infinity })).toThrow(RangeError);
    expect(() => validateFiles([], { minSize: 0.5 })).toThrow(RangeError);
    expect(() => validateFiles([], { accept: "*" })).toThrow(RangeError);
  });
});

describe("FormData and previews", () => {
  test("preserves scalars, repeated fields, file names and bytes; skips nullish values", async () => {
    const file = new File([new Uint8Array([0, 1, 255])], "photo.png", {
      type: "image/png",
    });
    const fields = Object.freeze({
      page: 0,
      active: false,
      empty: "",
      tags: Object.freeze(["a", null, "b"]),
      file,
      omitted: undefined,
      absent: null,
      nothing: [],
    });
    const form = toFormData(fields);
    expect(form.get("page")).toBe("0");
    expect(form.get("active")).toBe("false");
    expect(form.get("empty")).toBe("");
    expect(form.getAll("tags")).toEqual(["a", "b"]);
    expect(form.has("omitted")).toBe(false);
    expect(form.has("absent")).toBe(false);
    expect(form.has("nothing")).toBe(false);
    const uploaded = form.get("file") as File;
    expect(uploaded.name).toBe("photo.png");
    expect(uploaded.type).toBe("image/png");
    expect(new Uint8Array(await uploaded.arrayBuffer())).toEqual(
      new Uint8Array([0, 1, 255]),
    );
    expect(form.get("file")).toBe(file);
  });

  test("uses native multipart boundary and preserves multiple binary fields", async () => {
    const form = toFormData({
      files: [
        new File(["a"], "a.txt"),
        new Blob(["b"], { type: "text/plain" }),
      ],
    });
    const request = new Request("https://example.test/upload", {
      method: "POST",
      body: form,
    });
    expect(request.headers.get("Content-Type")).toMatch(
      /^multipart\/form-data; boundary=/,
    );
    const decoded = await request.formData();
    expect(decoded.getAll("files")).toHaveLength(2);
    expect((decoded.getAll("files")[0] as File).name).toBe("a.txt");
    expect(await (decoded.getAll("files")[1] as File).text()).toBe("b");
    expect(() =>
      Reflect.apply(toFormData, undefined, [{ object: { nested: true } }]),
    ).toThrow(TypeError);
    expect(() => toFormData({ size: NaN })).toThrow(RangeError);
  });

  test("FormData ignores inherited entries and retains prototype-named fields", () => {
    const fields = Object.setPrototypeOf(
      JSON.parse('{"__proto__":"data","constructor":false}'),
      { inherited: "drop" },
    );
    const form = toFormData(fields);
    expect(form.get("__proto__")).toBe("data");
    expect(form.get("constructor")).toBe("false");
    expect(form.has("inherited")).toBe(false);
  });

  test("previews release exactly their own object URL once", () => {
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test");
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    try {
      const blob = new Blob(["preview"]);
      const preview = createFilePreview(blob);
      expect(create).toHaveBeenCalledWith(blob);
      expect(preview.url).toBe("blob:test");
      preview.revoke();
      preview.revoke();
      expect(revoke).toHaveBeenCalledExactlyOnceWith("blob:test");
    } finally {
      create.mockRestore();
      revoke.mockRestore();
    }
  });

  test("reports missing preview capability only when invoked", () => {
    const create = vi.spyOn(URL, "createObjectURL");
    try {
      Object.defineProperty(URL, "createObjectURL", {
        value: undefined,
        configurable: true,
      });
      expect(() => createFilePreview(new Blob())).toThrow(
        "Object URLs are unavailable",
      );
    } finally {
      create.mockRestore();
    }
  });
});

test("formats bytes with explicit IEC/SI units and Intl locale", () => {
  expect(formatBytes(0, { locale: "en" })).toBe("0 B");
  expect(formatBytes(1024, { locale: "en" })).toBe("1 KiB");
  expect(formatBytes(1500, { base: 1000, locale: "it" })).toBe("1,5 kB");
  expect(formatBytes(0.5, { locale: "en" })).toBe("0.5 B");
  expect(formatBytes(1536, { locale: "en", maximumFractionDigits: 0 })).toBe(
    "2 KiB",
  );
  for (const value of [-1, NaN, Infinity])
    expect(() => formatBytes(value)).toThrow(RangeError);
  expect(() => formatBytes(1, { maximumFractionDigits: -1 })).toThrow(
    RangeError,
  );
});

test("formats percent fractions with authoritative percent style", () => {
  expect(formatPercent(0.25, "en")).toBe("25%");
  expect(formatPercent(0, "en")).toBe("0%");
  expect(formatPercent(0.1234, "en", { maximumFractionDigits: 1 })).toBe(
    "12.3%",
  );
  expect(() => formatPercent(Infinity)).toThrow(RangeError);
  expect(
    Reflect.apply(formatPercent, undefined, [
      0.25,
      "en",
      { style: "currency", currency: "EUR" },
    ]),
  ).toBe("25%");
});
