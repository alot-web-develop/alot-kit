import { afterEach, describe, expect, expectTypeOf, test, vi } from "vitest";
import { debounce, sleep, throttle } from "../src/async.js";
import {
  chunk,
  compact,
  groupBy,
  isDefined,
  keyBy,
  omit,
  orderBy,
  partition,
  pick,
  sortBy,
  uniqBy,
} from "../src/collections.js";

test("selected collection algorithms handle readonly input without mutation", () => {
  const rows = Object.freeze([
    { id: 1, rank: 2 },
    { id: 2, rank: 1 },
    { id: 1, rank: 1 },
  ]);
  expect(uniqBy(rows, (row) => row.id)).toEqual(rows.slice(0, 2));
  expect(keyBy(rows, (row) => row.id)[1]).toBe(rows[2]);
  expect(
    orderBy(rows, [(row) => row.rank, (row) => row.id], ["asc", "desc"]),
  ).toEqual([rows[1], rows[2], rows[0]]);
  expect(sortBy(rows, [(row) => row.rank])).toEqual([
    rows[1],
    rows[2],
    rows[0],
  ]);
  expect(chunk(rows, 2)).toEqual([rows.slice(0, 2), [rows[2]]]);
  expect(partition(rows, (row) => row.rank === 2)).toEqual([
    [rows[0]],
    rows.slice(1),
  ]);
  expect(compact([0, false, "", null, undefined, 1])).toEqual([1]);
  const defined = [0, false, "", null, undefined].filter(isDefined);
  expect(defined).toEqual([0, false, ""]);
  expectTypeOf(defined).toEqualTypeOf<(number | boolean | string)[]>();
});

test("groupBy/keyBy preserve prototype names, symbols and duplicate keys", () => {
  const symbol = Symbol("key");
  const rows = [
    { key: "__proto__" },
    { key: "constructor" },
    { key: "toString" },
    { key: "__proto__" },
    { key: symbol },
  ];
  const grouped = groupBy(rows, (row) => row.key);
  expect(Object.getPrototypeOf(grouped)).toBeNull();
  expect(Reflect.get(grouped, "__proto__")).toEqual([rows[0], rows[3]]);
  expect(grouped.constructor).toEqual([rows[1]]);
  expect(grouped[symbol]).toEqual([rows[4]]);
  const indexed = keyBy(rows, (row) => row.key);
  expect(Object.getPrototypeOf(indexed)).toBe(Object.prototype);
  expect(Object.hasOwn(indexed, "__proto__")).toBe(true);
  expect(Reflect.get(indexed, "__proto__")).toBe(rows[3]);
  expect(indexed[symbol]).toBe(rows[4]);
});

test("pick/omit are shallow and use own properties safely", () => {
  const symbol = Symbol("id");
  const object = Object.assign(
    Object.setPrototypeOf(
      JSON.parse('{"__proto__":{"x":1},"constructor":false,"keep":0}'),
      { inherited: 1 },
    ),
    { [symbol]: 2 },
  );
  const picked = pick(object, ["__proto__", "inherited", symbol]);
  expect(Object.hasOwn(picked, "__proto__")).toBe(true);
  expect(Object.hasOwn(picked, "inherited")).toBe(false);
  expect(picked[symbol]).toBe(2);
  expect(Object.getPrototypeOf(picked)).toBe(Object.prototype);
  const omitted = omit(object, ["constructor"]);
  expect(Object.hasOwn(omitted, "inherited")).toBe(false);
  expect(omitted.keep).toBe(0);
  expect(omitted[symbol]).toBe(2);
  expect(Object.getPrototypeOf(omitted)).toBe(Object.prototype);
});

describe("timing", () => {
  afterEach(() => vi.useRealTimers());

  test("debounce keeps latest arguments/this, supports flush and reusable cancel", () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const owner = {
      prefix: "q:",
      run: debounce(function (this: { prefix: string }, value: string) {
        calls.push(this.prefix + value);
      }, 20),
    };
    owner.run("a");
    owner.run("b");
    vi.advanceTimersByTime(19);
    expect(calls).toEqual([]);
    owner.run.flush();
    expect(calls).toEqual(["q:b"]);
    owner.run("cancelled");
    owner.run.cancel();
    vi.advanceTimersByTime(20);
    expect(calls).toEqual(["q:b"]);
    owner.run("again");
    vi.advanceTimersByTime(20);
    expect(calls).toEqual(["q:b", "q:again"]);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("debounce abort discards pending calls and prevents future calls", () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const callback = vi.fn();
    const run = debounce(callback, 20, { signal: controller.signal });
    run();
    controller.abort();
    run();
    vi.advanceTimersByTime(20);
    expect(callback).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("throttle uses leading/trailing calls and supports cancel/flush", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const run = throttle(callback, 20);
    run("first");
    run("last");
    expect(callback.mock.calls).toEqual([["first"]]);
    run.flush();
    expect(callback.mock.calls).toEqual([["first"], ["last"]]);
    run("cancelled");
    run.cancel();
    vi.advanceTimersByTime(20);
    expect(callback.mock.calls).toEqual([["first"], ["last"]]);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("sleep resolves and removes its abort listener", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");
    const pending = sleep(20, controller.signal);
    await vi.advanceTimersByTimeAsync(20);
    await expect(pending).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });

  test("sleep rejects with abort reason and clears timers/listeners", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");
    const pending = sleep(20, controller.signal);
    const assertion = expect(pending).rejects.toBe("stop");
    controller.abort("stop");
    await assertion;
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
    await expect(sleep(20, controller.signal)).rejects.toBe("stop");
    expect(vi.getTimerCount()).toBe(0);
  });

  test.each([-1, NaN, Infinity, 2_147_483_648])(
    "rejects invalid delay: %s",
    (delay) => {
      expect(() => sleep(delay)).toThrow(RangeError);
    },
  );
});
