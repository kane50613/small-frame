import { describe, expect, test } from "bun:test";
import { BufferView } from "../src/buffer";
import { createFrameFromFields, FieldType } from "../src/index";

describe("small-frame", () => {
  describe("FieldType constants", () => {
    test("FieldType has correct values", () => {
      expect(FieldType.BigInt).toBe(1);
      expect(FieldType.Number).toBe(2);
      expect(FieldType.String).toBe(3);
      expect(FieldType.Boolean).toBe(4);
    });
  });

  describe("createFrameFromFields", () => {
    test("creates frame with single field", () => {
      const Frame = createFrameFromFields({
        name: FieldType.String,
      });

      const data = { name: "test" };
      const buffer = Frame.serialize(data);
      const result = Frame.deserialize(buffer);

      expect(result).toEqual(data);
    });

    test("creates frame with multiple fields", () => {
      const Frame = createFrameFromFields({
        name: FieldType.String,
        age: FieldType.Number,
        isAdmin: FieldType.Boolean,
      });

      const data = {
        name: "John Doe",
        age: 25,
        isAdmin: true,
      };

      const buffer = Frame.serialize(data);
      const result = Frame.deserialize(buffer);

      expect(result).toEqual(data);
    });

    test("creates frame with BigInt field", () => {
      const Frame = createFrameFromFields({
        bigNum: FieldType.BigInt,
      });

      const data = { bigNum: 1234567890123456789n };
      const buffer = Frame.serialize(data);
      const result = Frame.deserialize(buffer);

      expect(result).toEqual(data);
    });

    test("creates frame with all field types", () => {
      const Frame = createFrameFromFields({
        str: FieldType.String,
        num: FieldType.Number,
        big: FieldType.BigInt,
        bool: FieldType.Boolean,
      });

      const data = {
        str: "hello",
        num: 42,
        big: 9007199254740991n,
        bool: false,
      };

      const buffer = Frame.serialize(data);
      const result = Frame.deserialize(buffer);

      expect(result).toEqual(data);
    });

    test("maintains field order during serialization", () => {
      const Frame = createFrameFromFields({
        first: FieldType.String,
        second: FieldType.Number,
        third: FieldType.Boolean,
      });

      const data = {
        first: "a",
        second: 1,
        third: true,
      };

      const buffer = Frame.serialize(data);

      // Manually verify the buffer contents
      const view = BufferView.create(buffer);
      expect(view.readString()).toBe("a");
      expect(view.readUint32()).toBe(1);
      expect(view.readBoolean()).toBe(true);
      expect(view.isFinished).toBe(true);
    });
  });

  describe("BufferView operations", () => {
    test("writes and reads boolean", () => {
      const buffer = new ArrayBuffer(2);
      const view = BufferView.create(buffer);

      view.writeBoolean(true);
      view.writeBoolean(false);

      const newView = BufferView.create(buffer);
      expect(newView.readBoolean()).toBe(true);
      expect(newView.readBoolean()).toBe(false);
      expect(newView.isFinished).toBe(true);
    });

    test("writes and reads uint32", () => {
      const buffer = new ArrayBuffer(12);
      const view = BufferView.create(buffer);

      view.writeUint32(123456);
      view.writeUint32(0);
      view.writeUint32(4294967295); // max uint32

      const newView = BufferView.create(buffer);
      expect(newView.readUint32()).toBe(123456);
      expect(newView.readUint32()).toBe(0);
      expect(newView.readUint32()).toBe(4294967295);
      expect(newView.isFinished).toBe(true);
    });

    test("writes and reads uint64", () => {
      const buffer = new ArrayBuffer(24);
      const view = BufferView.create(buffer);

      view.writeUint64(1234567890123456789n);
      view.writeUint64(0n);
      view.writeUint64(18446744073709551615n); // max uint64

      const newView = BufferView.create(buffer);
      expect(newView.readUint64()).toBe(1234567890123456789n);
      expect(newView.readUint64()).toBe(0n);
      expect(newView.readUint64()).toBe(18446744073709551615n);
      expect(newView.isFinished).toBe(true);
    });

    test("writes and reads strings", () => {
      const buffer = new ArrayBuffer(100);
      const view = BufferView.create(buffer);

      view.writeString("hello");
      view.writeString("world");
      view.writeString(""); // empty string

      const newView = BufferView.create(view.toTypedArray());
      expect(newView.readString()).toBe("hello");
      expect(newView.readString()).toBe("world");
      expect(newView.readString()).toBe("");
      expect(newView.isFinished).toBe(true);
    });

    test("throws error for string too long", () => {
      const buffer = new ArrayBuffer(300);
      const view = BufferView.create(buffer);

      const longString = "a".repeat(256); // 256 chars, too long for uint8 length prefix
      expect(() => view.writeString(longString)).toThrow();
    });
  });

  describe("type inference", () => {
    test("infers correct types from field definitions", () => {
      const Frame = createFrameFromFields({
        name: FieldType.String,
        age: FieldType.Number,
        balance: FieldType.BigInt,
        isActive: FieldType.Boolean,
      });

      const user: typeof Frame.$type = {
        name: "John",
        age: 30,
        balance: 1000n,
        isActive: true,
      };

      // TypeScript should catch these type mismatches:
      // const invalidUser: User = {
      //   name: 123,        // Type error: number vs string
      //   age: "thirty",    // Type error: string vs number
      //   balance: 1000,    // Type error: number vs bigint
      //   isActive: "yes",  // Type error: string vs boolean
      // };

      expect(user.name).toBe("John");
      expect(user.age).toBe(30);
      expect(user.balance).toBe(1000n);
      expect(user.isActive).toBe(true);
    });
  });

  describe("error handling", () => {
    test("throws error for invalid boolean type", () => {
      const Frame = createFrameFromFields({
        flag: FieldType.Boolean,
      });

      expect(() => {
        // @ts-expect-error -- intentional invalid type to test runtime validation
        Frame.serialize({ flag: "true" });
      }).toThrow();
    });

    test("throws error for invalid number type", () => {
      const Frame = createFrameFromFields({
        count: FieldType.Number,
      });

      expect(() => {
        // @ts-expect-error -- intentional invalid type to test runtime validation
        Frame.serialize({ count: "42" });
      }).toThrow();
    });

    test("throws error for invalid bigint type", () => {
      const Frame = createFrameFromFields({
        bigNum: FieldType.BigInt,
      });

      expect(() => {
        // @ts-expect-error -- intentional invalid type to test runtime validation
        Frame.serialize({ bigNum: 42 });
      }).toThrow();
    });

    test("throws error for invalid string type", () => {
      const Frame = createFrameFromFields({
        text: FieldType.String,
      });

      expect(() => {
        // @ts-expect-error -- intentional invalid type to test runtime validation
        Frame.serialize({ text: 123 });
      }).toThrow();
    });

    test("throws error for buffer length mismatch", () => {
      const Frame = createFrameFromFields({
        name: FieldType.String,
        age: FieldType.Number,
      });

      // Create a buffer that's too short
      const shortBuffer = new ArrayBuffer(4); // Only enough for partial data

      expect(() => Frame.deserialize(shortBuffer)).toThrow();
    });
  });

  describe("README example", () => {
    test("works as shown in README", () => {
      const UserFrame = createFrameFromFields({
        name: FieldType.String,
        age: FieldType.Number,
        isAdmin: FieldType.Boolean,
      });

      const user: typeof UserFrame.$type = {
        name: "Kane",
        age: 20,
        isAdmin: false,
      };

      // Serialize to CSB format
      const buffer = UserFrame.serialize(user);

      // Deserialize from CSB format
      const user2 = UserFrame.deserialize(buffer);

      expect(user2).toEqual(user);
      expect(buffer.byteLength).toBe(10); // actual size: 1+4 + 4 + 1
    });
  });

  describe("edge cases", () => {
    test("handles empty string", () => {
      const Frame = createFrameFromFields({
        empty: FieldType.String,
      });

      const data = { empty: "" };
      const buffer = Frame.serialize(data);
      const result = Frame.deserialize(buffer);

      expect(result).toEqual(data);
    });

    test("handles zero values", () => {
      const Frame = createFrameFromFields({
        num: FieldType.Number,
        big: FieldType.BigInt,
        bool: FieldType.Boolean,
      });

      const data = {
        num: 0,
        big: 0n,
        bool: false,
      };

      const buffer = Frame.serialize(data);
      const result = Frame.deserialize(buffer);

      expect(result).toEqual(data);
    });

    test("handles maximum values", () => {
      const Frame = createFrameFromFields({
        num: FieldType.Number,
        big: FieldType.BigInt,
      });

      const data = {
        num: 4294967295, // max uint32
        big: 18446744073709551615n, // max uint64
      };

      const buffer = Frame.serialize(data);
      const result = Frame.deserialize(buffer);

      expect(result).toEqual(data);
    });

    test("handles unicode strings", () => {
      const Frame = createFrameFromFields({
        text: FieldType.String,
      });

      const data = {
        text: "Hello 🌍 こんにちは 🚀",
      };

      const buffer = Frame.serialize(data);
      const result = Frame.deserialize(buffer);

      expect(result).toEqual(data);
    });
  });
});
