import { describe, expect, test } from "vitest";
import { buildTokens } from "../src/names.js";

describe("buildTokens", () => {
  test("derives every case", () => {
    const tokens = buildTokens({
      name: "OrderItem",
      feature: "orders",
      entity: "Order",
    });
    expect(tokens).toMatchObject({
      __Name__: "OrderItem",
      __name__: "orderItem",
      "__name-kebab__": "order-item",
      __NAME__: "ORDER_ITEM",
      __Names__: "OrderItems",
      __names__: "orderItems",
      "__names-kebab__": "order-items",
      __feature__: "orders",
      __Entity__: "Order",
      __entity__: "order",
    });
  });

  test("pluralizes y, s and honours --plural", () => {
    expect(buildTokens({ name: "Category" }).__Names__).toBe("Categories");
    expect(buildTokens({ name: "Address" }).__Names__).toBe("Addresses");
    expect(buildTokens({ name: "Fattura", plural: "Fatture" }).__Names__).toBe(
      "Fatture",
    );
  });

  test("accepts camelCase util names", () => {
    expect(buildTokens({ name: "formatOrderCode" }).__Name__).toBe(
      "FormatOrderCode",
    );
  });

  test.each(["", "1abc", "../x", "a/b", "a b", "a;b", "Ord$er"])(
    "rejects name %j",
    (name) => {
      expect(() => buildTokens({ name })).toThrow(/invalid name/);
    },
  );

  test("rejects invalid feature, entity and plural", () => {
    expect(() => buildTokens({ name: "A", feature: "../x" })).toThrow(
      /--feature/,
    );
    expect(() => buildTokens({ name: "A", entity: "order" })).toThrow(
      /--entity/,
    );
    expect(() => buildTokens({ name: "A", plural: "a/b" })).toThrow(/--plural/);
  });
});
