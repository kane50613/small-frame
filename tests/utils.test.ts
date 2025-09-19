import { describe, expect, test } from "bun:test";
import { calculateSerializedSize } from "../src/utils";

describe("calculateSerializedSize", () => {
  test("calculates boolean size", () => {
    expect(calculateSerializedSize(true)).toBe(1);
    expect(calculateSerializedSize(false)).toBe(1);
  });

  test("calculates number size", () => {
    expect(calculateSerializedSize(0)).toBe(4);
    expect(calculateSerializedSize(123456)).toBe(4);
    expect(calculateSerializedSize(4294967295)).toBe(4);
  });

  test("calculates bigint size", () => {
    expect(calculateSerializedSize(0n)).toBe(8);
    expect(calculateSerializedSize(1234567890123456789n)).toBe(8);
  });

  test("calculates string size", () => {
    expect(calculateSerializedSize("")).toBe(1); // 1 byte for length
    expect(calculateSerializedSize("a")).toBe(2); // 1 byte length + 1 byte content
    expect(calculateSerializedSize("hello")).toBe(6); // 1 byte length + 5 bytes content
    expect(calculateSerializedSize("🚀")).toBe(5); // 1 byte length + 4 bytes UTF-8
  });

  test("calculates object size", () => {
    const obj = {
      name: "test",
      age: 25,
      active: true,
    };
    expect(calculateSerializedSize(obj)).toBe(1 + 4 + 4 + 1); // string(1+4) + number(4) + boolean(1)
  });

  test("calculates array size", () => {
    const arr = [1, 2, 3];
    expect(calculateSerializedSize(arr)).toBe(3 * 4); // 3 numbers * 4 bytes each
  });

  test("throws error for out of range number", () => {
    expect(() => calculateSerializedSize(-1)).toThrow();
    expect(() =>
      calculateSerializedSize(Number.MAX_SAFE_INTEGER + 1),
    ).toThrow();
  });

  test("throws error for invalid type", () => {
    expect(() => {
      // @ts-expect-error -- passing null to exercise runtime error
      calculateSerializedSize(null);
    }).toThrow();
    expect(() => {
      // @ts-expect-error -- passing undefined to exercise runtime error
      calculateSerializedSize(undefined);
    }).toThrow();
    expect(() => {
      calculateSerializedSize(Symbol("test"));
    }).toThrow();
  });
});
