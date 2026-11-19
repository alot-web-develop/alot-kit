import { expect, test } from "vitest";
import * as entry from "../src/index.js";

test("package entry loads", () => {
  expect(entry).toBeDefined();
});
